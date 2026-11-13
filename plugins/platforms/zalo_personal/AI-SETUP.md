# Runbook cho AI: dựng bot Zalo cá nhân Hermes

Tài liệu này dành cho coding agent. Hãy phỏng vấn người dùng **từng câu một**, không đoán dữ liệu doanh nghiệp hay ID Zalo.

## Quy tắc an toàn

- Trước khi tạo profile, sửa cấu hình, restart/dừng gateway, đăng ký startup hoặc logout, hãy nói rõ thao tác sắp diễn ra và xin xác nhận.
- Không sao chép, di chuyển, in ra hoặc commit QR/session/cookie. Không dùng session của profile khác.
- Một tài khoản Zalo chỉ có một listener. Nếu profile/gateway khác đang dùng Zalo, dừng quy trình và nêu rõ xung đột; chỉ xử lý tiếp khi người dùng xác nhận profile cũ đã được tắt.
- Không tự gửi tin vào nhóm có người thật để test. Chỉ yêu cầu người dùng hoặc một tài khoản test tự nhắn.

## 1. Kiểm tra hiện trạng

Chạy các kiểm tra chỉ đọc trước khi hỏi:

```powershell
hermes --version
node --version
hermes profile list
Get-Process node -ErrorAction SilentlyContinue
```

Node phải từ 18 trở lên. Xác định profile dự kiến có alias hay chưa; nếu có, chạy `<profile> zalo_personal status`. Nếu chưa đăng nhập QR, giải thích rằng AI không thể quét/duyệt QR thay người dùng.

## 2. Phỏng vấn

Hỏi lần lượt và chờ từng câu trả lời:

1. Tên profile mong muốn (gợi ý `zalo-cskh`).
2. Tài khoản Zalo nào sẽ là bot, và có gateway/listener nào đang dùng nó không?
3. Chọn nhóm nào: chạy `<profile> zalo_personal groups` sau QR, đưa danh sách tên/ID cho người dùng chọn; nếu họ chỉ có link, dùng `resolve-group` rồi xác nhận tên.
4. Bot trả lời chính xác chủ đề nào, lấy thông tin từ tài liệu nào?
5. Câu trả lời cố định khi câu hỏi ngoài phạm vi hoặc thiếu dữ liệu là gì?
6. Ngôn ngữ, xưng hô và độ dài phản hồi?
7. Có bắt buộc @mention trong nhóm không? Khuyến nghị: có.
8. Có DM không? Khuyến nghị: chỉ allowlist rõ user ID; rỗng là tắt.
9. Những tình huống nào chuyển người thật và ai tiếp nhận?
10. Model/provider Hermes đã đăng nhập và sẽ dùng cho profile là gì?

Tóm tắt lại câu trả lời, Group ID đã chọn và chính sách access để người dùng duyệt trước khi ghi file.

## 3. Thiết lập sau khi được xác nhận

1. Tạo profile bằng `hermes profile create <ten-profile> --no-skills`, không clone profile khác.
2. Plugin đã đi kèm sẵn trong Hermes+, không cần cài từ GitHub; chạy `<profile> zalo_personal install` để cài phần Node.
3. Yêu cầu người dùng quét QR bằng `<profile> zalo_personal login`.
4. Tạo `SOUL.md` từ `templates/SOUL.md.example`, chỉ dùng thông tin người dùng đã xác nhận.
5. Ghép `templates/config.yaml.example` vào config profile: platform `zalo_personal`, không tool, memory tắt, nhóm/user đúng allowlist, `require_mention` đúng lựa chọn và handoff 86400 giây.
6. Dùng một user ID quản trị/test làm `home_channel` để Hermes không phát thông báo quản trị vào nhóm khách.
7. Chỉ sau khi người dùng đồng ý, khởi động gateway bằng script `start-zalo-personal.ps1 -ProfileName <ten-profile>`.

## 4. Nghiệm thu và bàn giao

- Nhờ một tài khoản khác @mention bot trong nhóm. Kiểm tra log có inbound và response thành công.
- Xác nhận bot im lặng khi không mention, ngoài allowlist hoặc trong handoff; thử câu `trợ lý trả lời tiếp`.
- Báo lại: tên profile, Group ID/tên nhóm, chính sách DM/mention, nguồn persona, câu lệnh start/stop/status và vị trí session cục bộ.
- Nếu thay `SOUL.md`, yêu cầu người dùng xác nhận trước khi xóa session liên quan: `<profile> sessions list --source zalo_personal`, sau đó chỉ xóa đúng session bằng `<profile> sessions delete --yes <session-id>`, rồi restart gateway.
