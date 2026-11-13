"""hermes_poclip — Python package cho dự án Hermes PoClip.

File này đóng 2 vai trò cùng lúc, nạp qua 2 loader độc lập của hermes-agent:

1. `__init__.py` của package Python `hermes_poclip` (cấu trúc phẳng — package
   này CHÍNH LÀ thư mục `plugins/hermes-poclip/`). Nạp thủ công qua
   `importlib.util.spec_from_file_location("hermes_poclip", ...)` bởi
   `dashboard/plugin_api.py` / `tests/pa-m1/conftest.py` / patch trong
   `hermes_cli/web_server.py` — các nơi này TỰ đăng ký `sys.modules["hermes_poclip"]`
   trước khi exec file này.
2. Entry module của plugin `plugin.yaml` (`kind: backend`, tự động load) — nạp
   bởi `hermes_cli/plugins.py::_load_directory_module`, dưới tên module
   `hermes_plugins.hermes_poclip` (namespace `_NS_PARENT`) — loader này KHÔNG
   đăng ký bare `"hermes_poclip"` vào sys.modules.

Nếu loader (2) chạy TRƯỚC loader (1) trong 1 tiến trình (vd `hermes -p <id> -z
"..."` chạy thẳng, chưa từng mở `hermes dashboard`), dòng `from hermes_poclip...`
bên dưới sẽ crash `ModuleNotFoundError` vì không có thư mục `hermes_poclip`
(gạch dưới) thật nào trên sys.path — chỉ có `hermes-poclip` (gạch ngang, tên
thư mục plugin). 2 dòng dưới đây tự đăng ký bí danh bất kể loader nào chạy
trước — an toàn vì cả 2 loader đều set `__path__` trỏ đúng plugin root trước
khi exec.
"""

import sys

sys.modules.setdefault("hermes_poclip", sys.modules[__name__])

import json
import logging
import os
import re
import time

from hermes_poclip.version import __version__

__all__ = ["__version__", "register"]

_log = logging.getLogger("hermes_poclip.plugin")

# ── Phase B — nối evaluate_tool_policy() vào hook pre_tool_call thật ─────────

_MANAGED_CACHE: dict[str, tuple[bool, float]] = {}
_MANAGED_CACHE_TTL_S = 300.0


def _is_poclip_managed_profile(profile_id: str) -> bool:
    """True nếu profile_id có mặt trong org_nodes/agent_profiles của poclip.

    Cache 300s/profile — tránh query DB mỗi tool call cho user hermes-agent
    bình thường không liên quan gì tới hermes-poclip.
    """
    now = time.monotonic()
    cached = _MANAGED_CACHE.get(profile_id)
    if cached is not None and (now - cached[1]) < _MANAGED_CACHE_TTL_S:
        return cached[0]

    from hermes_poclip.db.connection import get_connection, poclip_db_path

    db_path = os.environ.get("HERMES_POCLIP_DB_PATH") or str(poclip_db_path())
    conn = get_connection(db_path)
    try:
        row = conn.execute(
            "SELECT 1 FROM org_nodes WHERE profile_id=?"
            " UNION SELECT 1 FROM agent_profiles WHERE profile_id=?"
            " LIMIT 1",
            (profile_id, profile_id),
        ).fetchone()
    finally:
        conn.close()

    managed = row is not None
    _MANAGED_CACHE[profile_id] = (managed, now)
    return managed


