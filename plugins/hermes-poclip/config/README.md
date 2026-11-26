# Kiến trúc 2 Lớp Tài liệu — Hermes+ (Khung mở cho Công ty Một Người vận hành bằng AI Agent)

[BỔ SUNG] Gói này lấp khoảng trống đã phát hiện khi đối chiếu bộ tài liệu thiết kế Hermes-Poclip với gói cấu hình tham khảo `agent-config-package.zip`: 4 file thiết kế hiện có là **thuần văn xuôi**, đủ cho người đọc nhưng KHÔNG đủ chuẩn hoá để Agent thực thi tự động đáng tin cậy. Gói `config/` này bổ sung lớp máy đọc được, đồng thời **tổng quát hoá kiến trúc để áp dụng cho nhiều loại hình công ty**, không riêng mẫu e-commerce/SaaS ban đầu.

```
.
├── docs/                                   ← LỚP NGƯỜI (4 file .md hiện tại)
│   ├── tai-lieu-tich-hop.md                (có D0-D8, ADR-01/03, phụ lục V01-V05)
│   ├── phan-f-co-che-giao-tiep.md
│   ├── phan-g-camnang.md                   (có G.4.5.5 Chẩn đoán Cơ cấu Tổ chức)
│   └── phan-h-anhxa-openclaw.md
│
└── config/                                 ← LỚP AGENT: machine-readable, có schema validate được
    ├── constitution.yaml                   ← Sứ mệnh/Giá trị cốt lõi + priority_order_on_conflict + interface_language (vi-VN mặc định) + configurable_parameters
    ├── delegation-matrix.json              ← Ma trận risk_tier T0-T3
    │
    ├── agents/                             ← Role Card machine-readable
    │   ├── ceo-agent.json                  (CORE — mọi công ty; sáu nhân viên khung bắt buộc: CEO, Nhân sự, Đào tạo, Tuân thủ, Kiểm toán, Vận hành)
    │   ├── compliance-agent.json           (CORE — mọi công ty)
    │   ├── audit-agent.json                (CORE — mọi công ty)
    │   ├── hr-lead-agent.json              (CORE — vòng đời agent, không phải nghiệp vụ nhân sự đặc thù ngành)
    │   ├── training-lead-agent.json        (CORE — [MỚI])
    │   ├── marketing-lead-agent.json       (VÍ DỤ variable — mẫu e-commerce, xoá/thay khi đổi ngành)
    │   ├── sales-lead-agent.json           (VÍ DỤ variable)
    │   ├── tech_product-lead-agent.json    (VÍ DỤ variable)
    │   ├── finance-lead-agent.json         (VÍ DỤ variable)
    │   └── customer_success-lead-agent.json (VÍ DỤ variable)
    │
    ├── schemas/                            ← JSON Schema draft-07
    │   ├── agent-role-card.schema.json     (cluster giờ là string mở — validate chéo clusters.yaml, không phải enum đóng)
    │   ├── handover-event.schema.json
    │   └── delegation-matrix.schema.json
    │
    ├── taxonomy/
    │   ├── clusters.yaml                   ← [MỚI] Đăng ký cluster MỞ: core_clusters (bắt buộc mọi công ty) + variable_clusters (công ty tự khai theo D0, có ví dụ mẫu e-commerce/manufacturing)
    │   ├── event-topics.yaml
    │   └── task-states.yaml                (kèm bảng quy đổi risk_tier; nghĩa mức rủi ro có 2 bản: `meaning` vi/mặc định + `meaning_en` tiếng Anh; UI chọn theo locale, thiếu bản dịch rơi về từ điển i18n rồi mới tới `meaning`)
    │
    └── core-defaults/                      ← [MỚI] Tham số hoá — default hợp lý cho đa số, override được theo công ty
        ├── audit.yaml
        ├── agent-lifecycle-onboarding.yaml (có field hard_floor — 1 số ngưỡng KHÔNG override được thấp hơn)
        ├── org-health-diagnosis.yaml
        ├── compliance-baseline.yaml
        └── whistleblowing-anti-abuse.yaml
```

## Nguyên tắc kiến trúc mở (quan trọng nhất)

