"""Cập nhật Hermes+ theo BẢN PHÁT HÀNH MỚI NHẤT TRÊN KHO CÔNG KHAI (anhvt78/Hermes-for-release, nhánh `main`), thay cho `hermes update` của Hermes gốc.

Vì sao có file này: `hermes update` của Hermes gốc kéo mã từ kho Nous Research và ghi đè cây mã — sẽ xoá các chỉnh sửa
riêng của Hermes+ (đăng nhập, rào chắn Kanban, thương hiệu, plugin hermes-poclip...). Trên bản cài Hermes+ mọi đường cập nhật
(nút «Cập nhật» trong menu hệ thống, lệnh `hermes update`) đều đi qua đây:

    kiểm tra kho công khai  ->  sao lưu (cơ sở dữ liệu + cây mã cũ + danh sách thư viện)  ->  tải bản mới
    ->  kiểm tra (biên dịch + nạp thử)  ->  cài thư viện thiếu  ->  nạp mã  ->  khởi động lại cổng nhắn tin
    ->  kiểm tra sức khoẻ  ->  khởi động lại bảng điều khiển.   Lỗi ở bất kỳ bước nào trước bước cuối: tự quay về bản cũ.

Mặc định KHÔNG cần cấu hình gì: bản cài Hermes+ (có RELEASE.json) tự lấy bản mới nhất từ kho công khai bằng HTTPS, không cần khoá.
Kho công khai chỉ giữ MỘT commit (ghi đè mỗi lần phát hành) nên «có bản mới» được nhận ra bằng mã commit + số hiệu bản phát hành (RELEASE.json),
và bộ cập nhật KHÔNG BAO GIỜ hạ cấp (bản công khai cũ hơn bản đang chạy thì giữ nguyên). Chỉ dùng thư viện chuẩn.

Cấu hình (biến môi trường, thường đặt trong ``$HERMES_HOME/.env``) — chỉ để THAY nguồn (kho phản chiếu riêng của doanh nghiệp, kiểm thử):
    HERMES_PLUS_UPDATE_REPO      URL/đường dẫn kho git khác thay cho kho công khai. Giá trị trỏ về kho riêng tư cũ (anhvt78/hermes_plus) bị BỎ QUA
    HERMES_PLUS_UPDATE_BRANCH    tên nhánh của kho thay thế (mặc định ``release``; kho công khai luôn dùng ``main``)
    HERMES_PLUS_UPDATE_KEY       khoá SSH chỉ-đọc cho kho thay thế riêng tư
    HERMES_PLUS_UPDATE_SERVICES  tên 2 dịch vụ systemd, ``gateway,dashboard`` (mặc định hermes-plus-gateway,hermes-plus-dashboard)
    HERMES_PLUS_INSTALL_DIR      thư mục cài đặt (mặc định: thư mục mã đang chạy)
"""
from __future__ import annotations

import fcntl
import json
import os
import re
import shutil
import signal
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

_ENV_REPO = "HERMES_PLUS_UPDATE_REPO"
_ENV_BRANCH = "HERMES_PLUS_UPDATE_BRANCH"
_ENV_KEY = "HERMES_PLUS_UPDATE_KEY"
_ENV_SERVICES = "HERMES_PLUS_UPDATE_SERVICES"
_ENV_INSTALL = "HERMES_PLUS_INSTALL_DIR"

DEFAULT_BRANCH = "release"                      # nhánh mặc định của kho THAY THẾ (khi đặt HERMES_PLUS_UPDATE_REPO)
PUBLIC_REPO = "https://github.com/anhvt78/Hermes-for-release.git"
PUBLIC_BRANCH = "main"
_LEGACY_PRIVATE_MARKERS = ("anhvt78/hermes_plus",)   # kho riêng tư cũ: không còn là nguồn cập nhật (máy cũ còn ghi nó trong .env)
DEFAULT_SERVICES = ("hermes-plus-gateway", "hermes-plus-dashboard")   # cổng nhắn tin TRƯỚC, bảng điều khiển SAU (xem _restart_all)

# Không chép/ xoá các thứ này khi đồng bộ cây mã (dữ liệu và môi trường chạy nằm ngoài mã nguồn)
RSYNC_EXCLUDES = (
    "venv", ".venv", "node_modules", ".git", "__pycache__", "*.pyc", ".pytest_cache",
    "*.db", "*.db-shm", "*.db-wal", "hermes_agent.egg-info", "log.txt",
)

