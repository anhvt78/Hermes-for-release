#!/usr/bin/env bash
# =============================================================================
# deploy/install.sh — Bộ cài đặt Hermes+ cho Ubuntu
# Người dùng: sudo ./deploy/install.sh [--help]
# =============================================================================
set -Eeuo pipefail

readonly _INSTALLER_VERSION="1.0.0"
readonly _DEFAULT_REPO="https://github.com/anhvt78/hermes_plus.git"
readonly _DEFAULT_REF="release"      # nhánh phát hành (cây mã đã dựng sẵn giao diện); "main" = kho đầy đủ kiểu cũ
readonly _DEFAULT_INSTALL_DIR="/opt/hermes-plus"
readonly _DEFAULT_DATA_DIR="/var/lib/hermes-plus"
readonly _DEFAULT_PORT="9119"
readonly _DEFAULT_PROFILE="default"
readonly _DEFAULT_DASHBOARD_USER="President"
readonly _HERMES_SRC_SUBDIR="hermes-agent-main"
readonly _SVC_DASHBOARD="hermes-plus-dashboard"
readonly _SVC_GATEWAY="hermes-plus-gateway"
readonly _SVC_WATCHDOG="hermes-plus-watchdog"
readonly _PY_MIN="3.11"          # Python tối thiểu — hermes-agent yêu cầu
# Gói apt tối thiểu cần có
readonly _APT_PKGS="python3-venv python3-pip python3-dev git curl ca-certificates build-essential rsync openssh-client"

# --------------------------------------------------------------------------
# Màu sắc & logging
# --------------------------------------------------------------------------
if [[ -t 1 && -t 2 ]]; then
  _R='\033[0;31m' _Y='\033[1;33m' _G='\033[0;32m'
  _C='\033[0;36m' _B='\033[1m'   _N='\033[0m'
else
  _R='' _Y='' _G='' _C='' _B='' _N=''
fi

log_info()  { printf "${_C}[INFO]${_N}  %s\n"    "$*"; }
log_warn()  { printf "${_Y}[WARN]${_N}  %s\n"    "$*" >&2; }
log_err()   { printf "${_R}[LỖI]${_N}   %s\n"    "$*" >&2; }
log_ok()    { printf "${_G}[ OK ]${_N}  %s\n"    "$*"; }
log_step()  { printf "\n${_B}══════ %s ══════${_N}\n" "$*"; }
die()       { log_err "$*"; exit 1; }

# Bắt lỗi không ngờ
trap 'log_err "Lỗi tại dòng $LINENO (lệnh: $BASH_COMMAND). Dừng."; exit 1' ERR

# --------------------------------------------------------------------------
# Tiện ích
# --------------------------------------------------------------------------
mask_secret() {
  local s="${1:-}" len="${#1}"
  if (( len == 0 )); then printf '(trống)'; return; fi
  if (( len <= 8  )); then printf '****'; return; fi
  printf '%s...%s' "${s:0:4}" "${s: -4}"
}

_gen_hex()   { python3 -c "import secrets; print(secrets.token_hex(${1:-32}))"; }
_gen_b64()   { python3 -c "import secrets,base64; print(base64.urlsafe_b64encode(secrets.token_bytes(${1:-32})).decode().rstrip('='))"; }
_gen_pass()  { python3 -c "import secrets,string; pool=string.ascii_letters+string.digits; print(''.join(secrets.choice(pool) for _ in range(20)))"; }

# Sinh hash mật khẩu bằng stdlib scrypt (không cần venv)
_hash_password() {
  local pw="$1"
  HASH_INPUT="$pw" python3 - <<'PYEOF'
import hashlib, secrets, base64, os
pw  = os.environ['HASH_INPUT'].encode('utf-8')
salt = secrets.token_bytes(16)
dk   = hashlib.scrypt(pw, salt=salt, n=16384, r=8, p=1, dklen=32, maxmem=0)
print(f"scrypt$16384$8$1${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}")
PYEOF
}

# Mật khẩu bảng điều khiển do người dùng gõ: tối thiểu 10 ký tự và phải gõ lại hai lần khớp nhau.
readonly _MIN_PASSWORD_LEN=10
# $1 = lần gõ thứ nhất, $2 = lần gõ lại. rc 0 = hợp lệ, 1 = quá ngắn, 2 = hai lần không khớp.
_check_new_password() {
  [[ "${#1}" -ge "$_MIN_PASSWORD_LEN" ]] || return 1
  [[ "$1" == "$2" ]] || return 2
  return 0
}
# Hỏi tối đa 3 lần (Enter để trống = tự sinh). Hợp lệ thì gán DASHBOARD_PASSWORD; hết 3 lần mà vẫn sai thì để trống → tự sinh.
_prompt_dashboard_password() {
  local p1 p2 try rc
  for try in 1 2 3; do
    read -rsp "$(printf "${_C}[NHẬP]${_N} Mật khẩu bảng điều khiển (tối thiểu ${_MIN_PASSWORD_LEN} ký tự, Enter để tự sinh): ")" p1; echo
    [[ -z "$p1" ]] && return 0
    read -rsp "$(printf "${_C}[NHẬP]${_N} Gõ lại mật khẩu: ")" p2; echo
    rc=0; _check_new_password "$p1" "$p2" || rc=$?
    case "$rc" in
      0) DASHBOARD_PASSWORD="$p1"; return 0 ;;
      1) log_warn "Mật khẩu quá ngắn — cần tối thiểu ${_MIN_PASSWORD_LEN} ký tự. Gõ lại (lần ${try}/3)." ;;
      *) log_warn "Hai lần gõ không khớp. Gõ lại (lần ${try}/3)." ;;
    esac
  done
  log_warn "Nhập sai 3 lần — bộ cài sẽ tự sinh mật khẩu và in ra ở cuối."
  return 0
}

# Thêm khoá vào .env nếu chưa có — idempotent (chạy 2 lần không đổi tệp)
_ensure_env_key() {
  local key="$1" val="$2"
  grep -qE "^${key}=" "$ENV_DATA_FILE" 2>/dev/null && return 0
  printf '%s=%s\n' "$key" "$val" >> "$ENV_DATA_FILE"
}

check_port_free() {
  local port="$1"
  if ss -ltn 2>/dev/null | grep -qE ":${port}[[:space:]]"; then
    local pid="" proc="?" _cmdline=""
    pid=$(ss -ltnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
    [[ -n "$pid" ]] && proc=$(ps -p "$pid" -o comm= 2>/dev/null || echo "?")
    [[ -n "$pid" ]] && _cmdline=$(tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null || true)
    # Nếu cổng do chính dịch vụ Hermes+ của bản cài này đang chiếm → bỏ qua (idempotent)
    if systemctl is-active --quiet "${_SVC_DASHBOARD}" 2>/dev/null \
       && printf '%s' "$_cmdline" | grep -qF "${VENV_DIR}/bin/python" 2>/dev/null \
       && printf '%s' "$_cmdline" | grep -q "hermes_cli.main" 2>/dev/null; then
      log_info "Cổng ${port} đang do dịch vụ Hermes+ của bản cài này dùng — bỏ qua kiểm tra."
      return 0
    fi
    log_err "Cổng ${port} đang bị chiếm (PID=${pid:-?}, tiến trình=${proc})."
    log_info "Gợi ý: đổi cổng bằng --port <cổng_khác> (ví dụ: --port 9120)"
    return 1
  fi
  return 0
}

# Trả về 0 nếu $1 >= $2 (so sánh phiên bản semver bằng sort -V, không so sánh chuỗi)
version_ge() {
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Kiểm tra npm thoả điều kiện "<11.10.0 || >=11.17.0"
npm_version_ok() {
  local v="$1"
  if version_ge "$v" "11.17.0"; then
    return 0
  elif ! version_ge "$v" "11.10.0"; then
    return 0
  else
    return 1
  fi
}

# Kiểm tra trực tiếp xem deb.nodesource.com có đạt được không.
# Không dùng HAS_INTERNET làm điều kiện duy nhất vì chế độ --source bỏ qua
# phép thử internet ở preflight (giả định offline), nhưng máy vẫn có thể
# thực sự có internet — và khi đó ta vẫn nên thử cài Node từ NodeSource.
_probe_node_source() {
  curl -fsS --connect-timeout 8 --max-time 20 \
       -o /dev/null https://deb.nodesource.com/setup_22.x 2>/dev/null
}

wait_for_http() {
  local url="$1" header="${2:-}" max_sec="${3:-60}" elapsed=0
  log_info "Chờ dịch vụ khởi động (tối đa ${max_sec}s): $url"
  while (( elapsed < max_sec )); do
    local code
    if [[ -n "$header" ]]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' -H "$header" --connect-timeout 3 "$url" 2>/dev/null || true)
    else
      code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "$url" 2>/dev/null || true)
    fi
    [[ "$code" == "200" ]] && return 0
    sleep 2; (( elapsed += 2 ))
  done
  return 1
}

# Probe internet thực sự (không phụ thuộc vào HAS_INTERNET/--source logic)
probe_internet() {
  curl -fsSL --connect-timeout 5 --max-time 10 https://pypi.org/ >/dev/null 2>&1 && return 0
  curl -fsSL --connect-timeout 5 --max-time 10 https://astral.sh/ >/dev/null 2>&1 && return 0
  return 1
}

# Kiểm tra Python hệ thống so với _PY_REQ (>=lower[,<upper]).
# Tham số tuỳ chọn $1 = version test (mặc định: python3 hệ thống).
# Trả: 0 hợp lệ | 1 quá cũ (< cận dưới) | 2 quá mới (>= cận trên).
python_minor_ok() {
  local _cur="${1:-}"
  [[ -z "$_cur" ]] && _cur=$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null || echo "0.0")
  local _lo _hi _hi_ver
  _lo=$(printf '%s' "${_PY_REQ}" | grep -oE '>=[0-9]+\.[0-9]+' | head -1 | sed 's/^>=//')
  [[ -z "$_lo" ]] && _lo="${_PY_MIN}"
  if ! printf '%s\n%s\n' "$_lo" "$_cur" | sort -V -C; then
    return 1
  fi
  _hi=$(printf '%s' "${_PY_REQ}" | grep -oE '<[=]?[0-9]+\.[0-9]+' | head -1)
  if [[ -n "$_hi" ]]; then
    if [[ "${_hi:0:2}" == "<=" ]]; then
      _hi_ver="${_hi#<=}"
      if ! printf '%s\n%s\n' "$_cur" "$_hi_ver" | sort -V -C; then
        return 2
      fi
    else
      _hi_ver="${_hi#<}"
      if printf '%s\n%s\n' "$_hi_ver" "$_cur" | sort -V -C; then
        return 2
      fi
    fi
  fi
  return 0
}

# Matcher cdrom dùng chung — cả fix_apt_cdrom_sources lẫn --self-test đều gọi hàm này
_cdrom_line_matches() {
  printf '%s' "$1" | grep -qiE \
    '^[[:space:]]*deb(-src)?([[:space:]]+\[[^]]*\])?[[:space:]]+((file:/+[^[:space:]]*cdrom)|cdrom:)'
}

# Đọc requires-python từ pyproject.toml của dự án; trả về chuỗi như ">=3.11,<3.14".
# Thử HERMES_SRC_DIR trước, rồi SOURCE_DIR subpath; fallback: ">=${_PY_MIN}".
_project_python_requires() {
  local _pyproj="${HERMES_SRC_DIR}/pyproject.toml"
  if [[ -n "${SOURCE_DIR:-}" && ! -f "$_pyproj" ]]; then
    _pyproj="${SOURCE_DIR}/${_HERMES_SRC_SUBDIR}/pyproject.toml"
  fi
  [[ -f "$_pyproj" ]] || { printf '>=%s' "${_PY_MIN}"; return; }
  local _raw
  _raw=$(grep -m1 -oE 'requires-python[[:space:]]*=[[:space:]]*"[^"]+"' "$_pyproj" 2>/dev/null \
    | sed 's/requires-python[[:space:]]*=[[:space:]]*"\([^"]*\)"/\1/' || true)
  [[ -n "$_raw" ]] && printf '%s' "$_raw" || printf '>=%s' "${_PY_MIN}"
}

