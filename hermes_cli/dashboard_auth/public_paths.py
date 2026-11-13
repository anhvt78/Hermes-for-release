"""Shared allowlist of ``/api/*`` paths that bypass dashboard auth. Imported by BOTH gates —
``web_server.auth_middleware`` (loopback / ``--insecure``) and
``dashboard_auth.middleware.gated_auth_middleware`` (OAuth cookie) — so the lists cannot drift
again (a drift once 401'd ``/api/status`` and broke the portal's cookie-less liveness probe).
Keep minimal: every entry must be safe for external uptime probes, the pre-login SPA, and anyone
who ``curl``s the hostname; otherwise gate it and bootstrap after login."""
from __future__ import annotations

import os
import re

PUBLIC_API_PATHS: frozenset[str] = frozenset({
    # Minimal process liveness probe for desktop/backend boot handshakes; avoids
    # gateway config, platform discovery, MCP setup and cold plugin imports.
    "/api/health",
    # Portal wildcard liveness probe (``docs/agent-dashboard-public-url-contract.md``,
    # NAS side): version, gateway state, session count, auth-gate shape. No secrets.
    "/api/status",
    # Read-only config-defaults / schema feeds for the SPA's Config page.
    "/api/config/defaults",
    "/api/config/schema",
    # Read-only model metadata — same shape as public provider catalogs.
    "/api/model/info",
    # Read-only theme + plugin manifests for the dashboard skin engine.
    "/api/dashboard/themes",
    "/api/dashboard/plugins",
    # Chronos managed-cron fire webhook (NAS -> agent). NOT cookie-gated: it
    # carries its own short-lived NAS-minted JWT (purpose=cron_fire), which the
    # handler verifies — the JWT, not this allowlist, is the security boundary.
    "/api/cron/fire"})


# ---------------------------------------------------------------------------
# hermes-poclip API-3D contract — gate-deferral (cơ chế a)
#
# TẠI SAO không mở toàn bộ /api/v1:
#   /api/v1/* là không gian của plugin poclip (26+ router) nhưng cũng chứa
#   nhiều endpoint nội bộ (goals/tree, org/agents/{id}/retire, budget/*, rbac/*
#   v.v.) không thuộc contract API-3D. Mở hết sẽ phá vỡ ranh giới bảo mật
#   dashboard — client 3D chỉ cần đúng 23 path được công bố trong API-3D.md.
#
# TẠI SAO fail-closed (poclip_3d_gate_armed):
#   Bypass này chỉ có nghĩa khi gate riêng của poclip (require_3d_key) ĐÃ
#   được trang bị. Nếu HERMES_POCLIP_3D_KEYS chưa set, require_3d_key ở
#   chế độ dev (cho qua không kiểm tra) — lúc đó bypass sẽ bỏ đi CẢ HAI
#   lớp bảo vệ (dashboard gate + poclip gate), không có gate thật nào. Vì vậy:
#   chưa set env → giữ 401 của dashboard cho toàn bộ /api/v1/*.
#
# BẢO MẬT nằm ở đâu:
#   Các path trong danh sách D1 đều được bảo vệ bởi Depends(require_3d_key)
#   ở bản mount root. Dashboard gate chỉ là lớp ngoài — khi bypass, lớp trong
#   (poclip X-3D-Key check) trở thành ranh giới thật sự.
#   Seam này dùng chung cho CẢ 2 gate (legacy _SESSION_TOKEN + OAuth).
# ---------------------------------------------------------------------------

POCLIP_3D_KEYS_ENV = "HERMES_POCLIP_3D_KEYS"

POCLIP_3D_ROOT_PREFIX = "/api/v1/"
# liveness của bản mount root poclip — công khai, không dữ liệu, chỉ mở khi gate poclip đã trang bị = cùng điều kiện fail-closed
POCLIP_ROOT_LIVENESS_PATHS: frozenset[str] = frozenset({"/health", "/version"})

