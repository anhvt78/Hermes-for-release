import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateMeetingConfig,
  mapServerConfigErrors,
  isConfigValidationFailure,
  type MeetingConfigGuardValues,
  type MeetingConfigGuardMessages,
  type ServerConfigErrorMessages,
} from "../src/lib/meeting-config-guard";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// ── Stub formatters ───────────────────────────────────────────────────────────

const stubGuard: MeetingConfigGuardMessages = {
  timeCapNotNumber: (raw) => `NOT_NUMBER:${raw}`,
  timeCapOutOfRange: (got, min, max) => `OUT_OF_RANGE:${got}:${min}:${max}`,
  timeCapBelowTemplateDefault: (name, got, def) => `BELOW_DEFAULT:${name}:${got}:${def}`,
  roundsNotNumber: (raw) => `ROUNDS_NOT_NUMBER:${raw}`,
  roundsOutOfRange: (got, min, max) => `ROUNDS_OUT_OF_RANGE:${got}:${min}:${max}`,
  roundsUnlimitedNeedsTimeCap: () => "ROUNDS_UNLIMITED_NEEDS_CAP",
  turnTimeoutNotNumber: (raw) => `TURN_NOT_NUMBER:${raw}`,
  turnTimeoutOutOfRange: (got, min, max) => `TURN_OUT_OF_RANGE:${got}:${min}:${max}`,
};

const stubServer: ServerConfigErrorMessages = {
  timeCapBelowTemplateDefault: (name, got, def) => `SRV_BELOW_DEFAULT:${name}:${got}:${def}`,
  timeCapOutOfRange: (got, min, max) => `SRV_OUT_OF_RANGE:${got}:${min}:${max}`,
  roundsOutOfRange: (got, min, max) => `SRV_ROUNDS_OOR:${got}:${min}:${max}`,
  roundsUnlimitedNeedsTimeCap: () => "SRV_ROUNDS_UNLIMITED",
  turnTimeoutOutOfRange: (got, min, max) => `SRV_TURN_OOR:${got}:${min}:${max}`,
  rejected: (code) => code ? `SRV_REJECTED:${code}` : "SRV_REJECTED",
};

function makeValues(overrides: Partial<MeetingConfigGuardValues> = {}): MeetingConfigGuardValues {
  return {
    timeCapOv: "",
    roundsOv: "",
    turnTimeoutOv: "",
    templateDefaultDuration: null,
    effectiveMaxDuration: null,
    templateName: "Họp chiến lược",
    ...overrides,
  };
}

// ── 1. Hợp lệ → [] ───────────────────────────────────────────────────────────

