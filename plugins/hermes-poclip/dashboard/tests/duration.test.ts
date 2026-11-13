import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { formatDuration } from "../src/lib/duration";

const short = { min: "p", hour: "h", day: "ng", dec: "," };
const long = { min: " phút", hour: " giờ", day: " ngày", dec: "," };

describe("formatDuration", () => {
  it("dưới 1 giờ nói bằng phút, tối thiểu 1 phút", () => {
    assert.equal(formatDuration(0.75, short), "45p");
    assert.equal(formatDuration(0, short), "1p");
    assert.equal(formatDuration(0.5, long), "30 phút");
  });

  it("từ 1 giờ đến dưới 48 giờ nói bằng giờ, dấu thập phân theo bộ chữ", () => {
    assert.equal(formatDuration(3.14, short), "3,1h");
    assert.equal(formatDuration(1, long), "1 giờ");
    assert.equal(formatDuration(26, short), "26h");
    assert.equal(formatDuration(3.14, { ...short, dec: "." }), "3.1h");
  });

  it("từ 48 giờ nói bằng ngày: dưới 10 ngày giữ một chữ số thập phân, từ 10 ngày làm tròn", () => {
    assert.equal(formatDuration(48, short), "2ng");
    assert.equal(formatDuration(100, short), "4,2ng");
    assert.equal(formatDuration(24 * 12.4, long), "12 ngày");
  });

  it("giá trị không hợp lệ không in ra chữ vô nghĩa", () => {
    assert.equal(formatDuration(-1, short), "");
    assert.equal(formatDuration(Number.NaN, short), "");
    assert.equal(formatDuration(Number.POSITIVE_INFINITY, short), "");
  });
});