# Đúng 25 path pattern thuộc contract API-3D (D1). Khớp CHÍNH XÁC — không
# dùng prefix rộng để tránh mở vô tình endpoint khác.
POCLIP_3D_CONTRACT_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"^/api/v1/org/soul-templates$"),            # GET
    re.compile(r"^/api/v1/org/soul-templates/[^/]+$"),      # GET /{template_id}
    re.compile(r"^/api/v1/skills/catalog$"),                # GET
    re.compile(r"^/api/v1/org/agents$"),                    # GET, POST
    re.compile(r"^/api/v1/org/agents/[^/]+/provisioning$"), # GET /{id}/provisioning
    re.compile(r"^/api/v1/org/agents/[^/]+/state$"),        # GET, PATCH /{id}/state
    re.compile(r"^/api/v1/org/tree$"),                      # GET
    re.compile(r"^/api/v1/org/heartbeat$"),                 # POST
    re.compile(r"^/api/v1/tasks$"),                         # GET, POST
    re.compile(r"^/api/v1/tasks/[^/]+/verdict$"),           # POST /{task_id}/verdict
    re.compile(r"^/api/v1/approvals/[^/]+/decide$"),        # POST /{request_id}/decide
    re.compile(r"^/api/v1/comm/directives$"),               # POST
    re.compile(r"^/api/v1/comm/messages$"),                 # GET, POST
    re.compile(r"^/api/v1/realtime/events$"),               # GET (SSE)
    re.compile(r"^/api/v1/state/snapshot$"),                # GET
    # t_8aa3eaba: 8 path trùng lịch họp. conflict-check dùng pattern riêng (lookahead);
    # meetings/[^/]+ dùng lookahead để không nuốt conflict-check, đảm bảo test matched==1.
    re.compile(r"^/api/v1/meetings$"),                                   # POST tạo họp v1
    re.compile(r"^/api/v1/meetings/(?!conflict-check$)[^/]+$"),          # PATCH sửa họp v1
    re.compile(r"^/api/v1/meetings/conflict-check$"),                    # POST dry-run
    re.compile(r"^/api/v1/meeting-schedules$"),                          # POST tạo lịch họp v1
    re.compile(r"^/api/v1/meeting-schedules/[^/]+$"),                    # PATCH sửa lịch họp v1
    re.compile(r"^/api/v1/meeting-conflicts$"),                          # GET vết trùng
    re.compile(r"^/api/v1/meeting-conflict-rules$"),                     # GET/PUT cấu hình quy tắc
    # t_536260fc: 3 path Thẻ Vai Trò. role-card$ dùng $ để không nuốt role-card/from-template.
    re.compile(r"^/api/v1/org/agents/[^/]+/role-card$"),                 # GET, PUT
    re.compile(r"^/api/v1/org/agents/[^/]+/role-card/from-template$"),   # POST
    re.compile(r"^/api/v1/org/role-cards/sync$"),                        # POST
)


def poclip_3d_gate_armed() -> bool:
    """True khi HERMES_POCLIP_3D_KEYS được set (khác rỗng sau strip).

    Gate bypass chỉ có hiệu lực khi env này khác rỗng — đảm bảo luôn có
    gate thật (require_3d_key) bảo vệ các path được bypass. Đọc tại thời
    điểm request (không cache) để phản ứng với hot-reload env.
    """
    return bool(os.environ.get(POCLIP_3D_KEYS_ENV, "").strip())


def is_poclip_ui_page_path(path: str) -> bool:
    """True nếu path là trang giao diện người dùng poclip (/hermes-poclip hoặc /hermes-poclip/...).

    Dùng bởi is_public_api_path (cơ chế f) và middleware để điều hướng tài khoản con
    chưa đăng nhập về trang login poclip riêng (thay vì trang /login của dashboard host).

    Trả True chỉ khi:
      - path == "/hermes-poclip" (trang gốc), HOẶC
      - path.startswith("/hermes-poclip/") (sub-path của trang React poclip).
    Trả False cho mọi path khác (kể cả "/poclip-login", "/api/...", v.v.).
    """
    return path == "/hermes-poclip" or path.startswith("/hermes-poclip/")


