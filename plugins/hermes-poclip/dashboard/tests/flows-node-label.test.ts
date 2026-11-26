import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wrapNodeLabel } from "../src/lib/flowsFrame";

describe("wrapNodeLabel — tên nút trên sơ đồ tối đa 2 dòng", () => {
  it("tên ngắn giữ 1 dòng", () => {
    assert.deepEqual(wrapNodeLabel("Đầu tư"), ["Đầu tư"]);
    assert.deepEqual(wrapNodeLabel("Nghiên cứu"), ["Nghiên cứu"]);
  });
  it("tên vừa ngắt thành 2 dòng, không cắt chữ", () => {
    assert.deepEqual(wrapNodeLabel("Đầu tư và Danh mục"), ["Đầu tư và", "Danh mục"]);
  });
  it("tên quá dài: dòng 2 kết thúc bằng …", () => {
    assert.deepEqual(wrapNodeLabel("Theo dõi thị trường và Cảnh báo"), ["Theo dõi", "thị trường…"]);
  });
  it("từ đơn quá dài bị cắt", () => {
    assert.deepEqual(wrapNodeLabel("Infrastructure"), ["Infrastruc…"]);
  });
  it("tên rỗng hoặc toàn khoảng trắng → 1 dòng rỗng", () => {
    assert.deepEqual(wrapNodeLabel("   "), [""]);
  });
  it("không bao giờ quá 2 dòng và mỗi dòng ≤ maxLen", () => {
    for (const name of ["Tư vấn & Phù hợp Khách hàng", "Lead Kiểm định Chất lượng (QA & Backtest)", "A B C D E F G H I J K L"]) {
      const lines = wrapNodeLabel(name);
      assert.ok(lines.length <= 2, name);
      for (const l of lines) assert.ok(l.length <= 11, `${name} → ${l}`);
    }
  });
});
