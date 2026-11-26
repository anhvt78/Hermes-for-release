import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { plainName } from "../src/lib/plainName";
import { friendlyTitle } from "../src/lib/caseTitle";

// Sửa các lỗi gặp khi thao tác như Chủ tịch trên máy 26 (26/11/2026).
function src(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, "src", rel);
    if (fs.existsSync(c)) return fs.readFileSync(c, "utf-8");
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}

describe("Chờ duyệt: phiếu", () => {
  const s = src("pages/ApprovalQueue.tsx");
  it("kênh Telegram chưa nối hiện nhẹ nhàng, không phải cảnh báo lỗi", () => {
    assert.ok(!s.includes('"⚠ " + t.approvalQueue.notify.sentFailed'));
    assert.ok(s.includes("t.approvalQueue.notify.dashboardOnly"));
    assert.ok(s.includes("aq.notify.dashboardOnlyLong"));
    assert.equal(vi.approvalQueue!.notify!.dashboardOnly, "Chỉ hiện trên màn Thông báo");
    assert.equal(en.approvalQueue.notify.dashboardOnly, "Shown on the Notifications screen only");
  });
  it("câu xác nhận «làm đúng việc này một lần» chỉ dành cho phiếu dùng công cụ", () => {
    assert.ok(s.includes('detail.request_type === "tool_use_request" ? aq.confirm.approve : aq.confirm.approveChange'));
    assert.ok(vi.approvalQueue!.confirm!.approveChange!.includes("hiệu lực ngay"));
  });
});

describe("Đề xuất chính sách: dòng vừa quyết biến mất ngay", () => {
  const s = src("components/PolicyProposals.tsx");
  it("giữ tập mã đã xử lý và lọc ra khỏi danh sách", () => {
    assert.ok(s.includes("const [gone, setGone]"));
    assert.ok(s.includes(".filter((x) => !gone.has(x.id))"));
    assert.ok(s.includes("setGone((cur) => new Set(cur).add(it.id));"));
  });
});

describe("tên người/phòng bằng tiếng Việt", () => {
  it("danh sách chọn người phụ trách mục tiêu dùng nhãn Việt trước", () => {
    assert.ok(src("pages/GoalTree.tsx").includes("personLabelOr(t, id, n.display_name ? String(n.display_name) : null)"));
  });
  it("bộ lọc người ở Luồng xử lý và dải «đang diễn ra» dùng nhãn Việt", () => {
    assert.ok(src("pages/ProcessMap.tsx").includes("{personLabelOr(t, x.id, x.name)}"));
    const lt = src("pages/LiveTicker.tsx");
    assert.ok(lt.includes("personName(e.who_id, e.who)") && lt.includes("personName(c.who_id, c.who)"));
  });
  it("tên phòng ở Quy tắc giao chỉ thị bỏ phần tiếng Anh trong ngoặc", () => {
    const d = src("pages/DirectiveRouting.tsx");
    assert.ok(d.includes("plainName(unit.display_name)") && d.includes("plainName(c.display_name)"));
  });
});

describe("tên nhắc lại chính nó trong ngoặc", () => {
  it("bỏ phần ngoặc chỉ lặp lại tên đứng trước", () => {
    assert.equal(plainName("Vai Rà soát bảo mật (Trưởng phòng Rà soát bảo mật)"), "Vai Rà soát bảo mật");
    assert.equal(plainName("Vai Trưởng phòng Sản phẩm (Trưởng phòng Sản phẩm) mới"), "Vai Trưởng phòng Sản phẩm mới");
  });
  it("giữ phần ngoặc là giải thích thật hoặc chỉ một chữ đứng trước", () => {
    assert.equal(plainName("Trưởng phòng Khách hàng (Tiếp nhận)"), "Trưởng phòng Khách hàng (Tiếp nhận)");
    assert.equal(plainName("Kiểm thử (Kiểm thử tự động)"), "Kiểm thử (Kiểm thử tự động)");
    assert.equal(plainName("Mức (C1–C5)"), "Mức (C1–C5)");
  });
});

describe("báo cáo ngày: nhãn mới", () => {
  it("«Nhân viên không bị kẹt việc» thay «Thời gian chạy liên tục»", () => {
    assert.ok(src("i18n/vi.ts").includes('uptime: "Nhân viên không bị kẹt việc"'));
    assert.ok(src("i18n/en.ts").includes('uptime: "AI employees not stuck"'));
  });
});

describe("Cài đặt điều hành và Cây mục tiêu", () => {
  it("nút chế độ tự động hóa có trạng thái đang chọn đọc được (không chỉ màu)", () => {
    const o = src("pages/OperatingModel.tsx");
    assert.ok(o.includes("aria-pressed={active}") && o.includes('{active ? "✓ " : ""}{modeLabel}'));
  });
  it("thẻ Kanban chưa gắn mục tiêu hiện tiêu đề gọn (gốc ở chú thích)", () => {
    assert.ok(src("pages/GoalTree.tsx").includes("title={c.title}>{friendlyTitle(c.title)}</a>"));
  });
});

describe("Dự án và khách hàng: quy trình phụ vẫn được tính là đã khai", () => {
  it("chỉ báo «chưa khai quy trình» khi không có quy trình nào (kể cả quy trình phụ)", () => {
    assert.ok(src("pages/Projects.tsx").includes("{flow && !flow.configured && flows.length === 0 && ("));
  });
});

describe("tiêu đề việc: mã thẻ giữa câu", () => {
  it("t_xxxxxxxx giữa tiêu đề thành #xxxxxxxx", () => {
    assert.equal(friendlyTitle("Không gửi đính chính cho khách, đóng thẻ t_401cf5a7 lại"), "Không gửi đính chính cho khách, đóng thẻ #401cf5a7 lại");
  });
});
