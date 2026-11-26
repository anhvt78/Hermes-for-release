import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  taskStatusRank,
  sortTraceTasks,
  collectTraceTasks,
  type TraceTaskOption,
} from "../src/lib/traceTasks";

function makeTask(overrides: Partial<TraceTaskOption> & { item_id: string }): TraceTaskOption {
  return {
    title: overrides.item_id,
    status: "in_progress",
    holder: "agent-01",
    overdue: false,
    waiting_seconds: 0,
    ...overrides,
  };
}

// ── taskStatusRank ────────────────────────────────────────────────────────────

describe("taskStatusRank", () => {
  it("in_progress → 0", () => assert.equal(taskStatusRank("in_progress"), 0));
  it("pending_review → 0", () => assert.equal(taskStatusRank("pending_review"), 0));
  it("assigned → 1", () => assert.equal(taskStatusRank("assigned"), 1));
  it("draft → 1", () => assert.equal(taskStatusRank("draft"), 1));
  it("done → 2", () => assert.equal(taskStatusRank("done"), 2));
  it("rejected → 2", () => assert.equal(taskStatusRank("rejected"), 2));
  it("mã lạ → 3", () => assert.equal(taskStatusRank("unknown_xyz"), 3));
  it("chuỗi rỗng → 3", () => assert.equal(taskStatusRank(""), 3));
});

// ── sortTraceTasks ────────────────────────────────────────────────────────────

describe("sortTraceTasks — thứ tự ưu tiên", () => {
  it("overdue=true lên trước overdue=false", () => {
    const items = [
      makeTask({ item_id: "a", overdue: false }),
      makeTask({ item_id: "b", overdue: true }),
    ];
    const sorted = sortTraceTasks(items);
    assert.equal(sorted[0].item_id, "b");
    assert.equal(sorted[1].item_id, "a");
  });

  it("cùng overdue → rank trạng thái tăng dần", () => {
    const items = [
      makeTask({ item_id: "done1", status: "done" }),
      makeTask({ item_id: "wip1", status: "in_progress" }),
      makeTask({ item_id: "asgn1", status: "assigned" }),
    ];
    const sorted = sortTraceTasks(items);
    assert.equal(sorted[0].item_id, "wip1");
    assert.equal(sorted[1].item_id, "asgn1");
    assert.equal(sorted[2].item_id, "done1");
  });

  it("cùng overdue + rank → waiting_seconds giảm dần", () => {
    const items = [
      makeTask({ item_id: "a", status: "in_progress", waiting_seconds: 100 }),
      makeTask({ item_id: "b", status: "in_progress", waiting_seconds: 500 }),
      makeTask({ item_id: "c", status: "in_progress", waiting_seconds: 200 }),
    ];
    const sorted = sortTraceTasks(items);
    assert.equal(sorted[0].item_id, "b");
    assert.equal(sorted[1].item_id, "c");
    assert.equal(sorted[2].item_id, "a");
  });

  it("cùng overdue + rank + waiting → item_id tăng dần (ổn định)", () => {
    const items = [
      makeTask({ item_id: "z", status: "done", waiting_seconds: 10 }),
      makeTask({ item_id: "a", status: "done", waiting_seconds: 10 }),
      makeTask({ item_id: "m", status: "done", waiting_seconds: 10 }),
    ];
    const sorted = sortTraceTasks(items);
    assert.equal(sorted[0].item_id, "a");
    assert.equal(sorted[1].item_id, "m");
    assert.equal(sorted[2].item_id, "z");
  });

  it("không mutate input", () => {
    const items = [
      makeTask({ item_id: "b", overdue: false }),
      makeTask({ item_id: "a", overdue: true }),
    ];
    const original = [...items];
    sortTraceTasks(items);
    assert.deepEqual(items, original);
  });

  it("overdue kết hợp rank + waiting", () => {
    const items = [
      makeTask({ item_id: "od-done", overdue: true, status: "done", waiting_seconds: 10 }),
      makeTask({ item_id: "od-wip",  overdue: true, status: "in_progress", waiting_seconds: 5 }),
      makeTask({ item_id: "ok-wip",  overdue: false, status: "in_progress", waiting_seconds: 9999 }),
    ];
    const sorted = sortTraceTasks(items);
    assert.equal(sorted[0].item_id, "od-wip");
    assert.equal(sorted[1].item_id, "od-done");
    assert.equal(sorted[2].item_id, "ok-wip");
  });
});

// ── collectTraceTasks ─────────────────────────────────────────────────────────

