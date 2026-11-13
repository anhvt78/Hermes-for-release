import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDarkBackground, luminanceOfCssColor } from "../src/lib/color-scheme";

describe("isDarkBackground — nền các theme dựng sẵn của dashboard", () => {
  it("Hermes Teal #041c1c = tối", () => assert.equal(isDarkBackground("rgb(4, 28, 28)"), true));
  it("Midnight #0a0a1f = tối", () => assert.equal(isDarkBackground("rgb(10, 10, 31)"), true));
  it("Mono #0e0e0e = tối", () => assert.equal(isDarkBackground("rgb(14, 14, 14)"), true));
  it("Rosé #1a0f15 = tối", () => assert.equal(isDarkBackground("rgb(26, 15, 21)"), true));
  it("Nous Blue #E8F2FD = sáng", () => assert.equal(isDarkBackground("rgb(232, 242, 253)"), false));
  it("trắng = sáng, đen = tối", () => {
    assert.equal(isDarkBackground("rgb(255, 255, 255)"), false);
    assert.equal(isDarkBackground("rgb(0, 0, 0)"), true);
  });
});

describe("luminanceOfCssColor — đầu vào không dùng được", () => {
  it("trong suốt hẳn → null (để thử phần tử cha)", () => {
    assert.equal(luminanceOfCssColor("rgba(0, 0, 0, 0)"), null);
    assert.equal(isDarkBackground("rgba(0, 0, 0, 0)"), null);
  });
  it("rgba có alpha > 0 vẫn đọc được", () => assert.equal(isDarkBackground("rgba(4, 28, 28, 0.9)"), true));
  it("cú pháp màu hiện đại dạng khoảng trắng", () => assert.equal(isDarkBackground("rgb(4 28 28 / 1)"), true));
  it("chuỗi lạ/rỗng → null", () => {
    assert.equal(luminanceOfCssColor(""), null);
    assert.equal(luminanceOfCssColor("transparent"), null);
    assert.equal(luminanceOfCssColor("not-a-color"), null);
  });
});
