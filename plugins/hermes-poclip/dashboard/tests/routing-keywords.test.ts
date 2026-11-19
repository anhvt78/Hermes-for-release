import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeAdvancedPattern, simplifyPattern, toPattern } from "../src/lib/routing-keywords";

// Chuyển đổi từ khoá «chữ thường» ↔ mẫu regex lưu trong CSDL (tab «Phân phối chỉ thị»)

describe("routing-keywords", () => {
  it("mẫu hạt giống đơn giản đọc ra chữ thường; mẫu nâng cao thì không", () => {
    assert.equal(simplifyPattern("\\bkỹ thuật\\b"), "kỹ thuật");
    assert.equal(simplifyPattern("\\btech\\b"), "tech");
    assert.equal(simplifyPattern("\\bq[1-4]\\b"), null);
    assert.equal(simplifyPattern("^invoice\\s+"), null);
    assert.equal(simplifyPattern("api"), null);
  });

  it("đi và về giữ nguyên chữ", () => {
    for (const w of ["kỹ thuật", "api", "tài chính", "kế toán", "back-end", "q1"]) {
      assert.equal(simplifyPattern(toPattern(w)), w, w);
    }
  });

  it("thoát ký tự đặc biệt, bỏ \\b ở biên không phải chữ", () => {
    assert.equal(toPattern("c++"), "\\bc\\+\\+");
    assert.equal(toPattern("  Kỹ   thuật "), "\\bKỹ thuật\\b");
  });

  it("mẫu sinh ra khớp trọn từ, không phân biệt hoa/thường", () => {
    const re = new RegExp(toPattern("Kỹ thuật"), "i");
    assert.ok(re.test("nhờ phòng kỹ thuật xem giúp"));
    assert.ok(!re.test("kỹ thuậtx"));
  });

  it("mẫu nâng cao quen thuộc hiện thành chữ dễ đọc", () => {
    assert.equal(describeAdvancedPattern("\\bq[1-4]\\b"), "Q1–Q4");
    assert.equal(describeAdvancedPattern("\\b(hóa đơn|invoice)\\b"), "hóa đơn / invoice");
    assert.equal(describeAdvancedPattern("\\bci\\/cd\\b"), "ci/cd");
    assert.equal(describeAdvancedPattern("^invoice\\s+"), null);
    assert.equal(describeAdvancedPattern("\\b(solo)\\b"), null);
  });
});
