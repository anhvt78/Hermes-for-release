import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không thấy ${relPath}`);
}

// Trang Ngân sách thiết kế lại 12/11/2026: MỘT bảng cho mọi nhân viên (không còn «mỗi hạn mức một ô»).
describe("Ngân sách — bảng theo nhân viên", () => {
  const src = fs.readFileSync(findSrc("src/pages/Budget.tsx"), "utf8");
  it("không dùng orgUnitLabel (nhãn đơn vị) cho mã nhân viên; phòng chỉ lấy từ org_unit", () => {
    assert.doesNotMatch(src, /orgUnitLabel\(t, s\.agent_id\)/);
    assert.doesNotMatch(src, /orgUnitLabel\(t, agent\.agent_id\)/);
    assert.match(src, /orgUnitLabel\(t, s\.org_unit\)/);
  });
  it("nhân viên chưa có hạn mức được đánh dấu rõ MỘT lần (trạng thái «Chưa có hạn mức» + bộ lọc riêng), không lặp thêm nhãn «chưa có»", () => {
    assert.match(src, /limit_source !== "none"/);          // bộ lọc «Chưa có hạn mức»
    assert.match(src, /b\.filterNone/);
    assert.doesNotMatch(src, /tone=\{s\.limit_source === "none" \? "danger"/);
  });
  it("hiện TÊN tiếng Việt thống nhất (personLabelOr); mã chỉ nằm ở chú thích khi rê chuột", () => {
    assert.match(src, /personLabelOr\(t, s\.agent_id, s\.name\)/);
    assert.match(src, /<td title=\{s\.agent_id\}>/);
    assert.doesNotMatch(src, /\{s\.name && <div[^>]*>\{s\.agent_id\}/);
  });
  it("hạn mức mặc định và đặt hàng loạt gọi đúng đường dẫn", () => {
    assert.match(src, /\/api\/v1\/budget\/default-policy/);
    assert.match(src, /\/api\/v1\/budget\/policies\/bulk/);
    assert.match(src, /\/api\/v1\/budget\/overview/);
  });

  it("ngân sách 23/11/2026: một hộp cảnh báo chung, thanh chọn hàng loạt dính, ROAS chỉ hiện khi có doanh thu, hộp dừng khẩn cấp không lộ mã", () => {
    assert.match(src, /b\.alertNoLimitBoth\(/);
    assert.match(src, /data-budget-bulkbar=""[^>]*position: "sticky"/);
    assert.match(src, /\{roas && roas\.some\(\(r\) => r\.revenue_usd !== null\) && <details data-budget-roas=""/);
    assert.doesNotMatch(src, /policyId\.slice\(0, 8\)/);
    assert.match(src, /data-stop-actor=""/);
    assert.doesNotMatch(src, /setActor/);
  });
  it("ô nhập hạn mức: Enter lưu, Esc huỷ, có đơn vị, không còn «0.00»; thẻ mặc định có «?» và dòng số liệu tham khảo", () => {
    assert.match(src, /e\.key === "Enter"/);
    assert.match(src, /e\.key === "Escape"/);
    assert.doesNotMatch(src, /placeholder="0\.00"/);
    assert.match(src, /b\.rowLimitPlaceholder/);
    assert.match(src, /data-budget-stats=""/);
    assert.match(src, /<InfoHint wide><span data-default-control-note="">/);
  });
  it("bảng có bề rộng tối thiểu cho điện thoại", () => {
    assert.match(src, /data-budget-table="" style=\{\{ width: "100%", minWidth: 760/);
  });
});