# ── Hiến pháp công ty bất biến: agent KHÔNG được ghi/xoá/di chuyển constitution.yaml qua bất kỳ tool nào ──────────
_PROTECTED_NAMES = ("constitution.yaml",)
_READ_ONLY_TOOLS = frozenset({
    "read_file", "search_files", "list_files", "list_dir", "glob", "grep", "session_search", "view_file",
})
_SHELL_TOOLS = frozenset({"terminal", "bash", "shell", "execute_code", "run_command", "process"})
# Công cụ CHỈ truyền chữ (không đụng tới tệp trên đĩa): nhắc tên constitution.yaml trong nội dung (tóm tắt đóng thẻ, bình luận, tin nhắn…) không phải là ghi vào hiến pháp.
# Trước đây cả kanban_complete/kanban_comment/kanban_request_review bị chặn khi phần tóm tắt có chữ «constitution.yaml» (77 lần trong một ngày trên máy 26) nên thẻ không đóng
# được và bị tính «vi phạm quy trình». Công cụ không có trong danh sách này vẫn bị chặn như cũ (đóng khi không chắc).
_TEXT_ONLY_PREFIXES = ("kanban_", "poclip_")
_TEXT_ONLY_TOOLS = frozenset({"memory", "todo_list", "clarify", "send_message", "skills_list", "skill_view", "tool_describe", "web_search", "web_extract", "delegate_task"})
_SHELL_READ_ONLY = re.compile(r"^\s*(cat|head|tail|less|more|grep|rg|wc|stat|ls|file|diff|sha256sum|md5sum)\b")
_SHELL_WRITEY = re.compile(r"(>|\btee\b|\bsed\b[^|;&]*-i|\bmv\b|\bcp\b|\brm\b|\bchmod\b|\bchown\b|\btruncate\b|\bdd\b|\bpython|\bperl\b|\bruby\b|\bnode\b|\bpatch\b|\bgit\s+(checkout|restore|apply)\b)")


def _poclip_protected_path_block(tool_name: str, args) -> dict | None:
    """Chặn tool call GHI/XOÁ nhắm vào tệp hiến pháp. Chỉ cho phép các tool/lệnh ĐỌC thuần tuý. Trả None nếu không liên quan."""
    try:
        blob = json.dumps(args, ensure_ascii=False, default=str).lower() if args is not None else ""
    except Exception:       # noqa: BLE001
        blob = str(args).lower()
    if not any(n in blob for n in _PROTECTED_NAMES):
        return None
    name = (tool_name or "").lower()
    if name in _READ_ONLY_TOOLS or name in _TEXT_ONLY_TOOLS or name.startswith(_TEXT_ONLY_PREFIXES):
        return None
    if name in _SHELL_TOOLS:
        cmds = []
        if isinstance(args, dict):
            for k in ("command", "cmd", "code", "script"):
                v = args.get(k)
                if isinstance(v, str):
                    cmds.append(v)
        text = "\n".join(cmds) or blob
        if all(_SHELL_READ_ONLY.match(seg) for seg in re.split(r"[;&|\n]+", text) if seg.strip()) and not _SHELL_WRITEY.search(text):
            return None
    return {
        "action": "block",
        "message": "hermes-poclip: hiến pháp công ty (constitution.yaml) là BẤT BIẾN — agent không được ghi, xoá hay di chuyển; chỉ Chủ tịch sửa qua giao diện.",
    }


