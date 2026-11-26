import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import {
  addStep, flowIdFrom, isDirty, localProblems, milestoneOf, moveStep, newFlowDoc, prefixFrom, referencedBy, removeStep, renameMilestone, setGateKind, setGateTarget, setPrefix, setProposalPair, setStepField, slugKey,
  type PfDoc,
} from "../src/lib/projectFlowDraft";

// Sửa/thêm/xóa quy trình dự án trên giao diện (26/11/2026).
function src(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, "src", rel);
    if (fs.existsSync(c)) return fs.readFileSync(c, "utf-8");
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}

const base = (): PfDoc => ({
  title: "Dự án",
  code_prefix: "DA",
  steps: [
    { key: "tiep_nhan", label: "Tiếp nhận", sla_hours: 24, kanban: true },
    { key: "lam", label: "Làm", sla_hours: 48, kanban: true, owner_unit: "engineering" },
    { key: "giao", label: "Giao khách", sla_hours: 24, waits_for: "customer", gate: { kind: "customer_review", scope: "x", on_approve: "giao", on_rework: "lam" } },
  ],
  milestones: [{ key: "dau", label: "Bắt đầu", steps: ["tiep_nhan"] }, { key: "giua", label: "Thực hiện", steps: ["lam", "giao"] }],
});

describe("tạo mã", () => {
  it("khoá bước không dấu, không trùng, bắt đầu bằng chữ", () => {
    assert.equal(slugKey("Tiếp nhận yêu cầu", []), "tiep_nhan_yeu_cau");
    assert.equal(slugKey("Làm", ["lam"]), "lam_2");
    assert.equal(slugKey("123", []), "buoc_123");
    assert.equal(slugKey("Đã xong", []), "da_xong");
  });
  it("mã quy trình và chữ đầu mã dự án", () => {
    assert.equal(flowIdFrom("Bảo hành phần mềm", []), "bao-hanh-phan-mem");
    assert.equal(flowIdFrom("Bảo hành phần mềm", ["bao-hanh-phan-mem"]), "bao-hanh-phan-mem-2");
    assert.equal(prefixFrom("Bảo hành phần mềm"), "BHP");
  });
});

describe("sửa bản nháp", () => {
  it("sửa tên, thời hạn, phòng, chờ khách mà không đụng bản gốc", () => {
    const d = base();
    let n = setStepField(d, 0, "label", "Nhận việc");
    n = setStepField(n, 0, "sla_hours", "72");
    n = setStepField(n, 0, "owner_unit", "quality");
    n = setStepField(n, 0, "waits_for", true);
    assert.deepEqual([n.steps[0].label, n.steps[0].sla_hours, n.steps[0].owner_unit, n.steps[0].waits_for], ["Nhận việc", 72, "quality", "customer"]);
    n = setStepField(n, 0, "owner_unit", "");
    n = setStepField(n, 0, "waits_for", false);
    assert.ok(!("owner_unit" in n.steps[0]) && !("waits_for" in n.steps[0]));
    assert.equal(d.steps[0].label, "Tiếp nhận");
    assert.equal(setStepField(d, 0, "sla_hours", "abc").steps[0].sla_hours, 1);
  });
  it("thêm bước vào cùng cột mốc với bước đứng trước; bỏ bước làm cột mốc rỗng biến mất", () => {
    const a = addStep(base(), "Kiểm thử");
    assert.equal(a.steps.length, 4);
    assert.equal(milestoneOf(a, "kiem_thu"), "Thực hiện");
    const b = removeStep(base(), 0);
    assert.equal(b.milestones!.length, 1);
    assert.ok(!b.milestones!.some((m) => m.key === "dau"));
  });
  it("không bỏ bước cuối cùng; đổi thứ tự", () => {
    const one: PfDoc = { steps: [{ key: "a", label: "A" }] };
    assert.equal(removeStep(one, 0).steps.length, 1);
    const m = moveStep(base(), 0, 1);
    assert.deepEqual(m.steps.map((s) => s.key), ["lam", "tiep_nhan", "giao"]);
    assert.equal(moveStep(base(), 0, -1).steps[0].key, "tiep_nhan");
  });
  it("chữ đầu mã dự án chỉ chữ cái, tối đa 4, rỗng thì bỏ", () => {
    assert.equal(setPrefix(base(), "b1t-xyz9").code_prefix, "BTXY");
    assert.ok(!("code_prefix" in setPrefix(base(), "12")));
  });
  it("quy trình mới có một bước và đúng khuôn", () => {
    const d = newFlowDoc("Bảo hành", "bh", "Tiếp nhận");
    assert.deepEqual([d.code_prefix, d.steps.length, d.steps[0].key], ["BH", 1, "tiep_nhan"]);
  });
  it("nhận ra bản nháp đã đổi và lỗi nhẹ", () => {
    const d = base();
    assert.equal(isDirty(d, base()), false);
    assert.equal(isDirty(setStepField(d, 0, "label", "X"), base()), true);
    const msgs = { noTitle: "T", noLabel: (n: number) => `L${n}`, badPrefix: "P" };
    assert.deepEqual(localProblems({ ...base(), title: " " }, msgs), ["T"]);
    assert.deepEqual(localProblems(setStepField(base(), 1, "label", ""), msgs), ["L2"]);
  });
});

