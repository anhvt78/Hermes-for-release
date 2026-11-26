#!/usr/bin/env python3
"""deploy/hermes_plus_watchdog.py — Người canh độc lập ngoài tiến trình.

Chạy bằng python hệ thống (/usr/bin/python3), KHÔNG phụ thuộc venv/plugin.
Kết nối DB chỉ đọc; mọi lỗi DB đều bị bắt, người canh không bao giờ chết vì DB.

Cách Chủ tịch biết người canh còn sống:
  1. systemctl list-timers hermes-plus-watchdog.timer  ← thấy lượt kế tiếp
  2. cat /var/lib/hermes-plus/watchdog/watchdog_heartbeat.json  ← ts mới
  3. journalctl -u hermes-plus-watchdog --since "30 min ago"  ← dòng verdict
  4. python3 deploy/hermes_plus_watchdog.py --status  ← in JSON trạng thái
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import time
import traceback
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any

# ── Hằng số bản sao từ monitoring/heartbeat.py ────────────────────────────────
# CẢNH BÁO: giá trị này PHẢI bằng hệt DEFAULT_CONFIG trong monitoring/heartbeat.py.
# Ca kiểm thử test_silence_watchdog.py::test_02_constants_match khẳng định điều này.
DEFAULT_CONFIG: dict = {
    "cycle_seconds": 60,
    "silence_cycles": 10,
    "notify_channel": "both",
    "notify_max_repeat_seconds": 3600,
    "kinds": {
        "monitor_scan":     {"alarm": True,  "max_silence_seconds": None},
        "digest_send":      {"alarm": False, "max_silence_seconds": None},
        "state_transition": {"alarm": False, "max_silence_seconds": None},
        "model_call":       {"alarm": False, "max_silence_seconds": None},
    },
}

# DEFAULT_KINDS tách ra để test khớp hằng số dễ so sánh
DEFAULT_KINDS: dict = DEFAULT_CONFIG["kinds"]

# Nhãn tiếng Việt (viết hoa đầu câu để dùng trong cảnh báo)
_LABELS: dict[str, str] = {
    "monitor_scan":     "Lần quét giám sát cuối",
    "digest_send":      "Lần gửi báo cáo cuối",
    "state_transition": "Lần chuyển trạng thái cuối",
    "model_call":       "Lần gọi model thành công cuối",
}

_DEFAULT_DATA_DIR = "/var/lib/hermes-plus"
_DEFAULT_REPEAT_SECONDS = 3600
_DEFAULT_EXPECTED_INTERVAL = 120  # giây; đọc từ watchdog.json để ghi đè


# ── Tiện ích thời gian ─────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _parse_iso(s: str) -> datetime | None:
    """Parse chuỗi ISO 8601 → datetime UTC. Trả None nếu không parse được."""
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _fmt_duration(seconds: float) -> str:
    """60 → '1 phút', 90 → '1 phút 30 giây', 3661 → '1 giờ 1 phút 1 giây'."""
    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    parts = []
    if h:
        parts.append(f"{h} giờ")
    if m:
        parts.append(f"{m} phút")
    if s or not parts:
        parts.append(f"{s} giây")
    return " ".join(parts)


# ── Parse .env tối giản ────────────────────────────────────────────────────────

def _parse_dotenv(path: str) -> dict[str, str]:
    """Đọc tệp .env, trả dict key→value. Bỏ qua dòng trống và comment #."""
    result: dict[str, str] = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, _, v = line.partition("=")
                    result[k.strip()] = v.strip()
    except Exception:
        pass
    return result


# ── Đọc cấu hình ──────────────────────────────────────────────────────────────

def _load_watchdog_json(data_dir: str) -> dict:
    """Đọc watchdog.json từ DATA_DIR. Trả {} nếu thiếu/hỏng."""
    path = os.path.join(data_dir, "watchdog.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_db_config(db_path: str) -> dict:
    """Đọc monitoring_heartbeat từ cfg_settings. Trả {} nếu lỗi."""
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=5)
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT value_json FROM cfg_settings WHERE key='monitoring_heartbeat'"
        ).fetchone()
        conn.close()
        if row and row[0]:
            return json.loads(row[0])
    except Exception:
        pass
    return {}


