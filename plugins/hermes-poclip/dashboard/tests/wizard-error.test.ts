import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wizardBusinessError } from "../src/lib/wizard-error";
import { vi } from "../src/i18n/vi";

const t: any = vi;

describe("wizardBusinessError — lỗi nghiệp vụ của trình hướng dẫn tiếp nhận", () => {
  it("thử việc chưa đủ việc → nói rõ còn thiếu bao nhiêu việc", () => {
    const m = wizardBusinessError(t, { error: "ShadowModeNotSufficient", reviewed_outputs: 0, outputs_remaining: 10, days_remaining: 0 })!;
    assert.match(m, /mới có 0 việc/);
    assert.match(m, /thêm 10 việc/);
    assert.doesNotMatch(m, /ngày/);
  });
  it("thiếu ngân sách → bảo đặt hạn mức > 0", () => {
    assert.match(wizardBusinessError(t, { error: "BudgetRequired" })!, /lớn hơn 0/);
  });
  it("không thấy người quản lý → nêu mã người quản lý", () => {
    assert.match(wizardBusinessError(t, { error: "ManagerNotFound", manager_id: "x-agent" })!, /x-agent/);
  });
  it("lỗi lạ hoặc không có chi tiết → null để giữ cách hiển thị cũ", () => {
    assert.equal(wizardBusinessError(t, { error: "Gì đó" }), null);
    assert.equal(wizardBusinessError(t, null), null);
  });
});
