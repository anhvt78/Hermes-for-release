import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { CLIENT_PROJECTS_TAB_ID, LEGACY_TAB_ALIASES, resolveTabFromUrl } from "../src/lib/tabUrl";
import { TAB_GROUPS } from "../src/lib/tabGroups";
import { collectDeptCodes } from "../src/lib/dept-codes";

function fakeWindow(href: string) {
  const w: any = { location: { href, search: new URL(href).search }, history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => { w.location.href = url; w.location.search = new URL(url).search; } } };
  return w;
}

describe("«Dự án và khách hàng» — hai tab cũ gộp thành một (22/11/2026)", () => {
  let saved: any;
  beforeEach(() => { saved = (globalThis as any).window; });
  afterEach(() => { (globalThis as any).window = saved; });
  const valid = new Set([CLIENT_PROJECTS_TAB_ID, ...Object.keys(LEGACY_TAB_ALIASES)]);

  it("tab gộp nằm trong nhóm «Công việc»; hai tab cũ không còn là tab riêng", () => {
    const work = TAB_GROUPS.find((g) => g.id === "work")!;
    assert.ok(work.tabIds.includes(CLIENT_PROJECTS_TAB_ID));
    const all = TAB_GROUPS.flatMap((g) => [...g.tabIds]);
    assert.ok(!all.includes("projects") && !all.includes("customer-portal"));
  });

  it("?tab=projects mở mục «Dự án»; ?tab=customer-portal (cũng là đích của thông báo) mở mục «Khách hàng»", () => {
    (globalThis as any).window = fakeWindow("http://x/hermes-poclip?tab=projects");
    assert.equal(resolveTabFromUrl(valid), CLIENT_PROJECTS_TAB_ID);
    assert.equal(new URL((globalThis as any).window.location.href).searchParams.get("subtab"), "projects");

    (globalThis as any).window = fakeWindow("http://x/hermes-poclip?tab=customer-portal");
    assert.equal(resolveTabFromUrl(valid), CLIENT_PROJECTS_TAB_ID);
    assert.equal(new URL((globalThis as any).window.location.href).searchParams.get("subtab"), "customers");
  });
});

describe("Danh sách phòng để chọn khi tạo dự án / hội thoại", () => {
  it("lấy mã phòng khác nhau từ mọi tầng của sơ đồ, bỏ trống và trùng", () => {
    const tree = [
      { org_unit: "client_business", children: [{ org_unit: "design", children: [] }, { org_unit: "client_business" }, { org_unit: "  " }, { org_unit: null }] },
      { org_unit: "engineering" },
    ];
    assert.deepEqual(collectDeptCodes(tree).sort(), ["client_business", "design", "engineering"]);
    assert.deepEqual(collectDeptCodes(undefined), []);
  });
});