def _load_delivery_config(db_path: str) -> dict:
    """Đọc digest_delivery từ cfg_settings. Trả {} nếu lỗi."""
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=5)
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT value_json FROM cfg_settings WHERE key='digest_delivery'"
        ).fetchone()
        conn.close()
        if row and row[0]:
            return json.loads(row[0])
    except Exception:
        pass
    return {}


def _merge_heartbeat_config(raw: dict) -> dict:
    """Hợp nhất raw vào DEFAULT_CONFIG (bản sao)."""
    import copy
    cfg = copy.deepcopy(DEFAULT_CONFIG)
    if not isinstance(raw, dict):
        return cfg
    v = raw.get("cycle_seconds")
    if isinstance(v, (int, float)) and 5 <= int(v) <= 3600:
        cfg["cycle_seconds"] = int(v)
    v = raw.get("silence_cycles")
    if isinstance(v, (int, float)) and 2 <= int(v) <= 1440:
        cfg["silence_cycles"] = int(v)
    v = raw.get("notify_channel")
    if v in ("telegram", "log", "both"):
        cfg["notify_channel"] = v
    v = raw.get("notify_max_repeat_seconds")
    if isinstance(v, (int, float)) and 60 <= int(v) <= 86400:
        cfg["notify_max_repeat_seconds"] = int(v)
    raw_kinds = raw.get("kinds")
    if isinstance(raw_kinds, dict):
        for kind, kv in raw_kinds.items():
            if kind in cfg["kinds"] and isinstance(kv, dict):
                if "alarm" in kv:
                    cfg["kinds"][kind]["alarm"] = bool(kv["alarm"])
                if "max_silence_seconds" in kv:
                    mss = kv["max_silence_seconds"]
                    if mss is None or (isinstance(mss, (int, float)) and int(mss) > 0):
                        cfg["kinds"][kind]["max_silence_seconds"] = (
                            None if mss is None else int(mss)
                        )
    return cfg


def _threshold_for(kind: str, cfg: dict) -> int | None:
    """Tính ngưỡng im lặng (giây). None nếu không giới hạn."""
    kind_cfg = cfg.get("kinds", {}).get(kind, {})
    mss = kind_cfg.get("max_silence_seconds")
    if mss is not None:
        return int(mss)
    if kind == "monitor_scan":
        return int(cfg.get("cycle_seconds", 60)) * int(cfg.get("silence_cycles", 10))
    return None


# ── Đọc nhịp tim ──────────────────────────────────────────────────────────────

def _read_heartbeats(db_path: str) -> list[dict]:
    """Đọc tất cả dòng runner_heartbeats. Trả [] nếu lỗi."""
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=5)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT kind, last_at, last_pid FROM runner_heartbeats"
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


# ── Kiểm tra nhịp tim ─────────────────────────────────────────────────────────

