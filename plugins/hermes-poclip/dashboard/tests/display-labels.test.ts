import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatLabel,
  kanbanPriorityLabel,
  formatNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  HR_LIFECYCLE,
  A2A_DIRECTION,
  SANDBOX_MODE,
  SANDBOX_BACKEND,
  WORKSPACE_ACCESS,
  MEETING_STATUS,
  SESSION_STATUS,
  TASK_STATUS,
  APPROVAL_STATUS,
  COMPLIANCE_RESULT,
  RISK_LEVEL,
  FORM_TYPE,
  LEVEL_SCALE,
  ALERT_SEVERITY,
  ACTION_ITEM_STATUS,
  HEARTBEAT_STATUS,
  eventTopicLabel,
  eventTopicLabelWithCode,
  clusterLabel,
  clusterLabelWithCode,
  personLabel,
  personLabelWithCode,
  codeTooltip,
  heartbeatStatusLabel,
  type DisplayGroup,
} from "../src/lib/display-labels";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// ── Danh sách tất cả nhóm để kiểm tra phủ hết mã ────────────────────────────
const ALL_GROUPS: DisplayGroup[] = [
  HR_LIFECYCLE,
  A2A_DIRECTION,
  SANDBOX_MODE,
  SANDBOX_BACKEND,
  WORKSPACE_ACCESS,
  MEETING_STATUS,
  SESSION_STATUS,
  TASK_STATUS,
  APPROVAL_STATUS,
  COMPLIANCE_RESULT,
  RISK_LEVEL,
  FORM_TYPE,
  LEVEL_SCALE,
  ACTION_ITEM_STATUS,
];

describe("formatLabel — mã hợp lệ", () => {
  it("HR_LIFECYCLE.design = Thiết kế", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, "design"), "Thiết kế");
  });
  it("HR_LIFECYCLE.retired = Đã nghỉ", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, "retired"), "Đã nghỉ");
  });
  it("A2A_DIRECTION.unidirectional = Một chiều", () => {
    assert.equal(formatLabel(A2A_DIRECTION, "unidirectional"), "Một chiều");
  });
  it("SANDBOX_MODE.off = Tắt", () => {
    assert.equal(formatLabel(SANDBOX_MODE, "off"), "Tắt");
  });
  it("SANDBOX_BACKEND.modal = Modal (đám mây)", () => {
    assert.equal(formatLabel(SANDBOX_BACKEND, "modal"), "Modal (đám mây)");
  });
  it("WORKSPACE_ACCESS.rw = Đọc và ghi thư mục làm việc", () => {
    assert.equal(formatLabel(WORKSPACE_ACCESS, "rw"), "Đọc và ghi thư mục làm việc");
  });
  it("MEETING_STATUS.completed = Đã kết thúc", () => {
    assert.equal(formatLabel(MEETING_STATUS, "completed"), "Đã kết thúc");
  });
  it("SESSION_STATUS.in_progress = Đang diễn ra", () => {
    assert.equal(formatLabel(SESSION_STATUS, "in_progress"), "Đang diễn ra");
  });
  it("TASK_STATUS.scheduled = Đã lên lịch", () => {
    assert.equal(formatLabel(TASK_STATUS, "scheduled"), "Đã lên lịch");
  });
  it("TASK_STATUS.triage = Chờ phân loại", () => {
    assert.equal(formatLabel(TASK_STATUS, "triage"), "Chờ phân loại");
  });
  it("APPROVAL_STATUS.awaiting_chairman = Chờ Chủ tịch quyết định", () => {
    assert.equal(formatLabel(APPROVAL_STATUS, "awaiting_chairman"), "Chờ Chủ tịch quyết định");
  });
  it("COMPLIANCE_RESULT.uncertain = Chưa đủ căn cứ kết luận", () => {
    assert.equal(formatLabel(COMPLIANCE_RESULT, "uncertain"), "Chưa đủ căn cứ kết luận");
  });
  it("RISK_LEVEL.T0 = Thấp", () => {
    assert.equal(formatLabel(RISK_LEVEL, "T0"), "Thấp");
  });
  it("RISK_LEVEL.T1 = Trung bình", () => {
    assert.equal(formatLabel(RISK_LEVEL, "T1"), "Trung bình");
  });
  it("RISK_LEVEL.T2 = Cao", () => {
    assert.equal(formatLabel(RISK_LEVEL, "T2"), "Cao");
  });
  it("RISK_LEVEL.T3 = Rất cao", () => {
    assert.equal(formatLabel(RISK_LEVEL, "T3"), "Rất cao");
  });
  it("FORM_TYPE.new_agent_onboarding = Tuyển nhân sự mới", () => {
    assert.equal(formatLabel(FORM_TYPE, "new_agent_onboarding"), "Tuyển nhân sự mới");
  });
});

