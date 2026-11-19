import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  notificationKindLabel,
  notificationSeverityLabel,
  notificationTargetTabId,
  NOTIFICATION_KIND,
  NOTIFICATION_SEVERITY,
} from "../src/lib/display-labels";
import { notificationTitle } from "../src/pages/Notifications";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import type { Dict } from "../src/i18n/en";

// Merge deep để có Dict đầy đủ (giống index.ts của plugin)
function deepMerge(base: unknown, override: unknown): unknown {
  if (typeof base !== "object" || base === null || typeof override !== "object" || override === null) {
    return override === undefined ? base : override;
  }
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    out[key] = deepMerge((base as Record<string, unknown>)[key], (override as Record<string, unknown>)[key]);
  }
  return out;
}

const tVi = deepMerge(en, vi) as Dict;
const tEn = en as Dict;

// ── notificationKindLabel ────────────────────────────────────────────────────

describe("notificationKindLabel — 4 mã đúng (vi)", () => {
  it("approval", () => {
    assert.equal(notificationKindLabel(tVi, "approval"), "Phiếu chờ duyệt");
  });
  it("goal", () => {
    assert.equal(notificationKindLabel(tVi, "goal"), "Mục tiêu cần rà soát");
  });
  it("task_due", () => {
    assert.equal(notificationKindLabel(tVi, "task_due"), "Việc tới hạn hoặc quá hạn");
  });
  it("monitor_alert", () => {
    assert.equal(notificationKindLabel(tVi, "monitor_alert"), "Cảnh báo hệ thống");
  });
  it("mã lạ -> chưa xác định (ma_la_xyz)", () => {
    const result = notificationKindLabel(tVi, "ma_la_xyz");
    assert.ok(result.includes("ma_la_xyz"), `Phải chứa mã lạ, nhận được: "${result}"`);
  });
});

describe("notificationKindLabel — 4 mã đúng (en)", () => {
  it("approval", () => {
    assert.equal(notificationKindLabel(tEn, "approval"), "Pending approvals");
  });
  it("goal", () => {
    assert.equal(notificationKindLabel(tEn, "goal"), "Goals to review");
  });
  it("task_due", () => {
    assert.equal(notificationKindLabel(tEn, "task_due"), "Tasks due or overdue");
  });
  it("monitor_alert", () => {
    assert.equal(notificationKindLabel(tEn, "monitor_alert"), "System alerts");
  });
});

// ── notificationSeverityLabel ────────────────────────────────────────────────

describe("notificationSeverityLabel — 3 mã (vi)", () => {
  it("info", () => {
    assert.equal(notificationSeverityLabel(tVi, "info"), "Bình thường");
  });
  it("warning", () => {
    assert.equal(notificationSeverityLabel(tVi, "warning"), "Cần chú ý");
  });
  it("critical", () => {
    assert.equal(notificationSeverityLabel(tVi, "critical"), "Nghiêm trọng");
  });
  it("mã lạ -> chứa mã", () => {
    const result = notificationSeverityLabel(tVi, "extreme");
    assert.ok(result.includes("extreme"), `Phải chứa mã lạ, nhận được: "${result}"`);
  });
});

describe("notificationSeverityLabel — 3 mã (en)", () => {
  it("info", () => {
    assert.equal(notificationSeverityLabel(tEn, "info"), "Info");
  });
  it("warning", () => {
    assert.equal(notificationSeverityLabel(tEn, "warning"), "Needs attention");
  });
  it("critical", () => {
    assert.equal(notificationSeverityLabel(tEn, "critical"), "Critical");
  });
});

// ── notificationTargetTabId ──────────────────────────────────────────────────

describe("notificationTargetTabId — 4 mã đúng + mã lạ + null", () => {
  it("approval-queue -> approval-queue", () => {
    assert.equal(notificationTargetTabId("approval-queue"), "approval-queue");
  });
  it("goal-tree -> goal-tree", () => {
    assert.equal(notificationTargetTabId("goal-tree"), "goal-tree");
  });
  it("task-trace -> task-trace", () => {
    assert.equal(notificationTargetTabId("task-trace"), "task-trace");
  });
  it("monitoring -> monitoring", () => {
    assert.equal(notificationTargetTabId("monitoring"), "monitoring");
  });
  it("null -> null", () => {
    assert.equal(notificationTargetTabId(null), null);
  });
  it("chuỗi lạ -> null", () => {
    assert.equal(notificationTargetTabId("unknown-screen"), null);
  });
  it("undefined -> null", () => {
    assert.equal(notificationTargetTabId(undefined), null);
  });
  it("chuỗi rỗng -> null", () => {
    assert.equal(notificationTargetTabId(""), null);
  });
});

// ── notificationTitle ────────────────────────────────────────────────────────

