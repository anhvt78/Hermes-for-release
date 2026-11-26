import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { INBOX_SECTION_ALIASES, INBOX_TAB_ID, LEGACY_TAB_ALIASES, NOTIFICATIONS_TAB_ID, resolveTabFromUrl, INBOX_SECTION_EVENT } from "../src/lib/tabUrl";
import { TAB_GROUPS } from "../src/lib/tabGroups";

// window giả có địa chỉ + history.replaceState để resolveTabFromUrl ghi lại URL
function fakeWindow(href: string) {
  const w: any = { location: { href, search: new URL(href).search }, history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => { w.location.href = url; w.location.search = new URL(url).search; } } };
  return w;
}

describe("Trang «Chờ duyệt» gộp — đường dẫn cũ vẫn mở đúng (20/11/2026)", () => {
  let saved: any;
  beforeEach(() => { saved = (globalThis as any).window; });
  afterEach(() => { (globalThis as any).window = saved; });
  const valid = new Set(["approval-queue", ...Object.keys(INBOX_SECTION_ALIASES)]);

  it("bí danh trỏ về tab đích có thật: «Chờ duyệt» cho đề xuất cơ cấu, «Thông báo» cho cảnh báo (21/11/2026)", () => {
    assert.equal(INBOX_TAB_ID, "approval-queue");
    assert.equal(INBOX_SECTION_ALIASES["org-change-proposals"].tab, INBOX_TAB_ID);
    assert.equal(INBOX_SECTION_ALIASES["control-box"].tab, NOTIFICATIONS_TAB_ID);
    assert.ok(TAB_GROUPS.find((g) => g.id === "inbox")!.tabIds.includes(INBOX_TAB_ID));
    assert.ok(TAB_GROUPS.find((g) => g.id === "notifications")!.tabIds.includes(NOTIFICATIONS_TAB_ID));
  });

  it("?tab=org-change-proposals → approval-queue + subtab=org (mở đúng phần Đề xuất cơ cấu)", () => {
    (globalThis as any).window = fakeWindow("http://x/hermes-poclip?tab=org-change-proposals&profile=default");
    assert.equal(resolveTabFromUrl(valid), "approval-queue");
    const u = new URL((globalThis as any).window.location.href);
    assert.equal(u.searchParams.get("tab"), "approval-queue");
    assert.equal(u.searchParams.get("subtab"), "org");
  });

  it("?tab=control-box → notifications + subtab=alerts (cảnh báo nay ở đầu trang Thông báo)", () => {
    (globalThis as any).window = fakeWindow("http://x/hermes-poclip?tab=control-box");
    assert.equal(resolveTabFromUrl(valid), "notifications");
    assert.equal(new URL((globalThis as any).window.location.href).searchParams.get("subtab"), "alerts");
  });

  it("bí danh của trang gộp không lẫn với bí danh của màn «Luồng việc và tiến độ»", () => {
    for (const k of Object.keys(INBOX_SECTION_ALIASES)) assert.ok(!(k in LEGACY_TAB_ALIASES));
    assert.equal(INBOX_SECTION_EVENT, "poclip-goto-inbox-section");
  });
});
