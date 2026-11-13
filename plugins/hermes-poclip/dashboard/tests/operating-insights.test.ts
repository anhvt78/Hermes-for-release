import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  screenToTabId,
  criterionToI18nKey,
  normalizeHandbookStatus,
  handbookStaleTimestamp,
  computeStaffSummary,
  normalizeDrift,
  staffMissingCriteriaCsv,
  DRIFT_KIND_ORDER,
} from "../src/lib/operatingInsights";

describe("screenToTabId", () => {
  it("org-chart → org-chart", () => {
    assert.equal(screenToTabId("org-chart"), "org-chart");
  });
  it("inter-dept-flows → inter-dept-flows", () => {
    assert.equal(screenToTabId("inter-dept-flows"), "inter-dept-flows");
  });
  it("meeting-room → meeting-room", () => {
    assert.equal(screenToTabId("meeting-room"), "meeting-room");
  });
  it("flows-progress → flows-progress", () => {
    assert.equal(screenToTabId("flows-progress"), "flows-progress");
  });
  it("unknown screen → null", () => {
    assert.equal(screenToTabId("unknown-screen"), null);
  });
  it("empty string → null", () => {
    assert.equal(screenToTabId(""), null);
  });
});

describe("criterionToI18nKey", () => {
  it("role_card → criterionRoleCard", () => {
    assert.equal(criterionToI18nKey("role_card"), "criterionRoleCard");
  });
  it("unit_flow → criterionUnitFlow", () => {
    assert.equal(criterionToI18nKey("unit_flow"), "criterionUnitFlow");
  });
  it("reporting_cadence → criterionReportingCadence", () => {
    assert.equal(criterionToI18nKey("reporting_cadence"), "criterionReportingCadence");
  });
  it("unknown code → null", () => {
    assert.equal(criterionToI18nKey("unknown_code"), null);
  });
});

describe("normalizeHandbookStatus", () => {
  it("ok → ok", () => {
    assert.equal(normalizeHandbookStatus("ok"), "ok");
  });
  it("stale → stale", () => {
    assert.equal(normalizeHandbookStatus("stale"), "stale");
  });
  it("missing → missing", () => {
    assert.equal(normalizeHandbookStatus("missing"), "missing");
  });
  it("error → error", () => {
    assert.equal(normalizeHandbookStatus("error"), "error");
  });
  it("unknown value → error", () => {
    assert.equal(normalizeHandbookStatus("some_other_status"), "error");
  });
  it("empty string → error", () => {
    assert.equal(normalizeHandbookStatus(""), "error");
  });
});

describe("handbookStaleTimestamp", () => {
  it("config_changed_at present → returns it", () => {
    assert.equal(
      handbookStaleTimestamp("2026-09-01T00:00:00Z", "2026-08-01T00:00:00Z"),
      "2026-09-01T00:00:00Z",
    );
  });
  it("config_changed_at null, confirmed_at present → returns confirmed_at", () => {
    assert.equal(
      handbookStaleTimestamp(null, "2026-08-01T00:00:00Z"),
      "2026-08-01T00:00:00Z",
    );
  });
  it("config_changed_at undefined, confirmed_at present → returns confirmed_at", () => {
    assert.equal(
      handbookStaleTimestamp(undefined, "2026-08-15T00:00:00Z"),
      "2026-08-15T00:00:00Z",
    );
  });
  it("both null → returns null", () => {
    assert.equal(handbookStaleTimestamp(null, null), null);
  });
  it("both undefined → returns null", () => {
    assert.equal(handbookStaleTimestamp(undefined, undefined), null);
  });
});

describe("computeStaffSummary", () => {
  it("invariant holds when loaded + missing_count == total", () => {
    const result = computeStaffSummary({ loaded: 7, missing_count: 3, total: 10 });
    assert.equal(result.loaded, 7);
    assert.equal(result.total, 10);
    assert.equal(result.invariantOk, true);
  });
  it("invariant fails when loaded + missing_count != total", () => {
    const result = computeStaffSummary({ loaded: 7, missing_count: 2, total: 10 });
    assert.equal(result.invariantOk, false);
  });
  it("all loaded → invariantOk true", () => {
    const result = computeStaffSummary({ loaded: 5, missing_count: 0, total: 5 });
    assert.equal(result.invariantOk, true);
    assert.equal(result.loaded, 5);
  });
  it("total 0 → invariantOk true", () => {
    const result = computeStaffSummary({ loaded: 0, missing_count: 0, total: 0 });
    assert.equal(result.invariantOk, true);
  });
});

