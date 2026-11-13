import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { caseSpan, ganttRows, logPos, pct } from "../src/lib/progress";

const T0 = Date.parse("2026-11-03T00:00:00Z");
const at = (h: number) => new Date(T0 + h * 3_600_000).toISOString();
const node = (id: string, status: string, created: number, started: number | null, completed: number | null) => ({
  id, status, created_at: at(created), started_at: started === null ? null : at(started), completed_at: completed === null ? null : at(completed),
});

describe("logPos", () => {
  it("0 giờ ở đầu thang, mức lớn nhất ở cuối thang, tăng dần theo kiểu logarit", () => {
    assert.equal(logPos(0, 100), 0);
    assert.equal(logPos(100, 100), 1);
    const small = logPos(0.1, 100);
    const mid = logPos(5, 100);
    assert.ok(0 < small && small < mid && mid < 1);
    assert.ok(logPos(1, 100) > 0.3, "khâu 1 giờ vẫn nhìn thấy được khi có khâu 100 giờ");
  });
  it("giá trị không hợp lệ không làm hỏng thanh", () => {
    assert.equal(logPos(-1, 10), 0);
    assert.equal(logPos(5, 0), 0);
    assert.equal(logPos(500, 100), 1);
  });
});

describe("pct", () => {
  it("làm tròn và an toàn khi tổng bằng 0", () => {
    assert.equal(pct(363, 398), 91);
    assert.equal(pct(0, 0), 0);
    assert.equal(pct(1, 3), 33);
  });
});

describe("caseSpan", () => {
  it("sự vụ đã xong hết: từ lúc giao việc đầu đến lúc xong việc cuối", () => {
    const s = caseSpan([node("a", "done", 0, 0.5, 3), node("b", "done", 3, 3.5, 9)], T0 + 100 * 3_600_000);
    assert.deepEqual([s.totalHours, s.allDone], [9, true]);
  });
  it("còn việc chưa xong: tính đến hiện tại", () => {
    const s = caseSpan([node("a", "done", 0, 0.5, 3), node("b", "running", 3, 3.5, null)], T0 + 12 * 3_600_000);
    assert.deepEqual([s.totalHours, s.allDone], [12, false]);
  });
  it("không có mốc thời gian nào thì không tính", () => {
    const s = caseSpan([{ id: "x", status: "ready", created_at: null, started_at: null, completed_at: null }], T0);
    assert.deepEqual([s.startMs, s.totalHours], [null, null]);
  });
});

describe("ganttRows", () => {
  const now = T0 + 10 * 3_600_000;
  const rows = ganttRows([node("a", "done", 0, 1, 4), node("b", "running", 4, 5, null), node("c", "ready", 6, null, null)], now);
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));

  it("đoạn chờ và đoạn xử lý nằm đúng chỗ trên trục 0–100%", () => {
    assert.equal(by.a.left, 0);
    assert.equal(Math.round(by.a.wait), 10);       // chờ 1 giờ trên tổng 10 giờ
    assert.equal(Math.round(by.a.handle), 30);     // xử lý 3 giờ
    assert.equal(by.a.open, false);
  });

  it("việc đang làm kéo tới hiện tại, việc chưa nhận chỉ có đoạn chờ", () => {
    assert.equal(by.b.open, true);
    assert.equal(Math.round(by.b.left), 40);
    assert.equal(Math.round(by.b.handle), 50);     // từ 5 giờ đến hiện tại (10 giờ)
    assert.equal(by.c.started, false);
    assert.equal(by.c.handle, 0);
    assert.equal(Math.round(by.c.wait), 40);       // chờ từ 6 giờ đến hiện tại
  });

  it("đoạn rất ngắn vẫn có độ rộng tối thiểu để nhìn thấy, và không vượt khỏi trục", () => {
    const r = ganttRows([node("a", "done", 0, 0.001, 0.002), node("z", "done", 10, 10, 10)], T0 + 10 * 3_600_000);
    assert.ok(r[0].wait >= 0.8 && r[0].handle >= 0.8);
    assert.ok(r[1].left + r[1].wait <= 100.0001);
  });
});
