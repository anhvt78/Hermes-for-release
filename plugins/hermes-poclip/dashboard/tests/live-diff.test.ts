import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { changedNodes, changedStages, clockOf, newEventKeys, type ProcSnap } from "../src/lib/liveDiff";

const snap = (ok: number, warn = 0, bad = 0, running = 0): ProcSnap[] => [{ id: "work", stages: [{ key: "run", ok, warn, bad, running }, { key: "done", ok: 1, warn: 0, bad: 0 }] }];

describe("liveDiff", () => {
  it("lần đầu không nhấp sáng gì", () => {
    assert.equal(changedStages(null, snap(1)).size, 0);
    assert.equal(changedNodes(null, [{ id: "a", status: "done" }]).size, 0);
    assert.equal(newEventKeys(null, [{ key: "k" }]).size, 0);
  });

  it("chỉ bước đổi số liệu hoặc số việc đang chạy mới nhấp sáng", () => {
    assert.deepEqual([...changedStages(snap(1, 0, 0, 1), snap(1, 0, 0, 1))], []);
    assert.deepEqual([...changedStages(snap(1, 0, 0, 1), snap(2, 0, 0, 1))], ["work:run"]);
    assert.deepEqual([...changedStages(snap(1, 0, 0, 1), snap(1, 0, 0, 0))], ["work:run"]);
    assert.deepEqual([...changedStages(snap(1, 0, 0), snap(1, 1, 0))], ["work:run"]);
  });

  it("bước hoặc quy trình mới xuất hiện không bị coi là «vừa đổi»", () => {
    const next: ProcSnap[] = [...snap(1), { id: "new", stages: [{ key: "x", ok: 5, warn: 0, bad: 0 }] }];
    assert.equal(changedStages(snap(1), next).size, 0);
  });

  it("thẻ đổi trạng thái hoặc mới xuất hiện thì được đánh dấu kèm trạng thái mới", () => {
    const prev = [{ id: "a", status: "running" }, { id: "b", status: "ready" }];
    const next = [{ id: "a", status: "done" }, { id: "b", status: "ready" }, { id: "c", status: "ready" }];
    assert.deepEqual([...changedNodes(prev, next)], [["a", "done"], ["c", "ready"]]);
  });

  it("chỉ sự kiện chưa thấy mới là mới", () => {
    assert.deepEqual([...newEventKeys(new Set(["a", "b"]), [{ key: "c" }, { key: "b" }, { key: "d" }])], ["c", "d"]);
  });

  it("đồng hồ có hai chữ số mỗi phần", () => {
    const d = new Date(2026, 10, 3, 9, 5, 7);
    assert.equal(clockOf(d.getTime() / 1000), "09:05:07");
  });
});
