#!/usr/bin/env python3
"""Cài GÓI CÔNG TY ĐI KÈM bản cài Hermes+ (ví dụ «công ty phần mềm») vào máy mới. Dạng «chỉ sổ»: không tuyển nhân viên thật, không cần khoá API.

    python company_install_pack.py --list
    python company_install_pack.py --pack software --db /var/lib/hermes-plus/poclip.db --home /var/lib/hermes-plus

Gói ở <gốc bản cài>/company-packs/ (index.json + tệp .hpcompany). Máy phải chưa lập công ty (sổ trống). Cài lần hai: «đã nhập gói này rồi», không đổi gì.
Sau khi nhập khoá mô hình, tuyển nhân viên thật bằng «Xuất, nhập công ty» trên bảng điều khiển hoặc `company_import.py --hire …` với cùng gói.
Mã thoát: 0 = xong (hoặc đã có); 1 = không cài được (lý do in ra); 2 = dùng sai.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
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
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list", action="store_true", help="liệt kê các gói đi kèm")
    ap.add_argument("--pack", help="mã gói (ví dụ software)")
    ap.add_argument("--db", default=os.environ.get("HERMES_POCLIP_DB_PATH"))
    ap.add_argument("--home", default=os.environ.get("HERMES_HOME"))
    ap.add_argument("--packs-dir", help="thư mục gói (mặc định: <gốc bản cài>/company-packs)")
    ap.add_argument("--json", action="store_true", help="in kết quả dạng JSON")
    a = ap.parse_args(argv)
    _load_plugin()
    from hermes_poclip.company_package.bundled import BundledPackError, install_pack, list_packs

    if a.list:
        packs = list_packs(a.packs_dir)
        if a.json:
            print(json.dumps(packs, ensure_ascii=False, indent=1))
        else:
            for p in packs:
                print(f"{p['id']}\t{p['label']}\t{p['size'] // 1024} KB\t{'sẵn sàng' if p['available'] else 'KHÔNG DÙNG ĐƯỢC: ' + str(p['problem'])}")
            if not packs:
                print("(không có gói đi kèm)")
        return 0
    if not a.pack or not a.db:
        print("Cần --pack và --db (hoặc biến môi trường HERMES_POCLIP_DB_PATH).", file=sys.stderr)
        return 2
    if a.home:
        os.environ.setdefault("HERMES_HOME", a.home)
    try:
        r = install_pack(a.pack, a.db, a.home, packs_path=a.packs_dir, progress=lambda m: print(m, flush=True))
    except BundledPackError as exc:
        print(f"KHÔNG CÀI ĐƯỢC: {exc}", file=sys.stderr)
        return 1
    if a.json:
        print(json.dumps(r, ensure_ascii=False, indent=1, default=str))
    else:
        print("Kết quả:", r.get("trạng thái") or r.get("status") or "xong")
    return 0


if __name__ == "__main__":
    sys.exit(main())
