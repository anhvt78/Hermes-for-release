"""Auth-gate middleware for the dashboard.

Engaged when ``app.state.auth_required is True``; a no-op otherwise (loopback
mode is handled by the legacy ``_SESSION_TOKEN`` ``auth_middleware``). Allows
the auth-bootstrap routes and static assets through unauthenticated; for
everything else demands a bearer token or a valid session cookie and attaches
the verified :class:`Session` to ``request.state.session``. HTML routes are
redirected to ``/login``; ``/api/*`` routes get a 401 JSON envelope.
"""
from __future__ import annotations

import logging
from typing import Awaitable, Callable
from urllib.parse import quote

from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse, Response
from starlette.concurrency import run_in_threadpool

from hermes_cli.dashboard_auth import list_session_providers
from hermes_cli.dashboard_auth.audit import AuditEvent, audit_log
from hermes_cli.dashboard_auth.base import ProviderError
from hermes_cli.dashboard_auth.cookies import (
    clear_session_cookies, clear_sso_attempt_cookie, detect_https, read_session_cookies,
    read_session_provider, read_sso_attempt_cookie, set_session_cookies,
    set_session_provider_cookie, set_sso_attempt_cookie)
from hermes_cli.dashboard_auth.prefix import prefix_from_request
from hermes_cli.dashboard_auth.public_paths import PUBLIC_API_PATHS, is_public_api_path
from hermes_cli.dashboard_auth.refresh_singleflight import refresh_session_coalesced
from hermes_cli.dashboard_auth.request_utils import (
    access_token_max_age as _expires_in_seconds, client_ip as _client_ip,
    extract_bearer as _extract_bearer, is_safe_next_path, scan_session_providers,
    unreachable_response)

_log = logging.getLogger(__name__)

# Prefix-matched bypass list: auth bootstrap routes and static asset mounts. ``/assets/`` with
# the trailing slash matches ``/assets/foo.css`` but not ``/assetsleak``.
_GATE_PUBLIC_PREFIXES: tuple[str, ...] = (
    "/auth/login", "/auth/callback", "/auth/native/authorize", "/auth/native/token",
    "/auth/native/refresh", "/auth/password-login", "/auth/logout", "/login",
    "/api/auth/providers", "/api/mcp/oauth/callback/",
    "/assets/", "/dashboard-plugins/", "/favicon.ico", "/ds-assets/", "/fonts/", "/fonts-terminal/")


def _path_is_public(path: str) -> bool:
    """:data:`PUBLIC_API_PATHS` (shared with the legacy middleware) matched exactly so
    ``/api/status`` never exposes ``/api/status/extension``; :data:`_GATE_PUBLIC_PREFIXES`
    prefix-matched. Path-only form (used by the body-limit middleware)."""
    return path in PUBLIC_API_PATHS or any(
        path == p or path.startswith(p) for p in _GATE_PUBLIC_PREFIXES)


def _request_is_public(request: Request) -> bool:
    """Hermes+: :func:`is_public_api_path` (seam: :data:`PUBLIC_API_PATHS` exact match + hermes-poclip customer-portal,
    auth-bootstrap, valid poclip-session deferral and the API-3D contract group) or a :data:`_GATE_PUBLIC_PREFIXES`
    prefix match. Used by the auth gate, which has the whole request."""
    path = request.url.path
    if is_public_api_path(path, request):
        return True
    return any(path == p or path.startswith(p) for p in _GATE_PUBLIC_PREFIXES)


def _safe_next_target(request: Request) -> str:
    """URL-encoded ``next`` value for the login redirect, or ``""``. Only same-origin paths outside
    the auth flow and ``/api`` are kept (query preserved); dropped deep links fall back to the
    SPA's ``sessionStorage["hermes.lastLocation"]``.

    Behind a reverse proxy at a sub-path (``X-Forwarded-Prefix``, e.g. ``/hermes``), the prefix
    is prepended AFTER validation so the post-login redirect lands within the mount
    (``/hermes/sessions`` rather than bare ``/sessions``)."""
    path = request.url.path
    if not path or not is_safe_next_path(path):
        return ""
    prefix = prefix_from_request(request)
    if prefix:
        path = prefix + path
    query = request.url.query
    return quote(f"{path}?{query}" if query else path, safe="")


