import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeSessionLimitView } from "../src/lib/session-limits";
import type { BackendLimits, SessionLimitFormatters } from "../src/lib/session-limits";

const fmt: SessionLimitFormatters = {
  rule: (r, m) => `${r}r/${m}m`,
  formulaTemplate: (n, t, r, total) => `${n}x${t.toFixed(2)}x${r}+5=${total.toFixed(2)}`,
  formulaRounding: (y) => `->ceil${y}`,
  warnBothUnlimited: "BOTH_UNLIMITED",
  warnOverflow: (needed, cap) => `OVERFLOW:${needed}>${cap}`,
};

const baseLimits: BackendLimits = {
  rounds_cap: 5,
  time_cap_effective: 120,
  turn_timeout_seconds: 300,
  warning: null,
};

describe("computeSessionLimitView — không nhập tay", () => {
  it("trả về giá trị từ backend khi không có override", () => {
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: baseLimits, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.roundsCap, 5);
    assert.equal(view.timeCapEffective, 120);
    assert.equal(view.turnTimeoutSec, 300);
    assert.equal(view.source, "auto");
    assert.equal(view.rule, "5r/120m");
    // 3 × 5.00 × 5 + 5 = 80.00 min, ceil = 80 → không cần rounding suffix
    assert.equal(view.formula, "3x5.00x5+5=80.00");
    assert.equal(view.warning, null);
  });

  it("trả về null khi limits là null", () => {
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: null, memberCount: 3 },
      fmt,
    );
    assert.equal(view, null);
  });
});

describe("computeSessionLimitView — nhập tay tràn nhỏ hơn công thức (có cảnh báo overflow)", () => {
  it("cảnh báo khi timeOv < công thức tính được", () => {
    // 3 × 5.00 × 5 + 5 = 80 min, nhưng tràn = 10 min → overflow
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "10", limits: baseLimits, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.timeCapEffective, 10);
    assert.equal(view.source, "manual");
    assert.ok(view.warning?.startsWith("OVERFLOW:"));
    assert.ok(view.warning?.includes(">10"));
  });

  it("cảnh báo overflow cũng xảy ra khi override cả rounds lẫn tràn", () => {
    // 4 × 5.00 × 10 + 5 = 205 min, tràn = 30 min
    const view = computeSessionLimitView(
      { roundsOv: "10", turnTimeoutOv: "", timeOv: "30", limits: baseLimits, memberCount: 4 },
      fmt,
    );
    assert.ok(view);
    assert.ok(view.warning?.startsWith("OVERFLOW:"));
  });
});

describe("computeSessionLimitView — nhập tay tràn lớn hơn công thức (không cảnh báo)", () => {
  it("không cảnh báo khi timeOv lớn hơn công thức", () => {
    // 3 × 5.00 × 5 + 5 = 80 min, tràn = 120 min → không overflow
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "120", limits: baseLimits, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.timeCapEffective, 120);
    assert.equal(view.warning, null);
  });

  it("không cảnh báo khi công thức đúng bằng tràn", () => {
    // 3 × 5.00 × 5 + 5 = 80 min, tràn = 80 → không overflow (không phải >)
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "80", limits: baseLimits, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.warning, null);
  });
});

describe("computeSessionLimitView — rounds=0 và không có tràn thời gian", () => {
  it("cảnh báo cả hai vô hạn khi rounds_cap=0 và time_cap_effective=0", () => {
    const limitsNoLimit: BackendLimits = { rounds_cap: 0, time_cap_effective: 0, turn_timeout_seconds: 300 };
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: limitsNoLimit, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.warning, "BOTH_UNLIMITED");
  });

  it("cảnh báo vô hạn khi override về 0 không được chấp nhận (0 không phải số nguyên > 0)", () => {
    // roundsOv = "0" bị parse bỏ qua (không phải > 0), nên dùng limits.rounds_cap = 0
    const limitsNoLimit: BackendLimits = { rounds_cap: 0, time_cap_effective: 0, turn_timeout_seconds: 300 };
    const view = computeSessionLimitView(
      { roundsOv: "0", turnTimeoutOv: "", timeOv: "0", limits: limitsNoLimit, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.roundsCap, 0);
    assert.equal(view.timeCapEffective, 0);
    assert.equal(view.warning, "BOTH_UNLIMITED");
  });
});