describe("normalizeDrift", () => {
  it("always returns exactly 4 items in DRIFT_KIND_ORDER", () => {
    const result = normalizeDrift([]);
    assert.equal(result.length, 4);
    for (let i = 0; i < 4; i++) {
      assert.equal(result[i].kind, DRIFT_KIND_ORDER[i]);
    }
  });

  it("fills missing kinds with count 0 and empty defaults", () => {
    const result = normalizeDrift([]);
    for (const item of result) {
      assert.equal(item.count, 0);
      assert.deepEqual(item.breakdown, {});
      assert.deepEqual(item.samples, []);
      assert.equal(item.link, null);
    }
  });

  it("maps item by kind correctly", () => {
    const result = normalizeDrift([
      {
        kind: "unit_without_flow",
        count: 3,
        samples: [{ ref: "hr", title: "HR dept", pair: null, days_overdue: null }],
        link: { screen: "inter-dept-flows", ref: null },
      },
    ]);
    const item = result.find((r) => r.kind === "unit_without_flow")!;
    assert.equal(item.count, 3);
    assert.equal(item.samples.length, 1);
    assert.equal(item.samples[0].ref, "hr");
    assert.deepEqual(item.link, { screen: "inter-dept-flows", ref: null });
  });

  it("caps samples at 5", () => {
    const manySamples = Array.from({ length: 8 }, (_, i) => ({
      ref: `ref-${i}`,
      title: null,
      pair: null,
      days_overdue: null,
    }));
    const result = normalizeDrift([
      { kind: "unregulated_pair", count: 8, samples: manySamples, link: null },
    ]);
    const item = result.find((r) => r.kind === "unregulated_pair")!;
    assert.equal(item.samples.length, 5);
  });

  it("normalizes null fields in samples", () => {
    const result = normalizeDrift([
      {
        kind: "overdue_beyond_threshold",
        count: 1,
        samples: [{ ref: "task-1" }],
        link: null,
      },
    ]);
    const item = result.find((r) => r.kind === "overdue_beyond_threshold")!;
    assert.equal(item.samples[0].title, null);
    assert.equal(item.samples[0].pair, null);
    assert.equal(item.samples[0].days_overdue, null);
  });

  it("threshold fields default to empty/zero/false when missing", () => {
    const result = normalizeDrift([
      { kind: "overdue_beyond_threshold", count: 2 },
    ]);
    const item = result.find((r) => r.kind === "overdue_beyond_threshold")!;
    assert.equal(item.threshold_key, "");
    assert.equal(item.threshold_days, 0);
    assert.equal(item.threshold_default, false);
  });

  it("preserves all 4 kinds when all are present", () => {
    const items = DRIFT_KIND_ORDER.map((kind, i) => ({
      kind,
      count: i + 1,
    }));
    const result = normalizeDrift(items);
    assert.equal(result.length, 4);
    assert.equal(result[0].count, 1);
    assert.equal(result[1].count, 2);
    assert.equal(result[2].count, 3);
    assert.equal(result[3].count, 4);
  });
});

describe("staffMissingCriteriaCsv — field is 'missing', not 'criteria'", () => {
  it("two criteria → CSV joined by comma", () => {
    assert.equal(staffMissingCriteriaCsv(["role_card", "reporting_cadence"]), "role_card,reporting_cadence");
  });
  it("single criterion → no comma", () => {
    assert.equal(staffMissingCriteriaCsv(["unit_flow"]), "unit_flow");
  });
  it("empty array → empty string", () => {
    assert.equal(staffMissingCriteriaCsv([]), "");
  });
  it("undefined → empty string", () => {
    assert.equal(staffMissingCriteriaCsv(undefined), "");
  });
  it("null → empty string", () => {
    assert.equal(staffMissingCriteriaCsv(null), "");
  });

  it("real payload — chu_tich missing role_card + reporting_cadence", () => {
    const entry = {
      profile_id: "chu_tich",
      name: "chu_tich",
      org_unit: "executive",
      unit_label: "Điều hành",
      missing: ["role_card", "reporting_cadence"],
      link: { screen: "org-chart", ref: "chu_tich" },
    };
    assert.equal(staffMissingCriteriaCsv(entry.missing), "role_card,reporting_cadence");
  });

  it("real payload — ops-agent missing unit_flow only", () => {
    const entry = {
      profile_id: "ops-agent",
      name: "Ops Agent",
      org_unit: "infrastructure_ops",
      unit_label: "Hạ tầng & Vận hành",
      missing: ["unit_flow"],
      link: { screen: "inter-dept-flows", ref: "infrastructure_ops" },
    };
    assert.equal(staffMissingCriteriaCsv(entry.missing), "unit_flow");
  });
});

