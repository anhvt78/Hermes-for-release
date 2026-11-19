import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tabsForRole } from "../src/lib/permissions";
import { TAB_GROUPS } from "../src/lib/tabGroups";

// Tổng số tab hiện có — lấy từ TAB_GROUPS (nguồn chính xác nhất).
const ALL_TAB_IDS = TAB_GROUPS.flatMap((g) => [...g.tabIds]);
const TOTAL_TABS = ALL_TAB_IDS.length;

// ── Chủ tịch giữ đủ số tab ───────────────────────────────────────────────────

describe("role-tabs — chu_tich", () => {
  it("tabsForRole(chu_tich) === null (không giới hạn — hiện đủ tab)", () => {
    assert.equal(tabsForRole("chu_tich"), null);
  });

  it("null = không giới hạn nghĩa là chủ tịch thấy đủ " + TOTAL_TABS + " tab hiện có", () => {
    // null → không lọc → toàn bộ PAGES. Xác nhận số tab hiện tại không bị mất.
    assert.ok(TOTAL_TABS >= 18, `phải có ít nhất 18 tab, hiện có ${TOTAL_TABS}`);
    assert.equal(tabsForRole("chu_tich"), null);
  });
});

// ── truong_phong thấy đúng 8 tab ─────────────────────────────────────────────

const EXPECTED_TRUONG_PHONG = [
  "flows-progress",
  "approval-queue",
  "goal-tree",
  "org-chart",
  "quality-board",
  "projects",
  "meeting-room",
  "notifications",
];

describe("role-tabs — truong_phong", () => {
  it("trả mảng 8 phần tử", () => {
    const tabs = tabsForRole("truong_phong")!;
    assert.equal(tabs.length, EXPECTED_TRUONG_PHONG.length);
  });

  it("đúng danh sách đã chốt (theo thứ tự)", () => {
    assert.deepEqual(tabsForRole("truong_phong"), EXPECTED_TRUONG_PHONG);
  });

  it("mọi tab của truong_phong đều nằm trong tập tab hiện có", () => {
    const allSet = new Set(ALL_TAB_IDS);
    for (const tab of EXPECTED_TRUONG_PHONG) {
      assert.ok(allSet.has(tab), `tab "${tab}" không tồn tại trong TAB_GROUPS`);
    }
  });

  it("không chứa audit-trail (thuộc chi_xem, không phải truong_phong)", () => {
    const tabs = tabsForRole("truong_phong")!;
    assert.ok(!tabs.includes("audit-trail"), "truong_phong không được thấy audit-trail");
  });

  it("chứa projects (truong_phong có quyền xem dự án phòng mình)", () => {
    assert.ok(tabsForRole("truong_phong")!.includes("projects"));
  });
});

// ── chi_xem thấy đúng 8 tab ──────────────────────────────────────────────────

const EXPECTED_CHI_XEM = [
  "flows-progress",
  "approval-queue",
  "goal-tree",
  "org-chart",
  "quality-board",
  "audit-trail",
  "meeting-room",
  "notifications",
];

describe("role-tabs — chi_xem", () => {
  it("trả mảng 8 phần tử", () => {
    const tabs = tabsForRole("chi_xem")!;
    assert.equal(tabs.length, EXPECTED_CHI_XEM.length);
  });

  it("đúng danh sách đã chốt (theo thứ tự)", () => {
    assert.deepEqual(tabsForRole("chi_xem"), EXPECTED_CHI_XEM);
  });

  it("mọi tab của chi_xem đều nằm trong tập tab hiện có", () => {
    const allSet = new Set(ALL_TAB_IDS);
    for (const tab of EXPECTED_CHI_XEM) {
      assert.ok(allSet.has(tab), `tab "${tab}" không tồn tại trong TAB_GROUPS`);
    }
  });

  it("chứa audit-trail (đặc trưng của vai trò giám sát)", () => {
    assert.ok(tabsForRole("chi_xem")!.includes("audit-trail"));
  });

  it("không chứa projects (chi_xem không quản lý dự án)", () => {
    assert.ok(!tabsForRole("chi_xem")!.includes("projects"));
  });
});

// ── null / vai trò lạ — không giới hạn (backward compat) ────────────────────

describe("role-tabs — null / unknown (backward compat)", () => {
  it("null → null", () => {
    assert.equal(tabsForRole(null), null);
  });

  it("undefined → null", () => {
    assert.equal(tabsForRole(undefined), null);
  });

  it("vai trò không khai báo → null", () => {
    assert.equal(tabsForRole("super_admin"), null);
    assert.equal(tabsForRole(""), null);
  });
});
