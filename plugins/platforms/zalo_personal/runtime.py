"""Profile-local state and policy primitives for Zalo Personal."""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import tempfile
import time
from contextlib import suppress
from pathlib import Path

from hermes_constants import get_hermes_home

MAX_TEXT_CHARS = 1800
HANDOFF_SECONDS = 24 * 60 * 60
HANDOFF_MARKER = "[[CHUYEN_NGUOI]]"
RESUME_PHRASES = {"trợ lý trả lời tiếp", "tro ly tra loi tiep"}
ESCALATION_TERMS = (
    "khiếu nại", "khieu nai", "hoàn tiền", "hoan tien", "thanh toán", "thanh toan",
    "chuyển khoản", "chuyen khoan", "người thật", "nguoi that", "tư vấn viên", "tu van vien",
    "mật khẩu", "mat khau", "otp", "thẻ", "the",
)


def plugin_home() -> Path:
    path = get_hermes_home() / "zalo_personal"
    path.mkdir(parents=True, exist_ok=True)
    return path


def credential_path() -> Path:
    return plugin_home() / "credentials.json"


def credential_identity() -> str:
    """Stable lock identity for the saved session: a hash of credentials.json, never its content."""
    return hashlib.sha256(credential_path().read_bytes()).hexdigest()[:32]


def qr_path() -> Path:
    return plugin_home() / "login-qr.png"


def safe_id(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]


