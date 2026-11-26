import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { properNames } from "../src/lib/plainName";
import { humanizeFinding } from "../src/lib/dashFormat";

// Giao diện cho Chủ tịch — nhóm «Công việc» (Bảng điều hành, Phòng họp, Quy tắc giao chỉ thị), 25/11/2026, nhánh giao-dien-chu-tich.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");
const ed = read("src/pages/ExecutiveDashboard.tsx");
const mr = read("src/pages/MeetingRoom.tsx");
const dr = read("src/pages/DirectiveRouting.tsx");

describe("Bảng điều hành", () => {
  it("ô đầu là «Việc chờ bạn quyết» = phiếu + đề xuất cơ cấu + chính sách + luồng + bảng Kanban, bấm vào sang «Chờ duyệt»", () => {
    assert.equal(vi.executiveDashboard.kpiPending, "Việc chờ bạn quyết");
    assert.ok(ed.includes("const decideTotal = pending + (attn.org ?? 0) + (attn.pol ?? 0) + (attn.flowDrafts ?? 0) + (attn.boardPending ?? 0);"));
    assert.ok(ed.includes('navigateToTab("approval-queue")'));
    assert.equal(vi.executiveDashboard.kpiPendingTickets(3), "3 phiếu duyệt");
  });
  it("dòng nhắc phía trên chỉ còn cảnh báo cần xác nhận (các việc chờ quyết đã ở ô đầu)", () => {
    assert.ok(ed.includes('otherParts.some((p) => p.key === "alerts")'));
    assert.equal(vi.executiveDashboard.alertsLead, "Cảnh báo cần xác nhận:");
  });
  it("đổi chữ chuyên môn", () => {
    const d = vi.executiveDashboard;
    assert.equal(d.zoneBottlenecks, "Chỗ đang chậm");
    assert.equal(d.heartbeatNodes, "Nhân viên AI đang hoạt động");
    assert.ok(!/nhịp tim|hàng đợi lỗi/i.test(d.heartbeatNodes + d.eventBusDlq));
    assert.equal(d.bottleneckColumns.stage, "Bước chậm nhất");
  });
  it("tên nhà cung cấp AI viết đúng", () => {
    assert.equal(properNames("deepseek hết tiền — tạm dừng giao việc"), "DeepSeek hết tiền — tạm dừng giao việc");
    assert.equal(properNames("openai và Qwen"), "OpenAI và Qwen");
    assert.ok(ed.includes("properNames(pausedList.map"));
  });
  it("loại phiếu kỹ thuật được nói bằng tiếng Việt", () => {
    const out = humanizeFinding("Tuân thủ TỪ CHỐI phiếu #ba5e2e59 (tool_use_request): không nêu lý do", { name: (id) => id, cardWord: "thẻ" }).text;
    assert.ok(out.includes("(yêu cầu dùng công cụ)") && !out.includes("tool_use_request"));
  });
});

describe("Phòng họp", () => {
  it("có dải tóm tắt, bảng mẫu họp gập sẵn, danh sách ngắn hơn", () => {
    assert.ok(mr.includes("data-meeting-brief") && mr.includes("t.meetingRoom.briefEmpty(live.length, empty)"));
    assert.ok(mr.includes("data-meeting-templates"));
    assert.ok(mr.includes('<PagedRows items={meetings} pageSize={8} as="list"'));
    assert.equal(vi.meetingRoom.briefOk(3), "Có 3 cuộc họp, các cuộc gần đây đều có người phát biểu.");
    assert.ok(vi.meetingRoom.briefEmpty(13, 13).includes("13 cuộc đã kết thúc mà chưa ai phát biểu được"));
    assert.ok(en.meetingRoom.briefTitle.length > 0);
  });
});

describe("Quy tắc giao chỉ thị", () => {
  it("chỉ hiện 8 từ khoá đầu mỗi phòng, phần còn lại gập; cột ưu tiên nói rõ nghĩa", () => {
    assert.ok(dr.includes("const KEYWORDS_SHOWN = 8;") && dr.includes("data-routing-more-keywords"));
    assert.equal(vi.directiveRouting.moreKeywords(5), "+5 từ khoá khác");
    assert.equal(vi.directiveRouting.colPriority, "Ưu tiên khi trùng từ khoá");
  });
});