def _check_heartbeats(db_path: str | None, now: datetime) -> list[dict]:
    """Trả danh sách sự cố nhịp tim. Mỗi mục: {key, label, silence_s, threshold_s, pid_dead, note}."""
    incidents: list[dict] = []
    if not db_path:
        return incidents

    raw_cfg = _load_db_config(db_path)
    cfg = _merge_heartbeat_config(raw_cfg)

    heartbeats = _read_heartbeats(db_path)
    hb_by_kind = {r["kind"]: r for r in heartbeats}

    for kind, kind_cfg in cfg["kinds"].items():
        if not kind_cfg.get("alarm", False):
            continue
        threshold = _threshold_for(kind, cfg)
        if threshold is None:
            continue

        label = _LABELS.get(kind, kind)
        row = hb_by_kind.get(kind)

        if row is None or not row.get("last_at"):
            # Chưa từng có nhịp tim
            incidents.append({
                "key": f"heartbeat:{kind}",
                "label": label,
                "last_at": None,
                "silence_s": None,
                "threshold_s": threshold,
                "pid_dead": False,
                "pid": None,
                "note": "khoảng thời gian im lặng: không xác định",
            })
            continue

        last_dt = _parse_iso(row["last_at"])
        if last_dt is None:
            incidents.append({
                "key": f"heartbeat:{kind}",
                "label": label,
                "last_at": row["last_at"],
                "silence_s": None,
                "threshold_s": threshold,
                "pid_dead": False,
                "pid": None,
                "note": "không parse được last_at",
            })
            continue

        silence_s = (now - last_dt).total_seconds()
        if silence_s <= threshold:
            continue

        # Kiểm tra tiến trình
        pid = row.get("last_pid")
        pid_dead = False
        if pid:
            try:
                os.kill(int(pid), 0)
            except ProcessLookupError:
                pid_dead = True
            except Exception:
                pass

        incidents.append({
            "key": f"heartbeat:{kind}",
            "label": label,
            "last_at": row["last_at"],
            "silence_s": silence_s,
            "threshold_s": threshold,
            "pid_dead": pid_dead,
            "pid": pid,
            "note": None,
        })

    return incidents


# ── Kiểm tra HTTP ──────────────────────────────────────────────────────────────

def _check_http(port: int, now: datetime) -> list[dict]:
    """Trả danh sách sự cố HTTP. Trả [] nếu khoẻ."""
    incidents: list[dict] = []
    base = f"http://127.0.0.1:{port}"
    url1 = f"{base}/health"
    url2 = f"{base}/api/plugins/hermes-poclip/health"

    def _try_get(url: str) -> tuple[int | None, dict | None]:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                try:
                    body = json.loads(resp.read().decode("utf-8", errors="replace"))
                except Exception:
                    body = None
                return status, body
        except urllib.error.HTTPError as e:
            return e.code, None
        except Exception:
            return None, None

    status, body = _try_get(url1)
    if status is None:
        status, body = _try_get(url2)
        used_url = url2
    else:
        used_url = url1

    if status is None:
        incidents.append({
            "key": "http:health",
            "url": used_url,
            "note": f"GET {url1}: không kết nối được sau 10 giây",
        })
        return incidents

    # Có phản hồi (kể cả 401/403) → tiến trình còn sống
    if status == 200 and isinstance(body, dict):
        db_status = body.get("db", "ok")
        if db_status != "ok":
            incidents.append({
                "key": "http:db",
                "url": used_url,
                "note": f"DB của dashboard báo lỗi: {db_status}",
            })
    return incidents


# ── Log xoay vòng ──────────────────────────────────────────────────────────────

def _log_line(log_path: str, line: str) -> None:
    """Ghi 1 dòng vào log; xoay vòng khi > 2 MB."""
    try:
        log_dir = os.path.dirname(log_path)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        # Xoay vòng
        if os.path.isfile(log_path) and os.path.getsize(log_path) > 2 * 1024 * 1024:
            rot = log_path + ".1"
            try:
                os.replace(log_path, rot)
            except Exception:
                pass
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


# ── Trạng thái chống spam ──────────────────────────────────────────────────────

def _load_state(state_path: str) -> dict:
    try:
        with open(state_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"incidents": {}, "resolved": {}}


