"""Đọc tên công ty để dùng trong UI host (hermes_cli).

Thứ tự tra (giống company_identity.py nhưng KHÔNG import plugin):
  a) HERMES_POCLIP_CONSTITUTION_PATH env nếu có;
  b) <repo>/plugins/hermes-poclip/config/constitution.yaml;
  c) nếu rỗng hoặc bắt đầu bằng "REPLACE" → thử interview_answers
     trong genesis_sessions (DB tại HERMES_POCLIP_DB_PATH);
  d) vẫn rỗng → trả về "".

Mọi lỗi đều NUỐT. KHÔNG import hermes_poclip (plugin).
"""
from __future__ import annotations

import json
import logging
import os
import re
import sqlite3
from pathlib import Path

_log = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_CONSTITUTION = _REPO_ROOT / "plugins" / "hermes-poclip" / "config" / "constitution.yaml"

DEFAULT_COMPANY_NAME = "Hermes+"
LEGACY_DEFAULT = "Hermes SME Studio"


def _resolve_constitution_path() -> Path:
    env = os.environ.get("HERMES_POCLIP_CONSTITUTION_PATH", "").strip()
    return Path(env) if env else _DEFAULT_CONSTITUTION


def _parse_source_marker(path: Path) -> str | None:
    """Đọc company_name_source; trả 'user', 'seed', hoặc None nếu không có."""
    try:
        text = path.read_text(encoding="utf-8")
        m = re.search(r"(?m)^\s*company_name_source:\s*(.+)$", text)
        if not m:
            return None
        raw = m.group(1).strip().strip('"\'')
        return raw if raw in ("user", "seed") else None
    except Exception:
        return None


def _parse_constitution_value(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8")
        m = re.search(r"(?m)^\s*company_name:\s*(.+)$", text)
        if not m:
            return ""
        raw = m.group(1).strip()
        if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ('"', "'"):
            raw = raw[1:-1].strip()
        return raw
    except Exception:
        return ""


def _read_from_db() -> str:
    db_path = os.environ.get("HERMES_POCLIP_DB_PATH", "").strip()
    if not db_path:
        return ""
    try:
        conn = sqlite3.connect(db_path, timeout=3)
        try:
            row = conn.execute(
                "SELECT interview_answers FROM genesis_sessions"
                " WHERE interview_answers IS NOT NULL"
                " ORDER BY rowid DESC LIMIT 1"
            ).fetchone()
            if not row or not row[0]:
                return ""
            data = json.loads(row[0])
            return str(data.get("company_name") or "").strip()
        finally:
            conn.close()
    except Exception:
        return ""


def _read_company_name_raw() -> str:
    """Đọc tên thô từ constitution hoặc DB, trả "" nếu không tìm được."""
    path = _resolve_constitution_path()
    name = _parse_constitution_value(path)
    if not name or name.upper().startswith("REPLACE"):
        name = _read_from_db()
    elif name in (DEFAULT_COMPANY_NAME, LEGACY_DEFAULT):
        # Tệp còn tên mặc định (ví dụ bị bản cài/cập nhật ghi đè) nhưng Chủ tịch đã đặt tên ở trình lập công ty → lấy tên đó
        name = _read_from_db() or name
    return name


def company_name_is_user_set() -> bool:
    """True nếu Chủ tịch đã chủ động đặt tên công ty.

    Phân biệt theo company_name_source trong constitution.yaml:
      "user"  -> đã đặt (True)
      "seed"  -> chưa đặt (False)
      không có marker (bản cài cũ): tên không rỗng VÀ không thuộc nhóm mặc định -> True
    """
    path = _resolve_constitution_path()
    marker = _parse_source_marker(path)
    if marker == "user":
        return True
    if marker == "seed":
        return False
    # bản cài cũ không có marker
    name = _parse_constitution_value(path)
    if not name:
        return False
    if name.upper().startswith("REPLACE"):
        return False
    if name in (DEFAULT_COMPANY_NAME, LEGACY_DEFAULT):
        return False
    return True


def company_display_name() -> str:
    """Tên hiển thị công ty. Luôn trả giá trị có nghĩa (không bao giờ rỗng).

    Theo QĐ-3: trả DEFAULT_COMPANY_NAME khi tên thô rỗng hoặc bằng mặc định.
    """
    name = _read_company_name_raw()
    if name and name != DEFAULT_COMPANY_NAME:
        return name
    return DEFAULT_COMPANY_NAME
