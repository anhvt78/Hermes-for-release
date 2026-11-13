import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTitle, groupNotifications, buildTodayRows } from "../src/lib/notificationGroups";

const n = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id, kind: "monitor_alert", severity: "warning", title, created_at: "2026-11-11T08:00:00Z", read_at: null as string | null, ...over,
});

describe("normalizeTitle", () => {
  it("bỏ mã thẻ, mã dài, số và tên việc để các câu cùng khuôn trùng nhau", () => {
    const a = normalizeTitle("Giám sát: Bảng «Vận hành nội bộ» — việc «Chuẩn bị vận hành cho vị trí mới: BA» (mã t_50a0dbf8) kẹt ở trạng thái sẵn sàng 47 phút");
    const b = normalizeTitle("Giám sát: Bảng «Vận hành nội bộ» — việc «Làm rõ yêu cầu (Clarifier)» (mã t_3dfc34cd) kẹt ở trạng thái sẵn sàng 52 phút");
    assert.equal(a, b);
  });
  it("câu về hai bảng khác nhau KHÔNG trùng", () => {
    assert.notEqual(normalizeTitle("Bảng «Tiền và Tuân thủ» — việc «a» kẹt 47 phút"), normalizeTitle("Bảng «Vận hành nội bộ» — việc «a» kẹt 47 phút"));
  });
  it("UUID và số lần xuất hiện không làm khác khoá", () => {
    assert.equal(
      normalizeTitle("Việc cần làm 5cbd1a17-592e-4a21-ab35-dbe77d3e148b quá hạn 0 ngày — thấy 42 lần"),
      normalizeTitle("Việc cần làm 11111111-2222-3333-4444-555555555555 quá hạn 3 ngày — thấy 7 lần"),
    );
  });
});

describe("groupNotifications", () => {
  it("gộp thông báo giống nhau, đếm chưa đọc, lấy mức cao nhất và mới nhất làm đại diện", () => {
    const items = [
      n("a", "Việc cần làm 5cbd1a17-592e-4a21-ab35-dbe77d3e148b quá hạn 0 ngày", { created_at: "2026-11-11T07:00:00Z" }),
      n("b", "Việc cần làm 5cbd1a17-592e-4a21-ab35-dbe77d3e148b quá hạn 1 ngày", { created_at: "2026-11-11T09:00:00Z", severity: "critical", escalation_level: 3 }),
      n("c", "Việc cần làm 5cbd1a17-592e-4a21-ab35-dbe77d3e148b quá hạn 2 ngày", { created_at: "2026-11-11T08:00:00Z", read_at: "2026-11-11T08:30:00Z" }),
    ];
    const g = groupNotifications(items);
    assert.equal(g.length, 1);
    assert.deepEqual(g[0].items.map((x) => x.id), ["b", "c", "a"]);
    assert.equal(g[0].head.id, "b");
    assert.equal(g[0].unread, 2);
    assert.equal(g[0].severity, "critical");
    assert.equal(g[0].maxEscalation, 3);
  });
  it("khác loại thì không gộp; nhóm nghiêm trọng lên đầu", () => {
    const g = groupNotifications([
      n("a", "Cùng câu", { kind: "task_due", created_at: "2026-11-11T10:00:00Z" }),
      n("b", "Cùng câu", { kind: "monitor_alert", severity: "critical", created_at: "2026-11-11T05:00:00Z" }),
    ]);
    assert.equal(g.length, 2);
    assert.equal(g[0].head.id, "b");
  });
  it("thông báo không có tiêu đề không bao giờ bị gộp với nhau", () => {
    const g = groupNotifications([n("a", ""), n("b", "")]);
    assert.equal(g.length, 2);
  });
});

describe("buildTodayRows", () => {
  it("chỉ trả các dòng có số > 0 và bỏ nguồn không tải được", () => {
    const rows = buildTodayRows({ approvalsOpen: 2, approvalsOverdue: 1, orgProposals: 0, policyProposals: null, chairmanAlerts: 4, criticalUnreadGroups: 0, dueUnread: 1 });
    assert.deepEqual(rows.map((r) => r.key), ["approvals", "chairmanAlerts", "due"]);
    assert.equal(rows[0].overdue, 1);
  });
  it("không còn việc nào thì rỗng", () => {
    assert.deepEqual(buildTodayRows({ approvalsOpen: 0, orgProposals: 0, policyProposals: 0, chairmanAlerts: 0, criticalUnreadGroups: 0, dueUnread: 0 }), []);
  });
});