# Tệp duy nhất trong cây mã mà ứng dụng GHI lúc chạy (Chủ tịch đặt tên công ty ở trình lập công ty) — phải giữ qua mỗi lần cập nhật
CONSTITUTION_REL = Path("plugins/hermes-poclip/config/constitution.yaml")
_DEFAULT_COMPANY_NAMES = ("Hermes+", "Hermes SME Studio")


def _read_identity(root: Path) -> Optional[dict]:
    """Đọc tên/mã công ty do Chủ tịch đặt từ constitution.yaml của cây mã `root`; None nếu chưa ai đặt."""
    try:
        import yaml

        ident = (yaml.safe_load((root / CONSTITUTION_REL).read_text(encoding="utf-8")) or {}).get("identity") or {}
    except Exception:       # noqa: BLE001
        return None
    name = str(ident.get("company_name") or "").strip()
    source = str(ident.get("company_name_source") or "").strip()
    if not name or name.upper().startswith("REPLACE"):
        return None
    if source == "user" or (source != "seed" and name not in _DEFAULT_COMPANY_NAMES):
        return {"company_id": str(ident.get("company_id") or "default"), "company_name": name}
    return None


def _apply_identity(root: Path, ident: Optional[dict]) -> None:
    """Ghi lại tên/mã công ty vào constitution.yaml của cây mã `root` (chỉ đổi 3 dòng định danh, giữ nguyên phần còn lại)."""
    if not ident:
        return
    path = root / CONSTITUTION_REL
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return
    text = re.sub(r"(?m)^(\s*company_id:\s*).*$", lambda m: m.group(1) + json.dumps(ident["company_id"], ensure_ascii=False), text, count=1)
    text = re.sub(r"(?m)^(\s*company_name:\s*).*$", lambda m: m.group(1) + json.dumps(ident["company_name"], ensure_ascii=False), text, count=1)
    if re.search(r"(?m)^\s*company_name_source:\s*", text):
        text = re.sub(r"(?m)^(\s*company_name_source:\s*)[^#\n]*", lambda m: m.group(1) + '"user" ', text, count=1)
    else:
        text = re.sub(r"(?m)^(\s*)company_name:.*$", lambda m: m.group(0) + "\n" + m.group(1) + 'company_name_source: "user"', text, count=1)
    path.write_text(text, encoding="utf-8")


GATEWAY_SETTLE_SECONDS = 45          # chờ cổng nhắn tin ổn định sau khi khởi động lại
DASHBOARD_FLIP_DELAY_SECONDS = 4     # chờ ghi nhật ký xong rồi mới khởi động lại bảng điều khiển
MIN_FREE_BYTES = 2 * 1024**3
IDLE_WAIT_SECONDS = 180              # chờ hàng đợi Kanban rảnh tối đa chừng này


class UpdateError(RuntimeError):
    """Lỗi có thể giải thích cho người dùng; bước cập nhật dừng và (nếu cần) quay về bản cũ."""


# ──────────────────────────────────────────────────────────────────────────────
# Cấu hình
# ──────────────────────────────────────────────────────────────────────────────

def _override_repo() -> str:
    """Kho THAY THẾ do quản trị đặt; rỗng nếu không đặt hoặc trỏ về kho riêng tư cũ (khi đó dùng kho công khai)."""
    raw = os.environ.get(_ENV_REPO, "").strip()
    if not raw or any(m in raw.lower() for m in _LEGACY_PRIVATE_MARKERS):
        return ""
    return raw


def is_enabled() -> bool:
    """Bật khi là bản cài Hermes+ (có RELEASE.json do bản phát hành tạo) hoặc có kho thay thế. Bản mã nguồn của nhà phát triển (không RELEASE.json) giữ `hermes update` cũ."""
    return bool(_override_repo()) or (install_dir() / "RELEASE.json").exists()


def _repo() -> str:
    return _override_repo() or PUBLIC_REPO


def _branch() -> str:
    if _override_repo():
        return os.environ.get(_ENV_BRANCH, "").strip() or DEFAULT_BRANCH
    return PUBLIC_BRANCH


