import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countApproveAllResult } from "../src/pages/GoalTree";

describe("countApproveAllResult — tính số mục duyệt/lỗi từ response approve-all", () => {
  it("approved là mảng 4 phần tử → n=4", () => {
    const { n } = countApproveAllResult(
      { approved: [{ proposal_id: 1 }, { proposal_id: 2 }, { proposal_id: 3 }, { proposal_id: 4 }] },
      0,
    );
    assert.equal(n, 4);
  });

  it("failed là mảng 1 phần tử → m=1", () => {
    const { m } = countApproveAllResult(
      { approved: [], failed: [{ proposal_id: 99, error: "rejected" }] },
      0,
    );
    assert.equal(m, 1);
  });

  it("approved là số 3 → n=3", () => {
    const { n } = countApproveAllResult({ approved: 3 }, 10);
    assert.equal(n, 3);
  });

  it("thiếu cả approved và failed → n=batchCount, m=0", () => {
    const { n, m } = countApproveAllResult({}, 7);
    assert.equal(n, 7);
    assert.equal(m, 0);
  });

  it("res là null → n=batchCount, m=0", () => {
    const { n, m } = countApproveAllResult(null, 5);
    assert.equal(n, 5);
    assert.equal(m, 0);
  });

  it("failed là số 2 → m=2", () => {
    const { m } = countApproveAllResult({ failed: 2 }, 0);
    assert.equal(m, 2);
  });

  it("n và m luôn là number (không phải chuỗi hay object)", () => {
    const res = countApproveAllResult(
      { approved: [{ proposal_id: 1 }], failed: [{ proposal_id: 2, error: "err" }] },
      99,
    );
    assert.equal(typeof res.n, "number");
    assert.equal(typeof res.m, "number");
  });
});
