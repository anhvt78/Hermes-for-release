import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  describeChange,
  pickChatHistory,
  shouldAutoPropose,
  toClusterLines,
} from "../src/lib/genesisStructure";

describe("shouldAutoPropose", () => {
  it("tự đề xuất lần đầu khi CEO báo đủ ngữ cảnh và chưa có cơ cấu", () => {
    assert.equal(shouldAutoPropose(true, 0), true);
  });
  it("KHÔNG tự đề xuất lại khi đã có cơ cấu (tránh ghi đè bản Chủ tịch đã sửa tay)", () => {
    assert.equal(shouldAutoPropose(true, 3), false);
  });
  it("không đề xuất khi CEO chưa báo sẵn sàng", () => {
    assert.equal(shouldAutoPropose(false, 0), false);
  });
});

describe("pickChatHistory", () => {
  const server = [{ speaker: "chairman" as const, text: "a" }, { speaker: "ceo" as const, text: "b" }];
  const local = [{ speaker: "chairman" as const, text: "cũ" }];
  it("ưu tiên hội thoại lưu ở máy chủ", () => {
    assert.deepEqual(pickChatHistory(server, local), server);
  });
  it("máy chủ chưa có gì → dùng bản trong trình duyệt", () => {
    assert.deepEqual(pickChatHistory([], local), local);
    assert.deepEqual(pickChatHistory(null, local), local);
  });
});

describe("toClusterLines", () => {
  it("giữ phần Chủ tịch đã sửa tay, nhiệm vụ trống thành chuỗi rỗng", () => {
    const out = toClusterLines([
      { id: "sales", agent_count: 3, display_name_vi: "Kinh doanh", member_roles: ["a", "b"], primary_goal: null },
    ]);
    assert.deepEqual(out, [
      { id: "sales", agent_count: 3, display_name_vi: "Kinh doanh", primary_goal: "", member_roles: ["a", "b"] },
    ]);
  });
});

describe("describeChange", () => {
  it("thêm phòng", () => {
    const v = describeChange({ type: "added", id: "finance", to: { agent_count: 1, display_name_vi: "Tài chính" } });
    assert.equal(v.kind, "added");
    assert.equal(v.name, "Tài chính");
  });
  it("đổi số agent", () => {
    const v = describeChange({
      type: "changed", id: "sales",
      from: { agent_count: 3, display_name_vi: "Kinh doanh" }, to: { agent_count: 2, display_name_vi: "Kinh doanh" },
    });
    assert.equal(v.countChanged, true);
    assert.equal(v.fromCount, 3);
    assert.equal(v.toCount, 2);
  });
  it("đổi tên/nhiệm vụ mà không đổi số agent", () => {
    const v = describeChange({
      type: "changed", id: "sales",
      from: { agent_count: 2, display_name_vi: "Sales" }, to: { agent_count: 2, display_name_vi: "Kinh doanh" },
    });
    assert.equal(v.countChanged, false);
  });
  it("bỏ phòng; thiếu tên thì dùng tên đang có trên màn hình rồi tới id", () => {
    assert.equal(describeChange({ type: "removed", id: "legal", from: { agent_count: 1 } }, { legal: "Pháp chế" }).name, "Pháp chế");
    assert.equal(describeChange({ type: "removed", id: "legal", from: { agent_count: 1 } }).name, "legal");
  });
});