def is_public_api_path(path: str, request: "Request | None" = None) -> bool:
    """True nếu path bypass gate dashboard.

    Tám nguồn (kiểm tra theo thứ tự):
    1. PUBLIC_API_PATHS — allowlist cũ (exact match, không thay đổi).
    2. POCLIP_CUSTOMER_PORTAL_PATTERNS — 8 path cổng khách, VÔ ĐIỀU KIỆN
       (token trong URL là ranh giới bảo mật thật).
    3. POCLIP_AUTH_PATTERNS — 4 path login/logout poclip, VÔ ĐIỀU KIỆN
       (không thể đòi credential để cấp credential).
    4. POCLIP_LOGIN_PAGE_PATHS — 2 path trang đăng nhập poclip, VÔ ĐIỀU KIỆN
       (không thể đòi dashboard session để hiển thị trang đăng nhập poclip).
    5. Deferral theo phiên poclip: path thuộc namespace poclip VÀ request mang
       phiên hợp lệ (verify_session khác None). CHỈ khi request != None và
       phiên hợp lệ — fail-closed để tránh token rác qua cổng dashboard.
    6. Deferral trang UI poclip: is_poclip_ui_page_path VÀ request mang phiên
       poclip hợp lệ. Không cookie hoặc token rác → False (fail-closed).
    7. POCLIP_3D_CONTRACT_PATTERNS — 25 path contract API-3D, CHỈ khi gate
       riêng của poclip đã được trang bị (poclip_3d_gate_armed() = True).
    8. Deferral tài nguyên tĩnh plugin poclip: is_poclip_asset_path VÀ request
       mang phiên poclip hợp lệ. Không phiên hoặc token rác → False (fail-closed)
       (cơ chế g).

    Lưu ý: POCLIP_SHELL_SCOPED_PATHS (5 endpoint bootstrap khung dashboard:
    /api/auth/me, /api/profiles, /api/profiles/active, /api/config,
    /api/dashboard/font) KHÔNG nằm ở đây — không public, không mở dữ liệu.
    Middleware xử lý riêng bằng _poclip_scoped_response: trả 403 domain
    không kèm login_url để SPA không chuyển hướng sang /login khi tài khoản
    con không có dữ liệu hệ thống.

    Seam này dùng chung cho cả 2 gate: legacy _SESSION_TOKEN (web_server.py)
    và OAuth (dashboard_auth/middleware.py).

    Tương thích ngược: gọi 1 tham số (request=None) vẫn chạy y như cũ —
    nguồn 5, 6 và 8 (deferral) không kích hoạt nếu không truyền request.
    """
    if path in PUBLIC_API_PATHS:
        return True
    # Cổng khách: bypass vô điều kiện — ranh giới bảo mật là token bí mật trong URL
    if is_public_customer_portal_path(path):
        return True
    # Auth bootstrap poclip: bypass vô điều kiện — không thể đòi credential để cấp credential
    if is_public_poclip_auth_path(path):
        return True
    # Trang đăng nhập poclip: bypass vô điều kiện — không thể đòi dashboard session
    # để hiển thị trang đăng nhập poclip (tương tự auth bootstrap, cơ chế e)
    if path in POCLIP_LOGIN_PAGE_PATHS:
        return True
    # Deferral theo phiên poclip: chỉ khi phiên HỢP LỆ (verify_session != None)
    # và trong namespace plugin; token rác vẫn bị chặn bởi has_valid_poclip_session.
    if request is not None and is_poclip_namespace_path(path) and has_valid_poclip_session(request):
        return True
    # Deferral trang UI poclip: /hermes-poclip và sub-path — chỉ khi phiên poclip hợp lệ.
    # Không phiên hoặc token rác → fail-closed (cơ chế f).
    if request is not None and is_poclip_ui_page_path(path) and has_valid_poclip_session(request):
        return True
    # Deferral tài nguyên tĩnh plugin poclip: namespace tài nguyên tĩnh của plugin poclip
    # (bundle React do dashboard nạp bằng <script src>, trình duyệt không gắn được header
    # tuỳ biến); nội dung là mã tĩnh công khai, ranh giới bảo mật thật vẫn là API + RBAC.
    # Không phiên hoặc token rác → fail-closed (cơ chế g).
    if request is not None and is_poclip_asset_path(path) and has_valid_poclip_session(request):
        return True
    if poclip_3d_gate_armed():
        if path in POCLIP_ROOT_LIVENESS_PATHS:
            return True
        return any(p.match(path) for p in POCLIP_3D_CONTRACT_PATTERNS)
    return False


