"""Terminal commands for the independent Zalo personal plugin."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from .runtime import StateStore, credential_path, qr_path


def register_cli(parser: argparse.ArgumentParser) -> None:
    subs = parser.add_subparsers(dest="zalo_personal_command")
    subs.add_parser("login", help="Đăng nhập bằng QR và lưu session cho profile này")
    subs.add_parser("status", help="Kiểm tra trạng thái session Zalo")
    subs.add_parser("peers", help="Xem user/group ID đã nhìn thấy từ listener")
    subs.add_parser("groups", help="Liệt kê nhóm của tài khoản (chỉ đọc, không gửi tin)")
    resolve = subs.add_parser("resolve-group", help="Lấy ID nhóm từ link zalo.me/g/... (chỉ đọc)")
    resolve.add_argument("link", help="Link mời nhóm Zalo")
    subs.add_parser("install", help="Cài dependency Node đã ghim trong plugin")
    logout = subs.add_parser("logout", help="Xóa session Zalo đã lưu")
    logout.add_argument("--yes", action="store_true", help="Xác nhận xóa session")
    parser.set_defaults(func=dispatch)


def _plugin_dir() -> Path:
    return Path(__file__).parent


def _install() -> int:
    if not shutil.which("node") or not shutil.which("npm"):
        print("Cần Node.js và npm để dùng Zalo cá nhân.", file=sys.stderr)
        return 1
    npm = "npm.cmd" if os.name == "nt" else "npm"
    return subprocess.run([npm, "ci", "--omit=dev", "--ignore-scripts"], cwd=_plugin_dir()).returncode


def _run_sidecar(mode: str, *arguments: str) -> tuple[int, dict]:
    if not credential_path().exists():
        print("Chưa đăng nhập Zalo. Chạy: <profile> zalo_personal login", file=sys.stderr)
        return 1, {}
    command = ["node", str(_plugin_dir() / "sidecar" / "sidecar.mjs"), mode, "--credentials", str(credential_path()), *arguments]
    result = subprocess.run(command, cwd=_plugin_dir(), capture_output=True, text=True, encoding="utf-8")
    payload: dict = {}
    for line in result.stdout.splitlines():
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
    if result.returncode or payload.get("type") == "fatal":
        print(str(payload.get("error") or result.stderr.strip() or "Không thể đọc thông tin Zalo."), file=sys.stderr)
        return 1, payload
    return 0, payload


def _login() -> int:
    if _install() != 0:
        return 1
    qr_path().unlink(missing_ok=True)
    command = ["node", str(_plugin_dir() / "sidecar" / "sidecar.mjs"), "login", "--credentials", str(credential_path()), "--qr-path", str(qr_path())]
    process = subprocess.Popen(command, cwd=_plugin_dir(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
    opened = False
    assert process.stdout is not None
    for line in process.stdout:
        if '"type":"qr"' in line and qr_path().exists() and not opened:
            print(f"Mở Zalo trên điện thoại và quét QR tại: {qr_path()}")
            if os.name == "nt":
                os.startfile(qr_path())
            opened = True
        elif '"type":"scanned"' in line:
            print("Đã quét QR, hãy xác nhận đăng nhập trên điện thoại.")
        elif '"type":"logged_in"' in line:
            print("Đăng nhập Zalo thành công. Session chỉ được lưu trong profile này.")
    stderr = process.stderr.read() if process.stderr else ""
    process.wait()
    if process.returncode != 0 or not credential_path().exists():
        print(f"Đăng nhập Zalo thất bại. {stderr[-300:]}", file=sys.stderr)
        return 1
    return 0


def _status() -> int:
    print(f"Session: {'đã đăng nhập' if credential_path().exists() else 'chưa đăng nhập'}")
    print(f"Node: {'sẵn sàng' if shutil.which('node') else 'chưa cài'}")
    return 0 if credential_path().exists() else 1


def _groups() -> int:
    code, payload = _run_sidecar("groups")
    if code:
        return code
    groups = payload.get("groups") or []
    if not groups:
        print("Không tìm thấy nhóm nào cho tài khoản này.")
        return 0
    print("Group ID                  Số thành viên  Tên nhóm")
    for group in groups:
        print(f"{str(group.get('id', '')):<25} {int(group.get('memberCount') or 0):<13} {group.get('name', '')}")
    return 0


def _resolve_group(link: str) -> int:
    code, payload = _run_sidecar("resolve-group", "--link", link)
    if code:
        return code
    group = payload.get("group") or {}
    print("Group ID: " + str(group.get("id") or ""))
    print("Tên nhóm: " + str(group.get("name") or ""))
    print("Số thành viên: " + str(group.get("memberCount") or 0))
    return 0


def _peers() -> int:
    store = StateStore()
    rows = store.peers()
    store.close()
    if not rows:
        print("Chưa có user hoặc nhóm nào. Dùng `groups` hoặc chạy gateway rồi nhờ tài khoản khác nhắn thử.")
        return 0
    print("Loại     Thread ID                 User ID                   Tên")
    for thread_id, thread_type, sender_id, display_name, _ in rows:
        print(f"{thread_type:<8} {thread_id:<25} {sender_id:<25} {display_name}")
    return 0


def _logout(confirm: bool) -> int:
    if not confirm:
        print("Session không bị xóa. Chạy lại với --yes để xác nhận.")
        return 2
    credential_path().unlink(missing_ok=True)
    qr_path().unlink(missing_ok=True)
    print("Đã xóa session Zalo khỏi profile này.")
    return 0


def dispatch(args: argparse.Namespace) -> int:
    command = getattr(args, "zalo_personal_command", None) or "status"
    if command == "login": return _login()
    if command == "status": return _status()
    if command == "peers": return _peers()
    if command == "groups": return _groups()
    if command == "resolve-group": return _resolve_group(args.link)
    if command == "install": return _install()
    if command == "logout": return _logout(bool(args.yes))
    return 2
