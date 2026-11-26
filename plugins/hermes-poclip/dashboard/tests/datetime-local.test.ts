import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { localDateTimeInputToIso } from "../src/lib/datetime-local";

describe("localDateTimeInputToIso — ca hợp lệ", () => {
  it("2026-09-25T14:30 trả chuỗi ISO hợp lệ giữ nguyên giờ địa phương", () => {
    const result = localDateTimeInputToIso("2026-09-25T14:30");
    assert.ok(typeof result === "string", "kết quả phải là chuỗi");
    const dt = new Date(result!);
    assert.equal(dt.getFullYear(), 2026);
    assert.equal(dt.getMonth(), 8);
    assert.equal(dt.getDate(), 25);
    assert.equal(dt.getHours(), 14);
    assert.equal(dt.getMinutes(), 30);
  });

  it("kết quả kết thúc bằng ':00.000Z' (giây và mili giây bằng 0)", () => {
    const result = localDateTimeInputToIso("2026-09-25T14:30");
    assert.ok(typeof result === "string");
    assert.ok(result!.endsWith(":00.000Z"), `kết quả: ${result}`);
  });
});

describe("localDateTimeInputToIso — ca rỗng / null / undefined", () => {
  it("chuỗi rỗng → undefined", () => {
    assert.equal(localDateTimeInputToIso(""), undefined);
  });
  it("chuỗi chỉ khoảng trắng → undefined", () => {
    assert.equal(localDateTimeInputToIso("   "), undefined);
  });
  it("null → undefined", () => {
    assert.equal(localDateTimeInputToIso(null), undefined);
  });
  it("undefined → undefined", () => {
    assert.equal(localDateTimeInputToIso(undefined), undefined);
  });
});

describe("localDateTimeInputToIso — ca không đúng định dạng", () => {
  it("'2026-09-25' (thiếu giờ) → undefined", () => {
    assert.equal(localDateTimeInputToIso("2026-09-25"), undefined);
  });
  it("'2026-09-25T14:30:00' (có giây) → undefined", () => {
    assert.equal(localDateTimeInputToIso("2026-09-25T14:30:00"), undefined);
  });
  it("'abc' → undefined", () => {
    assert.equal(localDateTimeInputToIso("abc"), undefined);
  });
});

describe("localDateTimeInputToIso — ca ngày không tồn tại", () => {
  it("'2026-02-31T10:00' (ngày không tồn tại) → undefined", () => {
    assert.equal(localDateTimeInputToIso("2026-02-31T10:00"), undefined);
  });
});