# ---------------------------------------------------------------------------
# hermes-poclip Customer Portal — bypass vô điều kiện (cơ chế b)
#
# TẠI SAO mở KHÔNG có điều kiện (khác nhóm API-3D):
#   Cổng khách là route CÔNG KHAI — khách ngoài không có X-3D-Key, không có
#   cookie dashboard. Ranh giới bảo mật THẬT SỰ là token bí mật trong URL:
#   sha256(token_thô) lưu DB, route tự xác thực token trước khi trả nội dung.
#   Không có gate thay thế nào cần trang bị trước nên bypass vô điều kiện —
#   tương tự /api/cron/fire (bearer JWT là ranh giới thật, không phải allowlist).
#
# TẠI SAO chỉ 8 pattern cụ thể, không mở /api/v1/customer/*:
#   /api/v1/customer/accounts, /api/v1/customer/threads, /api/v1/customer/reviews
#   và /api/v1/customer/audit là API NỘI BỘ (dùng cho staff công ty), phải còn
#   bị gate dashboard. Chỉ 4 sub-path /portal/{token}/... là công khai cho khách.
#
# Fail-safe: nếu token sai/hết hạn, route trả 404/410 thân thiện, không lộ dữ liệu.
# ---------------------------------------------------------------------------

POCLIP_CUSTOMER_PORTAL_PATTERNS: tuple[re.Pattern[str], ...] = (
    # Đường mount gốc /api/v1/... (bản root API)
    re.compile(r"^/api/v1/customer/portal/[^/]+$"),
    re.compile(r"^/api/v1/customer/portal/[^/]+/state$"),
    re.compile(r"^/api/v1/customer/portal/[^/]+/decision$"),
    re.compile(r"^/api/v1/customer/portal/[^/]+/message$"),
    # Đường fallback /api/plugins/hermes-poclip/... (bản plugin UI dashboard)
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/customer/portal/[^/]+$"),
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/customer/portal/[^/]+/state$"),
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/customer/portal/[^/]+/decision$"),
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/customer/portal/[^/]+/message$"),
)


def poclip_3d_opened_paths() -> tuple[str, ...]:
    """Trả tuple chuỗi pattern của 25 path được mở — chỉ dùng cho log/tài liệu."""
    return tuple(p.pattern for p in POCLIP_3D_CONTRACT_PATTERNS)


def is_poclip_api3d_contract_path(path: str) -> bool:
    """True nếu path khớp CHÍNH XÁC một trong 23 path contract API-3D."""
    return any(p.match(path) for p in POCLIP_3D_CONTRACT_PATTERNS)


def is_unknown_poclip_api3d_path(path: str) -> bool:
    """True khi path là đường sai trong namespace /api/v1 (gate poclip đã trang bị).

    False khi gate chưa armed. True khi armed VÀ (path == "/api/v1" hoặc
    path bắt đầu bằng "/api/v1/") NHƯNG KHÔNG thuộc 15 path contract.
    """
    if not poclip_3d_gate_armed():
        return False
    if path == "/api/v1" or path.startswith("/api/v1/"):
        return not is_poclip_api3d_contract_path(path)
    return False


