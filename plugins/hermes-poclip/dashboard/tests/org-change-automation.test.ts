import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orgStructureEffectKey, ORG_CHANGE_TIER_LEGEND } from "../src/lib/org-change-automation";

// ── orgStructureEffectKey ──────────────────────────────────────────────────────

describe("orgStructureEffectKey — 3 chế độ + fallback", () => {
  it("mode 'manual' → automationOrgStructureEffectManual", () => {
    assert.equal(orgStructureEffectKey("manual"), "automationOrgStructureEffectManual");
  });

  it("mode 'semi' → automationOrgStructureEffectSemi", () => {
    assert.equal(orgStructureEffectKey("semi"), "automationOrgStructureEffectSemi");
  });

  it("mode 'auto' → automationOrgStructureEffectAuto", () => {
    assert.equal(orgStructureEffectKey("auto"), "automationOrgStructureEffectAuto");
  });

  it("mode lạ → automationOrgStructureEffectManual (an toàn)", () => {
    assert.equal(orgStructureEffectKey("unknown_mode"), "automationOrgStructureEffectManual");
    assert.equal(orgStructureEffectKey(""), "automationOrgStructureEffectManual");
    assert.equal(orgStructureEffectKey("SEMI"), "automationOrgStructureEffectManual");
  });
});

// ── ORG_CHANGE_TIER_LEGEND ────────────────────────────────────────────────────

const VALID_CHANGE_TYPES = new Set(["add_role", "add_department", "modify_role", "remove_role"]);
const VALID_VARIANTS = new Set(["light", "reporting", "lead"]);
const VALID_TIERS = new Set(["T0", "T1", "T2", "T3"]);

describe("ORG_CHANGE_TIER_LEGEND — cấu trúc hợp lệ", () => {
  it("có đủ 8 mục (4 changeType × các variant)", () => {
    assert.equal(ORG_CHANGE_TIER_LEGEND.length, 8);
  });

  it("mỗi mục có changeType hợp lệ", () => {
    for (const item of ORG_CHANGE_TIER_LEGEND) {
      assert.ok(
        VALID_CHANGE_TYPES.has(item.changeType),
        `changeType không hợp lệ: ${item.changeType}`,
      );
    }
  });

  it("mỗi mục có variant hợp lệ", () => {
    for (const item of ORG_CHANGE_TIER_LEGEND) {
      assert.ok(
        VALID_VARIANTS.has(item.variant),
        `variant không hợp lệ: ${item.variant} (changeType=${item.changeType})`,
      );
    }
  });

  it("mỗi mục có tier hợp lệ", () => {
    for (const item of ORG_CHANGE_TIER_LEGEND) {
      assert.ok(
        VALID_TIERS.has(item.tier),
        `tier không hợp lệ: ${item.tier} (changeType=${item.changeType})`,
      );
    }
  });

  it("bảng chứa đủ 4 loại thay đổi", () => {
    const types = new Set(ORG_CHANGE_TIER_LEGEND.map((i) => i.changeType));
    assert.ok(types.has("add_role"), "thiếu add_role");
    assert.ok(types.has("add_department"), "thiếu add_department");
    assert.ok(types.has("modify_role"), "thiếu modify_role");
    assert.ok(types.has("remove_role"), "thiếu remove_role");
  });

  it("add_department luôn là T3", () => {
    const items = ORG_CHANGE_TIER_LEGEND.filter((i) => i.changeType === "add_department");
    assert.ok(items.length > 0, "add_department không có trong legend");
    for (const item of items) {
      assert.equal(item.tier, "T3", "add_department phải là T3");
    }
  });

  it("có mục T1 cho add_role worker", () => {
    const light = ORG_CHANGE_TIER_LEGEND.find(
      (i) => i.changeType === "add_role" && i.variant === "light",
    );
    assert.ok(light, "thiếu add_role/light");
    assert.equal(light!.tier, "T1");
  });

  it("có mục T0 cho modify_role light", () => {
    const t0 = ORG_CHANGE_TIER_LEGEND.find(
      (i) => i.changeType === "modify_role" && i.variant === "light",
    );
    assert.ok(t0, "thiếu modify_role/light");
    assert.equal(t0!.tier, "T0");
  });
});