def _services() -> list[str]:
    raw = os.environ.get(_ENV_SERVICES, "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    return list(DEFAULT_SERVICES)


def install_dir() -> Path:
    raw = os.environ.get(_ENV_INSTALL, "").strip()
    if raw:
        return Path(raw).resolve()
    return Path(__file__).resolve().parent.parent


def hermes_home() -> Path:
    raw = os.environ.get("HERMES_HOME", "").strip()
    return Path(raw) if raw else Path.home() / ".hermes"


def data_dir() -> Path:
    d = hermes_home() / "plus-update"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _git_env() -> dict[str, str]:
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    key = os.environ.get(_ENV_KEY, "").strip() if _override_repo() else ""      # kho công khai tải bằng HTTPS, không dùng khoá
    if key:
        env["GIT_SSH_COMMAND"] = f"ssh -i {key} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
    else:
        env["GIT_SSH_COMMAND"] = "ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
    return env


def _run(cmd: list[str], *, cwd: Optional[Path] = None, env: Optional[dict] = None, timeout: int = 600, check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    if check and proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-6:]
        raise UpdateError(f"Lệnh lỗi ({' '.join(cmd[:3])}...): " + " | ".join(tail))
    return proc


# ──────────────────────────────────────────────────────────────────────────────
# Bản đang chạy / bản mới nhất
# ──────────────────────────────────────────────────────────────────────────────

def _read_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def installed_release() -> dict[str, Any]:
    """Bản phát hành đang chạy. ``release_commit`` chỉ có khi máy đã từng cập nhật bằng chức năng này."""
    rel = _read_json(install_dir() / "RELEASE.json")
    rec = _read_json(data_dir() / "installed.json")
    out = {
        "release_id": rel.get("release_id") or rec.get("release_id"),
        "version": rel.get("version") or rec.get("version"),
        "source_commit": rel.get("source_commit"),
        "release_commit": rec.get("release_commit"),
        "applied_at": rec.get("applied_at"),
    }
    stamp = _read_json(install_dir() / "install-stamp.json")
    if not out["version"]:
        out["version"] = stamp.get("displayVersion") or stamp.get("baseVersion")
    return out


def describe_installed(info: Optional[dict] = None) -> str:
    """Tên bản đang chạy theo số hiệu bản phát hành của Hermes+ (vd «Hermes+ 2026.11.12-1»); KHÔNG dùng số phiên bản của Hermes gốc (0.21.x)."""
    info = info or installed_release()
    return f"Hermes+ {info['release_id']}" if info.get("release_id") else "Hermes+ (chưa rõ số hiệu bản)"


_REL_ID = re.compile(r"^(\d{4})\.(\d{2})\.(\d{2})-(\d+)(?:-(.+))?$")


def _release_order(rid: Any) -> Optional[tuple]:
    m = _REL_ID.match(str(rid or "").strip())
    return (int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))) if m else None


def is_newer_release(remote_id: Any, installed_id: Any) -> Optional[bool]:
    """Bản `remote_id` có MỚI hơn bản đang chạy không (số hiệu dạng «năm.tháng.ngày-số thứ tự»)? None = không so sánh được.

    Cùng số hiệu mà bản đang chạy có hậu tố (vd «-thu» = bản thử chưa phát hành) thì bản công khai được coi là mới hơn (thay bản thử bằng bản thật).
    Mục đích: kho công khai chỉ giữ một commit, nên không dựa vào lịch sử git; và không bao giờ hạ cấp."""
    a, b = _release_order(remote_id), _release_order(installed_id)
    if a is None or b is None:
        return None
    if a != b:
        return a > b
    m = _REL_ID.match(str(installed_id).strip())
    return bool(m and m.group(5))


def _friendly_access_error(exc: BaseException) -> str:
    text = str(exc)
    if not _override_repo():
        return "Không tải được thông tin bản phát hành từ kho công khai Hermes+ trên GitHub (kiểm tra mạng của máy chủ rồi thử lại)."
    if "Permission denied" in text or "publickey" in text or "Repository not found" in text or "Could not read from remote" in text:
        return ("Máy này chưa có quyền đọc kho Hermes+ trên GitHub. Hãy thêm khoá triển khai (deploy key, chỉ-đọc) của máy này vào "
                "kho (Settings → Deploy keys), khoá công khai nằm ở ~/.ssh/hermes_plus_update.pub trên máy.")
    if "Could not resolve host" in text or "timed out" in text or "Connection" in text:
        return "Không kết nối được tới GitHub (kiểm tra mạng của máy chủ)."
    return f"Không liên lạc được kho cập nhật: {text[-300:]}"


