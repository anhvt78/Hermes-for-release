/** P1.7: Tests for dashboard/src/lib/minutes-conclusion.ts */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defectsForItems,
  buildConclusionPayload,
  formatActionItemLine,
  type ActionItemInput,
} from "../src/lib/minutes-conclusion";

// ── defectsForItems ───────────────────────────────────────────────────────────

describe("defectsForItems", () => {
  it("valid iso date and assignee → no defects", () => {
    const items: ActionItemInput[] = [
      { title: "Việc 1", assignee_id: "agent_a", due_date: "2026-12-31" },
    ];
    assert.deepEqual(defectsForItems(items), []);
  });

  it("valid hours format 48h → no defects", () => {
    const items: ActionItemInput[] = [
      { title: "Việc nhanh", assignee_id: "agent_b", due_date: "48h" },
    ];
    assert.deepEqual(defectsForItems(items), []);
  });

  it("valid hours format '48 giờ' → no defects", () => {
    const items: ActionItemInput[] = [
      { title: "Việc dài", assignee_id: "agent_c", due_date: "48 giờ" },
    ];
    assert.deepEqual(defectsForItems(items), []);
  });

  it("missing assignee → error code 'assignee'", () => {
    const items: ActionItemInput[] = [
      { title: "Việc X", assignee_id: null, due_date: "2026-11-01" },
    ];
    const defects = defectsForItems(items);
    assert.equal(defects.length, 1);
    assert.equal(defects[0].index, 1);
    assert.ok(defects[0].missing.includes("assignee"));
  });

  it("missing due_date → error code 'due_date'", () => {
    const items: ActionItemInput[] = [
      { title: "Việc Y", assignee_id: "agent_a", due_date: null },
    ];
    const defects = defectsForItems(items);
    assert.equal(defects.length, 1);
    assert.ok(defects[0].missing.includes("due_date"));
  });

  it("invalid due_date format → error code 'due_date_invalid'", () => {
    const items: ActionItemInput[] = [
      { title: "Việc Z", assignee_id: "agent_a", due_date: "cuối tháng" },
    ];
    const defects = defectsForItems(items);
    assert.equal(defects.length, 1);
    assert.ok(defects[0].missing.includes("due_date_invalid"));
  });

  it("mixed items — only invalid ones appear in defects", () => {
    const items: ActionItemInput[] = [
      { title: "OK", assignee_id: "agent_a", due_date: "2026-10-15" },
      { title: "No assignee", assignee_id: null, due_date: "2026-10-15" },
      { title: "No due", assignee_id: "agent_b", due_date: "" },
    ];
    const defects = defectsForItems(items);
    assert.equal(defects.length, 2);
    assert.deepEqual(defects.map((d) => d.index), [2, 3]);
  });

  it("empty items array → no defects", () => {
    assert.deepEqual(defectsForItems([]), []);
  });
});

// ── buildConclusionPayload ────────────────────────────────────────────────────

describe("buildConclusionPayload", () => {
  it("trims decisions and filters blanks", () => {
    const decisions = ["  Quyết định A  ", "", "Quyết định B"];
    const payload = buildConclusionPayload(decisions, []);
    assert.deepEqual(payload.decisions, ["Quyết định A", "Quyết định B"]);
  });

  it("passes items through unchanged", () => {
    const item: ActionItemInput = { title: "Việc 1", assignee_id: "a", due_date: "2026-12-31" };
    const payload = buildConclusionPayload(["D"], [item]);
    assert.equal(payload.action_items.length, 1);
    assert.equal(payload.action_items[0].title, "Việc 1");
  });

  it("empty decisions → empty array", () => {
    assert.deepEqual(buildConclusionPayload([], []).decisions, []);
  });
});

// ── formatActionItemLine ──────────────────────────────────────────────────────

describe("formatActionItemLine", () => {
  it("with assignee_name shows name and id", () => {
    const line = formatActionItemLine({
      title: "Việc A",
      assignee_id: "agent_a",
      assignee_name: "Agent Alpha",
      due_date: "2026-12-31",
    });
    assert.ok(line.includes("Việc A"), `expected title in: ${line}`);
    assert.ok(line.includes("Agent Alpha"), `expected name in: ${line}`);
    assert.ok(line.includes("agent_a"), `expected id in: ${line}`);
    assert.ok(line.includes("2026-12-31"), `expected date in: ${line}`);
  });

  it("without assignee_name shows only id", () => {
    const line = formatActionItemLine({
      title: "Việc B",
      assignee_id: "agent_b",
      due_date: "48h",
    });
    assert.ok(line.includes("agent_b"), `expected id in: ${line}`);
    assert.ok(line.includes("48h"), `expected due in: ${line}`);
  });

  it("missing due_date shows EN placeholder (default locale)", () => {
    const line = formatActionItemLine({
      title: "Việc C",
      assignee_id: "agent_c",
    });
    assert.ok(line.includes("no due date"), `expected EN placeholder in: ${line}`);
    assert.ok(!line.includes("chưa có hạn"), `expected no VI text in: ${line}`);
  });

  it("missing due_date shows VI placeholder when locale is vi", () => {
    const line = formatActionItemLine({
      title: "Việc C",
      assignee_id: "agent_c",
    }, "vi");
    assert.ok(line.includes("chưa có hạn"), `expected VI placeholder in: ${line}`);
  });

  it("missing assignee_id shows dash", () => {
    const line = formatActionItemLine({
      title: "Việc D",
      due_date: "2026-10-01",
    });
    assert.ok(line.includes("—"), `expected dash in: ${line}`);
  });
});
