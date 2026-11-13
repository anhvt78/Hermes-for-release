# Hermes+ — bản phát hành biên dịch

Kho này chỉ chứa **bản phát hành đã biên dịch** của Hermes+ (mã Hermes+ là tệp `.so`). Bản này chạy trên **Ubuntu 22.04/24.04, Linux x86_64, Python 3.11**.

Cài (cần giấy phép gắn với máy để ghi dữ liệu — xem `deploy/README.md`):

```bash
git clone https://github.com/anhvt78/Hermes-for-release.git && cd Hermes-for-release
sudo HERMES_PLUS_SOURCE="$PWD" \
     HERMES_PLUS_UPDATE_REPO=https://github.com/anhvt78/Hermes-for-release.git HERMES_PLUS_UPDATE_BRANCH=main \
     bash deploy/install.sh
```

Số bản đang dùng nằm trong `RELEASE.json`. Kho chỉ giữ bản mới nhất; mã nguồn gốc không công khai.
