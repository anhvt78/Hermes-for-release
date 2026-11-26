import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { foldList, overallState } from "../src/lib/system-health-view";

// Tab «Tình trạng hệ thống» — đợt rà soát 23/11/2026

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

describe("dòng tổng chỉ kết luận khi mọi nguồn đã trả lời", () => {
  it("còn nguồn đang tải → «checking» (không báo «ổn» sớm)", () => {
    assert.equal(overallState([false, true], [], {}, 0), "checking");
  });
  it("còn khối chưa báo mức → «checking»", () => {
    assert.equal(overallState([false], ["provider", "profiles"], { provider: "ok" }, 0), "checking");
  });
  it("đủ rồi: nặng nhất thắng; có vấn đề đếm được cũng là «warning»; không gì → «ok»", () => {
    assert.equal(overallState([false], ["a", "b"], { a: "ok", b: "critical" }, 0), "critical");
    assert.equal(overallState([false], ["a"], { a: "warning" }, 0), "warning");
    assert.equal(overallState([false], ["a"], { a: "ok" }, 2), "warning");
    assert.equal(overallState([false], ["a"], { a: "ok" }, 0), "ok");
  });
  it("khối lỗi/không áp dụng không nằm trong danh sách chờ → không kẹt ở «checking»", () => {
    assert.equal(overallState([false], [], { license: "ok" }, 0), "ok");
  });
});

describe("foldList", () => {
  it("gập: n mục đầu + số ẩn; mở: đủ", () => {
    const items = [1, 2, 3, 4, 5, 6];
    assert.deepEqual(foldList(items, 4, false), { shown: [1, 2, 3, 4], hidden: 2 });
    assert.deepEqual(foldList(items, 4, true), { shown: items, hidden: 2 });
    assert.deepEqual(foldList([1], 4, false), { shown: [1], hidden: 0 });
  });
});

describe("trang Tình trạng hệ thống: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/SystemHealth.tsx"), "utf-8");
  const diag = fs.readFileSync(findSrc("src/pages/DiagnosticsCard.tsx"), "utf-8");
  const lic = fs.readFileSync(findSrc("src/pages/LicenseCard.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("«Làm mới» nạp lại MỌI nguồn bằng một `tick`", () => {
    assert.equal((page.match(/\[tick\]/g) ?? []).length, 6);
    assert.ok(page.includes("<LicenseCard refreshKey={tick}"));
    assert.ok(lic.includes('"/api/v1/license", [refreshKey]'));
    assert.ok(page.includes("data-health-refresh"));
  });
  it("các khối con nhận dữ liệu từ trang (không tự gọi riêng nữa)", () => {
    assert.ok(page.includes("<ProviderCheck data={prov.data}"));
    assert.ok(page.includes("<ToolPolicyHealthCard data={toolPolicy.data}"));
    assert.ok(page.includes("<ModelDiversityCard data={diversity.data}"));
    assert.ok(page.includes("<ProfileRepairCard data={profiles.data}"));
  });
  it("dòng tổng có trạng thái «checking» và dùng overallState", () => {
    assert.ok(page.includes("overallState("));
    assert.ok(page.includes('data-health-state={overall}'));
  });
  it("gói chẩn đoán gập sẵn, câu mở đầu không mâu thuẫn, bảng xem trước cuộn ngang", () => {
    assert.ok(diag.includes("<FoldSection"));
    assert.ok(diag.includes('overflowX: "auto"'));
    assert.ok(!vi.includes("rồi tự gửi cho người hỗ trợ"));
    assert.ok(vi.includes("Hermes+ chỉ tạo tệp, không tự gửi đi đâu."));
  });
  it("giải thích dài nằm sau «?» (hồ sơ, chính sách công cụ, đa dạng mô hình, lời khuyên, tiêu đề trang)", () => {
    for (const k of ["t.systemHealth.profIntro", "sh.tpIntro", "sh.mdIntro", "sh.mdAdvice", "t.systemHealth.backgroundNote"]) {
      assert.ok(page.includes(`<InfoHint wide>{${k}}</InfoHint>`), k);
    }
  });
  it("khối đa dạng mô hình: tên người (không mã), gập sau 4 vai", () => {
    assert.ok(page.includes("SHORT_ROLES = 4"));
    assert.ok(page.includes("{personLabel(t, p)}"));
    assert.ok(!page.includes("<code>{p.profile_id}</code>"));
    assert.ok(!page.includes("<code>{m.profile_id}</code>"));
  });
  it("khối «Nhân viên vận hành xem xét» gập sẵn, không còn biểu tượng 🤖", () => {
    assert.ok(page.includes("<FoldSection title={t.systemHealth.opsTitle}"));
    assert.ok(!vi.includes("🤖 Nhân viên vận hành"));
  });
  it("liên kết sang Giám sát là nút chuyển tab trong trang", () => {
    assert.ok(page.includes("navigateToTab(MONITORING_TAB_ID)"));
    assert.ok(!page.includes("tabHref("));
  });
  it("chữ tiếng Việt của trang không còn từ kỹ thuật", () => {
    const start = vi.indexOf("  systemHealth: {");
    const block = vi.slice(start, vi.indexOf("  // ── Giấy phép", start));
    const shown = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    for (const bad of ["agent", "Gateway", "gateway", "cron", "dispatcher", "per-profile", "«ready»", "Khóa"]) {
      const hit = shown.filter((s) => s.includes(bad) && !s.startsWith("Cấu hình cần đặt"));
      assert.equal(hit.length, 0, `${bad}: ${hit[0] ?? ""}`);
    }
  });
});
