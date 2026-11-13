import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { changesForLevel, formatValue, groupItems, presetSummary, type ControlItem } from "../src/lib/control-level";

const rounds: ControlItem = {
  key: "review_rounds", group: "review", type: "int", label: "Số vòng sửa", label_en: "Rounds", help: "", help_en: "", value: 2,
  presets: { low: 1, medium: 2, high: 3 }, min: 1, max: 20, unit: "vòng", unit_en: "rounds",
};
const policy: ControlItem = {
  key: "review_policy", group: "review", type: "choice", label: "Quy tắc", label_en: "Rule", help: "", help_en: "", value: "advise",
  presets: { low: "enforce", medium: "enforce", high: "advise" },
  options: [
    { value: "off", label: "Tắt", label_en: "Off" },
    { value: "advise", label: "Khuyến nghị (chọn khác vẫn được)", label_en: "Advise (others allowed)" },
    { value: "enforce", label: "Bắt buộc (chọn sai bị chặn)", label_en: "Enforce (wrong blocked)" },
  ],
};
const audit: ControlItem = { ...rounds, key: "audit_sample_min", group: "audit", value: 5, presets: { low: 8, medium: 5, high: 3 }, unit: "thẻ", unit_en: "cards" };
const names = { low: "Thấp", medium: "Vừa", high: "Cao" };

describe("control-level — hàm thuần của màn «Mức kiểm soát»", () => {
  it("formatValue: số kèm đơn vị theo ngôn ngữ, lựa chọn theo nhãn, 'custom' có chữ riêng", () => {
    assert.equal(formatValue(rounds, 2, "vi"), "2 vòng");
    assert.equal(formatValue(rounds, 2, "en"), "2 rounds");
    assert.equal(formatValue(policy, "enforce", "vi"), "Bắt buộc (chọn sai bị chặn)");
    assert.equal(formatValue({ ...policy, key: "meeting_stuck" }, "custom", "vi"), "Tùy chỉnh");
  });

  it("presetSummary: ba mức trên một dòng, lựa chọn dài chỉ lấy phần đầu", () => {
    assert.equal(presetSummary(rounds, names, "vi"), "Thấp: 1 · Vừa: 2 · Cao: 3");
    assert.equal(presetSummary(policy, names, "vi"), "Thấp: Bắt buộc · Vừa: Bắt buộc · Cao: Khuyến nghị");
  });

  it("changesForLevel: chỉ liệt kê thông số SẼ đổi, nêu giá trị cũ và mới", () => {
    const plan = changesForLevel([rounds, policy, audit], "low", "vi");
    assert.deepEqual(plan.map((p) => p.key), ["review_rounds", "review_policy", "audit_sample_min"]);
    assert.equal(plan[0].from, "2 vòng");
    assert.equal(plan[0].to, "1 vòng");
    assert.equal(plan[1].to, "Bắt buộc (chọn sai bị chặn)");
    assert.deepEqual(changesForLevel([rounds, policy, audit], "medium", "vi").map((p) => p.key), ["review_policy"]);   // «vừa» chỉ nâng quy tắc rà soát lên bắt buộc
  });

  it("groupItems: theo thứ tự nhóm cố định, nhóm lạ xếp cuối", () => {
    const odd = { ...audit, key: "x", group: "khac" };
    const g = groupItems([odd, audit, rounds]);
    assert.deepEqual(g.map((x) => x.group), ["review", "audit", "khac"]);
  });
});
