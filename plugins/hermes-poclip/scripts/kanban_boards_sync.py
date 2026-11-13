"""CLI sinh bảng Kanban theo nhóm luồng (khung (a)).

Đăng ký package hermes_poclip thủ công (flat-package layout — tên gạch ngang),
rồi gọi logic từ comm/kanban_boards.py.

Ví dụ gọi:
  # 1. Xem kế hoạch (không tạo gì — bước người duyệt):
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py

  # 2. Xem kế hoạch với bảng phân loại luồng:
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py --print-table

  # 3. Tạo bảng thật + ghi tệp map:
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py --apply

  # 4. Chỉ định DB tường minh (thay vì env/mặc định):
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py --apply --db /tmp/poclip.db

  # 5. Ghi tệp map sang đường dẫn tường minh:
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py --apply --map-out /tmp/kanban_map.yaml

  # 6. Tiền tố công ty tường minh:
  python3 plugins/hermes-poclip/scripts/kanban_boards_sync.py --apply --company-prefix vortoxai
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

# Đăng ký hermes_poclip thủ công (cùng kỹ thuật như generate_handbook.py)
_REPO_ROOT = Path(__file__).resolve().parent.parent
if "hermes_poclip" not in sys.modules:
    _spec = importlib.util.spec_from_file_location(
        "hermes_poclip",
        _REPO_ROOT / "__init__.py",
        submodule_search_locations=[str(_REPO_ROOT)],
    )
    _module = importlib.util.module_from_spec(_spec)
    sys.modules["hermes_poclip"] = _module
    _spec.loader.exec_module(_module)

from hermes_poclip.comm.kanban_boards import (  # noqa: E402
    BOARD_GROUPS,
    COMPANY_MAP_FILENAME,
    _GROUP_ORDER,
    build_map_document,
    classify_flow,
    detect_companies_on_machine,
    group_slug,
    infer_company_prefix,
    read_flow_units_from_db,
    read_units_from_db,
    slugify_company_name,
    sync_boards,
    write_map_file,
)

_SEED_TAXONOMY = _REPO_ROOT / "config" / "taxonomy" / "event-topics.yaml"
_SEED_MAP = _REPO_ROOT / "config" / COMPANY_MAP_FILENAME


def _load_flows_from_db(db_path: str) -> list[str]:
    """Đọc danh sách luồng từ bảng cfg_event_topics trong DB (raise nếu lỗi — caller xử lý)."""
    import sqlite3

    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute("SELECT name FROM cfg_event_topics ORDER BY name").fetchall()
    finally:
        conn.close()
    return [r[0] for r in rows]


def _load_units_from_db(db_path: str) -> list[str]:
    """Đọc hợp cfg_routing_units.slug + org_nodes.org_unit từ DB.

    Lỗi / bảng thiếu → [] + cảnh báo stderr (KHÔNG raise).
    """
    try:
        units = read_units_from_db(db_path)
        return units
    except Exception as exc:
        print(f"[WARN] Không đọc được đơn vị từ DB '{db_path}': {exc}", file=sys.stderr)
        return []


def _load_flows_from_seed() -> list[str]:
    """Đọc danh sách luồng từ seed event-topics.yaml."""
    import yaml

    text = _SEED_TAXONOMY.read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    return [t["name"] for t in (data.get("topics") or [])]


def _poclip_home_path() -> Path:
    """Đường dẫn thư mục poclip home (chứa poclip.db)."""
    home_env = (os.environ.get("HERMES_POCLIP_HOME") or "").strip()
    if home_env:
        return Path(home_env).expanduser()
    from hermes_poclip.db.connection import poclip_db_path

    return poclip_db_path().parent


def _detect_companies_on_machine(
    poclip_home: Path,
    company_glob: str = ".hermes*",
    homes_dir: Optional[Path] = None,
) -> list[Path]:
    """Wrapper: gọi hàm chung detect_companies_on_machine từ kanban_boards."""
    return detect_companies_on_machine(poclip_home, company_glob=company_glob, homes_dir=homes_dir)


def _slugify(name: str) -> str:
    """Wrapper: gọi hàm chung slugify_company_name từ kanban_boards."""
    return slugify_company_name(name)


def _infer_company_prefix(db_path: str) -> Optional[str]:
    """Wrapper: gọi hàm chung infer_company_prefix từ kanban_boards.

    Giữ NGUYÊN tên + chữ ký 1 tham số để test_kanban_boards_map.py gọi trực tiếp.
    """
    return infer_company_prefix(db_path)


def _resolve_map_out(args, poclip_home: Path) -> Path:
    """Xác định đường dẫn ghi tệp map (thứ tự ưu tiên)."""
    if args.map_out:
        return Path(args.map_out).expanduser()
    override = (os.environ.get("HERMES_POCLIP_KANBAN_MAP") or "").strip()
    if override:
        return Path(override).expanduser()
    return poclip_home / COMPANY_MAP_FILENAME


def _print_table(flow_names: list[str], company_prefix: str = "", flow_units: Optional[dict] = None) -> None:
    """In bảng phân loại luồng → bảng theo nhóm."""
    groups: dict[str, list[str]] = {g: [] for g in _GROUP_ORDER}
    unclassified: list[str] = []
    for fn in sorted(flow_names):
        b = classify_flow(fn, (flow_units or {}).get(fn))
        if b:
            groups[b].append(fn)
        else:
            unclassified.append(fn)

    print("\n=== Bảng phân loại luồng → bảng ===")
    total = 0
    counts: list[str] = []
    for g in _GROUP_ORDER:
        if g == "noi-bo":
            continue
        flows = groups[g]
        slug = group_slug(g, company_prefix)
        board_info = BOARD_GROUPS[g]
        if flows:
            print(f"\n[{slug}] {board_info['name']} ({len(flows)} luồng)")
            for fn in flows:
                print(f"  {fn}")
            counts.append(f"{g} {len(flows)}")
            total += len(flows)

    if unclassified:
        print(f"\n[CHƯA PHÂN LOẠI] ({len(unclassified)} luồng)")
        for fn in unclassified:
            print(f"  {fn}")

    print(f"\nTổng: {' · '.join(counts)} = {total}/{len(flow_names)}")
    print()


# Để hỗ trợ type hint trong _detect_companies_on_machine
from typing import Optional  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sinh bảng Kanban theo nhóm luồng công ty (khung (a)).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--db",
        metavar="PATH",
        help="Đường dẫn poclip.db tường minh (ghi đè env HERMES_POCLIP_DB_PATH)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Tạo bảng thật + ghi tệp map. Không có flag này = chỉ in kế hoạch.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Xuất báo cáo dạng JSON.",
    )
    parser.add_argument(
        "--print-table",
        action="store_true",
        help="In bảng phân loại luồng → bảng theo nhóm.",
    )
    parser.add_argument(
        "--company-prefix",
        metavar="PREFIX",
        help="Tiền tố slug công ty tường minh (vd 'vortoxai'). Thắng mọi suy diễn.",
    )
    parser.add_argument(
        "--no-company-prefix",
        action="store_true",
        help="Không dùng tiền tố kể cả khi máy có >= 2 công ty (ghi cảnh báo).",
    )
    parser.add_argument(
        "--company-glob",
        default=".hermes*",
        metavar="GLOB",
        help="Mẫu glob để nhận diện thư mục công ty (mặc định: .hermes*)",
    )
    parser.add_argument(
        "--company-homes-dir",
        metavar="DIR",
        help="Thư mục chứa các home công ty (mặc định: thư mục cha của poclip home)",
    )
    parser.add_argument(
        "--map-out",
        metavar="PATH",
        help="Đường dẫn ghi tệp kanban_map.yaml (ghi đè env và poclip home mặc định)",
    )
    parser.add_argument(
        "--print-unit-table",
        action="store_true",
        help="In bảng ánh xạ đơn vị → bảng Kanban và danh sách đơn vị chưa map.",
    )

    args = parser.parse_args()

    # Xác định poclip home + DB path
    try:
        poclip_home = _poclip_home_path()
    except Exception as exc:
        print(f"[ERROR] Không xác định được poclip home: {exc}", file=sys.stderr)
        poclip_home = Path.home() / ".hermes"

    db_path_str: Optional[str] = args.db
    source = "cli"
    if not db_path_str:
        db_path_str = (os.environ.get("HERMES_POCLIP_DB_PATH") or "").strip() or None
        source = "env"
    if not db_path_str:
        candidate = poclip_home / "poclip.db"
        db_path_str = str(candidate)
        source = "poclip_home"

    # Nạp danh sách luồng
    source_label = "db"
    source_db = db_path_str
    try:
        flow_names = _load_flows_from_db(db_path_str)
        if not flow_names:
            raise ValueError("DB rỗng (cfg_event_topics trống)")
    except Exception as exc:
        print(
            f"[WARN] Không đọc được DB '{db_path_str}': {exc} — dùng seed taxonomy.",
            file=sys.stderr,
        )
        try:
            flow_names = _load_flows_from_seed()
            source_label = "seed"
            source_db = str(_SEED_TAXONOMY)
        except Exception as exc2:
            print(f"[ERROR] Không đọc được seed taxonomy: {exc2}", file=sys.stderr)
            return 1

    flow_units = read_flow_units_from_db(source_db) if source_label == "db" else {}

    print(
        f"[INFO] Nguồn luồng: {source_label} ({source_db}), tổng {len(flow_names)} luồng",
        file=sys.stderr,
    )

    # Xác định số công ty trên máy
    homes_dir_path = Path(args.company_homes_dir).expanduser() if args.company_homes_dir else None
    companies = _detect_companies_on_machine(
        poclip_home,
        company_glob=args.company_glob,
        homes_dir=homes_dir_path,
    )
    company_count = len(companies)
    print(
        f"[INFO] Công ty trên máy: {company_count} "
        f"({', '.join(str(p) for p in companies[:5])}{'...' if company_count > 5 else ''})",
        file=sys.stderr,
    )

    # Xác định tiền tố
    company_prefix = ""
    if args.company_prefix:
        company_prefix = args.company_prefix.rstrip("-")
    elif args.no_company_prefix:
        if company_count >= 2:
            print(
                "[WARN] --no-company-prefix với >= 2 công ty trên máy — slug KHÔNG tiền tố.",
                file=sys.stderr,
            )
        company_prefix = ""
    elif company_count >= 2:
        # Cần tiền tố, suy từ DB
        inferred = _infer_company_prefix(db_path_str) if source_label == "db" else None
        if not inferred:
            print(
                "[ERROR] Máy có >= 2 công ty nhưng không suy ra được tiền tố từ DB. "
                "Truyền --company-prefix <tiền-tố> tường minh.",
                file=sys.stderr,
            )
            return 1
        company_prefix = inferred
        print(f"[INFO] Tiền tố suy từ DB: '{company_prefix}'", file=sys.stderr)
    # Nếu 0 hoặc 1 công ty → không tiền tố (để trống)

    # Nạp đơn vị từ DB
    unit_names: list[str] = []
    if source_label == "db":
        unit_names = _load_units_from_db(db_path_str)
        print(
            f"[INFO] Đơn vị đọc từ DB: {len(unit_names)}: {', '.join(unit_names[:8])}"
            + ("..." if len(unit_names) > 8 else ""),
            file=sys.stderr,
        )

    # In bảng phân loại nếu yêu cầu
    if args.print_table:
        _print_table(flow_names, company_prefix, flow_units)

    # In bảng đơn vị nếu yêu cầu
    if args.print_unit_table:
        from hermes_poclip.comm.kanban_boards import build_unit_map
        unit_map, units_unmapped = build_unit_map(unit_names, company_prefix)
        _print_unit_table(unit_map, units_unmapped)

    # Sync bảng
    try:
        import hermes_cli.kanban_db as kanban_db_mod
    except ImportError as exc:
        print(f"[ERROR] Không import được hermes_cli.kanban_db: {exc}", file=sys.stderr)
        return 1

    result = sync_boards(
        flow_names,
        company_prefix=company_prefix,
        kanban_db=kanban_db_mod,
        dry_run=not args.apply,
        flow_units=flow_units,
    )

    # Đường dẫn DB kanban.db (board default)
    try:
        kanban_db_file = kanban_db_mod.kanban_db_path()
        kanban_db_size = Path(kanban_db_file).stat().st_size if Path(kanban_db_file).exists() else 0
    except Exception:
        kanban_db_file = None
        kanban_db_size = 0

    # Ghi tệp map nếu --apply
    map_file_path: Optional[str] = None
    if args.apply:
        map_out = _resolve_map_out(args, poclip_home)
        doc = build_map_document(
            flow_names,
            company_prefix=company_prefix,
            default_board="noi-bo",
            allow_default_fallback=False,
            unit_names=unit_names if unit_names else None,
            flow_units=flow_units,
        )
        write_map_file(doc, map_out)
        map_file_path = str(map_out)
        print(f"[INFO] Đã ghi tệp map: {map_file_path}", file=sys.stderr)

    # Kiểm tra bảng sau apply
    unclassified = result["unclassified"]
    if args.apply:
        missing_boards = []
        for slug in result["groups_to_create"]:
            if not kanban_db_mod.board_exists(slug):
                missing_boards.append(slug)
        if missing_boards:
            print(
                f"[ERROR] Bảng thiếu sau khi tạo: {missing_boards}",
                file=sys.stderr,
            )
        exit_code = 1 if (unclassified or missing_boards) else 0
    else:
        exit_code = 1 if unclassified else 0

    # Thống kê unit map
    from hermes_poclip.comm.kanban_boards import build_unit_map as _build_unit_map
    _unit_map, _units_unmapped = _build_unit_map(unit_names, company_prefix)

    # Báo cáo JSON
    report = {
        "applied": result["applied"],
        "source": source_label,
        "source_db": source_db,
        "flows_total": len(flow_names),
        "company_prefix": company_prefix,
        "companies_on_machine": {
            "count": company_count,
            "homes": [str(p) for p in companies],
        },
        "groups": {g: flows for g, flows in result["groups"].items()},
        "skipped": result["skipped"],
        "boards": {
            **result["boards"],
            "db_path": str(kanban_db_file) if kanban_db_file else None,
            "size_bytes": kanban_db_size,
        },
        "map_file": map_file_path,
        "unclassified": unclassified,
        "unit_map": _unit_map,
        "unit_names_total": len(unit_names),
        "units_unmapped": _units_unmapped,
    }

    if args.as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        _print_human_report(result, args.apply, company_prefix)

    return exit_code


def _print_unit_table(unit_map: dict, units_unmapped: list[str]) -> None:
    """In bảng ánh xạ đơn vị → bảng Kanban."""
    print("\n=== Ánh xạ ĐƠN VỊ → bảng ===")
    if unit_map:
        for unit, board in sorted(unit_map.items()):
            print(f"  {unit:<30} → {board}")
    else:
        print("  (không có đơn vị nào)")
    if units_unmapped:
        print(f"\nĐơn vị CHƯA map được ({len(units_unmapped)}): {', '.join(units_unmapped)}")
    print()


def _print_human_report(result: dict, applied: bool, company_prefix: str) -> None:
    action = "TẠO THẬT" if applied else "KẾ HOẠCH (chưa tạo — thêm --apply để thực thi)"
    print(f"\n=== Báo cáo sync bảng Kanban [{action}] ===")

    created = result["boards"]["created"]
    existing = result["boards"]["existing"]
    skipped = result["skipped"]
    unclassified = result["unclassified"]

    if applied:
        if created:
            print(f"Đã tạo ({len(created)}): {', '.join(created)}")
        if existing:
            print(f"Đã tồn tại ({len(existing)}): {', '.join(existing)}")
    else:
        print(f"Sẽ tạo ({len(existing)}): {', '.join(existing)}")

    if skipped:
        print(f"\nBỏ qua ({len(skipped)}):")
        for s in skipped:
            key = s.get("group") or s.get("flow", "?")
            print(f"  {key}: {s['reason']}")

    if unclassified:
        print(f"\nCHƯA PHÂN LOẠI ({len(unclassified)}): {', '.join(unclassified)}")
        print("  → Exit code 1. Kiểm tra miền luồng và cập nhật kanban_boards.py.")

    print()


if __name__ == "__main__":
    raise SystemExit(main())
