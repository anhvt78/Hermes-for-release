import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { navigateToTab, GOTO_TAB_EVENT } from "../src/lib/tabUrl";

// window giả: ghi lại sự kiện và lệnh điều hướng cả trang
function fakeWindow(handler?: (ev: any) => void) {
  const assigned: string[] = [];
  const w: any = {
    location: { href: "http://x/hermes-poclip?tab=approval-queue", assign: (u: string) => assigned.push(u), search: "?tab=approval-queue", pathname: "/hermes-poclip", origin: "http://x" },
    dispatchEvent: (ev: any) => { if (handler) handler(ev); return !ev.defaultPrevented; },
  };
  return { w, assigned };
}

describe("navigateToTab — chuyển tab ngay trong trang khi có người nghe (20/11/2026)", () => {
  let saved: any;
  beforeEach(() => { saved = (globalThis as any).window; });
  afterEach(() => { (globalThis as any).window = saved; });

  it("khung ứng dụng nhận sự kiện và huỷ mặc định → KHÔNG tải lại cả trang", () => {
    const seen: string[] = [];
    const { w, assigned } = fakeWindow((ev) => { seen.push(ev.detail.id); ev.preventDefault(); });
    (globalThis as any).window = w;
    navigateToTab("control-box");
    assert.deepEqual(seen, ["control-box"]);
    assert.equal(assigned.length, 0);
  });

  it("không ai nghe → điều hướng cả trang như cũ", () => {
    const { w, assigned } = fakeWindow();
    (globalThis as any).window = w;
    navigateToTab("control-box");
    assert.equal(assigned.length, 1);
    assert.ok(assigned[0].includes("control-box"));
  });

  it("có tham số agent hoặc subtab → luôn điều hướng cả trang (tham số đọc lúc nạp trang), không phát sự kiện", () => {
    let fired = 0;
    const { w, assigned } = fakeWindow(() => { fired += 1; });
    (globalThis as any).window = w;
    navigateToTab("org-chart", "ceo-agent");
    navigateToTab("meeting-room", null, "settings");
    assert.equal(fired, 0);
    assert.equal(assigned.length, 2);
  });

  it("tên sự kiện là hằng dùng chung", () => {
    assert.equal(GOTO_TAB_EVENT, "poclip-goto-tab");
  });
});
