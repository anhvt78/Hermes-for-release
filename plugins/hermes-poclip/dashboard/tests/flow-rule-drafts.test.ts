import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeDraft, draftsOf, isCoordination, splitDrafts, type FlowDraft } from "../src/lib/flowRuleDrafts";

const mk = (name: string, status = "draft", p = ["a"], c = ["b"]): FlowDraft => ({ id: name, name, producer_clusters: p, consumer_clusters: c, status });
const X = { coord: (a: string, b: string) => `COORD ${a} ${b}`, send: (a: string, b: string) => `SEND ${a} ${b}` };

describe("Quy định luồng nháp trong «Chờ duyệt» (21/11/2026)", () => {
  it("nhận ra quy định phối hợp ngang theo tên", () => {
    assert.equal(isCoordination("audit.coord_with_compliance"), true);
    assert.equal(isCoordination("client_advisory.review_requested"), false);
    assert.equal(isCoordination("hr_core.report_to_executive"), false);
    assert.equal(isCoordination(null), false);
    assert.equal(isCoordination(undefined), false);
  });

  it("chỉ giữ bản nháp", () => {
    const kept = draftsOf([mk("x", "draft"), mk("y", "approved"), mk("z", "rejected")]);
    assert.deepEqual(kept.map((i) => i.name), ["x"]);
    assert.deepEqual(draftsOf(null), []);
    assert.deepEqual(draftsOf(undefined), []);
  });

  it("tách nhóm phối hợp ngang khỏi các quy định khác, giữ thứ tự", () => {
    const { coordination, other } = splitDrafts([mk("a.coord_with_b"), mk("c.review_requested"), mk("d.coord_with_e"), mk("f.report")]);
    assert.deepEqual(coordination.map((i) => i.name), ["a.coord_with_b", "d.coord_with_e"]);
    assert.deepEqual(other.map((i) => i.name), ["c.review_requested", "f.report"]);
  });

  it("mô tả bằng tên phòng; nhiều phòng nối bằng dấu phẩy; mã lạ giữ nguyên qua hàm nhãn", () => {
    const label = (c: string) => ({ audit: "Kiểm toán", compliance: "Tuân thủ", executive: "Điều hành" } as Record<string, string>)[c] ?? c;
    assert.equal(describeDraft(mk("audit.coord_with_compliance", "draft", ["audit"], ["compliance"]), label, X), "COORD Kiểm toán Tuân thủ");
    assert.equal(describeDraft(mk("x.review_requested", "draft", ["audit", "compliance"], ["executive"]), label, X), "SEND Kiểm toán, Tuân thủ Điều hành");
    assert.equal(describeDraft(mk("y.report", "draft", ["lạ"], []), label, X), "SEND lạ ");
  });
});