def poclip_api3d_not_found_body(path: str) -> dict:
    """Payload 404 ENDPOINT_NOT_FOUND cho đường sai trong namespace /api/v1.

    Lazy import từ hermes_poclip.api3d_contract để tránh circular import khi
    core (hermes_cli) chưa load plugin. Nếu import lỗi thì trả payload tối thiểu
    cùng mã ENDPOINT_NOT_FOUND + canonical_path_prefix + docs.
    """
    try:
        from hermes_poclip.api3d_contract import not_found_payload
        return not_found_payload(path)
    except Exception:
        return {
            "error": {
                "code": "ENDPOINT_NOT_FOUND",
                "canonical_path_prefix": "/api/v1",
                "docs": "hermes-plus-docs-tests/docs/hermes-poclip/api3d/API-3D.md §3.1",
            }
        }


def is_public_customer_portal_path(path: str) -> bool:
    """True nếu path thuộc cổng khách công khai — bypass vô điều kiện.

    Dùng nội bộ bởi is_public_api_path(); không cần gọi trực tiếp.
    """
    return any(p.match(path) for p in POCLIP_CUSTOMER_PORTAL_PATTERNS)


# ---------------------------------------------------------------------------
# hermes-poclip Auth Bootstrap — bypass vô điều kiện (cơ chế c)
#
# TẠI SAO login/logout vô điều kiện:
#   Đăng nhập không thể đòi chính credential mà nó dùng để cấp — tương tự
#   /api/cron/fire (bearer JWT là ranh giới thật) và cổng khách (token URL).
#   Ranh giới bảo mật THẬT SỰ là username/password do handler kiểm tra
#   (hermes_poclip/api/auth.py); rbac guard của plugin tiếp tục bảo vệ
#   các path /auth/ còn lại (auth/me, auth/accounts/...).
#
# TẠI SAO phủ 2 kiểu mount:
#   Plugin được mount ở /api/plugins/hermes-poclip/... (bản UI dashboard) VÀ
#   /api/v1/... (bản root API); cả hai phải được mở để đăng nhập hoạt động.
#
# Logout vô điều kiện: thu hồi phiên không đòi dashboard session hợp lệ.
# ---------------------------------------------------------------------------

POCLIP_AUTH_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"^/api/v1/auth/login$"),
    re.compile(r"^/api/v1/auth/logout$"),
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/auth/login$"),
    re.compile(r"^/api/plugins/hermes-poclip/api/v1/auth/logout$"),
)


def is_public_poclip_auth_path(path: str) -> bool:
    """True nếu path là đường đăng nhập/đăng xuất poclip — bypass vô điều kiện.

    Dùng nội bộ bởi is_public_api_path(); không cần gọi trực tiếp.
    """
    return any(p.match(path) for p in POCLIP_AUTH_PATTERNS)


# ---------------------------------------------------------------------------
# hermes-poclip Login Page — bypass vô điều kiện (cơ chế e)
#
# TẠI SAO trang đăng nhập poclip vô điều kiện:
#   Trang đăng nhập poclip (/poclip-login) KHÔNG thể đòi dashboard session để
#   hiển thị — đây là trang cấp credential poclip. Nếu đòi dashboard session,
#   tài khoản con (truong_phong, chi_xem) không có credential dashboard sẽ bị
#   kẹt hoàn toàn: cổng dashboard chặn → không vào được trang login poclip →
#   không lấy được phiên poclip → vòng lặp vô hạn.
#
# TẠI SAO phủ 2 kiểu mount:
#   Plugin mount tại /api/plugins/hermes-poclip/... (bản UI dashboard) và
#   gốc (standalone); cả hai phải bypass để trang login truy cập được từ mọi điểm.
#
# Ranh giới bảo mật THẬT SỰ: username/password do handler /auth/login kiểm tra.
# ---------------------------------------------------------------------------

POCLIP_LOGIN_PAGE_PATHS: tuple[str, ...] = (
    "/poclip-login",
    "/api/plugins/hermes-poclip/poclip-login",
)