describe("formatLabel — LEVEL_SCALE / ALERT_SEVERITY", () => {
  it("ALERT_SEVERITY === LEVEL_SCALE (cùng một object)", () => {
    assert.equal(ALERT_SEVERITY, LEVEL_SCALE);
  });
  it("ALERT_SEVERITY mã số 1 (number) = Cao", () => {
    assert.equal(formatLabel(ALERT_SEVERITY, 1), "Cao");
  });
  it("ALERT_SEVERITY mã số 2 (number) = Trung bình", () => {
    assert.equal(formatLabel(ALERT_SEVERITY, 2), "Trung bình");
  });
  it("ALERT_SEVERITY mã số 3 (number) = Thấp", () => {
    assert.equal(formatLabel(ALERT_SEVERITY, 3), "Thấp");
  });
});

describe("formatLabel — ca âm (mã lạ, rỗng, null, undefined)", () => {
  it("mã lạ trả Chưa xác định (<mã>)", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, "foo_bar"), "Chưa xác định (foo_bar)");
  });
  it("mã lạ dạng số trả Chưa xác định (<số>)", () => {
    assert.equal(formatLabel(ALERT_SEVERITY, 9), "Chưa xác định (9)");
  });
  it("null trả chuỗi rỗng", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, null), "");
  });
  it("undefined trả chuỗi rỗng", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, undefined), "");
  });
  it("chuỗi rỗng trả chuỗi rỗng", () => {
    assert.equal(formatLabel(HR_LIFECYCLE, ""), "");
  });
  it("ALERT_SEVERITY null trả chuỗi rỗng", () => {
    assert.equal(formatLabel(ALERT_SEVERITY, null), "");
  });
  it("ALERT_SEVERITY NaN trả chuỗi rỗng (không throw)", () => {
    assert.doesNotThrow(() => {
      const result = formatLabel(ALERT_SEVERITY, NaN);
      assert.equal(result, "");
    });
  });
});

describe("formatLabel — không throw với nhóm giả", () => {
  it("group null không throw, trả chuỗi", () => {
    assert.doesNotThrow(() => {
      const result = formatLabel(null as unknown as DisplayGroup, "foo");
      assert.equal(typeof result, "string");
    });
  });
  it("group thiếu i18nGroup không throw, trả chuỗi", () => {
    assert.doesNotThrow(() => {
      const result = formatLabel({} as DisplayGroup, "foo");
      assert.equal(typeof result, "string");
    });
  });
  it("i18nGroup lạ + mã lạ không throw", () => {
    assert.doesNotThrow(() => {
      const g: DisplayGroup = { id: "HR_LIFECYCLE", i18nGroup: "zzz_unknown_group" as any, codes: [] };
      const result = formatLabel(g, "some_code");
      assert.equal(typeof result, "string");
    });
  });
});

describe("formatLabel — dict mặc định là vi", () => {
  it("formatLabel(G, c) bằng formatLabel(G, c, vi as any) với mẫu HR_LIFECYCLE", () => {
    const a = formatLabel(HR_LIFECYCLE, "design");
    const b = formatLabel(HR_LIFECYCLE, "design", vi as any);
    assert.equal(a, b);
  });
  it("formatLabel(G, c) bằng formatLabel(G, c, vi as any) với mẫu TASK_STATUS", () => {
    const a = formatLabel(TASK_STATUS, "scheduled");
    const b = formatLabel(TASK_STATUS, "scheduled", vi as any);
    assert.equal(a, b);
  });
  it("formatLabel(G, c) bằng formatLabel(G, c, vi as any) với mẫu APPROVAL_STATUS", () => {
    const a = formatLabel(APPROVAL_STATUS, "awaiting_chairman");
    const b = formatLabel(APPROVAL_STATUS, "awaiting_chairman", vi as any);
    assert.equal(a, b);
  });
});

