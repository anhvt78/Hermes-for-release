# Hướng dẫn triển khai Hermes+

Tài liệu này hướng dẫn cài đặt Hermes+ lên máy chủ Ubuntu mới.

> **Tóm tắt luồng giao một máy cho khách (từ bản 2026.10.13-7):**
> 1. Cài bằng `deploy/install.sh` — mặc định lấy **bản phát hành** (nhánh `release`, giao diện đã dựng sẵn).
> 2. Bộ cài in ra **tệp mã máy** (`/var/lib/hermes-plus/yeu-cau-giay-phep.json`) và **khoá truy cập kho** (để nút «Cập nhật Hermes+» hoạt động).
> 3. **Bản cài từ kho công khai tự chạy dùng thử 365 ngày kể từ lần khởi động đầu, không cần giấy phép.** Hết hạn thì gửi tệp mã máy cho nhà cung cấp → nhận **giấy phép** (gia hạn) → cài giấy phép. **Hết hạn dùng thử mà chưa có giấy phép thì hệ thống chỉ xem được, không ghi được dữ liệu.** Chỉ **giấy phép không hết hạn** mới cho chuyển công ty giữa các máy (xem «Giấy phép» ở mục 5).
> 4. Thêm khoá truy cập vào GitHub (Deploy keys, chỉ đọc) để máy tự cập nhật bằng nút «Cập nhật Hermes+».

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Chuẩn bị bí mật](#2-chuẩn-bị-bí-mật)
3. [Cài từ bản phát hành (GitHub)](#3-cài-từ-bản-phát-hành-github)
4. [Cài offline từ USB / thư mục sẵn có](#4-cài-offline-từ-usb--thư-mục-sẵn-có)
5. [Sau khi cài (giấy phép, khoá cập nhật)](#5-sau-khi-cài)
6. [Quản lý dịch vụ](#6-quản-lý-dịch-vụ)
7. [Đổi cấu hình](#7-đổi-cấu-hình)
8. [Cập nhật phiên bản](#8-cập-nhật-phiên-bản)
9. [Sao lưu và phục hồi](#9-sao-lưu-và-phục-hồi)
10. [Xử lý sự cố](#10-xử-lý-sự-cố)
11. [Tham chiếu nhanh](#11-tham-chiếu-nhanh)

---

## 1. Yêu cầu hệ thống

| Mục | Tối thiểu |
|-----|-----------|
| Hệ điều hành | Ubuntu 22.04 LTS hoặc Ubuntu 24.04 LTS |
| RAM | 2 GB (khuyến nghị 4 GB) |
| Dung lượng đĩa | 10 GB (venv + node_modules + dữ liệu) |
| CPU | 2 nhân |
| Python | 3.11–3.13 (bộ cài đọc `requires-python` từ `pyproject.toml`; tải tự động nếu cần) |
| Kết nối mạng | Cần thiết khi cài từ GitHub; không cần nếu cài offline |
| Loại máy | **Máy thật hoặc máy ảo** (VMware, VirtualBox, KVM, Proxmox, cloud) có card mạng. **Không hỗ trợ container Docker/LXC**: container không có card mạng thật nên **không cấp được giấy phép** |

**Gói hệ thống cần cài (script tự cài nếu dùng `--install-deps`):**
```
python3-venv python3-pip python3-dev
git curl ca-certificates build-essential
rsync openssh-client
```

> **Node.js:** Cài từ **bản phát hành** (mặc định) **không cần Node.js** — giao diện đã dựng sẵn trong bản phát hành.
> Chỉ khi cài kiểu cũ từ kho đầy đủ (`--ref main`), Node.js 22 mới được cài từ **NodeSource** (cần internet) để dựng giao diện.

---

## 2. Chuẩn bị bí mật

Trước khi cài, chuẩn bị các giá trị sau (có thể đặt qua biến môi trường hoặc nhập khi chạy script):

| Bí mật | Biến môi trường | Bắt buộc? |
|--------|----------------|-----------|
| Khoá API AI (DeepSeek) | `HERMES_PLUS_API_KEY` hoặc `DEEPSEEK_API_KEY` | Có |
| Mật khẩu bảng điều khiển | `HERMES_PLUS_DASHBOARD_PASSWORD` | Không (tự sinh) |
| Token Telegram Bot | `TELEGRAM_BOT_TOKEN` | Không |
| Khoá bảo vệ API-3D | `HERMES_POCLIP_3D_KEYS` | Không (tự sinh) |
| Token GitHub (clone repo riêng) | `HERMES_PLUS_GIT_TOKEN` | Nếu clone từ GitHub |

> **Lưu ý bảo mật:** Không đặt bí mật trực tiếp trong lệnh (hiển thị trong `ps`).
> Dùng `export BIẾN=giá_trị` trước khi chạy script, hoặc dùng tệp `--env-file`.

---

## 3. Cài từ bản phát hành (GitHub)

Bản cài chuẩn lấy **nhánh `release`** của kho: cây mã **đã dựng sẵn giao diện** kèm `requirements-release.txt` (danh sách thư viện Python
đã chốt phiên bản). Nhờ vậy cài nhanh, không cần Node.js, và **giống hệt** bản mà nút «Cập nhật Hermes+» sau này sẽ nạp.

**Bộ cài** là thư mục `deploy/` (các tệp `install.sh`, `hermes_plus_watchdog.py`, `hermes-plus-check`, `README*.md`). Đặt thư mục này lên máy
mới (USB, `scp`, hoặc lấy từ kho) rồi chạy `install.sh`. Ví dụ dưới giả định thư mục `deploy/` đang ở thư mục hiện tại.

Kho là **riêng tư**, nên cần một trong hai cách xác thực:

### 3a. Cài với token cá nhân (Personal Access Token)

```bash
# Tạo token tại: GitHub → Settings → Developer settings → Personal access tokens
# Quyền cần có: Contents (read)

export HERMES_PLUS_GIT_TOKEN=ghp_xxxxxxxxxxxx
export HERMES_PLUS_API_KEY=sk-xxxxxxxxxxxx
export HERMES_PLUS_DASHBOARD_PASSWORD=MatKhauBanDat

sudo -E bash deploy/install.sh
```

### 3b. Cài bằng Deploy Key (SSH)

```bash
# Tạo khoá và thêm vào GitHub: Repo → Settings → Deploy keys → Add deploy key (chỉ đọc)
ssh-keygen -t ed25519 -f ~/.ssh/hermes_deploy -C "hermes-deploy"
cat ~/.ssh/hermes_deploy.pub     # dán nội dung này vào GitHub

sudo GIT_SSH_COMMAND="ssh -i $HOME/.ssh/hermes_deploy -o StrictHostKeyChecking=accept-new" \
     HERMES_PLUS_API_KEY=sk-xxx HERMES_PLUS_DASHBOARD_PASSWORD=MatKhau123 \
     bash deploy/install.sh --repo git@github.com:anhvt78/hermes_plus.git
```

> Khoá dùng để **cài** (ở trên) khác với khoá dùng để **cập nhật sau này**: bộ cài tự tạo thêm một khoá riêng cho máy (mục 5) để nút
> «Cập nhật Hermes+» hoạt động.

### 3c. Cài một lệnh (tất cả qua biến môi trường)

```bash
sudo \
  HERMES_PLUS_GIT_TOKEN=ghp_xxx \
  HERMES_PLUS_API_KEY=sk-xxx \
  HERMES_PLUS_DASHBOARD_PASSWORD=MatKhauBanDat \
  bash deploy/install.sh
```

Đã có sẵn giấy phép (cấp trước theo mã máy) thì cài luôn: thêm `--license /đường/dẫn/license.json`.

> **Cài kiểu cũ (kho đầy đủ):** `--ref main` lấy cả kho (mã nguồn + tài liệu + bộ kiểm thử) rồi tự dựng giao diện bằng Node.js. Chỉ dùng khi cần
> phát triển; máy khách nên dùng bản phát hành.

---

### 3d. Cài từ kho CÔNG KHAI (bản biên dịch, dành cho khách hàng)

Kho công khai `Hermes-for-release` chứa bản phát hành đã **biên dịch** (mã Hermes+ là tệp `.so`, không còn `.py`; không có mã giao diện nguồn). Cài từ kho này **không cần token hay khoá triển khai**:

```bash
sudo HERMES_PLUS_REPO=https://github.com/anhvt78/Hermes-for-release.git HERMES_PLUS_REF=main \
     HERMES_PLUS_UPDATE_REPO=https://github.com/anhvt78/Hermes-for-release.git HERMES_PLUS_UPDATE_BRANCH=main \
     bash deploy/install.sh
```

- Bản biên dịch chỉ chạy đúng **Python 3.11 trên Linux x86_64** (ghi trong `RELEASE.json`, mục `build`). Bộ cài tự tạo môi trường Python 3.11; nút «Cập nhật Hermes+» từ chối cập nhật nếu máy khác phiên bản hoặc nền tảng.
- Kho công khai chỉ giữ **bản mới nhất** (mỗi lần phát hành ghi đè), nên không quay lại bản cũ từ kho này.
- Lỗi trong bản biên dịch không hiện dòng mã gốc; khi báo sự cố hãy gửi kèm số bản phát hành (`RELEASE.json`) và nhật ký.

**Dành cho chủ sở hữu — dựng và đẩy bản công khai** (sau khi đã phát hành nhánh `release` riêng tư; chạy trên máy 218):
```bash
python hermes-agent-main/scripts/plus_release_compiled.py --no-push --out /tmp/plus-public   # dựng + kiểm tra, chưa đẩy
python hermes-agent-main/scripts/plus_release_compiled.py                                    # đẩy (ghi đè) lên kho công khai
```
Script từ chối đẩy nếu còn mô-đun biên dịch lỗi, còn mã nguồn `.py` lọt vào, phát hiện khoá/bí mật, hoặc nạp thử thất bại. Nhánh `release` riêng tư giữ nguyên mã gốc để gỡ lỗi.

---

## 4. Cài offline từ USB / thư mục sẵn có

Dùng khi máy chủ không có internet (chuẩn bị gói trên máy khác trước).

**Bước 1 — Trên máy có internet, chuẩn bị USB:**
```bash
# Tải bản phát hành (nhánh release) ra USB — đây là cây mã đã dựng sẵn giao diện
git clone --depth 1 --branch release git@github.com:anhvt78/hermes_plus.git /media/usb/hermes_plus_release
rm -rf /media/usb/hermes_plus_release/.git
# Chép thư mục bộ cài (deploy/) từ kho phát triển vào USB
cp -r /duong/dan/kho/deploy /media/usb/deploy
```

**Bước 2 — Trên máy mới (cắm USB):**
```bash
sudo HERMES_PLUS_API_KEY=sk-xxx \
     HERMES_PLUS_DASHBOARD_PASSWORD=MatKhau123 \
     bash /media/usb/deploy/install.sh \
     --source /media/usb/hermes_plus_release \
     --install-dir /opt/hermes-plus
```
Bộ cài nhận ra thư mục có `RELEASE.json` là **bản phát hành** nên chép thẳng vào `/opt/hermes-plus/hermes-agent-main/` và bỏ qua bước dựng giao diện.

> **Thư viện Python:** bước cài phụ thuộc (từ `requirements-release.txt`) vẫn cần **internet tới pypi.org** hoặc một kho wheel nội bộ.
> Cài hoàn toàn không có mạng: trên máy có mạng chạy `pip download -r requirements-release.txt -d /media/usb/wheels`, rồi trên máy mới cài
> bằng `pip install --no-index --find-links=/media/usb/wheels -r requirements-release.txt` **trước** khi chạy bộ cài.

**Cài gói apt offline** (nếu máy chưa có python3-venv, ...):
```bash
# Trên máy có internet, tải gói về:
apt-get download python3-venv python3-pip python3-dev build-essential rsync openssh-client

# Sao chép lên máy mới rồi:
dpkg -i *.deb
```

---

## 5. Sau khi cài

1. Mở trình duyệt: `http://<IP_máy_chủ>:9119`
2. Đăng nhập với tài khoản đã cấu hình (mặc định: `President`)
3. Kiểm tra khu vực **Công ty** / **Phòng họp** / **Chính sách** đã hiển thị

**Đặt mật khẩu lần đầu (khi chạy bộ cài tương tác):** bộ cài hỏi «Mật khẩu bảng điều khiển», **tối thiểu 10 ký tự** và bắt **gõ lại lần hai** cho khớp; sai thì hỏi lại (tối đa 3 lần, sau đó tự sinh). Bấm Enter để trống = bộ cài tự sinh mật khẩu. Mật khẩu truyền sẵn qua `HERMES_PLUS_DASHBOARD_PASSWORD` không bị chặn, nhưng nếu ngắn hơn 10 ký tự bộ cài sẽ nhắc nên đặt lại.

Nếu mật khẩu được tự sinh **và chưa có `config.yaml`** (cài lần đầu hoặc `--upgrade`), nó được in ra ở cuối quá trình cài — hãy lưu lại.
Nếu `config.yaml` đã tồn tại và bạn không truyền mật khẩu, bộ cài giữ nguyên hash cũ và **không in** mật khẩu tự sinh (hash scrypt không đọc ngược được).

### Giấy phép (dùng thử 365 ngày, sau đó cần giấy phép để ghi dữ liệu)

**Dùng thử mặc định:** bản cài từ kho công khai tự dùng thử **365 ngày**, đếm từ lần khởi động đầu tiên, **không cần giấy phép**. Mốc bắt đầu được ghi
trên máy (gắn với máy này, có chữ ký chống sửa; chép sang máy khác không dùng được). Còn 30 ngày thì bảng điều khiển hiện dải nhắc. Hết 365 ngày có
**7 ngày ân hạn**, sau đó hệ thống chuyển sang **chỉ xem** cho tới khi cài giấy phép. Có giấy phép hợp lệ thì giấy phép được dùng, không dùng thử nữa.

**Gia hạn:** xin giấy phép bằng cách gửi tệp mã máy cho nhà cung cấp (xem các bước bên dưới). Giấy phép có thời hạn gia hạn bằng giấy phép mới cho cùng máy.

**Chuyển công ty giữa các máy:** chỉ máy có **giấy phép không hết hạn** mới được **xuất** hoặc **nhập** công ty (màn *Xuất, nhập công ty* và lệnh
`hermes company export|import`). **Bản dùng thử, giấy phép có thời hạn và bản gia hạn đều không được chuyển công ty.** Muốn chuyển công ty thì cần
giấy phép không hết hạn trên **cả máy cũ (xuất) và máy mới (nhập)**.

Từ bản 2026.10.13-7 mỗi máy cần **giấy phép gắn với máy đó** khi hết dùng thử. Máy không còn giấy phép/dùng thử hợp lệ chạy ở chế độ **chỉ xem**: xem dữ liệu, đăng nhập và cài
giấy phép được, nhưng không ghi được dữ liệu và các agent không nhận việc (việc giữ nguyên, không mất).

Bộ cài đã tạo sẵn tệp mã máy `/var/lib/hermes-plus/yeu-cau-giay-phep.json` (chỉ chứa mã băm một chiều của phần cứng, không lộ thông tin riêng).

1. **Gửi tệp mã máy cho nhà cung cấp** (hoặc mở bảng điều khiển → *Tình trạng hệ thống* → thẻ **Giấy phép** → *Xem mã máy này* → *Tải tệp yêu cầu*).
2. Nhận lại **tệp giấy phép** (`license.json`) rồi cài **một trong hai cách**:
   - Bảng điều khiển → *Tình trạng hệ thống* → *Giấy phép* → dán toàn bộ nội dung → **Cài giấy phép**. Có hiệu lực ngay, không cần khởi động lại.
   - Dòng lệnh:
     ```bash
     sudo -u <tài-khoản-dịch-vụ> env HERMES_HOME=/var/lib/hermes-plus \
       /opt/hermes-plus/hermes-agent-main/venv/bin/python -m hermes_cli.plus_license install /đường/dẫn/license.json
     ```
   - Hoặc truyền lúc cài/ chạy lại bộ cài: `--license /đường/dẫn/license.json`.
3. Kiểm tra: thẻ Giấy phép báo «✅ Giấy phép hợp lệ», hoặc `python -m hermes_cli.plus_license status`.

Giấy phép chỉ dùng được trên **đúng máy** đã đăng ký: chép sang máy khác sẽ báo «cấp cho một máy khác». Thay phần cứng nhiều (thay hết card mạng
hoặc chuyển cả ổ đĩa sang máy mới) thì cần xin giấy phép mới bằng cách gửi lại mã máy.

### Khoá truy cập để cập nhật (nút «Cập nhật Hermes+»)

Bộ cài tạo cho máy một khoá SSH riêng `~/.ssh/hermes_plus_update` (của tài khoản chạy dịch vụ) và ghi cấu hình cập nhật vào
`/var/lib/hermes-plus/.env` (`HERMES_PLUS_UPDATE_REPO`, `HERMES_PLUS_UPDATE_BRANCH`, `HERMES_PLUS_UPDATE_KEY`). **Khoá công khai được in ở cuối
lúc cài.** Hãy thêm nó vào GitHub (*Settings → Deploy keys → Add deploy key*, để **chỉ đọc**). Chưa thêm thì nút «Cập nhật» báo
«Máy này chưa có quyền đọc kho Hermes+».

Xem lại khoá công khai bất cứ lúc nào: `cat ~/.ssh/hermes_plus_update.pub` (của tài khoản chạy dịch vụ).

### Tự kiểm hệ thống sau khi cài

Dùng script `hermes-plus-check` để kiểm nhanh plugin hermes-poclip mà không cần khởi động lại dịch vụ.
**Luôn dùng bản sao DB** (không chạy trực tiếp lên DB công ty):

```bash
# Tạo bản sao DB để kiểm thử
sqlite3 /var/lib/hermes-plus/poclip.db ".backup /tmp/check/company.db"
mkdir -p /tmp/check/backups

# Kiểm tra quota nhà cung cấp AI
/opt/hermes-plus/deploy/hermes-plus-check quota  --once --force --json --db /tmp/check/company.db

# Sao lưu + thử khôi phục
/opt/hermes-plus/deploy/hermes-plus-check backup --once --force --db /tmp/check/company.db --backup-dir /tmp/check/backups

# Health probe dịch vụ
/opt/hermes-plus/deploy/hermes-plus-check ops    --once --json --db /tmp/check/company.db
```

Xem đầy đủ: `hermes-agent-main/plugins/hermes-poclip/docs/giam-sat-hoat-dong-lien-tuc.md`

---

## 6. Quản lý dịch vụ

Hermes+ gồm 2 dịch vụ systemd:
- `hermes-plus-dashboard` — Bảng điều khiển web
- `hermes-plus-gateway` — Cổng kết nối (Telegram, ...)

```bash
# Xem trạng thái
systemctl status hermes-plus-dashboard hermes-plus-gateway

# Xem log realtime
journalctl -u hermes-plus-dashboard -f
journalctl -u hermes-plus-gateway -f

# Xem log gần nhất
journalctl -u hermes-plus-dashboard --no-pager -n 50

# Khởi động / dừng
systemctl start  hermes-plus-dashboard hermes-plus-gateway
systemctl stop   hermes-plus-dashboard hermes-plus-gateway
systemctl restart hermes-plus-dashboard

# Tắt tự khởi động cùng máy
systemctl disable hermes-plus-dashboard hermes-plus-gateway

# Bật lại tự khởi động
systemctl enable hermes-plus-dashboard hermes-plus-gateway
```

---

## 7. Đổi cấu hình

### Đổi mật khẩu bảng điều khiển

Cách đơn giản nhất — để bộ cài tự cập nhật hash:

```bash
# Truyền mật khẩu mới qua biến môi trường rồi chạy lại bộ cài
sudo HERMES_PLUS_DASHBOARD_PASSWORD=MatKhauMoi ./deploy/install.sh

# Hoặc với --source nếu cài offline:
sudo HERMES_PLUS_DASHBOARD_PASSWORD=MatKhauMoi \
     ./deploy/install.sh --source /opt/hermes-plus
```

Bộ cài sẽ sinh hash scrypt mới từ mật khẩu bạn truyền và **chỉ cập nhật dòng `password_hash:`** trong `config.yaml`, giữ nguyên toàn bộ phần còn lại (model, agent, gateway, `secret`, ...).

> **Lưu ý:** `dashboard.basic_auth.secret` là **khoá ký token phiên** (HMAC-JWT), KHÔNG phải mật khẩu đăng nhập. Bộ cài giữ nguyên `secret` khi đổi mật khẩu — các phiên đăng nhập cũ vẫn hợp lệ.
>
> `config.yaml` chỉ lưu **HASH scrypt** của mật khẩu, không thể đọc ngược. Nếu quên mật khẩu, truyền mật khẩu mới như trên (không cần biết mật khẩu cũ).

Nếu muốn **giữ nguyên mật khẩu cũ** dù có truyền `HERMES_PLUS_DASHBOARD_PASSWORD`, dùng cờ `--keep-password`:

```bash
sudo HERMES_PLUS_DASHBOARD_PASSWORD=xxx \
     ./deploy/install.sh --keep-password
# → mật khẩu xxx bị bỏ qua; hash cũ trong config.yaml được giữ nguyên
```

### Đổi khoá API AI

```bash
nano /var/lib/hermes-plus/.env
# → cập nhật: DEEPSEEK_API_KEY=sk-xxx
systemctl restart hermes-plus-dashboard hermes-plus-gateway
```

### Đổi cổng web

```bash
nano /etc/systemd/system/hermes-plus-dashboard.service
# → sửa dòng ExecStart ... --port <cổng_mới>
systemctl daemon-reload
systemctl restart hermes-plus-dashboard
```

---

## 8. Cập nhật phiên bản

### 8a. Cách thường dùng: nút «Cập nhật Hermes+»

Bảng điều khiển → menu hệ thống (bên trái) → **Cập nhật Hermes+**. Máy tự:
1. kiểm tra có bản mới trên nhánh `release` không; đợi hàng đợi công việc rảnh;
2. **sao lưu cơ sở dữ liệu** và chụp lại mã hiện tại (để quay về nếu cần);
3. tải bản mới, **biên dịch + nạp thử** ở thư mục tạm trước khi thay mã thật;
4. cài thư viện theo danh sách của bản phát hành, thay mã, khởi động lại cổng nhắn tin rồi bảng điều khiển.

Lỗi giữa chừng thì **tự quay về bản cũ**. Cập nhật **không đụng tới** `config.yaml`, `.env`, `poclip.db`, `profiles/`, **tên công ty đã đặt** và **giấy phép**.

Điều kiện: máy đã có khoá truy cập kho (mục 5). Hệ thống chỉ cập nhật khi **bạn bấm nút** — không tự cập nhật ngầm.

Dòng lệnh tương đương (chạy bằng tài khoản dịch vụ, có nạp `.env`):
```bash
cd /opt/hermes-plus/hermes-agent-main
set -a; . /var/lib/hermes-plus/.env; set +a
HERMES_HOME=/var/lib/hermes-plus venv/bin/python -m hermes_cli.plus_update check      # xem có bản mới không
HERMES_HOME=/var/lib/hermes-plus venv/bin/python -m hermes_cli.plus_update rollback   # quay về bản trước lần cập nhật gần nhất
```

### 8b. Chạy lại bộ cài (sửa chữa, đổi mật khẩu, máy chưa có nút cập nhật)

```bash
sudo bash /opt/hermes-plus/deploy/install.sh --upgrade
```
Với bản phát hành, `--upgrade` tải lại nhánh `release`, chép đè mã (giữ venv, dữ liệu, tên công ty), cài lại thư viện và khởi động lại 2 dịch vụ.
Cần token/khoá truy cập kho như lúc cài (mục 3) hoặc `--source` tới thư mục bản phát hành mới.

### 8c. Chạy lại bộ cài — các cách khác

- **Không cờ**: giữ nguyên `config.yaml`, `.env`, `poclip.db`, `profiles/`; cài lại phụ thuộc Python; **dừng rồi khởi động lại** 2 dịch vụ; chạy kiểm tra sức khoẻ.
  Vì bộ cài KHÔNG biết mật khẩu đã lưu, bước đăng nhập kiểm tra (HC-2) được **bỏ qua** — muốn kiểm tra API thì chạy:
  ```bash
  HERMES_PLUS_DASHBOARD_PASSWORD=<mật khẩu hiện có> sudo -E bash deploy/install.sh
  ```
- **`--source <thư mục khác>`**: chép đè mã nguồn từ thư mục đó. ⚠️ KHÔNG trỏ `--source` vào chính thư mục cài; hãy trỏ vào thư mục nguồn **khác**.

> Bộ cài **dừng dịch vụ trước khi cài lại phụ thuộc** và **luôn khởi động lại dịch vụ**, nên lỗi
> "trang trắng do tiến trình cũ chạy trên venv đã bị thay" không xảy ra.

---

## 9. Sao lưu và phục hồi

### Sao lưu dữ liệu

```bash
# Dừng dịch vụ trước khi sao lưu (tránh DB bị khoá)
systemctl stop hermes-plus-dashboard hermes-plus-gateway

# Sao lưu thư mục dữ liệu
tar -czf /backup/hermes-plus-data-$(date +%Y%m%d).tar.gz /var/lib/hermes-plus/

# Khởi động lại
systemctl start hermes-plus-dashboard hermes-plus-gateway
```

### Phục hồi

```bash
systemctl stop hermes-plus-dashboard hermes-plus-gateway
rm -rf /var/lib/hermes-plus/
tar -xzf /backup/hermes-plus-data-YYYYMMDD.tar.gz -C /
systemctl start hermes-plus-dashboard hermes-plus-gateway
```

---

## 10. Xử lý sự cố

### Chỉ xem được, không lưu/không giao việc được (mã lỗi 402)

Máy **chưa có giấy phép hợp lệ** (chưa cài, hết hạn quá 7 ngày ân hạn, hoặc là giấy phép của máy khác). Xem mục 5 → «Giấy phép». Kiểm tra nhanh:
```bash
sudo -u <tài-khoản-dịch-vụ> env HERMES_HOME=/var/lib/hermes-plus \
  /opt/hermes-plus/hermes-agent-main/venv/bin/python -m hermes_cli.plus_license status
```
Trạng thái: `valid` (tốt) · `grace` (hết hạn, đang ân hạn 7 ngày) · `missing` (chưa cài) · `mismatch` (giấy phép/dữ liệu dùng thử của máy khác) · `invalid` (hỏng/sai chữ ký/dữ liệu dùng thử bị sửa) · `expired` (quá hạn).
Dòng `kind` cho biết loại: `trial` (dùng thử), `term` (có thời hạn, kể cả bản gia hạn), `perpetual` (không hết hạn). `migration_allowed` cho biết có được chuyển công ty không (chỉ `perpetual`).

### Nút «Cập nhật Hermes+» báo «Máy này chưa có quyền đọc kho»

Chưa thêm **khoá công khai của máy** vào GitHub (Deploy keys, chỉ đọc). Lấy khoá: `cat ~/.ssh/hermes_plus_update.pub` (tài khoản chạy dịch vụ) — mục 5.

### Cài xong nhưng thiếu thư viện / `ModuleNotFoundError`

Bộ cài cài thư viện theo `requirements-release.txt` trong bản phát hành. Chạy lại bộ cài (có internet tới pypi.org), hoặc cài tay:
```bash
cd /opt/hermes-plus/hermes-agent-main && ./venv/bin/python -m pip install -r requirements-release.txt   # hoặc: uv pip install --python venv/bin/python -r requirements-release.txt
```


### HC-1 thất bại — dịch vụ khởi động chậm ở lần chạy đầu tiên

**Triệu chứng:** `[LỖI] HC-1 THẤT BẠI — dịch vụ không phản hồi sau 240 giây`

**Nguyên nhân:** Lần chạy **đầu tiên**, Hermes+ phải nạp và khởi tạo tất cả plugin, có thể mất
**1–3 phút** trước khi bảng điều khiển sẵn sàng (máy yếu hoặc ổ đĩa chậm có thể hơn).
Đây không phải lỗi cài đặt — dịch vụ vẫn đang chạy bình thường.

**Cách xử lý:**
```bash
# Kiểm tra dịch vụ có đang chạy không
systemctl status hermes-plus-dashboard

# Theo dõi log thời gian thực cho đến khi thấy "HERMES_DASHBOARD_READY"
journalctl -u hermes-plus-dashboard -f

# Nếu muốn tăng ngưỡng chờ khi cài lần tới (ví dụ: 600 giây cho máy yếu)
sudo HERMES_PLUS_HC_WAIT=600 ./deploy/install.sh ...
```

---

### HC-1b thất bại — giao diện tải tệp tĩnh 0 byte

**Triệu chứng:** `[LỖI] HC-1b GET /assets/index-XxXx.js: nhận 0 byte, đĩa 47253 byte`

**Bộ cài kiểm tra gì:** Sau khi xác nhận dịch vụ phản hồi (HC-1), bộ cài đọc tệp
`hermes_cli/web_dist/index.html` để lấy tên tệp JS có hash (dạng `assets/index-<hash>.js`),
rồi tải tệp đó qua HTTP và so sánh kích thước với bản trên đĩa. Số byte tải về phải **bằng**
số byte trên đĩa và **> 0**. Đây là bài kiểm bắt được lỗi "trang trắng" mà HC-1/HC-2/HC-3
không phát hiện (dịch vụ vẫn trả HTTP 200 nhưng không phục vụ được tệp tĩnh đúng).

**Nguyên nhân thường gặp:** Tiến trình dashboard đang chạy trên môi trường Python (venv) đã bị
thay hoặc xoá — thường xảy ra khi chạy lại bộ cài phiên bản cũ mà không dừng dịch vụ trước.

**Cách khắc phục:**
```bash
sudo systemctl restart hermes-plus-dashboard

# Kiểm tra lại thủ công (thay <hash> bằng tên thật từ index.html):
ASSET=$(grep -oE 'assets/[A-Za-z0-9._-]+\.js' \
  /opt/hermes-plus/hermes-agent-main/hermes_cli/web_dist/index.html | head -1)
curl -s -o /dev/null -w '%{size_download}\n' http://localhost:9119/$ASSET
stat -c %s /opt/hermes-plus/hermes-agent-main/hermes_cli/web_dist/$ASSET
```
Hai số phải bằng nhau và > 0.

**Bản cài mới tự khắc phục:** Script dừng dịch vụ trước khi cài lại phụ thuộc và luôn khởi
động lại dịch vụ sau khi hoàn tất. Nếu HC-1b vẫn thất bại sau khi cài bằng bản mới, kiểm tra
log để tìm lỗi sâu hơn:
```bash
journalctl -u hermes-plus-dashboard -n 80
```

---

### apt update lỗi do nguồn cdrom (file:/cdrom)

**Triệu chứng:**
```
E: The repository 'file:/cdrom jammy Release' no longer has a Release file.
```
Lỗi này khiến `apt-get update` thất bại, kéo theo **mọi bước cài qua apt** (kể cả Node.js 22 từ NodeSource) đều không chạy được.

**Nguyên nhân:** Máy Ubuntu mới cài từ ISO còn dòng nguồn trỏ vào đĩa cdrom (không còn tồn tại) trong `/etc/apt/sources.list`, ví dụ:
```
deb [check-date=no] file:///cdrom jammy main restricted
```

**Script tự xử lý:** Trước khi chạy `apt-get update` (Bước 1), script tự:
1. Quét `/etc/apt/sources.list`, `/etc/apt/sources.list.d/*.list` và `*.sources`
2. Comment (vô hiệu hoá) mọi dòng `deb`/`deb-src` có URI dạng `file:/cdrom`, `file:///cdrom`, `file://cdrom`, `/media/cdrom`, hoặc `cdrom:` — kể cả dòng **thụt đầu dòng** (space/tab) và **chữ hoa** (DEB) — **bỏ qua dòng đã comment sẵn**
3. Sao lưu tệp gốc vào **`/etc/apt/backups-hermes-plus/<tên>.bak-<YYYYmmdd-HHMMSS>`** (thư mục riêng, tránh apt cảnh báo `N: Ignoring file ... invalid filename extension`)
4. In rõ số dòng đã vô hiệu hoá và danh sách file đã quét

Nếu `apt-get update` vẫn thất bại sau khi đã dọn cdrom, script dừng và in 20 dòng lỗi cuối kèm hướng dẫn cụ thể.
Ngoài ra, script **quét lại và liệt kê mọi dòng nguồn cdrom còn sót** (định dạng `file:số-dòng: nội dung`) để chỉ rõ file nào cần sửa tay, và nhắc bỏ cờ `--keep-cdrom-source` nếu đang bật.

**Dọn file sao lưu cũ:** Các lần chạy trước có thể để lại file `*.bak-hermes-plus-*` trong `/etc/apt/sources.list.d/` — apt sẽ cảnh báo `N: Ignoring file ... invalid filename extension`. Bộ cài tự **phát hiện và chuyển** những file này sang `/etc/apt/backups-hermes-plus/` trước khi chạy `apt-get update`, giữ thư mục `sources.list.d/` sạch.

**Cờ `--keep-cdrom-source`:** Nếu muốn giữ nguyên (không tự sửa nguồn cdrom):
```bash
sudo ./deploy/install.sh --keep-cdrom-source --no-install-deps ...
```
Hoặc qua biến môi trường:
```bash
export HERMES_PLUS_KEEP_CDROM_SOURCE=true
sudo ./deploy/install.sh --no-install-deps ...
```

> **Lưu ý:** Khi dùng `--keep-cdrom-source`, nếu nguồn cdrom vẫn còn, `apt-get update` sẽ thất bại. Chỉ dùng cờ này khi bạn đã tự xử lý nguồn apt, hoặc khi dùng `--no-install-deps` và chắc chắn máy đã đủ phụ thuộc.

---

### Cổng bị chiếm

**Triệu chứng:** `[LỖI] Cổng 9119 đang bị chiếm`

**Nguyên nhân:** Có tiến trình khác dùng cổng 9119.

**Cách xử lý:**
```bash
# Xem tiến trình nào chiếm cổng
ss -ltnp | grep :9119

# Hoặc đổi cổng khi cài
sudo ./deploy/install.sh --port 9120
```

---

### Giao diện web trắng / không load

**Triệu chứng:** Vào `http://localhost:9119` thấy trang trắng hoặc lỗi 404.

**Nguyên nhân:** Giao diện chưa được build (thiếu `hermes_cli/web_dist/` hoặc thiếu `dashboard/dist/index.js` của một plugin).

**Cách xử lý — dựng lại giao diện chính:**
```bash
cd /opt/hermes-plus/hermes-agent-main
npm install --workspace web
npm run build -w web
systemctl restart hermes-plus-dashboard
```

**Cách xử lý — dựng lại dashboard một plugin (ví dụ kanban):**
```bash
cd /opt/hermes-plus/hermes-agent-main/plugins/kanban/dashboard
rm -f package-lock.json && rm -rf node_modules
npm install && node build.mjs
systemctl restart hermes-plus-dashboard
```

> Script `install.sh` **quét động** `plugins/*/dashboard/package.json` và build **tất cả** plugin có dashboard — không chỉ 3 plugin hermes-poclip*. Nếu muốn build lại toàn bộ: chạy lại `sudo ./deploy/install.sh --upgrade`.

**Nguyên nhân 2 — Tiến trình đang chạy trên venv đã bị thay/xoá:**

Nếu bộ cài được chạy lại và tiến trình dashboard cũ vẫn đang chạy khi venv bị thay thế,
tệp tĩnh JS sẽ trả HTTP 200 nhưng thân rỗng (0 byte).

**Kiểm tra nhanh:**
```bash
# Lấy tên tệp asset từ index.html
ASSET=$(grep -oE 'assets/[A-Za-z0-9._-]+\.js' \
  /opt/hermes-plus/hermes-agent-main/hermes_cli/web_dist/index.html | head -1)
# So sánh kích thước tải về vs. trên đĩa
curl -s -o /dev/null -w '%{size_download}\n' http://localhost:9119/$ASSET
stat -c %s /opt/hermes-plus/hermes-agent-main/hermes_cli/web_dist/$ASSET
```
Nếu kết quả curl = `0` trong khi `stat` > 0 → tiến trình dashboard đang chạy trên venv đã bị thay.

**Khắc phục ngay:**
```bash
sudo systemctl restart hermes-plus-dashboard
# Kiểm tra lại
curl -s -o /dev/null -w '%{size_download}\n' http://localhost:9119/$ASSET
```

> **Lưu ý:** Bộ cài mới đã khắc phục nguyên nhân này: dịch vụ được **dừng trước khi cài phụ thuộc**
> và **khởi động lại sau khi cài xong** — HC-1b cũng bắt lỗi này tự động.

---

### API trả về 401 khi gọi plugin

**Triệu chứng:** `curl /api/plugins/hermes-poclip/...` trả về 401.

**Nguyên nhân:** Thiếu header `X-3D-Key` khi API có đặt `HERMES_POCLIP_3D_KEYS`.

**Cách xử lý:**
```bash
# Lấy khoá từ .env
grep HERMES_POCLIP_3D_KEYS /var/lib/hermes-plus/.env

# Gọi API kèm header
curl -H "X-3D-Key: <khoá-từ-bên-trên>" http://localhost:9119/api/plugins/hermes-poclip/api/v1/org/tree
```

---

### Thiếu Node.js / npm

**Triệu chứng:** Bước dựng giao diện báo lỗi `npm: không tìm thấy` hoặc `held broken packages`.

**Nguyên nhân:** Node.js 22 được cài từ **NodeSource**, không phải gói Ubuntu. Cài `nodejs`/`npm`
của Ubuntu sẽ xung đột với NodeSource khi chạy lại script.

**Cách xử lý — cài từ NodeSource:**
```bash
# Gỡ gói Ubuntu nếu còn (ngăn xung đột "held broken packages")
sudo apt-get remove -y nodejs npm 2>/dev/null || true

# Cài Node.js 22 từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra phiên bản
node --version   # cần ≥ v22.22.0
npm --version

# Dựng lại giao diện
cd /opt/hermes-plus/hermes-agent-main
npm install --workspace web && npm run build -w web
```

---

### Python hệ thống không phù hợp với `requires-python`

Bộ cài đọc `requires-python` từ `pyproject.toml` (ví dụ `>=3.11,<3.14`) và dùng giá trị đó làm tham số `--python` cho `uv venv`. Hai trường hợp:

- **Python hệ thống quá cũ** (dưới cận dưới, vd 3.10 với `>=3.11`): uv tự động tải Python phù hợp vào thư mục `${HERMES_PLUS_UV_PYTHON_DIR}` (mặc định `/opt/uv-python`). Đây là hành vi **bình thường** — bộ cài sẽ in `[INFO] Python hệ thống quá cũ ... uv sẽ tải Python phù hợp`.
- **Python hệ thống quá mới** (vượt cận trên, vd 3.15 với `<3.14`): bộ cài in `[LỖI] Python ... QUÁ MỚI` và thoát. Đây **không phải lỗi cài đặt** — cần nâng `requires-python` trong `pyproject.toml` hoặc cài Python đúng phiên bản.

> Lưu ý: thông báo "quá mới" và "quá cũ" là riêng biệt — không nhầm lẫn "quá mới" thành "lỗi thiếu Python".

---

### Lỗi esbuild "Expected X but got Y" khi dựng dashboard plugin

**Triệu chứng:** Bước dựng dashboard plugin báo:
```
npm error Error: Expected "0.24.2" but got "0.28.1"
[LỖI]   hermes-poclip-policy: cài phụ thuộc THẤT BẠI sau 3 tầng.
```

**Nguyên nhân:** `package-lock.json` trong thư mục `dashboard/` sinh trên Windows, thiếu entry gói nền tảng `@esbuild/linux-x64`. Khi cài trên Linux, `node install.js` của esbuild tìm ngược lên thư mục cha và nhặt phiên bản không khớp từ `node_modules/` của thư mục gốc.

Script `install.sh` tự xử lý qua cơ chế 3 tầng (tầng 3: xoá lock + cài lại). Nếu vẫn gặp lỗi, xử lý thủ công:

```bash
cd /opt/hermes-plus/hermes-agent-main/plugins/hermes-poclip-policy/dashboard
rm -f package-lock.json
rm -rf node_modules
npm install
node build.mjs
```

---

### Dịch vụ crash liên tục

**Triệu chứng:** `systemctl status hermes-plus-dashboard` hiển thị `activating` → `failed` liên tục.

**Cách xử lý:**
```bash
# Xem log chi tiết
journalctl -u hermes-plus-dashboard --no-pager -n 100

# Thử chạy thủ công để xem lỗi thực tế
source /var/lib/hermes-plus/.env
HERMES_HOME=/var/lib/hermes-plus \
HERMES_POCLIP_DB_PATH=/var/lib/hermes-plus/poclip.db \
/opt/hermes-plus/hermes-agent-main/venv/bin/python \
  -m hermes_cli.main dashboard --port 9119 --host 0.0.0.0 --no-open --skip-build
```

---

### Hết dung lượng đĩa

**Triệu chứng:** Lỗi `No space left on device`.

**Cách xử lý:**
```bash
# Kiểm tra dung lượng
df -h

# Xem thư mục lớn nhất
du -sh /opt/hermes-plus/hermes-agent-main/venv/
du -sh /opt/hermes-plus/hermes-agent-main/node_modules/

# Dọn cache npm
npm cache clean --force

# Xem log lớn
du -sh /var/lib/hermes-plus/logs/
```

---

## 11. Kiểm tra nhanh bộ cài

Chạy lệnh sau để xác nhận bộ cài hoạt động đúng — không cần root, không cần mạng, không ghi gì vào hệ thống:

```bash
bash ./deploy/install.sh --self-test
```

Mỗi ca in `[ OK ]` hoặc `[FAIL]`. Script thoát `exit 0` nếu tất cả đều `[ OK ]`, `exit 1` nếu có ca hỏng.

Hiện có **42 ca** (thêm 5 ca nhận diện bản phát hành `_is_release_tree` và nhánh mặc định `release`) bao gồm: nhận biết 10 định dạng nguồn cdrom (+ 2 ca âm), 3 ca so sánh phiên bản, 4 ca phân loại lỗi pip (trong đó 1 ca `python_too_new`), 4 ca cập nhật/chèn `password_hash`, 1 ca đọc `pyproject.toml`, 4 ca `python_minor_ok` tường minh với dải `>=3.11,<3.14`, 2 ca `_report_cdrom_leftovers`, và 1 ca `python_minor_ok` với dải không cận trên (`"3.20"` với `>=3.11` → rc=0).

**Self-test hoàn toàn độc lập với Python hệ thống của máy đang chạy** — mọi ca kiểm tra `python_minor_ok` đều dùng version tường minh, không phụ thuộc phiên bản Python đang cài. Bộ cài chỉ in một dòng `[INFO]` thông báo Python hệ thống để tham khảo, không phải ca kiểm tra.

---

## 12. Tham chiếu nhanh

### Tất cả cờ của install.sh

| Cờ | Giá trị mặc định | Mô tả |
|----|-----------------|-------|
| `--source <dir>` | — | Thư mục mã nguồn có sẵn (offline). ⚠️ Không trỏ vào chính thư mục cài (bộ cài sẽ tự bỏ qua bước chép, nhưng cách đúng là dùng thư mục nguồn khác). |
| `--repo <url>` | github.com/anhvt78/hermes_plus.git | Địa chỉ git để clone |
| `--ref <ref>` | `release` | Nhánh hoặc tag. `release` = bản phát hành (giao diện dựng sẵn); `main` = kho đầy đủ kiểu cũ |
| `--license <tệp>` | — | Cài giấy phép Hermes+ ngay khi cài |
| `--update-repo <url>` | `git@github.com:anhvt78/hermes_plus.git` | Nơi máy lấy bản cập nhật (nút «Cập nhật Hermes+») |
| `--install-dir <path>` | `/opt/hermes-plus` | Nơi cài mã nguồn |
| `--data-dir <path>` | `/var/lib/hermes-plus` | Thư mục dữ liệu |
| `--port <n>` | `9119` | Cổng bảng điều khiển web |
| `--profile <name>` | `default` | Hồ sơ chính |
| `--dashboard-user <name>` | `President` | Tên đăng nhập |
| `--env-file <path>` | — | Tệp .env chứa bí mật |
| `--install-deps` / `--no-install-deps` | `true` | Tự cài gói apt |
| `--systemd` / `--no-systemd` | `true` | Tạo dịch vụ systemd |
| `--non-interactive` | — | Không hỏi người dùng |
| `--skip-build` | — | Bỏ qua bước dựng giao diện |
| `--dry-run` | — | In kế hoạch, không thực thi |
| `--upgrade` | — | Cập nhật mã nguồn và dịch vụ |
| `--keep-cdrom-source` | — | KHÔNG tự vô hiệu hoá nguồn apt cdrom (mặc định: tự sửa) |
| `--keep-password` | — | Giữ mật khẩu cũ dù người dùng truyền `HERMES_PLUS_DASHBOARD_PASSWORD` |
| `--self-test` | — | Chạy kiểm tra tích hợp (không cần root/mạng); exit 1 nếu có ca hỏng |
| `--help` | — | In trợ giúp đầy đủ |

### Biến môi trường

| Biến | Tương đương | Mô tả |
|------|------------|-------|
| `HERMES_PLUS_SOURCE` | `--source` | Thư mục mã nguồn |
| `HERMES_PLUS_REPO` | `--repo` | Địa chỉ git |
| `HERMES_PLUS_REF` | `--ref` | Nhánh/tag |
| `HERMES_PLUS_INSTALL_DIR` | `--install-dir` | Thư mục cài |
| `HERMES_PLUS_DATA_DIR` | `--data-dir` | Thư mục dữ liệu |
| `HERMES_PLUS_PORT` | `--port` | Cổng web |
| `HERMES_PLUS_PROFILE` | `--profile` | Hồ sơ |
| `HERMES_PLUS_DASHBOARD_USER` | `--dashboard-user` | Tên đăng nhập |
| `HERMES_PLUS_ENV_FILE` | `--env-file` | Tệp bí mật |
| `HERMES_PLUS_INSTALL_DEPS` | `--[no-]install-deps` | `true`/`false` |
| `HERMES_PLUS_SYSTEMD` | `--[no-]systemd` | `true`/`false` |
| `HERMES_PLUS_INTERACTIVE` | `--non-interactive` | `false` = không hỏi |
| `HERMES_PLUS_SKIP_BUILD` | `--skip-build` | `true`/`false` |
| `HERMES_PLUS_DRY_RUN` | `--dry-run` | `true`/`false` |
| `HERMES_PLUS_GIT_TOKEN` | — | Token GitHub |
| `HERMES_PLUS_API_KEY` | — | Khoá API AI |
| `DEEPSEEK_API_KEY` | — | Khoá DeepSeek (thay thế) |
| `TELEGRAM_BOT_TOKEN` | — | Token Telegram |
| `HERMES_PLUS_DASHBOARD_PASSWORD` | — | Mật khẩu bảng điều khiển |
| `HERMES_POCLIP_3D_KEYS` | — | Khoá API-3D (tự sinh nếu trống) |
| `HERMES_PLUS_KEEP_CDROM_SOURCE` | `--keep-cdrom-source` | `true` = giữ nguồn cdrom, không tự sửa |
| `HERMES_PLUS_KEEP_PASSWORD` | `--keep-password` | `true` = giữ mật khẩu cũ dù truyền `HERMES_PLUS_DASHBOARD_PASSWORD` |
| `HERMES_PLUS_UV_PYTHON_DIR` | — | Thư mục Python dùng chung (mặc định: `/opt/uv-python`) |
| `HERMES_PLUS_LICENSE_INSTALL` | `--license` | Tệp giấy phép cần cài |
| `HERMES_PLUS_UPDATE_REPO` | `--update-repo` | Nơi lấy bản cập nhật (ghi vào `.env` của máy) |
| `HERMES_PLUS_UPDATE_BRANCH` | — | Nhánh cập nhật (mặc định `release`) |
| `HERMES_PLUS_LICENSE_FILE` | — | (nâng cao) Đường dẫn tệp giấy phép; mặc định `<thư mục dữ liệu>/license.json` |

### Cấu trúc thư mục sau khi cài

```
/opt/hermes-plus/                    # --install-dir
└── hermes-agent-main/               # mã nguồn chính
    ├── venv/                        # Python venv
    ├── hermes_cli/web_dist/         # giao diện web đã build
    ├── plugins/
    │   └── <tên>/dashboard/dist/               # mọi plugin có dashboard/
    │       # Script quét động plugins/*/dashboard/package.json
    │       # (hermes-poclip, hermes-poclip-meeting, hermes-poclip-policy,
    │       #  kanban, hermes-achievements, … — tất cả được build tự động)
    └── ...

/var/lib/hermes-plus/                # --data-dir (HERMES_HOME)
├── config.yaml                      # cấu hình (quyền 600)
├── .env                             # bí mật: API keys (quyền 600)
├── poclip.db                        # cơ sở dữ liệu (tự tạo khi khởi động)
├── profiles/                        # hồ sơ bổ sung
├── sessions/                        # lịch sử phiên
├── memories/                        # bộ nhớ
└── logs/                            # log ứng dụng
```