describe("notificationTitle — dựng đúng từ title_key + payload (vi)", () => {
  it("approval/pending_approval: dùng type + tier từ payload", () => {
    const result = notificationTitle(tVi, {
      title: "Fallback title",
      title_key: "notification.approval.pending_approval",
      kind: "approval",
      payload: { request_type: "new_agent_onboarding", risk_tier: "T2" },
    });
    assert.ok(!result.includes("{"), `Không được còn placeholder, nhận được: "${result}"`);
    assert.ok(result.includes("T2") || result.includes("Cao"), `Phải chứa thông tin mức rủi ro: "${result}"`);
  });

  it("goal/goal_review_due: dùng quarter + title từ payload", () => {
    const result = notificationTitle(tVi, {
      title: "Fallback title",
      title_key: "notification.goal.goal_review_due",
      kind: "goal",
      payload: { quarter: "Q3", title: "Tăng doanh thu" },
    });
    assert.ok(!result.includes("{"), `Không được còn placeholder: "${result}"`);
    assert.ok(result.includes("Q3"), `Phải chứa quarter: "${result}"`);
    assert.ok(result.includes("Tăng doanh thu"), `Phải chứa title: "${result}"`);
  });

  it("goal/goal_ungoaled: dùng count từ payload", () => {
    const result = notificationTitle(tVi, {
      title: "5 việc chưa gắn mục tiêu",
      title_key: "notification.goal.goal_ungoaled",
      kind: "goal",
      payload: { count: 5 },
    });
    assert.ok(!result.includes("{"), `Không được còn placeholder: "${result}"`);
    assert.ok(result.includes("5"), `Phải chứa count: "${result}"`);
  });

  it("task_due/contract_overdue: dùng title từ payload", () => {
    const result = notificationTitle(tVi, {
      title: "Fallback",
      title_key: "notification.task_due.contract_overdue",
      kind: "task_due",
      payload: { title: "Cập nhật báo cáo tài chính" },
    });
    assert.ok(!result.includes("{"), `Không được còn placeholder: "${result}"`);
    assert.ok(result.includes("Cập nhật báo cáo tài chính"), `Phải chứa title: "${result}"`);
  });

  it("title_key lạ -> rơi về title backend", () => {
    const result = notificationTitle(tVi, {
      title: "Backend title",
      title_key: "notification.unknown.key",
      kind: "monitor_alert",
      payload: {},
    });
    assert.equal(result, "Backend title");
  });

  it("thiếu dữ liệu payload (biến rỗng) -> rơi về title backend", () => {
    const result = notificationTitle(tVi, {
      title: "Backend fallback",
      title_key: "notification.goal.goal_review_due",
      kind: "goal",
      payload: {},  // thiếu quarter và title
    });
    // Phải rơi về title backend vì quarter và title rỗng
    assert.equal(result, "Backend fallback");
  });

  it("KHÔNG bao giờ trả chuỗi chứa { khi title_key có nhưng data rỗng", () => {
    const result = notificationTitle(tVi, {
      title: "Safe fallback",
      title_key: "notification.task_due.contract_due",
      kind: "task_due",
      payload: { title: "" },  // title rỗng
    });
    assert.ok(!result.includes("{"), `KHÔNG được chứa {: "${result}"`);
  });

  it("title_key không có (null) + title backend có -> trả title backend", () => {
    const result = notificationTitle(tVi, {
      title: "Monitor alert title",
      title_key: null,
      kind: "monitor_alert",
      payload: { category: "heartbeat", severity: "critical" },
    });
    assert.equal(result, "Monitor alert title");
  });
});

describe("notificationTitle — kiểm tra bản en", () => {
  it("approval/pending_approval en: không còn placeholder", () => {
    const result = notificationTitle(tEn, {
      title: "Fallback",
      title_key: "notification.approval.pending_approval",
      kind: "approval",
      payload: { request_type: "staffing_proposal", risk_tier: "T1" },
    });
    assert.ok(!result.includes("{"), `Không được còn placeholder: "${result}"`);
    assert.ok(result.length > 5, `Phải có nội dung: "${result}"`);
  });
});

// ── Kiểm tra tất cả mã của 2 nhóm mới đều có nhãn ───────────────────────────

describe("Tất cả mã NOTIFICATION_KIND có nhãn trong vi", () => {
  for (const code of NOTIFICATION_KIND.codes) {
    it(`kind ${code} có nhãn không rỗng`, () => {
      const label = notificationKindLabel(tVi, code);
      assert.ok(label.length > 0, `Mã ${code} phải có nhãn`);
      assert.ok(!label.includes("Chưa xác định"), `Mã ${code} phải có nhãn cụ thể, nhận: "${label}"`);
    });
  }
});

describe("Tất cả mã NOTIFICATION_SEVERITY có nhãn trong vi", () => {
  for (const code of NOTIFICATION_SEVERITY.codes) {
    it(`severity ${code} có nhãn không rỗng`, () => {
      const label = notificationSeverityLabel(tVi, code);
      assert.ok(label.length > 0, `Mã ${code} phải có nhãn`);
      assert.ok(!label.includes("Chưa xác định"), `Mã ${code} phải có nhãn cụ thể, nhận: "${label}"`);
    });
  }
});