describe("normalizeDrift — real payload from fixture f2_drift.db", () => {
  const realThreshold = {
    key: "action_overdue_days",
    value: 0,
    unit: "day",
    source: "cfg_settings.monitor_thresholds",
    is_default: true,
  };

  const realItems = [
    {
      kind: "unregulated_pair",
      count: 1,
      samples: [
        { ref: "v-task-5", title: "Viec thu v-task-5", pair: "qa->tech_product" },
      ],
      link: { screen: "inter-dept-flows", ref: "qa->tech_product" },
    },
    {
      kind: "unit_without_flow",
      count: 2,
      samples: [
        { ref: "qa", label: "QA" },
        { ref: "infrastructure_ops", label: "Hạ tầng & Vận hành" },
      ],
      link: { screen: "inter-dept-flows", ref: null },
    },
    {
      kind: "meeting_config_mismatch",
      count: 3,
      samples: [
        { ref: "m-override", title: "Hop standup ghi de che do noi", reasons: ["override_mismatch"] },
        { ref: "m-inactive", title: "Hop chien luoc dung mau da tat", reasons: ["inactive_template"] },
        { ref: "m-session", title: "Hop standup vuot tran thoi luong", reasons: ["invalid_schedule", "session_over_max"] },
      ],
      link: { screen: "meeting-room", ref: null },
      breakdown: { inactive_template: 1, override_mismatch: 1, session_over_max: 1, invalid_schedule: 1 },
    },
    {
      kind: "overdue_beyond_threshold",
      count: 4,
      samples: [
        { ref: "v-task-1", title: "Viec thu v-task-1", days_overdue: 51 },
        { ref: "v-task-2", title: "Viec thu v-task-2", days_overdue: 47 },
        { ref: "v-task-5", title: "Viec thu v-task-5", days_overdue: 42 },
        { ref: "v-task-7", title: "Viec thu v-task-7", days_overdue: 40 },
      ],
      link: { screen: "flows-progress", ref: "progress" },
    },
  ];

  const normalized = normalizeDrift(realItems, realThreshold);

  it("returns exactly 4 items in DRIFT_KIND_ORDER", () => {
    assert.equal(normalized.length, 4);
    for (let i = 0; i < 4; i++) {
      assert.equal(normalized[i].kind, DRIFT_KIND_ORDER[i]);
    }
  });

  it("unregulated_pair: count=1, sample has title and pair", () => {
    const item = normalized[0];
    assert.equal(item.kind, "unregulated_pair");
    assert.equal(item.count, 1);
    assert.equal(item.samples[0].ref, "v-task-5");
    assert.equal(item.samples[0].title, "Viec thu v-task-5");
    assert.equal(item.samples[0].pair, "qa->tech_product");
  });

  it("unit_without_flow: count=2, samples carry label (not title)", () => {
    const item = normalized[1];
    assert.equal(item.kind, "unit_without_flow");
    assert.equal(item.count, 2);
    assert.equal(item.samples[0].ref, "qa");
    assert.equal(item.samples[0].label, "QA");
    assert.equal(item.samples[0].title, null);
    assert.equal(item.samples[1].label, "Hạ tầng & Vận hành");
  });

  it("meeting_config_mismatch: count=3, has breakdown and reasons per sample", () => {
    const item = normalized[2];
    assert.equal(item.kind, "meeting_config_mismatch");
    assert.equal(item.count, 3);
    assert.deepEqual(item.breakdown, {
      inactive_template: 1,
      override_mismatch: 1,
      session_over_max: 1,
      invalid_schedule: 1,
    });
    assert.deepEqual(item.samples[0].reasons, ["override_mismatch"]);
    assert.deepEqual(item.samples[1].reasons, ["inactive_template"]);
    assert.deepEqual(item.samples[2].reasons, ["invalid_schedule", "session_over_max"]);
  });

  it("overdue_beyond_threshold: threshold from drift.threshold (not per-item)", () => {
    const item = normalized[3];
    assert.equal(item.kind, "overdue_beyond_threshold");
    assert.equal(item.count, 4);
    assert.equal(item.threshold_key, "action_overdue_days");
    assert.equal(item.threshold_days, 0);
    assert.equal(item.threshold_default, true);
  });

  it("overdue_beyond_threshold: samples carry days_overdue", () => {
    const item = normalized[3];
    assert.equal(item.samples[0].ref, "v-task-1");
    assert.equal(item.samples[0].days_overdue, 51);
    assert.equal(item.samples[1].days_overdue, 47);
    assert.equal(item.samples[2].days_overdue, 42);
    assert.equal(item.samples[3].days_overdue, 40);
  });
});
