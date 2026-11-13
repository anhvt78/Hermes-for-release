"""Chốt an toàn bảng vận hành của đội (team board guard).

Đảm bảo mọi thành phần của đội (as-agent / ba-agent) luôn làm việc trên
bảng vận hành cứng (mặc định ``"default"``), bất kể tệp
``<root>/kanban/current`` đang trỏ đến bảng nào.

Không đọc tệp ``current``; không gọi ``get_current_board()``.
"""

from __future__ import annotations

import logging
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

_log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TEAM_BOARD_ENV = "HERMES_KANBAN_TEAM_BOARD"
TEAM_PROFILES_ENV = "HERMES_KANBAN_TEAM_PROFILES"

_DEFAULT_TEAM_PROFILES = ("as-agent", "ba-agent")
_DEFAULT_TEAM_BOARD = "default"


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def _load_kanban_config() -> dict:
    """Đọc khối ``kanban:`` từ config.yaml gốc và profile đang chạy.

    Profile thắng. Tất cả bọc try/except — thiếu/lỗi → dict rỗng.
    """
    from hermes_cli import kanban_db
    root = kanban_db.kanban_home()
    result: dict = {}
    for cfg_path in [
        root / "config.yaml",
        root / "profiles" / active_profile() / "config.yaml",
    ]:
        try:
            import yaml  # type: ignore[import-untyped]
            with open(cfg_path, "r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh)
            if isinstance(data, dict):
                kanban_section = data.get("kanban")
                if isinstance(kanban_section, dict):
                    result.update(kanban_section)
        except Exception:
            pass
    return result


# ---------------------------------------------------------------------------
# active_profile
# ---------------------------------------------------------------------------

def active_profile() -> str:
    """Tên profile đang chạy.

    Thứ tự ưu tiên:
    1. env ``HERMES_PROFILE``
    2. Thư mục cuối khi HERMES_HOME có dạng ``.../profiles/<name>``
    3. ``"default"``
    """
    env_profile = os.environ.get("HERMES_PROFILE", "").strip()
    if env_profile:
        return env_profile
    hermes_home = os.environ.get("HERMES_HOME", "").strip()
    if hermes_home:
        parts = Path(hermes_home).parts
        if len(parts) >= 2 and parts[-2] == "profiles":
            return parts[-1]
    return "default"


# ---------------------------------------------------------------------------
# team_board / team_profiles
# ---------------------------------------------------------------------------

def team_board() -> str:
    """Trả slug của bảng vận hành đội.

    Thứ tự: env ``HERMES_KANBAN_TEAM_BOARD`` → config ``kanban.team_board``
    → ``"default"``.  TUYỆT ĐỐI không đọc tệp current, không gọi
    ``get_current_board()``.
    """
    env_val = os.environ.get(TEAM_BOARD_ENV, "").strip()
    if env_val:
        return env_val
    try:
        cfg = _load_kanban_config()
        board = (cfg.get("team_board") or "").strip()
        if board:
            return board
    except Exception:
        pass
    from hermes_cli.kanban_db import DEFAULT_BOARD
    return DEFAULT_BOARD


def team_profiles() -> tuple[str, ...]:
    """Trả tuple các tên profile thuộc đội.

    Thứ tự: env ``HERMES_KANBAN_TEAM_PROFILES`` (ngăn bằng dấu phẩy)
    → config ``kanban.team_profiles`` → ``("as-agent", "ba-agent")``.
    """
    env_val = os.environ.get(TEAM_PROFILES_ENV, "").strip()
    if env_val:
        return tuple(p.strip() for p in env_val.split(",") if p.strip())
    try:
        cfg = _load_kanban_config()
        profiles = cfg.get("team_profiles")
        if isinstance(profiles, list) and profiles:
            return tuple(str(p).strip() for p in profiles if str(p).strip())
    except Exception:
        pass
    return _DEFAULT_TEAM_PROFILES


# ---------------------------------------------------------------------------
# is_team_assignee / guard_violation
# ---------------------------------------------------------------------------

def is_team_assignee(assignee: Optional[str]) -> bool:
    """True khi ``assignee`` (sau strip + lower) khớp chính xác với team_profiles()."""
    if not assignee:
        return False
    return assignee.strip().lower() in {p.lower() for p in team_profiles()}


def guard_violation(board_slug: Optional[str], assignee: Optional[str]) -> bool:
    """True khi thẻ có assignee thuộc đội nhưng nằm trên bảng KHÁC bảng vận hành."""
    if not board_slug:
        return False
    return is_team_assignee(assignee) and board_slug != team_board()


# ---------------------------------------------------------------------------
# team_pin_for_active_profile
# ---------------------------------------------------------------------------

def team_pin_for_active_profile(profile: Optional[str] = None) -> Optional[dict]:
    """Trả dict ghim bảng nếu profile thuộc đội, ngược lại None.

    ``{"HERMES_KANBAN_BOARD": <slug>, "HERMES_KANBAN_DB": <path>}``
    """
    p = profile if profile is not None else active_profile()
    if not is_team_assignee(p):
        return None
    from hermes_cli import kanban_db as _kdb
    slug = team_board()
    return {
        "HERMES_KANBAN_BOARD": slug,
        "HERMES_KANBAN_DB": str(_kdb.kanban_db_path(board=slug)),
    }


# ---------------------------------------------------------------------------
# board_slug_of_conn
# ---------------------------------------------------------------------------

def board_slug_of_conn(conn: sqlite3.Connection) -> Optional[str]:
    """Xác định slug của bảng mà ``conn`` đang kết nối.

    Dùng ``PRAGMA database_list`` để lấy đường dẫn DB thật, rồi so khớp
    với ``_db_path_for_slug()`` cho DEFAULT_BOARD và mọi slug đang tồn tại.
    Trả slug hoặc ``None`` nếu không nhận ra.
    """
    try:
        from hermes_cli import kanban_db as _kdb
        db_list = conn.execute("PRAGMA database_list").fetchall()
        real_path: Optional[Path] = None
        for row in db_list:
            if row[1] == "main" and row[2]:
                real_path = Path(row[2]).resolve()
                break
        if real_path is None:
            return None
        # So khớp DEFAULT_BOARD trước
        if real_path == _kdb._db_path_for_slug(_kdb.DEFAULT_BOARD).resolve():
            return _kdb.DEFAULT_BOARD
        # Rồi tất cả các board đang tồn tại
        try:
            boards = _kdb.list_boards(include_archived=True)
        except Exception:
            boards = []
        for board_meta in boards:
            slug = board_meta.get("slug") or board_meta.get("name", "")
            if not slug:
                continue
            try:
                if real_path == _kdb._db_path_for_slug(slug).resolve():
                    return slug
            except Exception:
                pass
    except Exception as exc:
        _log.debug("board_slug_of_conn failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# auto_move_enabled
# ---------------------------------------------------------------------------

def auto_move_enabled() -> bool:
    """True khi config ``kanban.team_board_guard.auto_move`` bật."""
    try:
        cfg = _load_kanban_config()
        guard_cfg = cfg.get("team_board_guard")
        if isinstance(guard_cfg, dict):
            return bool(guard_cfg.get("auto_move", False))
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# record_violation
# ---------------------------------------------------------------------------

_VIOLATION_MARKER = "⚠️ LATCH BẢNG VẬN HÀNH:"


def record_violation(
    conn: sqlite3.Connection,
    *,
    task_id: str,
    board_slug: str,
    assignee: str,
    action: str,
    moved_to: Optional[str] = None,
) -> None:
    """Ghi vết vi phạm IDEMPOTENT lên thẻ ``task_id``.

    Chỉ ghi nếu chưa có comment chứa marker. Dùng add_comment + _append_event
    của kanban_db. Bọc tất cả trong try/except để không làm hỏng tick dispatch.
    """
    try:
        from hermes_cli import kanban_db as _kdb
        # Kiểm tra idempotent: đã có comment với marker chưa?
        existing = conn.execute(
            "SELECT 1 FROM task_comments WHERE task_id = ? AND body LIKE ?",
            (task_id, f"%{_VIOLATION_MARKER}%"),
        ).fetchone()
        if existing:
            return

        move_info = f" → đã chuyển sang bảng {moved_to} (thẻ mới)" if moved_to else ""
        body = (
            f"{_VIOLATION_MARKER} assignee '{assignee}' thuộc đội nhưng thẻ "
            f"nằm trên bảng '{board_slug}' thay vì bảng vận hành '{team_board()}'. "
            f"action={action}{move_info}"
        )
        _kdb.add_comment(conn, task_id, "kanban-team-guard", body)
        with _kdb.write_txn(conn):
            _kdb._append_event(
                conn,
                task_id,
                "team_board_guard",
                {
                    "board_slug": board_slug,
                    "assignee": assignee,
                    "team_board": team_board(),
                    "action": action,
                    "moved_to": moved_to,
                },
            )
    except Exception as exc:
        _log.debug("record_violation failed for task %s: %s", task_id, exc)


# ---------------------------------------------------------------------------
# move_task_to_team_board
# ---------------------------------------------------------------------------

def move_task_to_team_board(
    conn: sqlite3.Connection,
    *,
    task_id: str,
    board_slug: str,
) -> tuple[Optional[str], str]:
    """Chuyển thẻ sang bảng vận hành khi an toàn.

    CHỈ chuyển khi thẻ có status ``'ready'``, KHÔNG có liên kết cha/con,
    và KHÔNG có run đang chạy. Ngược lại trả ``(None, "needs_manual_move: ...")``.
    Trả ``(new_id, "moved")`` khi thành công.
    """
    try:
        from hermes_cli import kanban_db as _kdb

        # Kiểm tra trạng thái thẻ
        row = conn.execute(
            "SELECT title, body, assignee, priority, status, tenant "
            "FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        if row is None:
            return (None, "needs_manual_move: thẻ không tồn tại")

        if row["status"] != "ready":
            return (None, f"needs_manual_move: status={row['status']} (cần ready)")

        # Kiểm tra liên kết cha/con
        link_count = conn.execute(
            "SELECT COUNT(*) FROM task_links "
            "WHERE parent_id = ? OR child_id = ?",
            (task_id, task_id),
        ).fetchone()[0]
        if link_count:
            return (None, "needs_manual_move: có liên kết cha/con")

        # Kiểm tra run đang chạy
        active_run = conn.execute(
            "SELECT 1 FROM task_runs WHERE task_id = ? AND status = 'running'",
            (task_id,),
        ).fetchone()
        if active_run:
            return (None, "needs_manual_move: có run đang chạy")

        # Tạo thẻ mới trên bảng vận hành
        target_board = team_board()
        conn_team = _kdb.connect(board=target_board)
        try:
            # VALID_INITIAL_STATUSES = {"running", "blocked"} — "ready" không hợp lệ.
            # Tạo ở "blocked" rồi unblock_task để chuyển sang "ready".
            new_id = _kdb.create_task(
                conn_team,
                title=row["title"],
                body=row["body"],
                assignee=row["assignee"],
                created_by="kanban-team-guard",
                priority=int(row["priority"] or 0),
                tenant=row["tenant"],
                initial_status="blocked",
            )
            _kdb.unblock_task(conn_team, new_id)
            # Đọc lại để xác nhận; chỉ archive gốc khi thẻ mới thực sự ready
            new_row = conn_team.execute(
                "SELECT status FROM tasks WHERE id = ?", (new_id,)
            ).fetchone()
            if new_row is None or new_row["status"] != "ready":
                return (
                    None,
                    f"needs_manual_move: thẻ mới {new_id} ở {new_row['status'] if new_row else '?'} thay vì ready",
                )
            _kdb.add_comment(
                conn_team,
                new_id,
                "kanban-team-guard",
                f"chuyển từ bảng {board_slug}, thẻ gốc {task_id} — lý do: thẻ đội nằm sai bảng",
            )
        finally:
            conn_team.close()

        # Ghi vết trên thẻ gốc rồi archive
        _kdb.add_comment(
            conn,
            task_id,
            "kanban-team-guard",
            f"→ đã chuyển sang bảng vận hành (thẻ mới {new_id})",
        )
        with _kdb.write_txn(conn):
            conn.execute(
                "UPDATE tasks SET status = 'archived' WHERE id = ?",
                (task_id,),
            )
            _kdb._append_event(
                conn,
                task_id,
                "team_board_guard_archived",
                {"moved_to_board": target_board, "new_task_id": new_id},
            )

        return (new_id, "moved")

    except Exception as exc:
        _log.warning("move_task_to_team_board failed for task %s: %s", task_id, exc)
        return (None, f"needs_manual_move: lỗi khi chuyển: {exc}")


# ---------------------------------------------------------------------------
# effective_target_board
# ---------------------------------------------------------------------------

def effective_target_board(board_arg: Optional[str] = None) -> str:
    """Bảng đích hiệu lực theo thứ tự ưu tiên đầy đủ.

    Thứ tự: HERMES_KANBAN_DB (→ slug) → board_arg → HERMES_KANBAN_BOARD
    → kanban_db.get_current_board() → DEFAULT_BOARD.

    Dùng khi tạo thẻ để đảm bảo HERMES_KANBAN_DB (pin worker-level) được
    tôn trọng trước HERMES_KANBAN_BOARD — tránh tạo thẻ nhầm bảng khi chỉ
    HERMES_KANBAN_DB trỏ bảng khác.
    """
    from hermes_cli import kanban_db as _kdb

    # 1. HERMES_KANBAN_DB: map path → slug
    db_env = os.environ.get("HERMES_KANBAN_DB", "").strip()
    if db_env:
        try:
            db_path = Path(db_env).expanduser().resolve()
            if db_path == _kdb._db_path_for_slug(_kdb.DEFAULT_BOARD).resolve():
                return _kdb.DEFAULT_BOARD
            try:
                for board_meta in _kdb.list_boards(include_archived=True):
                    slug = board_meta.get("slug") or board_meta.get("name", "")
                    if not slug:
                        continue
                    try:
                        if db_path == _kdb._db_path_for_slug(slug).resolve():
                            return slug
                    except Exception:
                        pass
            except Exception:
                pass
        except Exception:
            pass

    # 2. board_arg trực tiếp
    if board_arg and str(board_arg).strip():
        return str(board_arg).strip()

    # 3. HERMES_KANBAN_BOARD env
    board_env = os.environ.get("HERMES_KANBAN_BOARD", "").strip()
    if board_env:
        return board_env

    # 4. get_current_board() (đọc ContextVar, current file, DEFAULT_BOARD)
    try:
        return _kdb.get_current_board()
    except Exception:
        pass

    return _kdb.DEFAULT_BOARD