# --------------------------------------------------------------------------
# Vô hiệu hoá nguồn apt trỏ vào cdrom/file:/cdrom (tránh lỗi "no Release file")
# Nhận: đường dẫn tệp .list; bỏ qua dòng đã comment; sao lưu trước khi sửa.
# --------------------------------------------------------------------------
_disable_cdrom_in_list_file() {
  local _file="$1"
  [[ -f "$_file" ]] || return 0
  # Kiểm tra có dòng active cdrom không (bỏ qua dòng đã comment)
  local _has_active=false
  while IFS= read -r _ln || [[ -n "$_ln" ]]; do
    [[ -z "$_ln" || "$_ln" =~ ^[[:space:]]*# ]] && continue
    _cdrom_line_matches "$_ln" && { _has_active=true; break; }
  done < "$_file"
  "$_has_active" || return 0
  # Sao lưu vào thư mục riêng (tránh apt cảnh báo invalid filename extension)
  local _bak_dir="/etc/apt/backups-hermes-plus"
  mkdir -p "$_bak_dir" 2>/dev/null || _bak_dir="/tmp/hermes-plus-apt-bak"
  mkdir -p "$_bak_dir" 2>/dev/null || true
  local _bak="${_bak_dir}/$(basename "$_file").bak-$(date +%Y%m%d-%H%M%S)"
  cp -a "$_file" "$_bak"
  log_info "  Sao lưu: $_bak"
  local _tmp _count=0
  _tmp=$(mktemp)
  while IFS= read -r _ln || [[ -n "$_ln" ]]; do
    if [[ -z "$_ln" || "$_ln" =~ ^[[:space:]]*# ]]; then
      printf '%s\n' "$_ln" >> "$_tmp"; continue
    fi
    if _cdrom_line_matches "$_ln"; then
      log_warn "  [VÔ HIỆU] $_file: $_ln"
      printf '# [hermes-plus] %s\n' "$_ln" >> "$_tmp"
      _count=$(( _count + 1 ))
    else
      printf '%s\n' "$_ln" >> "$_tmp"
    fi
  done < "$_file"
  cat "$_tmp" > "$_file"; rm -f "$_tmp"
  log_info "  Đã vô hiệu hoá $_count dòng trong: $_file"
}

# Quét /etc/apt/sources.list + sources.list.d/*.list + *.sources;
# vô hiệu hoá mọi nguồn cdrom active; ghi _CDROM_SOURCES_CLEANED=true nếu có.
fix_apt_cdrom_sources() {
  if [[ "$KEEP_CDROM_SOURCE" == "true" ]]; then
    log_warn "--keep-cdrom-source: giữ nguyên nguồn cdrom — apt-get update rất có thể sẽ hỏng nếu nguồn cdrom vẫn còn."
    return 0
  fi
  if [[ "$(id -u)" -ne 0 ]]; then
    log_warn "Không phải root — KHÔNG thể tự dọn nguồn apt cdrom. Nếu apt-get update lỗi 'no longer has a Release file', hãy chạy lại bộ cài bằng sudo hoặc tự comment dòng 'deb … cdrom …' trong /etc/apt/sources.list."
    return 0
  fi
  # Di chuyển file sao lưu cũ ra khỏi sources.list.d (apt cảnh báo invalid filename extension)
  local _bak_mv_dir="/etc/apt/backups-hermes-plus"
  mkdir -p "$_bak_mv_dir" 2>/dev/null || _bak_mv_dir="/tmp/hermes-plus-apt-bak"
  mkdir -p "$_bak_mv_dir" 2>/dev/null || true
  local _bak_mv_count=0 _bak_mv_f
  for _bak_mv_f in /etc/apt/sources.list.d/*.bak-hermes-plus-*; do
    [[ -f "$_bak_mv_f" ]] || continue
    mv "$_bak_mv_f" "${_bak_mv_dir}/" 2>/dev/null && _bak_mv_count=$(( _bak_mv_count + 1 )) || true
  done
  if (( _bak_mv_count > 0 )); then
    log_info "Đã chuyển ${_bak_mv_count} file sao lưu cũ khỏi /etc/apt/sources.list.d/ sang ${_bak_mv_dir}"
  fi

  log_info "Kiểm tra nguồn apt cdrom (tự vô hiệu hoá nếu có)..."
  local _any=false _f _scanned=("/etc/apt/sources.list")
  local _ln _found

  # Kiểm tra /etc/apt/sources.list
  if [[ -f "/etc/apt/sources.list" ]]; then
    _found=false
    while IFS= read -r _ln || [[ -n "$_ln" ]]; do
      [[ -z "$_ln" || "$_ln" =~ ^[[:space:]]*# ]] && continue
      _cdrom_line_matches "$_ln" && { _found=true; break; }
    done < "/etc/apt/sources.list"
    if "$_found"; then _any=true; _disable_cdrom_in_list_file /etc/apt/sources.list; fi
  fi

  for _f in /etc/apt/sources.list.d/*.list; do
    [[ -f "$_f" ]] || continue
    _scanned+=("$_f")
    _found=false
    while IFS= read -r _ln || [[ -n "$_ln" ]]; do
      [[ -z "$_ln" || "$_ln" =~ ^[[:space:]]*# ]] && continue
      _cdrom_line_matches "$_ln" && { _found=true; break; }
    done < "$_f"
    if "$_found"; then _any=true; _disable_cdrom_in_list_file "$_f"; fi
  done

  for _f in /etc/apt/sources.list.d/*.sources; do
    [[ -f "$_f" ]] || continue
    _scanned+=("$_f")
    if grep -qiE '^[[:space:]]*URIs:.*cdrom' "$_f" 2>/dev/null; then
      _any=true
      local _bak_dir2="/etc/apt/backups-hermes-plus"
      mkdir -p "$_bak_dir2" 2>/dev/null || _bak_dir2="/tmp/hermes-plus-apt-bak"
      mkdir -p "$_bak_dir2" 2>/dev/null || true
      local _bak2="${_bak_dir2}/$(basename "$_f").bak-$(date +%Y%m%d-%H%M%S)"
      local _dis="${_f}.disabled"
      cp -a "$_f" "$_bak2"; mv "$_f" "$_dis"
      log_warn "  [VÔ HIỆU] $_f → $_dis  (sao lưu: $_bak2)"
    fi
  done

  log_info "Đã quét ${#_scanned[@]} file nguồn apt: ${_scanned[*]}"
  if [[ "$_any" == "true" ]]; then
    _CDROM_SOURCES_CLEANED="true"
    log_ok "Nguồn cdrom đã được vô hiệu hoá — apt-get update có thể tiến hành."
  else
    log_info "Không có nguồn cdrom — không cần xử lý."
  fi
}

# Quét lại nguồn apt để chỉ ra dòng cdrom còn sót sau khi dọn.
# Nhận args tuỳ chọn: danh sách file cần quét (dùng cho self-test);
# không có args → quét /etc/apt/sources.list + sources.list.d/*.list + *.sources.
_report_cdrom_leftovers() {
  local -a _scan_files=()
  if [[ $# -gt 0 ]]; then
    _scan_files=("$@")
  else
    [[ -f "/etc/apt/sources.list" ]] && _scan_files+=("/etc/apt/sources.list")
    local _f
    for _f in /etc/apt/sources.list.d/*.list; do [[ -f "$_f" ]] && _scan_files+=("$_f"); done
    for _f in /etc/apt/sources.list.d/*.sources; do
      [[ -f "$_f" ]] && grep -qiE '^[[:space:]]*URIs:.*cdrom' "$_f" 2>/dev/null && _scan_files+=("$_f")
    done
  fi
  local _found_any=false _fn _ln _lnum
  if [[ ${#_scan_files[@]} -gt 0 ]]; then
    for _fn in "${_scan_files[@]}"; do
      [[ -f "$_fn" ]] || continue
      _lnum=0
      while IFS= read -r _ln || [[ -n "$_ln" ]]; do
        _lnum=$(( _lnum + 1 ))
        [[ -z "$_ln" || "$_ln" =~ ^[[:space:]]*# ]] && continue
        if _cdrom_line_matches "$_ln"; then
          printf '  %s:%d: %s\n' "$_fn" "$_lnum" "$_ln"
          _found_any=true
        fi
      done < "$_fn"
    done
  fi
  if ! "$_found_any"; then
    printf '  (không còn dòng cdrom nào khớp — nguyên nhân nhiều khả năng ở nguồn apt khác, xem 20 dòng lỗi ở trên)\n'
  fi
}

# Trả về 0 (GIỮ) nếu constitution.yaml tại $1 chứa tên do người dùng đặt (QĐ-2).
# Luật: marker "user" → GIỮ; marker "seed" → không giữ;
# không marker: GIỮ nếu company_name không rỗng, != "Hermes+",
# != "Hermes SME Studio", và không bắt đầu bằng "REPLACE".
_should_preserve_company_name() {
  local _yaml="${1:-}"
  [[ -f "$_yaml" ]] || return 1
  if grep -Eq '^[[:space:]]*company_name_source:[[:space:]]*"?user"?' "$_yaml"; then
    return 0
  fi
  if grep -q 'company_name_source:' "$_yaml"; then
    return 1
  fi
  local _name
  _name=$(grep -m1 'company_name:' "$_yaml" \
    | sed 's/.*company_name:[[:space:]]*//' \
    | sed "s/^[\"']\(.*\)[\"']$/\1/" \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  [[ -z "$_name" ]] && return 1
  [[ "$_name" == "Hermes+" ]] && return 1
  [[ "$_name" == "Hermes SME Studio" ]] && return 1
  [[ "$_name" == REPLACE* ]] && return 1
  return 0
}

# Trả về 0 nếu thư mục $1 là một BẢN PHÁT HÀNH Hermes+ (cây mã nằm thẳng ở gốc, có RELEASE.json) — khác với kho đầy đủ có thư mục hermes-agent-main/
_is_release_tree() {
  local _d="${1:-}"
  [[ -n "$_d" && -f "${_d}/RELEASE.json" && -d "${_d}/hermes_cli" && ! -d "${_d}/${_HERMES_SRC_SUBDIR}" ]]
}

# --------------------------------------------------------------------------
# Giá trị mặc định (ưu tiên: biến môi trường → cờ dòng lệnh → mặc định)
# --------------------------------------------------------------------------
SOURCE_DIR="${HERMES_PLUS_SOURCE:-}"
REPO="${HERMES_PLUS_REPO:-$_DEFAULT_REPO}"
REF="${HERMES_PLUS_REF:-$_DEFAULT_REF}"
INSTALL_DIR="${HERMES_PLUS_INSTALL_DIR:-$_DEFAULT_INSTALL_DIR}"
DATA_DIR="${HERMES_PLUS_DATA_DIR:-$_DEFAULT_DATA_DIR}"
PORT="${HERMES_PLUS_PORT:-$_DEFAULT_PORT}"
PROFILE="${HERMES_PLUS_PROFILE:-$_DEFAULT_PROFILE}"
DASHBOARD_USER="${HERMES_PLUS_DASHBOARD_USER:-$_DEFAULT_DASHBOARD_USER}"
ENV_FILE="${HERMES_PLUS_ENV_FILE:-}"
INSTALL_DEPS="${HERMES_PLUS_INSTALL_DEPS:-true}"
USE_SYSTEMD="${HERMES_PLUS_SYSTEMD:-true}"
INTERACTIVE="${HERMES_PLUS_INTERACTIVE:-true}"
SKIP_BUILD="${HERMES_PLUS_SKIP_BUILD:-false}"
DRY_RUN="${HERMES_PLUS_DRY_RUN:-false}"
UPGRADE_MODE="${HERMES_PLUS_UPGRADE:-false}"
GIT_TOKEN="${HERMES_PLUS_GIT_TOKEN:-}"
API_KEY="${HERMES_PLUS_API_KEY:-${DEEPSEEK_API_KEY:-}}"
TELEGRAM_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
DASHBOARD_PASSWORD="${HERMES_PLUS_DASHBOARD_PASSWORD:-}"
POCLIP_3D_KEYS="${HERMES_POCLIP_3D_KEYS:-}"
HC_WAIT="${HERMES_PLUS_HC_WAIT:-240}"
KEEP_CDROM_SOURCE="${HERMES_PLUS_KEEP_CDROM_SOURCE:-false}"
KEEP_PASSWORD="${HERMES_PLUS_KEEP_PASSWORD:-false}"
SELF_TEST="${HERMES_PLUS_SELF_TEST:-false}"
LICENSE_FILE_ARG="${HERMES_PLUS_LICENSE_INSTALL:-}"     # tệp giấy phép cài ngay trong lúc cài đặt (= --license)
UPDATE_REPO="${HERMES_PLUS_UPDATE_REPO:-git@github.com:anhvt78/hermes_plus.git}"   # nơi máy tự lấy bản cập nhật (nút «Cập nhật Hermes+»)
UPDATE_BRANCH="${HERMES_PLUS_UPDATE_BRANCH:-release}"
RELEASE_LAYOUT="false"           # true khi cài từ bản phát hành (xem _is_release_tree)
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_CDROM_SOURCES_CLEANED="false"   # cập nhật bởi fix_apt_cdrom_sources()
HAS_NET="false"                  # cập nhật bởi probe_internet() trong preflight
_PY_REQ=">=${_PY_MIN}"          # cập nhật bởi _project_python_requires() trước khi tạo venv

# Thư mục Python dùng chung — tránh venv trỏ vào /root/.local (Permission denied ở user dịch vụ)
_uv_python_dir_candidates=(
  "${HERMES_PLUS_UV_PYTHON_DIR:-/opt/uv-python}"
  "/usr/local/share/uv-python"
  "${HOME}/.local/share/hermes-plus-uv-python"
)
UV_PYTHON_DIR="${_uv_python_dir_candidates[0]}"
for _d in "${_uv_python_dir_candidates[@]}"; do
  if mkdir -p "$_d" 2>/dev/null && touch "$_d/.hermes_probe" 2>/dev/null; then
    rm -f "$_d/.hermes_probe"
    UV_PYTHON_DIR="$_d"
    break
  fi
done
unset _d _uv_python_dir_candidates

# --------------------------------------------------------------------------
# Trợ giúp
# --------------------------------------------------------------------------
usage() {
  cat <<'HELP'
Hermes+ Installer — Cài đặt Hermes+ lên máy Ubuntu mới

CÁCH DÙNG:
  sudo ./deploy/install.sh [tuỳ-chọn]

CÁC CỜ:
  --source <thư-mục>        Dùng mã nguồn có sẵn trên đĩa (không cần internet)
  --repo <url>              Địa chỉ git để clone  (mặc định: github.com/anhvt78/hermes_plus.git)
  --ref <nhánh|tag>         Nhánh/tag cần lấy       (mặc định: release = bản phát hành; "main" = kho đầy đủ kiểu cũ)
  --license <tệp>           Cài giấy phép Hermes+ ngay khi cài đặt (xem mục Giấy phép trong README)
  --update-repo <url>       Nơi máy lấy bản cập nhật  (mặc định: git@github.com:anhvt78/hermes_plus.git)
  --install-dir <đường-dẫn> Nơi đặt mã nguồn      (mặc định: /opt/hermes-plus)
  --data-dir <đường-dẫn>    Thư mục dữ liệu Hermes (mặc định: /var/lib/hermes-plus)
  --port <số>               Cổng bảng điều khiển  (mặc định: 9119)
  --profile <tên>           Hồ sơ chính            (mặc định: default)
  --dashboard-user <tên>    Tài khoản đăng nhập    (mặc định: President)
  --env-file <tệp>          Đọc bí mật từ tệp .env (không hỏi)
  --install-deps            Tự cài gói apt còn thiếu  (mặc định: có)
  --no-install-deps         Bỏ qua bước cài gói apt
  --systemd                 Tạo dịch vụ systemd    (mặc định: có)
  --no-systemd              Không tạo dịch vụ systemd
  --non-interactive         Không hỏi, dùng cờ/biến môi trường
  --skip-build              Bỏ qua bước dựng giao diện web
  --dry-run                 In kế hoạch rồi thoát, KHÔNG thay đổi hệ thống
  --upgrade                 Cập nhật mã + phụ thuộc + giao diện + dịch vụ
  --keep-cdrom-source       KHÔNG tự vô hiệu hoá nguồn apt cdrom (mặc định: tự sửa)
  --keep-password           Giữ mật khẩu cũ trong config.yaml, bỏ qua mật khẩu mới truyền vào
  --self-test               Chạy kiểm tra tích hợp (không cần root/mạng, không ghi hệ thống); exit 1 nếu có ca hỏng
  --help                    In trợ giúp này

BIẾN MÔI TRƯỜNG:
  HERMES_PLUS_SOURCE              Thư mục mã nguồn    (= --source)
  HERMES_PLUS_REPO                Địa chỉ git         (= --repo)
  HERMES_PLUS_REF                 Nhánh/tag           (= --ref)
  HERMES_PLUS_INSTALL_DIR         Thư mục cài         (= --install-dir)
  HERMES_PLUS_DATA_DIR            Thư mục dữ liệu     (= --data-dir)
  HERMES_PLUS_PORT                Cổng web            (= --port)
  HERMES_PLUS_PROFILE             Hồ sơ               (= --profile)
  HERMES_PLUS_DASHBOARD_USER      Tên đăng nhập       (= --dashboard-user)
  HERMES_PLUS_ENV_FILE            Tệp bí mật          (= --env-file)
  HERMES_PLUS_INSTALL_DEPS        true/false          (= --[no-]install-deps)
  HERMES_PLUS_SYSTEMD             true/false          (= --[no-]systemd)
  HERMES_PLUS_INTERACTIVE         true/false  (false = --non-interactive)
  HERMES_PLUS_SKIP_BUILD          true/false          (= --skip-build)
  HERMES_PLUS_DRY_RUN             true/false          (= --dry-run)
  HERMES_PLUS_GIT_TOKEN           Token GitHub clone repo riêng tư
  HERMES_PLUS_API_KEY             Khoá API AI (ưu tiên hơn DEEPSEEK_API_KEY)
  DEEPSEEK_API_KEY                Khoá DeepSeek (thay thế)
  TELEGRAM_BOT_TOKEN              Token Telegram Bot  (tuỳ chọn)
  HERMES_PLUS_DASHBOARD_PASSWORD  Mật khẩu bảng điều khiển
  HERMES_POCLIP_3D_KEYS           Khoá bảo vệ API-3D  (tự sinh nếu trống)
  HERMES_PLUS_HC_WAIT             Ngưỡng chờ HC-1 (giây, mặc định 240; máy yếu đặt 600)
  HERMES_PLUS_KEEP_CDROM_SOURCE   true = giữ nguồn cdrom (= --keep-cdrom-source)
  HERMES_PLUS_KEEP_PASSWORD       true = giữ mật khẩu cũ dù người dùng truyền mới (= --keep-password)
  HERMES_PLUS_LICENSE_INSTALL     Tệp giấy phép cần cài   (= --license)
  HERMES_PLUS_UPDATE_REPO         Nơi lấy bản cập nhật    (= --update-repo)
  HERMES_PLUS_UPDATE_BRANCH       Nhánh cập nhật          (mặc định: release)
  HERMES_PLUS_UV_PYTHON_DIR       Thư mục Python dùng chung (mặc định: /opt/uv-python)

VÍ DỤ:
  # Cài từ GitHub (cần token):
  sudo HERMES_PLUS_GIT_TOKEN=ghp_xxx \
       HERMES_PLUS_API_KEY=sk-xxx \
       HERMES_PLUS_DASHBOARD_PASSWORD=MatKhau123 \
       ./deploy/install.sh

  # Cài từ thư mục có sẵn (không cần internet):
  sudo HERMES_PLUS_API_KEY=sk-xxx \
       ./deploy/install.sh --source /media/usb/hermes_plus --no-install-deps

  # Kiểm tra không làm gì thực tế:
  ./deploy/install.sh --dry-run --source /path/to/src \
       --install-dir /tmp/probe/opt --data-dir /tmp/probe/data --port 9219

  # Cập nhật phiên bản:
  sudo ./deploy/install.sh --upgrade

  # Cài không có systemd (chạy thủ công):
  sudo ./deploy/install.sh --source /opt/hermes-plus --port 9120 --no-systemd

GHI CHÚ:
  • Gói apt (Bước 1) KHÔNG bao gồm nodejs/npm của Ubuntu.
    Node.js 22 được cài riêng từ NodeSource (cần internet) ở Bước 4 khi cần.
    Máy đã có Node >=22.22.0 thì bỏ qua bước cài NodeSource.
  • Chạy lại script nhiều lần (idempotent) an toàn — Node.js không bị cài lại
    nếu phiên bản đã đạt yêu cầu.
  • Kiểm tra nhanh bộ cài (không cần root, không cần mạng):
      bash ./deploy/install.sh --self-test
    In [ OK ]/[FAIL] cho từng ca kiểm tra; exit 1 nếu có ca hỏng.

HELP
  exit 0
}

# --------------------------------------------------------------------------
# Phân tích tham số dòng lệnh
# --------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)           SOURCE_DIR="$2";        shift 2 ;;
    --repo)             REPO="$2";              shift 2 ;;
    --ref)              REF="$2";               shift 2 ;;
    --license)          LICENSE_FILE_ARG="$2";  shift 2 ;;
    --update-repo)      UPDATE_REPO="$2";       shift 2 ;;
    --install-dir)      INSTALL_DIR="$2";       shift 2 ;;
    --data-dir)         DATA_DIR="$2";          shift 2 ;;
    --port)             PORT="$2";              shift 2 ;;
    --profile)          PROFILE="$2";           shift 2 ;;
    --dashboard-user)   DASHBOARD_USER="$2";    shift 2 ;;
    --env-file)         ENV_FILE="$2";          shift 2 ;;
    --install-deps)     INSTALL_DEPS="true" ;   shift   ;;
    --no-install-deps)  INSTALL_DEPS="false";   shift   ;;
    --systemd)          USE_SYSTEMD="true";     shift   ;;
    --no-systemd)       USE_SYSTEMD="false";    shift   ;;
    --non-interactive)  INTERACTIVE="false";    shift   ;;
    --skip-build)       SKIP_BUILD="true";      shift   ;;
    --dry-run)          DRY_RUN="true";         shift   ;;
    --upgrade)          UPGRADE_MODE="true";    shift   ;;
    --keep-cdrom-source) KEEP_CDROM_SOURCE="true"; shift ;;
    --keep-password)    KEEP_PASSWORD="true";      shift ;;
    --self-test)        SELF_TEST="true";          shift ;;
    --help|-h)          usage ;;
    *)  die "Tuỳ chọn không nhận ra: '$1'  (dùng --help để xem trợ giúp)" ;;
  esac
done

# Đường dẫn dẫn xuất
HERMES_SRC_DIR="${INSTALL_DIR}/${_HERMES_SRC_SUBDIR}"
VENV_DIR="${HERMES_SRC_DIR}/venv"
VENV_PYTHON="${VENV_DIR}/bin/python"
CONFIG_FILE="${DATA_DIR}/config.yaml"
ENV_DATA_FILE="${DATA_DIR}/.env"

# Bản phát hành (nhánh `release` hoặc thư mục có RELEASE.json) khác kho đầy đủ: cây mã nằm thẳng ở gốc và giao diện đã dựng sẵn
if [[ -n "$SOURCE_DIR" ]]; then
  _is_release_tree "$SOURCE_DIR" && RELEASE_LAYOUT="true"
elif [[ "$REF" == "release" ]]; then
  RELEASE_LAYOUT="true"
fi

# --------------------------------------------------------------------------
# DRY-RUN: in kế hoạch rồi thoát
# --------------------------------------------------------------------------
if [[ "$DRY_RUN" == "true" ]]; then
  cat <<DRYPLAN
${_Y}${_B}══════════ CHẾ ĐỘ DRY-RUN — KHÔNG thay đổi hệ thống ══════════${_N}

Cấu hình sẽ dùng:
  --install-dir  = $INSTALL_DIR
  --data-dir     = $DATA_DIR
  --port         = $PORT
  --profile      = $PROFILE
  --dashboard-user = $DASHBOARD_USER
  --source       = ${SOURCE_DIR:-(sẽ git clone từ $REPO)}
  --skip-build   = $SKIP_BUILD
  --systemd      = $USE_SYSTEMD
  --install-deps = $INSTALL_DEPS

Các bước sẽ thực hiện:
  1. Kiểm tra trước: OS Ubuntu/Debian, quyền root, dung lượng đĩa (≥5 GB),
     kết nối internet (bỏ qua nếu --source), cổng $PORT rảnh.

  2. Vô hiệu hoá nguồn apt cdrom$(if [[ "$KEEP_CDROM_SOURCE" == "true" ]]; then printf ' (BỎ QUA vì --keep-cdrom-source)'; else printf ' (nếu có)'; fi), rồi cài gói apt (nếu --install-deps):
     $_APT_PKGS

  3. Lấy mã nguồn:
$(if [[ "$RELEASE_LAYOUT" == "true" ]]; then
  if [[ -n "$SOURCE_DIR" ]]; then echo "     (bản phát hành) rsync \"$SOURCE_DIR/\" → \"$HERMES_SRC_DIR/\""; else echo "     (bản phát hành) git clone --depth 1 --branch \"$REF\" \"$REPO\" rồi chép vào \"$HERMES_SRC_DIR/\""; fi
  echo "     Giao diện đã dựng sẵn trong bản phát hành → bỏ qua bước dựng giao diện (không cần Node.js)."
  echo "     Phụ thuộc Python: uv pip install -r requirements-release.txt (+ cài mã ở chế độ editable)."
  echo "     Cấu hình cập nhật: \$HERMES_PLUS_UPDATE_REPO=$UPDATE_REPO (nhánh $UPDATE_BRANCH) + tạo khoá truy cập chỉ-đọc cho máy."
  echo "     Giấy phép: tạo tệp yêu cầu giấy phép${LICENSE_FILE_ARG:+; cài giấy phép $LICENSE_FILE_ARG}."
elif [[ -n "$SOURCE_DIR" ]]; then
  echo "     rsync -a --exclude '/hermes-plus-docs-tests/' --exclude '/hermes-agent-main/docs/' --exclude '/hermes-agent-main/tests/' --exclude '/hermes-agent-main/plugins/hermes-poclip/docs/' --exclude '/hermes-agent-main/plugins/hermes-poclip/tests/' \"$SOURCE_DIR/\" \"$INSTALL_DIR/\""
else
  echo "     git clone \"$REPO\" \"$INSTALL_DIR\""
  echo "     git -C \"$INSTALL_DIR\" checkout \"$REF\""
fi)

  4. Thiết lập Python venv: $VENV_DIR
$(if [[ "$RELEASE_LAYOUT" == "true" ]]; then
  echo "     Cài phụ thuộc: uv pip install -r requirements-release.txt  (danh sách đi kèm bản phát hành)"
  echo "                    rồi cài mã ở chế độ editable (--no-deps)"
else
  echo "     Cài phụ thuộc: uv sync --extra all --locked  (ưu tiên)"
  echo "                    hoặc pip install -e '.[all]'  (dự phòng)"
fi)

  5. Dựng giao diện$(if [[ "$RELEASE_LAYOUT" == "true" ]]; then echo " (BỎ QUA vì bản phát hành đã dựng sẵn)"; elif [[ "$SKIP_BUILD" == "true" ]]; then echo " (BỎ QUA vì --skip-build)"; else echo ":"; fi)
$(if [[ "$SKIP_BUILD" != "true" && "$RELEASE_LAYOUT" != "true" ]]; then
  echo "     npm install --workspace web && npm run build -w web"
  echo "     Quét động: plugins/*/dashboard/package.json → npm ci (3 tầng) + node build.mjs"
  echo "     Tự kiểm: xác nhận dist/index.js mỗi plugin; in lỗi + liệt kê cuối nếu thiếu."
fi)

  6. Khởi tạo dữ liệu TRẮNG:
     mkdir -p $DATA_DIR  (quyền 700)
     $CONFIG_FILE        (quyền 600) — scrypt hash từ mật khẩu nhập
     $ENV_DATA_FILE      (quyền 600) — API key, token, 3D keys

  7. Nhận bí mật: API key, Telegram token, mật khẩu bảng điều khiển, khoá 3D.
     Mật khẩu và khoá 3D được TỰ SINH nếu không được cung cấp.

  8. Tạo dịch vụ systemd$(if [[ "$USE_SYSTEMD" == "false" ]]; then echo " (BỎ QUA vì --no-systemd)"; else echo ":"; fi)
$(if [[ "$USE_SYSTEMD" != "false" ]]; then
  echo "     /etc/systemd/system/${_SVC_DASHBOARD}.service"
  echo "     /etc/systemd/system/${_SVC_GATEWAY}.service"
  echo "     /etc/systemd/system/${_SVC_WATCHDOG}.service"
  echo "     /etc/systemd/system/${_SVC_WATCHDOG}.timer"
  echo "     systemctl enable $_SVC_DASHBOARD $_SVC_GATEWAY ${_SVC_WATCHDOG}.timer"
fi)

  9. Health check: GET http://localhost:${PORT}/login → 200
     API check:   GET /api/plugins/hermes-poclip/api/v1/org/tree → 200

 10. In tóm tắt cài đặt.

