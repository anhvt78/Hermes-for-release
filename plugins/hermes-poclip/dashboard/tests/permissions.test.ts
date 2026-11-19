import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  tabsForRole,
  defaultTabForRole,
  can,
  canDissolveCompany,
  canManageOrg,
} from "../src/lib/permissions";

// ── tabsForRole ───────────────────────────────────────────────────────────────

describe("tabsForRole", () => {
  it("null → null (không giới hạn)", () => {
    assert.equal(tabsForRole(null), null);
  });

  it("undefined → null (không giới hạn)", () => {
    assert.equal(tabsForRole(undefined), null);
  });

  it("chu_tich → null (không giới hạn)", () => {
    assert.equal(tabsForRole("chu_tich"), null);
  });

  it("vai_tro_la → null (không giới hạn)", () => {
    assert.equal(tabsForRole("vai_tro_la"), null);
  });

  it("truong_phong → 8 tab cố định", () => {
    const tabs = tabsForRole("truong_phong");
    assert.ok(Array.isArray(tabs), "phải là mảng");
    assert.equal(tabs!.length, 8);
    assert.deepEqual(tabs, [
      "flows-progress",
      "approval-queue",
      "goal-tree",
      "org-chart",
      "quality-board",
      "projects",
      "meeting-room",
      "notifications",
    ]);
  });

  it("chi_xem → 8 tab cố định (audit-trail thay projects)", () => {
    const tabs = tabsForRole("chi_xem");
    assert.ok(Array.isArray(tabs), "phải là mảng");
    assert.equal(tabs!.length, 8);
    assert.deepEqual(tabs, [
      "flows-progress",
      "approval-queue",
      "goal-tree",
      "org-chart",
      "quality-board",
      "audit-trail",
      "meeting-room",
      "notifications",
    ]);
  });

  it("truong_phong thấy projects, chi_xem thấy audit-trail (khác nhau)", () => {
    const tp = tabsForRole("truong_phong")!;
    const cx = tabsForRole("chi_xem")!;
    assert.ok(tp.includes("projects"), "truong_phong phải có projects");
    assert.ok(!tp.includes("audit-trail"), "truong_phong không có audit-trail");
    assert.ok(cx.includes("audit-trail"), "chi_xem phải có audit-trail");
    assert.ok(!cx.includes("projects"), "chi_xem không có projects");
  });
});

// ── defaultTabForRole ─────────────────────────────────────────────────────────

describe("defaultTabForRole", () => {
  it("null → null (giữ hành vi cũ)", () => {
    assert.equal(defaultTabForRole(null), null);
  });

  it("chu_tich → null (giữ hành vi cũ)", () => {
    assert.equal(defaultTabForRole("chu_tich"), null);
  });

  it("truong_phong → flows-progress (việc đến hạn)", () => {
    assert.equal(defaultTabForRole("truong_phong"), "flows-progress");
  });

  it("chi_xem → audit-trail (màn đọc giám sát)", () => {
    assert.equal(defaultTabForRole("chi_xem"), "audit-trail");
  });

  it("vai_tro_la → null", () => {
    assert.equal(defaultTabForRole("vai_tro_la"), null);
  });
});

// ── can ───────────────────────────────────────────────────────────────────────

describe("can — null/undefined (backward compat: cho phép hết)", () => {
  it("null role → true cho approval.decide", () => {
    assert.equal(can(null, "approval.decide"), true);
  });

  it("null role → true cho goal.edit", () => {
    assert.equal(can(null, "goal.edit"), true);
  });

  it("undefined role → true cho project.edit", () => {
    assert.equal(can(undefined, "project.edit"), true);
  });

  it("unknown role → true cho tất cả (backward compat)", () => {
    assert.equal(can("vai_tro_la", "system.configure"), true);
    assert.equal(can("admin", "approval.decide"), true);
  });
});

describe("can — chu_tich (được phép tất cả)", () => {
  const actions = [
    "approval.decide",
    "goal.edit",
    "project.edit",
    "meeting.manage",
    "flow.act",
    "system.configure",
  ] as const;
  for (const action of actions) {
    it(`chu_tich được phép ${action}`, () => {
      assert.equal(can("chu_tich", action), true);
    });
  }
});

describe("can — truong_phong (approval.decide, meeting.manage, flow.act)", () => {
  it("approval.decide → true", () => {
    assert.equal(can("truong_phong", "approval.decide"), true);
  });

  it("meeting.manage → true", () => {
    assert.equal(can("truong_phong", "meeting.manage"), true);
  });

  it("flow.act → true", () => {
    assert.equal(can("truong_phong", "flow.act"), true);
  });

  it("goal.edit → false", () => {
    assert.equal(can("truong_phong", "goal.edit"), false);
  });

  it("project.edit → false", () => {
    assert.equal(can("truong_phong", "project.edit"), false);
  });

  it("system.configure → false", () => {
    assert.equal(can("truong_phong", "system.configure"), false);
  });
});

describe("can — chi_xem (không có quyền ghi nào)", () => {
  const actions = [
    "approval.decide",
    "goal.edit",
    "project.edit",
    "meeting.manage",
    "flow.act",
    "system.configure",
  ] as const;
  for (const action of actions) {
    it(`chi_xem không được phép ${action}`, () => {
      assert.equal(can("chi_xem", action), false);
    });
  }
});

// ── company.dissolve ──────────────────────────────────────────────────────────

describe("can — company.dissolve (chỉ chu_tich)", () => {
  it("chu_tich => true", () => {
    assert.equal(can("chu_tich", "company.dissolve"), true);
  });

  it("truong_phong => false", () => {
    assert.equal(can("truong_phong", "company.dissolve"), false);
  });

  it("chi_xem => false", () => {
    assert.equal(can("chi_xem", "company.dissolve"), false);
  });

  it("null => true (backward compat)", () => {
    assert.equal(can(null, "company.dissolve"), true);
  });
});

describe("canDissolveCompany helper", () => {
  it("chu_tich => true", () => assert.equal(canDissolveCompany("chu_tich"), true));
  it("truong_phong => false", () => assert.equal(canDissolveCompany("truong_phong"), false));
  it("chi_xem => false", () => assert.equal(canDissolveCompany("chi_xem"), false));
  it("null => true (backward compat)", () => assert.equal(canDissolveCompany(null), true));
});

// ── org.manage ────────────────────────────────────────────────────────────────

describe("can — org.manage (chỉ chu_tich)", () => {
  it("chu_tich => true", () => {
    assert.equal(can("chu_tich", "org.manage"), true);
  });

  it("truong_phong => false", () => {
    assert.equal(can("truong_phong", "org.manage"), false);
  });

  it("chi_xem => false", () => {
    assert.equal(can("chi_xem", "org.manage"), false);
  });

  it("null => true (backward compat)", () => {
    assert.equal(can(null, "org.manage"), true);
  });
});

describe("canManageOrg helper", () => {
  it("chu_tich => true", () => assert.equal(canManageOrg("chu_tich"), true));
  it("truong_phong => false", () => assert.equal(canManageOrg("truong_phong"), false));
  it("chi_xem => false", () => assert.equal(canManageOrg("chi_xem"), false));
  it("null => true (backward compat)", () => assert.equal(canManageOrg(null), true));
});
