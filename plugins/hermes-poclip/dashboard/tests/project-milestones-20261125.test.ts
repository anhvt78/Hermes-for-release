import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Cột mốc khách nhìn thấy (25/11/2026): danh sách hiện cột mốc hiện hành + tiến độ theo cột mốc; chi tiết có dải cột mốc.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const page = fs.readFileSync(findSrc("src/pages/Projects.tsx"), "utf-8");

describe("tab «Dự án»: cột mốc", () => {
  it("nhận cột mốc từ danh sách quy trình; quy trình không khai thì rỗng (giao diện y như cũ)", () => {
    assert.ok(page.includes("milestones?: ProjectMilestone[];"));
    assert.ok(page.includes("flows.find((f) => f.id === (fid || \"default\"))?.milestones ?? []"));
  });
  it("danh sách: hiện cột mốc hiện hành (kèm tên bước nhỏ bên dưới) và «x/N cột mốc»; không có cột mốc thì như cũ", () => {
    assert.ok(page.includes("data-project-milestone="));
    assert.ok(page.includes("p.milestoneProgress(milestonesDoneOf(proj.flow_id, proj.progress), milestonesOf(proj.flow_id).length)"));
    assert.ok(page.includes(": totalStepsOf(proj.flow_id) > 0 ? h.progressOf(proj.progress, totalStepsOf(proj.flow_id)) : proj.progress}"));
  });
  it("chi tiết: dải cột mốc với trạng thái xong / đang làm / chưa tới, chỉ khi quy trình có cột mốc", () => {
    assert.ok(page.includes('data-section="milestones"') && page.includes("data-milestone-status={status}"));
    assert.ok(page.includes("milestonesOf(detail.flow_id).length > 0 && ("));
    assert.ok(page.includes('sts.every((x) => x.status === "done") ? "done"'));
  });
  it("cột mốc xong khi mọi bước của nó nằm trong n bước đã xong đầu tiên", () => {
    assert.ok(page.includes("m.steps.every((k) => order.indexOf(k) >= 0 && order.indexOf(k) < doneSteps)"));
  });
  it("chữ vi/en", () => {
    assert.equal(vi.projects.milestonesSection, "Cột mốc");
    assert.equal(vi.projects.milestoneProgress(3, 12), "3/12 cột mốc");
    assert.equal(en.projects.milestonesSection, "Milestones");
    assert.equal(en.projects.milestoneProgress(3, 12), "3/12 milestones");
  });
});