def _poclip_a2a_gate(tool_name: str, args: dict, profile_id: str, **_kwargs):
    """Lớp (3) — A2A allowlist gate cho 3 tool kanban_comment/delegate_task/send_message (chặn nếu thiếu grant) + giao việc kanban_create/kanban_link (chế độ off/log/enforce).

    Chạy SAU tool policy deny-wins (không nới bất kỳ điều kiện nào của lớp 2).
    Tool khác trả None ngay ⇒ không đổi hành vi.

    Quyết định D3: KHÔNG suy được profile đích ⇒ DENY (tuyệt đối không fail-open).
    Quyết định D4: trả `{"action":"block","message":...}` — KHÔNG raise ra ngoài
    (host nuốt exception ⇒ fail-open).
    Quyết định D5: khi allowed, mutate `args` tại chỗ để `provenance.grant_id` đi
    tới handler (host truyền đúng object `final_args`).

    Nằm TRONG try/except fail-closed của `_poclip_pre_tool_call`.
    """
    from hermes_poclip.policies.a2a_allowlist import (
        A2A_GRANT_OPERATIONS,
        A2A_AUDIT_TOPIC_WOULD_DENY,
        ASSIGN_OPERATION,
        ASSIGN_TOOLS,
        GrantResult,
        a2a_gate_enabled,
        assign_block_message,
        assign_gate_mode,
        check_a2a_grant,
        evaluate_a2a_gate,
        log_a2a_event_row,
        resolve_a2a_target,
        resolve_assign_target,
    )

    if tool_name in ASSIGN_TOOLS:                 # giao thẻ việc cho nhân viên khác — cổng riêng, có chế độ off/log/enforce (mặc định log: ghi nhận, chưa chặn)
        if not a2a_gate_enabled():
            return None
        mode = assign_gate_mode()
        if mode == "off":
            return None
        res = resolve_assign_target(tool_name, args if isinstance(args, dict) else {}, from_profile=profile_id)
        if res.skip or not res.to_profile:
            return None
        sid, tid = _kwargs.get("session_id") or "", _kwargs.get("task_id") or ""
        if mode == "log":
            verdict = check_a2a_grant(profile_id, res.to_profile, ASSIGN_OPERATION, audit=False)     # không ghi «denied» vào nhật ký vì vẫn cho qua
            if not verdict.allowed:
                log_a2a_event_row(profile_id, res.to_profile, ASSIGN_OPERATION,
                                  GrantResult(False, None, f"[ghi nhận — chưa chặn] {verdict.reason}"), session_id=sid, task_id=tid, topic_override=A2A_AUDIT_TOPIC_WOULD_DENY)
            return None
        verdict = check_a2a_grant(profile_id, res.to_profile, ASSIGN_OPERATION)                      # enforce: audit đầy đủ (denied vào nhật ký)
        log_a2a_event_row(profile_id, res.to_profile, ASSIGN_OPERATION, verdict, session_id=sid, task_id=tid)
        if not verdict.allowed:
            return {"action": "block", "message": f"hermes-poclip A2A: {assign_block_message(profile_id, res.to_profile)} ({verdict.reason})"}
        return None

    if tool_name not in A2A_GRANT_OPERATIONS:
        return None

    if not a2a_gate_enabled():
        # Kill switch vận hành khẩn cấp (D9) — mặc định BẬT.
        _log.warning(
            "hermes-poclip A2A: gate ĐANG TẮT qua HERMES_POCLIP_A2A_GATE "
            "(tool=%s, profile=%s)",
            tool_name,
            profile_id,
        )
        return None

    session_id = _kwargs.get("session_id") or ""
    task_id = _kwargs.get("task_id") or ""

    resolution = resolve_a2a_target(
        tool_name, args, from_profile=profile_id
    )
    if resolution.skip:
        _log.debug(
            "hermes-poclip A2A: bỏ qua gate (tool=%s, from=%s): %s",
            tool_name,
            profile_id,
            resolution.reason,
        )
        return None

    def _block(reason: str) -> dict:
        to_display = resolution.to_profile or "<không xác định>"
        return {
            "action": "block",
            "message": (
                f"hermes-poclip A2A: {reason} "
                f"(operation={tool_name}, from={profile_id}, to={to_display})"
            ),
        }

    if not resolution.to_profile:
        # DENY trước cả khi tra grant — nhưng vẫn phải audit (D6).
        denied = GrantResult(False, None, resolution.reason)
        log_a2a_event_row(
            profile_id, "", tool_name, denied,
            session_id=session_id, task_id=task_id,
        )
        return _block(resolution.reason)

    result = evaluate_a2a_gate(
        profile_id,
        resolution.to_profile,
        tool_name,
        args,
        session_id=session_id,
        task_id=task_id,
    )
    if not result.allowed:
        return _block(result.reason)

    _log.debug(
        "hermes-poclip A2A: ALLOWED tool=%s from=%s to=%s grant=%s",
        tool_name,
        profile_id,
        resolution.to_profile,
        result.grant_id,
    )
    return None


def _poclip_log_event(profile_id: str, tool_name: str, allowed: bool, reason: str, session_id, tool_call_id) -> None:
    """Ghi một quyết định cho/chặn không đi qua evaluate_tool_policy (hiến pháp, agent chưa có chính sách) để nhật ký AI nêu được lý do."""
    try:
        from hermes_poclip.policies.tool_policy import PolicyResult, log_policy_event
        log_policy_event(
            profile_id, tool_name,
            PolicyResult(allowed=allowed, reason=reason, matched_policy_id=None, policy_revision="1.0"),
            session_id, None, tool_call_id,
        )
    except Exception:  # noqa: BLE001 — nhật ký không được làm hỏng lệnh của agent
        _log.debug("hermes-poclip: không ghi được sự kiện chính sách", exc_info=True)


