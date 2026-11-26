import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countResults, normalizeResult, recipientsText, shortTarget } from "../src/lib/incident-activity";

describe("incident-activity — nhật ký tự khắc phục / leo thang sự cố", () => {
  it("kết quả lạ hoặc rỗng được coi là «lỗi»", () => {
    assert.equal(normalizeResult("recovered"), "recovered");
    assert.equal(normalizeResult("lung tung"), "error");
    assert.equal(normalizeResult(null), "error");
  });
  it("đếm theo kết quả", () => {
    assert.deepEqual(countResults([{ result: "recovered" }, { result: "refused" }, {}, { result: "not_recovered" }, { result: "recovered" }]),
      { recovered: 2, not_recovered: 1, refused: 1, error: 1 });
  });
  it("đối tượng hiển thị gọn: mã thẻ, tên bảng hoặc tên dịch vụ", () => {
    assert.equal(shortTarget("cong-ty-sales/t_ab12"), "t_ab12");
    assert.equal(shortTarget("gateway"), "gateway");
    assert.equal(shortTarget(""), "—");
    assert.equal(shortTarget(null), "—");
  });
  it("người nhận rỗng → null để giao diện ghi «chỉ báo Chủ tịch»", () => {
    assert.equal(recipientsText([]), null);
    assert.equal(recipientsText(undefined), null);
    assert.equal(recipientsText(["sales-lead-agent", "ceo-agent"]), "sales-lead-agent, ceo-agent");
  });
});
