"""CLI sinh lại Cẩm nang vận hành công ty (Operating Handbook).

Đăng ký package hermes_poclip thủ công (flat-package layout — thư mục cha có
gạch ngang, không phải identifier Python hợp lệ), rồi gọi handbook.main().

Ví dụ gọi:
  # 1. Sinh lại từ DB mặc định (HERMES_POCLIP_DB_PATH hoặc poclip_db_path()):
  python3 plugins/hermes-poclip/scripts/generate_handbook.py

  # 2. Sinh lại với DB chỉ định:
  python3 plugins/hermes-poclip/scripts/generate_handbook.py --db /tmp/hb_demo/db1.db

  # 3. Kiểm tra lệch (exit 0 nếu OK, exit 1 nếu lệch):
  python3 plugins/hermes-poclip/scripts/generate_handbook.py --check

  # 4. Xuất JSON (kết hợp với --check hoặc không):
  python3 plugins/hermes-poclip/scripts/generate_handbook.py --json
  python3 plugins/hermes-poclip/scripts/generate_handbook.py --check --json
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

# Đăng ký hermes_poclip thủ công — kỹ thuật giống tests/pa-m1/conftest.py
_REPO_ROOT = Path(__file__).resolve().parent.parent  # plugins/hermes-poclip/
if "hermes_poclip" not in sys.modules:
    _spec = importlib.util.spec_from_file_location(
        "hermes_poclip",
        _REPO_ROOT / "__init__.py",
        submodule_search_locations=[str(_REPO_ROOT)],
    )
    _module = importlib.util.module_from_spec(_spec)
    sys.modules["hermes_poclip"] = _module
    _spec.loader.exec_module(_module)

from hermes_poclip.handbook import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