def _poclip_pre_tool_call(tool_name: str = "", args=None, **_kwargs):
    """Hook `pre_tool_call` — chặn tool call thật nếu policy poclip deny.

    CHỈ can thiệp khi HERMES_PROFILE là 1 agent do hermes-poclip quản lý — mọi
    agent/user khác của hermes-agent KHÔNG bị ảnh hưởng (return None ngay).

    Thứ tự các lớp (D1 — KHÔNG đổi thứ tự, KHÔNG nới lớp nào):
      (1) điều kiện profile managed;
      (2) tool policy deny-wins 8 lớp (evaluate_tool_policy) — nguyên trạng;
      (2b) xin phép trước khi dùng công cụ (policies/tool_approval.py) — chỉ có thể THÊM yêu cầu duyệt, không nới lớp nào;
      (3) A2A allowlist gate cho 3 tool kanban_comment/delegate_task/send_message.

    Toàn bộ thân bọc try/except: host (`PluginManager.invoke_hook`) đã tự bọc
    try/except quanh callback này rồi, NHƯNG nếu để lọt exception ra ngoài thì
    hệ thống coi như "không có directive" → CHO TOOL CHẠY (fail-open) — với 1
    agent đã xác nhận là do poclip quản lý, đây là hướng SAI (phải fail-closed)
    nên callback tự bắt lỗi và tự quyết định, không ỷ lại lưới an toàn ngoài.
    """
    try:
        profile_id = os.environ.get("HERMES_PROFILE") or os.environ.get(
            "HERMES_PROFILE_NAME"
        )
        if not profile_id:
            return None

        if not _is_poclip_managed_profile(profile_id):
            return None

        _sid = _kwargs.get("session_id") or None
        _tcid = _kwargs.get("tool_call_id") or None

        # Lớp (0): hiến pháp bất biến — chặn trước mọi lớp khác
        _protected = _poclip_protected_path_block(tool_name, args)
        if _protected is not None:
            _log.warning("hermes-poclip: chặn tool %s của agent %s vì chạm tới hiến pháp", tool_name, profile_id)
            _poclip_log_event(profile_id, tool_name, False, "constitution_protected: " + str(_protected.get("message", "")), _sid, _tcid)
            return _protected

        # Lớp (0b): cơ sở dữ liệu chung (poclip.db) không dành cho nhân viên thường (policies/data_guard.py; nhóm được miễn đổi được qua cfg_settings['db_guard_exempt'])
        try:
            from hermes_poclip.policies.data_guard import block as _db_guard_block
            _dg = _db_guard_block(profile_id, tool_name, args)
        except Exception:  # noqa: BLE001 — rào phụ: lỗi của riêng nó không được làm kẹt công việc (các lớp sau vẫn chạy)
            _dg = None
        if _dg is not None:
            _log.warning("hermes-poclip: chặn tool %s của %s vì chạm tới cơ sở dữ liệu chung", tool_name, profile_id)
            _poclip_log_event(profile_id, tool_name, False, "data_guard: cơ sở dữ liệu chung chỉ dành cho nhóm được miễn", _sid, _tcid)
            return _dg

        # Lớp (0c): bộ lọc cứng câu hứa lãi trong báo cáo tư vấn của Biên tập (policies/advice_guard.py; Tuân thủ không còn rà trước khi gửi, Chủ tịch 05/11/2026)
        try:
            from hermes_poclip.policies.advice_guard import block as _advice_block
            _ag = _advice_block(profile_id, tool_name, args)
        except Exception:  # noqa: BLE001 — rào phụ: lỗi của riêng nó không được làm kẹt công việc
            _ag = None
        if _ag is not None:
            _log.warning("hermes-poclip: chặn kanban_complete của %s vì báo cáo còn câu hứa lãi", profile_id)
            _poclip_log_event(profile_id, tool_name, False, "advice_guard: báo cáo còn câu hứa lãi hoặc bảo đảm kết quả", _sid, _tcid)
            return _ag

        # Ngắt mạch: phiên đã bị chính sách chặn nhiều lần thì chặn nốt mọi công cụ ngoài nhóm vòng đời việc (policies/tool_visibility.py)
        try:
            from hermes_poclip.policies.tool_visibility import circuit_block
            _cb = circuit_block(profile_id, tool_name, _sid)
        except Exception:  # noqa: BLE001
            _cb = None
        if _cb:
            return {"action": "block", "message": _cb}

        # Kiểm tra khi giao việc: thẻ khai «CÔNG CỤ CẦN» mà người nhận thiếu → từ chối ngay (đỡ chạy cả phiên rồi bị chặn)
        if tool_name == "kanban_create" and isinstance(args, dict):
            try:
                from hermes_poclip.policies.tool_visibility import check_assignment
                _ca = check_assignment(profile_id, str(args.get("assignee") or ""), args.get("body"))
            except Exception:  # noqa: BLE001
                _ca = None
            if _ca:
                _poclip_log_event(profile_id, tool_name, False, "assignment_preflight: " + str(_ca.get("message", ""))[:300], _sid, _tcid)
                return {"action": "block", "message": _ca["message"]}

        from hermes_poclip.errors import PolicyConfigNotFoundError
        from hermes_poclip.policies.tool_policy import (
            DEFAULT_POLICY_ACTION,
            evaluate_tool_policy,
        )

        try:
            decision = evaluate_tool_policy(
                agent_id=profile_id, tool_name=tool_name,
                sender_ctx={"session_id": _sid, "tool_call_id": _tcid},
            )
        except PolicyConfigNotFoundError:
            # Agent hợp lệ nhưng chưa cấu hình rule nào — tôn trọng default
            # của deployment thay vì tự ý chặn.
            _poclip_log_event(
                profile_id, tool_name, DEFAULT_POLICY_ACTION != "deny",
                f"no_policy_configured: agent chưa có chính sách công cụ nào — mặc định {DEFAULT_POLICY_ACTION}", _sid, _tcid,
            )
            if DEFAULT_POLICY_ACTION == "deny":
                return {
                    "action": "block",
                    "message": (
                        f"hermes-poclip: agent '{profile_id}' chưa có policy nào"
                        f" được cấu hình — mặc định deny."
                    ),
                }
            decision = None

        if decision is not None and decision.action == "deny":
            _hint = ""
            try:        # nhắc đừng thử lại; từ lần chặn thứ 2 cùng công cụ trong phiên thì yêu cầu dừng và báo vướng (policies/tool_visibility.py)
                from hermes_poclip.policies.tool_visibility import denial_hint
                from hermes_poclip.policies.tool_policy import AUDIT_ALL_DECISIONS as _audited
                _hint = denial_hint(profile_id, tool_name, _sid, current_logged=_audited)
            except Exception:  # noqa: BLE001
                _hint = ""
            return {"action": "block", "message": str(decision.reason) + _hint}

        # ── Lớp (2b): xin phép trước khi dùng công cụ ────────────────────────
        # Chạy SAU lớp cấm (cấm thắng "cần duyệt") và KHÔNG bị luật "cho phép" gỡ bỏ ("cần duyệt" thắng "cho phép").
        # Tính dấu vân tay lệnh TRƯỚC khi gate A2A sửa args tại chỗ.
        from hermes_poclip.policies.tool_approval import check_tool_approval, consume_grant, record_gate_event

        gate = check_tool_approval(
            profile_id, tool_name, args if args is not None else {},
            task_id=os.environ.get("HERMES_KANBAN_TASK") or _kwargs.get("task_id"), session_id=_sid,
        )
        if gate.blocked:
            _log.info("hermes-poclip: lệnh %s của %s cần xin phép (%s, phiếu %s)", tool_name, profile_id, gate.state, gate.approval_id)
            record_gate_event(profile_id, tool_name, gate.state, gate.approval_id, gate.rule_id, session_id=_sid, tool_call_id=_tcid)
            return {"action": "block", "message": gate.message}

        # ── Lớp (2c): quy tắc chọn người rà soát khi nộp thẻ (governance/review_policy.py) ──
        # Chỉ áp dụng cho kanban_request_review và chỉ khi Chủ tịch bật mức «cấu hình cứng» (mức «khuyến nghị» chỉ ghi nhận). Lỗi nội bộ của quy tắc này
        # KHÔNG làm kẹt công việc (check() tự cho qua khi lỗi).
        if tool_name == "kanban_request_review":
            from hermes_poclip.db.connection import poclip_db_path
            from hermes_poclip.governance import review_policy

            _rv = review_policy.gate(os.environ.get("HERMES_POCLIP_DB_PATH") or str(poclip_db_path()), profile_id, args if isinstance(args, dict) else {},
                                     task_id=os.environ.get("HERMES_KANBAN_TASK") or _kwargs.get("task_id"))
            if _rv is not None:
                _poclip_log_event(profile_id, tool_name, False, "review_policy: " + str(_rv.get("message", ""))[:300], _sid, _tcid)
                return _rv

        # ── Lớp (2d): giới hạn số vòng trả về sửa của một thẻ (governance/review_rounds.py) — chỉ cho kanban_request_changes ──
        if tool_name == "kanban_request_changes":
            from hermes_poclip.db.connection import poclip_db_path
            from hermes_poclip.governance import review_rounds

            _rr = review_rounds.gate(os.environ.get("HERMES_POCLIP_DB_PATH") or str(poclip_db_path()), args if isinstance(args, dict) else {},
                                     task_id=os.environ.get("HERMES_KANBAN_TASK") or _kwargs.get("task_id"))
            if _rr is not None:
                _poclip_log_event(profile_id, tool_name, False, "review_rounds: " + str(_rr.get("message", ""))[:300], _sid, _tcid)
                return _rr

        # ── Lớp (3): A2A allowlist gate ──────────────────────────────────────
        # Chỉ chạy khi lớp (2) KHÔNG block. Lớp (2) là deny-wins: nó chỉ được
        # quyền CHẶN, không được quyền "allow rồi return" — nếu return sớm ở
        # nhánh allow (kể cả nhánh zero-rule default-allow) thì gate A2A không
        # bao giờ chạy và grant tạo qua UI thành vô tác dụng.
        a2a_result = _poclip_a2a_gate(
            tool_name, args if isinstance(args, dict) else {}, profile_id, **_kwargs
        )
        if a2a_result is None and gate.grant_id:
            # Lệnh thật sự được chạy → tiêu hao giấy phép (dùng một lần)
            if not consume_grant(gate.grant_id):
                return {
                    "action": "block",
                    "message": "hermes-poclip: giấy phép xin phép cho lệnh này đã được dùng — cần xin phép lại.",
                }
            record_gate_event(profile_id, tool_name, "used", gate.approval_id, gate.rule_id, session_id=_sid, tool_call_id=_tcid)
        return a2a_result
    except Exception:
        # Bug ở lớp wrapper (không phải lỗi DB đã biết — evaluate_tool_policy
        # tự fail-safe-deny nội bộ rồi). Đã xác nhận agent này DO POCLIP QUẢN
        # LÝ ở trên → fail-closed thay vì để host tự fail-open.
        _log.exception(
            "hermes-poclip: pre_tool_call hook lỗi nội bộ (tool=%s) — chặn an toàn",
            tool_name,
        )
        try:
            from hermes_poclip.policies.tool_policy import failsafe_allows
            if failsafe_allows(tool_name):
                # Công cụ Kanban vòng đời việc (báo hoàn thành/vướng/tiến độ): cho chạy để nhân viên không bị kẹt vì sự cố hạ tầng chính sách.
                _log.critical("hermes-poclip: hook lỗi nhưng '%s' là công cụ Kanban vòng đời việc — cho chạy (fail-safe allow)", tool_name)
                return None
        except Exception:  # noqa: BLE001
            pass
        return {
            "action": "block",
            "message": "hermes-poclip policy hook internal error - blocked for safety",
        }