def needs_handoff(text: str, terms=None) -> bool:
    """Tin có từ khóa «chuyển người thật» không. `terms` None = danh sách mặc định; danh sách rỗng = tắt hẳn.

    Từ khóa phải đứng RIÊNG như một từ. Lỗi thật (máy 218, 30/10/2026): so khớp theo chuỗi con nên «the» khớp trong «theo», «them»… và «otp» khớp trong từ khác;
    tin bình thường của Chủ tịch bị coi là «cần người thật» và cuộc chat im lặng 24 giờ."""
    use = ESCALATION_TERMS if terms is None else tuple(str(t).strip().lower() for t in terms if str(t).strip())
    if not use:
        return False
    normalized = " ".join((text or "").lower().split())
    return any(re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", normalized) for term in use)


def split_text(text: str, limit: int = MAX_TEXT_CHARS) -> list[str]:
    remaining = (text or "").strip()
    if not remaining:
        return ["Mình chưa nhận được nội dung. Anh/chị nhắn lại giúp mình nhé."]
    result: list[str] = []
    while len(remaining) > limit:
        cut = max(remaining.rfind("\n", 0, limit), remaining.rfind(" ", 0, limit))
        if cut < max(1, limit // 2):
            cut = limit
        result.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()
    if remaining:
        result.append(remaining)
    return result


def atomic_json_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="zalo-personal-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
        with suppress(OSError):
            os.chmod(path, 0o600)
    finally:
        with suppress(OSError):
            os.unlink(temporary)


class StateStore:
    """Persistent operational state. It never stores message text or cookies."""

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or plugin_home() / "state.sqlite3"
        self.conn = sqlite3.connect(self.path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS events (event_id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS peers (
                thread_id TEXT NOT NULL, thread_type TEXT NOT NULL, sender_id TEXT NOT NULL,
                display_name TEXT NOT NULL, last_seen INTEGER NOT NULL,
                PRIMARY KEY(thread_id, sender_id)
            );
            CREATE TABLE IF NOT EXISTS pauses (
                thread_id TEXT NOT NULL, sender_id TEXT NOT NULL, paused_until INTEGER NOT NULL,
                PRIMARY KEY(thread_id, sender_id)
            );
            CREATE TABLE IF NOT EXISTS bot_messages (message_id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS status_notices (task_id TEXT NOT NULL, level INTEGER NOT NULL, sent_at INTEGER NOT NULL, PRIMARY KEY(task_id, level));
        """)
        self.conn.commit()

    def claim_event(self, event_id: str) -> bool:
        if not event_id:
            return True
        try:
            self.conn.execute("INSERT INTO events(event_id, created_at) VALUES (?, ?)", (event_id, int(time.time())))
            self.conn.execute("DELETE FROM events WHERE created_at < ?", (int(time.time()) - 7 * 86400,))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def record_peer(self, thread_id: str, thread_type: str, sender_id: str, display_name: str) -> None:
        self.conn.execute(
            "INSERT INTO peers(thread_id,thread_type,sender_id,display_name,last_seen) VALUES(?,?,?,?,?) "
            "ON CONFLICT(thread_id,sender_id) DO UPDATE SET display_name=excluded.display_name,last_seen=excluded.last_seen",
            (thread_id, thread_type, sender_id, display_name or "(không rõ)", int(time.time())),
        )
        self.conn.commit()

    def peers(self) -> list[tuple[str, str, str, str, int]]:
        return self.conn.execute(
            "SELECT thread_id,thread_type,sender_id,display_name,last_seen FROM peers ORDER BY last_seen DESC"
        ).fetchall()

    def pause(self, thread_id: str, sender_id: str, seconds: int = HANDOFF_SECONDS) -> None:
        self.conn.execute(
            "INSERT INTO pauses(thread_id,sender_id,paused_until) VALUES(?,?,?) "
            "ON CONFLICT(thread_id,sender_id) DO UPDATE SET paused_until=excluded.paused_until",
            (thread_id, sender_id, int(time.time()) + seconds),
        )
        self.conn.commit()

    def is_paused(self, thread_id: str, sender_id: str) -> bool:
        now = int(time.time())
        rows = self.conn.execute(
            "SELECT paused_until FROM pauses WHERE thread_id=? AND sender_id IN (?, '*')", (thread_id, sender_id)
        ).fetchall()
        self.conn.execute("DELETE FROM pauses WHERE paused_until <= ?", (now,))
        self.conn.commit()
        return any(int(row[0]) > now for row in rows)

    def resume(self, thread_id: str, sender_id: str) -> None:
        self.conn.execute("DELETE FROM pauses WHERE thread_id=? AND sender_id IN (?, '*')", (thread_id, sender_id))
        self.conn.commit()

    def record_bot_message(self, message_id: str) -> None:
        if message_id:
            self.conn.execute("INSERT OR REPLACE INTO bot_messages(message_id,created_at) VALUES(?,?)", (message_id, int(time.time())))
            self.conn.commit()

    def notice_sent(self, task_id: str, level: int) -> bool:
        return bool(self.conn.execute("SELECT 1 FROM status_notices WHERE task_id=? AND level=?", (task_id, level)).fetchone())

    def mark_notice(self, task_id: str, level: int) -> None:
        self.conn.execute("INSERT OR IGNORE INTO status_notices(task_id,level,sent_at) VALUES(?,?,?)", (task_id, level, int(time.time())))
        self.conn.execute("DELETE FROM status_notices WHERE sent_at < ?", (int(time.time()) - 14 * 86400,))
        self.conn.commit()

    def is_bot_message(self, message_id: str) -> bool:
        return bool(message_id and self.conn.execute("SELECT 1 FROM bot_messages WHERE message_id=?", (message_id,)).fetchone())

    def close(self) -> None:
        self.conn.close()


# ── «Đang soạn tin» trong lúc công ty xử lý yêu cầu ─────────────────────────────────────────────
# Người hỏi nhắn qua Zalo → bot tạo thẻ Kanban và báo «đang xử lý» → vài phút sau thẻ xong, kết quả gửi lại. Suốt quãng chờ đó agent đã trả lời xong nên gateway không còn
# gửi «đang soạn»; người hỏi thấy im lặng. Các hàm dưới tìm cuộc chat Zalo nào đang chờ thẻ để adapter giữ «đang soạn» (tối đa PENDING_TYPING_MAX_SECONDS).
PENDING_TYPING_MAX_SECONDS = 7200                      # Chủ tịch 04/11/2026: chưa có kết quả thì còn hiện «đang soạn» (trước đây dừng sau 10 phút trong khi câu trả lời có thể mất 30–70 phút)
PENDING_TYPING_INTERVAL_SECONDS = 4.0
ACTIVE_TASK_STATUSES = ("triage", "todo", "ready", "running", "review")      # «blocked» là chờ người, không tính


def kanban_db_paths() -> list[Path]:
    """Mọi bảng Kanban đang có (mặc định + bảng đặt tên). Không đọc được → []."""
    try:
        from hermes_cli import kanban_db as kb

        paths = [Path(kb.kanban_db_path("default"))]
        root = Path(kb.boards_root())
        if root.is_dir():
            paths += [p / "kanban.db" for p in sorted(root.iterdir()) if (p / "kanban.db").is_file()]
        return [p for p in paths if p.is_file()]
    except Exception:  # noqa: BLE001
        return []


def pending_kanban_chats(db_paths, now: float | None = None, window: int = PENDING_TYPING_MAX_SECONDS, platform: str = "zalo_personal") -> dict[str, str]:
    """{chat_id: 'group'|'user'} của các cuộc chat đang chờ ít nhất một thẻ CHƯA XONG được tạo trong `window` giây qua. Chỉ đọc; lỗi từng bảng được bỏ qua."""
    now = time.time() if now is None else now
    out: dict[str, str] = {}
    marks = ",".join("?" for _ in ACTIVE_TASK_STATUSES)
    for path in db_paths:
        conn = None
        try:
            conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1)
            rows = conn.execute(
                "SELECT s.chat_id, s.chat_type FROM kanban_notify_subs s JOIN tasks t ON t.id = s.task_id "
                f"WHERE s.platform = ? AND t.status IN ({marks}) AND s.created_at >= ?",
                (platform, *ACTIVE_TASK_STATUSES, int(now) - window),
            ).fetchall()
        except Exception:  # noqa: BLE001
            continue
        finally:
            if conn is not None:
                with suppress(Exception):
                    conn.close()
        for chat_id, chat_type in rows:
            if chat_id:
                out[str(chat_id)] = "group" if str(chat_type or "").lower() == "group" else "user"
    return out


# ── Tin trạng thái khi yêu cầu tư vấn chờ lâu (Chủ tịch quyết định 04/11/2026) ───────────────────────────
# Mục tiêu trả lời 30 phút; trước đây việc nhắn «cần thêm thời gian» do nhân viên tiếp nhận tự nhớ (không đáng tin: ca FPT 70 phút im lặng).
# Nay bộ nối tự nhắn ĐÚNG MỘT tin ở mốc 15 phút và MỘT tin ở mốc 30 phút cho mỗi yêu cầu còn đang chờ, không phụ thuộc mô hình AI.
STATUS_STEPS = ((900, 1), (1800, 2))                       # (số giây kể từ lúc nhận, mức)
STATUS_WINDOW_SECONDS = 3 * 3600                           # quá 3 giờ thì thôi (đã có tin 15 và 30 phút)
REQUEST_TITLE_PREFIXES = ("[YÊU CẦU TƯ VẤN]", "[TƯ VẤN")
OPEN_REQUEST_STATUSES = ("triage", "todo", "ready", "running", "review", "blocked")      # chờ Hội đồng cũng là «chưa xong»
STATUS_TEXTS = {
    1: "Em vẫn đang xử lý câu hỏi của anh/chị ạ. Câu này cần đối chiếu số liệu giữa nhiều phòng nên lâu hơn dự kiến. Em sẽ gửi kết quả ngay khi xong, anh/chị không cần nhắn lại.",
    2: "Em xin lỗi vì đã quá 30 phút. Câu hỏi của anh/chị vẫn đang được xử lý, em sẽ gửi ngay khi có kết quả.",
}


def pending_requests(db_paths, now: float | None = None, platform: str = "zalo_personal") -> list[dict]:
    """Các yêu cầu tư vấn (thẻ [YÊU CẦU TƯ VẤN] / [TƯ VẤN…]) của cuộc chat Zalo còn CHƯA XONG: {task_id, chat_id, thread_type, age_s}. Chỉ đọc; lỗi từng bảng bỏ qua."""
    now = time.time() if now is None else now
    marks = ",".join("?" for _ in OPEN_REQUEST_STATUSES)
    like = " OR ".join("t.title LIKE ?" for _ in REQUEST_TITLE_PREFIXES)
    out: list[dict] = []
    for path in db_paths:
        conn = None
        try:
            conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1)
            rows = conn.execute(
                "SELECT s.task_id, s.chat_id, s.chat_type, s.created_at FROM kanban_notify_subs s JOIN tasks t ON t.id = s.task_id "
                f"WHERE s.platform = ? AND t.status IN ({marks}) AND ({like}) AND s.created_at >= ?",
                (platform, *OPEN_REQUEST_STATUSES, *[p + "%" for p in REQUEST_TITLE_PREFIXES], int(now) - STATUS_WINDOW_SECONDS),
            ).fetchall()
        except Exception:  # noqa: BLE001
            continue
        finally:
            if conn is not None:
                with suppress(Exception):
                    conn.close()
        mine = [(str(task_id), str(chat_id), "group" if str(chat_type or "").lower() == "group" else "user", int(now) - int(created or now))
                for task_id, chat_id, chat_type, created in rows if chat_id and task_id]
        for task_id, chat_id, thread_type, age_s in _one_card_per_request(path, mine):
            out.append({"task_id": task_id, "chat_id": chat_id, "thread_type": thread_type, "age_s": age_s})
    return out


def _one_card_per_request(path, cards: list[tuple[str, str, str, int]]) -> list[tuple[str, str, str, int]]:
    """MỘT yêu cầu của khách thường có HAI thẻ đều mang nhãn [YÊU CẦU TƯ VẤN] và cùng đăng ký nhận tin ở cuộc chat đó: thẻ tiếp nhận (do nhân viên tiếp nhận tạo) và thẻ điều phối
    (Trưởng phòng tạo sau 1–2 phút; thẻ tiếp nhận là thẻ CON của thẻ này nên thừa hưởng đăng ký). Tính riêng từng thẻ thì khách nhận mỗi tin trạng thái HAI lần (đã gặp 04/11/2026).
    Các thẻ cùng cuộc chat nối với nhau bằng liên kết cha–con được coi là MỘT yêu cầu; giữ thẻ cũ nhất (mốc thời gian đúng là lúc khách hỏi). Không đọc được liên kết → giữ nguyên."""
    if len(cards) < 2:
        return cards
    conn = None
    try:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1)
        marks = ",".join("?" for _ in cards)
        ids = [c[0] for c in cards]
        links = conn.execute(f"SELECT parent_id, child_id FROM task_links WHERE parent_id IN ({marks}) AND child_id IN ({marks})", (*ids, *ids)).fetchall()
    except Exception:  # noqa: BLE001
        return cards
    finally:
        if conn is not None:
            with suppress(Exception):
                conn.close()
    boss = {c[0]: c[0] for c in cards}
    chat_of = {c[0]: c[1] for c in cards}

    def find(x: str) -> str:
        while boss[x] != x:
            boss[x] = boss[boss[x]]
            x = boss[x]
        return x

    for a, b in links:
        a, b = str(a), str(b)
        if a in boss and b in boss and chat_of[a] == chat_of[b]:
            boss[find(a)] = find(b)
    oldest: dict[str, tuple[str, str, str, int]] = {}
    for card in cards:
        root = find(card[0])
        best = oldest.get(root)
        if best is None or (card[3], card[0]) > (best[3], best[0]):           # tuổi lớn nhất = thẻ cũ nhất
            oldest[root] = card
    return [c for c in cards if oldest[find(c[0])] is c]


def status_notices_due(db_paths, state: "StateStore", now: float | None = None, platform: str = "zalo_personal") -> list[dict]:
    """Tin trạng thái đến hạn mà chưa gửi: {task_id, task_ids, chat_id, thread_type, level, text}. Mỗi (thẻ, mức) chỉ một lần; mức thấp trước.
    Một cuộc chat chỉ nhận MỘT tin cho mỗi mức trong cùng một lượt kiểm tra (nội dung tin không riêng cho thẻ nào); `task_ids` là mọi thẻ được tính là đã báo khi tin đó gửi đi."""
    due: list[dict] = []
    seen: dict[tuple[str, int], dict] = {}
    for r in pending_requests(db_paths, now, platform):
        for seconds, level in STATUS_STEPS:
            if r["age_s"] >= seconds and not state.notice_sent(r["task_id"], level):
                key = (r["chat_id"], level)
                if key in seen:
                    seen[key]["task_ids"].append(r["task_id"])
                    continue
                item = {**r, "task_ids": [r["task_id"]], "level": level, "text": STATUS_TEXTS[level]}
                seen[key] = item
                due.append(item)
    return due
