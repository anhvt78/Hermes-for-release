"""Bootstrap plugin hermes-poclip khi hermes-agent (`hermes dashboard`) khởi động.

Được host (`hermes_cli/web_server.py::_mount_plugin_api_routes`) import ĐÚNG 1 LẦN
bằng `importlib.util.spec_from_file_location` lúc module-level (trước khi uvicorn
server được tạo — CHƯA có asyncio event loop chạy tại thời điểm này). Vì vậy code
ở đây chỉ làm việc đồng bộ (đăng ký package, gọi bootstrap DB, gộp router) — KHÔNG
khởi tạo bất kỳ đối tượng nào cần event loop đang sống (TimerGuard, realtime hub
tự lazy-bind `asyncio.get_running_loop()` bên trong request handler).

Thư mục plugin (`plugins/hermes-poclip/`) chứa TRỰC TIẾP package `hermes_poclip`
(cấu trúc phẳng — agents/, api/, app.py... nằm ngay tại đây, không lồng thêm 1 cấp
`hermes_poclip/` như trước). Vì tên thư mục trên đĩa có dấu gạch ngang
(`hermes-poclip`, không phải định danh Python hợp lệ), không thể `import
hermes_poclip` qua `sys.path` thông thường — phải đăng ký thủ công vào
`sys.modules["hermes_poclip"]` bằng `importlib.util.spec_from_file_location`
(cùng kỹ thuật mà `hermes_cli/plugins.py::_load_directory_module` dùng cho các
plugin có tên gạch ngang khác). Toàn bộ ~130 file bên trong vẫn dùng nguyên
`from hermes_poclip.xxx import yyy` không đổi gì.

`router` là export bắt buộc — host mount nó tại `/api/plugins/hermes-poclip/...`
(fallback, luôn có). Đường dẫn CHÍNH `/api/v1/...` mà API-3D.md đã cam kết cho bộ
phận 3D được mount riêng bằng patch nhỏ ở `hermes_cli/web_server.py` (xem
`docs/adr-03-patch-log.md` của hermes-poclip, mục Phase 3) — patch đó gọi lại
đúng `hermes_poclip.app.build_api_router()`, không định nghĩa route trùng.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_PLUGIN_ROOT = Path(__file__).resolve().parent.parent

if "hermes_poclip" not in sys.modules:
    _spec = importlib.util.spec_from_file_location(
        "hermes_poclip",
        _PLUGIN_ROOT / "__init__.py",
        submodule_search_locations=[str(_PLUGIN_ROOT)],
    )
    _module = importlib.util.module_from_spec(_spec)
    sys.modules["hermes_poclip"] = _module
    _spec.loader.exec_module(_module)

from hermes_poclip.plugin_bootstrap import ensure_bootstrapped  # noqa: E402

ensure_bootstrapped()

from hermes_poclip.app import build_api_router  # noqa: E402

router = build_api_router()
