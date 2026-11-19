import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categoryOfTopic, filterTopicsByCategory, topicPrefix, type CategorizableTopic } from "../src/lib/flowCategory";

const t = (name: string, p: string[] = [], c: string[] = []): CategorizableTopic => ({
  name, producer_clusters: p, consumer_clusters: c,
});

// Mẫu lấy từ máy 162 (công ty tự lập phòng ban): phần lớn tiền tố không có trong danh sách cố định.
const SAMPLE: CategorizableTopic[] = [
  t("lead.qualified", ["sales"], ["cs"]),
  t("order.completed", ["sales"], ["finance"]),
  t("incident.critical", ["tech"], ["executive"]),
  t("agent.golive_approved", ["hr"], ["tech"]),
  t("org.structural_pattern_detected", ["org"], ["executive"]),
  t("audit.findings", ["audit"], ["executive"]),
  t("budget.hard_limit_breached", ["finance"], ["executive"]),
  t("whistleblowing.tip_received", ["*"], ["audit"]),
  t("executive.directive_to_audit", ["executive"], ["audit"]),
  t("executive.directive_to_research", ["executive"], ["research"]),
  t("consulting.review_requested", ["consulting"], ["compliance"]),
  t("consulting.coord_with_hr_core", ["consulting"], ["hr_core"]),
  t("investment.coord_with_market_monitoring", ["investment"], ["market_monitoring"]),
  t("infrastructure_ops.report_to_executive", ["infrastructure_ops"], ["executive"]),
  t("hr_core.coord_with_training", ["hr_core"], ["training"]),
  t("tenmoi", [], []),
];

describe("categoryOfTopic", () => {
  it("tiền tố giám sát", () => {
    assert.equal(categoryOfTopic(t("incident.critical")), "monitoring");
    assert.equal(categoryOfTopic(t("agent.golive_approved")), "monitoring");
    assert.equal(categoryOfTopic(t("org.structural_pattern_detected")), "monitoring");
  });
  it("tiền tố tuân thủ", () => {
    for (const n of ["audit.findings", "compliance.veto", "whistleblowing.tip_received", "budget.approval_needed"]) {
      assert.equal(categoryOfTopic(t(n)), "compliance", n);
    }
  });
  it("phòng ban tự lập có đơn vị kiểm toán/tuân thủ ở một đầu → tuân thủ", () => {
    assert.equal(categoryOfTopic(t("executive.directive_to_audit", ["executive"], ["audit"])), "compliance");
    assert.equal(categoryOfTopic(t("consulting.review_requested", ["consulting"], ["compliance"])), "compliance");
    assert.equal(categoryOfTopic(t("x.y", ["audit"], ["research"])), "compliance");
  });
  it("phần còn lại là vận hành, kể cả tiền tố lạ hoặc thiếu danh sách đơn vị", () => {
    assert.equal(categoryOfTopic(t("research.coord_with_operations", ["research"], ["operations"])), "ops");
    assert.equal(categoryOfTopic(t("tenmoi")), "ops");
    assert.equal(categoryOfTopic({ name: "a.b", producer_clusters: null, consumer_clusters: undefined }), "ops");
  });
  it("tiền tố giám sát thắng đơn vị kiểm soát (incident gửi cho audit vẫn là giám sát)", () => {
    assert.equal(categoryOfTopic(t("incident.critical", ["tech"], ["audit"])), "monitoring");
  });
});

describe("filterTopicsByCategory — ba nhóm gộp lại bằng Tất cả", () => {
  it("'all' trả nguyên danh sách", () => assert.equal(filterTopicsByCategory(SAMPLE, "all").length, SAMPLE.length));
  it("không quy định nào mất, không quy định nào nằm ở hai nhóm", () => {
    const ops = filterTopicsByCategory(SAMPLE, "ops").map((x) => x.name);
    const mon = filterTopicsByCategory(SAMPLE, "monitoring").map((x) => x.name);
    const comp = filterTopicsByCategory(SAMPLE, "compliance").map((x) => x.name);
    const union = [...ops, ...mon, ...comp];
    assert.equal(union.length, SAMPLE.length);
    assert.deepEqual([...union].sort(), SAMPLE.map((x) => x.name).sort());
    assert.equal(new Set(union).size, union.length);
  });
});

describe("topicPrefix", () => {
  it("lấy phần trước dấu chấm đầu tiên", () => {
    assert.equal(topicPrefix("meeting.turn.started"), "meeting");
    assert.equal(topicPrefix("solo"), "solo");
  });
});