# ---------------------------------------------------------------------------
# hermes-poclip Session Deferral — deferral theo phiên poclip hợp lệ (cơ chế d)
#
# TẠI SAO CHỈ defer khi phiên HỢP LỆ (không chỉ "có header"):
#   Nếu defer chỉ vì "có header X-Poclip-Session" thì kẻ tấn công gửi token rác
#   là qua được cổng dashboard, rồi những route KHÔNG gắn rbac guard (ví dụ
#   audit_trail_router chỉ nhận Depends(require_3d_key)) sẽ chạy không xác thực.
#   Chỉ khi verify_session(token) trả dict khác None mới coi là hợp lệ.
#
# TẠI SAO bó hẹp trong không gian poclip:
#   KHÔNG mở /api/* nói chung; /api/v1/* là không gian riêng của plugin poclip
#   trong repo này (đã kiểm chứng không có route core nào khác nằm dưới /api/v1/).
#   /api/plugins/hermes-poclip/* là namespace rõ ràng của plugin trên dashboard.
#   4 prefix gốc bổ sung là không gian THẬT của plugin ở bản mount root — đo bằng
#   openapi của build_api_router() (hermes_poclip/app.py::_include_all_routers):
#     policy_config_router               → /api/policy/
#     meeting_router + meetings_router
#       + retrospective_router
#       + action_item_router             → /api/meetings/
#     meeting_schedule_router            → /api/meeting-schedules/
#     approval_router                    → /api/approval-queue/
#   Mọi route dưới 4 prefix này đều gắn poclip_rbac_guard (+ require_3d_key ở
#   bản mount gốc) — xem hermes_poclip/app.py::_include_all_routers.
#
# TẠI SAO "/api/sessions/" CỐ Ý không thêm:
#   /api/sessions là đường của CORE dashboard (hermes_cli/web_routers/sessions.py),
#   KHÔNG gắn poclip_rbac_guard; defer nó sẽ để lộ đường core không được kiểm quyền.
#   Router sessions của plugin vẫn tới được qua bản fallback
#   /api/plugins/hermes-poclip/api/sessions (đã nằm trong namespace thứ 2).
#
# Deferral vẫn fail-closed: chỉ kích hoạt khi has_valid_poclip_session(request)
#   (verify_session trả khác None); không có phiên / token rác vẫn 401 như cũ.
#
# Lớp bảo vệ thật sau khi defer:
#   poclip_rbac_guard (hermes_poclip/auth/rbac.py) + require_3d_key, chạy như
#   dependency của router — dashboard gate chỉ là lớp ngoài cần vượt qua.
# ---------------------------------------------------------------------------

POCLIP_NAMESPACE_PREFIXES: tuple[str, ...] = (
    "/api/v1/",
    "/api/plugins/hermes-poclip/",
    # Prefix gốc của plugin ở bản mount root (đo bằng openapi của build_api_router()).
    # Mọi route dưới chúng đều gắn poclip_rbac_guard — xem _include_all_routers.
    # "/api/sessions/" CỐ Ý không thêm: đường core dashboard không có rbac guard.
    "/api/policy/",
    "/api/meetings/",
    "/api/meeting-schedules/",
    "/api/approval-queue/",
)


def is_poclip_namespace_path(path: str) -> bool:
    """True nếu path thuộc namespace plugin poclip.

    Kiểm tra /api/v1/, /api/plugins/hermes-poclip/, và 4 prefix gốc của plugin
    ở bản mount root (/api/policy/, /api/meetings/, /api/meeting-schedules/,
    /api/approval-queue/). Không bao gồm /api/sessions/ — đường core dashboard.
    """
    for prefix in POCLIP_NAMESPACE_PREFIXES:
        if path == prefix.rstrip("/") or path.startswith(prefix):
            return True
    return False


def has_valid_poclip_session(request) -> bool:
    """True khi request mang phiên poclip hợp lệ (header X-Poclip-Session hoặc cookie poclip_session).

    Fail-closed: mọi lỗi import/runtime đều trả False — cổng dashboard giữ
    nguyên nếu module sessions chưa khả dụng hoặc DB không kết nối được.
    """
    try:
        from hermes_poclip.auth.sessions import valid_session_from_request
        return valid_session_from_request(request)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# hermes-poclip Static Assets — deferral tài nguyên tĩnh plugin (cơ chế g)
