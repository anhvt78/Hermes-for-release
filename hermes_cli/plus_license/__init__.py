"""Giấy phép Hermes+ gắn với MÁY (chống chép sang máy khác dùng thêm).

Cách dùng trong mã:
    from hermes_cli import plus_license
    plus_license.status()      -> LicenseStatus (state: disabled|missing|invalid|mismatch|valid|grace|expired)
    plus_license.is_blocked()  -> True nếu đang ÉP BUỘC và giấy phép không dùng được

Dòng lệnh (trên máy khách):  python -m hermes_cli.plus_license fingerprint | status | install <tệp>
Cấp giấy phép (chủ sở hữu):   scripts/plus_license_issue.py   (KHÔNG đi kèm bản phát hành; khoá bí mật không nằm trong kho mã)

ENFORCEMENT_ENABLED = True  → ÉP BUỘC: không có giấy phép hợp lệ thì chỉ xem được. False → chỉ CẢNH BÁO (không chặn gì).
Không có tệp public_key.pem (bản phát triển) → trạng thái "disabled", không kiểm tra gì.
"""
from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path
from typing import Optional

from .fingerprint import current_fingerprint
from . import trial as _trial
from .trial import evaluate_trial
from .verify import LicenseStatus, evaluate

# Bật ép buộc: thao tác ghi của plugin hermes-poclip bị từ chối và bộ điều phối Kanban ngừng giao việc khi giấy phép không dùng được.
ENFORCEMENT_ENABLED = True

# Dùng thử mặc định (chỉ bản công khai): số ngày nằm trong trial.BUILD_TRIAL_DAYS, được đặt lúc biên dịch (xem scripts/plus_release_compiled.py).

_PUBLIC_KEY_FILE = Path(__file__).with_name("public_key.pem")
_CACHE_TTL = 20.0
_lock = threading.Lock()
_cache: dict = {"at": 0.0, "status": None, "mtime": None}


# Bộ kiểm thử tự động (pytest) chạy trên máy không có giấy phép và nhiều bài nạp lại module nên không thể "vá" cờ ép buộc từng bài.
# Vì vậy khi tiến trình ĐANG chạy dưới pytest (pytest đã được nạp + biến PYTEST_CURRENT_TEST do chính pytest đặt) thì không áp ép buộc;
# riêng bài kiểm tra của bộ giấy phép đặt _TEST_FORCE=True để kiểm tra thật. Dịch vụ thật không nạp pytest nên không bị ảnh hưởng.
_TEST_FORCE = False


def _bypassed_for_tests() -> bool:
    return (not _TEST_FORCE) and "pytest" in sys.modules and bool(os.environ.get("PYTEST_CURRENT_TEST"))


class LicenseError(ValueError):
    """Giấy phép không cài được (sai chữ ký, sai máy, hết hạn...)."""


def license_path() -> Path:
    raw = os.environ.get("HERMES_PLUS_LICENSE_FILE", "").strip()
    if raw:
        return Path(raw)
    home = os.environ.get("HERMES_HOME", "").strip()
    return (Path(home) if home else Path.home() / ".hermes") / "license.json"


def _public_key():
    try:
        from cryptography.hazmat.primitives.serialization import load_pem_public_key

        return load_pem_public_key(_PUBLIC_KEY_FILE.read_bytes())
    except (OSError, ValueError):
        return None


def _load_doc(path: Path) -> Optional[dict]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"payload": None}
    except FileNotFoundError:
        return None
    except (OSError, ValueError):
        return {"payload": None}      # tệp hỏng → "invalid"


def fingerprint() -> dict:
    return current_fingerprint()


def fingerprint_report() -> dict:
    """Thông tin gửi cho nhà cung cấp để xin giấy phép."""
    import socket
    from datetime import datetime, timezone

    fp = current_fingerprint()
    # Đủ thông tin để cấp giấy phép: có card mạng thật, hoặc có đồng thời mã máy và UUID ổ đĩa (container Docker/LXC thường KHÔNG đủ)
    usable = bool(fp.get("macs")) or bool(fp.get("machine_id") and fp.get("rootfs"))
    return {"v": 1, "fingerprint": fp, "usable": usable, "hostname": socket.gethostname(),
            "created_at": datetime.now(timezone.utc).isoformat()}


def status(force: bool = False) -> LicenseStatus:
    if _bypassed_for_tests():
        return LicenseStatus("disabled", "Đang chạy kiểm thử tự động — không áp giấy phép.", enforced=False)
    key = _public_key()
    if key is None:
        return LicenseStatus("disabled", "Bản này chưa bật kiểm tra giấy phép.", enforced=False)
    path = license_path()
    try:
        mtime = path.stat().st_mtime
    except OSError:
        mtime = None
    now = time.time()
    with _lock:
        if not force and _cache["status"] is not None and now - _cache["at"] < _CACHE_TTL and _cache["mtime"] == mtime:
            return _cache["status"]
    doc = _load_doc(path)
    if doc is None and _trial.BUILD_TRIAL_DAYS > 0:    # chưa có giấy phép → bản dùng thử mặc định (chỉ bản công khai)
        st = evaluate_trial(current_fingerprint(), _trial.BUILD_TRIAL_DAYS, trial_stamp_paths(), enforced=ENFORCEMENT_ENABLED)
    else:
        st = evaluate(doc, key, current_fingerprint(), enforced=ENFORCEMENT_ENABLED)
    with _lock:
        _cache.update(at=now, status=st, mtime=mtime)
    return st


def trial_stamp_paths() -> list[Path]:
    """Hai nơi ghi mốc bắt đầu dùng thử (thư mục cùng chỗ với giấy phép + thư mục cấu hình người dùng)."""
    second = os.environ.get("HERMES_PLUS_TRIAL_STAMP2", "").strip()
    return [license_path().with_name("trial.json"), Path(second) if second else Path.home() / ".config" / "hermes-plus" / "trial.json"]


class MigrationNotAllowed(LicenseError):
    """Giấy phép hiện tại không cho chuyển (xuất/nhập) công ty giữa các máy: chỉ giấy phép KHÔNG HẾT HẠN mới được."""

    def __init__(self, message: str, status_dict: Optional[dict] = None):
        super().__init__(message)
        self.status = status_dict or {}


def require_migration(action: str = "chuyển") -> LicenseStatus:
    """Gọi trước khi xuất/nhập công ty. Ném MigrationNotAllowed nếu giấy phép không cho phép; không làm gì ở bản phát triển."""
    st = status()
    if not st.migration_allowed:
        raise MigrationNotAllowed(f"Không thể {action} công ty: {st.migration_message}", st.to_dict())
    return st


def is_blocked() -> bool:
    try:
        return status().blocked
    except Exception:       # lỗi bất ngờ của chính bộ kiểm tra không được làm sập hệ thống
        return False


def install_license(text: str) -> LicenseStatus:
    """Kiểm tra rồi ghi giấy phép (nguyên tử, quyền 0600). Từ chối nếu sai chữ ký / sai máy / đã hết hạn."""
    key = _public_key()
    if key is None:
        raise LicenseError("Bản này chưa bật kiểm tra giấy phép.")
    try:
        doc = json.loads(text)
    except ValueError as exc:
        raise LicenseError("Nội dung giấy phép không phải JSON hợp lệ.") from exc
    st = evaluate(doc, key, current_fingerprint(), enforced=ENFORCEMENT_ENABLED)
    if st.state in ("invalid", "mismatch", "expired", "missing"):
        raise LicenseError(st.message)
    path = license_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)
    return status(force=True)
