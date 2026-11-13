import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expandCronSlots, findScheduleOverlaps } from "../src/lib/schedule-overlap";
import type { ScheduleInput } from "../src/lib/schedule-overlap";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sched(id: string, name: string, cron: string): ScheduleInput {
  return { id, name, cron_expression: cron };
}

// ── expandCronSlots ───────────────────────────────────────────────────────────

describe("expandCronSlots", () => {
  it("giao ban 09:00 T2–T6 (0 9 * * 1-5) → 5 mốc", () => {
    const slots = expandCronSlots("0 9 * * 1-5");
    assert.equal(slots.size, 5);
    assert.ok(slots.has("1-09:00"), "thiếu Thứ Hai 09:00");
    assert.ok(slots.has("5-09:00"), "thiếu Thứ Sáu 09:00");
    assert.ok(!slots.has("0-09:00"), "Chủ nhật không được có");
    assert.ok(!slots.has("6-09:00"), "Thứ Bảy không được có");
  });

  it("tổng kết dự án 10:00 Thứ Hai (0 10 * * 1) → đúng 1 mốc", () => {
    const slots = expandCronSlots("0 10 * * 1");
    assert.equal(slots.size, 1);
    assert.ok(slots.has("1-10:00"));
  });

  it("lịch DOM=1 (0 14 1 * *) → set rỗng vì DOM khác *", () => {
    const slots = expandCronSlots("0 14 1 * *");
    assert.equal(slots.size, 0);
  });

  it("bước giờ */2 Thứ Ba (0 */2 * * 2) → 12 mốc (0,2,4,...,22)", () => {
    const slots = expandCronSlots("0 */2 * * 2");
    assert.equal(slots.size, 12);
    assert.ok(slots.has("2-00:00"));
    assert.ok(slots.has("2-22:00"));
    assert.ok(!slots.has("2-01:00"));
  });

  it("danh sách giờ 9,14 Thứ Hai (0 9,14 * * 1) → 2 mốc", () => {
    const slots = expandCronSlots("0 9,14 * * 1");
    assert.equal(slots.size, 2);
    assert.ok(slots.has("1-09:00"));
    assert.ok(slots.has("1-14:00"));
  });

  it("dải dow 1-3 (0 10 * * 1-3) → 3 mốc", () => {
    const slots = expandCronSlots("0 10 * * 1-3");
    assert.equal(slots.size, 3);
    assert.ok(slots.has("1-10:00"));
    assert.ok(slots.has("2-10:00"));
    assert.ok(slots.has("3-10:00"));
  });

  it("cron ít hơn 5 trường → set rỗng", () => {
    assert.equal(expandCronSlots("0 9 *").size, 0);
    assert.equal(expandCronSlots("").size, 0);
  });
});

// ── findScheduleOverlaps ─────────────────────────────────────────────────────

describe("findScheduleOverlaps", () => {
  it("giao ban 09:00 và tổng kết dự án 10:00 Thứ Hai → không trùng", () => {
    const result = findScheduleOverlaps([
      sched("giao-ban", "Giao ban", "0 9 * * 1-5"),
      sched("tong-ket", "Tổng kết dự án hàng tuần", "0 10 * * 1"),
    ]);
    assert.equal(result.has_overlap, false, "09:00 và 10:00 không trùng nhau");
    assert.equal(result.groups.length, 0);
  });

  it("2 lịch cùng 10:00 Thứ Hai → 1 nhóm trùng", () => {
    const result = findScheduleOverlaps([
      sched("a", "Lịch A", "0 10 * * 1"),
      sched("b", "Lịch B", "0 10 * * 1"),
    ]);
    assert.equal(result.has_overlap, true);
    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0].slot, "10:00");
    assert.equal(result.groups[0].weekday, 1);
    assert.deepEqual(result.groups[0].ids.sort(), ["a", "b"]);
  });

  it("lịch DOM=1 → domRestricted, không tính overlap tuần", () => {
    const result = findScheduleOverlaps([
      sched("giao-ban", "Giao ban", "0 9 * * 1-5"),
      sched("hang-thang", "Tổng kết tháng", "0 14 1 * *"),
    ]);
    assert.equal(result.has_overlap, false);
    assert.equal(result.domRestricted.length, 1);
    assert.equal(result.domRestricted[0].id, "hang-thang");
    assert.equal(result.domRestricted[0].dom, "1");
  });

  it("không có lịch nào → kết quả rỗng", () => {
    const result = findScheduleOverlaps([]);
    assert.equal(result.has_overlap, false);
    assert.equal(result.groups.length, 0);
    assert.equal(result.domRestricted.length, 0);
  });

  it("3 lịch cùng 09:00 Thứ Hai → 1 nhóm với 3 id", () => {
    const result = findScheduleOverlaps([
      sched("x", "X", "0 9 * * 1"),
      sched("y", "Y", "0 9 * * 1"),
      sched("z", "Z", "0 9 * * 1"),
    ]);
    assert.equal(result.has_overlap, true);
    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0].ids.length, 3);
  });

  it("đúng bộ 3 lịch chuẩn sau khi giãn giờ → không trùng", () => {
    const result = findScheduleOverlaps([
      sched("giao-ban", "Giao ban hàng ngày", "0 9 * * 1-5"),
      sched("tong-ket-du-an", "Tổng kết dự án hàng tuần", "0 10 * * 1"),
      sched("tong-ket-thang", "Tổng kết & rút kinh nghiệm", "0 14 1 * *"),
    ]);
    assert.equal(result.has_overlap, false, "3 lịch đã giãn giờ không được trùng");
    assert.equal(result.domRestricted.length, 1);
    assert.equal(result.domRestricted[0].id, "tong-ket-thang");
  });
});
