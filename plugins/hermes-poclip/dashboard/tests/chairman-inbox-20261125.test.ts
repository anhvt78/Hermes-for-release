import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { humanizeFinding } from "../src/lib/dashFormat";
import { personLabel, personLabelNeutral, clusterLabel } from "../src/lib/display-labels";

// Giao diện cho Chủ tịch — nhóm «Chờ duyệt» và «Thông báo» (25/11/2026, nhánh giao-dien-chu-tich).

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const om = fs.readFileSync(findSrc("src/pages/OperatingModel.tsx"), "utf-8");
const dl = fs.readFileSync(findSrc("src/lib/display-labels.ts"), "utf-8");

describe("«Chờ duyệt»: thẻ đề xuất cơ cấu gọn", () => {
  it("chỉ hiện «vấn đề» (cắt 240 chữ); lý do đầy đủ, bằng chứng, phương án khác, rủi ro, hoàn tác gập vào một mục", () => {
    assert.ok(om.includes("data-om-org-change-problem"));
    assert.ok(om.includes("lead.slice(0, 237)"));
    assert.ok(om.includes("data-om-org-change-more"));
    assert.ok(om.includes("om.orgChangeBriefMore"));
    assert.equal(vi.operatingModel.orgChangeBriefMore, "Xem đầy đủ lý do, bằng chứng, phương án khác, rủi ro và cách hoàn tác");
  });
  it("mức rủi ro bỏ mã T0–T3 (mã vẫn còn ở chú thích khi rê chuột); tên đối tượng là tên người thay cho mã nhân viên", () => {
    assert.ok(om.includes('.replace(/\\s*\\(T[0-3]\\)\\s*$/, "")'));
    assert.ok(om.includes("personLabelNeutral(t, String(p.payload.profile_id ?? \"\"))"));
  });
  it("nội dung đề xuất được làm sạch: mã nhân viên thành tên, mã thẻ t_… thành #…, bỏ tên vai trò tiếng Anh trong ngoặc", () => {
    const out = humanizeFinding("Thẻ t_bfffa3b9 (10/11) tạo vai Rà soát mã (Code Reviewer) cho code-reviewer-agent", { name: (id) => (id === "code-reviewer-agent" ? "Rà soát mã" : id), cardWord: "thẻ" }).text;
    assert.equal(out, "Thẻ #bfffa3b9 (10/11) tạo vai Rà soát mã cho Rà soát mã");
  });
});

describe("tên phòng và người không còn phần tiếng Anh trong ngoặc ở mọi màn", () => {
  it("các hàm nhãn dùng chung đều bọc plainName", () => {
    for (const n of ["clusterLabel", "personLabel", "personLabelOr", "personLabelNeutral"]) {
      assert.ok(dl.includes(`return plainName(${n}Raw(`), n);
    }
  });
  it("hoạt động đúng với nhãn có sẵn", () => {
    const t: any = { labelGroups: { personLabels: { "qa-agent": "Kiểm thử tự động (Automation QA)", "ops-agent": "Vận hành (CPI)" }, unknown: "Chưa rõ" }, clusters: { design: "Thiết kế (Design Lead)", ops: "Hạ tầng & Vận hành" } };
    assert.equal(personLabel(t, "qa-agent"), "Kiểm thử tự động");
    assert.equal(personLabelNeutral(t, "qa-agent"), "Kiểm thử tự động");
    assert.equal(personLabel(t, "ops-agent"), "Vận hành (CPI)");               // viết tắt toàn chữ hoa giữ nguyên
    assert.equal(clusterLabel(t, "design"), "Thiết kế");
    assert.equal(clusterLabel(t, "ops"), "Hạ tầng & Vận hành");
  });
});
