import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadAllPages } from "../src/lib/load-all-pages";

// Máy chủ giả: `total` dòng, mỗi trang `size` dòng, đếm số lần gọi
function fakeServer(total: number, size: number) {
  const calls: number[] = [];
  const fetchPage = async (i: number) => {
    calls.push(i);
    const items = Array.from({ length: Math.max(0, Math.min(size, total - i * size)) }, (_, k) => i * size + k);
    return { items, total, unread_total: 7 };
  };
  return { fetchPage, calls };
}

describe("loadAllPages", () => {
  it("260 dòng, trang 100 → gom đủ 260 dòng bằng 3 lần gọi (bug cũ: chỉ lấy 100)", async () => {
    const s = fakeServer(260, 100);
    const r = await loadAllPages(s.fetchPage);
    assert.equal(r.items.length, 260);
    assert.equal(r.total, 260);
    assert.equal(r.truncated, false);
    assert.deepEqual(s.calls, [0, 1, 2]);
    assert.equal((r.items as number[])[259], 259); // dòng cuối (vị trí 259) có mặt — đúng thông báo loại «phiếu duyệt» từng bị ẩn
  });

  it("giữ nguyên các trường khác của trang đầu (unread_total)", async () => {
    const r = await loadAllPages(fakeServer(250, 100).fetchPage);
    assert.equal((r.first as { unread_total: number }).unread_total, 7);
  });

  it("chỉ một trang đủ → không gọi thêm", async () => {
    const s = fakeServer(5, 100);
    const r = await loadAllPages(s.fetchPage);
    assert.equal(r.items.length, 5);
    assert.deepEqual(s.calls, [0]);
  });

  it("danh sách rỗng", async () => {
    const r = await loadAllPages(fakeServer(0, 100).fetchPage);
    assert.equal(r.items.length, 0);
    assert.equal(r.truncated, false);
  });

  it("chạm trần số trang → truncated=true, total vẫn là số thật để báo «còn N mục»", async () => {
    const s = fakeServer(1000, 100);
    const r = await loadAllPages(s.fetchPage, { maxPages: 3 });
    assert.equal(r.items.length, 300);
    assert.equal(r.total, 1000);
    assert.equal(r.truncated, true);
    assert.equal(s.calls.length, 3);
  });

  it("máy chủ hết dữ liệu sớm hơn total → dừng, không lặp vô hạn", async () => {
    let n = 0;
    const r = await loadAllPages(async (i) => {
      n += 1;
      return { items: i === 0 ? [1, 2, 3] : [], total: 50 };
    });
    assert.equal(n, 2);
    assert.equal(r.items.length, 3);
    assert.equal(r.truncated, true);
  });

  it("máy chủ không báo total → dùng số dòng trang đầu", async () => {
    const r = await loadAllPages(async () => ({ items: [1, 2] }));
    assert.equal(r.total, 2);
    assert.equal(r.truncated, false);
  });
});