Mọi công ty dùng Hermes+ đều có:
- **Phần CORE giống nhau 100%**: Compliance, Audit, Training, HR (vòng đời agent), D0-D8, G.1-G.4.5.5 — không phụ thuộc ngành nghề, chạy được ngay với giá trị mặc định trong `core-defaults/`.
- **Phần VARIABLE tự khai báo qua D0 (Company Genesis Wizard)**: số lượng và tên các phòng ban làm nghiệp vụ kinh doanh cụ thể (Marketing/Sales/... chỉ là VÍ DỤ mẫu e-commerce), ghi vào `clusters.yaml`.
- **Sáu nhân viên khung (CEO, Nhân sự, Đào tạo, Tuân thủ, Kiểm toán, Vận hành) bắt buộc ở mọi công ty** (Chủ tịch chốt 09/11/2026, theo mô hình «công ty một người»). Công ty chỉ tự khai phần BIẾN ĐỔI (các phòng nghiệp vụ theo ngành); các cụm mẫu trong `clusters.yaml` chỉ là gợi ý, không bắt buộc.

**Không được viết cứng** số lượng và tên các phòng nghiệp vụ theo ngành trong bất kỳ logic hay văn bản thiết kế mới nào — luôn đọc từ `clusters.yaml`/kết quả D0.4 và từ sổ của công ty. Ngoại lệ có chủ ý: **sáu nhân viên khung** (CEO, Nhân sự, Đào tạo, Tuân thủ, Kiểm toán, Vận hành) là phần cố định của bộ khung.

## Với con người (Chủ tịch)
Đọc `docs/` để hiểu đầy đủ ngữ cảnh. `config/` chỉ cần tra khi cần đúng 1 giá trị số hoặc khi hệ thống thật sự chạy.

## Với Agent (bootstrap bắt buộc mỗi phiên)
1. Load `constitution.yaml` (giá trị cốt lõi, `interface_language`, `priority_order_on_conflict`).
2. Load `taxonomy/clusters.yaml` — biết công ty này có cluster nào, mình thuộc cluster nào.
3. Load Role Card của chính mình, validate theo `schemas/agent-role-card.schema.json`; nếu `lifecycle_stage` chưa `independent_operation`, giới hạn hành động theo đúng giai đoạn (Sandbox/Shadow Mode — D7).
4. Load `core-defaults/*.yaml` liên quan tới vai trò của mình (vd. audit-agent load `audit.yaml`); áp dụng override của công ty nếu có, tôn trọng `hard_floor`.
5. Khi phát/nhận event → theo `schemas/handover-event.schema.json`, topic phải có trong `taxonomy/event-topics.yaml`, `risk_tier` là trường duy nhất biểu diễn mức khẩn cấp (tra `task-states.yaml#risk_tier_display_map` để hiển thị).
6. Nạp `config/OPERATING_HANDBOOK.md` — cẩm nang vận hành tổng hợp, sinh tự động từ DB runtime (cfg_*, meeting_templates) và Role Cards mỗi lần cấu hình thay đổi. **Phải nạp lại mỗi phiên** (cấu hình có thể đã đổi giữa các phiên). Sinh lại: `python3 plugins/hermes-poclip/scripts/generate_handbook.py [--db PATH]`. Kiểm tra lệch: `python3 plugins/hermes-poclip/scripts/generate_handbook.py --check`.

## Quy tắc Validate & Reject
Message/config không khớp schema → reject, đẩy vào `dlq`, KHÔNG tự đoán hoặc tự sửa cho hợp lý.

## Kiểm tra tính hợp lệ

```bash
for f in config/agents/*.json; do npx ajv-cli validate -s config/schemas/agent-role-card.schema.json -d "$f"; done
npx ajv-cli validate -s config/schemas/delegation-matrix.schema.json -d config/delegation-matrix.json
python3 -c "import yaml,glob; [yaml.safe_load(open(f)) for f in glob.glob('config/**/*.yaml', recursive=True)]"
```

## Role Card — trường `objective`

Mỗi Role Card có khối `objective` với 3 trường:

