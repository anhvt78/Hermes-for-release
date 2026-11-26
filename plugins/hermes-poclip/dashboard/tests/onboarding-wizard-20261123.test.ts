import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { countGroups, groupOf, sortOverview } from "../src/lib/onboarding-overview";
import { managerChoices, unitChoices, type TreeNode } from "../src/lib/placement-fields";

// «Tiếp nhận nhân viên mới» — đợt rà soát 23/11/2026

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không tìm thấy ${relPath}`);
}

describe("tổng quan tiếp nhận: nhóm, đếm, sắp xếp", () => {
  const items = [
    { profile_id: "a", name: "An", wizard_step_completed: 0 },
    { profile_id: "b", name: "Bình", wizard_step_completed: 6 },
    { profile_id: "c", name: "Cường", wizard_step_completed: 5 },
    { profile_id: "d", name: "Dũng", wizard_step_completed: 2 },
    { profile_id: "e", name: "Chi", wizard_step_completed: 0 },
  ];
  it("groupOf: 6 bước = xong, 1–5 = làm dở, 0 = chưa bắt đầu", () => {
    assert.deepEqual(items.map(groupOf), ["none", "done", "partial", "partial", "none"]);
  });
  it("countGroups đếm đúng", () => {
    assert.deepEqual(countGroups(items), { done: 1, partial: 2, none: 2 });
  });
  it("sortOverview: làm dở (nhiều bước trước) → chưa bắt đầu → đã xong; cùng nhóm theo tên", () => {
    assert.deepEqual(sortOverview(items).map((i) => i.profile_id), ["c", "d", "a", "e", "b"]);
  });
});

describe("danh sách chọn: tên thay cho mã", () => {
  const TREE: TreeNode[] = [{ profile_id: "chu_tich", job_title: "chairman", children: [{ profile_id: "audit-agent", job_title: "Kiểm toán viên nội bộ", children: [] }] } as unknown as TreeNode];
  it("managerChoices có hàm tên: chỉ hiện tên, không kèm mã", () => {
    const c = managerChoices(TREE, "", "vi", (id, title) => (id === "chu_tich" ? "Chủ tịch" : title));
    assert.deepEqual(c.map((x) => x.label), ["Chủ tịch", "Kiểm toán viên nội bộ"]);
    assert.deepEqual(c.map((x) => x.value), ["chu_tich", "audit-agent"]);
  });
  it("managerChoices không có hàm tên: giữ dạng cũ «mã — chức danh»", () => {
    assert.equal(managerChoices(TREE, "", "vi")[1].label, "audit-agent — Kiểm toán viên nội bộ");
  });
  it("unitChoices withCode=false: bỏ mã trong ngoặc; mặc định vẫn kèm mã", () => {
    const units = [{ slug: "audit", display_name: "Kiểm toán nội bộ", in_org: true, agent_count: 1, rules_count: 1 }] as never;
    assert.equal(unitChoices(units)[0].label, "Kiểm toán nội bộ (audit)");
    assert.equal(unitChoices(units, false)[0].label, "Kiểm toán nội bộ");
  });
});

describe("trang Tiếp nhận: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/OnboardingWizard.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("có bảng tổng quan; chọn nhân viên bằng ô chọn tên và tự tải trạng thái (cả khi mở bằng ?agent=)", () => {
    assert.ok(page.includes("<OnboardingOverview"));
    assert.ok(page.includes("function pickProfile("));
    assert.ok(!page.includes('list="onboarding-profile-options"'));
    assert.ok(page.includes("autoLoaded"));
  });
  it("kết quả mỗi bước là câu thường, JSON gập trong «Chi tiết kỹ thuật»", () => {
    assert.ok(page.includes("function stepSummary("));
    assert.ok(page.includes("detail: JSON.stringify(data, null, 2)"));
    assert.ok(!/text:[^\n]*\+ JSON\.stringify\(data, null, 2\)/.test(page), "không ghép JSON thô vào câu kết quả");
  });
  it("không còn dòng «Mã kỹ thuật» ở bước 2, 4, 6", () => {
    // amount_usd vẫn là tên trường gửi cho máy chủ; chỉ không được HIỆN ra cho người dùng
    assert.ok(!page.includes(">amount_usd</code>"));
    assert.ok(!page.includes("technicalCodePrefix"));
    assert.ok(!page.includes("hard_stop_enabled"));
    assert.ok(!page.includes("sandbox_benchmark"));
    assert.ok(!page.includes("independent_operation"));
  });
  it("thanh 6 bước dùng được bằng bàn phím, có ✓ cho bước đã xong", () => {
    assert.ok(page.includes('role="tab"'));
    assert.ok(page.includes("tabIndex={0}"));
    assert.ok(page.includes('{done ? "✓" : n}'));
  });
  it("không còn «(D7)» và mã chỉ tiêu tiếng Anh trong chữ hiển thị", () => {
    assert.ok(!vi.includes("(D7)"));
    for (const raw of ["accuracy_pct ≥", "scope_compliance_pct =", "prompt_injection_resistance_pct =", "latency_within_sla =", "cost_variance_pct ≤"]) {
      assert.ok(!vi.includes(`"${raw}`), raw);
    }
  });
  it("nút bộ mẫu ở bước 3: tên chính + dòng phụ, nút tự cao theo chữ (không đè chữ)", () => {
    const ed = fs.readFileSync(findSrc("src/components/ToolPolicyEditor.tsx"), "utf-8");
    assert.ok(ed.includes('height: "auto", whiteSpace: "normal"'));
    assert.ok(ed.includes("data-wizard-preset={p.id}"));
  });
});