def _poclip_kanban_worker_context(**kwargs):
    """Wrapper for the kanban_worker_context hook — avoids circular imports."""
    try:        # trước khi nhân viên chạy: đồng bộ công cụ agent NHÌN THẤY với công cụ được PHÉP (ẩn nhóm bị cấm hoàn toàn) — rẻ khi chính sách không đổi
        _pid = kwargs.get("assignee") or kwargs.get("profile_name") or os.environ.get("HERMES_PROFILE") or ""
        if _pid:
            from hermes_poclip.policies.tool_visibility import ensure_synced
            ensure_synced(_pid, os.environ.get("HERMES_POCLIP_DB_PATH") or None)
    except Exception:  # noqa: BLE001
        _log.debug("hermes-poclip: ensure_synced bỏ qua", exc_info=True)
    from hermes_poclip.org.context import build_block_for_hook
    return build_block_for_hook(**kwargs)


def _poclip_compliance_completed(**kwargs):
    """Hook kanban_task_completed: agent tuân thủ hoàn tất thẻ rà soát T2 → ghi kết luận vào phiếu duyệt."""
    from hermes_poclip.governance.compliance_review import on_kanban_task_completed
    on_kanban_task_completed(**kwargs)


def _poclip_dispatch_gate(**kwargs):
    """Hook kanban_dispatch_gate: giữ việc lại khi ngân sách đã chạm hạn mức cứng, Chủ tịch bấm dừng khẩn cấp, hoặc nhà cung cấp LLM của nhân viên đó đang hết tiền."""
    from hermes_poclip.budget import dispatch_block_reason
    _db = os.environ.get("HERMES_POCLIP_DB_PATH") or None
    reason = dispatch_block_reason(_db, kwargs.get("assignee"))
    if reason:
        return reason
    try:     # nhà cung cấp LLM hết tiền: giữ thẻ lại (mỗi 15 phút cho đúng một thẻ chạy thử) — monitoring/provider_health.py
        from hermes_poclip.monitoring.provider_health import gate_reason
        reason = gate_reason(_db, kwargs.get("assignee"), kwargs.get("task_id"), kwargs.get("board"))
        if reason:
            return reason
    except Exception:  # noqa: BLE001
        pass
    try:     # chính sách công cụ chặn công cụ cốt lõi của Kanban: giao việc chỉ đốt token (worker bị từ chối rồi thoát) → giữ thẻ, nói rõ cách sửa
        assignee = kwargs.get("assignee")
        if assignee and _db:
            from hermes_poclip.onboarding.tool_presets import core_tools_blocked
            blocked = core_tools_blocked(_db, assignee)
            if blocked:
                return (f"chính sách công cụ đang chặn {', '.join(blocked)} của «{assignee}» nên nhân viên không làm được việc — "
                        f"sửa ở Tiếp nhận nhân viên (bước 3); thẻ giữ nguyên, không mất")
    except Exception:  # noqa: BLE001
        return None
    return None


