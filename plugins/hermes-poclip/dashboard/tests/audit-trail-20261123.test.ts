import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { actionLabelFor, fieldValueText, shortRef, splitChangedFields } from "../src/lib/auditTrailFilters";
import { humanizeFinding } from "../src/lib/dashFormat";

// Tab «Kiểm toán» — đợt rà soát 23/11/2026

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

describe("mã dài → dạng ngắn", () => {
  it("shortRef: grant_<32>, UUID, t_<mã thẻ>; chuỗi khác giữ nguyên", () => {
    assert.equal(shortRef("grant_19c678f830ad4d44ac537503dfd62266"), "#19c678f8");
    assert.equal(shortRef("22d8635a-3a0a-4daa-bde7-a3b5e876a54a"), "#22d8635a");
    assert.equal(shortRef("t_897049e4"), "#897049e4");
    assert.equal(shortRef("backend-dev-agent"), "backend-dev-agent");
    assert.equal(shortRef(null), "");
  });
  it("humanizeFinding cũng rút gọn «grant_<32 ký tự>» trong câu", () => {
    const r = humanizeFinding("Quyền grant_19c678f830ad4d44ac537503dfd62266 đã xoá", { name: (x) => x, cardWord: "thẻ" });
    assert.equal(r.text, "Quyền #19c678f8 đã xoá");
  });
});

describe("hành động «Khác» có tên dễ hiểu theo loại thô", () => {
  const labels = { update: "Cập nhật", other: "Khác" };
  const raw = { system: "Cảnh báo hệ thống" };
  it("other + loại thô có nhãn → dùng nhãn loại thô", () => {
    assert.equal(actionLabelFor("other", "system", labels, raw), "Cảnh báo hệ thống");
  });
  it("other + loại thô lạ → «Khác»; hành động khác → nhãn thường", () => {
    assert.equal(actionLabelFor("other", "zzz", labels, raw), "Khác");
    assert.equal(actionLabelFor("update", "system", labels, raw), "Cập nhật");
  });
});

describe("chi tiết thay đổi: chỉ hiện trường đổi", () => {
  const rows = [
    { key: "active", before: 1, after: 0 },
    { key: "note", before: "a", after: "a" },
    { key: "expires_at", before: null, after: null },
    { key: "allowed_operations", before: '["x"]', after: '["x"]' },
    { key: "status", before: null, after: "open" },
  ];
  it("splitChangedFields tách đúng", () => {
    const { changed, unchanged } = splitChangedFields(rows);
    assert.deepEqual(changed.map((r) => r.key), ["active", "status"]);
    assert.deepEqual(unchanged.map((r) => r.key), ["note", "expires_at", "allowed_operations"]);
  });
  const o = { time: (s: string) => `T(${s.slice(0, 10)})`, yes: "Có", no: "Không", none: "(không có)" };
  it("fieldValueText: bật/tắt, thời gian, danh sách, rỗng", () => {
    assert.equal(fieldValueText("active", 1, o), "Có");
    assert.equal(fieldValueText("active", 0, o), "Không");
    assert.equal(fieldValueText("created_at", "2026-11-19T09:13:26.455Z", o), "T(2026-11-19)");
    assert.equal(fieldValueText("allowed_operations", '["kanban_comment","kanban_read"]', o), "kanban_comment, kanban_read");
    assert.equal(fieldValueText("allowed_operations", "[]", o), "(không có)");
    assert.equal(fieldValueText("note", null, o), "(không có)");
    assert.equal(fieldValueText("note", "xin chào", o), "xin chào");
    assert.equal(fieldValueText("count", 0, o), "0");
  });
});

describe("trang Kiểm toán: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/AuditTrail.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  const labels = fs.readFileSync(findSrc("src/i18n/label-groups.vi.ts"), "utf-8");
  it("không còn ô «Đối tượng» (trùng ô «Nguồn»)", () => {
    assert.ok(!page.includes('data-filter="entity"'));
  });
  it("ngày/nguồn/hành động/người thay đổi có hiệu lực ngay; từ khoá có Enter", () => {
    assert.equal((page.match(/applyNow\(\{/g) ?? []).length, 5);
    assert.ok(page.includes('e.key === "Enter"'));
  });
  it("ô «Người thay đổi» hiện tên người + số vết", () => {
    assert.ok(page.includes("{actorOptionLabel(a)} ({formatNumber(a.count)})"));
    assert.ok(page.includes("labelCount"));
    assert.ok(!page.includes("<option key={a.value} value={a.value}>{a.value}</option>"));
  });
  it("ô đếm của «Người thay đổi» bỏ chính bộ lọc người (chọn rồi vẫn đổi được)", () => {
    assert.ok(page.includes('{ ...filters, actor: "", page: 1, page_size: 20 }'));
  });
  it("«Chi tiết» đứng đầu dòng, bấm cả dòng được", () => {
    const head = page.indexOf("<tr style={{ borderBottom");
    assert.ok(page.indexOf('data-audit-detail-btn=""') > 0);
    assert.ok(page.indexOf('<th style={thStyle}></th>', head) < page.indexOf("{at.timeCol}", head));
    assert.ok(page.includes("onClick={() => openDetail(item.id)}"));
  });
  it("phân trang có «Đến trang» (Pager chung)", () => {
    assert.ok(page.includes("<Pager page={page}"));
    assert.ok(!page.includes('data-page-btn="prev"'));
  });
  it("xuất bị cắt thì báo", () => {
    assert.ok(page.includes('X-Audit-Trail-Truncated'));
    assert.ok(page.includes("data-audit-export-truncated"));
  });
  it("đầu trang theo mẫu: h2 và nút cỡ nhỏ", () => {
    assert.ok(page.includes("<h2 style={{ margin: 0 }}>{at.title}</h2>"));
    assert.ok(!page.includes("<h1"));
    assert.equal((page.match(/pc-btn pc-btn--secondary pc-btn--sm" data-audit-/g) ?? []).length, 3);
  });
  it("nhãn tác nhân kỹ thuật bằng tiếng Việt, «President» là Chủ tịch", () => {
    for (const k of ["President:", '"hire-default":', '"system:core-tools":', "wizard:", "api:", "ea_agent:"]) assert.ok(labels.includes(k), k);
    assert.ok(labels.includes('President: "Chủ tịch"'));
  });
  it("có tên tiếng Việt cho trường, loại, loại thô; câu cảnh báo xuất bị cắt rõ ràng", () => {
    for (const k of ["fieldNames:", "kinds:", "rawActions:", "changedTitle:", "unchangedToggle:"]) assert.ok(vi.includes(k), k);
    assert.ok(vi.includes("hãy thu hẹp bộ lọc"));
  });
});
