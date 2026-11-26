import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Nhiều quy trình dự án (25/11/2026): tab «Dự án» chọn quy trình khi tạo, hiện tên quy trình, và dùng ĐÚNG bước của từng dự án.

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

describe("tab «Dự án»: nhiều quy trình", () => {
  it("nạp danh sách quy trình kèm bước từ /projects/flows", () => {
    assert.ok(page.includes('usePoclipFetch<{ flows: ProjectFlowItem[] }>("/api/v1/projects/flows", [])'));
    assert.ok(page.includes("step_list: ProjectFlowStep[];"));
  });
  it("ô chọn quy trình chỉ hiện khi công ty có từ 2 quy trình; gửi flow_id chỉ khi đó (công ty một quy trình chạy y như cũ)", () => {
    assert.ok(page.includes("{flows.length > 1 && (\n            <div data-field-wrap=\"flow\">"));
    assert.ok(page.includes("flow_id: flows.length > 1 ? effectiveFormFlow : undefined,"));
    assert.ok(page.includes("{p.formProjectFlow}") || page.includes("<Label>{p.formProjectFlow}</Label>"));
  });
  it("nút «Tạo dự án» mở được khi công ty chỉ khai quy trình phụ (không chỉ khi có quy trình chính)", () => {
    assert.ok(page.includes("const flowReady = (!!flow && flow.configured) || flows.length > 0;"));
  });
  it("bước, tên bước, tiến độ và phòng dự kiến theo quy trình của TỪNG dự án", () => {
    assert.ok(page.includes("stepName(proj.current_step, proj.flow_id)"));
    assert.ok(page.includes("totalStepsOf(proj.flow_id)"));
    assert.ok(page.includes("flowStepsOf(activeFlowId).find((s) => s.key === step.step_key)?.owner_unit"));
    assert.ok(page.includes('const activeFlowId = selectedId ? ((data ?? []).find((x) => x.id === selectedId)?.flow_id ?? "default") : "default";'));
  });
  it("danh sách hiện tên quy trình dưới mã dự án khi có nhiều quy trình", () => {
    assert.ok(page.includes("data-project-flow={proj.flow_id ?? \"default\"}"));
  });
  it("khai báo thứ tự: activeFlowId không dùng biến `projects` trước khi nó được tạo", () => {
    const iActive = page.indexOf("const activeFlowId");
    const iProjects = page.indexOf("const projects = data ?? [];");
    assert.ok(iActive > 0 && iProjects > 0);
    assert.ok(!/const activeFlowId[^\n]*\bprojects\b/.test(page));
  });
  it("chữ vi/en có nhãn «Quy trình»", () => {
    assert.equal(vi.projects.formProjectFlow, "Quy trình");
    assert.equal(en.projects.formProjectFlow, "Process");
  });
});