describe("formatLabel — phủ hết mã (mọi code trong codes phải cho nhãn khác rỗng và không bắt đầu bằng Chưa xác định)", () => {
  for (const group of ALL_GROUPS) {
    for (const code of group.codes) {
      it(`${group.id}['${code}'] → nhãn hợp lệ`, () => {
        const label = formatLabel(group, code);
        assert.notEqual(label, "", `${group.id}['${code}'] trả chuỗi rỗng`);
        assert.ok(
          !label.startsWith("Chưa xác định"),
          `${group.id}['${code}'] trả nhãn trung tính: "${label}"`,
        );
      });
    }
  }
});

describe("kanbanPriorityLabel — trục ưu tiên Kanban (số lớn = ưu tiên cao)", () => {
  it("kanbanPriorityLabel(vi, 3) = Cao", () => {
    assert.equal(kanbanPriorityLabel(vi, 3), "Cao");
  });
  it("kanbanPriorityLabel(vi, 7) = Cao (>=3 đều Cao)", () => {
    assert.equal(kanbanPriorityLabel(vi, 7), "Cao");
  });
  it("kanbanPriorityLabel(vi, 2) = Trung bình", () => {
    assert.equal(kanbanPriorityLabel(vi, 2), "Trung bình");
  });
  it("kanbanPriorityLabel(vi, 1) = Thấp", () => {
    assert.equal(kanbanPriorityLabel(vi, 1), "Thấp");
  });
  it("kanbanPriorityLabel(vi, 0) = Chưa xếp ưu tiên", () => {
    assert.equal(kanbanPriorityLabel(vi, 0), "Chưa xếp ưu tiên");
  });
  it("kanbanPriorityLabel(vi, null) = vi.common.notAvailable", () => {
    assert.equal(kanbanPriorityLabel(vi, null), vi.common.notAvailable);
  });
  it("kanbanPriorityLabel(vi, undefined) = vi.common.notAvailable", () => {
    assert.equal(kanbanPriorityLabel(vi, undefined), vi.common.notAvailable);
  });
  it("kanbanPriorityLabel(vi, -5) = Chưa xác định (-5)", () => {
    assert.equal(kanbanPriorityLabel(vi, -5), "Chưa xác định (-5)");
  });
  it("kanbanPriorityLabel(vi, NaN) không throw", () => {
    assert.doesNotThrow(() => kanbanPriorityLabel(vi, NaN));
  });
});

describe("formatters số và ngày vi-VN", () => {
  it("formatNumber(1234567) = 1.234.567", () => {
    assert.equal(formatNumber(1234567), "1.234.567");
  });
  it("formatCurrency(1234567) = 1.234.567 VND", () => {
    assert.equal(formatCurrency(1234567), "1.234.567 VND");
  });
  it("formatCurrency(1234.5, 'USD') chứa US$", () => {
    const result = formatCurrency(1234.5, "USD");
    assert.ok(result.includes("US$"), `kết quả: ${result}`);
  });
  it("formatDate('2026-09-17T08:00:00Z') = 17/09/2026", () => {
    assert.equal(formatDate("2026-09-17T08:00:00Z"), "17/09/2026");
  });
  it("formatDateTime('2026-09-17T08:00:00Z') chứa 17/09/2026", () => {
    const result = formatDateTime("2026-09-17T08:00:00Z");
    assert.ok(result.includes("17/09/2026"), `kết quả: ${result}`);
  });
  it("formatDate(null) = —", () => {
    assert.equal(formatDate(null), "—");
  });
  it("formatDate('khong-phai-ngay') = —", () => {
    assert.equal(formatDate("khong-phai-ngay"), "—");
  });
  it("formatNumber(NaN) không throw", () => {
    assert.doesNotThrow(() => formatNumber(NaN));
  });
});

describe("ACTION_ITEM_STATUS — đủ 5 mã", () => {
  for (const code of ACTION_ITEM_STATUS.codes) {
    it(`ACTION_ITEM_STATUS['${code}'] → nhãn khác rỗng và khác chính mã`, () => {
      const label = formatLabel(ACTION_ITEM_STATUS, code);
      assert.notEqual(label, "", `'${code}' trả chuỗi rỗng`);
      assert.notEqual(label, code, `'${code}' trả chính mã thay vì nhãn`);
    });
  }
});