def _poclip_post_tool_call(**kwargs):
    """Hook post_tool_call: CEO giao thẻ BỎ CẤP trưởng phòng → ghi nhận vào nhật ký A2A + bình luận trên thẻ (policies/skip_level.py). Chỉ quan sát, không bao giờ làm hỏng lượt gọi."""
    try:
        if kwargs.get("tool_name") != "kanban_create" or kwargs.get("status") not in (None, "ok"):
            return
        creator = os.environ.get("HERMES_PROFILE") or os.environ.get("HERMES_PROFILE_NAME") or ""
        if not creator:
            return
        from hermes_poclip.policies.skip_level import after_kanban_create
        after_kanban_create(os.environ.get("HERMES_POCLIP_DB_PATH") or "", creator, kwargs.get("args") or {}, kwargs.get("result"))
    except Exception:  # noqa: BLE001
        _log.debug("hermes-poclip: post_tool_call bỏ qua", exc_info=True)


def _system_scoped(fn):
    """Bọc hàm của CHÍNH plugin (móc, công cụ điều hành) để chạy trong «phạm vi hệ thống» của Kanban: trong tiến trình worker, rào «chỉ thấy bảng của thẻ mình» không được chặn
    việc hệ thống tự làm (tạo thẻ leo thang, tra người nhận thẻ cho cổng A2A, giao phiếu rà soát…). Agent không tự vào được phạm vi này — chỉ mã đã đăng ký ở đây."""
    import functools
    import inspect

    if inspect.iscoroutinefunction(fn):
        return fn

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            from hermes_cli.kanban_db import system_board_scope
        except Exception:  # noqa: BLE001 — lõi không có phạm vi hệ thống (bản cũ): chạy như thường
            return fn(*args, **kwargs)
        with system_board_scope():
            return fn(*args, **kwargs)
    return wrapper


