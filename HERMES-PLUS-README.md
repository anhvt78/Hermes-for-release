# Hermes+ — bản phát hành biên dịch

Kho này chỉ chứa **bản phát hành đã biên dịch** của Hermes+ (mã Hermes+ là tệp `.so`). Bản này chạy trên **Ubuntu 22.04/24.04, Linux x86_64, Python 3.11**.

Cài (cần giấy phép gắn với máy để ghi dữ liệu — xem `deploy/README.md`):

```bash
git clone https://github.com/anhvt78/Hermes-for-release.git && cd Hermes-for-release
sudo HERMES_PLUS_SOURCE="$PWD" \
     HERMES_PLUS_UPDATE_REPO=https://github.com/anhvt78/Hermes-for-release.git HERMES_PLUS_UPDATE_BRANCH=main \
     bash deploy/install.sh --company software
```

**Chọn loại công ty cài sẵn** bằng cờ `--company` (hoặc biến môi trường `HERMES_PLUS_COMPANY`):

| Cờ | Kết quả |
|---|---|
| `--company software` | Cài kèm **công ty phần mềm AI**: cơ cấu nhân sự, quy trình A–E, quy trình dự án, chính sách, ngân sách, lịch họp, kỹ năng và kiến thức (khoảng 0,6 MB, **không kèm khoá API**) |
| `--company none` | Máy trống; tự lập công ty bằng trình hướng dẫn trên bảng điều khiển |
| (bỏ trống) | Có người ngồi máy thì bộ cài hỏi (Enter = không cài kèm); chạy tự động `--non-interactive` thì không cài kèm |

Nhân viên của công ty cài kèm ở **dạng sổ** cho tới khi Chủ tịch nhập khoá AI (biến `DEEPSEEK_API_KEY` trong `.env`) rồi tuyển thật ở **Hệ thống → Xuất, nhập công ty**. Chi tiết: `deploy/README.md`, mục «Cài kèm gói công ty».

Số bản đang dùng nằm trong `RELEASE.json`. Kho chỉ giữ bản mới nhất; mã nguồn gốc không công khai.
