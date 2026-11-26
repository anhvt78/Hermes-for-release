#!/usr/bin/env python3
"""Dựng GÓI ĐI KÈM bản cài (company-packs/<mã>.hpcompany + index.json) từ MỘT công ty mẫu đang có sổ dữ liệu. Chỉ đọc máy nguồn.

    python company_make_bundle.py --id software --label "Công ty phần mềm AI" --db /đường/dẫn/poclip.db --home /đường/dẫn/hermes-home \\
        --out-dir <gốc bản cài>/company-packs [--description "..."]

Khác «Xuất công ty» thường: bỏ khỏi thư mục company/ các TÀI LIỆU và CÔNG CỤ NỘI BỘ (tools/, README.md, phiếu lập công ty ghi máy thật…) vì bản đi kèm
cho mọi người dùng; không bộ nhớ nhân viên; dừng nếu quét thấy bí mật hoặc thấy dấu vết máy nội bộ (địa chỉ IP, đường dẫn /home/…).
Mã thoát: 0 = xong; 1 = dừng vì phát hiện dữ liệu không nên phát hành; 2 = dùng sai.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

EXCLUDE_TOP = ("tools", "README.md", "PHIEU-LAP-CONG-TY.md", "GHI-CHU-DOC-TAI-LIEU-V04.md")
# dấu vết máy/người cụ thể không được lọt vào bản phát hành công khai
FORBIDDEN = (
    (re.compile(r"\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?\b"), "địa chỉ IP nội bộ"),
    (re.compile(r"/home/[a-z0-9_-]+/"), "đường dẫn thư mục người dùng"),
    (re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "địa chỉ email"),
    (re.compile(r"\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{16,}|xox[bp]-[A-Za-z0-9-]{10,})"), "giống khoá API"),
)


def _load_plugin():
    plug = Path(__file__).resolve().parent.parent
    if "hermes_poclip" not in sys.modules:
        spec = importlib.util.spec_from_file_location("hermes_poclip", plug / "__init__.py", submodule_search_locations=[str(plug)])
        mod = importlib.util.module_from_spec(spec)
        sys.modules["hermes_poclip"] = mod
        spec.loader.exec_module(mod)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--id", required=True, help="mã gói, chữ thường không dấu (vd software)")
    ap.add_argument("--label", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--db", default=os.environ.get("HERMES_POCLIP_DB_PATH"))
    ap.add_argument("--home", default=os.environ.get("HERMES_HOME"))
    ap.add_argument("--out-dir", required=True)
    a = ap.parse_args(argv)
    if not re.fullmatch(r"[a-z][a-z0-9-]{0,30}", a.id) or not a.db:
        print("Mã gói không hợp lệ hoặc thiếu --db.", file=sys.stderr)
        return 2
    _load_plugin()
    from hermes_poclip.company_package import ExportBlocked, build_package, pack_bytes, verify_package

    try:
        files, report = build_package(a.db, a.home, memory_profiles=None, company_dir_exclude=EXCLUDE_TOP)
    except ExportBlocked as exc:
        print("DỪNG: quét thấy chỗ nghi là bí mật:", file=sys.stderr)
        for f in exc.findings:
            print(f"  - {f.file} dòng {f.line}: {f.kind}", file=sys.stderr)
        return 1
    bad = []
    for name, data in sorted(files.items()):
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        for rx, what in FORBIDDEN:
            m = rx.search(text)
            if m:
                bad.append((name, what, m.group(0)[:40]))
    if bad:
        print("DỪNG: có dấu vết không nên phát hành công khai:", file=sys.stderr)
        for n, w, s in bad[:20]:
            print(f"  - {n}: {w} («{s}»)", file=sys.stderr)
        return 1
    blob = pack_bytes(files, None)
    chk = verify_package(blob, None)
    if not chk["ok"]:
        print("DỪNG: gói vừa dựng không qua kiểm tra nguyên vẹn:", chk["errors"], file=sys.stderr)
        return 1
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    fname = f"{a.id}-company.hpcompany"
    (out / fname).write_bytes(blob)
    manifest = chk["manifest"] or {}
    entry = {
        "id": a.id, "label": a.label, "description": a.description, "file": fname, "size": len(blob),
        "sha256": hashlib.sha256(blob).hexdigest(), "files": len(files),
        "staff": (manifest.get("counts", {}).get("agent_profiles", {}) or {}).get("xuất"),
        "company_name": manifest.get("company_name"), "source_release": manifest.get("source_release_id"),
    }
    idx_path = out / "index.json"
    packs = []
    if idx_path.is_file():
        try:
            packs = [p for p in (json.loads(idx_path.read_text(encoding="utf-8")).get("packs") or []) if p.get("id") != a.id]
        except (OSError, ValueError):
            packs = []
    packs.append(entry)
    idx_path.write_text(json.dumps({"format": 1, "packs": sorted(packs, key=lambda p: p["id"])}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({"đã ghi": str(out / fname), **entry}, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
