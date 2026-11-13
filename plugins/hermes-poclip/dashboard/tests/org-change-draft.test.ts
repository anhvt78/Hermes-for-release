import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHANGE_TYPES,
  parseKpiLines,
  parseAuthorityLimit,
  buildOrgChangePayload,
  draftFromSuggestion,
} from "../src/lib/org-change-draft";

describe("CHANGE_TYPES — structure", () => {
  it("contains exactly 4 types in order", () => {
    assert.deepEqual([...CHANGE_TYPES], [
      "add_department",
      "add_role",
      "modify_role",
      "remove_role",
    ]);
  });
});

describe("parseKpiLines", () => {
  it("splits by newline", () => {
    assert.deepEqual(parseKpiLines("kpi1\nkpi2"), ["kpi1", "kpi2"]);
  });

  it("trims whitespace from each line", () => {
    assert.deepEqual(parseKpiLines("  kpi1  \n  kpi2  "), ["kpi1", "kpi2"]);
  });

  it("filters empty lines", () => {
    assert.deepEqual(parseKpiLines("kpi1\n\nkpi2\n"), ["kpi1", "kpi2"]);
  });

  it("empty string returns empty array", () => {
    assert.deepEqual(parseKpiLines(""), []);
  });

  it("single line without newline", () => {
    assert.deepEqual(parseKpiLines("Tỷ lệ lỗi < 1%"), ["Tỷ lệ lỗi < 1%"]);
  });
});

describe("parseAuthorityLimit", () => {
  it("parses plain digits", () => {
    assert.equal(parseAuthorityLimit("50000000"), 50_000_000);
  });

  it("strips commas and dots from formatted numbers", () => {
    assert.equal(parseAuthorityLimit("50,000,000"), 50_000_000);
  });

  it("returns null for empty string", () => {
    assert.equal(parseAuthorityLimit(""), null);
  });

  it("returns null for non-numeric string", () => {
    assert.equal(parseAuthorityLimit("không có"), null);
  });

  it("handles VND suffix text", () => {
    assert.equal(parseAuthorityLimit("50000000 VND"), 50_000_000);
  });
});

describe("buildOrgChangePayload", () => {
  it("includes all non-empty fields for add_role", () => {
    const payload = buildOrgChangePayload({
      change_type: "add_role",
      profile_id: "qa-lead-agent",
      role_type: "lead",
      org_unit: "phong qa",
      display_name_vi: "QA Lead",
      primary_goal: "Đảm bảo chất lượng sản phẩm",
      kpis: ["Tỷ lệ lỗi < 1%", "Độ phủ test > 80%"],
      authority_desc: "Phê duyệt bug fixes lên đến hạn mức",
      authority_limit: 50_000_000,
      reason: "",
    });
    assert.equal(payload.profile_id, "qa-lead-agent");
    assert.equal(payload.role_type, "lead");
    assert.equal(payload.org_unit, "phong qa");
    assert.deepEqual(payload.kpis, ["Tỷ lệ lỗi < 1%", "Độ phủ test > 80%"]);
    assert.deepEqual(payload.authority, {
      spending_limit_vnd: 50_000_000,
      note: "Phê duyệt bug fixes lên đến hạn mức",
    });
    assert.ok(!("reason" in payload), "reason should be excluded when empty");
  });

  it("excludes empty strings and null limit", () => {
    const payload = buildOrgChangePayload({
      change_type: "remove_role",
      profile_id: "ba-lead",
      role_type: "",
      org_unit: "",
      display_name_vi: "",
      primary_goal: "",
      kpis: [],
      authority_desc: "",
      authority_limit: null,
      reason: "Không còn nhu cầu",
    });
    assert.equal(payload.profile_id, "ba-lead");
    assert.equal(payload.reason, "Không còn nhu cầu");
    assert.ok(!("org_unit" in payload));
    assert.ok(!("role_type" in payload));
    assert.ok(!("kpis" in payload));
    assert.ok(!("authority" in payload));
  });

  it("includes authority when only desc is present (no limit)", () => {
    const payload = buildOrgChangePayload({
      change_type: "add_role",
      profile_id: "erp-lead-agent",
      role_type: "lead",
      org_unit: "phong erp",
      display_name_vi: "",
      primary_goal: "",
      kpis: [],
      authority_desc: "Phê duyệt chi phí vận hành",
      authority_limit: null,
      reason: "",
    });
    assert.deepEqual(payload.authority, { note: "Phê duyệt chi phí vận hành" });
  });
});

describe("draftFromSuggestion", () => {
  it("maps all suggestion fields to draft correctly", () => {
    const draft = draftFromSuggestion({
      change_type: "add_role",
      payload: {
        profile_id: "qa-lead-agent",
        role_type: "lead",
        org_unit: "phong qa",
        display_name_vi: "QA Lead",
        primary_goal: "Đảm bảo chất lượng",
        kpis: ["Test coverage > 80%"],
        authority: { note: "Phê duyệt", spending_limit_vnd: 50_000_000 },
      },
      evidence: [],
      notes: [],
    });
    assert.equal(draft.change_type, "add_role");
    assert.equal(draft.profile_id, "qa-lead-agent");
    assert.equal(draft.role_type, "lead");
    assert.deepEqual(draft.kpis, ["Test coverage > 80%"]);
    assert.equal(draft.authority_limit, 50_000_000);
    assert.equal(draft.authority_desc, "Phê duyệt");
  });

  it("uses empty string for missing change_type (null input)", () => {
    const draft = draftFromSuggestion({
      change_type: null,
      payload: {},
      evidence: [],
      notes: [],
    });
    assert.equal(draft.change_type, "");
    assert.equal(draft.profile_id, "");
    assert.equal(draft.authority_limit, null);
    assert.deepEqual(draft.kpis, []);
  });

  it("authority_limit is null when authority.spending_limit_vnd missing", () => {
    const draft = draftFromSuggestion({
      change_type: "modify_role",
      payload: { profile_id: "ba-lead", authority: { note: "some desc" } },
      evidence: [],
      notes: [],
    });
    assert.equal(draft.authority_limit, null);
    assert.equal(draft.authority_desc, "some desc");
  });
});
