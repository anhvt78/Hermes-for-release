import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activePhases, aggregateStage, isPhaseKey, mapObservedEdges, mapPathToPhases, overviewProcess, phaseIndexOf, phaseKey, phaseProcess, stepToPhase,
  type PhaseDef, type ProcLike, type StageLike,
} from "../src/lib/phaseView";

const st = (key: string, o: Partial<StageLike> = {}): StageLike => ({
  key, label: `Bước ${key}`, who: "", hint: "", branch: false, info_only: false, count: 0, ok: 0, warn: 0, bad: 0, status: "grey", items: [], ...o,
});

// 10 bước chính a..j + 1 nhánh rẽ ra từ «c»
const keys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const phases: PhaseDef[] = [
  { label: "Một", keys: ["a", "b", "c"] },
  { label: "Hai", keys: ["d", "e", "f", "g"] },
  { label: "Ba", keys: ["h", "i", "j"] },
];
const mk = (): ProcLike => ({
  stages: [
    ...keys.map((k) => st(k)),
    st("c_blocked", { branch: true, branch_from: "c", ok: 0, warn: 2, count: 2, status: "yellow", items: [{ level: "warn" }, { level: "warn" }] }),
  ].map((s) => (s.key === "a" ? { ...s, ok: 3, count: 3, status: "green", items: [{ level: "ok" }, { level: "ok" }, { level: "ok" }] } : s.key === "e" ? { ...s, bad: 1, count: 1, status: "red", items: [{ level: "bad" }] } : s)),
  observed_edges: [
    { from: "a", to: "b", n: 2, kind: "give" },      // cùng giai đoạn → bỏ ở tổng quan
    { from: "c", to: "d", n: 3, kind: "give" },
    { from: "d", to: "c", n: 1, kind: "back" },       // ngược chiều giữa hai giai đoạn → gộp thành «both» nếu cùng cặp
    { from: "g", to: "h", n: 4, kind: "give" },
  ],
  phases,
});

describe("activePhases — chỉ quy trình dài, cấu hình khớp thứ tự mới chia giai đoạn", () => {
  it("quy trình 10 bước chính + giai đoạn khớp → dùng", () => assert.equal(activePhases(mk())?.length, 3));
  it("quy trình ngắn (≤ 8 bước chính) → không chia", () => {
    const p: ProcLike = { stages: keys.slice(0, 8).map((k) => st(k)), phases: [{ label: "x", keys: keys.slice(0, 4) }, { label: "y", keys: keys.slice(4, 8) }] };
    assert.equal(activePhases(p), null);
  });
  it("giai đoạn thiếu bước hoặc sai thứ tự → bỏ (giữ một hàng như cũ)", () => {
    assert.equal(activePhases({ ...mk(), phases: [{ label: "Một", keys: ["a", "b", "c"] }, { label: "Hai", keys: ["d", "e"] }] }), null);
    assert.equal(activePhases({ ...mk(), phases: [{ label: "Một", keys: ["b", "a", "c"] }, { label: "Hai", keys: ["d", "e", "f", "g", "h", "i", "j"] }] }), null);
  });
  it("không có giai đoạn → null", () => assert.equal(activePhases({ stages: keys.map((k) => st(k)) }), null));
});

describe("mã giai đoạn", () => {
  it("phaseKey / isPhaseKey / phaseIndexOf", () => {
    assert.equal(phaseKey(2), "phase:2");
    assert.ok(isPhaseKey("phase:0") && !isPhaseKey("a") && !isPhaseKey(null));
    assert.equal(phaseIndexOf("phase:3"), 3);
    assert.equal(phaseIndexOf("phase:x"), null);
    assert.equal(phaseIndexOf("a"), null);
  });
  it("nhánh rẽ thuộc giai đoạn của bước gốc", () => {
    const m = stepToPhase(mk(), phases);
    assert.equal(m.get("c_blocked"), 0);
    assert.equal(m.get("e"), 1);
  });
});

describe("overviewProcess — mỗi giai đoạn một ô", () => {
  const o = overviewProcess(mk(), phases, (n) => `${n} bước`);
  it("3 ô nối tiếp một hàng", () => {
    assert.deepEqual(o.stages.map((s) => s.key), ["phase:0", "phase:1", "phase:2"]);
    assert.deepEqual(o.layout, [{ type: "chain", keys: ["phase:0", "phase:1", "phase:2"] }]);
    assert.equal(o.stages[0].who, "3 bước");
  });
  it("cộng số việc và lấy trạng thái xấu nhất (nhánh rẽ tính vào giai đoạn gốc)", () => {
    assert.deepEqual([o.stages[0].ok, o.stages[0].warn, o.stages[0].bad, o.stages[0].count, o.stages[0].status], [3, 2, 0, 5, "yellow"]);
    assert.deepEqual([o.stages[1].bad, o.stages[1].status], [1, "red"]);
    assert.deepEqual([o.stages[2].count, o.stages[2].status], [0, "grey"]);
  });
  it("việc xếp theo mức xấu trước", () => assert.deepEqual(o.stages[0].items.map((i) => i.level), ["warn", "warn", "ok", "ok", "ok"]));
  it("đường nối: bỏ cạnh trong cùng giai đoạn, gộp hai chiều giữa một cặp", () => {
    assert.deepEqual(o.observed_edges, [
      { from: "phase:0", to: "phase:1", n: 3, kind: "give" },
      { from: "phase:1", to: "phase:0", n: 1, kind: "back" },
      { from: "phase:1", to: "phase:2", n: 4, kind: "give" },
    ]);
  });
  it("không làm hỏng quy trình gốc", () => assert.equal(mk().stages.length, 11));
});

describe("phaseProcess — mở một giai đoạn", () => {
  it("chỉ các bước của giai đoạn (kèm nhánh rẽ), layout một hàng các bước chính", () => {
    const f = phaseProcess(mk(), phases, 0);
    assert.deepEqual(f.stages.map((s) => s.key), ["a", "b", "c", "c_blocked"]);
    assert.deepEqual(f.layout, [{ type: "chain", keys: ["a", "b", "c"] }]);
    assert.deepEqual(f.observed_edges, [{ from: "a", to: "b", n: 2, kind: "give" }]);
  });
});

describe("mapPathToPhases — dấu vết một việc ở mức giai đoạn", () => {
  it("các bước đã qua gộp theo giai đoạn, không lặp, đúng thứ tự", () => {
    const of = stepToPhase(mk(), phases);
    const r = mapPathToPhases({ visited: [{ key: "a" }, { key: "b" }, { key: "d" }], current: ["e", "f"] }, of);
    assert.deepEqual(r, { visited: [{ key: "phase:0" }, { key: "phase:1" }], current: ["phase:1"] });
    assert.equal(mapPathToPhases(null, of), null);
  });
});

describe("aggregateStage / mapObservedEdges", () => {
  it("bước thông tin (info_only) không tính vào tổng", () => {
    const a = aggregateStage([st("x", { ok: 1, count: 1 }), st("y", { warn: 5, count: 5, info_only: true })], "phase:9", "L", "w", "h");
    assert.deepEqual([a.ok, a.warn, a.count, a.status], [1, 0, 1, "green"]);
  });
  it("bỏ cạnh có đầu không thuộc giai đoạn nào", () => {
    assert.deepEqual(mapObservedEdges([{ from: "a", to: "zz", n: 1, kind: "give" }], (k) => (k === "a" ? "phase:0" : null)), []);
  });
});
