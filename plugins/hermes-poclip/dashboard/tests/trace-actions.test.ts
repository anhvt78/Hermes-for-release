import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { traceActionLabel } from "../src/lib/traceActions";

const fakeT = {
  taskTrace: {
    actions: {
      created: "X-created",
      done: "X-done",
      rejected: "X-rejected",
      runStarted: "X-runStarted",
      runFinished: "X-runFinished",
      directive: "X-directive",
      ack: "X-ack",
      report: "X-report",
      auditCheck: (e: string) => `X-audit:${e}`,
    },
  },
};

// ── kanban labels ─────────────────────────────────────────────────────────────

describe("traceActionLabel — kanban", () => {
  it("Tạo task → X-created", () =>
    assert.equal(traceActionLabel("kanban", "Tạo task", fakeT), "X-created"));
  it("Hoàn thành task → X-done", () =>
    assert.equal(traceActionLabel("kanban", "Hoàn thành task", fakeT), "X-done"));
  it("Từ chối task → X-rejected", () =>
    assert.equal(traceActionLabel("kanban", "Từ chối task", fakeT), "X-rejected"));
  it("Bắt đầu thực thi → X-runStarted", () =>
    assert.equal(traceActionLabel("kanban", "Bắt đầu thực thi", fakeT), "X-runStarted"));
  it("Kết thúc thực thi → X-runFinished", () =>
    assert.equal(traceActionLabel("kanban", "Kết thúc thực thi", fakeT), "X-runFinished"));
});

// ── comm_log labels ───────────────────────────────────────────────────────────

describe("traceActionLabel — comm_log", () => {
  it("Chỉ đạo → X-directive", () =>
    assert.equal(traceActionLabel("comm_log", "Chỉ đạo", fakeT), "X-directive"));
  it("Xác nhận → X-ack", () =>
    assert.equal(traceActionLabel("comm_log", "Xác nhận", fakeT), "X-ack"));
  it("Báo cáo → X-report", () =>
    assert.equal(traceActionLabel("comm_log", "Báo cáo", fakeT), "X-report"));
});

// ── audit_log labels ──────────────────────────────────────────────────────────

describe("traceActionLabel — audit_log", () => {
  it("Kiểm tra audit: spot_check → X-audit:spot_check", () =>
    assert.equal(traceActionLabel("audit_log", "Kiểm tra audit: spot_check", fakeT), "X-audit:spot_check"));
  it("audit_log với chuỗi không có tiền tố → nguyên văn", () =>
    assert.equal(traceActionLabel("audit_log", "something else", fakeT), "something else"));
});

// ── fallback / edge cases ─────────────────────────────────────────────────────

describe("traceActionLabel — fallback", () => {
  it("source lạ + action lạ → nguyên văn", () =>
    assert.equal(traceActionLabel("unknown_source", "abc xyz", fakeT), "abc xyz"));
  it("kanban + action không khớp → nguyên văn", () =>
    assert.equal(traceActionLabel("kanban", "unknown action", fakeT), "unknown action"));
  it("t rỗng {} → nguyên văn (không throw)", () =>
    assert.equal(traceActionLabel("kanban", "Tạo task", {}), "Tạo task"));
  it("t thiếu khoá actions → nguyên văn", () =>
    assert.equal(traceActionLabel("kanban", "Tạo task", { taskTrace: {} }), "Tạo task"));
  it("chuỗi rỗng → rỗng", () =>
    assert.equal(traceActionLabel("kanban", "", fakeT), ""));
  it("t = undefined → nguyên văn (không throw)", () =>
    assert.equal(traceActionLabel("comm_log", "Chỉ đạo", undefined), "Chỉ đạo"));
});

// ── action_code (new server) ──────────────────────────────────────────────────

describe("traceActionLabel — action_code từ server mới", () => {
  it("kanban action_code=created → X-created (dù action lạ)", () =>
    assert.equal(traceActionLabel("kanban", "Bất kỳ", fakeT, "created"), "X-created"));

  it("kanban action_code=done → X-done", () =>
    assert.equal(traceActionLabel("kanban", "Bất kỳ", fakeT, "done"), "X-done"));

  it("kanban action_code=runStarted → X-runStarted", () =>
    assert.equal(traceActionLabel("kanban", "Bất kỳ", fakeT, "runStarted"), "X-runStarted"));

  it("comm_log action_code=directive → X-directive", () =>
    assert.equal(traceActionLabel("comm_log", "Bất kỳ", fakeT, "directive"), "X-directive"));

  it("audit_log action_code=auditCheck + audit_event_type → X-audit:spot_check", () =>
    assert.equal(
      traceActionLabel("audit_log", "Bất kỳ", fakeT, "auditCheck", "spot_check"),
      "X-audit:spot_check",
    ));

  it("audit_log action_code=auditCheck không có audit_event_type → X-audit:", () =>
    assert.equal(
      traceActionLabel("audit_log", "Bất kỳ", fakeT, "auditCheck", undefined),
      "X-audit:",
    ));

  it("action_code không tìm thấy trong actions → fallback nguyên văn", () =>
    assert.equal(traceActionLabel("kanban", "Tạo task", fakeT, "unknownCode"), "Tạo task"));
});

// ── server cũ (không có action_code) hoạt động như trước ─────────────────────

describe("traceActionLabel — backward compat server cũ", () => {
  it("kanban Tạo task không có action_code → vẫn ra X-created", () =>
    assert.equal(traceActionLabel("kanban", "Tạo task", fakeT, undefined), "X-created"));

  it("audit_log với tiền tố Kiểm tra audit không có action_code → vẫn hoạt động", () =>
    assert.equal(
      traceActionLabel("audit_log", "Kiểm tra audit: periodic", fakeT, undefined),
      "X-audit:periodic",
    ));
});
