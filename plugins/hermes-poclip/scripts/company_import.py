#!/usr/bin/env python3
"""Nhập cấu hình công ty từ gói .hpcompany vào MÁY TRỐNG (giai đoạn 2: chưa tuyển nhân viên thật). Thiết kế: THIET-KE-XUAT-NHAP-CONG-TY.md.

    python company_import.py --package cong-ty.hpcompany --db /var/lib/hermes-plus/poclip.db --home /var/lib/hermes-plus --dry-run
    python company_import.py --package cong-ty.hpcompany --db ... --home ... --apply [--ack-warnings] [--password-env VAR]
    # kèm TUYỂN NHÂN VIÊN THẬT (giai đoạn 3; mỗi người tốn 1 lần gọi mô hình; khoá API đưa qua biến môi trường, không có trong gói):
    python company_import.py ... --apply --hire --model-provider deepseek --model-name deepseek-chat --model-key-env DEEPSEEK_API_KEY

Mặc định (không có --apply) chỉ KIỂM TRA TRƯỚC và in kế hoạch; không ghi gì. Có --apply: sao lưu sổ dữ liệu rồi ghi theo từng bước.
Mã thoát: 0 = thành công; 1 = bị từ chối / lỗi kiểm tra; 2 = dùng sai; 4 = nhập dừng giữa chừng (có thể chạy lại cùng gói để tiếp tục).
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
    from hermes_poclip.company_package.cli import import_main

    return import_main(argv)


if __name__ == "__main__":
    raise SystemExit(main())