| Trường | Ngôn ngữ | Bắt buộc | Mô tả |
|---|---|---|---|
| `primary_goal` | Tiếng Việt | ✓ | Mô tả nhiệm vụ chính. Thẻ có chức danh theo dạng `"<Chức danh>: <nhiệm vụ>"` (phần trước dấu hai chấm, tối đa 48 ký tự, không chứa `[]()`) — hệ thống tự tách ra `job_title` và `mission`. Thẻ không có chức danh viết dạng văn xuôi. |
| `primary_goal_en` | Tiếng Anh | — | Bản dịch tiếng Anh của `primary_goal`, cùng hình dạng: thẻ có dạng `"<Job title>: <mission>"` thì bản EN cũng phải có dạng `"<Job title>: <mission>"` (chức danh ≤ 48 ký tự); thẻ văn xuôi thì bản EN cũng là văn xuôi. |
| `north_star_kpi_ref` | — | ✓ | ID chỉ số KPI chủ đạo của thẻ. |

**Hiển thị trên UI (Org Chart):** UI chọn `job_title_en` / `mission_en` khi locale = `en`, `job_title` / `mission` khi locale = `vi`. Nếu thẻ thiếu bản dịch tiếng Anh (primary_goal_en rỗng hoặc không có), UI hiển thị bản tiếng Việt kèm ghi chú "chưa có bản dịch" — không hiện chuỗi rỗng/null.

**Mã/file không đổi:** `agent_id`, tên file, `role_type`, `cluster`, `kpis`, `authority`, `io_contract` không bị ảnh hưởng khi thêm `primary_goal_en`.

## Vòng đời cập nhật

| Thay đổi | Ai đề xuất | Ai duyệt |
|---|---|---|
| Sửa 1 field Role Card của Lead/Worker | Lead Agent liên quan | ceo-agent (hoặc chairman_human nếu không có CEO Agent) |
| Thêm/bớt cluster trong `clusters.yaml` (variable) | ceo-agent/hr-lead-agent, qua D0.4 hoặc G.4.5.5 | chairman_human (risk_tier T3) |
| Sửa `core-defaults/*.yaml` (trong giới hạn `hard_floor`) | ceo-agent | chairman_human |
| Sửa `constitution.yaml` | KHÔNG agent nào | chairman_human (duy nhất) |
| Chuyển `lifecycle_stage` sang `independent_operation` | hr-lead-agent kèm `benchmark_record` + `shadow_mode_record` | chairman_human + compliance-agent (risk_tier T2) |

## Khác biệt so với gói tham khảo gốc

- Cluster/phòng ban không còn là enum đóng — mở qua `clusters.yaml`, có `core_clusters` (mọi công ty) và `variable_clusters` (tự khai theo D0).
- CEO Agent là một trong sáu nhân viên khung, luôn có (trình lập công ty tạo ở bước D0.2; quyết định «có/không CEO» của thiết kế cũ đã được thay bằng mô hình «công ty một người»).
- Thêm `training-lead-agent` (core) — chưa có trong gói tham khảo gốc.
- Thêm `knowledge_baseline` — core agent được nạp kiến thức nền trước khi hoạt động (D0.3), không phải "trang giấy trắng".
- Thêm `core-defaults/` — tách tham số có thể chỉnh khỏi logic cố định, có `hard_floor` cho ngưỡng an toàn tối thiểu.
- `risk_tier` (T0-T3) là trường duy nhất cho mức khẩn cấp, thay cho nhãn priority tự do trong gói gốc.
- `audit-agent` báo cáo thẳng `chairman_human`, không qua `ceo-agent`.

## P1 — File Seed Cấu Hình Runtime (3 Mặt Phẳng)

Các file sau là **nguồn seed** cho DB runtime (không phải nguồn runtime trực tiếp).
Sau khi seed vào DB (`cfg_*` tables), runtime đọc từ DB qua `config_registry`.

| File | Mặt phẳng | Bảng DB |
|---|---|---|
| `config/taxonomy/event-topics.yaml` | A. Event Topics | `cfg_event_topics` |
| `config/taxonomy/directive-routing.yaml` (mới) | B. Routing Units | `cfg_routing_units`, `cfg_routing_keywords` |
| `config/digest_schedule.yaml` | C. Digest Schedule | `cfg_settings` (key=digest_schedule) |
| `config/core-defaults/escalation-thresholds.yaml` (mới) | C. Escalation | `cfg_settings` (key=escalation_thresholds) |

Xem thêm: `docs/config-planes.md` (kiến trúc đầy đủ + API endpoints + cơ chế invalidate).
