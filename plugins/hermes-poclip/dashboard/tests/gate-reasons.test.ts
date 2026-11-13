import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gateTone, isNotableGate, onlyNotableTurns, type GateDecision } from "../src/lib/aiActivityFilters";

const d = (kind: GateDecision["kind"]): GateDecision => ({ kind });

describe("isNotableGate", () => {
  it("bị chặn hoặc liên quan xin phép là đáng chú ý", () => {
    for (const k of ["denied_rule", "denied_constitution", "denied_other", "approval_used", "approval_requested", "approval_waiting", "approval_rejected"] as const) {
      assert.equal(isNotableGate(d(k)), true, k);
    }
  });
  it("cho phép bình thường thì không", () => {
    for (const k of ["allowed_rule", "allowed_default", "allowed_no_policy"] as const) assert.equal(isNotableGate(d(k)), false, k);
  });
  it("không có thông tin → không đáng chú ý", () => {
    assert.equal(isNotableGate(null), false);
    assert.equal(isNotableGate(undefined), false);
    assert.equal(isNotableGate({} as any), false);
  });
});

describe("gateTone", () => {
  it("màu theo mức", () => {
    assert.equal(gateTone("denied_rule"), "danger");
    assert.equal(gateTone("approval_rejected"), "danger");
    assert.equal(gateTone("approval_requested"), "warning");
    assert.equal(gateTone("approval_waiting"), "warning");
    assert.equal(gateTone("approval_used"), "accent");
    assert.equal(gateTone("allowed_rule"), "success");
    assert.equal(gateTone("allowed_default"), "muted");
    assert.equal(gateTone(undefined), "muted");
  });
});

describe("onlyNotableTurns", () => {
  const turns = [
    { id: 1, role: "user", tool_calls: [] },
    { id: 2, role: "assistant", tool_calls: [{ id: "a", decision: d("allowed_default") }, { id: "b", decision: d("denied_rule") }] },
    { id: 3, role: "assistant", tool_calls: [{ id: "c", decision: d("allowed_rule") }, { id: "x", decision: null }] },
    { id: 4, role: "assistant", tool_calls: [{ id: "e", decision: d("approval_used") }] },
    { id: 5, role: "assistant" },
  ];
  it("chỉ giữ lượt có lệnh đáng chú ý, và trong lượt chỉ giữ các lệnh đó", () => {
    const out = onlyNotableTurns(turns as any);
    assert.deepEqual(out.map((t: any) => t.id), [2, 4]);
    assert.deepEqual((out[0] as any).tool_calls.map((c: any) => c.id), ["b"]);
  });
  it("không sửa dữ liệu gốc", () => {
    const copy = JSON.stringify(turns);
    onlyNotableTurns(turns as any);
    assert.equal(JSON.stringify(turns), copy);
  });
  it("danh sách rỗng", () => assert.deepEqual(onlyNotableTurns([]), []));
});
