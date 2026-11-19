# Người canh độc lập — Hermes+ Watchdog

## Mục đích

`hermes_plus_watchdog.py` là **người canh độc lập** chạy theo hẹn giờ systemd (mỗi 2 phút), kiểm
tra xem bộ giám sát Hermes+ có còn sống hay không, và báo động qua kênh **tách biệt hoàn toàn**
với tiến trình được giám sát.

## Vì sao người canh nằm ngoài tiến trình?

Nếu người canh chạy bên trong cùng tiến trình Python với dashboard, khi tiến trình đó treo hoặc
chết, người canh cũng chết theo — không còn ai để báo "giám sát đã chết". Bằng cách dùng systemd
timer (tầng hệ điều hành) và python hệ thống (`/usr/bin/python3`, không phụ thuộc venv), người canh
tồn tại độc lập: khi venv bị hỏng, khi dashboard crash, khi bộ giám sát im lặng — người canh vẫn
chạy và vẫn báo động được.

## Các lượt kiểm tra

1. **Nhịp tim (Heartbeat check)** — đọc bảng `runner_heartbeats` trong DB công ty (chỉ đọc, `?mode=ro`).
   Nếu `monitor_scan` im lặng quá ngưỡng (`cycle_seconds × silence_cycles`, mặc định 600 giây) hoặc
   chưa từng có nhịp tim → phát sự cố `heartbeat:monitor_scan`. Cũng kiểm tra xem tiến trình giám sát
   (theo `last_pid`) có còn sống không (`os.kill(pid, 0)`).

2. **Endpoint sức khoẻ (HTTP check)** — GET `http://127.0.0.1:<port>/health` (timeout 10 giây).
   - Không kết nối được → sự cố `http:health`.
   - Có phản hồi bất kỳ (kể cả 401/403) → tiến trình còn sống, không phải sự cố.
   - HTTP 200 + JSON `{"db": <khác "ok">}` → sự cố `http:db`.

## Kênh báo động độc lập

Người canh gửi tin Telegram **trực tiếp** bằng `urllib.request` (thư viện chuẩn Python), **không qua**
gateway hay plugin của sản phẩm. Token đọc từ `${DATA_DIR}/.env` (dòng `TELEGRAM_BOT_TOKEN=...`);
`chat_id` đọc từ DB (`cfg_settings.digest_delivery`) hoặc từ `${DATA_DIR}/watchdog.json`.

Chống spam: chỉ gửi lại sau mỗi `repeat_seconds` (mặc định 3600 giây). Khi sự cố hết, gửi đúng 1
tin "đã phục hồi" rồi dừng. Mọi lượt chạy đều ghi log vào `${DATA_DIR}/logs/watchdog.log`.

## Cách Chủ tịch tự kiểm (4 lệnh)

```bash
# 1. Xem lượt kế tiếp của hẹn giờ
systemctl list-timers hermes-plus-watchdog.timer

# 2. Xem heartbeat lượt chạy gần nhất của người canh
cat /var/lib/hermes-plus/watchdog/watchdog_heartbeat.json

# 3. In trạng thái đầy đủ (sự cố đang mở, đã giải quyết)
/usr/bin/python3 /opt/hermes-plus/deploy/hermes_plus_watchdog.py --status

# 4. Xem log journal 30 phút gần nhất
journalctl -u hermes-plus-watchdog --since "30 min ago"
```

## Cách đổi ngưỡng im lặng theo công ty

Ngưỡng im lặng được tính từ `cycle_seconds × silence_cycles` trong cấu hình công ty:

```python
# Trong admin hoặc script bootstrap:
import json, sqlite3
conn = sqlite3.connect("/var/lib/hermes-plus/poclip.db")
conn.execute(
    "INSERT OR REPLACE INTO cfg_settings (key, value_json) VALUES (?, ?)",
    ("monitoring_heartbeat", json.dumps({
        "cycle_seconds": 60,
        "silence_cycles": 15,   # tăng lên 15 → ngưỡng 900 giây (15 phút)
    }))
)
conn.commit()
```

Hoặc chỉnh trực tiếp khoá `monitoring_heartbeat` trong bảng `cfg_settings` của DB `poclip.db`.

## Giới hạn đã biết

- Người canh **chỉ đọc DB** — không can thiệp vào tiến trình bị giám sát, không khởi động lại.
- Khi DB bị khoá hoặc mất (ví dụ đang migrate), người canh bỏ qua kiểm tra nhịp tim và ghi log rõ;
  không crash.
- Kênh Telegram phụ thuộc mạng ngoài — mất mạng thì chỉ ghi log nội bộ.
- Nếu server systemd bị treo hoàn toàn (kernel panic, OOM kill), hẹn giờ cũng không chạy được;
  đây là giới hạn của mọi giải pháp trong cùng máy.
- Token Telegram phải được đặt trong `${DATA_DIR}/.env` (dòng `TELEGRAM_BOT_TOKEN=...`); nếu thiếu,
  người canh vẫn kiểm tra và ghi log nhưng không gửi được Telegram.
