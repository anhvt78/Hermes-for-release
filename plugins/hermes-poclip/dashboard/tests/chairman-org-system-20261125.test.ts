import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Giao diện cho Chủ tịch — nhóm «Tổ chức» (Chất lượng nhân viên AI) và «Hệ thống» (tên nhà cung cấp AI), 25/11/2026.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");
const qb = read("src/pages/QualityBoard.tsx");

describe("Chất lượng nhân viên AI: bảng gọn", () => {
  it("mặc định ẩn nhân viên «chưa đủ dữ liệu» (chỉ khi có cả người có số liệu); có nút hiện cả", () => {
    assert.ok(qb.includes("const agentsVisible = showAllAgents || noDataAgents === agents.length ? agents : agents.filter((a) => a.status !== \"insufficient\");"));
    assert.ok(qb.includes("<PagedRows items={agentsVisible} colSpan={11}"));
    assert.ok(qb.includes("data-quality-agents-toggle") && qb.includes("data-quality-agents-note"));
  });
  it("chữ vi/en", () => {
    assert.equal(vi.qualityBoard.showInsufficient(35), "Hiện cả 35 nhân viên chưa đủ dữ liệu");
    assert.equal(vi.qualityBoard.agentsHiddenNote(35), "Đang ẩn 35 nhân viên chưa đủ dữ liệu (chưa có việc để đánh giá).");
    assert.ok(en.qualityBoard.hideInsufficient.length > 0);
  });
});

describe("Hệ thống: tên nhà cung cấp AI viết đúng", () => {
  it("Giám sát, Tình trạng hệ thống và khối nhà cung cấp AI đều qua properNames", () => {
    assert.ok(read("src/pages/Monitoring.tsx").includes("properNames(p.provider)"));
    const sh = read("src/pages/SystemHealth.tsx");
    assert.ok(sh.includes("pv.pausedHeadline(properNames(p.provider)") && sh.includes("{properNames(f.detail)}"));
    assert.ok(sh.includes("properNames(top.provider)"));
    assert.ok(read("src/components/ProviderHealthPanel.tsx").includes("m.pausedHeadline(properNames(r.provider)"));
  });
});
