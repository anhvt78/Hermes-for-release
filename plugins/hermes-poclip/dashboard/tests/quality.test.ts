import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DECISIONS, canSubmitReview, formatPct, noteRequired, nonZeroKinds, sortAgents, statusRank, statusTone, trendOf,
} from "../src/lib/quality";

describe("statusTone / statusRank", () => {
  it("màu theo mức", () => {
    assert.equal(statusTone("critical"), "destructive");
    assert.equal(statusTone("warning"), "warning");
    assert.equal(statusTone("ok"), "success");
    assert.equal(statusTone("insufficient"), "secondary");
    assert.equal(statusTone("lạ"), "secondary");
  });
  it("thứ tự: nghiêm trọng < cảnh báo < tốt < chưa đủ dữ liệu < lạ", () => {
    assert.deepEqual(["insufficient", "ok", "critical", "warning", "x"].sort((a, b) => statusRank(a) - statusRank(b)), ["critical", "warning", "ok", "insufficient", "x"]);
  });
});

describe("sortAgents", () => {
  const a = (name: string, status: string, error_rate: number | null) => ({ name, status, error_rate });
  it("nghiêm trọng trước, rồi tỷ lệ lỗi giảm dần, rồi theo tên", () => {
    const out = sortAgents([a("D", "ok", 1), a("B", "warning", 12), a("A", "critical", 20), a("C", "warning", 15), a("E", "insufficient", null), a("Z", "critical", 20)]);
    assert.deepEqual(out.map((x) => x.name), ["A", "Z", "C", "B", "D", "E"]);
  });
  it("không sửa mảng gốc", () => {
    const src = [a("B", "ok", 1), a("A", "critical", 30)];
    sortAgents(src);
    assert.equal(src[0].name, "B");
  });
});

describe("trendOf", () => {
  it("xấu đi / tốt lên / ổn định / không có", () => {
    assert.equal(trendOf(10.9), "up");
    assert.equal(trendOf(-3), "down");
    assert.equal(trendOf(0.9), "flat");
    assert.equal(trendOf(-0.9), "flat");
    assert.equal(trendOf(null), null);
    assert.equal(trendOf(undefined), null);
    assert.equal(trendOf(Number.NaN), null);
  });
});

describe("formatPct", () => {
  it("dùng dấu phẩy thập phân kiểu Việt", () => {
    assert.equal(formatPct(9.1), "9,1%");
    assert.equal(formatPct(20), "20%");
    assert.equal(formatPct(null), "—");
    assert.equal(formatPct(undefined), "—");
  });
});

describe("quyết định rà soát", () => {
  it("ba lựa chọn", () => assert.deepEqual([...DECISIONS], ["keep", "retest", "retire"]));
  it("chạy thử lại / cho nghỉ bắt buộc có lý do ≥ 3 ký tự", () => {
    assert.equal(noteRequired("keep"), false);
    assert.equal(noteRequired("retest"), true);
    assert.equal(noteRequired("retire"), true);
    assert.equal(noteRequired(""), false);
    assert.equal(canSubmitReview("keep", ""), true);
    assert.equal(canSubmitReview("retest", "  ab "), false);
    assert.equal(canSubmitReview("retest", " abc "), true);
    assert.equal(canSubmitReview("retire", ""), false);
    assert.equal(canSubmitReview("", "lý do dài"), false);
  });
});

describe("nonZeroKinds", () => {
  it("chỉ giữ loại lỗi khác 0", () => {
    const k = { gave_up: 2, protocol_violation: 0, crashed: 0, timed_out: 1, review_rejected: 0 };
    assert.deepEqual(nonZeroKinds(k), [["gave_up", 2], ["timed_out", 1]]);
    assert.deepEqual(nonZeroKinds({ gave_up: 0, protocol_violation: 0, crashed: 0, timed_out: 0, review_rejected: 0 }), []);
  });
});
