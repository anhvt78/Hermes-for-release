import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { friendlyTitle } from "../src/lib/caseTitle";

// Rà soát tab «Sơ đồ luồng và tiến độ» (25/11/2026): sơ đồ lên trước, phần thiết lập gập, bỏ chữ kỹ thuật, sơ đồ đường đi có gợi ý cuộn,
// tên sự vụ gọn, giảm đỏ khi AI tạm dừng, tab «Cấu hình quy trình» gọn.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");
const cf = read("src/pages/CompanyFlows.tsx");
const rg = read("src/pages/RouteGraph.tsx");
const pc = read("src/pages/ProcessConfig.tsx");
const cc = read("src/pages/CaseChain.tsx");
const pm = read("src/pages/ProcessMap.tsx");
const lt = read("src/pages/LiveTicker.tsx");
const fom = read("src/components/FlowOverviewMap.tsx");

describe("Mạng lưới giao việc: bố cục", () => {
  it("điểm nghẽn nằm SAU các lớp (sơ đồ lên trước) và gập mặc định", () => {
    assert.ok(cf.indexOf("{/* ── Layer tabs ── */}") < cf.indexOf("bottlenecksSummary"));
    assert.ok(cf.includes("const [bottleneckOpen, setBottleneckOpen] = useState(false);"));
    assert.ok(!cf.includes('<div data-flows-bottlenecks="" style={cardStyle}>'));
  });
  it("phòng chưa có luồng + cấu hình luật + bảng Kanban gom vào một phần «Thiết lập», gập mặc định, có dấu cảnh báo khi thiếu luồng", () => {
    assert.ok(cf.includes("const [setupOpen, setSetupOpen] = useState(false);"));
    assert.ok(cf.includes("t.companyFlows.setupTitle"));
    assert.ok(cf.includes('sev={missing.status === "warning" ? "warning" : undefined}'));
    const setup = cf.indexOf("data-flows-setup");
    for (const k of ["data-flows-missing-section", "data-flows-law-section", "data-kanban-boards-section"]) assert.ok(cf.indexOf(k) > setup, k);
  });
  it("hộp «quy định không vẽ thành đường» gập mặc định, chỉ mở khi đang lọc theo nhóm", () => {
    assert.ok(cf.includes('open={flowCategory !== "all"} data-flows-undrawn='));
  });
  it("nút lớp «Giám sát» đổi tên để không trùng nhóm «Giám sát hệ thống»", () => {
    assert.equal(vi.companyFlows.layerOversight, "Kiểm toán và bàn giao");
    assert.equal(vi.companyFlows.flowCategoryOptions.monitoring, "Giám sát hệ thống");
  });
  it("hết chữ kỹ thuật: «*» thành «Mọi phòng», không còn mã bảng ('slug') và câu 'noi-bo'", () => {
    assert.ok(cf.includes('value === "*" ? t.companyFlows.frameWholeCompanyName'));
    assert.equal(vi.companyFlows.frameWholeCompanyName, "Mọi phòng");
    assert.ok(!vi.companyFlows.frameSpecialsTitle.includes("hợp lệ"));
    assert.ok(!vi.kanbanBoards.alwaysNoiBoNote.includes("noi-bo"));
    assert.ok(!cf.includes("t.kanbanBoards.colSlug"));
    assert.ok(cf.includes("<td style={tdStyle} title={row.detailText}>{row.label}</td>"));
  });
  it("sơ đồ tổng quan: lời giải thích dài gập vào «Cách đọc sơ đồ»; đường mờ sáng hơn", () => {
    assert.ok(fom.includes('data-ov-howto=""'));
    assert.ok(fom.includes('const PLANNED = "#A8B6B6";'));
  });
});

