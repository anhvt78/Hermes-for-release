import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allowedLevels, companyGoalTaken, defaultLevel, descendantIds, levelAfterParentChange, levelChoices, parentChoices, type GoalLite } from "../src/lib/goalHierarchy";

const tree: GoalLite[] = [
  { id: "c", level: "company", children: [
    { id: "i1", level: "initiative", children: [
      { id: "o1", level: "outcome", children: [{ id: "t1", level: "task", children: [] }] },
      { id: "t2", level: "task", children: [] },
    ] },
    { id: "i2", level: "initiative", children: [] },
  ] },
];
const flat: GoalLite[] = [];
const walk = (g: GoalLite) => { flat.push(g); (g.children ?? []).forEach(walk); };
tree.forEach(walk);

describe("allowedLevels — cấp con phải thấp hơn cấp cha", () => {
  it("không có cha → đủ 4 cấp", () => assert.deepEqual(allowedLevels(null), ["company", "initiative", "outcome", "task"]));
  it("cha là công ty → sáng kiến, kết quả, công việc (được nhảy cấp)", () => assert.deepEqual(allowedLevels("company"), ["initiative", "outcome", "task"]));
  it("cha là kết quả → chỉ công việc; cha là công việc → không cấp nào", () => {
    assert.deepEqual(allowedLevels("outcome"), ["task"]);
    assert.deepEqual(allowedLevels("task"), []);
  });
});

describe("parentChoices", () => {
  it("sáng kiến chỉ chọn được cha là công ty", () => assert.deepEqual(parentChoices(flat, tree, "initiative").map((g) => g.id), ["c"]));
  it("công việc chọn được công ty, sáng kiến, kết quả — không chọn công việc khác", () =>
    assert.deepEqual(parentChoices(flat, tree, "task").map((g) => g.id), ["c", "i1", "o1", "i2"]));
  it("cấp công ty không có cha", () => assert.deepEqual(parentChoices(flat, tree, "company"), []));
  it("đang sửa một mục tiêu: loại chính nó và con cháu khỏi danh sách cha", () => {
    assert.deepEqual(parentChoices(flat, tree, "task", "i1").map((g) => g.id), ["c", "i2"]);
  });
});

describe("descendantIds", () => {
  it("gồm chính nó và mọi con cháu", () => assert.deepEqual([...descendantIds(tree, "i1")].sort(), ["i1", "o1", "t1", "t2"]));
  it("mục tiêu lá chỉ có chính nó", () => assert.deepEqual([...descendantIds(tree, "i2")], ["i2"]));
});

describe("công ty chỉ có một mục tiêu cấp công ty", () => {
  it("đã có → companyGoalTaken, trừ chính nó khi đang sửa", () => {
    assert.equal(companyGoalTaken(flat), true);
    assert.equal(companyGoalTaken(flat, "c"), false);
    assert.equal(companyGoalTaken([]), false);
  });
  it("cấp mặc định: chưa có công ty → company; có rồi → initiative", () => {
    assert.equal(defaultLevel([]), "company");
    assert.equal(defaultLevel(flat), "initiative");
  });
  it("levelChoices ẩn «company» khi đã có, trừ khi đang sửa chính nó; lọc theo cha", () => {
    assert.deepEqual(levelChoices(flat, null), ["initiative", "outcome", "task"]);
    assert.deepEqual(levelChoices(flat, null, "c"), ["company", "initiative", "outcome", "task"]);
    assert.deepEqual(levelChoices([], null), ["company", "initiative", "outcome", "task"]);
    assert.deepEqual(levelChoices(flat, flat.find((g) => g.id === "o1")), ["task"]);
  });
});

describe("levelAfterParentChange", () => {
  it("giữ nguyên nếu vẫn hợp lệ", () => assert.equal(levelAfterParentChange("outcome", ["outcome", "task"]), "outcome"));
  it("không hợp lệ → cấp gần nhất trong số được phép", () => {
    assert.equal(levelAfterParentChange("initiative", ["task"]), "task");
    assert.equal(levelAfterParentChange("initiative", ["outcome", "task"]), "outcome");
  });
  it("không còn cấp nào → giữ nguyên (máy chủ sẽ báo lỗi rõ)", () => assert.equal(levelAfterParentChange("task", []), "task"));
});
