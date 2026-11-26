import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { categoryOfTopic, filterTopicsByCategory } from "../src/lib/flowCategory";

// Bấm nhóm «Giám sát hệ thống» / «Kiểm soát tuân thủ» phải thấy kết quả ngay (25/11/2026):
// sơ đồ tổng quan chỉ vẽ đường giữa các phòng ngoài Điều hành nên trước đây bấm xong trông như không đổi.

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

describe("nhóm quy định luồng: phản hồi khi bấm", () => {
  it("bấm nhóm khác «Tất cả» thì mở sẵn phần chi tiết đã lọc", () => {
    assert.ok(page.includes('if (c !== "all") setDetailOpen(true);'));
  });
  it("có dòng tóm tắt dưới nút nhóm: số quy định, số đường nối hai phòng, số quy định không vẽ được", () => {
    assert.ok(page.includes("data-flows-category-summary="));
    assert.ok(page.includes("t.companyFlows.categorySummary(t.companyFlows.flowCategoryOptions[flowCategory], categoryTopics.length, frameEdges.length, categoryUndrawnCount)"));
  });
  it("chữ vi/en", () => {
    assert.equal(vi.companyFlows.categorySummary("Giám sát hệ thống", 5, 1, 4), "Nhóm «Giám sát hệ thống»: 5 quy định — 1 đường nối hai phòng, 4 quy định không vẽ thành đường (liệt kê ngay dưới).");
    assert.equal(vi.companyFlows.categorySummary("Kiểm soát tuân thủ", 3, 3, 0), "Nhóm «Kiểm soát tuân thủ»: 3 quy định — 3 đường nối hai phòng.");
    assert.ok(en.companyFlows.categorySummary("System monitoring", 1, 1, 0).includes("1 rule — 1 line between two departments"));
  });
  it("phân nhóm giữ nguyên: ba nhóm gộp lại bằng «Tất cả»", () => {
    const ts = [
      { name: "incident.critical", producer_clusters: ["*"], consumer_clusters: ["executive"] },
      { name: "audit.findings", producer_clusters: ["audit"], consumer_clusters: ["chairman_human"] },
      { name: "risk.veto_raised", producer_clusters: ["risk_management"], consumer_clusters: ["compliance"] },
      { name: "research.note", producer_clusters: ["fundamental_research"], consumer_clusters: ["report_synthesis"] },
    ];
    assert.equal(categoryOfTopic(ts[0]), "monitoring");
    assert.equal(categoryOfTopic(ts[1]), "compliance");
    assert.equal(categoryOfTopic(ts[2]), "compliance");
    assert.equal(categoryOfTopic(ts[3]), "ops");
    const sum = (["ops", "monitoring", "compliance"] as const).reduce((n, c) => n + filterTopicsByCategory(ts, c).length, 0);
    assert.equal(sum, ts.length);
  });
});
