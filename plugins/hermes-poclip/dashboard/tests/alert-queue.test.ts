import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OLD_DAYS, applyQueueFilter, countBySeverity, distinctSources, looksCut, needKind, sortQueue, taskIdOf, totalAlerts, type QueueLike,
} from "../src/lib/alertQueue";

const mk = (o: Partial<QueueLike> & { id: string }): QueueLike & { id: string } => ({
  severity: "warning", age_days: 1, source: "ceo-agent", ref: null, alert_ids: [o.id], alert_count: 1, card: null, ...o,
});
const L = [
  mk({ id: "a", severity: "warning", age_days: 23.9, source: "ceo-agent" }),
  mk({ id: "b", severity: "critical", age_days: 3, source: "whistleblower" }),
  mk({ id: "c", severity: "critical", age_days: 23, source: "audit-agent" }),
  mk({ id: "d", severity: "warning", age_days: 2, source: "audit-agent", alert_ids: ["d1", "d2"], alert_count: 2 }),
];

describe("alertQueue — lọc, sắp xếp, nhãn «việc cần làm» (21/11/2026)", () => {
  it("lọc theo mức / chờ quá 7 ngày / người gửi, kết hợp được", () => {
    assert.deepEqual(applyQueueFilter(L, { sev: "critical", oldOnly: false, source: "" }).map((i) => i.id), ["b", "c"]);
    assert.deepEqual(applyQueueFilter(L, { sev: "all", oldOnly: true, source: "" }).map((i) => i.id), ["a", "c"]);
    assert.deepEqual(applyQueueFilter(L, { sev: "all", oldOnly: false, source: "audit-agent" }).map((i) => i.id), ["c", "d"]);
    assert.deepEqual(applyQueueFilter(L, { sev: "critical", oldOnly: true, source: "audit-agent" }).map((i) => i.id), ["c"]);
    assert.equal(OLD_DAYS, 7);
  });
  it("số theo mức tính sau bộ lọc tuổi + người gửi, không phụ thuộc mức đang chọn", () => {
    assert.deepEqual(countBySeverity(L, { oldOnly: false, source: "" }), { all: 4, critical: 2, warning: 2 });
    assert.deepEqual(countBySeverity(L, { oldOnly: true, source: "" }), { all: 2, critical: 1, warning: 1 });
  });
  it("sắp xếp: chờ lâu nhất trước; hoặc nghiêm trọng trước rồi chờ lâu; không đổi mảng gốc", () => {
    const before = L.map((i) => i.id).join();
    assert.deepEqual(sortQueue(L, "oldest").map((i) => i.id), ["a", "c", "b", "d"]);
    assert.deepEqual(sortQueue(L, "severe").map((i) => i.id), ["c", "b", "a", "d"]);
    assert.equal(L.map((i) => i.id).join(), before);
  });
  it("tổng số cảnh báo (không phải số việc) và danh sách người gửi", () => {
    assert.equal(totalAlerts(L), 5);
    assert.deepEqual(distinctSources(L), ["ceo-agent", "whistleblower", "audit-agent"]);
  });
  it("nhãn việc cần làm theo thẻ gốc", () => {
    assert.equal(needKind({ card: null }), "info");
    assert.equal(needKind({ card: { status: "done", block_kind: null } }), "resolved");
    assert.equal(needKind({ card: { status: "blocked", block_kind: "needs_input" } }), "input");
    assert.equal(needKind({ card: { status: "blocked", block_kind: "capability" } }), "capability");
    assert.equal(needKind({ card: { status: "scheduled", block_kind: "dependency" } }), "dependency");
    assert.equal(needKind({ card: { status: "blocked", block_kind: "transient" } }), "transient");
    assert.equal(needKind({ card: { status: "blocked", block_kind: null } }), "other");
  });
  it("mã thẻ lấy từ tham chiếu; không có mã thì null", () => {
    assert.equal(taskIdOf("t_b4fa2b2a"), "t_b4fa2b2a");
    assert.equal(taskIdOf("t_279d4ce3 / t_b4fa2b2a"), "t_279d4ce3");
    assert.equal(taskIdOf("bulletin:2026-11-20"), null);
    assert.equal(taskIdOf(null), null);
  });
  it("nhận ra nội dung bị cắt cụt «…» ở cuối dòng, không nhầm chữ «…» giữa câu", () => {
    assert.equal(looksCut("20 quy định luồng còn nhắc 8 phòng đã bỏ, và…"), true);
    assert.equal(looksCut("dòng một…\ndòng hai đủ"), true);
    assert.equal(looksCut("chờ… rồi làm tiếp"), false);
    assert.equal(looksCut("đầy đủ."), false);
    assert.equal(looksCut(undefined), false);
  });
});
