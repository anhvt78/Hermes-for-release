#!/usr/bin/env python3
"""Công cụ vận hành: rà soát và sửa vòng đời nhân sự (lifecycle_stage) trong DB.

Chạy khô (không --apply): chỉ in bảng phát hiện, không ghi DB.
Chạy thật (--apply): hạ lifecycle_stage về expected_stage với các dòng over-claim.

Ví dụ:
    python scripts/lifecycle_reconcile.py --db /path/to/poclip.db
    python scripts/lifecycle_reconcile.py --db /path/to/poclip.db --profile agent-abc --apply
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

# Đăng ký package phẳng giống tests/conftest.py
REPO_ROOT = Path(__file__).parent.parent

if "hermes_poclip" not in sys.modules:
    _spec = importlib.util.spec_from_file_location(
        "hermes_poclip", REPO_ROOT / "__init__.py",
        submodule_search_locations=[str(REPO_ROOT)],
    )
    _module = importlib.util.module_from_spec(_spec)
    sys.modules["hermes_poclip"] = _module
    _spec.loader.exec_module(_module)


from hermes_poclip.org.lifecycle import reconcile_lifecycle


def _print_table(findings: list[dict]) -> None:
    if not findings:
        print("  (không có phát hiện)")
        return
    header = f"{'profile_id':<35} {'actual':<25} {'expected':<25} step  reason"
    print(header)
    print("-" * len(header))
    for f in findings:
        print(
            f"  {f['profile_id']:<33} {f['actual']:<23} {f['expected']:<23}"
            f" {f['wizard_step_completed']:<5} {f['reason']}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rà soát và sửa vòng đời nhân sự (lifecycle_stage)."
    )
    parser.add_argument(
        "--db",
        metavar="DUONG_DAN",
        help="Đường dẫn file DB SQLite (mặc định: env HERMES_POCLIP_DB_PATH).",
    )
    parser.add_argument(
        "--profile",
        dest="profile_ids",
        metavar="ID",
        action="append",
        help="Giới hạn phạm vi theo profile_id (có thể lặp nhiều lần).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Thực sự ghi DB (mặc định: chỉ chạy khô).",
    )
    args = parser.parse_args()

    result = reconcile_lifecycle(
        db_path=args.db or None,
        profile_ids=args.profile_ids or None,
        apply=args.apply,
    )

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"\n=== lifecycle_reconcile [{mode}] ===")
    print(f"Đã kiểm: {result['checked']} dòng")
    print(f"Phát hiện: {len(result['findings'])} dòng over-claim")
    if args.apply:
        print(f"Đã sửa: {result['applied']} dòng")

    print("\nBảng phát hiện:")
    _print_table(result["findings"])

    if not args.apply and result["findings"]:
        print(
            f"\nChạy lại với --apply để hạ {len(result['findings'])} dòng về expected_stage."
        )
    elif args.apply and result["applied"] > 0:
        print(f"\nĐã hạ {result['applied']} dòng về expected_stage trong DB.")
    elif args.apply:
        print("\nKhông có gì cần sửa.")

    print()


if __name__ == "__main__":
    main()
