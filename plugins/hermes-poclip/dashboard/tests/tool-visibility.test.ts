import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deniedSummary, hiddenSummary } from "../src/lib/tool-visibility";

describe("tool-visibility — công cụ bị cấm và nhóm đang ẩn", () => {
  it("chưa xác định → null; không công cụ nào bị cấm → «—»", () => {
    assert.equal(deniedSummary({ profile_id: "a", denied: null, hidden_toolsets: [] }), null);
    assert.equal(deniedSummary({ profile_id: "a", denied: [], hidden_toolsets: [] }), "—");
  });
  it("rút gọn danh sách dài", () => {
    const d = ["a", "b", "c", "d", "e", "f", "g", "h"];
    assert.equal(deniedSummary({ profile_id: "x", denied: d, hidden_toolsets: [] }), "a, b, c, d, e, f (+2)");
    assert.equal(deniedSummary({ profile_id: "x", denied: ["t", "u"], hidden_toolsets: [] }), "t, u");
  });
  it("nhóm đang ẩn", () => {
    assert.equal(hiddenSummary({ profile_id: "x", denied: [], hidden_toolsets: ["terminal", "file"] }), "terminal, file");
    assert.equal(hiddenSummary({ profile_id: "x", denied: [], hidden_toolsets: [] }), null);
  });
});
