import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { relativeTime, type TimeAgoLabels } from "../src/lib/timeAgo";

const L: TimeAgoLabels = {
  justNow: "vừa xong",
  minutes: (n) => `${n} phút trước`,
  hours: (n) => `${n} giờ trước`,
  days: (n) => `${n} ngày trước`,
  months: (n) => `${n} tháng trước`,
  years: (n) => `${n} năm trước`,
};
const NOW = Date.parse("2026-11-21T12:00:00Z");
const ago = (sec: number) => new Date(NOW - sec * 1000).toISOString();

describe("«x trước» theo nhãn đã dịch (21/11/2026)", () => {
  it("các mốc: vừa xong, phút, giờ, ngày, tháng, năm", () => {
    assert.equal(relativeTime(ago(20), L, NOW), "vừa xong");
    assert.equal(relativeTime(ago(5 * 60), L, NOW), "5 phút trước");
    assert.equal(relativeTime(ago(3 * 3600), L, NOW), "3 giờ trước");
    assert.equal(relativeTime(ago(26 * 3600), L, NOW), "1 ngày trước");
    assert.equal(relativeTime(ago(16 * 86400), L, NOW), "16 ngày trước");
    assert.equal(relativeTime(ago(65 * 86400), L, NOW), "2 tháng trước");
    assert.equal(relativeTime(ago(800 * 86400), L, NOW), "2 năm trước");
  });

  it("không bao giờ ra chữ tiếng Anh «ago» khi nhãn là tiếng Việt", () => {
    for (const s of [30, 600, 7200, 90000, 1500000, 40000000]) assert.ok(!/ago/.test(relativeTime(ago(s), L, NOW)));
  });

  it("rỗng / sai định dạng → chuỗi rỗng; tương lai → vừa xong", () => {
    assert.equal(relativeTime(null, L, NOW), "");
    assert.equal(relativeTime(undefined, L, NOW), "");
    assert.equal(relativeTime("không phải ngày", L, NOW), "");
    assert.equal(relativeTime(new Date(NOW + 3600_000).toISOString(), L, NOW), "vừa xong");
  });
});
