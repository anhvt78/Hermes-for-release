#!/usr/bin/env python3
"""Phát hành Hermes+: tạo một commit mới trên nhánh `release` (hoặc nhánh đặt bằng --branch) rồi đẩy lên GitHub.

Máy chạy thật (26, 162) chỉ cập nhật theo nhánh này (nút «Cập nhật Hermes+» / `hermes update`), nên chỉ bản bạn chủ động
phát hành mới xuống được máy — mã đang sửa dở trên `main` hay nhánh khác không tự chạy xuống.

Nhánh phát hành có cấu trúc PHẲNG: gốc nhánh = nội dung thư mục `hermes-agent-main/`, kèm
  - hermes_cli/web_dist/          giao diện web lõi đã dựng (bị .gitignore ở nhánh nguồn nên phải kèm theo ở đây)
  - requirements-release.txt      danh sách thư viện cần có (sinh từ pyproject.toml)
  - install-stamp.json            định danh bản cài (phiên bản, commit nguồn, cập nhật qua kênh ngoài)
  - RELEASE.json                  release_id, phiên bản, commit nguồn, ghi chú thay đổi

Cách dùng (chạy ở một bản checkout đã dựng web: `cd hermes-agent-main/web && npm install && npm run build`):
    python hermes-agent-main/scripts/plus_release.py                 # phát hành commit hiện tại
    python hermes-agent-main/scripts/plus_release.py --no-push       # chỉ tạo commit cục bộ để xem trước
    python hermes-agent-main/scripts/plus_release.py --notes "Sửa lỗi X"
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import tomllib
from datetime import datetime, timezone
from pathlib import Path

UPSTREAM_BASE_VERSION = "0.21.7"      # phiên bản lõi Hermes mà Hermes+ đang dựa trên
SRC_DIR = "hermes-agent-main"
# Không cần khi CHẠY trên máy chủ (CI, trang web tài liệu, ứng dụng desktop, TUI, mã ví dụ...). `.github` còn bị GitHub chặn nếu
# token không có quyền workflow. Bản phát hành chỉ chứa phần chạy thật.
# Công cụ của CHỦ SỞ HỮU, không đi kèm bản gửi khách (cấp giấy phép bằng khoá bí mật)
RELEASE_EXCLUDE_FILES = ("scripts/plus_license_issue.py",)
RELEASE_EXCLUDE_DIRS = (".github", "website", "apps", "ui-tui", "contributors", "evals", "nix", "docker", "tests-js", "datagen-config-examples")


def git(*args: str, cwd: Path, check: bool = True, capture: bool = True) -> str:
    proc = subprocess.run(["git", *args], cwd=str(cwd), capture_output=capture, text=True)
    if check and proc.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} lỗi: {(proc.stderr or proc.stdout).strip()}")
    return (proc.stdout or "").strip()


def release_requirements(pyproject: Path) -> list[str]:
    """Danh sách thư viện lõi như bản cài Python 3.14 trên Linux sẽ có (Hermes gốc chỉ khai báo đủ ở nhánh >=3.14)."""
    from packaging.markers import Marker

    data = tomllib.loads(pyproject.read_text(encoding="utf-8"))
    env = {"python_version": "3.14", "python_full_version": "3.14.0"}
    out: list[str] = []
    for dep in data["project"]["dependencies"]:
        req, _, marker = dep.partition(";")
        req = req.strip()
        if marker.strip() and not Marker(marker.strip()).evaluate(env):
            continue
        if " @ git" in req:
            continue
        out.append(req)
    # Kênh chat mà Hermes+ dùng thật cần thư viện riêng (nằm ở nhóm tuỳ chọn của pyproject): Telegram cho CEO (Chủ tịch duyệt 04/11/2026).
    for extra in RELEASE_EXTRAS:
        for dep in (data.get("project", {}).get("optional-dependencies", {}).get(extra) or []):
            req = dep.partition(";")[0].strip()
            if req and req not in out:
                out.append(req)
    return out


RELEASE_EXTRAS = ("telegram",)


def next_release_id(prev: dict) -> str:
    today = datetime.now(timezone.utc).strftime("%Y.%m.%d")
    prev_id = str(prev.get("release_id") or "")
    if prev_id.startswith(today + "-"):
        try:
            return f"{today}-{int(prev_id.rsplit('-', 1)[1]) + 1}"
        except ValueError:
            pass
    return f"{today}-1"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source-ref", default="HEAD", help="commit nguồn cần phát hành (mặc định HEAD)")
    ap.add_argument("--branch", default="release", help="tên nhánh phát hành")
    ap.add_argument("--remote", default="origin")
    ap.add_argument("--notes", default="", help="ghi chú thay đổi (mặc định: tóm tắt các commit mới)")
    ap.add_argument("--base-version", default=UPSTREAM_BASE_VERSION)
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--allow-dirty", action="store_true", help="cho phép phát hành khi cây làm việc đang sửa dở")
    args = ap.parse_args()

    here = Path(__file__).resolve()
    repo = Path(git("rev-parse", "--show-toplevel", cwd=here.parent))
    src_root = repo / SRC_DIR
    if not src_root.exists():
        raise SystemExit(f"Không thấy thư mục {SRC_DIR} trong {repo}")

    sha = git("rev-parse", args.source_ref, cwd=repo)
    src_branch = git("rev-parse", "--abbrev-ref", "HEAD", cwd=repo)
    dirty = git("status", "--porcelain", "--untracked-files=no", cwd=repo)
    if dirty and not args.allow_dirty:
        raise SystemExit("Cây làm việc đang có thay đổi chưa commit — hãy commit (hoặc dùng --allow-dirty) rồi phát hành lại.")
    if git("rev-parse", "HEAD", cwd=repo) != sha:
        print("⚠ commit nguồn khác HEAD: giao diện web lõi lấy từ bản dựng hiện có, hãy chắc nó khớp commit này.")

    web_dist = src_root / "hermes_cli" / "web_dist"
    if not (web_dist / "index.html").exists():
        raise SystemExit("Chưa có giao diện web lõi đã dựng. Chạy: cd hermes-agent-main/web && npm install && npm run build")
    newest_src = max((p.stat().st_mtime for p in (src_root / "web" / "src").rglob("*") if p.is_file()), default=0)
    if newest_src > (web_dist / "index.html").stat().st_mtime + 1:
        print("⚠ mã nguồn web mới hơn bản dựng web_dist — nên chạy lại `npm run build` trước khi phát hành.")

    work = Path(tempfile.mkdtemp(prefix="plus-release-"))
    orphan_branch = ""
    try:
        # 1) xuất cây mã nguồn tại commit
        export = work / "export"
        export.mkdir()
        archive = subprocess.run(["git", "archive", sha, SRC_DIR], cwd=str(repo), capture_output=True)
        if archive.returncode != 0:
            raise SystemExit(f"git archive lỗi: {archive.stderr.decode(errors='replace')}")
        subprocess.run(["tar", "-x", "-C", str(export)], input=archive.stdout, check=True)
        tree = export / SRC_DIR
        shutil.rmtree(tree / "hermes_cli" / "web_dist", ignore_errors=True)
        shutil.copytree(web_dist, tree / "hermes_cli" / "web_dist")
        for name in RELEASE_EXCLUDE_DIRS:
            shutil.rmtree(tree / name, ignore_errors=True)
        for name in RELEASE_EXCLUDE_FILES:
            (tree / name).unlink(missing_ok=True)

        # 2) worktree của nhánh phát hành
        wt = work / "wt"
        have_remote = bool(git("ls-remote", "--heads", args.remote, args.branch, cwd=repo))
        if have_remote:
            git("fetch", "-q", args.remote, f"{args.branch}:refs/plus-release/{args.branch}", cwd=repo)
            git("worktree", "add", "-q", "--detach", str(wt), f"refs/plus-release/{args.branch}", cwd=repo)
            prev = {}
            try:
                prev = json.loads((wt / "RELEASE.json").read_text(encoding="utf-8"))
            except (OSError, ValueError):
                pass
            for item in wt.iterdir():
                if item.name == ".git":
                    continue
                shutil.rmtree(item) if item.is_dir() else item.unlink()
        else:
            git("worktree", "add", "-q", "--detach", str(wt), sha, cwd=repo)
            orphan_branch = f"plus-release-tmp-{os.getpid()}"
            git("checkout", "-q", "--orphan", orphan_branch, cwd=wt)
            git("rm", "-rfq", ".", cwd=wt, check=False)
            for item in wt.iterdir():
                if item.name == ".git":
                    continue
                shutil.rmtree(item) if item.is_dir() else item.unlink()
            prev = {}

        # 3) chép cây mã + tệp phát hành
        subprocess.run(["rsync", "-a", "--exclude=.git", f"{tree}/", f"{wt}/"], check=True)
        reqs = release_requirements(wt / "pyproject.toml")
        (wt / "requirements-release.txt").write_text("\n".join(reqs) + "\n", encoding="utf-8")

        stamp_cmd = [sys.executable, str(wt / "scripts" / "write_install_stamp.py"), "--output", str(wt / "install-stamp.json"),
                     "--commit", sha, "--branch", src_branch, "--base-version", args.base_version, "--distance", "0",
                     "--update-mechanism", "external", "--source", "local"]
        subprocess.run(stamp_cmd, cwd=str(wt), check=True, capture_output=True)

        notes = args.notes.strip()
        if not notes:
            prev_src = str(prev.get("source_commit") or "")
            rng = f"{prev_src}..{sha}" if prev_src and subprocess.run(["git", "cat-file", "-e", f"{prev_src}^{{commit}}"], cwd=str(repo)).returncode == 0 else f"-n20 {sha}"
            log = git("log", "--format=%s", *rng.split(), cwd=repo)
            notes = "\n".join(f"- {line}" for line in log.splitlines()[:30])
        rid = next_release_id(prev)
        meta = {
            "release_id": rid, "version": args.base_version, "source_commit": sha, "source_branch": src_branch,
            "created_at": datetime.now(timezone.utc).isoformat(), "notes": notes,
        }
        (wt / "RELEASE.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        # 4) commit (ép thêm các tệp bị .gitignore: web_dist, stamp, requirements, RELEASE.json)
        git("add", "-A", cwd=wt)
        git("add", "-f", "hermes_cli/web_dist", "install-stamp.json", "requirements-release.txt", "RELEASE.json", cwd=wt)
        git("-c", "user.name=Hermes+ release", "-c", "user.email=release@hermes-plus.local", "commit", "-q", "-m",
            f"Hermes+ release {rid}\n\nNguồn: {sha}\n\n{notes}", cwd=wt)
        new_sha = git("rev-parse", "HEAD", cwd=wt)
        print(f"Đã tạo bản phát hành {rid} = {new_sha[:7]} (nguồn {sha[:7]})")
        if args.no_push:
            git("branch", "-f", f"{args.branch}-local", new_sha, cwd=repo)
            print(f"(không đẩy) giữ cục bộ ở nhánh {args.branch}-local")
            return 0
        git("push", args.remote, f"{new_sha}:refs/heads/{args.branch}", cwd=repo)
        print(f"Đã đẩy lên {args.remote}/{args.branch}")
        return 0
    finally:
        shutil.rmtree(work, ignore_errors=True)
        subprocess.run(["git", "worktree", "prune"], cwd=str(repo), capture_output=True)
        if orphan_branch:
            subprocess.run(["git", "branch", "-D", orphan_branch], cwd=str(repo), capture_output=True)


if __name__ == "__main__":
    sys.exit(main())