def _remote_head() -> str:
    """Mã commit mới nhất của nhánh phát hành (git ls-remote); lỗi truy cập → UpdateError."""
    proc = _run(["git", "ls-remote", _repo(), f"refs/heads/{_branch()}"], env=_git_env(), timeout=60)
    line = (proc.stdout or "").strip().splitlines()
    if not line:
        raise UpdateError(f"Kho không có nhánh phát hành «{_branch()}».")
    return line[0].split()[0]


def _cache_repo() -> Path:
    return data_dir() / "cache.git"


def _fetch_cache() -> None:
    cache = _cache_repo()
    if not (cache / "HEAD").exists():
        _run(["git", "init", "--bare", "-q", str(cache)])
    _run(["git", "fetch", "-q", "--depth=30", _repo(), f"+refs/heads/{_branch()}:refs/heads/{_branch()}"], cwd=cache, env=_git_env(), timeout=300)


def check(force: bool = False) -> dict[str, Any]:
    """Phản hồi cho nút/hộp thoại cập nhật (cùng hình dạng với /api/hermes/update/check của Hermes gốc)."""
    info = installed_release()
    payload: dict[str, Any] = {
        "install_method": "hermes-plus",
        "current_version": describe_installed(info),
        "behind": None,
        "update_available": False,
        "can_apply": True,
        "update_command": "hermes update",
        "message": None,
    }
    try:
        head = _remote_head()
    except (UpdateError, subprocess.TimeoutExpired, OSError) as exc:
        payload["message"] = _friendly_access_error(exc)
        return payload
    current = info.get("release_commit")
    payload["latest_commit"] = head[:7]
    if current and current == head:
        payload["behind"] = 0
        payload["message"] = "Đang dùng bản mới nhất."
        return payload
    # Có bản khác (hoặc chưa rõ bản hiện tại): lấy danh sách thay đổi để hiển thị
    commits: list[dict[str, Any]] = []
    behind = -1
    try:
        _fetch_cache()
        cache = _cache_repo()
        rel0 = _read_json_from_git(cache, f"{_branch()}:RELEASE.json")
        if rel0:
            payload["latest_release"] = rel0.get("release_id")
            payload["latest_version"] = rel0.get("version")
            payload["latest_notes"] = rel0.get("notes")
        if is_newer_release(rel0.get("release_id"), info.get("release_id")) is False:       # kho công khai không mới hơn bản đang chạy → không hạ cấp
            payload["behind"] = 0
            payload["message"] = f"Đang dùng {describe_installed(info)}, không cũ hơn bản công khai mới nhất ({rel0.get('release_id')}). Không cần cập nhật."
            return payload
        rng = f"{current}..{_branch()}" if current else _branch()
        fmt = "%H%x1f%s%x1f%an%x1f%ct"
        if current:
            probe = _run(["git", "cat-file", "-e", f"{current}^{{commit}}"], cwd=cache, check=False)
            if probe.returncode != 0:
                rng = _branch()
        out = _run(["git", "log", f"--format={fmt}", "-n", "20", rng], cwd=cache).stdout
        for row in out.strip().splitlines():
            sha, summary, author, at = (row.split("\x1f") + ["", "", "", "0"])[:4]
            commits.append({"sha": sha[:7], "summary": summary, "author": author, "at": int(at or 0)})
        if current and rng != _branch():
            behind = int(_run(["git", "rev-list", "--count", rng], cwd=cache).stdout.strip() or 0)
        elif commits:
            behind = len(commits)
        rel = _read_json_from_git(cache, f"{_branch()}:RELEASE.json")
        if rel:
            payload["latest_release"] = rel.get("release_id")
            payload["latest_version"] = rel.get("version")
            payload["latest_notes"] = rel.get("notes")
    except (UpdateError, subprocess.TimeoutExpired, OSError, ValueError) as exc:
        payload["message"] = f"Có bản mới nhưng chưa đọc được danh sách thay đổi: {exc}"
    payload["behind"] = behind if behind != 0 else 1
    payload["update_available"] = True
    payload["commits"] = commits
    return payload


