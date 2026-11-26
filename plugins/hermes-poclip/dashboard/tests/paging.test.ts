import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_SIZE_OPTIONS, clampPage, needsPager, pageCount, pageRange, sliceAt } from "../src/lib/paging";

describe("pageCount", () => {
  it("chia đúng, tối thiểu 1 trang", () => {
    assert.equal(pageCount(0, 25), 1);
    assert.equal(pageCount(25, 25), 1);
    assert.equal(pageCount(26, 25), 2);
    assert.equal(pageCount(101, 25), 5);
  });
  it("cỡ trang không hợp lệ → 1 trang", () => assert.equal(pageCount(50, 0), 1));
});

describe("sliceAt", () => {
  const items = Array.from({ length: 53 }, (_, i) => i + 1);
  it("trang đầu", () => {
    const r = sliceAt(items, 1, 25);
    assert.equal(r.slice.length, 25);
    assert.equal(r.slice[0], 1);
    assert.equal(r.offset, 0);
    assert.equal(r.pages, 3);
  });
  it("trang cuối lẻ", () => {
    const r = sliceAt(items, 3, 25);
    assert.deepEqual(r.slice, [51, 52, 53]);
    assert.equal(r.offset, 50);
  });
  it("trang quá lớn → kẹp về trang cuối (vd danh sách vừa ngắn đi sau khi lọc)", () => {
    const r = sliceAt(items, 99, 25);
    assert.equal(r.page, 3);
    assert.deepEqual(r.slice, [51, 52, 53]);
  });
  it("trang < 1 hoặc không phải số → trang 1", () => {
    assert.equal(sliceAt(items, 0, 25).page, 1);
    assert.equal(sliceAt(items, Number.NaN, 25).page, 1);
  });
  it("danh sách rỗng → trang 1, không có phần tử", () => {
    const r = sliceAt([], 4, 25);
    assert.equal(r.page, 1);
    assert.deepEqual(r.slice, []);
  });
  it("không sửa mảng gốc", () => {
    const copy = [...items];
    sliceAt(items, 2, 10);
    assert.deepEqual(items, copy);
  });
});

describe("clampPage / pageRange / needsPager / PAGE_SIZE_OPTIONS", () => {
  it("clampPage", () => {
    assert.equal(clampPage(3, 10), 3);
    assert.equal(clampPage(99, 10), 10);
    assert.equal(clampPage(-1, 10), 1);
    assert.equal(clampPage(2.9, 10), 2);
  });
  it("pageRange", () => {
    assert.deepEqual(pageRange(2, 25, 53), { from: 26, to: 50 });
    assert.deepEqual(pageRange(3, 25, 53), { from: 51, to: 53 });
    assert.deepEqual(pageRange(1, 25, 0), { from: 0, to: 0 });
  });
  it("needsPager chỉ khi vượt cỡ trang nhỏ nhất", () => {
    assert.equal(needsPager(10), false);
    assert.equal(needsPager(11), true);
  });
  it("các cỡ trang nằm trong giới hạn API và tăng dần", () => {
    const o = [...PAGE_SIZE_OPTIONS];
    assert.ok(o.every((n) => n >= 1 && n <= 100));
    assert.deepEqual(o, [...o].sort((a, b) => a - b));
  });
});
