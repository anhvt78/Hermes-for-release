#!/usr/bin/env python3
"""Xuất công ty thành gói .hpcompany (CHỈ ĐỌC máy nguồn). Thiết kế: THIET-KE-XUAT-NHAP-CONG-TY.md.

    python company_export.py --db /var/lib/hermes-plus/poclip.db --home /var/lib/hermes-plus --out cong-ty.hpcompany
    python company_export.py --db ... --home ... --dry-run                 # chỉ in báo cáo thử, không tạo gói
    python company_export.py ... --password-env HPCOMPANY_PASSWORD        # mã hoá gói (mật khẩu lấy từ biến môi trường, không gõ trên dòng lệnh)
    python company_export.py --verify cong-ty.hpcompany [--password-env VAR]

Thấy bí mật trong nội dung thì dừng (mã thoát 3) và chỉ nêu tệp/loại/dòng, không in giá trị.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def _load_plugin():
    plug = Path(__file__).resolve().parent.parent
    if "hermes_poclip" not in sys.modules:
        spec = importlib.util.spec_from_file_location("hermes_poclip", plug / "__init__.py", submodule_search_locations=[str(plug)])
        mod = importlib.util.module_from_spec(spec)
        sys.modules["hermes_poclip"] = mod
        spec.loader.exec_module(mod)


def main(argv=None) -> int:
    _load_plugin()
    from hermes_poclip.company_package.cli import export_main

    return export_main(argv)


if __name__ == "__main__":
    raise SystemExit(main())
