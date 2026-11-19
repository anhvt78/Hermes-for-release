import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assignableRoles,
  createFormLabelKey,
  defaultAssignableRole,
  parseRoleOptions,
  roleLabelKey,
  roleNeedsOrgUnit,
  showsHiddenRoleNote,
} from "../src/lib/role-options";

// ── assignableRoles ───────────────────────────────────────────────────────────

describe("assignableRoles(false)", () => {
  it("trả [chu_tich, chi_xem] và KHÔNG chứa truong_phong", () => {
    const roles = assignableRoles(false);
    assert.deepStrictEqual(roles, ["chu_tich", "chi_xem"]);
    assert.ok(!roles.includes("truong_phong"), "không được có truong_phong");
  });
});

describe("assignableRoles(true)", () => {
  it("trả 3 phần tử và có truong_phong", () => {
    const roles = assignableRoles(true);
    assert.strictEqual(roles.length, 3);
    assert.ok(roles.includes("truong_phong"), "phải có truong_phong");
  });
});

// ── defaultAssignableRole ─────────────────────────────────────────────────────

describe("defaultAssignableRole", () => {
  it("trả chi_xem và nằm trong cả hai danh sách", () => {
    const def = defaultAssignableRole();
    assert.strictEqual(def, "chi_xem");
    assert.ok(assignableRoles(false).includes(def), "phải có trong danh sách cờ tắt");
    assert.ok(assignableRoles(true).includes(def), "phải có trong danh sách cờ bật");
  });
});

// ── roleLabelKey ──────────────────────────────────────────────────────────────

describe("roleLabelKey", () => {
  it("truong_phong + cờ tắt -> roleDeptHeadAdvanced", () => {
    assert.strictEqual(roleLabelKey("truong_phong", false), "roleDeptHeadAdvanced");
  });

  it("truong_phong + cờ bật -> roleDeptHead", () => {
    assert.strictEqual(roleLabelKey("truong_phong", true), "roleDeptHead");
  });

  it("chu_tich -> roleChairman (bất kể cờ)", () => {
    assert.strictEqual(roleLabelKey("chu_tich", false), "roleChairman");
    assert.strictEqual(roleLabelKey("chu_tich", true), "roleChairman");
  });

  it("chi_xem -> roleReadOnly (bất kể cờ)", () => {
    assert.strictEqual(roleLabelKey("chi_xem", false), "roleReadOnly");
    assert.strictEqual(roleLabelKey("chi_xem", true), "roleReadOnly");
  });
});

// ── roleNeedsOrgUnit ──────────────────────────────────────────────────────────

describe("roleNeedsOrgUnit", () => {
  it("truong_phong -> true", () => {
    assert.ok(roleNeedsOrgUnit("truong_phong"));
  });

  it("chu_tich -> false", () => {
    assert.ok(!roleNeedsOrgUnit("chu_tich"));
  });

  it("chi_xem -> false", () => {
    assert.ok(!roleNeedsOrgUnit("chi_xem"));
  });
});

// ── showsHiddenRoleNote ───────────────────────────────────────────────────────

describe("showsHiddenRoleNote", () => {
  it("truong_phong + cờ tắt -> true", () => {
    assert.ok(showsHiddenRoleNote("truong_phong", false));
  });

  it("truong_phong + cờ bật -> false", () => {
    assert.ok(!showsHiddenRoleNote("truong_phong", true));
  });

  it("chu_tich -> false bất kể cờ", () => {
    assert.ok(!showsHiddenRoleNote("chu_tich", false));
    assert.ok(!showsHiddenRoleNote("chu_tich", true));
  });

  it("chi_xem -> false bất kể cờ", () => {
    assert.ok(!showsHiddenRoleNote("chi_xem", false));
    assert.ok(!showsHiddenRoleNote("chi_xem", true));
  });
});

// ── parseRoleOptions ──────────────────────────────────────────────────────────

describe("parseRoleOptions", () => {
  it("null -> mặc định an toàn: false + 2 phần tử không có truong_phong", () => {
    const result = parseRoleOptions(null);
    assert.strictEqual(result.deptHeadAssignable, false);
    assert.deepStrictEqual(result.roles, ["chu_tich", "chi_xem"]);
  });

  it("phản hồi đầy đủ từ API -> true + 3 vai trò", () => {
    const result = parseRoleOptions({
      dept_head_assignable: true,
      assignable_roles: ["chu_tich", "truong_phong", "chi_xem"],
    });
    assert.strictEqual(result.deptHeadAssignable, true);
    assert.strictEqual(result.roles.length, 3);
    assert.ok(result.roles.includes("truong_phong"));
  });

  it("assignable_roles là chuỗi rác -> false + 2 phần tử (không nổ)", () => {
    const result = parseRoleOptions({ assignable_roles: "rác" });
    assert.strictEqual(result.deptHeadAssignable, false);
    assert.strictEqual(result.roles.length, 2);
    assert.ok(!result.roles.includes("truong_phong"));
  });

  it("input không phải object -> không nổ, trả mặc định", () => {
    assert.doesNotThrow(() => parseRoleOptions(undefined));
    assert.doesNotThrow(() => parseRoleOptions(42));
    assert.doesNotThrow(() => parseRoleOptions("chuỗi"));
  });
});

// ── createFormLabelKey ────────────────────────────────────────────────────────

describe("createFormLabelKey", () => {
  it("chi_xem -> roleReadOnlyFull", () => {
    assert.strictEqual(createFormLabelKey("chi_xem"), "roleReadOnlyFull");
  });

  it("chu_tich -> roleChairman", () => {
    assert.strictEqual(createFormLabelKey("chu_tich"), "roleChairman");
  });

  it("truong_phong -> roleDeptHead", () => {
    assert.strictEqual(createFormLabelKey("truong_phong"), "roleDeptHead");
  });

  it("mã lạ -> roleReadOnlyFull (fallback)", () => {
    assert.strictEqual(createFormLabelKey("ma_la"), "roleReadOnlyFull");
  });
});