class _SystemScopedCtx:
    """Bọc ctx để mọi công cụ plugin đăng ký đều chạy trong phạm vi hệ thống."""

    def __init__(self, ctx):
        self._ctx = ctx

    def register_tool(self, *args, **kwargs):
        if "handler" in kwargs and callable(kwargs["handler"]):
            kwargs["handler"] = _system_scoped(kwargs["handler"])
        return self._ctx.register_tool(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._ctx, name)


def register(ctx) -> None:
    """Entry point plugin.yaml (kind: backend, tự động load)."""
    try:  # luật «bảng liên quan»: lõi hỏi plugin bảng nào agent này được vào ngoài bảng của thẻ (xem policies/board_access.py)
        from hermes_poclip.policies.board_access import register as _register_board_access
        _register_board_access()
    except Exception:  # noqa: BLE001 — lỗi đăng ký thì giữ rào cũ, không làm hỏng việc nạp plugin
        _log.exception("hermes-poclip: không đăng ký được luật bảng liên quan")
    try:  # `hermes company export|import …` — xuất, nhập công ty (gói .hpcompany); company_package/cli.py
        from hermes_poclip.company_package.cli import register_cli as _company_cli
        ctx.register_cli_command(name="company", help="Xuất, nhập công ty (gói .hpcompany)", setup_fn=_company_cli,
                                 description="Xuất cấu hình công ty ra một tệp, hoặc nhập vào máy trống. Mặc định nhập chỉ KIỂM TRA TRƯỚC.")
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được lệnh `hermes company`")
    ctx.register_hook("pre_tool_call", _system_scoped(_poclip_pre_tool_call))
    ctx.register_hook("post_tool_call", _system_scoped(_poclip_post_tool_call))
    try:  # nhân viên tiếp nhận im lặng với thông báo thẻ con (chỉ nói khi có kết quả cuối) — đăng ký TRƯỚC rào chắn để dấu im lặng thắng — governance/quiet_notifications.py
        from hermes_poclip.governance import quiet_notifications as _qn
        ctx.register_hook("pre_llm_call", _qn.on_pre_llm_call)
        ctx.register_hook("transform_llm_output", _qn.on_transform_llm_output)
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được bộ im lặng thông báo trung gian")
    try:  # rào chắn câu trả lời của khối kiểm soát (gỡ số điện thoại chưa kiểm chứng, đính chính «đã báo» khi chưa gửi gì) — governance/response_guard.py
        from hermes_poclip.governance import response_guard as _rg
        ctx.register_hook("post_tool_call", _rg.on_post_tool_call)
        ctx.register_hook("transform_llm_output", _rg.on_transform_llm_output)
    except Exception:  # noqa: BLE001 — lỗi đăng ký không làm hỏng việc nạp plugin
        _log.exception("hermes-poclip: không đăng ký được rào chắn câu trả lời")
    try:  # che seed phrase / khóa riêng / mật khẩu trong tin nhắn kênh chat trước khi agent đọc và lưu — governance/secret_redaction.py
        from hermes_poclip.governance import secret_redaction as _sr
        ctx.register_hook("pre_gateway_dispatch", _sr.on_pre_gateway_dispatch)
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được bộ che bí mật")
    try:  # thẻ vai trò + gói kiến thức + sơ đồ vào phiên chat trên kênh nhắn tin (Zalo, Telegram…) — org/channel_context.py
        from hermes_poclip.org import channel_context as _cc
        ctx.register_hook("pre_llm_call", _cc.on_pre_llm_call)
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được bối cảnh cho kênh nhắn tin")
    ctx.register_hook("kanban_worker_context", _system_scoped(_poclip_kanban_worker_context))
    ctx.register_hook("kanban_task_completed", _system_scoped(_poclip_compliance_completed))
    ctx.register_hook("kanban_dispatch_gate", _system_scoped(_poclip_dispatch_gate))
    ctx = _SystemScopedCtx(ctx)
    try:  # công cụ chính thức nộp đề xuất cơ cấu (chỉ nhân sự/Đào tạo/Tuân thủ thấy); lỗi đăng ký không làm hỏng việc nạp plugin
        from hermes_poclip.org.agent_tools import register_tools
        register_tools(ctx)
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được công cụ nộp đề xuất cơ cấu")
    try:  # công cụ khối kiểm soát: báo thẳng Chủ tịch, phát sự kiện bàn giao, tố giác
        from hermes_poclip.org.control_tools import register_tools as _register_control_tools
        _register_control_tools(ctx)
    except Exception:  # noqa: BLE001
        _log.exception("hermes-poclip: không đăng ký được công cụ khối kiểm soát")