describe("computeSessionLimitView — input rác không throw", () => {
  it("chuỗi rỗng, chữ cái, số âm không throw và coi như không nhập tay", () => {
    const cases = [
      { roundsOv: "abc", turnTimeoutOv: "xyz", timeOv: "!" },
      { roundsOv: "-1", turnTimeoutOv: "-5", timeOv: "-10" },
      { roundsOv: "", turnTimeoutOv: "", timeOv: "" },
      { roundsOv: "1.5", turnTimeoutOv: "0", timeOv: "0" },
      { roundsOv: "NaN", turnTimeoutOv: "Infinity", timeOv: " " },
    ];
    for (const c of cases) {
      assert.doesNotThrow(() => {
        computeSessionLimitView({ ...c, limits: baseLimits, memberCount: 3 }, fmt);
      });
      const view = computeSessionLimitView({ ...c, limits: baseLimits, memberCount: 3 }, fmt);
      // Dữ liệu rác → dùng giá trị từ limits
      assert.ok(view);
      assert.equal(view.roundsCap, baseLimits.rounds_cap);
    }
  });
});

describe("computeSessionLimitView — đổi số người làm cảnh báo xuất hiện/biến mất", () => {
  // limits: 5 rounds, 300s/turn, 120 min cap
  // memberCount=1: 1 × 5 × 5 + 5 = 30 min ≤ 120 → không cảnh báo
  // memberCount=12: 12 × 5 × 5 + 5 = 305 min > 120 → overflow
  it("ít người → không cảnh báo overflow", () => {
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: baseLimits, memberCount: 1 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.warning, null);
  });

  it("nhiều người → cảnh báo overflow xuất hiện", () => {
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: baseLimits, memberCount: 12 },
      fmt,
    );
    assert.ok(view);
    assert.ok(view.warning?.startsWith("OVERFLOW:"));
  });

  it("tăng tràn thời gian → cảnh báo biến mất", () => {
    // 12 × 5 × 5 + 5 = 305 min, tràn = 400 → không overflow
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "400", limits: baseLimits, memberCount: 12 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.warning, null);
  });
});

describe("computeSessionLimitView — formula rounding suffix", () => {
  it("hiển thị suffix làm tròn khi tổng có phần thập phân", () => {
    // 3 × (310/60) × 5 + 5 = 82.5 min → ceil = 83 → có suffix
    const limitsOdd: BackendLimits = { rounds_cap: 5, time_cap_effective: 120, turn_timeout_seconds: 310 };
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: limitsOdd, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.ok(view.formula.includes("->ceil83"), `Expected ceil suffix in formula: ${view.formula}`);
  });

  it("không có suffix khi tổng là số nguyên", () => {
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: baseLimits, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.ok(!view.formula.includes("->ceil"), `Did not expect ceil suffix in: ${view.formula}`);
  });
});

describe("computeSessionLimitView — backend warning làm fallback", () => {
  it("dùng backend warning khi không có cảnh báo local", () => {
    const limitsWithWarn: BackendLimits = {
      rounds_cap: 5,
      time_cap_effective: 120,
      turn_timeout_seconds: 300,
      warning: "BACKEND_WARN",
    };
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: limitsWithWarn, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.equal(view.warning, "BACKEND_WARN");
  });

  it("local overflow ưu tiên hơn backend warning", () => {
    const limitsWithWarn: BackendLimits = {
      rounds_cap: 5,
      time_cap_effective: 10,
      turn_timeout_seconds: 300,
      warning: "BACKEND_WARN",
    };
    const view = computeSessionLimitView(
      { roundsOv: "", turnTimeoutOv: "", timeOv: "", limits: limitsWithWarn, memberCount: 3 },
      fmt,
    );
    assert.ok(view);
    assert.ok(view.warning?.startsWith("OVERFLOW:"), `Expected OVERFLOW, got: ${view.warning}`);
  });
});
