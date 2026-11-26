import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// «Bàn giao giữa các phòng (nâng cao)» — đợt rà soát 23/11/2026

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

const page = fs.readFileSync(findSrc("src/pages/InterDeptFlows.tsx"), "utf-8");
const units = fs.readFileSync(findSrc("src/pages/UnitNamesCard.tsx"), "utf-8");

describe("InterDeptFlows: bố cục và nút", () => {
  it("bảng quy tắc có bề rộng tối thiểu để điện thoại cuộn ngang trong khung", () => {
    assert.match(page, /\.\.\.tableStyle, minWidth: 860/);
  });
  it("giải thích gom vào «?», không còn hộp «Lưu ý» và đoạn mở đầu lặp ý", () => {
    assert.ok(page.includes("{f.intro} {f.noteEngine}"));
    assert.ok(!page.includes("data-idf-note"));
  });
  it("«Xuất» ghi rõ là xuất cấu hình và có «?» nói gồm những gì", () => {
    assert.ok(page.includes("f.exportHint"));
  });
  it("cảnh báo đầu trang cho phòng có nhân viên mà chưa có quy định, kèm đường tới «Cơ chế vận hành»", () => {
    assert.ok(page.includes("data-idf-no-rule"));
    assert.ok(page.includes("navigateToTab(OPERATING_MODEL_TAB_ID)"));
  });
  it("mỗi hàng chỉ ba nút (xem thực tế, sửa, xoá) trên một hàng; không còn menu «Thêm ▾»", () => {
    assert.ok(!page.includes("data-rule-more"));
    assert.ok(page.includes("data-rule-delete={topic.name}"));
    assert.ok(page.includes('flexWrap: "nowrap", alignItems: "center", minWidth: 200'));
  });
  it("xoá vẫn hỏi xác nhận trước khi xoá", () => {
    assert.match(page, /async function handleDelete[\s\S]*?confirmDialog/);
  });
  it("«—» của cột «Có việc đi qua» đổi thành «Không tính được»; mức rủi ro là nhãn màu", () => {
    assert.ok(page.includes("f.runningUnknown"));
    assert.ok(page.includes('topic.default_risk_tier === "T3" ? "critical"'));
  });
});

describe("UnitNamesCard: bảng phòng ban", () => {
  it("bỏ cột «Mã phòng» và «Tình trạng»; mã phòng chuyển vào chú thích khi rê chuột", () => {
    assert.ok(!units.includes("f.unitsColCode"));
    assert.ok(!units.includes("f.unitsColStatus"));
    assert.ok(units.includes("f.unitCodeTip(row.slug)"));
  });
  it("vẫn cảnh báo phòng không còn trong cơ cấu; phòng chưa có quy định hiện ngay ở cột quy định", () => {
    assert.ok(units.includes("data-idf-unit-gone"));
    assert.ok(units.includes("row.rules_count === 0 ? <TagPill>{f.unitsNoRule}</TagPill>"));
  });
  it("bảng có bề rộng tối thiểu cho điện thoại", () => {
    assert.ok(units.includes("minWidth: 480"));
  });
});
