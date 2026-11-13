import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { severityTone, sortReadiness, statusTone, toggleDuty, type ReadinessAgent } from "../src/lib/readiness";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = (id: string, status: ReadinessAgent["status"], sev: ("info" | "warn" | "critical")[] = [], unit = "u"): ReadinessAgent => ({
  profile_id: id, name: id, org_unit: unit, role: null, lifecycle_stage: "design", status,
  tasks: { total: 0, done: 0, open: 0, blocked: 0 }, last_work_hours: null, tools: { declared: 0, real: 0, unavailable: [] },
  duties: [], accepts_events: [], kpi: null, issues: sev.map((s, i) => ({ code: `c${i}`, severity: s })),
});

describe("readiness helpers", () => {
  it("lists label-only first, then waiting, then working; worst issues first inside a group", () => {
    const out = sortReadiness([agent("w", "working"), agent("l2", "label_only", ["info"]), agent("wait", "waiting"), agent("l1", "label_only", ["critical"])]);
    assert.deepEqual(out.map((a) => a.profile_id), ["l1", "l2", "wait", "w"]);
  });
  it("does not mutate its input", () => {
    const input = [agent("b", "working"), agent("a", "label_only")];
    sortReadiness(input);
    assert.deepEqual(input.map((a) => a.profile_id), ["b", "a"]);
  });
  it("maps status and severity to tones", () => {
    assert.equal(statusTone("working"), "success");
    assert.equal(statusTone("waiting"), "warning");
    assert.equal(statusTone("label_only"), "destructive");
    assert.equal(severityTone("critical"), "destructive");
    assert.equal(severityTone("warn"), "warning");
    assert.equal(severityTone("info"), "secondary");
  });
  it("toggles a duty on and off without duplicates", () => {
    assert.deepEqual(toggleDuty([], "b", false), ["b"]);
    assert.deepEqual(toggleDuty(["b"], "a", false), ["a", "b"]);
    assert.deepEqual(toggleDuty(["a", "b"], "a", true), ["b"]);
    assert.deepEqual(toggleDuty(["b"], "b", false), ["b"]);
  });
});

describe("readiness panel wiring", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
  it("is shown on the quality page and saves through the autonomy endpoint", () => {
    assert.match(src("pages/QualityBoard.tsx"), /<ReadinessPanel \/>/);
    assert.match(src("components/ReadinessPanel.tsx"), /\/api\/v1\/quality\/autonomy/);
  });
  it("locks the checkboxes while saving and for non-chairman viewers", () => {
    const s = src("components/ReadinessPanel.tsx");
    assert.ok((s.match(/disabled=\{!data\.can_edit \|\| saving\}/g) ?? []).length >= 3);
  });
  it("onboarding step 3 offers the starter sets and shows the warnings", () => {
    const s = src("pages/OnboardingWizard.tsx");
    assert.match(s, /\/api\/v1\/wizard\/tool-presets/);
    assert.match(s, /warnNoKanban/);
  });
});
