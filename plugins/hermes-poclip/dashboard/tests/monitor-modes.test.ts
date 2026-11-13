import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MONITOR_MODES, normalizeMonitorMode, modeCanSpendTokens, countByMode } from "../src/lib/monitor-modes";
import { parseMonitorEvidence, hasMissingBoardWarning } from "../src/lib/monitor-evidence";

describe("monitor-modes — chế độ xử lý từng loại sự cố giám sát", () => {
  it("có đúng 4 chế độ, mã lạ/rỗng rơi về «giao agent» (hành vi cũ)", () => {
    assert.deepEqual([...MONITOR_MODES], ["off", "alert_only", "auto", "agent"]);
    assert.equal(normalizeMonitorMode("lung tung"), "agent");
    assert.equal(normalizeMonitorMode(null), "agent");
    assert.equal(normalizeMonitorMode("alert_only"), "alert_only");
  });
  it("chỉ «giao agent» luôn tốn token; «cân nhắc» có điều kiện; «chỉ báo» và «tắt» không", () => {
    assert.equal(modeCanSpendTokens("agent"), "always");
    assert.equal(modeCanSpendTokens("auto"), "conditional");
    assert.equal(modeCanSpendTokens("alert_only"), "never");
    assert.equal(modeCanSpendTokens("off"), "never");
  });
  it("đếm số loại theo chế độ", () => {
    assert.deepEqual(countByMode([{ response_mode: "agent" }, {}, { response_mode: "off" }, { response_mode: "auto" }, { response_mode: "x" }]),
      { off: 1, alert_only: 0, auto: 1, agent: 3 });
  });
});

describe("monitor-evidence — tóm tắt phiếu đề xuất cấu hình giám sát", () => {
  const raw = JSON.stringify({ total: 33, enabled: 19, disabled: 14, disabled_reasons: { "chưa_có_bảng_kanban": 14 }, without_scanner: 5, modes: { agent: 33 } });
  it("đọc được số liệu và nhận ra cảnh báo thiếu bảng Kanban", () => {
    const e = parseMonitorEvidence(raw)!;
    assert.equal(e.total, 33); assert.equal(e.enabled, 19); assert.equal(e.disabled, 14); assert.equal(e.withoutScanner, 5);
    assert.equal(hasMissingBoardWarning(e), true);
  });
  it("không có loại thiếu bảng thì không cảnh báo", () => {
    const e = parseMonitorEvidence(JSON.stringify({ total: 33, enabled: 33, disabled: 0 }))!;
    assert.equal(hasMissingBoardWarning(e), false);
    assert.deepEqual(e.disabledReasons, {});
  });
  it("dữ liệu hỏng/thiếu → null", () => {
    assert.equal(parseMonitorEvidence(null), null);
    assert.equal(parseMonitorEvidence("không phải json"), null);
    assert.equal(parseMonitorEvidence(JSON.stringify({ foo: 1 })), null);
  });
});
