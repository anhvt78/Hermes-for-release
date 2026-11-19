# Hermes Zalo Personal

Plugin Hermes cho **một tài khoản Zalo cá nhân**, đăng nhập bằng QR và chạy hoàn toàn cục bộ. Plugin dùng `zca-js@2.1.2`; không cần Zalo OA, Zalo App, webhook hoặc ngrok.

> Zalo cá nhân không phải API chính thức. Không gửi spam, không nhắn hàng loạt và chỉ chạy một listener cho mỗi tài khoản. Zalo có thể giới hạn hoặc yêu cầu đăng nhập lại bất kỳ lúc nào.

> **Hermes+:** plugin này đã đi kèm sẵn trong Hermes+ (`plugins/platforms/zalo_personal`) và tự có mặt, không cần `plugins install` hay `plugins enable`. Bỏ qua các lệnh cài từ GitHub bên dưới; chỉ cần Node.js 18+ trên máy chạy gateway. Lệnh của plugin là `<profile> zalo_personal ...` (gạch dưới, trùng tên nền tảng; Hermes chỉ nạp nền tảng đi kèm theo đúng tên đó). Các script `.ps1` chỉ dành cho Windows; trên Linux khởi động gateway của profile theo cách thường dùng của Hermes+.

## Cài nhanh bằng AI

Đưa file [AI-SETUP.md](AI-SETUP.md) cho Codex, Claude Code hoặc Cursor và nói: “Đọc runbook này, phỏng vấn tôi từng câu rồi thiết lập bot Zalo cá nhân.” Runbook bắt buộc kiểm tra môi trường, lấy ID nhóm và xin xác nhận trước các thay đổi.

## Cài thủ công trên Windows

### 1. Chuẩn bị

Cần Hermes đã đăng nhập model và Node.js 18 trở lên:

```powershell
hermes --version
node --version
```

Tạo profile tách biệt; không clone profile đang chạy vì có thể đem theo token/cấu hình platform khác:

```powershell
hermes profile create zalo-cskh --no-skills
```

Lệnh sau dùng `zalo-cskh` là alias Hermes vừa tạo. Nếu chọn tên khác, thay toàn bộ bằng tên profile của bạn.

### 2. Cài plugin và quét QR

```powershell
zalo-cskh zalo_personal install
zalo-cskh zalo_personal login
```

QR sẽ mở trên Windows. Quét bằng tài khoản Zalo sẽ đóng vai bot, rồi xác nhận trên điện thoại. Session chỉ nằm trong thư mục profile cục bộ; không gửi `credentials.json` hoặc ảnh QR cho bất kỳ ai.

### 3. Soạn persona và cấu hình pilot

Copy hai file mẫu vào profile, điền nội dung doanh nghiệp của bạn rồi mở `config.yaml` để ghép phần cấu hình mẫu:

```powershell
$profile = Join-Path $env:LOCALAPPDATA 'hermes\profiles\zalo-cskh'
$plugin = '<thư mục cài Hermes+>\plugins\platforms\zalo_personal'
Copy-Item "$plugin\templates\SOUL.md.example" "$profile\SOUL.md"
Copy-Item "$plugin\templates\config.yaml.example" "$profile\zalo-personal-config.example.yaml"
notepad "$profile\SOUL.md"
notepad "$profile\config.yaml"
```

Giữ `allowed_users: []` và `allowed_groups: {}` trong pilot. Danh sách rỗng nghĩa là chặn toàn bộ, không phải cho phép toàn bộ.

### 4. Lấy ID nhóm mà không cần nhắn thử

Sau khi QR thành công, xem tất cả nhóm của tài khoản bot:

```powershell
zalo-cskh zalo_personal groups
```

Lệnh chỉ đọc, không mở listener và không gửi tin. Kết quả có Group ID, tên và số thành viên. Nếu bạn chỉ có link mời nhóm:

