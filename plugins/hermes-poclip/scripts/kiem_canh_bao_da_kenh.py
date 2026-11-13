#!/usr/bin/env python3
"""Script tự kiểm cảnh báo đa kênh — dùng trên BẢN SAO DB.

KHÔNG BAO GIỜ ghi vào DB gốc. Tự copy sang /tmp trước khi thao tác.

Sử dụng:
  python plugins/hermes-poclip/scripts/kiem_canh_bao_da_kenh.py --db <path.db>
  python plugins/hermes-poclip/scripts/kiem_canh_bao_da_kenh.py --db hermes-poclip.db
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if "hermes_poclip" not in sys.modules:
    _spec = importlib.util.spec_from_file_location(
        "hermes_poclip",
        REPO_ROOT / "__init__.py",
        submodule_search_locations=[str(REPO_ROOT)],
    )
    _module = importlib.util.module_from_spec(_spec)
    sys.modules["hermes_poclip"] = _module
    _spec.loader.exec_module(_module)


def _fmt_table(rows: list[dict], cols: list[str]) -> str:
    widths = {c: max(len(c), *(len(str(r.get(c, "") or "")) for r in rows)) for c in cols}
    sep = "+" + "+".join("-" * (w + 2) for w in widths.values()) + "+"
    header = "|" + "|".join(f" {c:<{widths[c]}} " for c in cols) + "|"
    lines = [sep, header, sep]
    for r in rows:
        lines.append("|" + "|".join(f" {str(r.get(c,'') or ''):<{widths[c]}} " for c in cols) + "|")
    lines.append(sep)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Tự kiểm cảnh báo đa kênh (chạy trên bản sao DB)")
    parser.add_argument("--db", required=True, help="Đường dẫn DB gốc")
    parser.add_argument("--limit", type=int, default=5, help="Số thông báo khô (dry_run) cần kiểm")
    args = parser.parse_args()

    db_src = Path(args.db)
    if not db_src.exists():
        print(f"[LỖI] Không tìm thấy DB: {db_src}")
        sys.exit(1)

    # Copy sang /tmp
    tmp_dir = tempfile.mkdtemp(prefix="kiem_canh_bao_")
    tmp_db = os.path.join(tmp_dir, "copy.db")
    shutil.copy2(str(db_src), tmp_db)
    print(f"[INFO] Đã copy DB sang {tmp_db}")

    os.environ["HERMES_POCLIP_DB_PATH"] = tmp_db

    conn = sqlite3.connect(tmp_db)
    conn.row_factory = sqlite3.Row

    try:
        # Chạy migration nếu cần
        from hermes_poclip.db.migrate import run_migration
        schema_file = str(REPO_ROOT / "db" / "schema.sql")
        run_migration(schema_file, tmp_db)
        import hermes_poclip.config_registry as reg
        reg.invalidate()
        # Reconnect sau migration
        conn.close()
        conn = sqlite3.connect(tmp_db)
        conn.row_factory = sqlite3.Row

        print("\n" + "=" * 60)
        print("(1) BẢNG NGƯỜI NHẬN HIỆN CÓ (notification_preferences)")
        print("=" * 60)
        rows = conn.execute(
            "SELECT owner_id, scope_type, scope_id, action, channels, company_id "
            "FROM notification_preferences ORDER BY owner_id, scope_type, scope_id"
        ).fetchall()
        if rows:
            print(_fmt_table([dict(r) for r in rows],
                             ["owner_id", "scope_type", "scope_id", "action", "channels", "company_id"]))
        else:
            print("(Chưa có dòng nào)")
        print(f"Tổng cộng: {len(rows)} dòng")

        print("\n" + "=" * 60)
        print("(2) KẾT QUẢ seed_default_preferences (idempotent)")
        print("=" * 60)
        from hermes_poclip.notifications.recipients import seed_default_preferences
        seed_result = seed_default_preferences(conn, actor="script_check")
        print(json.dumps(seed_result, indent=2, ensure_ascii=False))

        print("\n" + "=" * 60)
        print("(3) KÊNH MẶC ĐỊNH CỦA CÔNG TY")
        print("=" * 60)
        from hermes_poclip.notifications.recipients import default_channels
        channels = default_channels(conn)
        print(f"Kênh mặc định: {channels}")

        print("\n" + "=" * 60)
        print("(4) NGƯỠNG alert_ack ĐANG DÙNG + NGUỒN")
        print("=" * 60)
        from hermes_poclip.config_registry import get_alert_ack_thresholds
        thresholds = get_alert_ack_thresholds()
        if thresholds:
            for sev, cfg in thresholds.items():
                print(f"  {sev}: reminder={cfg.get('reminder_minutes')} phút, "
                      f"escalate={cfg.get('escalate_minutes')} phút")
        else:
            print("(Chưa có ngưỡng — dùng mặc định)")
            print("  critical: reminder=15 phút, escalate=45 phút")
            print("  warning:  reminder=60 phút, escalate=180 phút")
            print("  info:     reminder=240 phút, escalate=720 phút")

        print("\n" + "=" * 60)
        print(f"(5) KẾT QUẢ deliver_notification DRY_RUN (tối đa {args.limit} thông báo chưa xử lý)")
        print("=" * 60)
        notifs = conn.execute(
            "SELECT id, severity, title, created_at FROM notifications "
            "WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT ?",
            (args.limit,),
        ).fetchall()
        if not notifs:
            print("(Không có thông báo chưa xử lý)")
        else:
            from hermes_poclip.notifications.delivery import deliver_notification
            for row in notifs:
                result = deliver_notification(conn, row["id"], dry_run=True)
                print(f"\n  [{row['severity']}] {row['title'][:60]}")
                print(f"  → recipients: {[r['owner_id'] for r in result.get('recipients', [])]}")
                print(f"  → missing_config: {result.get('missing_config')}")
                for recip in result.get("recipients", []):
                    for d in recip.get("deliveries", []):
                        print(f"    owner={d['owner_id']} channel={d['channel']} "
                              f"status={d['status']} fallback={d['is_fallback']}")

        print("\n" + "=" * 60)
        print("(6) THÔNG BÁO CHƯA XỬ LÝ + CẤP LEO THANG")
        print("=" * 60)
        pending = conn.execute(
            "SELECT id, severity, title, created_at, escalation_level, escalated_at, escalation_reason "
            "FROM notifications WHERE resolved_at IS NULL ORDER BY escalation_level DESC, created_at DESC LIMIT 20"
        ).fetchall()
        if not pending:
            print("(Không có thông báo chưa xử lý)")
        else:
            print(_fmt_table([dict(r) for r in pending],
                             ["severity", "escalation_level", "created_at", "title"]))

        print("\n[DONE] Tự kiểm hoàn tất.")

    finally:
        conn.close()
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