def _read_json_from_git(cache: Path, spec: str) -> dict:
    proc = _run(["git", "show", spec], cwd=cache, check=False)
    if proc.returncode != 0:
        return {}
    try:
        data = json.loads(proc.stdout)
        return data if isinstance(data, dict) else {}
    except ValueError:
        return {}


# ──────────────────────────────────────────────────────────────────────────────
# Chạy cập nhật
# ──────────────────────────────────────────────────────────────────────────────

def _say(msg: str) -> None:
    print(f"[plus-update {datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def _python() -> str:
    cand = install_dir() / "venv" / "bin" / "python"
    return str(cand) if cand.exists() else sys.executable


def _uv() -> Optional[str]:
    return shutil.which("uv") or ("/usr/local/bin/uv" if Path("/usr/local/bin/uv").exists() else None)


def _rsync(src: Path, dst: Path, *, delete: bool = True) -> None:
    cmd = ["rsync", "-a"]
    if delete:
        cmd.append("--delete")
    for ex in RSYNC_EXCLUDES:
        cmd.append(f"--exclude={ex}")
    cmd += [f"{src}/", f"{dst}/"]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    # mã 23/24 = một số file không xoá/đọc được (ví dụ thư mục còn __pycache__ bị loại trừ) — không nghiêm trọng
    if proc.returncode not in (0, 23, 24):
        raise UpdateError("rsync lỗi: " + (proc.stderr or proc.stdout).strip()[-300:])


def _backup_db() -> Optional[Path]:
    raw = os.environ.get("HERMES_POCLIP_DB_PATH", "").strip()
    db = Path(raw) if raw else hermes_home() / "poclip.db"
    if not db.exists():
        _say("không thấy cơ sở dữ liệu công ty — bỏ qua bước sao lưu DB")
        return None
    out_dir = data_dir() / "backups"
    out_dir.mkdir(exist_ok=True)
    dst = out_dir / f"poclip-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
    try:
        src = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        try:
            dest = sqlite3.connect(dst)
            try:
                src.backup(dest)
            finally:
                dest.close()
        finally:
            src.close()
    except sqlite3.Error as exc:
        dst.unlink(missing_ok=True)
        raise UpdateError(f"Không sao lưu được cơ sở dữ liệu công ty ({exc}) — dừng cập nhật để bảo vệ dữ liệu.") from exc
    for old in sorted(out_dir.glob("poclip-*.db"))[:-5]:      # giữ 5 bản gần nhất
        old.unlink(missing_ok=True)
    _say(f"đã sao lưu cơ sở dữ liệu: {dst.name} ({dst.stat().st_size // 1024} KB)")
    return dst


def _snapshot_tree() -> Path:
    prev = data_dir() / "prev-tree"
    prev.mkdir(exist_ok=True)
    _rsync(install_dir(), prev, delete=True)
    uv = _uv()
    if uv:
        frz = subprocess.run([uv, "pip", "freeze", "--python", _python()], capture_output=True, text=True, encoding="utf-8", errors="replace")
        (data_dir() / "prev-freeze.txt").write_text(frz.stdout or "", encoding="utf-8")
    (data_dir() / "prev-installed.json").write_text(json.dumps(installed_release(), ensure_ascii=False), encoding="utf-8")
    _say("đã lưu bản mã hiện tại để quay lại khi cần")
    return prev


def _wait_idle() -> None:
    """Chờ không còn việc Kanban đang chạy (nếu đọc được), tối đa IDLE_WAIT_SECONDS."""
    deadline = time.time() + IDLE_WAIT_SECONDS
    while True:
        try:
            n = _running_task_count()
        except Exception:
            return
        if n == 0:
            return
        if time.time() >= deadline:
            _say(f"vẫn còn {n} việc đang chạy sau {IDLE_WAIT_SECONDS}s — tiếp tục (việc dở sẽ được hệ thống thu hồi)")
            return
        _say(f"đang chờ {n} việc Kanban chạy xong...")
        time.sleep(15)


def _running_task_count() -> int:
    from hermes_cli import kanban_db as kb

    total = 0
    for b in kb.list_boards(include_archived=False):
        slug = b.get("slug")
        if not slug:
            continue
        with kb.connect_closing(board=slug) as conn:
            total += conn.execute("SELECT COUNT(*) FROM tasks WHERE status='running'").fetchone()[0]
    return total


def _fetch_release(stage: Path) -> str:
    # Lấy từ bộ nhớ đệm vừa tải (run_update đã gọi _fetch_cache) thay vì tải lại từ mạng — bản công khai nặng ~150 MB
    cache = _cache_repo()
    if (cache / "HEAD").exists():
        _run(["git", "clone", "-q", "--depth", "1", "--branch", _branch(), f"file://{cache}", str(stage)], env=_git_env(), timeout=900)
    else:
        _run(["git", "clone", "-q", "--depth", "1", "--branch", _branch(), _repo(), str(stage)], env=_git_env(), timeout=900)
    sha = _run(["git", "rev-parse", "HEAD"], cwd=stage).stdout.strip()
    shutil.rmtree(stage / ".git", ignore_errors=True)
    return sha


def _check_build_compat(rel: dict, py: str) -> None:
    """Bản phát hành BIÊN DỊCH (RELEASE.json có `build`) chỉ chạy đúng phiên bản Python và nền tảng đã dựng — kiểm trước khi thay mã."""
    build = rel.get("build") or {}
    if not isinstance(build, dict) or not build.get("python"):
        return
    probe = subprocess.run([py, "-c", "import sys, platform; print('cp%d%d' % sys.version_info[:2], platform.machine(), platform.system())"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
    parts = probe.stdout.split()
    if probe.returncode != 0 or len(parts) != 3:
        raise UpdateError("Không xác định được phiên bản Python của máy để kiểm tra bản biên dịch.")
    have_tag, have_machine, have_system = parts
    want_tag = str(build.get("python"))
    if have_tag != want_tag:
        raise UpdateError(f"Bản phát hành này đã biên dịch cho Python {want_tag[2]}.{want_tag[3:]} nhưng máy đang chạy Python "
                          f"{have_tag[2]}.{have_tag[3:]}. Không cập nhật để tránh chạy hỏng — hãy chạy lại bộ cài để tạo môi trường Python đúng.")
    want_platform = str(build.get("platform") or "")
    have_platform = f"{have_system.lower()}-{'x86_64' if have_machine in ('x86_64', 'AMD64') else have_machine}"
    if want_platform and want_platform != have_platform:
        raise UpdateError(f"Bản phát hành này đã biên dịch cho nền tảng {want_platform} nhưng máy là {have_platform}. Không cập nhật.")


def _validate_stage(stage: Path) -> dict:
    for rel in ("hermes_cli/__init__.py", "RELEASE.json"):
        if not (stage / rel).exists():
            raise UpdateError(f"Bản phát hành thiếu file bắt buộc: {rel}")
    if not (stage / "hermes_cli" / "web_dist" / "index.html").exists():
        raise UpdateError("Bản phát hành thiếu giao diện web đã dựng (hermes_cli/web_dist).")
    py = _python()
    _check_build_compat(_read_json(stage / "RELEASE.json"), py)
    comp = subprocess.run([py, "-m", "compileall", "-q", "-j", "2", "hermes_cli", "agent", "gateway", "tools", "plugins"],
                          cwd=str(stage), capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
    if comp.returncode != 0:
        raise UpdateError("Mã bản mới không biên dịch được: " + (comp.stdout + comp.stderr).strip()[-300:])
    # Nạp thử trong thư mục tạm (không đụng dữ liệu thật)
    tmp = Path(tempfile.mkdtemp(prefix="plus-smoke-"))
    try:
        env = dict(os.environ)
        env.update({"HERMES_HOME": str(tmp), "HERMES_POCLIP_DB_PATH": str(tmp / "poclip.db"), "PYTHONPATH": str(stage),
                    "HERMES_POCLIP_HOME": str(tmp)})
        smoke = subprocess.run([py, "-c", "import hermes_cli.main, hermes_cli.web_server, hermes_cli.kanban_db; print('smoke-ok')"],
                               cwd=str(stage), env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
        if smoke.returncode != 0 or "smoke-ok" not in smoke.stdout:
            raise UpdateError("Nạp thử bản mới thất bại: " + (smoke.stderr or smoke.stdout).strip()[-400:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return _read_json(stage / "RELEASE.json")


def _install_requirements(stage: Path) -> None:
    req = stage / "requirements-release.txt"
    if not req.exists():
        _say("bản phát hành không kèm danh sách thư viện — bỏ qua")
        return
    uv = _uv()
    if not uv:
        raise UpdateError("Không tìm thấy công cụ `uv` để cài thư viện.")
    _say("cài/cập nhật thư viện theo danh sách của bản phát hành")
    _run([uv, "pip", "install", "--python", _python(), "-r", str(req)], timeout=900)


def _service_pid(name: str) -> int:
    proc = subprocess.run(["systemctl", "show", name, "-p", "MainPID", "--value"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    try:
        return int((proc.stdout or "0").strip() or 0)
    except ValueError:
        return 0


def _service_active(name: str) -> bool:
    return subprocess.run(["systemctl", "is-active", "--quiet", name]).returncode == 0


def _restart_service(name: str, wait: int) -> None:
    """Khởi động lại bằng cách kết thúc tiến trình chính — systemd (Restart=on-failure) dựng lại ngay."""
    old = _service_pid(name)
    if not old:
        raise UpdateError(f"Dịch vụ {name} không chạy dưới systemd — hãy khởi động lại thủ công.")
    os.kill(old, signal.SIGKILL)
    deadline = time.time() + 120
    new = old
    while time.time() < deadline:
        time.sleep(2)
        new = _service_pid(name)
        if new and new != old and _service_active(name):
            break
    else:
        raise UpdateError(f"Dịch vụ {name} không chạy lại được sau khi nạp bản mới.")
    time.sleep(wait)
    if not _service_active(name) or _service_pid(name) != new:
        raise UpdateError(f"Dịch vụ {name} chạy lại nhưng không ổn định (tự tắt trong {wait}s).")


def _gateway_service() -> str:
    return _services()[0]


def _dashboard_service() -> str:
    return _services()[-1]


def _mark_installed(release_commit: str, rel: dict) -> None:
    rec = {
        "release_commit": release_commit,
        "release_id": rel.get("release_id"),
        "version": rel.get("version"),
        "applied_at": datetime.now(timezone.utc).isoformat(),
    }
    (data_dir() / "installed.json").write_text(json.dumps(rec, ensure_ascii=False), encoding="utf-8")


def _log_root_marker(action_id: str) -> None:
    """Ghi dấu hoàn tất vào update.log gốc — giao diện đọc dấu này (còn nguyên sau khi bảng điều khiển khởi động lại)."""
    if not action_id:
        return
    try:
        from hermes_cli.logs import log_file_path

        with open(log_file_path("update"), "a", encoding="utf-8") as fh:
            fh.write(f"=== hermes-update completed {action_id} ===\n")
    except Exception:
        pass


def run_update(*, action_id: str = "", flip_dashboard: bool = True, restart: bool = True) -> int:
    """Chạy cập nhật. Trả mã thoát: 0 = xong (hoặc đã là bản mới nhất), khác 0 = thất bại (đã quay về bản cũ nếu cần)."""
    if not is_enabled():
        _say("Đây không phải bản cài Hermes+ (thiếu RELEASE.json) và chưa đặt kho thay thế — không có nguồn cập nhật.")
        return 2
    lock_fh = open(data_dir() / "update.lock", "w")
    try:
        fcntl.flock(lock_fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        _say("Đang có một lần cập nhật khác chạy — dừng.")
        return 3
    swapped = False
    try:
        _say(f"bản đang chạy: {describe_installed()}")
        free = shutil.disk_usage(str(install_dir())).free
        if free < MIN_FREE_BYTES:
            raise UpdateError(f"Đĩa còn quá ít chỗ ({free // 1024**2} MB) — cần ít nhất {MIN_FREE_BYTES // 1024**2} MB.")
        head = _remote_head()
        cur = installed_release().get("release_commit")
        if cur and cur == head:
            _say("đã là bản phát hành mới nhất — không có gì để cập nhật.")
            _log_root_marker(action_id)
            return 0
        _say(f"bản mới trên nhánh «{_branch()}»: {head[:7]}")
        _fetch_cache()
        rel_peek = _read_json_from_git(_cache_repo(), f"{_branch()}:RELEASE.json")
        if is_newer_release(rel_peek.get("release_id"), installed_release().get("release_id")) is False:
            _say(f"bản công khai mới nhất ({rel_peek.get('release_id')}) không mới hơn bản đang chạy — giữ nguyên, không hạ cấp.")
            _log_root_marker(action_id)
            return 0
        _wait_idle()
        _backup_db()
        _snapshot_tree()
        stage = Path(tempfile.mkdtemp(prefix="plus-stage-", dir=str(data_dir())))
        try:
            tree = stage / "tree"
            release_commit = _fetch_release(tree)
            _say(f"đã tải bản phát hành {release_commit[:7]}")
            rel = _validate_stage(tree)
            _say(f"đã kiểm tra: biên dịch + nạp thử đạt ({rel.get('release_id') or release_commit[:7]})")
            _install_requirements(tree)
            _say("nạp mã mới vào thư mục cài đặt")
            swapped = True
            _apply_identity(tree, _read_identity(install_dir()))      # giữ tên công ty Chủ tịch đã đặt
            _rsync(tree, install_dir(), delete=True)
        finally:
            shutil.rmtree(stage, ignore_errors=True)
        if restart:
            _say("khởi động lại cổng nhắn tin")
            _restart_service(_gateway_service(), GATEWAY_SETTLE_SECONDS)
            _say("cổng nhắn tin chạy ổn định với bản mới")
        _mark_installed(release_commit, rel)
        _say(f"HOÀN TẤT: {describe_installed()}")
        _log_root_marker(action_id)
        if restart and flip_dashboard:
            _say(f"khởi động lại bảng điều khiển sau {DASHBOARD_FLIP_DELAY_SECONDS}s (trang sẽ tự tải lại)")
            time.sleep(DASHBOARD_FLIP_DELAY_SECONDS)
            try:
                _restart_service(_dashboard_service(), 0)
            except UpdateError:
                pass          # tiến trình này nằm trong chính dịch vụ vừa bị kết thúc — bình thường
        return 0
    except (UpdateError, subprocess.TimeoutExpired, OSError) as exc:
        raw = str(exc)
        if not swapped and any(k in raw for k in ("Permission denied", "publickey", "Repository not found", "Could not read from remote", "Could not resolve host")):
            _say(f"LỖI: {_friendly_access_error(exc)}")      # giải thích dễ hiểu thay vì nguyên văn lỗi git
        else:
            _say(f"LỖI: {exc}")
        if swapped:
            _say("đang quay về bản cũ...")
            try:
                rollback(restart=restart, quiet=True)
                _say("đã quay về bản cũ")
            except Exception as rexc:      # noqa: BLE001
                _say(f"QUAY VỀ BẢN CŨ THẤT BẠI: {rexc} — chạy thủ công: python -m hermes_cli.plus_update rollback")
        return 1
    finally:
        try:
            fcntl.flock(lock_fh, fcntl.LOCK_UN)
        finally:
            lock_fh.close()


def rollback(*, restart: bool = True, quiet: bool = False) -> int:
    """Khôi phục cây mã đã lưu trước lần cập nhật gần nhất."""
    prev = data_dir() / "prev-tree"
    if not (prev / "hermes_cli").exists():
        raise UpdateError("Không có bản mã cũ đã lưu để quay lại.")
    _rsync(prev, install_dir(), delete=True)
    pi = _read_json(data_dir() / "prev-installed.json")
    inst = data_dir() / "installed.json"
    if pi.get("release_commit"):
        inst.write_text(json.dumps({"release_commit": pi.get("release_commit"), "release_id": pi.get("release_id"),
                                    "version": pi.get("version"), "applied_at": datetime.now(timezone.utc).isoformat()}), encoding="utf-8")
    else:
        inst.unlink(missing_ok=True)
    if restart:
        for svc in _services():
            try:
                _restart_service(svc, 5)
            except UpdateError as exc:
                if not quiet:
                    print(f"[plus-update] cảnh báo: {exc}", flush=True)
    if not quiet:
        _say("đã quay về bản cũ")
    return 0


def run_cli(args: Any = None) -> int:
    """Điểm vào của `hermes update` trên bản cài Hermes+."""
    action_id = os.environ.get("HERMES_ACTION_ID", "").strip()
    return run_update(action_id=action_id)


if __name__ == "__main__":     # python -m hermes_cli.plus_update [check|update|rollback]
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "check").lower()
    if cmd == "rollback":
        sys.exit(rollback())
    if cmd == "update":
        sys.exit(run_update(action_id=os.environ.get("HERMES_ACTION_ID", "")))
    print(json.dumps(check(force=True), ensure_ascii=False, indent=2))
