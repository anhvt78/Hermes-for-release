import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { managerLabel, sortManagers } from "../src/lib/managerLabel";

// t giả: tên tiếng Việt đã lưu cho vài nhân viên
const t = { labelGroups: { unknown: "Chưa xác định", personLabels: { "audit-agent": "Kiểm toán viên", "ceo-agent": "CEO", "compliance-agent": "Kiểm soát viên tuân thủ" } } };

describe("managerLabel — ô «Báo cáo cho» dùng tên tiếng Việt, không lẫn tên Anh + mã (21/11/2026)", () => {
  it("có tên tiếng Việt đã lưu → dùng tên đó, bỏ tên Anh máy chủ ghi và bỏ mã", () => {
    assert.equal(managerLabel(t, { profile_id: "audit-agent", name: "Audit Agent" }), "Kiểm toán viên");
    assert.equal(managerLabel(t, { profile_id: "ceo-agent", name: "CEO Agent" }), "CEO");
  });
  it("chưa có tên đã lưu → rơi về tên máy chủ ghi, rồi mới tới mã", () => {
    assert.equal(managerLabel(t, { profile_id: "moi-tuyen-agent", name: "Nhân viên mới" }), "Nhân viên mới");
    assert.equal(managerLabel(t, { profile_id: "moi-tuyen-agent", name: null }), "moi-tuyen-agent");
  });
  it("kết quả không chứa mã dạng «xxx-agent» khi đã có tên tiếng Việt", () => {
    assert.ok(!/-agent/.test(managerLabel(t, { profile_id: "compliance-agent", name: "Compliance Agent" })));
  });
  it("sortManagers xếp theo bảng chữ cái tiếng Việt và không đổi mảng gốc", () => {
    const list = [
      { profile_id: "ceo-agent", name: "CEO Agent" },
      { profile_id: "compliance-agent", name: "Compliance Agent" },
      { profile_id: "audit-agent", name: "Audit Agent" },
    ];
    const sorted = sortManagers(t, list).map((m) => managerLabel(t, m));
    assert.deepEqual(sorted, ["CEO", "Kiểm soát viên tuân thủ", "Kiểm toán viên"]);
    assert.equal(list[0].profile_id, "ceo-agent");
  });
});