describe("formatLabel — các nhóm đại diện qua delegate helper", () => {
  it("APPROVAL_STATUS.pending trả nhãn tiếng Việt (khác 'pending')", () => {
    const label = formatLabel(APPROVAL_STATUS, "pending");
    assert.notEqual(label, "pending");
    assert.notEqual(label, "");
  });
  it("FORM_TYPE.model_change_proposal trả nhãn không rỗng", () => {
    assert.notEqual(formatLabel(FORM_TYPE, "model_change_proposal"), "");
  });
  it("COMPLIANCE_RESULT mã lạ trả 'Chưa xác định (khong_co_ma_nay)'", () => {
    assert.equal(formatLabel(COMPLIANCE_RESULT, "khong_co_ma_nay"), "Chưa xác định (khong_co_ma_nay)");
  });
  it("TASK_STATUS null trả chuỗi rỗng", () => {
    assert.equal(formatLabel(TASK_STATUS, null), "");
  });
  it("MEETING_STATUS undefined trả chuỗi rỗng", () => {
    assert.equal(formatLabel(MEETING_STATUS, undefined), "");
  });
});

// ── Nhãn thân thiện cho 3 nhóm dữ liệu dạng mã (sự kiện · cụm · người) ───────

const EVENT_TOPIC_CODES = [
  "lead.qualified",
  "lead.nurture_needed",
  "customer.tier_upgraded",
  "order.completed",
  "incident.system_bug",
  "incident.critical",
  "content.review_requested",
  "compliance.veto",
  "compliance.legal_consult",
  "report.financial_periodic",
  "compliance.anomaly_detected",
  "budget.approval_needed",
  "budget.soft_limit_reached",
  "budget.hard_limit_breached",
  "hr.onboarding_provision",
  "hr.role_change",
  "agent.golive_approved",
  "agent.benchmark_passed",
  "agent.shadow_mode_cleared",
  "training.plan_ready",
  "training.retrain_completed",
  "audit.findings",
  "audit.anomaly_critical",
  "audit.weekly_spotcheck_flag",
  "product.release_deployed",
  "report.okr_weekly_update",
  "whistleblowing.tip_received",
  "meeting.decision_recorded",
  "meeting.convene_requested",
  "meeting.schedule_triggered",
  "meeting.turn.started",
  "meeting.turn.submitted",
  "meeting.closed",
  "meeting.invitations_sent",
  "org.structural_pattern_detected"
];

