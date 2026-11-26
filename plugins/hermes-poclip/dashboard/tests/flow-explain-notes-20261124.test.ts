import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// 24/11/2026: ba thứ dễ nhầm — «Cấu hình luật», «Cấu hình quy trình», quyền giao thẻ việc — nay có ghi chú nói rõ: dùng để làm gì, hiện ở đâu, KHÔNG làm gì.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const page = fs.readFileSync(findSrc("src/pages/CompanyFlows.tsx"), "utf-8");

describe("«Cấu hình luật»: khung giải thích", () => {
  it("có khung gập (data-law-explain) với ba ý: dùng để làm gì, hiện ở đâu, không làm gì", () => {
    assert.ok(page.includes('data-law-explain=""'));
    for (const k of ["lawWhatTitle", "lawWhatUse", "lawWhatShown", "lawWhatNot"]) assert.ok(page.includes(`t.companyFlows.${k}`), k);
  });
  it("nói rõ luật là sự kiện bàn giao, không tự sinh việc, không cho phép giao thẻ thẳng, không liên quan tới quy trình", () => {
    assert.match(vi.companyFlows.lawWhatUse, /sự kiện bàn giao/);
    assert.match(vi.companyFlows.lawWhatNot, /không tự sinh việc/);
    assert.match(vi.companyFlows.lawWhatNot, /Giao thẻ việc cho người khác/);
    assert.match(vi.companyFlows.lawWhatNot, /Cấu hình quy trình/);
    assert.match(vi.companyFlows.lawWhatShown, /Bàn giao giữa các phòng/);
  });
  it("bản tiếng Anh đủ ý, và tên khung quyền giao thẻ khớp tên thật trên giao diện", () => {
    assert.match(en.companyFlows.lawWhatNot, /Assigning task cards to others/);
    assert.match(en.companyFlows.lawWhatUse, /handover events/);
    assert.match(vi.flowPathMap.footNotePlanned, /Giao thẻ việc cho người khác/);
    assert.match(en.flowPathMap.footNotePlanned, /Assigning task cards to others/);
  });
});

describe("«Cấu hình quy trình»: nói rõ không đổi sơ đồ mạng lưới", () => {
  const pcPage = fs.readFileSync(findSrc("src/pages/ProcessConfig.tsx"), "utf-8");
  it("dòng ghi chú HIỆN SẴN dưới tiêu đề (không giấu trong dấu «?»): chỉ quyết định cách XEM một việc theo bước", () => {
    assert.ok(pcPage.includes('data-pcfg-scope=""') && pcPage.includes("{pc.scopeNote}"));
    assert.match(vi.processConfig.scopeNote, /chỉ quyết định cách XEM/);
    assert.match(vi.processConfig.scopeNote, /Mạng lưới giao việc/);
    assert.match(vi.processConfig.scopeNote, /Giao thẻ việc cho người khác/);
    assert.match(en.processConfig.scopeNote, /only decides how a piece of work is VIEWED/);
    assert.match(en.processConfig.scopeNote, /Assigning task cards to others/);
  });
  it("lời mở đầu trong dấu «?» giữ nguyên, không lặp lại ghi chú", () => {
    assert.ok(!/chỉ quyết định cách XEM/.test(vi.processConfig.intro));
  });
});
