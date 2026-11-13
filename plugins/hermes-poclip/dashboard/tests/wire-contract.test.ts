/** Wire-contract tests: verify wire.ts mappings and dict-fallback locale isolation. */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { heartbeatCounts, heartbeatCode } from "../src/i18n/wire";
import { labelFor } from "../src/lib/dict-fallback";
import { proposalHeadline, skippedRows } from "../src/lib/kanban-boards";
import { formatActionItemLine } from "../src/lib/minutes-conclusion";
import { meetingTurnSpeakerLabel, meetingTurnStatusLabel } from "../src/lib/display-labels";

const VI_CHAR_RE = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯ]/;

// ── (a) heartbeat wire mapping ────────────────────────────────────────────────

describe("wire — heartbeatCounts", () => {
  it("maps Vietnamese keys to stable codes", () => {
    const counts = heartbeatCounts({ total: 3, "thức": 2, "ngủ": 1, stale: 0 });
    assert.deepStrictEqual(counts, { total: 3, awake: 2, sleeping: 1, stale: 0 });
  });

  it("null input returns all zeros", () => {
    assert.deepStrictEqual(heartbeatCounts(null), { total: 0, awake: 0, sleeping: 0, stale: 0 });
  });
});

describe("wire — heartbeatCode", () => {
  it("ngủ → sleeping", () =>
    assert.equal(heartbeatCode("ngủ"), "sleeping"));
  it("thức → awake", () =>
    assert.equal(heartbeatCode("thức"), "awake"));
  it("stale → stale", () =>
    assert.equal(heartbeatCode("stale"), "stale"));
  it("unknown raw → unknown", () =>
    assert.equal(heartbeatCode("lạ"), "unknown"));
  it("null → unknown", () =>
    assert.equal(heartbeatCode(null), "unknown"));
});

// ── (b) labelFor locale isolation ────────────────────────────────────────────

describe("labelFor — locale isolation", () => {
  it("en kanbanBoards.statusApproved has no Vietnamese", () => {
    const s = labelFor("en", "kanbanBoards.statusApproved");
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("vi kanbanBoards.statusApproved has Vietnamese", () => {
    const s = labelFor("vi", "kanbanBoards.statusApproved");
    assert.ok(VI_CHAR_RE.test(s), `Expected Vietnamese in: ${s}`);
  });

  it("missing key returns the key itself (ASCII only)", () => {
    const key = "khong.ton.tai";
    const s = labelFor("en", key);
    assert.equal(s, key);
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in key: ${s}`);
  });

  it("{n} substitution works", () => {
    const s = labelFor("en", "meetingRoom.conclusionItemLineNo", 3);
    assert.ok(s.includes("3"), `Expected 3 in: ${s}`);
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("en meetingRoom.conclusionNoDue has no Vietnamese", () => {
    const s = labelFor("en", "meetingRoom.conclusionNoDue");
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });
});

// ── (c) proposalHeadline / skippedRows in en locale ──────────────────────────

describe("proposalHeadline — en locale (empty t)", () => {
  it("null proposal returns no Vietnamese", () => {
    const s = proposalHeadline(null, {});
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("approved status returns no Vietnamese", () => {
    const s = proposalHeadline({ id: "x", status: "approved" }, {});
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("rejected status returns no Vietnamese", () => {
    const s = proposalHeadline({ id: "x", status: "rejected" }, {});
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("pending status returns no Vietnamese", () => {
    const s = proposalHeadline(
      { id: "x", status: "pending", groups: [{ group: "g", slug: "co-g", name: "G", flow_count: 1 }] },
      {},
    );
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });
});

describe("skippedRows — en locale (empty t)", () => {
  it("reason fallback has no Vietnamese", () => {
    const rows = skippedRows({ skipped: [{ group: "san-pham", reason: "" }] }, {});
    assert.ok(rows.length === 1, "Expected 1 row");
    assert.ok(!VI_CHAR_RE.test(rows[0].reason), `Expected no Vietnamese in reason: ${rows[0].reason}`);
  });
});

// ── (d) formatActionItemLine en locale ───────────────────────────────────────

describe("formatActionItemLine — en locale", () => {
  it("with due_date and assignee_name has no Vietnamese", () => {
    const line = formatActionItemLine(
      { title: "Task A", assignee_id: "a", assignee_name: "Name", due_date: "2026-12-31" },
      "en",
    );
    assert.ok(!VI_CHAR_RE.test(line), `Expected no Vietnamese in: ${line}`);
    assert.ok(line.includes("Task A"), `Expected title in: ${line}`);
    assert.ok(line.includes("Name"), `Expected name in: ${line}`);
    assert.ok(line.includes("2026-12-31"), `Expected date in: ${line}`);
  });

  it("without assignee_name shows only id, no Vietnamese", () => {
    const line = formatActionItemLine(
      { title: "Task B", assignee_id: "agent_b", due_date: "48h" },
      "en",
    );
    assert.ok(!VI_CHAR_RE.test(line), `Expected no Vietnamese in: ${line}`);
    assert.ok(line.includes("agent_b"), `Expected id in: ${line}`);
  });
});

// ── (e) display-labels fallback — no Vietnamese when dict is empty ────────────

describe("meetingTurnSpeakerLabel — empty dict fallback", () => {
  it("human member_type returns no Vietnamese and includes 'human'", () => {
    const s = meetingTurnSpeakerLabel({} as any, "chu_tich", "Chairman", "human");
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
    assert.ok(s.includes("human"), `Expected 'human' in: ${s}`);
  });
});

describe("meetingTurnStatusLabel — empty dict fallback", () => {
  it("notified + human returns no Vietnamese", () => {
    const s = meetingTurnStatusLabel({} as any, { turn_result: "notified", member_type: "human" });
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });

  it("timeout + human returns no Vietnamese", () => {
    const s = meetingTurnStatusLabel({} as any, { turn_result: "timeout", member_type: "human" });
    assert.ok(!VI_CHAR_RE.test(s), `Expected no Vietnamese in: ${s}`);
  });
});