describe("nhãn thân thiện cho mã sự kiện / cụm / người", () => {
  it("đủ 35 mã sự kiện đều có nhãn ở CẢ vi và en", () => {
    const viTopics = (vi as any).labelGroups.eventTopic as Record<string, string>;
    const enTopics = (en as any).labelGroups.eventTopic as Record<string, string>;
    assert.equal(EVENT_TOPIC_CODES.length, 35);
    for (const code of EVENT_TOPIC_CODES) {
      const v = viTopics[code];
      const e = enTopics[code];
      assert.ok(typeof v === "string" && v.length > 0, "thiếu nhãn vi cho " + code);
      assert.ok(typeof e === "string" && e.length > 0, "thiếu nhãn en cho " + code);
      assert.notEqual(v, code, "nhãn vi trùng mã gốc: " + code);
    }
    assert.equal(eventTopicLabel(vi, "lead.qualified"), viTopics["lead.qualified"]);
  });

  it("clusterLabel: '*', cụm thật, mã lạ, rỗng", () => {
    assert.equal(clusterLabel(vi, "*"), "Tất cả các phòng");
    assert.equal(clusterLabel(vi, "hr_core"), "Nhân sự");
    assert.equal(clusterLabel(vi, "ma_la_abc"), "Chưa xác định (ma_la_abc)");
    assert.equal(clusterLabel(vi, ""), "");
    assert.equal(clusterLabel(vi, null), "");
    assert.equal(clusterLabelWithCode(vi, "hr_core"), "Nhân sự (hr_core)");
  });

  it("personLabel: từ điển, suy luận theo mẫu id, mã lạ", () => {
    assert.equal(personLabel(vi, "chu_tich"), "Chủ tịch");
    assert.equal(personLabel(vi, "sales-lead-agent"), "Trưởng phòng Kinh doanh");
    assert.equal(personLabel(vi, "hr-lead-agent"), "Trưởng phòng Nhân sự");
    assert.equal(personLabel(vi, "tech_product-agent-3"), "Nhân viên Kỹ thuật & Sản phẩm #3");
    assert.equal(personLabel(vi, "seed-agent-06"), "Nhân viên #6");
    assert.equal(personLabel(vi, "nguoi_la_abc"), "Chưa xác định (nguoi_la_abc)");
    assert.equal(personLabel(vi, ""), "");
  });

  it("KHÔNG nhân đôi mã gốc ở các hàm *LabelWithCode", () => {
    for (const s of [
      personLabelWithCode(vi, "ma_la_abc"),
      eventTopicLabelWithCode(vi, "ma_la_abc"),
      clusterLabelWithCode(vi, "ma_la_abc"),
    ]) {
      assert.equal(s.split("ma_la_abc").length - 1, 1, "mã bị lặp: " + s);
    }
    assert.equal(personLabelWithCode(vi, "chu_tich"), "Chủ tịch (chu_tich)");
    assert.equal(eventTopicLabelWithCode(vi, "lead.qualified"), (vi as any).labelGroups.eventTopic["lead.qualified"] + " (lead.qualified)");
  });

  it("codeTooltip: có mã / rỗng / null", () => {
    assert.equal(codeTooltip(vi, "hr_core"), "Mã gốc: hr_core");
    assert.equal(codeTooltip(vi, ""), undefined);
    assert.equal(codeTooltip(vi, null), undefined);
    assert.equal(codeTooltip(vi, undefined), undefined);
  });

  it("không hàm nào ném lỗi với đầu vào biên", () => {
    const inputs: Array<string | null | undefined> = [null, undefined, "", "*", "a.b.c", "a_b-c"];
    for (const x of inputs) {
      for (const fn of [eventTopicLabel, eventTopicLabelWithCode, clusterLabel, clusterLabelWithCode, personLabel, personLabelWithCode]) {
        const out = (fn as any)(vi, x);
        assert.equal(typeof out, "string");
      }
      assert.ok(codeTooltip(vi, x) === undefined || typeof codeTooltip(vi, x) === "string");
    }
  });
});

describe("heartbeatStatusLabel — nhịp tim agent", () => {
  it("vi: thức -> Đang làm việc", () => { assert.equal(heartbeatStatusLabel(vi as any, "thức"), "Đang làm việc"); });
  it("vi: ngủ -> Đang nghỉ", () => { assert.equal(heartbeatStatusLabel(vi as any, "ngủ"), "Đang nghỉ"); });
  it("vi: stale -> Nghi bị bỏ rơi", () => { assert.equal(heartbeatStatusLabel(vi as any, "stale"), "Nghi bị bỏ rơi"); });
  it("en: thức -> Working", () => { assert.equal(heartbeatStatusLabel(en as any, "thức"), "Working"); });
  it("en: ngủ -> Idle", () => { assert.equal(heartbeatStatusLabel(en as any, "ngủ"), "Idle"); });
  it("en: stale -> Possibly stuck", () => { assert.equal(heartbeatStatusLabel(en as any, "stale"), "Possibly stuck"); });
  it("vi: mã lạ paused_xyz -> Chưa xác định (paused_xyz)", () => { assert.equal(heartbeatStatusLabel(vi as any, "paused_xyz"), "Chưa xác định (paused_xyz)"); });
  it("en: mã lạ paused_xyz -> Unknown (paused_xyz)", () => { assert.equal(heartbeatStatusLabel(en as any, "paused_xyz"), "Unknown (paused_xyz)"); });
  it("null -> chuỗi rỗng", () => { assert.equal(heartbeatStatusLabel(vi as any, null), ""); });
  it("undefined -> chuỗi rỗng", () => { assert.equal(heartbeatStatusLabel(vi as any, undefined), ""); });
  it("HEARTBEAT_STATUS group có đúng 3 codes", () => { assert.equal(HEARTBEAT_STATUS.codes.length, 3); });
});