def _save_state(state_path: str, state: dict) -> None:
    try:
        os.makedirs(os.path.dirname(state_path) or ".", exist_ok=True)
        with open(state_path, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


# ── Gửi Telegram ──────────────────────────────────────────────────────────────

def _send_telegram(
    text: str,
    token: str,
    chat_id: str,
    api_base: str,
    log_path: str,
    dry_run: bool = False,
) -> bool:
    """Gửi tin Telegram. Trả True nếu thành công."""
    if dry_run:
        return False
    url = f"{api_base}/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": text}).encode("utf-8")
    try:
        req = urllib.request.Request(
            url, data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
            return True
    except Exception as exc:
        _log_line(log_path, f"[watchdog] lỗi gửi Telegram: {exc}")
        return False


# ── Dựng nội dung cảnh báo ────────────────────────────────────────────────────

def _build_alert_text(
    incidents: list[dict],
    now: datetime,
    gap_note: str | None = None,
) -> str:
    now_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = []

    hb_incs = [i for i in incidents if i["key"].startswith("heartbeat:")]
    http_incs = [i for i in incidents if i["key"].startswith("http:")]

    if hb_incs:
        lines.append("🟥 [GIÁM SÁT] PHÁT HIỆN IM LẶNG")
        for inc in hb_incs:
            if inc.get("silence_s") is not None:
                last_str = inc["last_at"] or "không rõ"
                dur = _fmt_duration(inc["silence_s"])
                thr = _fmt_duration(inc["threshold_s"])
                lines.append(f"- {inc['label']}: {last_str} — đã im lặng {dur} (ngưỡng {thr})")
            else:
                lines.append(f"- {inc['label']}: {inc.get('note', 'không xác định')}")
            if inc.get("pid_dead") and inc.get("pid"):
                lines.append(f"- Tiến trình giám sát (pid {inc['pid']}): đã chết")

    if http_incs:
        for inc in http_incs:
            if inc["key"] == "http:health":
                if lines:
                    lines.append("")
                lines.append("🟥 [GIÁM SÁT] DASHBOARD KHÔNG PHẢN HỒI")
                lines.append(f"- {inc['note']}")
            elif inc["key"] == "http:db":
                if lines:
                    lines.append("")
                lines.append("🟥 [GIÁM SÁT] DB DASHBOARD BÁO LỖI")
                lines.append(f"- {inc['note']}")

    if gap_note:
        lines.append(f"⚠ {gap_note}")

    lines.append(f"Người canh độc lập kiểm tra lúc {now_str} và phát ra cảnh báo này.")
    return "\n".join(lines)


def _build_recovery_text(key: str, now: datetime) -> str:
    now_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    label = {
        "heartbeat:monitor_scan": "Quét giám sát",
        "heartbeat:digest_send": "Gửi báo cáo",
        "heartbeat:state_transition": "Chuyển trạng thái",
        "heartbeat:model_call": "Gọi model",
        "http:health": "Dashboard",
        "http:db": "DB dashboard",
    }.get(key, key)
    return (
        f"🟩 [GIÁM SÁT] ĐÃ PHỤC HỒI\n"
        f"- {label} đã hoạt động trở lại.\n"
        f"Người canh độc lập ghi nhận lúc {now_str}."
    )


# ── Heartbeat của chính người canh ────────────────────────────────────────────

def _write_own_heartbeat(
    data_dir: str,
    now: datetime,
    verdict: str,
    checks: int,
    duration_ms: int,
    alert_sent: bool,
    note: str,
    expected_interval: int,
    log_path: str,
) -> str | None:
    """Ghi watchdog_heartbeat.json; trả note về gián đoạn nếu có."""
    hb_dir = os.path.join(data_dir, "watchdog")
    hb_path = os.path.join(hb_dir, "watchdog_heartbeat.json")
    gap_note = None
    try:
        os.makedirs(hb_dir, exist_ok=True)

        # Đọc lượt cũ
        if os.path.isfile(hb_path):
            try:
                with open(hb_path, encoding="utf-8") as f:
                    old = json.load(f)
                old_ts = _parse_iso(old.get("ts", ""))
                if old_ts:
                    gap = (now - old_ts).total_seconds()
                    threshold = 3 * expected_interval
                    if gap > threshold:
                        gap_note = (
                            f"Người canh có thể đã bị gián đoạn {_fmt_duration(gap)} "
                            f"(lượt trước lúc {old_ts.strftime('%Y-%m-%dT%H:%M:%SZ')})"
                        )
                        _log_line(log_path, f"[watchdog] ⚠ {gap_note}")
            except Exception:
                pass

        hb = {
            "ts": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "pid": os.getpid(),
            "verdict": verdict,
            "checks": checks,
            "duration_ms": duration_ms,
            "alert_sent": alert_sent,
            "note": note if note else (gap_note or ""),
        }
        with open(hb_path, "w", encoding="utf-8") as f:
            json.dump(hb, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        _log_line(log_path, f"[watchdog] lỗi ghi heartbeat: {exc}")
    return gap_note


# ── Lõi: chạy 1 lượt kiểm tra ─────────────────────────────────────────────────

def run_once(
    db_path: str | None,
    port: int | None,
    data_dir: str,
    state_path: str,
    log_path: str,
    dry_run: bool = False,
    no_http: bool = False,
    now: datetime | None = None,
    no_network: bool = False,
    token: str | None = None,
    chat_id: str | None = None,
    api_base: str | None = None,
    repeat_seconds: int = _DEFAULT_REPEAT_SECONDS,
    expected_interval: int = _DEFAULT_EXPECTED_INTERVAL,
) -> int:
    """Chạy 1 vòng kiểm tra. Trả mã thoát (0/1/2)."""
    t0 = time.monotonic()
    if now is None:
        now = _now_utc()

    # Thu thập sự cố
    incidents: list[dict] = []

    if db_path:
        try:
            hb_incidents = _check_heartbeats(db_path, now)
            incidents.extend(hb_incidents)
        except Exception as exc:
            _log_line(log_path, f"[watchdog] lỗi kiểm tra nhịp tim: {exc}")

    if not no_http and port:
        try:
            http_incidents = _check_http(port, now)
            incidents.extend(http_incidents)
        except Exception as exc:
            _log_line(log_path, f"[watchdog] lỗi kiểm tra HTTP: {exc}")

    incident_keys = {i["key"] for i in incidents}

    # Nạp trạng thái cũ
    state = _load_state(state_path)
    if not isinstance(state, dict):
        state = {"incidents": {}, "resolved": {}}
    if "incidents" not in state:
        state["incidents"] = {}
    if "resolved" not in state:
        state["resolved"] = {}

    now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    alerts_to_send: list[tuple[str, str]] = []  # (channel_key, text)
    active_for_alert = []

    # Xác định sự cố cần báo
    for inc in incidents:
        key = inc["key"]
        prev = state["incidents"].get(key)
        if prev is None:
            state["incidents"][key] = {
                "first_seen": now_iso,
                "last_alert_at": None,
                "alert_count": 0,
            }
            prev = state["incidents"][key]
        last_alert = _parse_iso(prev.get("last_alert_at") or "")
        if last_alert is None or (now - last_alert).total_seconds() >= repeat_seconds:
            active_for_alert.append(inc)

    # Phục hồi: khoá đã có trước đó nhưng không còn trong incidents
    for key, info in list(state["incidents"].items()):
        if key not in incident_keys and info.get("alert_count", 0) > 0:
            if key not in state["resolved"]:
                rec_text = _build_recovery_text(key, now)
                alerts_to_send.append((key + ":recover", rec_text))
                state["resolved"][key] = {"resolved_at": now_iso}
                del state["incidents"][key]

    # Dựng nội dung cảnh báo
    gap_note: str | None = None  # sẽ điền sau khi đọc heartbeat người canh
    alert_text: str | None = None
    if active_for_alert:
        alert_text = _build_alert_text(active_for_alert, now, gap_note)

    # Ghi heartbeat của chính người canh (trước khi điền gap_note vào alert)
    checks = (1 if db_path else 0) + (1 if (not no_http and port) else 0)
    verdict = "ALERT" if incidents else "OK"
    gap_note = _write_own_heartbeat(
        data_dir=data_dir,
        now=now,
        verdict=verdict,
        checks=checks,
        duration_ms=0,  # điền sau
        alert_sent=False,
        note="",
        expected_interval=expected_interval,
        log_path=log_path,
    )

    # Nếu có gap_note, xây lại alert_text
    if active_for_alert:
        alert_text = _build_alert_text(active_for_alert, now, gap_note)
        alerts_to_send.append(("incidents", alert_text))

    duration_ms = int((time.monotonic() - t0) * 1000)

    alert_sent = False
    if dry_run:
        for _, text in alerts_to_send:
            print(f"\n[dry-run] NỘI DUNG SẼ GỬI:\n{text}\n---")
    else:
        # Gửi thật
        if not no_network and token and chat_id:
            for ch_key, text in alerts_to_send:
                ok = _send_telegram(text, token, chat_id, api_base or "https://api.telegram.org", log_path)
                if ok:
                    alert_sent = True
                    key_ref = ch_key.replace(":recover", "").replace("incidents", "alert")
                    for k in list(state["incidents"].keys()):
                        if ch_key == "incidents" or ch_key.startswith(k):
                            state["incidents"][k]["last_alert_at"] = now_iso
                            state["incidents"][k]["alert_count"] = (
                                state["incidents"][k].get("alert_count", 0) + 1
                            )
        elif alerts_to_send:
            reason = "HERMES_WATCHDOG_NO_NETWORK=1" if no_network else "thiếu token/chat_id"
            _log_line(log_path, f"[watchdog] không gửi được vì {reason}")
            # Cập nhật last_alert_at để không spam log liên tục
            for inc in active_for_alert:
                key = inc["key"]
                if key in state["incidents"]:
                    state["incidents"][key]["last_alert_at"] = now_iso
                    state["incidents"][key]["alert_count"] = (
                        state["incidents"][key].get("alert_count", 0) + 1
                    )

        if not dry_run:
            _save_state(state_path, state)

    # Log + stdout
    verdict_final = "ALERT" if incidents else "OK"
    n_alerts = len(alerts_to_send)
    print(
        f"[watchdog] verdict={verdict_final} checks={checks} alerts={n_alerts} ms={duration_ms}",
        flush=True,
    )
    _log_line(
        log_path,
        f"[watchdog] {now_iso} verdict={verdict_final} checks={checks} "
        f"alerts={n_alerts} ms={duration_ms}",
    )

    # Cập nhật heartbeat với duration_ms thật
    if not dry_run:
        _write_own_heartbeat(
            data_dir=data_dir,
            now=now,
            verdict=verdict_final,
            checks=checks,
            duration_ms=duration_ms,
            alert_sent=alert_sent,
            note=gap_note or "",
            expected_interval=expected_interval,
            log_path=log_path,
        )

    return 1 if incidents else 0


# ── --status ───────────────────────────────────────────────────────────────────

def cmd_status(args) -> int:
    data_dir = args.data_dir
    state_path = args.state
    hb_path = os.path.join(data_dir, "watchdog", "watchdog_heartbeat.json")
    state = _load_state(state_path)
    hb: dict = {}
    try:
        with open(hb_path, encoding="utf-8") as f:
            hb = json.load(f)
    except Exception:
        pass
    out = {
        "watchdog_heartbeat": hb,
        "active_incidents": state.get("incidents", {}),
        "resolved": state.get("resolved", {}),
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


# ── --self-test ────────────────────────────────────────────────────────────────

def cmd_self_test() -> int:
    """≥ 6 khẳng định thuần nội bộ, KHÔNG cần DB, KHÔNG cần mạng."""
    failures: list[str] = []

    def _ok(label: str):
        pass  # im lặng khi pass

    def _fail(label: str, detail: str):
        failures.append(f"FAIL [{label}]: {detail}")

    # 1. Parse .env
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".env", delete=False) as f:
        f.write("# comment\n\nTOKEN=abc123\nCHAT_ID=987\n")
        env_file = f.name
    env = _parse_dotenv(env_file)
    os.unlink(env_file)
    if env.get("TOKEN") == "abc123" and env.get("CHAT_ID") == "987":
        _ok("parse_dotenv")
    else:
        _fail("parse_dotenv", f"got {env}")

    # 2. Định dạng thời lượng
    cases = [(0, "0 giây"), (60, "1 phút"), (90, "1 phút 30 giây"),
             (3661, "1 giờ 1 phút 1 giây"), (7200, "2 giờ")]
    for s, expected in cases:
        got = _fmt_duration(s)
        if got == expected:
            _ok(f"fmt_duration({s})")
        else:
            _fail(f"fmt_duration({s})", f"expected {expected!r}, got {got!r}")

    # 3. Tính ngưỡng im lặng
    import copy
    cfg = copy.deepcopy(DEFAULT_CONFIG)
    t = _threshold_for("monitor_scan", cfg)
    expected_t = 60 * 10  # cycle_seconds * silence_cycles
    if t == expected_t:
        _ok("threshold_monitor_scan")
    else:
        _fail("threshold_monitor_scan", f"expected {expected_t}, got {t}")

    # kind không có alarm=True → None
    cfg2 = copy.deepcopy(DEFAULT_CONFIG)
    t2 = _threshold_for("digest_send", cfg2)
    if t2 is None:
        _ok("threshold_digest_send_none")
    else:
        _fail("threshold_digest_send_none", f"expected None, got {t2}")

    # 4. Hằng số DEFAULT_CONFIG khớp (tự kiểm)
    if DEFAULT_CONFIG["cycle_seconds"] == 60:
        _ok("default_cycle_seconds")
    else:
        _fail("default_cycle_seconds", str(DEFAULT_CONFIG["cycle_seconds"]))
    if DEFAULT_CONFIG["silence_cycles"] == 10:
        _ok("default_silence_cycles")
    else:
        _fail("default_silence_cycles", str(DEFAULT_CONFIG["silence_cycles"]))
    if DEFAULT_KINDS["monitor_scan"]["alarm"] is True:
        _ok("monitor_scan_alarm_true")
    else:
        _fail("monitor_scan_alarm_true", str(DEFAULT_KINDS["monitor_scan"]["alarm"]))
    if DEFAULT_KINDS["digest_send"]["alarm"] is False:
        _ok("digest_send_alarm_false")
    else:
        _fail("digest_send_alarm_false", str(DEFAULT_KINDS["digest_send"]["alarm"]))

    # 5. Vòng trạng thái chống spam
    import tempfile, time as _time
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
        sp_path = f.name
    state = {"incidents": {}, "resolved": {}}
    _save_state(sp_path, state)
    loaded = _load_state(sp_path)
    os.unlink(sp_path)
    if loaded == {"incidents": {}, "resolved": {}}:
        _ok("state_roundtrip")
    else:
        _fail("state_roundtrip", str(loaded))

    # 6. Dựng nội dung tin cảnh báo
    now_dt = datetime(2026, 9, 29, 13, 22, 30, tzinfo=timezone.utc)
    inc = [{
        "key": "heartbeat:monitor_scan",
        "label": "Lần quét giám sát cuối",
        "last_at": "2026-09-29T13:00:00Z",
        "silence_s": 22 * 60 + 30,
        "threshold_s": 600,
        "pid_dead": True,
        "pid": 1234,
        "note": None,
    }]
    text = _build_alert_text(inc, now_dt)
    if "im lặng" in text and "22 phút 30 giây" in text and "1234" in text:
        _ok("build_alert_text")
    else:
        _fail("build_alert_text", f"text thiếu từ khoá: {text[:200]}")

    # 7. Tin phục hồi
    rec = _build_recovery_text("heartbeat:monitor_scan", now_dt)
    if "🟩" in rec and "PHỤC HỒI" in rec:
        _ok("build_recovery_text")
    else:
        _fail("build_recovery_text", rec[:100])

    n = 7 + len(cases)  # tổng khẳng định
    if failures:
        for msg in failures:
            print(msg)
        return 1
    print(f"SELF-TEST OK ({n})")
    return 0


# ── Phân tích tham số ─────────────────────────────────────────────────────────

def _build_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Người canh độc lập ngoài tiến trình Hermes+"
    )
    p.add_argument("--once", action="store_true", default=True,
                   help="Chạy 1 lượt rồi thoát (mặc định)")
    p.add_argument("--status", action="store_true",
                   help="In trạng thái hiện tại rồi thoát")
    p.add_argument("--json", action="store_true",
                   help="Xuất JSON (dùng với --status)")
    p.add_argument("--dry-run", action="store_true",
                   help="Không gửi cảnh báo, không ghi trạng thái; in nội dung sẽ gửi")
    p.add_argument("--no-http", action="store_true",
                   help="Bỏ qua bước kiểm tra endpoint sức khoẻ")
    p.add_argument("--self-test", action="store_true",
                   help="Chạy tự kiểm nội bộ rồi thoát")
    p.add_argument("--db", metavar="PATH",
                   help="Đường dẫn DB poclip.db")
    p.add_argument("--port", type=int,
                   help="Cổng dashboard")
    p.add_argument("--data-dir", metavar="PATH",
                   help="Thư mục dữ liệu (mặc định /var/lib/hermes-plus)")
    p.add_argument("--state", metavar="PATH",
                   help="Đường dẫn tệp trạng thái JSON chống spam")
    p.add_argument("--log", metavar="PATH",
                   help="Đường dẫn tệp log")
    p.add_argument("--now", metavar="ISO8601",
                   help="Mốc thời gian giả (dùng cho kiểm thử)")
    return p.parse_args()


def main() -> int:
    args = _build_args()

    if args.self_test:
        return cmd_self_test()

    # Đọc cấu hình từ env / CLI
    data_dir = args.data_dir or os.environ.get("HERMES_PLUS_DATA_DIR", _DEFAULT_DATA_DIR)
    db_path = args.db or os.environ.get("HERMES_POCLIP_DB_PATH") or None

    port_str = (
        str(args.port) if args.port
        else os.environ.get("HERMES_PLUS_PORT")
           or os.environ.get("HERMES_DASHBOARD_PORT")
    )
    try:
        port = int(port_str) if port_str else None
    except ValueError:
        port = None

    state_path = (
        args.state
        or os.environ.get("HERMES_WATCHDOG_STATE")
        or os.path.join(data_dir, "watchdog_state.json")
    )
    log_path = (
        args.log
        or os.environ.get("HERMES_WATCHDOG_LOG")
        or os.path.join(data_dir, "logs", "watchdog.log")
    )

    if args.status:
        args.data_dir = data_dir
        args.state = state_path
        return cmd_status(args)

    # Đọc watchdog.json
    wj = _load_watchdog_json(data_dir)
    repeat_seconds = int(
        os.environ.get("HERMES_WATCHDOG_REPEAT_SECONDS")
        or wj.get("repeat_seconds", _DEFAULT_REPEAT_SECONDS)
    )
    expected_interval = int(wj.get("expected_interval_seconds", _DEFAULT_EXPECTED_INTERVAL))
    if not port:
        port_wj = wj.get("port")
        if port_wj:
            port = int(port_wj)

    # Token & chat_id
    no_network = os.environ.get("HERMES_WATCHDOG_NO_NETWORK", "0") == "1"
    api_base_env = os.environ.get("HERMES_WATCHDOG_TELEGRAM_API_BASE", "")

    token: str | None = None
    chat_id: str | None = None
    api_base: str = api_base_env or wj.get("api_base", "https://api.telegram.org")

    env_file = os.path.join(data_dir, ".env")
    env_vars = _parse_dotenv(env_file)
    token = env_vars.get("TELEGRAM_BOT_TOKEN") or None

    if not chat_id:
        # Thử đọc từ DB
        if db_path:
            delivery = _load_delivery_config(db_path)
            chat_id = delivery.get("chat_id")
            if not api_base_env and delivery.get("api_base"):
                api_base = delivery["api_base"]
        if not chat_id:
            chat_id = wj.get("chat_id")

    now: datetime | None = None
    if args.now:
        now = _parse_iso(args.now)

    dry_run: bool = args.dry_run

    return run_once(
        db_path=db_path,
        port=port,
        data_dir=data_dir,
        state_path=state_path,
        log_path=log_path,
        dry_run=dry_run,
        no_http=args.no_http,
        now=now,
        no_network=no_network,
        token=token,
        chat_id=chat_id,
        api_base=api_base,
        repeat_seconds=repeat_seconds,
        expected_interval=expected_interval,
    )


if __name__ == "__main__":
    sys.exit(main())