describe("Luồng xử lý và sơ đồ đường đi", () => {
  it("sơ đồ đường đi rộng hơn khung thì có dòng gợi ý, nút ◀ ▶ và ô «Nhảy tới»; nhãn cột/ô có chú thích đầy đủ", () => {
    for (const k of ["data-rg-scroll-hint", "data-rg-scroll-prev", "data-rg-scroll-next", "data-rg-jump"]) assert.ok(rg.includes(k), k);
    assert.ok(rg.includes("<title>{c.label}</title>"));
    assert.ok(rg.includes("<title>{`${n.name} — ${n.unit}`}</title>"));
    assert.equal(vi.routeGraph.scrollHint(29), "Sơ đồ có 29 bước, rộng hơn khung — kéo ngang hoặc dùng nút để xem tiếp:");
    assert.equal(vi.routeGraph.typeLabel, "Quy trình");
  });
  it("«không có việc nào đang chạy» đổi thành chữ không mâu thuẫn với dòng hoạt động; dòng hoạt động có tiêu đề «vừa xảy ra»", () => {
    assert.equal(vi.liveFlow.running(0), "Hiện không có nhân viên nào đang làm việc");
    assert.ok(lt.includes("data-live-recent-title"));
    assert.ok(vi.liveFlow.recentTitle.includes("không phải việc đang chạy"));
  });
  it("biểu ngữ «AI đang tạm dừng» ở Luồng xử lý và Chuỗi sự vụ", () => {
    assert.ok(pm.includes("data-pm-ai-paused") && pm.includes("ai_paused?: boolean;"));
    assert.ok(cc.includes("data-cc-ai-paused") && cc.includes("data?.ai_paused"));
    assert.ok(vi.processMap.aiPaused.includes("«Cần theo dõi» (vàng) thay vì «Nghiêm trọng» (đỏ)"));
    assert.ok(en.processMap.aiPaused.includes("instead of “Critical” (red)"));
  });
});

describe("Chuỗi sự vụ: tên gọn", () => {
  it("bỏ mã nội bộ ở đầu và cuối, giữ nội dung", () => {
    assert.equal(friendlyTitle("[G-2026-11-04] v2.1 — hợp nhất 2 mẫu (thay t_9a37b14b): 5 việc sửa theo verdict 17"), "v2.1 — hợp nhất 2 mẫu: 5 việc sửa theo verdict 17");
    assert.equal(friendlyTitle("[INFRA][hạn 12/11 02:00Z] Đo lại 48h sự cố infra-w46-alert-undelivered + so baseline"), "Đo lại 48h sự cố infra-w46-alert-undelivered + so baseline");
    assert.equal(friendlyTitle("Chấm lại độc lập bài kiểm tra đào tạo DT-2026-11-10 (training-lead-agent)"), "Chấm lại độc lập bài kiểm tra đào tạo DT-2026-11-10");
    assert.equal(friendlyTitle("Chấm kết quả thử việc client_business-lead-agent (C1–C5) — thẻ t_908585d1"), "Chấm kết quả thử việc client_business-lead-agent (C1–C5)");
    assert.equal(friendlyTitle("[kpi_task_ontime_rate] Đo tỷ lệ hoàn thành đúng hạn"), "Đo tỷ lệ hoàn thành đúng hạn");
  });
  it("giữ nhãn có nghĩa với người đọc và không làm trống tiêu đề", () => {
    assert.equal(friendlyTitle("[BÀN GIAO] Vai trò Trưởng phòng Khách hàng"), "[BÀN GIAO] Vai trò Trưởng phòng Khách hàng");
    assert.equal(friendlyTitle("[DỰ ÁN THỬ] Trang web gia phả"), "[DỰ ÁN THỬ] Trang web gia phả");
    assert.equal(friendlyTitle("[G-2026-11-04]"), "[G-2026-11-04]");
    assert.equal(friendlyTitle(""), "");
  });
  it("danh sách và hộp thoại dùng tên gọn, chú thích giữ tên gốc", () => {
    assert.ok(cc.includes("friendlyTitle(c.title)") && cc.includes("friendlyTitle(node.title)") && cc.includes("title={node.title}"));
  });
});

describe("Cấu hình quy trình", () => {
  it("6 quy trình dựng sẵn gộp một khối; mỗi quy trình có danh sách bước gập kèm tóm tắt; nút «Quay về…» tách riêng", () => {
    assert.ok(pc.includes("data-pcfg-builtin-group"));
    assert.ok(pc.includes("(editing || p.kind !== \"builtin\")"));
    assert.ok(pc.includes("data-pcfg-steps"));
    assert.ok(pc.includes('<span style={{ marginLeft: "auto" }}><Button data-pcfg-act="reset"'));
    assert.equal(vi.processConfig.stepsSummary(29, "Tiếp nhận", "Đóng dự án và học"), "29 bước: Tiếp nhận → … → Đóng dự án và học");
  });
  it("ghi chú phân biệt với «Quy trình dự án»", () => {
    assert.ok(pc.includes("data-pcfg-not-project"));
    assert.ok(vi.processConfig.notProjectNote.includes("Quy trình dự án"));
    assert.ok(en.processConfig.notProjectNote.includes("Project flows"));
  });
});
