import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countByKind, realEdgesAmong, ruleLines, visibleRuleLines, type MemberLike, type RealEdge } from "../src/lib/memberFlow";

const m = (id: string, mgr: string | null, head = false): MemberLike => ({
  profile_id: id, name: id, is_head: head, manager_id: mgr, manager_name: mgr, open_count: 0,
});
const e = (from: string, to: string, count = 1, kind?: RealEdge["kind"]): RealEdge => ({ from, to, count, overdue_count: 0, kind });

describe("ruleLines", () => {
  it("mỗi người báo cáo cho một người CÙNG PHÒNG tạo cặp chỉ đạo xuống + báo cáo lên", () => {
    const lines = ruleLines([m("lead", "ceo", true), m("a", "lead"), m("b", "lead")]);
    assert.deepEqual(lines.map((l) => `${l.from}->${l.to}:${l.kind}`).sort(), [
      "a->lead:report", "b->lead:report", "lead->a:directive", "lead->b:directive",
    ]);
  });
  it("người quản lý ngoài phòng (CEO) không tạo đường trong phòng", () => {
    assert.deepEqual(ruleLines([m("lead", "ceo", true)]), []);
  });
  it("tự báo cáo cho chính mình bị bỏ qua", () => {
    assert.deepEqual(ruleLines([m("a", "a")]), []);
  });
  it("chuỗi nhiều cấp: nhân viên → nhân viên → Trưởng phòng", () => {
    const lines = ruleLines([m("lead", null, true), m("a", "lead"), m("b", "a")]);
    assert.equal(lines.length, 4);
    assert.ok(lines.some((l) => l.from === "a" && l.to === "b" && l.kind === "directive"));
  });
});

describe("visibleRuleLines", () => {
  const lines = ruleLines([m("lead", null, true), m("a", "lead")]);
  it("không có quan hệ thật → giữ cả hai chiều", () => {
    assert.equal(visibleRuleLines(lines, []).length, 2);
  });
  it("đường GIAO VIỆC thật thay cho nét đứt «chỉ đạo xuống» cùng chiều, giữ «báo cáo lên»", () => {
    const v = visibleRuleLines(lines, [e("lead", "a", 3, "assign")]);
    assert.deepEqual(v.map((l) => `${l.from}->${l.to}`), ["a->lead"]);
  });
  it("đường BÁO CÁO thật thay cho nét đứt «báo cáo lên», giữ «chỉ đạo xuống»", () => {
    const v = visibleRuleLines(lines, [e("a", "lead", 2, "report")]);
    assert.deepEqual(v.map((l) => `${l.from}->${l.to}`), ["lead->a"]);
  });
  it("đường chuyển kết quả làm tiếp không thay cho nét đứt nào", () => {
    assert.equal(visibleRuleLines(lines, [e("lead", "a", 1, "handoff"), e("a", "lead", 1, "handoff")]).length, 2);
  });
  it("cạnh thiếu loại (dữ liệu cũ) được coi là giao việc", () => {
    assert.deepEqual(visibleRuleLines(lines, [e("lead", "a", 3)]).map((l) => `${l.from}->${l.to}`), ["a->lead"]);
  });
  it("cạnh thật có số lượng 0 không che nét đứt", () => {
    assert.equal(visibleRuleLines(lines, [e("lead", "a", 0, "assign")]).length, 2);
  });
});

describe("realEdgesAmong", () => {
  it("chỉ giữ cạnh giữa các thành viên đang hiển thị", () => {
    const real = [e("a", "b"), e("a", "ghost"), e("b", "b")];
    assert.deepEqual(realEdgesAmong([m("a", null), m("b", null)], real), [e("a", "b")]);
  });
});

describe("countByKind", () => {
  it("cộng số lượng theo loại quan hệ; thiếu loại tính là giao việc", () => {
    assert.deepEqual(countByKind([e("a", "b", 2, "assign"), e("b", "a", 3, "report"), e("a", "c", 1, "handoff"), e("a", "d", 4)]),
      { assign: 6, handoff: 1, report: 3 });
  });
});