${_Y}Dry-run hoàn tất — không có gì được thay đổi.${_N}
DRYPLAN
  exit 0
fi

# ==========================================================================
# --self-test: kiểm tra tích hợp thuần tuý (không ghi hệ thống, không cần root)
# ==========================================================================
if [[ "$SELF_TEST" == "true" ]]; then
  _st_pass=0 _st_fail=0
  _st_ok()   { printf '[ OK ]  %s\n' "$*"; (( _st_pass += 1 )); }
  _st_fail() { printf '[FAIL]  %s\n' "$*" >&2; (( _st_fail += 1 )); }

  # ── CA 1–10: matcher cdrom ────────────────────────────────────────────
  _cdrom_expect_match() {
    local _desc="$1" _line="$2"
    if _cdrom_line_matches "$_line"; then
      _st_ok  "cdrom MATCH: $_desc"
    else
      _st_fail "cdrom MATCH thất bại (kỳ vọng: MATCH): $_desc"
    fi
  }
  _cdrom_expect_no_match() {
    local _desc="$1" _line="$2"
    if ! _cdrom_line_matches "$_line"; then
      _st_ok  "cdrom NO-MATCH: $_desc"
    else
      _st_fail "cdrom NO-MATCH thất bại (kỳ vọng: không match): $_desc"
    fi
  }

  _cdrom_expect_match  "deb file:///cdrom chuẩn" \
    'deb [check-date=no] file:///cdrom jammy main restricted'
  _cdrom_expect_match  "deb-src file:///cdrom" \
    'deb-src [check-date=no] file:///cdrom jammy main restricted'
  _cdrom_expect_match  "deb file:/cdrom (1 slash)" \
    'deb [check-date=no] file:/cdrom jammy main restricted'
  _cdrom_expect_match  "deb file:///cdrom/ (trailing slash)" \
    'deb [check-date=no] file:///cdrom/ jammy main restricted'
  _cdrom_expect_match  "deb [trusted=yes] file:///cdrom + comment" \
    'deb [check-date=no,trusted=yes] file:///cdrom jammy main restricted # comment'
  _cdrom_expect_match  "deb cdrom: ISO" \
    'deb cdrom:[Ubuntu-Server 22.04.3 LTS _Jammy Jellyfish_ - Release amd64]/ jammy main restricted'
  _cdrom_expect_match  "deb file:/media/cdrom" \
    'deb file:/media/cdrom jammy main restricted'
  _cdrom_expect_match  "thụt đầu dòng (space)" \
    '   deb [check-date=no] file:///cdrom jammy main restricted'
  _cdrom_expect_match  "thụt đầu dòng (tab)" \
    "$(printf '\tdeb [check-date=no] file:///cdrom jammy main restricted')"
  _cdrom_expect_match  "DEB hoa" \
    'DEB [check-date=no] file:///cdrom jammy main restricted'

  # Ca không match (âm)
  _cdrom_expect_no_match "deb http bình thường" \
    'deb http://archive.ubuntu.com/ubuntu jammy main'
  _cdrom_expect_no_match "dòng đã comment sẵn" \
    '# deb file:///cdrom jammy main'

  # ── CA 11–13: so sánh phiên bản Python ───────────────────────────────
  _py_cmp_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
  }
  if ! _py_cmp_ge "3.10" "3.11"; then
    _st_ok  "python_cmp: 3.10 < 3.11 (lt)"
  else
    _st_fail "python_cmp: 3.10 < 3.11 — sort -V sai"
  fi
  if _py_cmp_ge "3.11" "3.11"; then
    _st_ok  "python_cmp: 3.11 >= 3.11 (ge)"
  else
    _st_fail "python_cmp: 3.11 >= 3.11 — sort -V sai"
  fi
  if _py_cmp_ge "3.12" "3.11"; then
    _st_ok  "python_cmp: 3.12 >= 3.11 (ge)"
  else
    _st_fail "python_cmp: 3.12 >= 3.11 — sort -V sai"
  fi

  # ── CA 14–16: phân loại lỗi pip ──────────────────────────────────────
  _pip_classify_test() {
    local _log="$1"
    if printf '%s' "$_log" | grep -qE \
        'requires a different Python|not in .+<3|does not support the current Python'; then
      # Phân biệt quá mới / quá cũ bằng cách phân tích log
      local _pv _up _pm
      _pv=$(printf '%s' "$_log" | grep -oE 'requires a different Python: [0-9]+\.[0-9]+\.[0-9]+' \
        | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
      _up=$(printf '%s' "$_log" | grep -oE '<[0-9]+\.[0-9]+' | head -1 | sed 's/<//' || true)
      if [[ -n "$_pv" && -n "$_up" ]]; then
        _pm=$(printf '%s' "$_pv" | grep -oE '^[0-9]+\.[0-9]+')
        if printf '%s\n%s\n' "$_up" "$_pm" | sort -V -C; then
          echo "python_too_new"; return
        fi
      fi
      echo "python_old"
    elif printf '%s' "$_log" | grep -qE \
        'Temporary failure in name resolution|Could not resolve host|Connection refused|Network is unreachable|Failed to establish a new connection|Max retries exceeded|Could not find a version that satisfies the requirement'; then
      echo "no_internet"
    else
      echo "other"
    fi
  }
  _r1=$(_pip_classify_test "ERROR: Package 'hermes-agent' requires a different Python: 3.10.12 not in '<3.14,>=3.11'")
  if [[ "$_r1" == "python_old" ]]; then
    _st_ok  "pip classify: Python quá cũ (3.10.12) → python_old"
  else
    _st_fail "pip classify: Python quá cũ (3.10.12) → kỳ vọng python_old, nhận '$_r1'"
  fi
  _r2=$(_pip_classify_test "ERROR: Could not find a version that satisfies the requirement hermes-agent")
  if [[ "$_r2" == "no_internet" ]]; then
    _st_ok  "pip classify: không tìm thấy package → no_internet"
  else
    _st_fail "pip classify: không tìm thấy package → kỳ vọng no_internet, nhận '$_r2'"
  fi
  _r3=$(_pip_classify_test "ERROR: Something else went wrong here")
  if [[ "$_r3" == "other" ]]; then
    _st_ok  "pip classify: lỗi khác → other"
  else
    _st_fail "pip classify: lỗi khác → kỳ vọng other, nhận '$_r3'"
  fi

  # ── CA 17–19: cập nhật password_hash trong config.yaml mẫu ──────────
  _ST_TMP=$(mktemp -d /tmp/hermes_st_XXXXXXXX)

  _st_update_pw_hash() {
    local _cfg="$1" _newhash="$2"
    HP_CONFIG="$_cfg" HP_HASH="$_newhash" \
    python3 - <<'PYEOF'
import os, re
cfg_path = os.environ['HP_CONFIG']
new_hash = os.environ['HP_HASH']
with open(cfg_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
new_lines = []
in_basic_auth = False
pw_hash_replaced = False
pw_hash_insert_after = -1
for i, line in enumerate(lines):
    stripped = line.rstrip('\n')
    if re.match(r'\s*basic_auth\s*:', stripped):
        in_basic_auth = True
        pw_hash_insert_after = i
        new_lines.append(line)
        continue
    if in_basic_auth:
        if re.match(r'\s*password_hash\s*:', stripped):
            indent = re.match(r'(\s*)', stripped).group(1)
            new_lines.append(f"{indent}password_hash: '{new_hash}'\n")
            pw_hash_replaced = True
            in_basic_auth = False
            continue
        if stripped and not stripped.startswith(' ') and not stripped.startswith('\t'):
            in_basic_auth = False
        if re.match(r'\s*password\s*:', stripped) and not re.match(r'\s*password_hash', stripped):
            indent = re.match(r'(\s*)', stripped).group(1)
            new_lines.append(f"{indent}password: ''\n")
            continue
    new_lines.append(line)
if not pw_hash_replaced and pw_hash_insert_after >= 0:
    ba_line = lines[pw_hash_insert_after]
    indent = re.match(r'(\s*)', ba_line).group(1) + '    '
    new_lines.insert(pw_hash_insert_after + 1, f"{indent}password_hash: '{new_hash}'\n")
with open(cfg_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
PYEOF
  }

  # CA 17: config đã có password_hash — đổi được, giữ username/secret
  _ST_CFG="${_ST_TMP}/config.yaml"
  cat > "$_ST_CFG" <<'YAML'
model:
  default: deepseek-chat
agent:
  max_turns: 150
dashboard:
  basic_auth:
    username: chu_tich
    password_hash: 'scrypt$16384$8$1$AAAA$BBBB'
    secret: my-session-secret
gateway:
  enabled: false
YAML
  _ST_NEWHASH='scrypt$16384$8$1$CCCC$DDDD'
  _st_update_pw_hash "$_ST_CFG" "$_ST_NEWHASH"
  _new_in_file=$(grep 'password_hash:' "$_ST_CFG" | head -1 | sed "s/.*password_hash: '//;s/'.*//")
  if [[ "$_new_in_file" == "$_ST_NEWHASH" ]]; then
    _st_ok  "config.yaml update: password_hash đã đổi"
  else
    _st_fail "config.yaml update: password_hash KHÔNG đổi (thực: '$_new_in_file')"
  fi
  _u_ok=$(grep 'username:' "$_ST_CFG" | grep -c 'chu_tich' || true)
  _s_ok=$(grep 'secret:' "$_ST_CFG" | grep -c 'my-session-secret' || true)
  if [[ "$_u_ok" -ge 1 && "$_s_ok" -ge 1 ]]; then
    _st_ok  "config.yaml update: username và secret giữ nguyên"
  else
    _st_fail "config.yaml update: username/secret bị mất (u=$_u_ok s=$_s_ok)"
  fi

  # CA 18: diff để xác nhận chỉ đúng dòng password_hash thay đổi
  _diff_lines=$(diff "$_ST_TMP/config.yaml" /dev/stdin <<'YAML' | grep -c '^[<>]' || true
model:
  default: deepseek-chat
agent:
  max_turns: 150
dashboard:
  basic_auth:
    username: chu_tich
    password_hash: 'scrypt$16384$8$1$CCCC$DDDD'
    secret: my-session-secret
gateway:
  enabled: false
YAML
  )
  if [[ "$_diff_lines" -eq 0 ]]; then
    _st_ok  "config.yaml update: diff = 0 (chỉ đúng dòng password_hash thay đổi)"
  else
    _st_fail "config.yaml update: diff = $_diff_lines dòng (có thay đổi ngoài dự kiến)"
  fi

  # CA 19: config CHƯA có password_hash → chèn được
  _ST_CFG2="${_ST_TMP}/config_no_hash.yaml"
  cat > "$_ST_CFG2" <<'YAML'
dashboard:
  basic_auth:
    username: admin
    secret: test-secret
YAML
  _st_update_pw_hash "$_ST_CFG2" 'scrypt$16384$8$1$XXXX$YYYY'
  if grep -q 'password_hash:' "$_ST_CFG2"; then
    _st_ok  "config.yaml insert: password_hash được chèn khi chưa có"
  else
    _st_fail "config.yaml insert: password_hash KHÔNG được chèn"
  fi

  rm -rf "$_ST_TMP"

  # ── CA 20–23: python_minor_ok với _PY_REQ có cận trên ────────────────
  _st_py_req_saved="${_PY_REQ}"
  _PY_REQ=">=3.11,<3.14"
  _st_rc=0; python_minor_ok "3.10" || _st_rc=$?
  if [[ "$_st_rc" -eq 1 ]]; then
    _st_ok  "python_minor_ok 3.10 với >=3.11,<3.14: quá cũ (rc=1)"
  else
    _st_fail "python_minor_ok 3.10 với >=3.11,<3.14: kỳ vọng rc=1, nhận rc=$_st_rc"
  fi
  _st_rc=0; python_minor_ok "3.11" || _st_rc=$?
  if [[ "$_st_rc" -eq 0 ]]; then
    _st_ok  "python_minor_ok 3.11 với >=3.11,<3.14: hợp lệ (rc=0)"
  else
    _st_fail "python_minor_ok 3.11 với >=3.11,<3.14: kỳ vọng rc=0, nhận rc=$_st_rc"
  fi
  _st_rc=0; python_minor_ok "3.13" || _st_rc=$?
  if [[ "$_st_rc" -eq 0 ]]; then
    _st_ok  "python_minor_ok 3.13 với >=3.11,<3.14: hợp lệ (rc=0)"
  else
    _st_fail "python_minor_ok 3.13 với >=3.11,<3.14: kỳ vọng rc=0, nhận rc=$_st_rc"
  fi
  _st_rc=0; python_minor_ok "3.14" || _st_rc=$?
  if [[ "$_st_rc" -eq 2 ]]; then
    _st_ok  "python_minor_ok 3.14 với >=3.11,<3.14: quá mới (rc=2)"
  else
    _st_fail "python_minor_ok 3.14 với >=3.11,<3.14: kỳ vọng rc=2, nhận rc=$_st_rc"
  fi
  _PY_REQ="$_st_py_req_saved"

  # ── CA 23: _project_python_requires đọc pyproject.toml mẫu ──────────
  _ST_TMP3=$(mktemp -d /tmp/hermes_st3_XXXXXXXX)
  mkdir -p "${_ST_TMP3}/${_HERMES_SRC_SUBDIR}"
  cat > "${_ST_TMP3}/${_HERMES_SRC_SUBDIR}/pyproject.toml" <<'TOML'
[project]
name = "hermes-agent"
requires-python = ">=3.11,<3.14"
TOML
  _st_hsrc_saved="${HERMES_SRC_DIR}"
  HERMES_SRC_DIR="${_ST_TMP3}/${_HERMES_SRC_SUBDIR}"
  _st_req=$(_project_python_requires)
  HERMES_SRC_DIR="$_st_hsrc_saved"
  if [[ "$_st_req" == ">=3.11,<3.14" ]]; then
    _st_ok  "_project_python_requires: đọc đúng '>=3.11,<3.14' từ pyproject.toml"
  else
    _st_fail "_project_python_requires: kỳ vọng '>=3.11,<3.14', nhận '$_st_req'"
  fi
  rm -rf "$_ST_TMP3"

  # ── CA 24: pip classify Python 3.14.7 quá mới → python_too_new ───────
  _r_new=$(_pip_classify_test "ERROR: Package 'hermes-agent' requires a different Python: 3.14.7 not in '<3.14,>=3.11'")
  if [[ "$_r_new" == "python_too_new" ]]; then
    _st_ok  "pip classify: Python quá mới (3.14.7) → python_too_new"
  else
    _st_fail "pip classify: Python quá mới (3.14.7) → kỳ vọng python_too_new, nhận '$_r_new'"
  fi

  # ── CA 25: _report_cdrom_leftovers trên file tạm ─────────────────────
  _ST_APT_TMP=$(mktemp -d /tmp/hermes_apt_st_XXXXXXXX)
  printf 'deb [check-date=no] file:///cdrom jammy main\n' > "${_ST_APT_TMP}/has_cdrom.list"
  printf 'deb http://archive.ubuntu.com/ubuntu jammy main\n' > "${_ST_APT_TMP}/clean.list"
  _st_rpt=$(_report_cdrom_leftovers "${_ST_APT_TMP}/has_cdrom.list" "${_ST_APT_TMP}/clean.list")
  if printf '%s\n' "$_st_rpt" | grep -qF "has_cdrom.list"; then
    _st_ok  "_report_cdrom_leftovers: tìm thấy đúng 1 file có cdrom"
  else
    _st_fail "_report_cdrom_leftovers: không thấy has_cdrom.list trong kết quả"
  fi
  # Xác nhận file sạch không bị báo lỗi
  if printf '%s\n' "$_st_rpt" | grep -qF "clean.list"; then
    _st_fail "_report_cdrom_leftovers: file sạch bị báo nhầm là cdrom"
  else
    _st_ok  "_report_cdrom_leftovers: file sạch không bị báo lỗi"
  fi
  rm -rf "$_ST_APT_TMP"

  # ── INFO: Python hệ thống (không ảnh hưởng kết quả self-test) ────────
  _SYS_PY_VER=$(python3 -c 'import sys;print("%d.%d.%d"%sys.version_info[:3])' 2>/dev/null || echo "?")
  printf '[INFO]  Python hệ thống đang chạy test: %s (không ảnh hưởng kết quả self-test)\n' "$_SYS_PY_VER"

  # ── CA 31: python_minor_ok với _PY_REQ không cận trên ────────────────
  _st_py_req_saved2="${_PY_REQ}"
  _PY_REQ=">=3.11"
  _st_rc=0; python_minor_ok "3.20" || _st_rc=$?
  if [[ "$_st_rc" -eq 0 ]]; then
    _st_ok  "python_minor_ok 3.20 với >=3.11 (không cận trên): hợp lệ (rc=0)"
  else
    _st_fail "python_minor_ok 3.20 với >=3.11 (không cận trên): kỳ vọng rc=0, nhận rc=$_st_rc"
  fi
  _PY_REQ="$_st_py_req_saved2"

  # ── CA 32: _DEFAULT_DASHBOARD_USER mặc định là President ─────────────
  if [[ "$_DEFAULT_DASHBOARD_USER" == "President" ]]; then
    _st_ok  "_DEFAULT_DASHBOARD_USER mặc định là 'President'"
  else
    _st_fail "_DEFAULT_DASHBOARD_USER kỳ vọng 'President', nhận '$_DEFAULT_DASHBOARD_USER'"
  fi

  # ── CA 33–36: _should_preserve_company_name ───────────────────────────
  _st_tmpdir=$(mktemp -d)
  # CA 33: marker user → GIỮ
  _st_f33="${_st_tmpdir}/c33.yaml"
  printf 'company_name: "Cong ty ABC"\ncompany_name_source: "user"\n' > "$_st_f33"
  if _should_preserve_company_name "$_st_f33"; then
    _st_ok  "CA 33 _should_preserve_company_name marker user → GIỮ"
  else
    _st_fail "CA 33 _should_preserve_company_name marker user: kỳ vọng GIỮ (rc=0)"
  fi
  # CA 34: marker seed → KHÔNG giữ
  _st_f34="${_st_tmpdir}/c34.yaml"
  printf 'company_name: "Cong ty ABC"\ncompany_name_source: "seed"\n' > "$_st_f34"
  if ! _should_preserve_company_name "$_st_f34"; then
    _st_ok  "CA 34 _should_preserve_company_name marker seed → KHÔNG giữ"
  else
    _st_fail "CA 34 _should_preserve_company_name marker seed: kỳ vọng KHÔNG giữ (rc!=0)"
  fi
  # CA 35: không marker, tên "Cong ty ABC" → GIỮ  (ca đang hỏng)
  _st_f35="${_st_tmpdir}/c35.yaml"
  printf 'company_name: "Cong ty ABC"\n' > "$_st_f35"
  if _should_preserve_company_name "$_st_f35"; then
    _st_ok  "CA 35 _should_preserve_company_name không marker tên lạ → GIỮ"
  else
    _st_fail "CA 35 _should_preserve_company_name không marker tên lạ: kỳ vọng GIỮ (rc=0)"
  fi
  # CA 36: không marker, tên "Hermes SME Studio" → KHÔNG giữ
  _st_f36="${_st_tmpdir}/c36.yaml"
  printf 'company_name: "Hermes SME Studio"\n' > "$_st_f36"
  if ! _should_preserve_company_name "$_st_f36"; then
    _st_ok  "CA 36 _should_preserve_company_name không marker tên mặc định → KHÔNG giữ"
  else
    _st_fail "CA 36 _should_preserve_company_name không marker tên mặc định: kỳ vọng KHÔNG giữ (rc!=0)"
  fi
  # CA 37: marker user KHÔNG nháy → GIỮ
  _st_f37="${_st_tmpdir}/c37.yaml"
  printf 'company_name: "Cong ty ABC"\ncompany_name_source: user\n' > "$_st_f37"
  if _should_preserve_company_name "$_st_f37"; then
    _st_ok  "CA 37 _should_preserve_company_name marker user (không nháy) → GIỮ"
  else
    _st_fail "CA 37 _should_preserve_company_name marker user (không nháy): kỳ vọng GIỮ (rc=0)"
  fi
  rm -rf "$_st_tmpdir"

  # ── CA 38–41: _is_release_tree ────────────────────────────────────────
  _st_rt=$(mktemp -d)
  mkdir -p "${_st_rt}/rel/hermes_cli" "${_st_rt}/mono/hermes-agent-main" "${_st_rt}/empty"
  printf '{}' > "${_st_rt}/rel/RELEASE.json"
  if _is_release_tree "${_st_rt}/rel"; then _st_ok "CA 38 _is_release_tree: thư mục có RELEASE.json + hermes_cli → bản phát hành"; else _st_fail "CA 38 _is_release_tree: kỳ vọng bản phát hành"; fi
  if ! _is_release_tree "${_st_rt}/mono"; then _st_ok "CA 39 _is_release_tree: kho đầy đủ (hermes-agent-main/) → không phải"; else _st_fail "CA 39 _is_release_tree: kỳ vọng KHÔNG phải"; fi
  if ! _is_release_tree "${_st_rt}/empty"; then _st_ok "CA 40 _is_release_tree: thư mục trống → không phải"; else _st_fail "CA 40 _is_release_tree: kỳ vọng KHÔNG phải"; fi
  if ! _is_release_tree ""; then _st_ok "CA 41 _is_release_tree: chuỗi rỗng → không phải"; else _st_fail "CA 41 _is_release_tree: kỳ vọng KHÔNG phải"; fi
  if [[ "$_DEFAULT_REF" == "release" ]]; then _st_ok "CA 42 nhánh mặc định là 'release'"; else _st_fail "CA 42 nhánh mặc định kỳ vọng 'release', nhận '$_DEFAULT_REF'"; fi

  # ── CA 43–48: mật khẩu bảng điều khiển do người dùng gõ (tối thiểu 10 ký tự, gõ lại hai lần) ──
  _st_rc=0; _check_new_password "abcdefghij" "abcdefghij" || _st_rc=$?
  if [[ "$_st_rc" -eq 0 ]]; then _st_ok "CA 43 mật khẩu đúng 10 ký tự, gõ lại khớp → hợp lệ"; else _st_fail "CA 43 kỳ vọng rc=0, nhận rc=$_st_rc"; fi
  _st_rc=0; _check_new_password "abcdefghi" "abcdefghi" || _st_rc=$?
  if [[ "$_st_rc" -eq 1 ]]; then _st_ok "CA 44 mật khẩu 9 ký tự → quá ngắn (rc=1)"; else _st_fail "CA 44 kỳ vọng rc=1, nhận rc=$_st_rc"; fi
  _st_rc=0; _check_new_password "abcdefghij" "abcdefghik" || _st_rc=$?
  if [[ "$_st_rc" -eq 2 ]]; then _st_ok "CA 45 gõ lại không khớp → rc=2"; else _st_fail "CA 45 kỳ vọng rc=2, nhận rc=$_st_rc"; fi
  _st_rc=0; _check_new_password "" "" || _st_rc=$?
  if [[ "$_st_rc" -eq 1 ]]; then _st_ok "CA 46 mật khẩu rỗng không qua kiểm tra độ dài (rc=1)"; else _st_fail "CA 46 kỳ vọng rc=1, nhận rc=$_st_rc"; fi
  _st_pw_saved="${DASHBOARD_PASSWORD:-}"; DASHBOARD_PASSWORD=""
  # here-string (không dùng pipe) để hàm chạy trong shell hiện tại và gán được DASHBOARD_PASSWORD
  _prompt_dashboard_password >/dev/null 2>&1 <<< $'ngan\nngan\nMatKhauDai123\nMatKhauDai999\nMatKhauDai123\nMatKhauDai123'
  if [[ "$DASHBOARD_PASSWORD" == "MatKhauDai123" ]]; then _st_ok "CA 47 hỏi lại đến khi hợp lệ (ngắn → không khớp → khớp)"; else _st_fail "CA 47 kỳ vọng 'MatKhauDai123', nhận '$DASHBOARD_PASSWORD'"; fi
  DASHBOARD_PASSWORD=""
  _prompt_dashboard_password >/dev/null 2>&1 <<< ''
  if [[ -z "$DASHBOARD_PASSWORD" ]]; then _st_ok "CA 48 Enter để trống → giữ rỗng (bộ cài sẽ tự sinh)"; else _st_fail "CA 48 kỳ vọng rỗng, nhận '$DASHBOARD_PASSWORD'"; fi
  DASHBOARD_PASSWORD="$_st_pw_saved"
  rm -rf "$_st_rt"

  # ── Kết quả ──────────────────────────────────────────────────────────
  printf '\nSelf-test: %d/%d ca [ OK ]  /  %d ca [FAIL]\n' \
    "$_st_pass" "$(( _st_pass + _st_fail ))" "$_st_fail"
  if (( _st_fail > 0 )); then exit 1; else exit 0; fi
fi

# ==========================================================================
# BẮT ĐẦU CÀI ĐẶT THỰC
# ==========================================================================

# Xác định tài khoản chạy dịch vụ (phải biết TRƯỚC Bước 3 để kiểm chứng venv)
if [[ -n "${SUDO_USER:-}" ]] && [[ "$SUDO_USER" != "root" ]]; then
  SERVICE_USER="$SUDO_USER"
else
  SERVICE_USER="root"
fi
log_info "Tài khoản dịch vụ: $SERVICE_USER"

# --------------------------------------------------------------------------
# Bước 0: Kiểm tra trước (preflight)
# --------------------------------------------------------------------------
log_step "Bước 0: Kiểm tra trước (preflight)"

# Kiểm tra quyền root: bắt buộc khi cài apt / tạo systemd / ghi vào thư mục hệ thống
_need_root="false"
[[ "$INSTALL_DEPS" == "true" ]] && _need_root="true"
[[ "$USE_SYSTEMD"  == "true" ]] && _need_root="true"
# Ghi ra thư mục hệ thống (không phải /tmp, /home, ...)
for _sysdir in /opt /usr /var /etc /srv; do
  if [[ "$INSTALL_DIR" == "${_sysdir}/"* ]] || [[ "$DATA_DIR" == "${_sysdir}/"* ]]; then
    _need_root="true"; break
  fi
done

if [[ "$_need_root" == "true" ]] && [[ "$(id -u)" -ne 0 ]]; then
  log_err "Cần quyền root (hoặc sudo) vì:"
  [[ "$INSTALL_DEPS" == "true" ]] && log_info "  • --install-deps: cần apt-get"
  [[ "$USE_SYSTEMD"  == "true" ]] && log_info "  • --systemd: cần ghi /etc/systemd/system/"
  for _sysdir in /opt /usr /var /etc /srv; do
    if [[ "$INSTALL_DIR" == "${_sysdir}/"* ]] || [[ "$DATA_DIR" == "${_sysdir}/"* ]]; then
      log_info "  • --install-dir/--data-dir nằm trong ${_sysdir}/"
    fi
  done
  log_info "Chạy lại với sudo: sudo ${BASH_SOURCE[0]} $*"
  exit 1
fi

if [[ "$(id -u)" -eq 0 ]]; then
  log_ok "Đang chạy bằng root."
else
  log_info "Chạy không phải root — chỉ ghi vào thư mục được phép ($([ -n "$SOURCE_DIR" ] && echo "--source + ")/tmp)."
fi

# Hệ điều hành Ubuntu/Debian
if grep -qiE 'ubuntu|debian' /etc/os-release 2>/dev/null; then
  OS_NAME=$(grep '^NAME=' /etc/os-release | cut -d= -f2 | tr -d '"' || echo "Linux")
  log_ok "Hệ điều hành: $OS_NAME"
else
  log_warn "Không phát hiện Ubuntu/Debian. Script đã được kiểm tra trên Ubuntu 24.04."
fi

# Kiểm tra dung lượng đĩa (≥5 GB)
_check_disk_dir="${INSTALL_DIR%/*}"
[[ -d "$_check_disk_dir" ]] || _check_disk_dir="/"
_avail_kb=$(df -k "$_check_disk_dir" 2>/dev/null | awk 'NR==2{print $4}' || echo 0)
if (( _avail_kb < 5242880 )); then
  log_warn "Dung lượng đĩa còn lại: $(( _avail_kb / 1024 )) MB. Khuyến nghị tối thiểu 5 GB."
  log_warn "Nếu thiếu dung lượng: df -h  →  xóa file thừa hoặc thêm dung lượng."
fi

# Probe internet thực sự — luôn chạy kể cả chế độ --source
if probe_internet; then
  HAS_NET="true"
  log_ok "Kết nối internet: OK (probe pypi.org/astral.sh)"
else
  HAS_NET="false"
  log_info "Không có kết nối internet (probe pypi.org và astral.sh đều thất bại)."
fi

# HAS_INTERNET — dùng cho các nhánh cũ cần biết internet theo ngữ cảnh --source
HAS_INTERNET="false"
if [[ -n "$SOURCE_DIR" ]]; then
  log_info "Chế độ --source: tiếp tục cài mã nguồn từ đĩa (HAS_NET=${HAS_NET})."
  if [[ "$HAS_NET" == "false" ]]; then
    log_warn "Chế độ --source: tiếp tục cài mã nguồn từ đĩa (không có internet)."
  fi
elif [[ "$HAS_NET" == "true" ]]; then
  HAS_INTERNET="true"
else
  log_err "Không có kết nối internet."
  log_info "Giải pháp: dùng --source /đường-dẫn/mã-nguồn để cài offline."
  exit 1
fi

# Kiểm tra cổng
check_port_free "$PORT"
log_ok "Cổng $PORT: rảnh."

# --------------------------------------------------------------------------
# Bước 1: Cài gói hệ thống còn thiếu
# --------------------------------------------------------------------------
log_step "Bước 1: Cài gói hệ thống"

# Dọn nguồn apt cdrom trước mọi lần chạy apt (áp dụng cả cho NodeSource ở Bước 4)
fix_apt_cdrom_sources

if [[ "$INSTALL_DEPS" == "true" ]]; then
  MISSING_PKGS=()
  for _pkg in $_APT_PKGS; do
    dpkg -l "$_pkg" 2>/dev/null | grep -q '^ii' || MISSING_PKGS+=("$_pkg")
  done
  if (( ${#MISSING_PKGS[@]} > 0 )); then
    log_info "Cài gói còn thiếu: ${MISSING_PKGS[*]}"
    _APT_UPD_LOG=$(mktemp /tmp/hermes_apt_upd_XXXXXXXX.log)
    if ! apt-get update -qq >"$_APT_UPD_LOG" 2>&1; then
      log_err "apt-get update THẤT BẠI (đã dọn nguồn cdrom: ${_CDROM_SOURCES_CLEANED})."
      log_err "=== 20 dòng lỗi cuối của apt ==="
      tail -20 "$_APT_UPD_LOG" >&2
      rm -f "$_APT_UPD_LOG"
      log_info "Nguồn cdrom đã được dọn: ${_CDROM_SOURCES_CLEANED}. Quét lại dòng còn sót:"
      _report_cdrom_leftovers
      if [[ "$KEEP_CDROM_SOURCE" == "true" ]]; then
        log_warn "  Lưu ý: --keep-cdrom-source đang bật — bỏ cờ này rồi chạy lại để tự dọn."
      fi
      log_info "Hướng dẫn:"
      log_info "  1. Kiểm tra nguồn apt: sudo nano /etc/apt/sources.list"
      log_info "  2. Nếu máy đã đủ phụ thuộc: thêm cờ --no-install-deps"
      log_info "  3. Cài Node thủ công nếu cần build giao diện:"
      log_info "     curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
      log_info "     sudo apt-get install -y nodejs"
      exit 1
    fi
    rm -f "$_APT_UPD_LOG"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -q "${MISSING_PKGS[@]}"
    log_ok "Đã cài: ${MISSING_PKGS[*]}"
  else
    log_ok "Tất cả gói hệ thống đã có."
  fi
else
  log_info "--no-install-deps: bỏ qua cài gói apt."
  # Kiểm tra tối thiểu
  command -v python3 >/dev/null 2>&1 || die "python3 không tìm thấy. Cài: sudo apt-get install -y python3-venv python3-pip python3-dev"
  command -v git >/dev/null 2>&1 || [[ -n "$SOURCE_DIR" ]] || die "git không tìm thấy. Cài: sudo apt-get install -y git"
fi

# Export UV_PYTHON_INSTALL_DIR trước mọi lệnh uv (Python tải vào thư mục dùng chung)
export UV_PYTHON_INSTALL_DIR="$UV_PYTHON_DIR"
log_info "UV_PYTHON_INSTALL_DIR=${UV_PYTHON_INSTALL_DIR}"

# Cài uv — dùng HAS_NET (không phải HAS_INTERNET, vì --source không probe internet)
UV_BIN=""
if command -v uv >/dev/null 2>&1; then
  UV_BIN="$(command -v uv)"
  log_ok "uv đã có: $UV_BIN"
elif [[ -x "/usr/local/bin/uv" ]]; then
  UV_BIN="/usr/local/bin/uv"
  log_ok "uv đã có: $UV_BIN"
elif [[ "$HAS_NET" == "true" ]]; then
  _uv_install_dir="/usr/local/bin"
  if [[ "$(id -u)" -ne 0 ]]; then
    _uv_install_dir="${HOME}/.local/bin"
    mkdir -p "$_uv_install_dir"
  fi
  log_info "Đang cài uv vào ${_uv_install_dir} ..."
  if curl -LsSf https://astral.sh/uv/install.sh | UV_INSTALL_DIR="$_uv_install_dir" sh 2>&1 | tail -5; then
    if command -v uv >/dev/null 2>&1; then
      UV_BIN="$(command -v uv)"
    elif [[ -x "${_uv_install_dir}/uv" ]]; then
      UV_BIN="${_uv_install_dir}/uv"
      export PATH="${_uv_install_dir}:${PATH}"
    fi
    if [[ -n "$UV_BIN" ]]; then
      log_ok "Đã cài uv: $UV_BIN"
    else
      log_warn "Cài uv không tìm thấy binary sau khi cài. Sẽ dùng pip thay thế."
    fi
  else
    log_warn "Cài uv thất bại. Sẽ dùng pip thay thế."
  fi
else
  log_info "Không có internet và không có uv — sẽ dùng pip thay thế."
fi

# Thử đọc requires-python sớm (nếu source đã có sẵn trước Bước 2)
_PY_REQ=$(_project_python_requires)

# Kiểm tra sớm: Python hệ thống không hợp lệ + không có uv + không có internet → die ngay
_py_die_rc=0
python_minor_ok || _py_die_rc=$?
if [[ "$_py_die_rc" -ne 0 ]] && [[ -z "$UV_BIN" ]] && [[ "$HAS_NET" == "false" ]]; then
  _PY_VER=$(python3 -c 'import sys;print("%d.%d.%d"%sys.version_info[:3])' 2>/dev/null || echo "unknown")
  if [[ "$_py_die_rc" -eq 2 ]]; then
    _hi_bound=$(printf '%s' "${_PY_REQ}" | grep -oE '<[=]?[0-9]+\.[0-9]+' | head -1)
    log_err "Python hệ thống ${_PY_VER} QUÁ MỚI: dự án yêu cầu ${_hi_bound} (dải hợp lệ: ${_PY_REQ})."
    log_err "Không có uv và không có internet nên bộ cài không tự tải được Python phù hợp."
    log_info "Cách xử lý (chọn 1):"
    log_info "  1) Dùng uv để cài Python trong dải: UV_PYTHON_INSTALL_DIR=${UV_PYTHON_DIR} uv python install 3.13"
    log_info "     (hoặc bản khác trong dải ${_PY_REQ})"
    log_info "  2) Cài Python hợp lệ từ deadsnakes PPA rồi chạy lại bộ cài"
  else
    log_err "Python hệ thống ${_PY_VER} QUÁ CŨ: hermes-agent yêu cầu Python >= ${_PY_MIN} (hiện có ${_PY_VER})."
    log_err "Không có uv và không có internet nên bộ cài không tự tải được Python mới."
    log_info "Cách xử lý (chọn 1):"
    log_info "  1) Máy có internet: chạy lại bộ cài (bộ cài sẽ tự cài uv + tải Python >= ${_PY_MIN} vào ${UV_PYTHON_DIR}),"
    log_info "     hoặc: sudo apt-get install -y python3.11 python3.11-venv   (nếu repo có)"
    log_info "  2) Cài offline: trên máy có internet chạy"
    log_info "       UV_PYTHON_INSTALL_DIR=${UV_PYTHON_DIR} uv python install ${_PY_MIN}"
    log_info "     rồi chép cả ${UV_PYTHON_DIR} sang máy này (hoặc dùng --source kèm wheels)"
  fi
  exit 1
fi

# --------------------------------------------------------------------------
# Bước 2: Lấy mã nguồn
# --------------------------------------------------------------------------
log_step "Bước 2: Lấy mã nguồn"

_do_clone() {
  local clone_url="$REPO"
  if [[ -n "$GIT_TOKEN" ]]; then
    clone_url="${REPO/https:\/\//https:\/\/${GIT_TOKEN}@}"
    log_info "Clone repo (token: $(mask_secret "$GIT_TOKEN"))..."
  else
    log_info "Clone repo: $REPO"
  fi

  mkdir -p "$(dirname "$INSTALL_DIR")"
  if ! git clone "$clone_url" "$INSTALL_DIR"; then
    log_err "Clone repo thất bại."
    log_info "Lý do thường gặp:"
    log_info "  1. Repo riêng tư → đặt: export HERMES_PLUS_GIT_TOKEN=ghp_xxx"
    log_info "  2. Không có internet → dùng: --source /đường-dẫn/mã-nguồn"
    log_info "  3. URL sai → kiểm tra: --repo <url>"
    log_info "  4. Tạo deploy key: ssh-keygen -t ed25519 -f ~/.ssh/hermes_deploy"
    exit 1
  fi
}

# Bản phát hành: chép cây mã vào ${INSTALL_DIR}/hermes-agent-main (giữ venv, dữ liệu, tên công ty đã đặt) + chép thư mục deploy/ của bộ cài
_install_release_tree() {
  local _tmp _rel _rid _f _const_yaml _const_bak=""
  _tmp=$(mktemp -d /tmp/hermes_rel_XXXXXXXX)
  if [[ -n "$SOURCE_DIR" ]]; then
    _rel="$SOURCE_DIR"
    log_info "Bản phát hành lấy từ thư mục: $_rel"
  else
    local clone_url="$REPO"
    if [[ -n "$GIT_TOKEN" ]]; then
      clone_url="${REPO/https:\/\//https:\/\/${GIT_TOKEN}@}"
      log_info "Tải nhánh phát hành '$REF' (token: $(mask_secret "$GIT_TOKEN"))..."
    else
      log_info "Tải nhánh phát hành '$REF' từ $REPO ..."
    fi
    if ! git clone --quiet --depth 1 --branch "$REF" "$clone_url" "${_tmp}/rel"; then
      rm -rf "$_tmp"
      log_err "Không tải được nhánh phát hành '$REF'."
      log_info "Lý do thường gặp:"
      log_info "  1. Kho riêng tư → đặt: export HERMES_PLUS_GIT_TOKEN=ghp_xxx   (hoặc dùng --repo git@github.com:... với khoá truy cập SSH)"
      log_info "  2. Không có internet → dùng: --source /đường-dẫn/thư-mục-bản-phát-hành"
      log_info "  3. Tên nhánh sai → kiểm tra: --ref release"
      exit 1
    fi
    _rel="${_tmp}/rel"
  fi
  if ! _is_release_tree "$_rel"; then
    rm -rf "$_tmp"
    die "Thư mục $_rel không phải bản phát hành Hermes+ (thiếu RELEASE.json hoặc hermes_cli/)."
  fi
  _rid=$(grep -o '"release_id": *"[^"]*"' "${_rel}/RELEASE.json" 2>/dev/null | head -1 | cut -d'"' -f4 || true)
  log_info "Bản phát hành: ${_rid:-không rõ}"
  mkdir -p "$HERMES_SRC_DIR"
  # Giữ nguyên tên công ty nếu Chủ tịch đã đặt (QĐ-2)
  _const_yaml="${HERMES_SRC_DIR}/plugins/hermes-poclip/config/constitution.yaml"
  if _should_preserve_company_name "$_const_yaml"; then
    _const_bak=$(mktemp)
    cp "$_const_yaml" "$_const_bak"
    log_info "Giữ nguyên tên công ty do người dùng đã đặt."
  fi
  rsync -a --delete --exclude=venv --exclude=.venv --exclude=node_modules --exclude=.git --exclude=__pycache__ \
        --exclude='*.pyc' --exclude='*.db' --exclude='*.db-shm' --exclude='*.db-wal' --exclude=hermes_agent.egg-info \
        "${_rel}/" "${HERMES_SRC_DIR}/"
  if [[ -n "$_const_bak" ]] && [[ -f "$_const_bak" ]]; then
    mv "$_const_bak" "$_const_yaml"
  fi
  # Thư mục deploy/ (người canh, công cụ kiểm tra) lấy từ chính bộ cài đang chạy
  mkdir -p "${INSTALL_DIR}/deploy"
  if [[ "$_SCRIPT_DIR" != "${INSTALL_DIR}/deploy" ]]; then
    for _f in hermes_plus_watchdog.py hermes-plus-check README-WATCHDOG.md README.md install.sh; do
      if [[ -f "${_SCRIPT_DIR}/${_f}" ]]; then cp -f "${_SCRIPT_DIR}/${_f}" "${INSTALL_DIR}/deploy/${_f}"; fi
    done
  fi
  chmod +x "${INSTALL_DIR}/deploy/install.sh" "${INSTALL_DIR}/deploy/hermes-plus-check" 2>/dev/null || true
  rm -rf "$_tmp"
  log_ok "Bản phát hành đã chép vào ${HERMES_SRC_DIR}."
}

if [[ "$RELEASE_LAYOUT" == "true" ]]; then
  _install_release_tree
  if [[ -f "${HERMES_SRC_DIR}/hermes_cli/web_dist/index.html" ]]; then
    SKIP_BUILD="true"
    log_info "Bản phát hành đã dựng sẵn giao diện — bỏ qua bước dựng (không cần Node.js)."
  else
    log_warn "Bản phát hành thiếu hermes_cli/web_dist — bộ cài sẽ thử dựng giao diện."
  fi

elif [[ "$UPGRADE_MODE" == "true" ]] && [[ -d "${INSTALL_DIR}/.git" ]]; then
  # ── Chế độ --upgrade: cập nhật git repo ──────────────────────────────
  log_info "Chế độ --upgrade: cập nhật mã nguồn..."
  _STASHED="false"
  if [[ -n "$(git -C "$INSTALL_DIR" status --porcelain 2>/dev/null)" ]]; then
    log_info "Phát hiện thay đổi cục bộ → stash trước khi cập nhật..."
    git -C "$INSTALL_DIR" stash push -m "hermes-plus-upgrade-$(date +%Y%m%d_%H%M%S)"
    _STASHED="true"
  fi
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" checkout "$REF" 2>/dev/null || true
  git -C "$INSTALL_DIR" pull --ff-only "origin" "$REF" 2>/dev/null \
    || git -C "$INSTALL_DIR" merge --ff-only "origin/$REF" 2>/dev/null \
    || log_warn "Không thể fast-forward. Kiểm tra xung đột thủ công."
  if [[ "$_STASHED" == "true" ]]; then
    git -C "$INSTALL_DIR" stash pop 2>/dev/null \
      || log_warn "git stash pop thất bại — kiểm tra: git -C '$INSTALL_DIR' stash show"
  fi
  log_ok "Mã nguồn đã cập nhật."

elif [[ -n "$SOURCE_DIR" ]]; then
  # ── Chế độ --source: sao chép từ thư mục có sẵn ─────────────────────
  [[ -d "$SOURCE_DIR" ]] || die "Thư mục --source không tồn tại: $SOURCE_DIR"
  [[ -d "${SOURCE_DIR}/${_HERMES_SRC_SUBDIR}" ]] \
    || die "Không tìm thấy '${_HERMES_SRC_SUBDIR}/' trong $SOURCE_DIR. Kiểm tra --source."
  log_info "Sao chép mã nguồn: $SOURCE_DIR → $INSTALL_DIR ..."
  mkdir -p "$INSTALL_DIR"
  _src_real=$(realpath -m "$SOURCE_DIR" 2>/dev/null || true)
  _dst_real=$(realpath -m "$INSTALL_DIR" 2>/dev/null || true)
  if [[ -n "$_src_real" && "$_src_real" == "$_dst_real" ]]; then
    log_warn "Nguồn trùng thư mục cài đặt ($SOURCE_DIR) — BỎ QUA bước sao chép mã nguồn (chạy lại idempotent)."
  else
    # Giữ nguyên tên công ty nếu người dùng đã đặt (QĐ-2)
    _CONST_YAML="${INSTALL_DIR}/hermes-agent-main/plugins/hermes-poclip/config/constitution.yaml"
    _CONST_BAK=""
    if _should_preserve_company_name "$_CONST_YAML"; then
      _CONST_BAK=$(mktemp)
      cp "$_CONST_YAML" "$_CONST_BAK"
      log_info "Giữ nguyên tên công ty do người dùng đã đặt."
    fi
    # Dùng rsync thay cp -a để loại trừ tài liệu nội bộ và bộ kiểm thử khỏi bản cài khách.
    # --exclude dùng đường dẫn tương đối tính từ SOURCE_DIR (dấu / đầu = neo gốc nguồn).
    rsync -a \
      --exclude '/hermes-plus-docs-tests/' \
      --exclude '/hermes-agent-main/docs/' \
      --exclude '/hermes-agent-main/tests/' \
      --exclude '/hermes-agent-main/plugins/hermes-poclip/docs/' \
      --exclude '/hermes-agent-main/plugins/hermes-poclip/tests/' \
      "${SOURCE_DIR}/" "${INSTALL_DIR}/"
    log_info "Bản cài khách: đã bỏ hermes-plus-docs-tests/, hermes-agent-main/docs/, hermes-agent-main/tests/, plugins/hermes-poclip/{docs,tests}/ (tài liệu nội bộ + bộ kiểm thử)."
    log_ok "Mã nguồn đã sao chép."
    if [[ -n "$_CONST_BAK" ]] && [[ -f "$_CONST_BAK" ]]; then
      mv "$_CONST_BAK" "$_CONST_YAML"
    fi
  fi

else
  # ── Chế độ mặc định: git clone ───────────────────────────────────────
  if [[ -d "$INSTALL_DIR" ]] && [[ -d "${INSTALL_DIR}/${_HERMES_SRC_SUBDIR}" ]]; then
    log_info "Thư mục $INSTALL_DIR đã tồn tại và có ${_HERMES_SRC_SUBDIR}/. Bỏ qua clone."
  else
    _do_clone
    cd "$INSTALL_DIR"
    git checkout "$REF" 2>/dev/null || log_warn "Không thể checkout $REF — dùng nhánh hiện tại."
  fi
fi

[[ -d "$HERMES_SRC_DIR" ]] \
  || die "Không tìm thấy ${HERMES_SRC_DIR}. Kiểm tra --install-dir và cấu trúc repo."
log_ok "Mã nguồn tại: $HERMES_SRC_DIR"

# --------------------------------------------------------------------------
# Bước 3: Python venv + phụ thuộc
# --------------------------------------------------------------------------
log_step "Bước 3: Thiết lập Python venv"

# Dừng dịch vụ trước khi cài lại phụ thuộc (tránh tiến trình cũ chạy trên venv bị thay)
if [[ "$USE_SYSTEMD" == "true" ]] && [[ -f "/etc/systemd/system/${_SVC_DASHBOARD}.service" ]]; then
  log_info "Tạm dừng dịch vụ Hermes+ để cài lại phụ thuộc an toàn (không để tiến trình chạy trên venv bị thay)..."
  systemctl stop "$_SVC_DASHBOARD" "$_SVC_GATEWAY" 2>/dev/null || true
  log_ok "Đã dừng dịch vụ (hoặc dịch vụ chưa chạy)."
fi

# Kiểm tra venv hiện có: nếu python trỏ vào thư mục riêng của root/home → tạo lại
if [[ -d "$VENV_DIR" ]]; then
  _venv_py_real=""
  if [[ -f "$VENV_PYTHON" ]]; then
    _venv_py_real=$(readlink -f "$VENV_PYTHON" 2>/dev/null || true)
  fi
  _venv_needs_rebuild=false
  if [[ -n "$_venv_py_real" ]]; then
    case "$_venv_py_real" in
      /root/.local/*|/root/.cache/*)
        _venv_needs_rebuild=true
        log_warn "venv đang trỏ Python vào thư mục riêng của root: $_venv_py_real"
        log_warn "→ Di chứng cài lỗi cũ — sẽ tạo lại venv để tránh lỗi Permission denied."
        ;;
      /home/*/.local/*|/home/*/.cache/*)
        _venv_needs_rebuild=true
        log_warn "venv đang trỏ Python vào thư mục riêng của user: $_venv_py_real"
        log_warn "→ Di chứng cài lỗi cũ — sẽ tạo lại venv để tránh lỗi Permission denied."
        ;;
    esac
  fi
  if "$_venv_needs_rebuild"; then
    rm -rf "$VENV_DIR"
    log_info "Đã xoá venv cũ. Sẽ tạo lại từ đầu..."
  fi
fi

# Đọc lại requires-python sau khi source đã có (Bước 2 đã chạy xong)
_PY_REQ=$(_project_python_requires)

# Tạo venv nếu chưa có
if [[ ! -d "$VENV_DIR" ]]; then
  log_info "Tạo venv Python tại $VENV_DIR ..."
  if [[ -n "$UV_BIN" ]]; then
    log_info "uv venv theo yêu cầu của dự án: --python '${_PY_REQ}'"
    _py_venv_rc=0
    python_minor_ok || _py_venv_rc=$?
    if [[ "$_py_venv_rc" -eq 0 ]]; then
      log_info "Python hệ thống nằm trong dải ${_PY_REQ} — uv dùng Python hệ thống."
    elif [[ "$_py_venv_rc" -eq 2 ]]; then
      log_info "Python hệ thống QUÁ MỚI so với ${_PY_REQ} — uv sẽ tải Python phù hợp vào ${UV_PYTHON_DIR} ..."
    else
      log_info "Python hệ thống < ${_PY_MIN} — uv sẽ tải CPython vào ${UV_PYTHON_DIR} ..."
    fi
    "$UV_BIN" venv --python "${_PY_REQ}" "$VENV_DIR"
  else
    python3 -m venv "$VENV_DIR"
  fi
  log_ok "venv đã tạo."
fi

# Đảm bảo UV_PYTHON_DIR có quyền đọc cho mọi user (sau khi uv tải Python về)
[[ -d "$UV_PYTHON_DIR" ]] && chmod -R a+rX "$UV_PYTHON_DIR" 2>/dev/null || true

cd "$HERMES_SRC_DIR"
_PY_INSTALLED="false"

# Bản phát hành: cài đúng danh sách thư viện đi kèm (requirements-release.txt) rồi đăng ký mã ở chế độ editable.
# (Với Python 3.11-3.13, pyproject.toml của lõi Hermes mới không khai báo thư viện lõi, nên KHÔNG dùng `pip install -e .[all]`.)
if [[ "$RELEASE_LAYOUT" == "true" ]] && [[ -f "${HERMES_SRC_DIR}/requirements-release.txt" ]]; then
  log_info "Cài phụ thuộc Python theo danh sách của bản phát hành (requirements-release.txt) ..."
  _REL_LOG=$(mktemp /tmp/hermes_relreq_XXXXXXXX.log)
  _REL_OK="false"
  if [[ -n "$UV_BIN" ]]; then
    if "$UV_BIN" pip install --python "$VENV_PYTHON" -r requirements-release.txt >"$_REL_LOG" 2>&1 \
       && "$UV_BIN" pip install --python "$VENV_PYTHON" --no-deps -e . >>"$_REL_LOG" 2>&1; then
      _REL_OK="true"
    fi
  else
    if "${VENV_DIR}/bin/pip" install --upgrade pip -q >"$_REL_LOG" 2>&1 \
       && "${VENV_DIR}/bin/pip" install -r requirements-release.txt >>"$_REL_LOG" 2>&1 \
       && "${VENV_DIR}/bin/pip" install --no-deps -e . >>"$_REL_LOG" 2>&1; then
      _REL_OK="true"
    fi
  fi
  if [[ "$_REL_OK" == "true" ]]; then
    _PY_INSTALLED="true"
    rm -f "$_REL_LOG"
    log_ok "Phụ thuộc Python đã cài (theo bản phát hành)."
  else
    log_err "Cài phụ thuộc Python theo bản phát hành THẤT BẠI — 20 dòng cuối:"
    tail -20 "$_REL_LOG" >&2
    rm -f "$_REL_LOG"
    log_info "Kiểm tra: kết nối internet tới pypi.org; Python trong dải ${_PY_REQ}; chạy lại bộ cài sau khi khắc phục."
    exit 1
  fi
fi

# Thử uv sync --locked (hash-verified, nhanh khi deps đã có)
if [[ "$_PY_INSTALLED" == "false" ]] && [[ -n "$UV_BIN" ]] && [[ -f "${HERMES_SRC_DIR}/uv.lock" ]]; then
  log_info "Cài phụ thuộc Python (uv sync --locked) ..."
  _UV_SYNC_LOG=$(mktemp /tmp/hermes_uv_XXXXXXXX.log)
  if UV_PROJECT_ENVIRONMENT="$VENV_DIR" "$UV_BIN" sync --extra all --locked >"$_UV_SYNC_LOG" 2>&1; then
    _PY_INSTALLED="true"
    rm -f "$_UV_SYNC_LOG"
    log_ok "Phụ thuộc Python đã cài (uv sync --locked)."
  else
    log_warn "uv sync thất bại — 20 dòng cuối:"
    tail -20 "$_UV_SYNC_LOG" >&2
    rm -f "$_UV_SYNC_LOG"
    log_warn "Thử pip thay thế ..."
  fi
fi

# Fallback: pip install với phân loại lỗi đúng
if [[ "$_PY_INSTALLED" == "false" ]]; then
  log_info "Nâng cấp pip ..."
  "${VENV_DIR}/bin/pip" install --upgrade pip -q
  log_info "Cài phụ thuộc Python (pip install -e '[all]') ..."
  _PIP_LOG=$(mktemp /tmp/hermes_pip_XXXXXXXX.log)
  if "${VENV_DIR}/bin/pip" install -e ".[all]" -q >"$_PIP_LOG" 2>&1; then
    _PY_INSTALLED="true"
    rm -f "$_PIP_LOG"
    log_ok "Phụ thuộc Python đã cài (pip)."
  else
    _pip_log_content=$(cat "$_PIP_LOG" 2>/dev/null || true)
    rm -f "$_PIP_LOG"
    _PY_VER_REAL=$(python3 -c 'import sys;print("%d.%d.%d"%sys.version_info[:3])' 2>/dev/null || echo "?")
    if printf '%s' "$_pip_log_content" | grep -qE \
        'requires a different Python|not in .+<3|does not support the current Python'; then
      # Phân biệt quá mới / quá cũ: phân tích log pip để lấy version + cận trên
      _pip_py_ver_log=$(printf '%s' "$_pip_log_content" \
        | grep -oE 'requires a different Python: [0-9]+\.[0-9]+\.[0-9]+' \
        | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
      _pip_upper_log=$(printf '%s' "$_pip_log_content" \
        | grep -oE '<[0-9]+\.[0-9]+' | head -1 | sed 's/<//' || true)
      [[ -z "$_pip_upper_log" ]] && _pip_upper_log=$(printf '%s' "${_PY_REQ}" \
        | grep -oE '<[=]?[0-9]+\.[0-9]+' | head -1 | sed 's/<[=]*//' || true)
      _pip_too_new="false"
      if [[ -n "$_pip_py_ver_log" && -n "$_pip_upper_log" ]]; then
        _pip_py_minor_log=$(printf '%s' "$_pip_py_ver_log" | grep -oE '^[0-9]+\.[0-9]+')
        if printf '%s\n%s\n' "$_pip_upper_log" "$_pip_py_minor_log" | sort -V -C; then
          _pip_too_new="true"
        fi
      fi
      if [[ "$_pip_too_new" == "true" ]]; then
        log_err "Cài pip thất bại vì Python ${_PY_VER_REAL} QUÁ MỚI (yêu cầu <${_pip_upper_log}; dải hợp lệ: ${_PY_REQ}) — KHÔNG phải lỗi internet."
        log_info "Cách xử lý (chọn 1):"
        log_info "  1) Dùng uv: UV_PYTHON_INSTALL_DIR=${UV_PYTHON_DIR} uv python install 3.13"
        log_info "     (hoặc bản khác trong dải ${_PY_REQ})"
        log_info "  2) Chỉ định interpreter khác trong dải hoặc cài từ deadsnakes PPA"
      else
        log_err "Cài pip thất bại vì Python ${_PY_VER_REAL} quá cũ (cần >= ${_PY_MIN}) — KHÔNG phải lỗi internet."
        log_info "Cách xử lý (chọn 1):"
        log_info "  1) Máy có internet: chạy lại bộ cài (bộ cài sẽ tự cài uv + tải Python >= ${_PY_MIN} vào ${UV_PYTHON_DIR}),"
        log_info "     hoặc: sudo apt-get install -y python3.11 python3.11-venv"
        log_info "  2) Cài offline: UV_PYTHON_INSTALL_DIR=${UV_PYTHON_DIR} uv python install ${_PY_MIN}"
      fi
    elif printf '%s' "$_pip_log_content" | grep -qE \
        'Temporary failure in name resolution|Could not resolve host|Connection refused|Network is unreachable|Failed to establish a new connection|Max retries exceeded|Could not find a version that satisfies the requirement' \
      || { [[ "$HAS_NET" == "false" ]] && python_minor_ok; }; then
      log_err "Cài pip thất bại (không có internet)."
      log_info "Chuẩn bị wheel offline (trên máy có internet):"
      log_info "  pip download -e '.[all]' -d /tmp/wheels"
      log_info "  # Sao chép /tmp/wheels sang máy mới, rồi:"
      log_info "  pip install --no-index --find-links=/tmp/wheels -e '.[all]'"
    else
      log_err "Cài pip thất bại. Xem log bên trên."
    fi
    log_err "=== 20 dòng cuối pip ==="
    printf '%s\n' "$_pip_log_content" | tail -20 >&2
    exit 1
  fi
fi

# Đăng ký lại editable install theo đường dẫn mới (quan trọng khi copy venv)
if [[ "$RELEASE_LAYOUT" == "true" ]]; then
  [[ -x "${VENV_DIR}/bin/pip" ]] && "${VENV_DIR}/bin/pip" install --no-deps -e "." -q 2>/dev/null || true
else
  "${VENV_DIR}/bin/pip" install -e "." -q 2>/dev/null || true
fi

# Sau khi cài, đảm bảo UV_PYTHON_DIR có quyền đọc cho mọi user
[[ -d "$UV_PYTHON_DIR" ]] && chmod -R a+rX "$UV_PYTHON_DIR" 2>/dev/null || true

# Smoke test: xác nhận venv thật sự dùng được trước khi khởi động dịch vụ
log_info "Kiểm tra venv (import các gói cốt lõi) ..."
if "$VENV_PYTHON" -c "import anyio, starlette, fastapi, uvicorn, hermes_cli" 2>/dev/null; then
  log_ok "venv OK: import anyio/starlette/fastapi/uvicorn/hermes_cli thành công."
  log_info "Python venv: $("$VENV_PYTHON" --version 2>&1 || true) | thực: $(readlink -f "$VENV_PYTHON" 2>/dev/null || true)"
else
  die "venv KHÔNG dùng được sau khi cài phụ thuộc (import anyio/starlette/fastapi/uvicorn/hermes_cli thất bại) — KHÔNG khởi động dịch vụ với venv hỏng. Xem log phía trên (uv sync) hoặc chạy lại với --skip-build/không --locked."
fi

# Kiểm chứng venv bằng đúng user dịch vụ (bắt buộc — tránh Permission denied ở systemd)
if [[ "$SERVICE_USER" != "root" ]]; then
  _SU_CMD=""
  command -v sudo >/dev/null 2>&1 && _SU_CMD="sudo -u $SERVICE_USER"
  if command -v runuser >/dev/null 2>&1 && [[ -z "$_SU_CMD" ]]; then
    _SU_CMD="runuser -u $SERVICE_USER --"
  fi
  if [[ -n "$_SU_CMD" ]]; then
    log_info "Kiểm chứng venv bằng user dịch vụ: $SERVICE_USER ..."
    _SU_OUT=$($_SU_CMD "$VENV_PYTHON" -c \
      'import sys,anyio,starlette,fastapi,uvicorn,hermes_cli;print(sys.version.split()[0])' 2>&1) || true
    if printf '%s' "$_SU_OUT" | grep -qE '^[0-9]+\.[0-9]'; then
      log_ok "venv chạy được bằng user dịch vụ $SERVICE_USER: Python $_SU_OUT"
      log_info "Python thực: $(readlink -f "$VENV_PYTHON" 2>/dev/null || true)"
    else
      _venv_real=$(readlink -f "$VENV_PYTHON" 2>/dev/null || echo "$VENV_PYTHON")
      log_err "venv KHÔNG chạy được bằng user dịch vụ $SERVICE_USER:"
      log_err "  Lỗi: $_SU_OUT"
      log_err "  Python thực tại: $_venv_real"
      log_err "Cách xử lý:"
      log_err "  a) Chạy lại bộ cài (sẽ tải Python vào ${UV_PYTHON_DIR} dùng chung)"
      log_err "  b) HERMES_PLUS_UV_PYTHON_DIR=<thư-mục-dùng-chung> rồi chạy lại"
      log_err "  c) chmod -R a+rX $_venv_real"
      die "Dừng — venv không dùng được bằng user dịch vụ $SERVICE_USER."
    fi
  else
    log_warn "Không có sudo/runuser — KHÔNG kiểm chứng được quyền của user dịch vụ $SERVICE_USER."
  fi
fi

# --------------------------------------------------------------------------
# Bước 4: Dựng giao diện web
# --------------------------------------------------------------------------
log_step "Bước 4: Dựng giao diện web"

_DASH_TOTAL=0
_DASH_BUILT=0
_DASH_FAILED=()

if [[ "$RELEASE_LAYOUT" == "true" && "$SKIP_BUILD" == "true" ]]; then
  log_ok "Giao diện đã dựng sẵn trong bản phát hành — không cần dựng."
elif [[ "$SKIP_BUILD" == "true" ]]; then
  log_warn "--skip-build: bỏ qua. Giao diện sẽ không hiển thị nếu chưa được build sẵn!"
else
  # ── Kiểm tra phiên bản Node.js / npm ──────────────────────────────────
  _node_ver=$(node --version 2>/dev/null | sed 's/^v//' || echo "0.0.0")
  _npm_ver=$(npm --version 2>/dev/null || echo "0.0.0")

  _need_node_upgrade="false"
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    log_info "node hoặc npm chưa được cài — sẽ cài từ NodeSource."
    _need_node_upgrade="true"
  else
    log_info "Node.js: v${_node_ver}  npm: ${_npm_ver}"
    version_ge "$_node_ver" "22.22.0" || _need_node_upgrade="true"
    npm_version_ok "$_npm_ver"        || _need_node_upgrade="true"
  fi

  if [[ "$_need_node_upgrade" == "true" ]]; then
    log_info "Node.js/npm không đủ phiên bản hoặc chưa được cài (cần node >=22.22.0 từ NodeSource)."
    # HAS_INTERNET="false" khi dùng --source (preflight bỏ qua kiểm tra mạng),
    # nên tự thử kết nối trực tiếp để không bỏ lỡ máy thực sự có internet.
    if [[ "$HAS_INTERNET" == "true" ]] || _probe_node_source; then
      # Dọn trạng thái gói apt bị lỗi (gói rc hoặc broken deps) trước khi thêm repo
      if dpkg -l npm 2>/dev/null | grep -q "^rc" || ! apt-get check -qq 2>/dev/null; then
        log_info "Phát hiện trạng thái gói apt bị lỗi — chạy apt-get -f install để dọn ..."
        DEBIAN_FRONTEND=noninteractive apt-get -f install -y -q
      fi
      log_info "Đang tải script cài NodeSource Node.js 22 ..."
      if curl -fsSL --connect-timeout 15 --max-time 90 \
             https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh; then
        [[ "$KEEP_CDROM_SOURCE" == "true" ]] && \
          log_warn "Lưu ý: --keep-cdrom-source đang bật — nếu nodesource_setup.sh thất bại do nguồn cdrom, hãy bỏ cờ này."
        bash /tmp/nodesource_setup.sh
        rm -f /tmp/nodesource_setup.sh
        if ! DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs; then
          log_warn "apt-get install nodejs thất bại lần 1 — chạy apt-get -f install rồi thử lại ..."
          DEBIAN_FRONTEND=noninteractive apt-get -f install -y -q
          if ! DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs; then
            log_err "Không thể cài nodejs từ NodeSource sau 2 lần thử."
            log_err "  (Đã dọn nguồn cdrom apt: ${_CDROM_SOURCES_CLEANED} | --keep-cdrom-source: ${KEEP_CDROM_SOURCE})"
            log_info "Xử lý thủ công:"
            log_info "  sudo apt-get remove -y nodejs npm   # gỡ gói Debian/Ubuntu nếu còn"
            log_info "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
            log_info "  sudo apt-get install -y nodejs"
            exit 1
          fi
        fi
        _node_ver=$(node --version 2>/dev/null | sed 's/^v//' || echo "0.0.0")
        _npm_ver=$(npm --version 2>/dev/null || echo "0.0.0")
        log_info "Sau cài NodeSource — Node.js: v${_node_ver}  npm: ${_npm_ver}"
        if ! version_ge "$_node_ver" "22.22.0"; then
          log_err "Node.js vẫn chưa đủ phiên bản (v${_node_ver} < 22.22.0) sau khi cài NodeSource."
          log_info "Giải pháp thay thế:"
          log_info "  1. Cài Node 22 thủ công rồi chạy lại script"
          log_info "  2. Dùng bản dist có sẵn: ${BASH_SOURCE[0]} --skip-build"
          exit 1
        fi
        if ! npm_version_ok "$_npm_ver"; then
          log_err "npm ${_npm_ver} không thoả điều kiện (<11.10.0 hoặc >=11.17.0)."
          log_info "Cập nhật npm: npm install -g npm@latest"
          exit 1
        fi
        log_ok "Node.js v${_node_ver} + npm ${_npm_ver}: đạt yêu cầu."
      else
        log_err "Không tải được script NodeSource (lỗi mạng hoặc timeout)."
        log_info "Giải pháp thay thế:"
        log_info "  1. Cài Node 22 thủ công rồi chạy lại script"
        log_info "  2. Dùng bản dist có sẵn: ${BASH_SOURCE[0]} --skip-build"
        exit 1
      fi
    else
      log_err "Node.js/npm không đủ phiên bản hoặc chưa được cài (cần >=22.22.0) và không có internet để cài từ NodeSource."
      log_info "Giải pháp:"
      log_info "  1. Cài Node 22 thủ công trước khi chạy lại script"
      log_info "  2. Dùng --skip-build nếu dist/ đã có sẵn trong mã nguồn"
      exit 1
    fi
  else
    log_ok "Node.js v${_node_ver} + npm ${_npm_ver}: đạt yêu cầu."
  fi

  # ── Dựng giao diện chính (Vite → hermes_cli/web_dist/) ────────────────
  WEB_DIST="${HERMES_SRC_DIR}/hermes_cli/web_dist"
  if [[ ! -f "${WEB_DIST}/index.html" ]]; then
    log_info "Dựng giao diện chính (web/ → hermes_cli/web_dist/) ..."
    cd "$HERMES_SRC_DIR"
    _t0=$(date +%s)
    if ! npm ci --workspace web -q; then
      log_warn "web: npm ci thất bại (package-lock.json lệch hoặc thiếu) — fallback npm install..."
      npm install --workspace web --prefer-offline -q
    fi
    npm run build -w web
    _t1=$(date +%s)
    if [[ ! -f "${WEB_DIST}/index.html" ]]; then
      log_err "Dựng giao diện chính THẤT BẠI — không tìm thấy: ${WEB_DIST}/index.html"
      exit 1
    fi
    _sz=$(du -sh "${WEB_DIST}" 2>/dev/null | cut -f1 || echo "?")
    log_ok "Giao diện chính đã dựng (${_sz}, $(( _t1 - _t0 ))s)."
  else
    log_ok "Giao diện chính đã có (${WEB_DIST}/index.html)."
  fi

  # ── Dựng dashboard mọi plugin (quét động plugins/*/dashboard) ─────────
  while IFS= read -r -d '' _PKG_JSON; do
    _DASH="$(dirname "$_PKG_JSON")"
    _PLUGIN="$(basename "$(dirname "$_DASH")")"
    _DASH_TOTAL=$(( _DASH_TOTAL + 1 ))
    if [[ ! -f "${_DASH}/dist/index.js" ]]; then
      log_info "Dựng plugin dashboard: ${_PLUGIN} ..."
      cd "$_DASH"
      _t0=$(date +%s)
      _INSTALLED="false"
      # Tầng 1: npm ci (ưu tiên — nhanh, hash-verified)
      if npm ci -q; then
        _INSTALLED="true"
      else
        log_warn "${_PLUGIN}: [tầng 1] npm ci thất bại (package-lock.json lệch hoặc thiếu)."
        # Tầng 2: npm install (giữ lock hiện có)
        if npm install --no-audit --prefer-offline -q; then
          _INSTALLED="true"
          log_info "${_PLUGIN}: [tầng 2] npm install OK."
        else
          # Tầng 3: lock sinh trên Windows thiếu entry @esbuild/<linux-x64>
          # → node install.js của esbuild tìm ngược lên thư mục cha, nhặt sai phiên bản.
          log_warn "${_PLUGIN}: [tầng 2] npm install vẫn thất bại."
          log_warn "${_PLUGIN}: package-lock.json có thể KHÔNG đầy đủ cho Linux — thiếu gói nền tảng @esbuild/<nền-tảng>; cài lại KHÔNG dùng lock."
          log_info "${_PLUGIN}: [tầng 3] Xoá package-lock.json + node_modules, cài từ package.json..."
          rm -f package-lock.json
          rm -rf node_modules
          if npm install -q; then
            _INSTALLED="true"
            log_info "${_PLUGIN}: [tầng 3] npm install OK."
          fi
        fi
      fi
      if [[ "$_INSTALLED" == "false" ]]; then
        log_err "${_PLUGIN}: cài phụ thuộc THẤT BẠI sau 3 tầng. Thư mục: ${_DASH}"
        log_err "  Xử lý: cd ${_DASH} && rm -f package-lock.json && rm -rf node_modules && npm install && node build.mjs"
        _DASH_FAILED+=("${_PLUGIN}")
        cd "$HERMES_SRC_DIR"; continue
      fi
      if ! node build.mjs; then
        log_err "${_PLUGIN}: node build.mjs THẤT BẠI. Thư mục: ${_DASH}"
        _DASH_FAILED+=("${_PLUGIN}")
        cd "$HERMES_SRC_DIR"; continue
      fi
      _t1=$(date +%s)
      if [[ ! -f "${_DASH}/dist/index.js" ]]; then
        log_err "Plugin ${_PLUGIN}: dựng xong nhưng THIẾU dist/index.js: ${_DASH}/dist/index.js"
        _DASH_FAILED+=("${_PLUGIN}")
        cd "$HERMES_SRC_DIR"; continue
      fi
      _sz=$(du -sh "${_DASH}/dist" 2>/dev/null | cut -f1 || echo "?")
      log_ok "Plugin ${_PLUGIN}: đã dựng (${_sz}, $(( _t1 - _t0 ))s)."
      _DASH_BUILT=$(( _DASH_BUILT + 1 ))
    else
      log_ok "Plugin ${_PLUGIN}: dist/index.js đã có."
      _DASH_BUILT=$(( _DASH_BUILT + 1 ))
    fi
    cd "$HERMES_SRC_DIR"
  done < <(find "${HERMES_SRC_DIR}/plugins" -mindepth 3 -maxdepth 3 \
             -path "*/dashboard/package.json" -print0 2>/dev/null | sort -z)
  cd "$HERMES_SRC_DIR"

  # Tự kiểm: xác nhận mọi dist/index.js tồn tại
  if (( ${#_DASH_FAILED[@]} > 0 )); then
    log_err "═══ Dashboard build THẤT BẠI: ${#_DASH_FAILED[@]}/${_DASH_TOTAL} plugin ═══"
    for _fp in "${_DASH_FAILED[@]}"; do
      log_err "  [THIẾU] ${HERMES_SRC_DIR}/plugins/${_fp}/dashboard/dist/index.js"
    done
    exit 1
  fi
  log_ok "Bước 4 / Dashboard plugin: ${_DASH_BUILT}/${_DASH_TOTAL} đã dựng thành công."
fi

# SERVICE_USER đã được xác định trước Bước 0 (xem phía trên)

# --------------------------------------------------------------------------
# Bước 5: Nhận bí mật
# --------------------------------------------------------------------------
log_step "Bước 5: Nhận bí mật"

# Đọc từ --env-file nếu có
if [[ -n "$ENV_FILE" ]]; then
  [[ -f "$ENV_FILE" ]] || die "Tệp --env-file không tồn tại: $ENV_FILE"
  log_info "Đọc bí mật từ: $ENV_FILE"
  while IFS= read -r _line || [[ -n "$_line" ]]; do
    [[ "$_line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$_line" ]] && continue
    _key="${_line%%=*}"; _val="${_line#*=}"
    case "$_key" in
      HERMES_PLUS_API_KEY|DEEPSEEK_API_KEY) API_KEY="$_val" ;;
      TELEGRAM_BOT_TOKEN)                   TELEGRAM_TOKEN="$_val" ;;
      HERMES_PLUS_DASHBOARD_PASSWORD)       DASHBOARD_PASSWORD="$_val" ;;
      HERMES_POCLIP_3D_KEYS)               POCLIP_3D_KEYS="$_val" ;;
    esac
  done < "$ENV_FILE"
fi

# Đọc giá trị cũ từ .env đã có (không ghi đè giá trị từ --env-file / biến môi trường)
if [[ -f "$ENV_DATA_FILE" ]]; then
  _renv() { grep -E "^${1}=" "$ENV_DATA_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true; }
  if [[ -z "$API_KEY"        ]]; then API_KEY=$(        _renv DEEPSEEK_API_KEY)      ; fi
  if [[ -z "$TELEGRAM_TOKEN" ]]; then TELEGRAM_TOKEN=$( _renv TELEGRAM_BOT_TOKEN)    ; fi
  if [[ -z "$POCLIP_3D_KEYS" ]]; then POCLIP_3D_KEYS=$( _renv HERMES_POCLIP_3D_KEYS); fi
  [[ -n "$API_KEY" ]] && log_info "DEEPSEEK_API_KEY: đọc từ .env cũ ($(mask_secret "$API_KEY"))." || true
  unset -f _renv
fi

# Hỏi tuần tự khi interactive
if [[ "$INTERACTIVE" == "true" ]] && [[ -z "$API_KEY" ]]; then
  read -rsp "$(printf "${_C}[NHẬP]${_N} Khoá API AI (DEEPSEEK_API_KEY): ")" API_KEY; echo
fi
if [[ "$INTERACTIVE" == "true" ]] && [[ -z "$TELEGRAM_TOKEN" ]]; then
  read -rsp "$(printf "${_C}[NHẬP]${_N} Token Telegram Bot (Enter để bỏ qua): ")" TELEGRAM_TOKEN; echo
fi
if [[ "$INTERACTIVE" == "true" ]] && [[ -z "$DASHBOARD_PASSWORD" ]]; then
  _prompt_dashboard_password
fi

# Cảnh báo thiếu API key
if [[ -z "$API_KEY" ]]; then
  log_warn "Khoá API AI chưa được đặt."
  log_warn "Hermes sẽ KHÔNG hoạt động cho đến khi thêm khoá vào: ${ENV_DATA_FILE}"
fi

# Xác thực khoá API DeepSeek (gọi nhẹ, timeout 10s, KHÔNG in khoá ra màn hình)
if [[ -n "$API_KEY" ]]; then
  log_info "Đang kiểm tra khoá API DeepSeek ($(mask_secret "$API_KEY")) ..."
  _api_http=$(curl -s -o /dev/null -w '%{http_code}' \
    --connect-timeout 10 --max-time 10 \
    -H "Authorization: Bearer ${API_KEY}" \
    "https://api.deepseek.com/v1/models" 2>/dev/null || echo "ERR")
  case "$_api_http" in
    200)
      log_ok "Khoá API hợp lệ (HTTP 200)." ;;
    401|403)
      log_warn "Khoá API có vẻ KHÔNG hợp lệ (nhà cung cấp trả HTTP ${_api_http})."
      log_warn "Cài đặt vẫn hoàn tất nhưng trợ lý AI sẽ không hoạt động — kiểm tra lại DEEPSEEK_API_KEY trong ${ENV_DATA_FILE}." ;;
    *)
      log_info "Không kiểm tra được khoá API (mạng/timeout) — bỏ qua." ;;
  esac
fi

# Đánh dấu mật khẩu có phải do người dùng cung cấp không (kiểm tra trước khi có thể tự sinh)
_PW_FROM_USER="false"
[[ -n "$DASHBOARD_PASSWORD" ]] && _PW_FROM_USER="true"
# Mật khẩu truyền qua biến môi trường/tham số không bị chặn (tránh làm hỏng tự động hoá cũ) nhưng được nhắc nếu ngắn
if [[ "$_PW_FROM_USER" == "true" ]] && [[ "${#DASHBOARD_PASSWORD}" -lt "$_MIN_PASSWORD_LEN" ]]; then
  log_warn "Mật khẩu bảng điều khiển ngắn hơn ${_MIN_PASSWORD_LEN} ký tự — nên đặt lại mật khẩu dài hơn."
fi
# Sẽ được cập nhật thành "true" khi config.yaml được ghi (Bước 6)
_PW_APPLIED_TO_CONFIG="false"

# Tự sinh mật khẩu nếu chưa có
_PASSWORD_GENERATED="false"
if [[ -z "$DASHBOARD_PASSWORD" ]]; then
  DASHBOARD_PASSWORD=$(_gen_pass)
  _PASSWORD_GENERATED="true"
  if [[ -f "$CONFIG_FILE" ]] && [[ "$UPGRADE_MODE" == "false" ]]; then
    log_info "Không truyền mật khẩu và config.yaml đã có hash — giữ nguyên mật khẩu cũ (hash scrypt KHÔNG đọc ngược được)."
  else
    log_info "Mật khẩu bảng điều khiển đã được tự sinh (hiển thị ở cuối)."
  fi
fi

# Tự sinh khoá 3D nếu chưa có
_KEYS_GENERATED="false"
if [[ -z "$POCLIP_3D_KEYS" ]]; then
  POCLIP_3D_KEYS="hp-$(_gen_hex 14)"
  _KEYS_GENERATED="true"
  log_info "Khoá bảo vệ API-3D đã được tự sinh."
fi

# --------------------------------------------------------------------------
# Bước 6: Khởi tạo thư mục dữ liệu + tệp cấu hình
# --------------------------------------------------------------------------
log_step "Bước 6: Khởi tạo dữ liệu"

mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"
mkdir -p "${DATA_DIR}/profiles" "${DATA_DIR}/sessions" \
         "${DATA_DIR}/memories" "${DATA_DIR}/logs"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "$DATA_DIR"
log_ok "Thư mục dữ liệu: $DATA_DIR (quyền 700, chủ: $SERVICE_USER)"

# ── config.yaml ──────────────────────────────────────────────────────────
if [[ -f "$CONFIG_FILE" ]] && [[ "$UPGRADE_MODE" == "false" ]]; then
  # config.yaml đã tồn tại — xem có đổi mật khẩu không
  if [[ "$_PW_FROM_USER" == "true" ]] && [[ "$KEEP_PASSWORD" != "true" ]]; then
    log_info "Cập nhật mật khẩu bảng điều khiển theo mật khẩu bạn truyền vào ..."
    PASS_HASH=$(_hash_password "$DASHBOARD_PASSWORD") \
      || die "Sinh mật khẩu hash thất bại."
    # Dùng python3 stdlib (không dùng PyYAML) để chỉnh CHỈ dòng password_hash
    # dashboard.basic_auth.secret là khoá ký token phiên (HMAC) — giữ nguyên, không liên quan đến mật khẩu
    HP_CONFIG="$CONFIG_FILE" HP_HASH="$PASS_HASH" \
    python3 - <<'PYEOF'
import os, re
cfg_path = os.environ['HP_CONFIG']
new_hash = os.environ['HP_HASH']
with open(cfg_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
new_lines = []
in_basic_auth = False
pw_hash_replaced = False
pw_hash_insert_after = -1
for i, line in enumerate(lines):
    stripped = line.rstrip('\n')
    if re.match(r'\s*basic_auth\s*:', stripped):
        in_basic_auth = True
        pw_hash_insert_after = i
        new_lines.append(line)
        continue
    if in_basic_auth:
        if re.match(r'\s*password_hash\s*:', stripped):
            indent = re.match(r'(\s*)', stripped).group(1)
            new_lines.append(f"{indent}password_hash: '{new_hash}'\n")
            pw_hash_replaced = True
            in_basic_auth = False
            continue
        if stripped and not stripped.startswith(' ') and not stripped.startswith('\t'):
            in_basic_auth = False
        if re.match(r'\s*password\s*:', stripped) and not re.match(r'\s*password_hash', stripped):
            indent = re.match(r'(\s*)', stripped).group(1)
            new_lines.append(f"{indent}password: ''\n")
            continue
    new_lines.append(line)
if not pw_hash_replaced and pw_hash_insert_after >= 0:
    ba_line = lines[pw_hash_insert_after]
    indent = re.match(r'(\s*)', ba_line).group(1) + '    '
    new_lines.insert(pw_hash_insert_after + 1, f"{indent}password_hash: '{new_hash}'\n")
import stat
with open(cfg_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
os.chmod(cfg_path, stat.S_IRUSR | stat.S_IWUSR)
PYEOF
    chown "${SERVICE_USER}:${SERVICE_USER}" "$CONFIG_FILE"
    _PW_APPLIED_TO_CONFIG="true"
    log_ok "Đã ĐẶT LẠI mật khẩu bảng điều khiển theo mật khẩu bạn truyền vào (config.yaml: dòng password_hash)."
  elif [[ "$_PW_FROM_USER" == "true" ]] && [[ "$KEEP_PASSWORD" == "true" ]]; then
    log_warn "--keep-password: giữ mật khẩu cũ; bỏ cờ --keep-password rồi chạy lại với mật khẩu mới nếu muốn đổi."
    log_info "config.yaml đã tồn tại — bảo toàn (không ghi đè mật khẩu)."
  else
    log_info "config.yaml đã tồn tại — bảo toàn (không ghi đè)."
  fi
else
  log_info "Sinh mật khẩu hash (scrypt) ..."
  PASS_HASH=$(_hash_password "$DASHBOARD_PASSWORD") \
    || die "Sinh mật khẩu hash thất bại."
  DASH_SECRET=$(_gen_b64 32)
  _GW_ENABLED="false"
  [[ -n "$TELEGRAM_TOKEN" ]] && _GW_ENABLED="true"

  HP_DATA_DIR="$DATA_DIR" \
  HP_USER="$DASHBOARD_USER" \
  HP_HASH="$PASS_HASH" \
  HP_SECRET="$DASH_SECRET" \
  HP_GW_ENABLED="$_GW_ENABLED" \
  python3 - <<'PYEOF'
import os, stat
d     = os.environ['HP_DATA_DIR']
user  = os.environ['HP_USER']
phash = os.environ['HP_HASH']
sec   = os.environ['HP_SECRET']
gw    = os.environ['HP_GW_ENABLED']

content = (
    "model:\n"
    "  default: deepseek-chat\n"
    "  provider: deepseek\n"
    "agent:\n"
    "  max_turns: 150\n"
    "  verbose: false\n"
    "  reasoning_effort: medium\n"
    "terminal:\n"
    "  backend: local\n"
    "  cwd: .\n"
    "  timeout: 180\n"
    "  home_mode: auto\n"
    "dashboard:\n"
    "  basic_auth:\n"
    f"    username: {user}\n"
    f"    password_hash: '{phash}'\n"
    f"    secret: {sec}\n"
    "gateway:\n"
    f"  enabled: {gw}\n"
    "  platforms:\n"
    "    telegram:\n"
    "      bot_token_env: TELEGRAM_BOT_TOKEN\n"
)
path = os.path.join(d, 'config.yaml')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
PYEOF
  chown "${SERVICE_USER}:${SERVICE_USER}" "$CONFIG_FILE"
  _PW_APPLIED_TO_CONFIG="true"
  log_ok "config.yaml đã tạo tại $CONFIG_FILE (quyền 600)"
fi

# ── .env ─────────────────────────────────────────────────────────────────
if [[ -f "$ENV_DATA_FILE" ]]; then
  log_info ".env đã tồn tại — bảo toàn, chỉ bổ sung khoá còn thiếu ..."
  _ensure_env_key "DEEPSEEK_API_KEY"                      "$API_KEY"
  [[ -n "$TELEGRAM_TOKEN" ]] && _ensure_env_key "TELEGRAM_BOT_TOKEN" "$TELEGRAM_TOKEN" || true
  _ensure_env_key "HERMES_POCLIP_3D_KEYS"                 "$POCLIP_3D_KEYS"
  _ensure_env_key "HERMES_POCLIP_BRIDGE"                  "cli"
  _ensure_env_key "HERMES_POCLIP_ALLOW_REAL_PROVISIONING" "1"
  _ensure_env_key "HERMES_POCLIP_DB_PATH"                 "${DATA_DIR}/poclip.db"
  log_ok ".env: khoá còn thiếu đã bổ sung tại $ENV_DATA_FILE"
else
  {
    printf '# Hermes+ secrets — quyền 600 — KHÔNG đưa lên git\n'
    printf 'DEEPSEEK_API_KEY=%s\n' "$API_KEY"
    [[ -n "$TELEGRAM_TOKEN" ]] && printf 'TELEGRAM_BOT_TOKEN=%s\n' "$TELEGRAM_TOKEN" || true
    printf 'HERMES_POCLIP_3D_KEYS=%s\n' "$POCLIP_3D_KEYS"
    printf 'HERMES_POCLIP_BRIDGE=cli\n'
    printf 'HERMES_POCLIP_ALLOW_REAL_PROVISIONING=1\n'
    printf 'HERMES_POCLIP_DB_PATH=%s/poclip.db\n' "$DATA_DIR"
  } > "$ENV_DATA_FILE"
  chmod 600 "$ENV_DATA_FILE"
  chown "${SERVICE_USER}:${SERVICE_USER}" "$ENV_DATA_FILE"
  log_ok ".env đã tạo tại $ENV_DATA_FILE (quyền 600)"
fi

# ── Cập nhật qua nhánh phát hành (nút «Cập nhật Hermes+» trong bảng điều khiển) ──
_UPDATE_PUBKEY=""
_ensure_env_key "HERMES_PLUS_UPDATE_REPO"   "$UPDATE_REPO"
_ensure_env_key "HERMES_PLUS_UPDATE_BRANCH" "$UPDATE_BRANCH"
if [[ "$UPDATE_REPO" == git@* || "$UPDATE_REPO" == ssh://* ]]; then
  _SVC_HOME=$(getent passwd "$SERVICE_USER" | cut -d: -f6)
  if [[ -n "$_SVC_HOME" && -d "$_SVC_HOME" ]] && command -v ssh-keygen >/dev/null 2>&1; then
    _UPD_KEY="${_SVC_HOME}/.ssh/hermes_plus_update"
    mkdir -p "${_SVC_HOME}/.ssh"
    chmod 700 "${_SVC_HOME}/.ssh"
    if [[ ! -f "$_UPD_KEY" ]]; then
      ssh-keygen -q -t ed25519 -N '' -C "hermes-plus-update@$(hostname)" -f "$_UPD_KEY"
    fi
    chmod 600 "$_UPD_KEY"
    chown -R "${SERVICE_USER}:${SERVICE_USER}" "${_SVC_HOME}/.ssh" 2>/dev/null || true
    _ensure_env_key "HERMES_PLUS_UPDATE_KEY" "$_UPD_KEY"
    _UPDATE_PUBKEY=$(cat "${_UPD_KEY}.pub" 2>/dev/null || true)
    log_ok "Khoá truy cập kho cập nhật: ${_UPD_KEY} (công khai: ${_UPD_KEY}.pub)"
  else
    log_warn "Không tạo được khoá truy cập kho cập nhật (thiếu ssh-keygen hoặc thư mục nhà của $SERVICE_USER). Nút «Cập nhật» sẽ chưa dùng được."
  fi
fi

# Đặt quyền cho toàn bộ install dir
chown -R "${SERVICE_USER}:${SERVICE_USER}" "$INSTALL_DIR" 2>/dev/null || true

# ── Giấy phép: tạo tệp yêu cầu (mã máy) và cài giấy phép nếu có ──
_run_as_svc() {
  if [[ "$SERVICE_USER" != "root" ]] && command -v runuser >/dev/null 2>&1; then
    runuser -u "$SERVICE_USER" -- "$@"
  else
    "$@"
  fi
}
_LIC_REQUEST="${DATA_DIR}/yeu-cau-giay-phep.json"
_LIC_STATE="khong-ro"
if [[ -d "${HERMES_SRC_DIR}/hermes_cli/plus_license" ]]; then
  if _run_as_svc env HERMES_HOME="$DATA_DIR" PYTHONPATH="$HERMES_SRC_DIR" "$VENV_PYTHON" -m hermes_cli.plus_license fingerprint >"$_LIC_REQUEST.tmp" 2>/dev/null; then
    mv -f "$_LIC_REQUEST.tmp" "$_LIC_REQUEST"
    chown "${SERVICE_USER}:${SERVICE_USER}" "$_LIC_REQUEST" 2>/dev/null || true
    log_ok "Tệp yêu cầu giấy phép (mã máy): $_LIC_REQUEST"
    if grep -q '"usable": *false' "$_LIC_REQUEST" 2>/dev/null; then
      log_warn "Máy này KHÔNG đủ thông tin phần cứng để cấp giấy phép (thường gặp trong container Docker/LXC: không có card mạng thật)."
      log_warn "Hãy cài trên máy thật hoặc máy ảo (VMware, VirtualBox, KVM, Proxmox, cloud) có card mạng."
    fi
  else
    rm -f "$_LIC_REQUEST.tmp"
    log_warn "Không tạo được tệp yêu cầu giấy phép — thử lại sau: HERMES_HOME=$DATA_DIR $VENV_PYTHON -m hermes_cli.plus_license fingerprint"
  fi
  if [[ -n "$LICENSE_FILE_ARG" ]]; then
    if [[ ! -f "$LICENSE_FILE_ARG" ]]; then
      log_warn "Không thấy tệp giấy phép: $LICENSE_FILE_ARG — bỏ qua."
    else
      _LIC_TMP=$(mktemp /tmp/hermes_lic_XXXXXXXX.json)
      cp -f "$LICENSE_FILE_ARG" "$_LIC_TMP"
      chmod 644 "$_LIC_TMP"
      if _run_as_svc env HERMES_HOME="$DATA_DIR" PYTHONPATH="$HERMES_SRC_DIR" "$VENV_PYTHON" -m hermes_cli.plus_license install "$_LIC_TMP" >/tmp/hermes_lic_out.log 2>&1; then
        log_ok "Đã cài giấy phép."
      else
        log_warn "Không cài được giấy phép — $(tail -1 /tmp/hermes_lic_out.log 2>/dev/null | sed 's/^Không cài được giấy phép: //')"
      fi
      rm -f "$_LIC_TMP" /tmp/hermes_lic_out.log
    fi
  fi
  _LIC_STATE=$(_run_as_svc env HERMES_HOME="$DATA_DIR" PYTHONPATH="$HERMES_SRC_DIR" "$VENV_PYTHON" -m hermes_cli.plus_license status 2>/dev/null \
    | grep -m1 '"state"' | sed 's/.*"state": *"\([^"]*\)".*/\1/' || true)
  [[ -n "$_LIC_STATE" ]] || _LIC_STATE="khong-ro"
  _LIC_KIND=$(_run_as_svc env HERMES_HOME="$DATA_DIR" PYTHONPATH="$HERMES_SRC_DIR" "$VENV_PYTHON" -m hermes_cli.plus_license status 2>/dev/null \
    | grep -m1 '"kind"' | sed 's/.*"kind": *"\([^"]*\)".*/\1/' || true)
  log_info "Trạng thái giấy phép: $_LIC_STATE${_LIC_KIND:+ (loại: $_LIC_KIND)}"
fi

# --------------------------------------------------------------------------
# Bước 7: Tạo dịch vụ systemd
# --------------------------------------------------------------------------
log_step "Bước 7: Tạo dịch vụ systemd"

if [[ "$USE_SYSTEMD" == "false" ]]; then
  log_info "--no-systemd: bỏ qua. Lệnh chạy thủ công:"
  log_info "  Dashboard:"
  log_info "    HERMES_HOME='${DATA_DIR}' HERMES_POCLIP_DB_PATH='${DATA_DIR}/poclip.db' \\"
  log_info "    '${VENV_PYTHON}' -m hermes_cli.main dashboard --port ${PORT} --host 0.0.0.0 --no-open --skip-build"
  log_info "  Gateway:"
  log_info "    HERMES_HOME='${DATA_DIR}' '${VENV_PYTHON}' -m hermes_cli.main gateway run"
  log_info "  Người canh (thêm vào crontab bằng: crontab -e):"
  log_info "    */2 * * * * HERMES_POCLIP_DB_PATH=${DATA_DIR}/poclip.db HERMES_PLUS_PORT=${PORT} HERMES_PLUS_DATA_DIR=${DATA_DIR} /usr/bin/python3 ${INSTALL_DIR}/deploy/hermes_plus_watchdog.py --once"
  # Tự kiểm nhẹ — lỗi chỉ log_warn, KHÔNG làm hỏng bộ cài
  if /usr/bin/python3 "${INSTALL_DIR}/deploy/hermes_plus_watchdog.py" --self-test >/dev/null 2>&1; then
    log_ok "hermes_plus_watchdog.py --self-test: OK"
  else
    log_warn "hermes_plus_watchdog.py --self-test thất bại — kiểm tra thủ công: /usr/bin/python3 ${INSTALL_DIR}/deploy/hermes_plus_watchdog.py --self-test"
  fi
else
  _SYSTEMD_DIR="/etc/systemd/system"

  cat > "${_SYSTEMD_DIR}/${_SVC_DASHBOARD}.service" <<SVC
[Unit]
Description=Hermes+ Web Dashboard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${DATA_DIR}
EnvironmentFile=${ENV_DATA_FILE}
Environment="HERMES_HOME=${DATA_DIR}"
Environment="HERMES_POCLIP_DB_PATH=${DATA_DIR}/poclip.db"
Environment="VIRTUAL_ENV=${VENV_DIR}"
Environment="PATH=${VENV_DIR}/bin:${HERMES_SRC_DIR}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=${VENV_PYTHON} -m hermes_cli.main dashboard --port ${PORT} --host 0.0.0.0 --no-open --skip-build
# «always» (không phải on-failure): bảng điều khiển chứa TOÀN BỘ vòng giám sát/tự khắc phục/lịch họp/dò số dư nên không được nằm chết sau một lần tắt «sạch» (kill -TERM
# được coi là tắt sạch → on-failure không dựng lại; máy 26 từng nằm chết cả ngày vì vậy). Mã 78 = từ chối cấu hình có chủ đích → không lặp vô hạn (như unit của gateway).
Restart=always
RestartSec=5
RestartPreventExitStatus=78
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVC

  # TimeoutStopSec phải phủ thời gian xả việc khi tắt (cron 30s + dọn 10s + dự phòng 30s = 70s). Để cứng 60 làm cổng nhắn tin cảnh báo
  # «Stale systemd unit» ở MỌI máy cài mới và có thể bị systemd SIGKILL giữa chừng. Lấy đúng công thức của lõi, cộng 20s dư; hỏng thì dùng 90.
  _GW_STOP_SEC="$(cd "${HERMES_SRC_DIR}" 2>/dev/null && "${VENV_PYTHON}" -c 'from gateway.restart import resolve_systemd_timeout_stop_sec as r; print(r(0.0) + 20)' 2>/dev/null || true)"
  [[ "${_GW_STOP_SEC}" =~ ^[0-9]+$ ]] || _GW_STOP_SEC=90

  cat > "${_SYSTEMD_DIR}/${_SVC_GATEWAY}.service" <<SVC
[Unit]
Description=Hermes+ Gateway - Messaging Platform Integration
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${DATA_DIR}
EnvironmentFile=${ENV_DATA_FILE}
Environment="HERMES_HOME=${DATA_DIR}"
Environment="HERMES_POCLIP_DB_PATH=${DATA_DIR}/poclip.db"
Environment="VIRTUAL_ENV=${VENV_DIR}"
Environment="PATH=${VENV_DIR}/bin:${HERMES_SRC_DIR}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=${VENV_PYTHON} -m hermes_cli.main gateway run
Restart=always
RestartSec=5
RestartForceExitStatus=75
RestartPreventExitStatus=78
KillMode=mixed
KillSignal=SIGTERM
ExecReload=/bin/kill -USR1 \$MAINPID
ExecStopPost=-${VENV_PYTHON} -m gateway.cgroup_cleanup
TimeoutStopSec=${_GW_STOP_SEC}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVC

  # Tạo thư mục log/trạng thái cho người canh
  mkdir -p "${DATA_DIR}/logs" "${DATA_DIR}/watchdog"
  chown "${SERVICE_USER}:${SERVICE_USER}" "${DATA_DIR}/logs" "${DATA_DIR}/watchdog"

  # ExecStart dùng /usr/bin/python3 (python HỆ THỐNG, KHÔNG dùng venv của sản phẩm)
  # để khi venv/dashboard hỏng, người canh vẫn sống và báo động được.
  cat > "${_SYSTEMD_DIR}/${_SVC_WATCHDOG}.service" <<SVC
[Unit]
Description=Hermes+ Watchdog — người canh độc lập kiểm tra nhịp tim và sức khoẻ
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=${SERVICE_USER}
WorkingDirectory=${DATA_DIR}
EnvironmentFile=${ENV_DATA_FILE}
Environment="HERMES_POCLIP_DB_PATH=${DATA_DIR}/poclip.db"
Environment="HERMES_PLUS_PORT=${PORT}"
Environment="HERMES_PLUS_DATA_DIR=${DATA_DIR}"
ExecStart=/usr/bin/python3 ${INSTALL_DIR}/deploy/hermes_plus_watchdog.py --once
StandardOutput=journal
StandardError=journal
TimeoutStartSec=120
SVC

  cat > "${_SYSTEMD_DIR}/${_SVC_WATCHDOG}.timer" <<SVC
[Unit]
Description=Hermes+ Watchdog Timer — kích hoạt người canh mỗi 2 phút
Requires=${_SVC_WATCHDOG}.service

[Timer]
OnCalendar=*:0/2
Persistent=true
AccuracySec=5s
RandomizedDelaySec=15
Unit=${_SVC_WATCHDOG}.service

[Install]
WantedBy=timers.target
SVC

  # Gateway chạy dưới dịch vụ HỆ THỐNG nhưng tạo «vùng chạy» cho tiến trình con (nhân viên AI làm việc qua Kanban) bằng `systemd-run --user`;
  # không có phiên người dùng thì việc bị lỗi «systemd-run --user --scope is unavailable». Bật linger để phiên người dùng luôn sẵn sàng (lõi Hermes hướng dẫn đúng lệnh này).
  if [[ "$SERVICE_USER" != "root" ]] && command -v loginctl >/dev/null 2>&1; then
    if loginctl enable-linger "$SERVICE_USER" 2>/dev/null; then
      log_ok "Đã bật linger cho $SERVICE_USER (gateway tạo được vùng chạy cho việc Kanban)"
    else
      log_warn "Không bật được linger cho $SERVICE_USER — hãy chạy: sudo loginctl enable-linger $SERVICE_USER (nếu không, nhân viên AI có thể không chạy được việc Kanban)"
    fi
  fi

  systemctl daemon-reload
  systemctl enable "$_SVC_DASHBOARD" "$_SVC_GATEWAY"
  systemctl restart "$_SVC_DASHBOARD" "$_SVC_GATEWAY"
  log_ok "Dịch vụ đã kích hoạt + KHỞI ĐỘNG LẠI: $_SVC_DASHBOARD và $_SVC_GATEWAY"

  systemctl enable "${_SVC_WATCHDOG}.timer"
  systemctl start "${_SVC_WATCHDOG}.timer"
  log_ok "Người canh đã kích hoạt + KHỞI ĐỘNG: ${_SVC_WATCHDOG}.timer"

  # Tự kiểm nhẹ — lỗi chỉ log_warn, KHÔNG làm hỏng bộ cài
  if /usr/bin/python3 "${INSTALL_DIR}/deploy/hermes_plus_watchdog.py" --self-test >/dev/null 2>&1; then
    log_ok "hermes_plus_watchdog.py --self-test: OK"
  else
    log_warn "hermes_plus_watchdog.py --self-test thất bại — kiểm tra thủ công bằng: /usr/bin/python3 ${INSTALL_DIR}/deploy/hermes_plus_watchdog.py --self-test"
  fi
fi

# --------------------------------------------------------------------------
# Bước 8: Health check (3 bước: login → đăng nhập → API)
# --------------------------------------------------------------------------
log_step "Bước 8: Kiểm tra sức khoẻ"

if [[ "$USE_SYSTEMD" == "false" ]]; then
  log_info "--no-systemd: bỏ qua health check tự động. Kiểm tra thủ công:"
  log_info "  # HC-1 — trang đăng nhập:"
  log_info "  curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT}/login"
  log_info "  # HC-2 — đăng nhập (lưu cookie):"
  log_info "  curl -c /tmp/hc.cookie -s -w '\\n' -X POST \\"
  log_info "    http://localhost:${PORT}/auth/password-login \\"
  log_info "    -H 'Content-Type: application/json' \\"
  log_info "    -d '{\"username\":\"${DASHBOARD_USER}\",\"password\":\"<mật-khẩu>\",\"provider\":\"basic\"}'"
  log_info "  # HC-3 — API org/tree (cần HTTP 200):"
  log_info "  curl -b /tmp/hc.cookie http://localhost:${PORT}/api/plugins/hermes-poclip/api/v1/org/tree"
else
  _BASE="http://localhost:${PORT}"
  _API="${_BASE}/api/plugins/hermes-poclip/api/v1/org/tree"

  # Tệp tạm — xoá khi thoát (kể cả exit 1)
  _HC_COOKIE_JAR=$(mktemp /tmp/hermes_hc_XXXXXXXX.cookie)
  _HC_BODY_TMP=$(mktemp /tmp/hermes_hc_body_XXXXXXXX.tmp)
  _HC_JSON_TMP=""
  _hc_cleanup() { rm -f "${_HC_COOKIE_JAR:-}" "${_HC_BODY_TMP:-}" "${_HC_JSON_TMP:-}" 2>/dev/null || true; }
  trap '_hc_cleanup' EXIT

  # ── HC-1: Chờ /login phản hồi ──────────────────────────────────────────
  _hc1_max="${HC_WAIT}"
  log_info "HC-1: Chờ trang đăng nhập khởi động (tối đa ${_hc1_max} giây)..."
  _hc1_elapsed=0
  _hc1_ok=false
  _hc1_last_tick=0
  while (( _hc1_elapsed < _hc1_max )); do
    _hc1_state=$(systemctl is-active "$_SVC_DASHBOARD" 2>/dev/null || true)
    if [[ "$_hc1_state" == "failed" || "$_hc1_state" == "inactive" ]]; then
      log_err "HC-1 THOÁT SỚM — dịch vụ ${_SVC_DASHBOARD} ở trạng thái: ${_hc1_state} (không chờ tiếp)"
      break
    fi
    _hc1_code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "${_BASE}/login" 2>/dev/null || true)
    [[ "$_hc1_code" == "200" ]] && { _hc1_ok=true; break; }
    sleep 2; (( _hc1_elapsed += 2 ))
    _hc1_tick=$(( _hc1_elapsed / 15 ))
    if (( _hc1_tick > _hc1_last_tick )); then
      _hc1_last_tick=$_hc1_tick
      _hc1_svc_now=$(systemctl is-active "$_SVC_DASHBOARD" 2>/dev/null || echo "unknown")
      log_info "  ... đã chờ ${_hc1_elapsed}s (dịch vụ: ${_hc1_svc_now})"
    fi
  done
  if [[ "$_hc1_ok" != "true" ]]; then
    _hc1_svc_final=$(systemctl is-active "$_SVC_DASHBOARD" 2>/dev/null || echo "unknown")
    if [[ "$_hc1_svc_final" == "failed" || "$_hc1_svc_final" == "inactive" ]]; then
      log_err "HC-1 THẤT BẠI — dịch vụ ${_SVC_DASHBOARD} đã chết (trạng thái: ${_hc1_svc_final})"
    else
      log_err "HC-1 THẤT BẠI — dịch vụ không phản hồi sau ${_hc1_max} giây tại ${_BASE}/login"
      log_err "(Tăng ngưỡng chờ: HERMES_PLUS_HC_WAIT=600 sudo ./deploy/install.sh ...)"
    fi
    log_err "Chẩn đoán — journal ${_SVC_DASHBOARD} (80 dòng cuối):"
    journalctl -u "$_SVC_DASHBOARD" --no-pager -n 80 2>/dev/null || true
    log_info "Hướng dẫn: systemctl status ${_SVC_DASHBOARD} ; journalctl -u ${_SVC_DASHBOARD} -f"
    exit 1
  fi
  _HC_CODE1=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "${_BASE}/login" 2>/dev/null || echo "000")
  log_ok "  HC-1 GET /login → HTTP ${_HC_CODE1}"

  # ── HC-1b: Kiểm tra tệp tĩnh (bắt lỗi "UI trắng do venv bị thay") ────────
  _WEB_DIST_IDX="${HERMES_SRC_DIR}/hermes_cli/web_dist/index.html"
  if [[ -f "$_WEB_DIST_IDX" ]]; then
    _HC1B_ASSET=$(grep -oE 'assets/[A-Za-z0-9._-]+\.js' "$_WEB_DIST_IDX" 2>/dev/null | head -1 || true)
    if [[ -n "$_HC1B_ASSET" ]]; then
      # curl rc=18 (partial transfer) vẫn in "0" qua -w rồi || echo "0" nối thêm => "00";
      # giá trị lạ/rỗng làm [[ -gt 0 ]] nổ lỗi số học dưới set -e.
      _HC1B_DISK_SIZE=$(stat -c %s "${HERMES_SRC_DIR}/hermes_cli/web_dist/${_HC1B_ASSET}" 2>/dev/null || true)
      case "$_HC1B_DISK_SIZE" in ''|*[!0-9]*) _HC1B_DISK_SIZE=0 ;; esac
      _HC1B_FETCH_SIZE=$(curl -s -o /dev/null -w '%{size_download}' \
        --connect-timeout 10 "${_BASE}/${_HC1B_ASSET}" 2>/dev/null || true)
      case "$_HC1B_FETCH_SIZE" in ''|*[!0-9]*) _HC1B_FETCH_SIZE=0 ;; esac
      if [[ "$_HC1B_FETCH_SIZE" -gt 0 && "$_HC1B_FETCH_SIZE" == "$_HC1B_DISK_SIZE" ]]; then
        log_ok "  HC-1b GET /${_HC1B_ASSET} -> ${_HC1B_FETCH_SIZE} byte (khớp đĩa)"
      else
        log_err "  HC-1b GET /${_HC1B_ASSET}: nhận ${_HC1B_FETCH_SIZE} byte, đĩa ${_HC1B_DISK_SIZE} byte — tiến trình dashboard có thể đang chạy trên venv đã bị thay."
        log_err "  Khắc phục: systemctl restart ${_SVC_DASHBOARD}"
        exit 1
      fi
    else
      log_warn "HC-1b bỏ qua — không xác định được tệp tĩnh để kiểm tra."
    fi
  else
    log_warn "HC-1b bỏ qua — không xác định được tệp tĩnh để kiểm tra."
  fi

  # ── HC-2: Đăng nhập, lấy cookie (mật khẩu qua env — không phơi trên CLI) ─
  _HC_CODE2="skip"
  _HC_RESP2=""
  if [[ "$_PW_APPLIED_TO_CONFIG" == "true" ]]; then
    # Mật khẩu vừa được ghi vào config.yaml — thử đăng nhập bình thường
    _HC_JSON_TMP=$(mktemp /tmp/hermes_hc_json_XXXXXXXX.tmp)
    HERMES_HC_USER="$DASHBOARD_USER" HERMES_HC_PW="$DASHBOARD_PASSWORD" \
      python3 -c "
import os, json, sys
sys.stdout.write(json.dumps({'username': os.environ['HERMES_HC_USER'],
  'password': os.environ['HERMES_HC_PW'], 'provider': 'basic'}))" \
      > "$_HC_JSON_TMP" 2>/dev/null
    _HC_CODE2=$(curl -s -c "$_HC_COOKIE_JAR" \
      -o "$_HC_BODY_TMP" -w '%{http_code}' \
      -X POST "${_BASE}/auth/password-login" \
      -H 'Content-Type: application/json' \
      --data "@${_HC_JSON_TMP}" \
      --connect-timeout 10 2>/dev/null || echo "000")
    rm -f "$_HC_JSON_TMP"; _HC_JSON_TMP=""
    _HC_RESP2=$(head -c 200 "$_HC_BODY_TMP" 2>/dev/null | tr -cd '[:print:]' || true)
    log_ok "  HC-2 POST /auth/password-login → HTTP ${_HC_CODE2}  ${_HC_RESP2}"
  elif [[ "$_PASSWORD_GENERATED" == "true" ]]; then
    # Mật khẩu tự sinh nhưng config.yaml đã tồn tại — không biết mật khẩu đúng
    log_warn "HC-2 bỏ qua — không có mật khẩu trong tay: config.yaml chỉ lưu HASH scrypt, KHÔNG đọc ngược được."
    log_info "Muốn đặt/đổi mật khẩu: chạy lại bộ cài với HERMES_PLUS_DASHBOARD_PASSWORD=<mật khẩu mới>."
  elif [[ "$_PW_FROM_USER" == "true" ]]; then
    # Mật khẩu do người dùng nhập nhưng config.yaml đã tồn tại — thử nhưng không lỗi nếu sai
    _HC_JSON_TMP=$(mktemp /tmp/hermes_hc_json_XXXXXXXX.tmp)
    HERMES_HC_USER="$DASHBOARD_USER" HERMES_HC_PW="$DASHBOARD_PASSWORD" \
      python3 -c "
import os, json, sys
sys.stdout.write(json.dumps({'username': os.environ['HERMES_HC_USER'],
  'password': os.environ['HERMES_HC_PW'], 'provider': 'basic'}))" \
      > "$_HC_JSON_TMP" 2>/dev/null
    _HC_CODE2=$(curl -s -c "$_HC_COOKIE_JAR" \
      -o "$_HC_BODY_TMP" -w '%{http_code}' \
      -X POST "${_BASE}/auth/password-login" \
      -H 'Content-Type: application/json' \
      --data "@${_HC_JSON_TMP}" \
      --connect-timeout 10 2>/dev/null || echo "000")
    rm -f "$_HC_JSON_TMP"; _HC_JSON_TMP=""
    _HC_RESP2=$(head -c 200 "$_HC_BODY_TMP" 2>/dev/null | tr -cd '[:print:]' || true)
    if [[ "$_HC_CODE2" == "200" ]]; then
      log_ok "  HC-2 POST /auth/password-login → HTTP ${_HC_CODE2}  ${_HC_RESP2}"
    else
      log_warn "HC-2 bỏ qua — mật khẩu nhập không khớp hash trong config.yaml (config.yaml chỉ lưu HASH scrypt, KHÔNG đọc ngược — không phải lỗi cài đặt). Muốn đổi mật khẩu: chạy lại với HERMES_PLUS_DASHBOARD_PASSWORD=<mật khẩu mới>."
      _HC_CODE2="skip"
    fi
  else
    log_warn "  HC-2 bỏ qua — HERMES_PLUS_DASHBOARD_PASSWORD không có trong bộ nhớ."
    log_info "  Đặt biến đó rồi chạy lại nếu cần kiểm tra API."
  fi

  # ── HC-2b (fallback): trích __HERMES_SESSION_TOKEN__ từ HTML /login ────
  _HC_SESSION_TOKEN=""
  if [[ "$_HC_CODE2" != "200" ]] && [[ "$_HC_CODE2" != "skip" ]]; then
    log_warn "  HC-2 thất bại (HTTP ${_HC_CODE2}) — thử trích __HERMES_SESSION_TOKEN__ từ HTML /login ..."
    _HC_HTML=$(curl -s --connect-timeout 5 "${_BASE}/login" 2>/dev/null || true)
    # grep không khớp trả rc=1, `pipefail` + ERR trap sẽ giết script -> phải bọc `|| true`
    _HC_SESSION_TOKEN=$( { printf '%s' "$_HC_HTML" \
      | grep -oE '__HERMES_SESSION_TOKEN__[[:space:]]*=[[:space:]]*["\x27][^"\x27]+' \
      | head -1 | sed "s/.*['\"]//" ; } 2>/dev/null || true )
    if [[ -n "$_HC_SESSION_TOKEN" ]]; then
      log_info "  HC-2b: token tìm thấy ($(mask_secret "$_HC_SESSION_TOKEN"))"
    else
      log_warn "  HC-2b: không tìm thấy __HERMES_SESSION_TOKEN__ trong HTML."
    fi
  fi

  # ── HC-3: GET API org/tree → phải là HTTP 200 ───────────────────────────
  _HC_CODE3="skip"
  if [[ "$_HC_CODE2" == "200" ]]; then
    _HC_CODE3=$(curl -s -b "$_HC_COOKIE_JAR" \
      -o "$_HC_BODY_TMP" -w '%{http_code}' \
      "${_API}" --connect-timeout 15 2>/dev/null || echo "000")
  elif [[ -n "$_HC_SESSION_TOKEN" ]]; then
    _HC_CODE3=$(curl -s \
      -H "X-Hermes-Session-Token: ${_HC_SESSION_TOKEN}" \
      -o "$_HC_BODY_TMP" -w '%{http_code}' \
      "${_API}" --connect-timeout 15 2>/dev/null || echo "000")
  else
    log_warn "  HC-3 bỏ qua — không có thông tin xác thực để kiểm tra API."
    log_info "  Tự kiểm: chạy HC-2 thủ công rồi: curl -b /tmp/hc.cookie ${_API}"
  fi

  if [[ "$_HC_CODE3" == "200" ]]; then
    _HC_BODY3=$(head -c 200 "$_HC_BODY_TMP" 2>/dev/null | tr -cd '[:print:]' || true)
    log_ok "  HC-3 GET /api/.../org/tree → HTTP ${_HC_CODE3}  ${_HC_BODY3}"
  elif [[ "$_HC_CODE3" != "skip" ]]; then
    _HC_BODY3=$(head -c 200 "$_HC_BODY_TMP" 2>/dev/null | tr -cd '[:print:]' || true)
    log_err "  HC-3 GET /api/.../org/tree → HTTP ${_HC_CODE3}  ${_HC_BODY3}"
    log_err "API org/tree KHÔNG trả 200 — cài đặt CÓ VẤN ĐỀ."
    log_err "Chẩn đoán — journal ${_SVC_DASHBOARD} (80 dòng cuối):"
    journalctl -u "$_SVC_DASHBOARD" --no-pager -n 80 2>/dev/null || true
    log_info "Hướng dẫn: journalctl -u ${_SVC_DASHBOARD} -f"
    exit 1
  fi
fi

# --------------------------------------------------------------------------
# Bước 9: Tóm tắt
# --------------------------------------------------------------------------
log_step "Tóm tắt cài đặt"

printf '\n%s%s══════════════════════════════════════════════════════%s\n' "$_G" "$_B" "$_N"
printf '%s%s  Hermes+ đã cài đặt thành công!%s\n' "$_G" "$_B" "$_N"
printf '%s%s══════════════════════════════════════════════════════%s\n\n' "$_G" "$_B" "$_N"

if [[ "$SKIP_BUILD" == "true" ]]; then
  printf '  Dashboard plugin          : (giao diện đã dựng sẵn / bỏ qua dựng)\n'
else
  printf '  Dashboard plugin đã dựng  : %d/%d\n' "$_DASH_BUILT" "$_DASH_TOTAL"
fi
printf '  Thư mục mã nguồn   : %s\n' "$INSTALL_DIR"
printf '  Thư mục dữ liệu    : %s\n' "$DATA_DIR"
printf '  Tệp cấu hình       : %s\n' "$CONFIG_FILE"
printf '  Tệp bí mật         : %s\n' "$ENV_DATA_FILE"
printf '  Cổng web           : %s\n' "$PORT"
printf '  Bảng điều khiển    : http://localhost:%s\n' "$PORT"
printf '  Tài khoản          : %s\n' "$DASHBOARD_USER"

if [[ "$_PW_APPLIED_TO_CONFIG" == "true" ]] && [[ "$_PASSWORD_GENERATED" == "true" ]]; then
  printf "  %sMật khẩu (tự sinh)%s : %s%s%s  ← Lưu lại ngay!\n" \
    "$_Y" "$_N" "$_B" "$DASHBOARD_PASSWORD" "$_N"
elif [[ "$_PW_APPLIED_TO_CONFIG" == "true" ]]; then
  printf '  Mật khẩu           : (đã đặt)\n'
else
  printf '  Mật khẩu           : (KHÔNG đọc ngược được — config.yaml chỉ lưu hash scrypt). Đổi mật khẩu: chạy lại với HERMES_PLUS_DASHBOARD_PASSWORD=<mật khẩu mới>.\n'
fi

if [[ "$_KEYS_GENERATED" == "true" ]]; then
  printf '  Khoá API-3D         : %s  ← Dùng header X-3D-Key khi gọi API\n' "$POCLIP_3D_KEYS"
fi

if [[ "$USE_SYSTEMD" == "true" ]]; then
  cat <<SVC_INFO

Quản lý dịch vụ:
  Trạng thái  : systemctl status ${_SVC_DASHBOARD} ${_SVC_GATEWAY}
  Xem log     : journalctl -u ${_SVC_DASHBOARD} -f
  Dừng        : systemctl stop ${_SVC_DASHBOARD} ${_SVC_GATEWAY}
  Khởi động   : systemctl start ${_SVC_DASHBOARD} ${_SVC_GATEWAY}
  Tắt tự khởi : systemctl disable ${_SVC_DASHBOARD} ${_SVC_GATEWAY}
  Người canh  : systemctl list-timers ${_SVC_WATCHDOG}.timer
  Log canh    : journalctl -u ${_SVC_WATCHDOG} --since "30 min ago"
SVC_INFO
fi

cat <<NEXT

Bước tiếp theo:
  1. Mở trình duyệt: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):${PORT}
  2. Đăng nhập: ${DASHBOARD_USER} / <mật-khẩu-ở-trên>
  3. Kiểm tra khu vực Công ty / Phòng họp / Chính sách

Đổi mật khẩu  : HERMES_PLUS_DASHBOARD_PASSWORD=<mật-khẩu-mới> sudo ${BASH_SOURCE[0]} [--source ... | --upgrade]
Đổi API key   : chỉnh DEEPSEEK_API_KEY trong ${ENV_DATA_FILE}

NEXT

# ── Giấy phép ──
printf '%sGiấy phép%s\n' "$_B" "$_N"
case "$_LIC_STATE" in
  valid|grace)
    if [[ "${_LIC_KIND:-}" == "trial" ]]; then
      printf '  Máy đang chạy bản DÙNG THỬ 365 ngày (tính từ lần khởi động đầu tiên), chưa cần giấy phép.\n'
      printf '  Hết hạn dùng thử cần xin giấy phép (gửi tệp mã máy: %s).\n' "${_LIC_REQUEST:-}"
      printf '  Bản dùng thử và giấy phép có thời hạn KHÔNG chuyển được công ty sang máy khác; chỉ giấy phép không hết hạn mới được chuyển.\n\n'
    else
      printf '  Trạng thái: %s — máy này đã có giấy phép hợp lệ.\n\n' "$_LIC_STATE"
    fi ;;
  disabled)
    printf '  Bản này chưa bật kiểm tra giấy phép.\n\n' ;;
  *)
    printf '  %sMáy CHƯA có giấy phép hợp lệ (trạng thái: %s) → hệ thống chỉ XEM được, chưa ghi được dữ liệu.%s\n' "$_Y" "$_LIC_STATE" "$_N"
    cat <<LIC_HELP
  Cách có giấy phép:
    1) Gửi tệp mã máy này cho nhà cung cấp:  ${_LIC_REQUEST}
       (hoặc mở bảng điều khiển → Tình trạng hệ thống → Giấy phép → «Tải tệp yêu cầu»)
    2) Nhận lại tệp giấy phép rồi cài MỘT trong hai cách:
       • Bảng điều khiển → Tình trạng hệ thống → Giấy phép → dán nội dung → «Cài giấy phép»
       • Dòng lệnh:  sudo -u ${SERVICE_USER} env HERMES_HOME=${DATA_DIR} ${VENV_PYTHON} -m hermes_cli.plus_license install /đường/dẫn/license.json

LIC_HELP
    ;;
esac

# ── Cập nhật phiên bản ──
printf '%sCập nhật phiên bản%s\n' "$_B" "$_N"
if [[ -n "$_UPDATE_PUBKEY" ]]; then
  cat <<UPD_HELP
  Máy cập nhật bằng nút «Cập nhật Hermes+» (Bảng điều khiển → menu hệ thống) từ nhánh '${UPDATE_BRANCH}' của ${UPDATE_REPO}.
  Để nút hoạt động, thêm khoá công khai SAU vào kho (GitHub → Settings → Deploy keys → Add deploy key, chỉ đọc):

  ${_UPDATE_PUBKEY}

UPD_HELP
else
  printf '  Máy cập nhật bằng nút «Cập nhật Hermes+» từ nhánh %s của %s.\n\n' "$UPDATE_BRANCH" "$UPDATE_REPO"
fi
