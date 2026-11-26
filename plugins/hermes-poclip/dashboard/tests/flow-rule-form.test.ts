import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codeFromDisplayName, slaToSeconds, splitSla, uniqueCode } from "../src/lib/flowRuleForm";

const NAME_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;

describe("codeFromDisplayName", () => {
  it("bỏ dấu tiếng Việt, đ → d, ghép bằng gạch dưới", () => {
    assert.equal(codeFromDisplayName("Báo cáo tháng gửi Điều hành"), "custom.bao_cao_thang_gui_dieu_hanh");
    assert.equal(codeFromDisplayName("  Đề xuất — chốt! "), "custom.de_xuat_chot");
  });
  it("kết quả luôn khớp mẫu mã hợp lệ của máy chủ", () => {
    for (const s of ["Báo cáo", "OKR 2026", "a", "Đ", "Hỗ trợ khách hàng VIP (khẩn)"]) assert.match(codeFromDisplayName(s), NAME_RE);
  });
  it("không còn ký tự hợp lệ → rỗng; cắt tối đa 40 ký tự tên", () => {
    assert.equal(codeFromDisplayName("???"), "");
    assert.ok(codeFromDisplayName("a".repeat(100)).length <= "custom.".length + 40);
  });
});

describe("uniqueCode", () => {
  it("thêm hậu tố khi trùng", () => {
    assert.equal(uniqueCode("custom.x", ["custom.y"]), "custom.x");
    assert.equal(uniqueCode("custom.x", ["custom.x"]), "custom.x_2");
    assert.equal(uniqueCode("custom.x", ["custom.x", "custom.x_2"]), "custom.x_3");
    assert.equal(uniqueCode("", ["a"]), "");
  });
});

describe("hạn xử lý theo đơn vị", () => {
  it("10 phút = 600 giây (không còn nhầm 10 thành 10 giây)", () => {
    assert.equal(slaToSeconds("10", "min"), 600);
    assert.equal(slaToSeconds("2", "hour"), 7200);
    assert.equal(slaToSeconds("45", "sec"), 45);
    assert.equal(slaToSeconds("1,5", "min"), 90);
  });
  it("rỗng = không đặt hạn; số không hợp lệ = NaN", () => {
    assert.equal(slaToSeconds("  ", "min"), null);
    assert.ok(Number.isNaN(slaToSeconds("0", "min") as number));
    assert.ok(Number.isNaN(slaToSeconds("abc", "min") as number));
    assert.ok(Number.isNaN(slaToSeconds("-5", "sec") as number));
  });
  it("splitSla chọn đơn vị lớn nhất chia hết và khớp slaToSeconds", () => {
    assert.deepEqual(splitSla(600), { value: "10", unit: "min" });
    assert.deepEqual(splitSla(3600), { value: "1", unit: "hour" });
    assert.deepEqual(splitSla(90), { value: "90", unit: "sec" });
    assert.deepEqual(splitSla(null), { value: "", unit: "min" });
    for (const s of [1, 10, 59, 60, 90, 600, 3600, 7200, 5400]) {
      const { value, unit } = splitSla(s);
      assert.equal(slaToSeconds(value, unit), s);
    }
  });
});