describe("validateMeetingConfig — hợp lệ trả []", () => {
  it("(a) không nhập gì → []", () => {
    const errs = validateMeetingConfig(makeValues(), stubGuard);
    assert.deepEqual(errs, []);
  });

  it("(b) trần = đúng mặc định mẫu strategy 30 → []", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "30", templateDefaultDuration: 30 }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });

  it("(c) trần > mặc định (45 > 30) → []", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "45", templateDefaultDuration: 30 }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });

  it("(d) số vòng 2 và trần rỗng → []", () => {
    const errs = validateMeetingConfig(
      makeValues({ roundsOv: "2" }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });

  it("(e) số vòng 0 nhưng có trần hợp lệ 30 → []", () => {
    const errs = validateMeetingConfig(
      makeValues({ roundsOv: "0", timeCapOv: "30" }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });
});

// ── 2. Lỗi trần ───────────────────────────────────────────────────────────────

describe("validateMeetingConfig — lỗi trần thời lượng", () => {
  it("15 với mặc định 30 → 1 lỗi chứa tham số 30 và 15", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "15", templateDefaultDuration: 30 }),
      stubGuard,
    );
    assert.equal(errs.length, 1);
    assert.ok(errs[0].includes("30"), `lỗi phải chứa 30: ${errs[0]}`);
    assert.ok(errs[0].includes("15"), `lỗi phải chứa 15: ${errs[0]}`);
    assert.ok(errs[0].startsWith("BELOW_DEFAULT:"), `phải là BELOW_DEFAULT: ${errs[0]}`);
  });

  it("0 → lỗi khoảng (0 < 1)", () => {
    const errs = validateMeetingConfig(makeValues({ timeCapOv: "0" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("OUT_OF_RANGE:"), `phải là OUT_OF_RANGE: ${errs[0]}`);
  });

  it("-5 → lỗi khoảng", () => {
    const errs = validateMeetingConfig(makeValues({ timeCapOv: "-5" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("OUT_OF_RANGE:"));
  });

  it("5000 → lỗi khoảng (5000 > 1440)", () => {
    const errs = validateMeetingConfig(makeValues({ timeCapOv: "5000" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("OUT_OF_RANGE:"));
  });

  it("1441 → lỗi khoảng", () => {
    const errs = validateMeetingConfig(makeValues({ timeCapOv: "1441" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("OUT_OF_RANGE:"));
  });

  it('"abc" → lỗi không phải số', () => {
    const errs = validateMeetingConfig(makeValues({ timeCapOv: "abc" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("NOT_NUMBER:"));
  });

  it("1 → hợp lệ khi mẫu không có mặc định", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "1", templateDefaultDuration: null }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });
});

// ── 3. Lỗi vòng ───────────────────────────────────────────────────────────────

describe("validateMeetingConfig — lỗi số vòng", () => {
  it("7 → lỗi khoảng (7 > 5)", () => {
    const errs = validateMeetingConfig(makeValues({ roundsOv: "7" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("ROUNDS_OUT_OF_RANGE:"));
  });

  it('"-1" → lỗi khoảng', () => {
    const errs = validateMeetingConfig(makeValues({ roundsOv: "-1" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("ROUNDS_OUT_OF_RANGE:"));
  });

  it('"x" → lỗi không phải số', () => {
    const errs = validateMeetingConfig(makeValues({ roundsOv: "x" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("ROUNDS_NOT_NUMBER:"));
  });

  it("rounds 0 + trần rỗng + effectiveMaxDuration null → lỗi bắt buộc có trần", () => {
    const errs = validateMeetingConfig(
      makeValues({ roundsOv: "0", timeCapOv: "", effectiveMaxDuration: null }),
      stubGuard,
    );
    assert.equal(errs.length, 1);
    assert.equal(errs[0], "ROUNDS_UNLIMITED_NEEDS_CAP");
  });

  it("rounds 0 + trần rỗng + effectiveMaxDuration 30 → KHÔNG lỗi", () => {
    const errs = validateMeetingConfig(
      makeValues({ roundsOv: "0", timeCapOv: "", effectiveMaxDuration: 30 }),
      stubGuard,
    );
    assert.deepEqual(errs, []);
  });

  it('rounds 0 + trần "abc" → tính là không có trần → lỗi bắt buộc có trần', () => {
    const errs = validateMeetingConfig(
      makeValues({ roundsOv: "0", timeCapOv: "abc", effectiveMaxDuration: null }),
      stubGuard,
    );
    // "abc" triggers NOT_NUMBER, then rounds 0 triggers NEEDS_CAP
    assert.ok(errs.includes("ROUNDS_UNLIMITED_NEEDS_CAP"), `phải có NEEDS_CAP: ${JSON.stringify(errs)}`);
  });
});

// ── 4. Kết hợp ────────────────────────────────────────────────────────────────

describe("validateMeetingConfig — kết hợp", () => {
  it("trần 15 (mặc định 30) và số vòng 7 → 2 lỗi, trần trước vòng sau", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "15", templateDefaultDuration: 30, roundsOv: "7" }),
      stubGuard,
    );
    assert.equal(errs.length, 2);
    assert.ok(errs[0].startsWith("BELOW_DEFAULT:"), `lỗi đầu phải là BELOW_DEFAULT: ${errs[0]}`);
    assert.ok(errs[1].startsWith("ROUNDS_OUT_OF_RANGE:"), `lỗi sau phải là ROUNDS_OOR: ${errs[1]}`);
  });
});

// ── 4b. Thời gian lượt (turn_timeout_seconds) ────────────────────────────────

describe("validateMeetingConfig — turn timeout", () => {
  it('"600" → 1 lỗi khoảng 60-420, truyền đúng tham số', () => {
    const errs = validateMeetingConfig(makeValues({ turnTimeoutOv: "600" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("TURN_OUT_OF_RANGE:"), `phải là TURN_OUT_OF_RANGE: ${errs[0]}`);
    assert.ok(errs[0].includes(":600:"), `phải chứa giá trị 600: ${errs[0]}`);
    assert.ok(errs[0].includes(":60:"), `phải chứa min 60: ${errs[0]}`);
    assert.ok(errs[0].includes(":420"), `phải chứa max 420: ${errs[0]}`);
  });

  it('"300" → không lỗi', () => {
    const errs = validateMeetingConfig(makeValues({ turnTimeoutOv: "300" }), stubGuard);
    assert.deepEqual(errs, []);
  });

  it('"59" → lỗi khoảng', () => {
    const errs = validateMeetingConfig(makeValues({ turnTimeoutOv: "59" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("TURN_OUT_OF_RANGE:"));
  });

  it('"421" → lỗi khoảng', () => {
    const errs = validateMeetingConfig(makeValues({ turnTimeoutOv: "421" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("TURN_OUT_OF_RANGE:"));
  });

  it('"abc" → lỗi không phải số', () => {
    const errs = validateMeetingConfig(makeValues({ turnTimeoutOv: "abc" }), stubGuard);
    assert.equal(errs.length, 1);
    assert.ok(errs[0].startsWith("TURN_NOT_NUMBER:"));
  });

  it('mapServerConfigErrors chuỗi thật "turn_timeout_seconds must be ≥ 60 and ≤ 420 (got 600)" → câu chứa 60, 420, 600, không chứa {', () => {
    const raw = '422: {"detail":{"validation_errors":["turn_timeout_seconds must be ≥ 60 and ≤ 420 (got 600)"]}}';
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.ok(result[0].includes("60"), `phải chứa 60: ${result[0]}`);
    assert.ok(result[0].includes("420"), `phải chứa 420: ${result[0]}`);
    assert.ok(result[0].includes("600"), `phải chứa 600: ${result[0]}`);
    assert.ok(!result[0].includes("{"), `KHÔNG được chứa '{': ${result[0]}`);
  });

  it("kết hợp: trần 15 (mặc định 30) + turn timeout 600 + số vòng 7 → đúng 3 lỗi theo thứ tự", () => {
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "15", templateDefaultDuration: 30, turnTimeoutOv: "600", roundsOv: "7" }),
      stubGuard,
    );
    assert.equal(errs.length, 3);
    assert.ok(errs[0].startsWith("BELOW_DEFAULT:"), `lỗi 1 phải là BELOW_DEFAULT: ${errs[0]}`);
    assert.ok(errs[1].startsWith("TURN_OUT_OF_RANGE:"), `lỗi 2 phải là TURN_OUT_OF_RANGE: ${errs[1]}`);
    assert.ok(errs[2].startsWith("ROUNDS_OUT_OF_RANGE:"), `lỗi 3 phải là ROUNDS_OUT_OF_RANGE: ${errs[2]}`);
  });
});

// ── 5. mapServerConfigErrors ─────────────────────────────────────────────────

describe("mapServerConfigErrors", () => {
  it("chuỗi 422 thật với max_duration_minutes (15) must be >= default_duration_minutes (30)", () => {
    const raw = '422: {"detail":{"error":"config_validation","validation_errors":["max_duration_minutes (15) must be >= default_duration_minutes (30)"]}}';
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.ok(result[0].includes("30"), `phải chứa 30: ${result[0]}`);
    assert.ok(result[0].includes("15"), `phải chứa 15: ${result[0]}`);
    assert.ok(!result[0].includes("{"), `KHÔNG được chứa '{': ${result[0]}`);
    assert.ok(!result[0].includes("}"), `KHÔNG được chứa '}': ${result[0]}`);
  });

  it("chuỗi max_duration_minutes must be between 1 and 1440 (got 5000)", () => {
    const raw = '422: {"detail":{"validation_errors":["max_duration_minutes must be between 1 and 1440 (got 5000)"]}}';
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.ok(result[0].startsWith("SRV_OUT_OF_RANGE:"), `kết quả: ${result[0]}`);
    assert.ok(result[0].includes("5000"), `phải chứa 5000: ${result[0]}`);
  });

  it("discussion_rounds must be between 0 and 5 (got 7) không có JSON", () => {
    const raw = "discussion_rounds must be between 0 and 5 (got 7)";
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.ok(result[0].startsWith("SRV_ROUNDS_OOR:"), `kết quả: ${result[0]}`);
    assert.ok(result[0].includes("7"), `phải chứa 7: ${result[0]}`);
  });

  it("discussion_rounds=0 (unlimited) requires max_duration_minutes as backstop", () => {
    const raw = '422: {"detail":{"validation_errors":["discussion_rounds=0 (unlimited) requires max_duration_minutes as backstop"]}}';
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.equal(result[0], "SRV_ROUNDS_UNLIMITED");
  });

  it("chuỗi rỗng → 1 câu tổng quát KHÔNG chứa {", () => {
    const result = mapServerConfigErrors("", stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.equal(result[0], "SRV_REJECTED");
    assert.ok(!result[0].includes("{"), `KHÔNG được chứa '{': ${result[0]}`);
  });

  it("500: Internal Server Error → 1 câu tổng quát KHÔNG chứa {", () => {
    const result = mapServerConfigErrors("500: Internal Server Error", stubServer, "Họp chiến lược");
    assert.equal(result.length, 1);
    assert.ok(!result[0].includes("{"), `KHÔNG được chứa '{': ${result[0]}`);
  });

  it("mảng nhiều dòng (1 lạ + 1 quen) → 2 câu, dòng lạ thành câu tổng quát", () => {
    const raw = JSON.stringify({
      detail: {
        validation_errors: [
          "some unknown error",
          "max_duration_minutes (15) must be >= default_duration_minutes (30)",
        ],
      },
    });
    const result = mapServerConfigErrors(raw, stubServer, "Họp chiến lược");
    assert.equal(result.length, 2);
    assert.equal(result[0], "SRV_REJECTED");
    assert.ok(result[1].startsWith("SRV_BELOW_DEFAULT:"), `dòng quen: ${result[1]}`);
  });
});

// ── 6. isConfigValidationFailure ─────────────────────────────────────────────

describe("isConfigValidationFailure", () => {
  it("body 422 thật với validation_errors → true", () => {
    const raw = '422: {"detail":{"error":"config_validation","validation_errors":["max_duration_minutes (15) must be >= default_duration_minutes (30)"]}}';
    assert.equal(isConfigValidationFailure(raw), true);
  });

  it("422 với validation_errors không có error code → true", () => {
    const raw = '422: {"detail":{"validation_errors":["max_duration_minutes must be between 1 and 1440 (got 5000)"]}}';
    assert.equal(isConfigValidationFailure(raw), true);
  });

  it("422 với detail.error === config_validation (không có validation_errors) → true", () => {
    const raw = '422: {"detail":{"error":"config_validation"}}';
    assert.equal(isConfigValidationFailure(raw), true);
  });

  it("500: Internal Server Error → false", () => {
    assert.equal(isConfigValidationFailure("500: Internal Server Error"), false);
  });

  it("Failed to fetch → false", () => {
    assert.equal(isConfigValidationFailure("Failed to fetch"), false);
  });

  it("chuỗi rỗng → false", () => {
    assert.equal(isConfigValidationFailure(""), false);
  });

  it("422 với detail.error === quorum_value_out_of_range → false", () => {
    const raw = '422: {"detail":{"error":"quorum_value_out_of_range"}}';
    assert.equal(isConfigValidationFailure(raw), false);
  });
});

// ── 7. Từ điển thật (vi/en) ──────────────────────────────────────────────────

describe("validateMeetingConfig — từ điển thật vi + en", () => {
  it("vi: trần 15 với mặc định strategy 30 → câu tiếng Việt đúng", () => {
    const mr = vi.meetingRoom as Record<string, unknown>;
    const msg: MeetingConfigGuardMessages = {
      timeCapNotNumber: mr.meetingConfigGuardTimeCapNotNumber as (raw: string) => string,
      timeCapOutOfRange: mr.meetingConfigGuardTimeCapOutOfRange as (got: string, min: number, max: number) => string,
      timeCapBelowTemplateDefault: mr.meetingConfigGuardTimeCapBelowTemplateDefault as (name: string, got: number, def: number) => string,
      roundsNotNumber: mr.meetingConfigGuardRoundsNotNumber as (raw: string) => string,
      roundsOutOfRange: mr.meetingConfigGuardRoundsOutOfRange as (got: string, min: number, max: number) => string,
      roundsUnlimitedNeedsTimeCap: mr.meetingConfigGuardRoundsUnlimitedNeedsTimeCap as () => string,
    };
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "15", templateDefaultDuration: 30, templateName: "Họp chiến lược" }),
      msg,
    );
    assert.equal(errs.length, 1);
    assert.ok(errs[0].includes("mặc định 30 phút"), `câu phải có "mặc định 30 phút": ${errs[0]}`);
    assert.ok(errs[0].includes("đang đặt 15 phút"), `câu phải có "đang đặt 15 phút": ${errs[0]}`);
  });

  it("en: trần 15 với mặc định strategy 30 → câu tiếng Anh đúng", () => {
    const mr = en.meetingRoom;
    const msg: MeetingConfigGuardMessages = {
      timeCapNotNumber: mr.meetingConfigGuardTimeCapNotNumber,
      timeCapOutOfRange: mr.meetingConfigGuardTimeCapOutOfRange,
      timeCapBelowTemplateDefault: mr.meetingConfigGuardTimeCapBelowTemplateDefault,
      roundsNotNumber: mr.meetingConfigGuardRoundsNotNumber,
      roundsOutOfRange: mr.meetingConfigGuardRoundsOutOfRange,
      roundsUnlimitedNeedsTimeCap: mr.meetingConfigGuardRoundsUnlimitedNeedsTimeCap,
    };
    const errs = validateMeetingConfig(
      makeValues({ timeCapOv: "15", templateDefaultDuration: 30, templateName: "Strategy Session" }),
      msg,
    );
    assert.equal(errs.length, 1);
    assert.ok(errs[0].includes("defaults to 30 min"), `câu phải có "defaults to 30 min": ${errs[0]}`);
    assert.ok(errs[0].includes("you entered 15 min"), `câu phải có "you entered 15 min": ${errs[0]}`);
  });
});