def _unauth_response(request: Request, *, reason: str) -> Response:
    """API routes -> 401 JSON with ``login_url``; HTML routes -> 302 -> /login. fetch() follows a
    302 opaquely into the cross-origin OAuth dance, so API routes never get redirects; the SPA's
    401 handler navigates to ``login_url`` on ``unauthenticated`` / ``session_expired``."""
    from hermes_cli.dashboard_auth.public_paths import (
        is_poclip_ui_page_path,
        is_unknown_poclip_api3d_path,
        poclip_api3d_not_found_body,
    )

    path = request.url.path
    # Hermes+: đường sai trong /api/v1 khi gate poclip đã trang bị → 404 ENDPOINT_NOT_FOUND (không phải 401 mơ hồ).
    if is_unknown_poclip_api3d_path(path):
        return JSONResponse(poclip_api3d_not_found_body(path), status_code=404)
    next_param = _safe_next_target(request)
    prefix = prefix_from_request(request)
    # Hermes+: trang giao diện poclip có trang đăng nhập riêng (/poclip-login), không dùng /login chung.
    login_page = "/poclip-login" if is_poclip_ui_page_path(path) else "/login"
    login_url = f"{prefix}{login_page}?next={next_param}" if next_param else f"{prefix}{login_page}"
    if request.url.path.startswith("/api/"):
        expired = reason == "invalid_or_expired_session"
        # Same reason the client already receives. Never include the bearer.
        audit_log(AuditEvent.SESSION_REJECTED, reason=reason, path=request.url.path,
                  ip=_client_ip(request))
        return JSONResponse(
            {"error": "session_expired" if expired else "unauthenticated", "detail": "Unauthorized",
             "reason": reason, "login_url": login_url}, status_code=401)
    return RedirectResponse(url=login_url, status_code=302)


def _auto_sso_response(request: Request) -> Response | None:
    """302 straight to ``/auth/login`` on an unauthenticated HTML load, or ``None``.

    Only for a document load (not ``/api/*``) when exactly one interactive OAuth-style provider is
    registered (a password provider must render the form) and the one-shot loop-guard cookie is
    absent — a present marker means the portal had no session last time: clear it and fall back
    to ``/login`` rather than ping-pong. Convenience, not a security check.
    """
    if request.url.path.startswith("/api/"):
        return None
    # Hermes+: trang UI poclip không tự chuyển sang OAuth — trang đăng nhập poclip riêng sẽ hiển thị.
    from hermes_cli.dashboard_auth.public_paths import is_poclip_ui_page_path
    if is_poclip_ui_page_path(request.url.path):
        return None
    if read_sso_attempt_cookie(request):
        resp = _unauth_response(request, reason="no_cookie")
        clear_sso_attempt_cookie(resp, prefix=prefix_from_request(request))
        return resp
    providers = list_session_providers()
    if len(providers) != 1 or getattr(providers[0], "supports_password", False):
        return None
    provider = providers[0]
    prefix = prefix_from_request(request)
    next_param = _safe_next_target(request)
    auth_login = f"{prefix}/auth/login?provider={quote(provider.name, safe='')}"
    if next_param:
        auth_login = f"{auth_login}&next={next_param}"
    resp = RedirectResponse(url=auth_login, status_code=302)
    set_sso_attempt_cookie(resp, use_https=detect_https(request), prefix=prefix)
    audit_log(AuditEvent.LOGIN_START, provider=provider.name, reason="auto_sso",
              ip=_client_ip(request))
    return resp


def _verify_access_token(
    request: Request, *, access_token: str, provider_hint: str | None = None, audit: bool = True):
    """Run ``verify_session`` across the provider stack; Session or ``None``. ``audit=False`` is
    the native-app bearer path (no cookie, no server-side refresh — the desktop rotates via
    ``/auth/native/refresh``); 503-on-outage semantics come from :func:`scan_session_providers`."""
    def _audit_unreachable(provider):
        if audit:
            audit_log(AuditEvent.SESSION_VERIFY_FAILURE, provider=provider.name,
                      reason="provider_unreachable", ip=_client_ip(request))

    return scan_session_providers(
        provider_hint, lambda p: p.verify_session(access_token=access_token),
        phase="verify" if audit else "bearer verify", log=_log, on_unreachable=_audit_unreachable)


async def _serve_refreshed(request: Request, call_next, new_session, provider: str) -> Response:
    """Serve the request under a just-rotated session and write the rotated cookies back. Writing
    the ROTATED RT is mandatory: Portal runs reuse detection, so replaying the stale RT would
    revoke the session."""
    request.state.session = new_session
    response = await call_next(request)
    set_session_cookies(
        response, access_token=new_session.access_token, refresh_token=new_session.refresh_token,
        access_token_expires_in=_expires_in_seconds(new_session), use_https=detect_https(request),
        prefix=prefix_from_request(request), provider=provider)
    audit_log(AuditEvent.REFRESH_SUCCESS, provider=provider, user_id=new_session.user_id,
              ip=_client_ip(request))
    return response


def _session_expired_response(request: Request) -> Response:
    """Refresh failed (or no RT): structured 401/redirect and clear the dead cookies under the
    active prefix so the deletion Path matches the set Path."""
    audit_log(AuditEvent.SESSION_VERIFY_FAILURE, reason="no_provider_recognises",
              ip=_client_ip(request))
    response = _unauth_response(request, reason="invalid_or_expired_session")
    clear_session_cookies(response, prefix=prefix_from_request(request))
    return response


def _poclip_scoped_response(request: Request) -> Response:
    """403 domain (không kèm login_url) cho các endpoint bootstrap khung dashboard.

    Tài khoản con poclip dùng chung khung SPA nhưng không có dữ liệu hệ thống — 401 kèm login_url sẽ đẩy SPA về
    /login; 403 domain không kèm login_url giúp SPA nhận diện đây là lỗi quyền truy cập và tiếp tục render khung.
    """
    return JSONResponse(
        {
            "detail": {
                "error": "AccessDenied",
                "code": "ERR-RBAC-403",
                "reason": "poclip_session_scoped",
                "message_vi": "Tài khoản poclip không có quyền truy cập phần này của bảng điều khiển.",
                "message_en": "Poclip account is not allowed to access this part of the dashboard.",
            }
        },
        status_code=403,
    )


