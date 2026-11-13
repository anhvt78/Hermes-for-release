"""python -m hermes_cli.plus_license fingerprint | status | install <tệp giấy phép>"""
from __future__ import annotations

import json
import sys

from . import LicenseError, fingerprint_report, install_license, license_path, status


def main(argv: list[str]) -> int:
    cmd = (argv[0] if argv else "status").lower()
    if cmd == "fingerprint":
        print(json.dumps(fingerprint_report(), ensure_ascii=False, indent=2))
        return 0
    if cmd == "status":
        st = status(force=True)
        print(json.dumps(st.to_dict(), ensure_ascii=False, indent=2))
        print(f"(tệp giấy phép: {license_path()})")
        return 0 if st.state in ("valid", "grace", "disabled") else 1
    if cmd == "install" and len(argv) >= 2:
        try:
            with open(argv[1], encoding="utf-8") as fh:
                st = install_license(fh.read())
        except (OSError, LicenseError) as exc:
            print(f"Không cài được giấy phép: {exc}")
            return 1
        print(json.dumps(st.to_dict(), ensure_ascii=False, indent=2))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