describe("collectTraceTasks", () => {
  it("đầu vào rỗng → []", () => {
    assert.deepEqual(collectTraceTasks([]), []);
  });

  it("within_units không có items → []", () => {
    assert.deepEqual(collectTraceTasks([{}, {}]), []);
  });

  it("gom nhiều within_units theo thứ tự xuất hiện", () => {
    const result = collectTraceTasks([
      { items: [makeTask({ item_id: "a", waiting_seconds: 100 })] },
      { items: [makeTask({ item_id: "b", waiting_seconds: 200 })] },
    ]);
    assert.equal(result.length, 2);
    // b có waiting cao hơn → đứng trước sau sort
    assert.equal(result[0].item_id, "b");
  });

  it("khử trùng theo item_id — giữ bản xuất hiện đầu tiên (within)", () => {
    const first = makeTask({ item_id: "dup", title: "first", waiting_seconds: 100 });
    const second = makeTask({ item_id: "dup", title: "second", waiting_seconds: 200 });
    const result = collectTraceTasks([
      { items: [first] },
      { items: [second] },
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "first");
  });

  it("cắt theo limit mặc định 50", () => {
    const items = Array.from({ length: 60 }, (_, i) => makeTask({ item_id: `t${i.toString().padStart(3, "0")}` }));
    const result = collectTraceTasks([{ items }]);
    assert.equal(result.length, 50);
  });

  it("cắt theo limit truyền vào", () => {
    const items = Array.from({ length: 20 }, (_, i) => makeTask({ item_id: `t${i}` }));
    const result = collectTraceTasks([{ items }], [], 5);
    assert.equal(result.length, 5);
  });

  it("limit lớn hơn số item → trả hết", () => {
    const items = [makeTask({ item_id: "x" }), makeTask({ item_id: "y" })];
    const result = collectTraceTasks([{ items }], [], 100);
    assert.equal(result.length, 2);
  });

  it("không truyền betweenEdges → hành vi như cũ (within-only)", () => {
    const items = [
      makeTask({ item_id: "w1", waiting_seconds: 50 }),
      makeTask({ item_id: "w2", waiting_seconds: 100 }),
    ];
    const result = collectTraceTasks([{ items }]);
    assert.equal(result.length, 2);
    assert.equal(result[0].item_id, "w2");
    assert.equal(result[0].cross_unit, false);
  });

  it("gộp within + between: cả 2 nguồn đều xuất hiện", () => {
    const withinTask = makeTask({ item_id: "w1", cluster: "sales" });
    const betweenTask = makeTask({ item_id: "b1", cluster: "finance" });
    const result = collectTraceTasks(
      [{ items: [withinTask] }],
      [{ from: "finance", to: "executive", items: [betweenTask] }],
    );
    assert.equal(result.length, 2);
    const ids = result.map((r) => r.item_id);
    assert.ok(ids.includes("w1"));
    assert.ok(ids.includes("b1"));
  });

  it("khử trùng: cùng item_id ở cả 2 nguồn → 1 dòng và cross_unit === true", () => {
    const withinTask = makeTask({ item_id: "shared", cluster: "sales", title: "from-within" });
    const betweenTask = makeTask({ item_id: "shared", cluster: "sales", title: "from-between" });
    const result = collectTraceTasks(
      [{ items: [withinTask] }],
      [{ from: "sales", to: "finance", items: [betweenTask] }],
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].cross_unit, true);
    assert.equal(result[0].title, "from-between");
  });

  it("1 việc quá hạn + 1 việc đang chạy → quá hạn đứng đầu", () => {
    const overdueBetween = makeTask({ item_id: "od", overdue: true, status: "assigned" });
    const runningWithin = makeTask({ item_id: "run", overdue: false, status: "in_progress", waiting_seconds: 9999 });
    const result = collectTraceTasks(
      [{ items: [runningWithin] }],
      [{ from: "sales", to: "finance", items: [overdueBetween] }],
    );
    assert.equal(result[0].item_id, "od");
    assert.equal(result[1].item_id, "run");
  });

  it("cắt theo limit sau khi gộp cả 2 nguồn", () => {
    const withinItems = Array.from({ length: 5 }, (_, i) => makeTask({ item_id: `w${i}` }));
    const betweenItems = Array.from({ length: 5 }, (_, i) => makeTask({ item_id: `b${i}` }));
    const result = collectTraceTasks(
      [{ items: withinItems }],
      [{ from: "a", to: "b", items: betweenItems }],
      7,
    );
    assert.equal(result.length, 7);
  });
});
