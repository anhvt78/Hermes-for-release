"""
Launcher cho plugin hermes-poclip trên cả máy dev lẫn bản cài.

Tại sao cần file này
--------------------
hermes-poclip dùng cấu trúc PHẲNG: thư mục `plugins/hermes-poclip/` CHÍNH LÀ
package `hermes_poclip` — không có thư mục con tên `hermes_poclip/`.
App nạp package bằng spec_from_file_location(..., submodule_search_locations=[plugin_root])
(xem dashboard/plugin_api.py:33-43, conftest.py:14-25, web_server.py:17792-17803).

Hệ quả: `python -m hermes_poclip.<module>` KHÔNG bao giờ chạy được ở cả máy dev
lẫn bản cài (`No module named 'hermes_poclip'`) vì Python tìm thư mục tên
`hermes_poclip` trong sys.path, trong khi thư mục đó không tồn tại.

File này đăng ký package vào sys.modules trước khi chạy module đích —
cùng kỹ thuật 3 nơi trên — rồi dùng runpy.run_module để chạy module.

Cú pháp
-------
  python selfcheck.py <alias|dotted> [args...]

Alias:
  quota       -> hermes_poclip.monitoring.quota_watch
  backup      -> hermes_poclip.monitoring.backup_verify
  ops         -> hermes_poclip.monitoring.ops_probe
  migrate     -> hermes_poclip.db.migrate
  org-context -> hermes_poclip.org.context

Chấp nhận dạng dotted đầy đủ bắt đầu bằng "hermes_poclip." để lệnh cũ
(`python -m hermes_poclip.X`) chỉ cần đổi tiền tố thành `python selfcheck.py`.
"""
from __future__ import annotations

import importlib.util
import runpy
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parent

ALIASES: dict[str, str] = {
    "quota": "hermes_poclip.monitoring.quota_watch",
    "backup": "hermes_poclip.monitoring.backup_verify",
    "ops": "hermes_poclip.monitoring.ops_probe",
    "migrate": "hermes_poclip.db.migrate",
    "org-context": "hermes_poclip.org.context",
}

_HELP = """\
Cách dùng: python selfcheck.py <alias|dotted> [args...]

Alias có sẵn:
  quota       -> hermes_poclip.monitoring.quota_watch
  backup      -> hermes_poclip.monitoring.backup_verify
  ops         -> hermes_poclip.monitoring.ops_probe
  migrate     -> hermes_poclip.db.migrate
  org-context -> hermes_poclip.org.context

Cũng chấp nhận dạng dotted đầy đủ bắt đầu bằng "hermes_poclip."
Ví dụ:
  python selfcheck.py quota --once --force --json --db /tmp/check/company.db
  python selfcheck.py hermes_poclip.monitoring.quota_watch --once --force --json --db /tmp/check/company.db
  python selfcheck.py migrate --db /tmp/test.db --dry-run

Trên máy dev:  python plugins/hermes-poclip/selfcheck.py quota ...
Trên bản cài: /opt/hermes-plus/deploy/hermes-plus-check quota ...
"""


def _bootstrap() -> None:
    """Đăng ký hermes_poclip vào sys.modules nếu chưa có."""
    if "hermes_poclip" not in sys.modules:
        _spec = importlib.util.spec_from_file_location(
            "hermes_poclip",
            PLUGIN_ROOT / "__init__.py",
            submodule_search_locations=[str(PLUGIN_ROOT)],
        )
        _mod = importlib.util.module_from_spec(_spec)
        sys.modules["hermes_poclip"] = _mod
        _spec.loader.exec_module(_mod)


def main() -> None:
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(_HELP)
        sys.exit(0)

    target_arg = args[0]
    rest = args[1:]

    if target_arg in ALIASES:
        dotted = ALIASES[target_arg]
    elif target_arg.startswith("hermes_poclip."):
        dotted = target_arg
    else:
        print(
            f"Lỗi: alias hoặc module '{target_arg}' không hợp lệ.\n"
            f"Alias hợp lệ: {', '.join(ALIASES)}.\n"
            f"Hoặc dùng dạng dotted bắt đầu bằng 'hermes_poclip.'",
            file=sys.stderr,
        )
        sys.exit(2)

    _bootstrap()

    # Truyền nguyên argv cho module đích; sys.argv[0] = tên module để argparse hiển thị đúng
    sys.argv = [dotted] + rest

    runpy.run_module(dotted, run_name="__main__", alter_sys=True)


if __name__ == "__main__":
    main()