def _attach_poclip_bridge(request) -> dict | None:
    """Lazy-import bridge, best-effort, nuốt mọi exception."""
    try:
        from hermes_poclip.auth.dashboard_bridge import bridge_dashboard_session
        return bridge_dashboard_session(request)
    except Exception:
        return None


def _set_poclip_bridge_cookie(response, bridged) -> None:
    """Gắn cookie poclip_session từ kết quả bridge. Best-effort."""
    try:
        response.set_cookie(
            "poclip_session",
            value=bridged["token"],
            path="/",
            httponly=True,
            samesite="lax",
            max_age=int(bridged["max_age"]),
        )
    except Exception:
        pass


async def gated_auth_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Engaged only when ``app.state.auth_required is True``."""
    if not getattr(request.app.state, "auth_required", False):
        return await call_next(request)
    # Already authenticated by the token-auth seam (service caller on a registered token
    # route): not a cookie session, must not bounce to /login.
    if getattr(request.state, "token_authenticated", False) or _request_is_public(request):
        return await call_next(request)
    # RFC 8252 native-app bearer path: the same provider-minted access token the cookie flow
    # stores, verified with the same provider stack, no cookie read or set. A presented-but-
    # invalid bearer gets the structured 401 so the desktop refreshes/re-logs instead of
    # following a cookie redirect.
    bearer = _extract_bearer(request)
    if bearer:
        try:
            bearer_session = _verify_access_token(request, access_token=bearer, audit=False)
        except ProviderError as e:
            return unreachable_response(str(e))
        if bearer_session is not None:
            request.state.session = bearer_session
            return await call_next(request)
        return _unauth_response(request, reason="invalid_or_expired_session")

    at, _rt = read_session_cookies(request)
    provider_hint = read_session_provider(request)
    if not at and not _rt:
        # Hermes+: tài khoản con poclip dùng chung khung SPA nhưng không có dữ liệu hệ thống → 403 domain (không kèm login_url).
        from hermes_cli.dashboard_auth.public_paths import (
            has_valid_poclip_session, is_poclip_shell_scoped_path)
        if has_valid_poclip_session(request) and is_poclip_shell_scoped_path(request.url.path):
            return _poclip_scoped_response(request)
        # No session at all: try the silent portal bounce before /login.
        auto = _auto_sso_response(request)
        return auto if auto is not None else _unauth_response(request, reason="no_cookie")
    # An absent AT with a present RT is the COMMON expiry case (the AT cookie's Max-Age tracks
    # the token TTL, so the browser evicts it first) — skip straight to refresh.
    session = None
    if at:
        try:
            session = _verify_access_token(request, access_token=at, provider_hint=provider_hint)
        except ProviderError as e:
            return unreachable_response(str(e))
    if session is None:
        # Rotate via the refresh token before forcing re-login; on success the request is
        # served transparently with the rotated cookies re-set.
        try:
            refreshed = await run_in_threadpool(
                _attempt_refresh, request, refresh_token=_rt, provider_hint=provider_hint)
        except ProviderError as e:
            # Uncertain (provider unreachable), not rejected: keep the cookies.
            return unreachable_response(str(e))
        if refreshed is None:
            return _session_expired_response(request)
        return await _serve_refreshed(request, call_next, *refreshed)

    request.state.session = session
    _bridged = _attach_poclip_bridge(request)      # Hermes+: trước call_next → cùng request dùng được
    response = await call_next(request)
    if _bridged is not None:
        _set_poclip_bridge_cookie(response, _bridged)
    if not provider_hint and session.provider:
        set_session_provider_cookie(
            response, provider=session.provider, use_https=detect_https(request),
            prefix=prefix_from_request(request))
    return response


def _attempt_refresh(request: Request, *, refresh_token, provider_hint: str | None = None):
    """Rotate an expired session via the refresh token; ``(Session, provider_name)`` or ``None``.
    Concurrent requests carrying the same stale RT are coalesced (``refresh_singleflight``): a
    burst of parallel fetches after AT expiry must not replay a rotated RT into the provider's
    reuse detection. ``RefreshExpiredError`` rejects that candidate only (Basic raises it for
    foreign opaque tokens too); if none succeeds and any raised ``ProviderError`` it is
    re-raised so the caller returns 503 without clearing cookies. Synchronous: the gate runs it
    in the threadpool so a slow IdP never blocks the event loop."""
    if not refresh_token:
        return None

    def _audit_failure(reason):
        return lambda provider: audit_log(
            AuditEvent.REFRESH_FAILURE, provider=provider.name, reason=reason,
            ip=_client_ip(request))

    return refresh_session_coalesced(
        refresh_token, provider_hint or "", phase="refresh", log=_log,
        on_rejected=_audit_failure("refresh_expired"),
        on_unreachable=_audit_failure("provider_unreachable"))