```powershell
zalo-cskh zalo_personal resolve-group 'https://zalo.me/g/xxxxxxxx'
```

Đối chiếu tên nhóm trước khi dùng ID. `peers` là cách dự phòng sau khi gateway đã thấy tin nhắn:

```powershell
zalo-cskh zalo_personal peers
```

### 5. Bật một nhóm thử nghiệm

Trong `gateway.platforms.zalo_personal` của `config.yaml`, điền user ID của quản trị viên/test làm `home_channel` và bật đúng Group ID:

```yaml
gateway:
  platforms:
    zalo_personal:
      enabled: true
      home_channel:
        platform: zalo_personal
        chat_id: "ID_NGUOI_QUAN_TRI"
        name: "Quản trị Zalo"
      extra:
        allowed_users:
          - "ID_NGUOI_QUAN_TRI"
        allowed_groups:
          "ID_NHOM_DA_XAC_MINH":
            enabled: true
            require_mention: true
        require_mention: true
        handoff_seconds: 86400
```

`home_channel` chỉ là kênh quản trị nội bộ, giúp Hermes không gửi thông báo “No home channel” vào nhóm khách. Không đặt nó là một nhóm khách. Khởi động gateway:

```powershell
& "$plugin\scripts\start-zalo-personal.ps1" -ProfileName zalo-cskh
zalo-cskh gateway status
```

Nhờ **một tài khoản khác** mention bot trong nhóm. Tin do chính tài khoản bot gửi sẽ luôn bị bỏ qua để tránh tự trả lời chính nó.

### 6. Vận hành

- Nhóm chỉ phản hồi khi Group ID nằm trong allowlist và người dùng `@mention` bot.
- DM chỉ phản hồi user ID nằm trong `allowed_users`.
- Ảnh/file/voice, thanh toán, khiếu nại hoặc yêu cầu người thật sẽ tạm dừng bot ở cuộc hội thoại đó 24 giờ. Khách nhắn `trợ lý trả lời tiếp` để bật lại.
- Khi chủ tài khoản nhắn thủ công, bot cũng dừng cuộc hội thoại đó 24 giờ.

Đăng ký tự chạy khi đăng nhập Windows:

```powershell
& "$plugin\scripts\register-zalo-personal-startup.ps1" -ProfileName zalo-cskh
```

Dừng, kiểm tra hoặc đăng xuất:

```powershell
& "$plugin\scripts\stop-zalo-personal.ps1" -ProfileName zalo-cskh
zalo-cskh zalo_personal status
zalo-cskh zalo_personal logout --yes
```

## Khắc phục lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Bot không trả lời | Kiểm tra gateway đang chạy, Group ID/User ID có trong allowlist và bot được mention. |
| Chỉ bot tự nhắn mà không phản hồi | Đúng thiết kế: dùng một tài khoản Zalo khác để test. |
| QR/session hết hạn | Dừng gateway, chạy `zalo_personal login` rồi khởi động lại. |
| Hai bot hoặc phản hồi trùng | Tắt gateway/profile còn lại. Một tài khoản chỉ có một listener. |
| Sửa `SOUL.md` nhưng cách trả lời chưa đổi | Dừng gateway, dùng `zalo-cskh sessions list --source zalo_personal`, xóa đúng session cần làm mới với `sessions delete --yes`, rồi khởi động lại. |
| Dòng “No home channel” xuất hiện | Điền `home_channel` bằng DM của người quản trị/test, không dùng nhóm khách. |

## Bảo mật và riêng tư

Plugin không đăng ký tool Zalo cho model và chỉ dùng sidecar để nhận/gửi đúng cuộc hội thoại. State cục bộ chỉ lưu chống trùng, peer ID, ID tin do bot gửi và trạng thái handoff; không lưu nội dung tin nhắn dài hạn. Log chỉ dùng ID đã băm. Không commit session, QR, SQLite state, log hay cấu hình doanh nghiệp.