describe("giao diện và chữ", () => {
  it("nằm trong tab «Cấu hình quy trình», dưới phần cấu hình quy trình xem việc", () => {
    const f = src("pages/FlowsProgress.tsx");
    assert.ok(f.includes("<ProcessConfig />") && f.includes("<ProjectFlowsConfig />"));
  });
  it("có nút lưu/xóa gọi đúng đường dẫn và chỉ bật Lưu khi có thay đổi, không lỗi", () => {
    const c = src("pages/ProjectFlowsConfig.tsx");
    assert.ok(c.includes("/api/v1/flows/project-flows"));
    assert.ok(c.includes('"PUT"') && c.includes('"DELETE"'));
    assert.ok(c.includes("disabled={busy || !dirty || problems.length > 0 || !editing.canEdit}"));
    assert.ok(c.includes("disabled={editing.locked"));
    assert.ok(c.includes("plainName(u.label)"), "tên phòng bỏ phần tiếng Anh trong ngoặc");
  });
  it("chữ tiếng Việt và tiếng Anh cùng có", () => {
    assert.equal(vi.projectFlowConfig!.title, "Quy trình dự án");
    assert.equal(en.projectFlowConfig.title, "Project flows");
    assert.ok(vi.projectFlowConfig!.lockedNote!(2).includes("2 dự án"));
  });
});

describe("cổng duyệt, cột mốc, vòng đề xuất", () => {
  it("bật cổng khách duyệt: mã nghiệm thu lấy từ khoá bước, duyệt → bước kế, làm lại → bước trước", () => {
    const d = setGateKind(base(), 1, "customer_review");
    assert.deepEqual(d.steps[1].gate, { kind: "customer_review", scope: "lam", on_approve: "giao", on_rework: "tiep_nhan" });
    assert.deepEqual(setGateTarget(d, 1, "on_rework", "lam").steps[1].gate?.on_rework, "lam");
    assert.ok(!("gate" in setGateKind(d, 1, "").steps[1]));
    assert.deepEqual(setGateKind(base(), 0, "proposal_approved").steps[0].gate, { kind: "proposal_approved" });
  });
  it("đổi cổng khách duyệt có sẵn giữ nguyên mã và đích cũ", () => {
    const d = setGateKind(base(), 2, "customer_review");
    assert.deepEqual(d.steps[2].gate, { kind: "customer_review", scope: "x", on_approve: "giao", on_rework: "lam" });
  });
  it("không bỏ được bước đang bị cổng hoặc cặp đề xuất trỏ tới", () => {
    assert.equal(referencedBy(base(), "lam"), true);
    assert.equal(referencedBy(base(), "tiep_nhan"), false);
    assert.equal(removeStep(base(), 1).steps.length, 3);
    const withPair = setProposalPair(base(), "tiep_nhan", "lam");
    assert.equal(referencedBy(withPair, "tiep_nhan"), true);
    assert.equal(removeStep(withPair, 0).steps.length, 3);
  });
  it("cặp đề xuất: thiếu một đầu hoặc trùng nhau thì bỏ cặp", () => {
    assert.deepEqual(setProposalPair(base(), "tiep_nhan", "lam").proposal, { submit_step: "tiep_nhan", review_step: "lam" });
    assert.ok(!("proposal" in setProposalPair(setProposalPair(base(), "tiep_nhan", "lam"), "tiep_nhan", "")));
    assert.ok(!("proposal" in setProposalPair(base(), "lam", "lam")));
  });
  it("đổi tên cột mốc và báo cột mốc trống tên", () => {
    const d = renameMilestone(base(), 1, "Làm và giao");
    assert.equal(d.milestones![1].label, "Làm và giao");
    const msgs = { noTitle: "T", noLabel: (n: number) => `L${n}`, badPrefix: "P", noMilestoneLabel: (n: number) => `M${n}` };
    assert.deepEqual(localProblems(renameMilestone(base(), 0, " "), msgs), ["M1"]);
  });
});
