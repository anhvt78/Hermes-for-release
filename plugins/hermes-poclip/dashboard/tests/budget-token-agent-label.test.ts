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
  it("nhân viên chưa có hạn mức được đánh dấu rõ (nhãn «chưa có» màu cảnh báo + bộ lọc riêng)", () => {
    assert.match(src, /limit_source === "none"/);
    assert.match(src, /b\.srcNone/);
    assert.match(src, /b\.filterNone/);
  });
  it("hiện tên nhân viên (kèm mã nhỏ bên dưới), không chỉ mã", () => {
    assert.match(src, /s\.name \|\| s\.agent_id/);
    assert.match(src, /\{s\.name && /);
  });
  it("hạn mức mặc định và đặt hàng loạt gọi đúng đường dẫn", () => {
    assert.match(src, /\/api\/v1\/budget\/default-policy/);
    assert.match(src, /\/api\/v1\/budget\/policies\/bulk/);
    assert.match(src, /\/api\/v1\/budget\/overview/);
  });
});
