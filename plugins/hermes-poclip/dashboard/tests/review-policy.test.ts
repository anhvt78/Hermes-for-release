import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { REVIEW_MODES, normalizeReviewMode, allowedSummary, countKinds } from "../src/lib/review-policy";

describe("review-policy — quy tắc chọn người rà soát", () => {
  it("có 3 mức, mã lạ rơi về «khuyến nghị»", () => {
    assert.deepEqual([...REVIEW_MODES], ["off", "advise", "enforce"]);
    assert.equal(normalizeReviewMode("lung tung"), "advise");
    assert.equal(normalizeReviewMode(null), "advise");
    assert.equal(normalizeReviewMode("enforce"), "enforce");
  });
  it("tóm tắt người hợp lệ, đánh dấu người mặc định", () => {
    assert.equal(allowedSummary({ profile_id: "a", kind: "worker", allowed: ["lead-x", "compliance-agent"], default: "lead-x", restricted: true }), "lead-x ★, compliance-agent");
  });
  it("không hạn chế → null để giao diện hiện «không hạn chế»", () => {
    assert.equal(allowedSummary({ profile_id: "a", kind: "worker", allowed: [], default: null, restricted: false }), null);
    assert.equal(allowedSummary({ profile_id: "a", kind: "lead", allowed: ["x"], default: "x", restricted: false }), null);
  });
  it("đếm theo vai trò", () => {
    const mk = (kind: string) => ({ profile_id: kind, kind, allowed: [], default: null, restricted: true });
    assert.deepEqual(countKinds([mk("worker"), mk("worker"), mk("lead"), mk("ceo"), mk("khac")]), { worker: 2, lead: 1, ceo: 1 });
  });
});