#
# TẠI SAO mở /dashboard-plugins/hermes-poclip/ khi có phiên poclip:
#   Dashboard SPA nạp bundle React của plugin bằng
#   <script src="/dashboard-plugins/hermes-poclip/dist/index.js">.
#   Trình duyệt gửi yêu cầu tài nguyên tĩnh KHÔNG có header tuỳ biến (không
#   có X-Poclip-Session), chỉ có cookie poclip_session (gắn tự động). Nếu
#   không bypass, shell trả 302 /login, trang poclip không bao giờ render cho
#   tài khoản con.
#
# Nội dung là mã tĩnh công khai (React bundle đã minify); ranh giới bảo mật
# thật vẫn là API + RBAC. Fail-closed: chỉ bypass khi phiên poclip hợp lệ —
# không phiên hoặc token rác vẫn 302 như cũ.
# ---------------------------------------------------------------------------

# Namespace tài nguyên tĩnh của plugin poclip (bundle React do dashboard nạp
# bằng <script src>, trình duyệt không gắn được header tuỳ biến); nội dung là
# mã tĩnh công khai, ranh giới bảo mật thật vẫn là API + RBAC.
POCLIP_ASSET_PREFIXES: tuple[str, ...] = (
    "/dashboard-plugins/hermes-poclip/",
)


def is_poclip_asset_path(path: str) -> bool:
    """True khi path là tài nguyên tĩnh của plugin poclip.

    Trả True khi path == prefix.rstrip("/") hoặc path.startswith(prefix)
    với mọi prefix trong POCLIP_ASSET_PREFIXES. Không bao giờ True cho plugin
    khác (/dashboard-plugins/hermes-achievements/...) hay "/dashboard-plugins"
    (thiếu tên plugin).
    """
    for prefix in POCLIP_ASSET_PREFIXES:
        if path == prefix.rstrip("/") or path.startswith(prefix):
            return True
    return False


# ---------------------------------------------------------------------------
# hermes-poclip Shell Scoped Paths — 5 endpoint bootstrap của khung dashboard
#
# TẠI SAO 5 endpoint này KHÔNG public nhưng cũng KHÔNG bị đá về /login:
#   Khung dashboard SPA (/hermes-poclip) tự gọi 5 endpoint bootstrap này khi
#   khởi tạo. Tài khoản con poclip (truong_phong, chi_xem) dùng CHUNG khung
#   này nhưng không có credential dashboard — không có dữ liệu hệ thống để trả.
#   Nếu cổng trả 401 kèm login_url → SPA chuyển hướng sang /login → tài khoản
#   con bị kẹt hoàn toàn. Nếu trả 403 domain không kèm login_url → SPA hiểu
#   đây là lỗi quyền truy cập (không phải chưa đăng nhập) và tiếp tục render
#   khung poclip với thanh phiên + nhóm tab.
#
# KHÔNG nằm trong is_public_api_path: không mở dữ liệu, chỉ đổi hình dạng lỗi.
# Middleware xử lý riêng: xem middleware._poclip_scoped_response.
# ---------------------------------------------------------------------------

POCLIP_SHELL_SCOPED_PATHS: tuple[str, ...] = (
    "/api/auth/me",
    "/api/profiles",
    "/api/profiles/active",
    "/api/config",
    "/api/dashboard/font",
)


def is_poclip_shell_scoped_path(path: str) -> bool:
    """True CHỈ khi path khớp CHÍNH XÁC với một trong 5 endpoint bootstrap khung dashboard.

    Các endpoint này bị cổng chặn bằng 403 domain (không kèm login_url) thay vì
    401 unauthenticated — giúp SPA khung poclip không chuyển hướng sang /login khi
    tài khoản con không có dữ liệu hệ thống. Không mở dữ liệu, chỉ đổi hình dạng lỗi.

    Khớp CHÍNH XÁC (không prefix): "/api/config/raw", "/api/profiles/abc",
    "/api/dashboard/fonts", "/api/files" đều trả False.
    """
    return path in POCLIP_SHELL_SCOPED_PATHS
