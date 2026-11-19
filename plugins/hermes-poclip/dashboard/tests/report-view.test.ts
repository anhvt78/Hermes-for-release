import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deliverySummary, describeDaily, describeWeekly, itemText, toneOfLevel, type ReportLabels } from "../src/lib/report-view";

// Dựng nội dung báo cáo tóm tắt cho Chủ tịch đọc (tab «Lịch và nhắc việc»)

const L: ReportLabels = {
  secFinance: "Tiền bạc", revenue: "Doanh thu", revenueDelta: (p) => `${p} so với hôm qua`, aiCost: "Chi phí AI", aiCostValue: (v, t) => `${v} (${t} token)`, budgetUsed: "Đã dùng ngân sách",
  secIncidents: "Sự cố", incAuto: "Tự xử lý", incPending: "Còn mở", incCritical: "Nghiêm trọng",
  secQueue: "Chờ Chủ tịch", queueTotal: "Số việc", queueEmpty: "Không có",
  secAgents: "Nhân viên AI", agentsRunning: (a, t) => `${a}/${t} đang chạy`, uptime: "Chạy liên tục",
  secUnits: "Các phòng", unitOk: "Ổn", unitWarn: "Chú ý", unitBad: "Vấn đề", unitUnknown: "Chưa rõ",
  secAlerts: "Cảnh báo", alertsNone: "Không có cảnh báo", securitySignals: "An ninh",
  secWeekTotals: "Tổng kết tuần", weekRevenue: "Doanh thu", weekAiCost: "Chi phí AI", weekTokens: "Token",
  secWeekKpi: "Kết quả", kpiMissing: (n) => `${n} phòng chưa nộp`, kpiNone: "Chưa ai nộp",
  secWeekBudget: "Ngân sách", budgetLine: (s, a) => `chi ${s}/${a}`, budgetOver: (p) => `vượt ${p}`, budgetNone: "Chưa phân bổ",
  secWeekProposals: "Đề xuất", proposalsNone: "Không có",
  secWeekRisks: "Rủi ro", risksNone: "Không có",
  secWeekNotes: "Ghi chú",
  yes: "Có", no: "Không", none: "—",
};
const unit = (c: string) => `Phòng ${c}`;

describe("describeDaily", () => {
  const payload = {
    financial: { revenue: { amount_vnd: 1500000, delta_vs_yesterday_pct: 12.34, alert_level: "green" }, token_cost: { total_tokens: 2000, cost_vnd: 50000, budget_month_used_pct: 85, alert_level: "yellow" } },
    incidents: { auto_resolved: 3, pending: 2, critical_unresolved: 1 },
    hitl_queue: { total_items: 2, items: [{ title: "Duyệt A" }, "Duyệt B"] },
    system_metrics: { active_agents: 0, total_agents: 32, uptime_pct: null, uptime_note: "chưa đủ dữ liệu" },
    cluster_health: { audit: { status: "green" }, risk: { status: "red" } },
    alerts: ["Cảnh báo X"],
    security_signals: 2,
  };

  it("đủ các khối theo thứ tự", () => {
    const ids = describeDaily(payload, L, unit).map((s) => s.id);
    assert.deepEqual(ids, ["finance", "incidents", "queue", "agents", "units", "alerts"]);
  });

  it("tài chính: số tiền, thay đổi so với hôm qua, ngân sách đã dùng", () => {
    const fin = describeDaily(payload, L, unit)[0];
    assert.match(fin.rows[0].value, /12,3% so với hôm qua/);
    assert.equal(fin.rows[0].tone, "ok");
    assert.equal(fin.rows[2].tone, "warn");   // 85% ngân sách
  });

  it("sự cố nghiêm trọng chưa xử lý hiện màu đỏ", () => {
    const inc = describeDaily(payload, L, unit)[1];
    assert.equal(inc.rows[2].tone, "bad");
  });

  it("các phòng có vấn đề xếp trước phòng ổn; tên phòng qua hàm đổi tên", () => {
    const units = describeDaily(payload, L, unit).find((s) => s.id === "units")!;
    assert.equal(units.rows[0].label, "Phòng risk");
    assert.equal(units.rows[0].value, "Vấn đề");
    assert.equal(units.rows[1].value, "Ổn");
  });

  it("không có nhân viên nào đang chạy → cảnh báo vàng; giữ ghi chú của máy chủ", () => {
    const ag = describeDaily(payload, L, unit).find((s) => s.id === "agents")!;
    assert.equal(ag.rows[0].value, "0/32 đang chạy");
    assert.equal(ag.rows[0].tone, "warn");
    assert.equal(ag.note, "chưa đủ dữ liệu");
  });

  it("cảnh báo + dấu hiệu an ninh; không có gì thì nói rõ «không có»", () => {
    const al = describeDaily(payload, L, unit).find((s) => s.id === "alerts")!;
    assert.equal(al.rows.length, 2);
    const empty = describeDaily({}, L, unit).find((s) => s.id === "alerts")!;
    assert.equal(empty.rows[0].value, "Không có cảnh báo");
  });

  it("dữ liệu rỗng hoặc sai kiểu không làm hỏng", () => {
    assert.doesNotThrow(() => describeDaily(null, L, unit));
    assert.doesNotThrow(() => describeDaily("x", L, unit));
  });
});

describe("describeWeekly", () => {
  const row = {
    total_revenue_vnd: 0, total_token_cost_vnd: 1200, total_tokens: 99,
    cluster_kpi: { a: { kpi: null, note: "N/A" }, b: { kpi: { done: 5, late: 1 } } },
    budget_summary: { a: { allocated_vnd: 0, spent_vnd: 0, overrun_flag: false }, b: { allocated_vnd: 1000, spent_vnd: 1500, overrun_pct: 50, overrun_flag: true } },
    optimization_proposals: [], risks_next_week: [{ text: "Rủi ro 1" }], chairman_notes: "  ",
  };

  it("KPI chỉ liệt kê phòng đã nộp; phòng chưa nộp gộp thành một dòng đếm", () => {
    const kpi = describeWeekly(row, L, unit).find((s) => s.id === "kpi")!;
    assert.equal(kpi.rows.length, 1);
    assert.equal(kpi.rows[0].label, "Phòng b");
    assert.match(kpi.rows[0].value, /done: 5/);
    assert.equal(kpi.note, "1 phòng chưa nộp");
  });

  it("ngân sách chỉ hiện phòng có số liệu; vượt thì đỏ", () => {
    const b = describeWeekly(row, L, unit).find((s) => s.id === "budget")!;
    assert.equal(b.rows.length, 1);
    assert.equal(b.rows[0].tone, "bad");
    assert.match(b.rows[0].value, /vượt 50%/);
  });

  it("rủi ro lấy chữ từ đối tượng; ghi chú trống thì không có khối ghi chú", () => {
    const ids = describeWeekly(row, L, unit).map((s) => s.id);
    assert.ok(!ids.includes("notes"));
    const r = describeWeekly(row, L, unit).find((s) => s.id === "risks")!;
    assert.equal(r.rows[0].value, "Rủi ro 1");
  });
});

describe("tiện ích", () => {
  it("toneOfLevel", () => {
    assert.equal(toneOfLevel("green"), "ok");
    assert.equal(toneOfLevel("RED"), "bad");
    assert.equal(toneOfLevel("amber"), "warn");
    assert.equal(toneOfLevel("unknown"), "muted");
    assert.equal(toneOfLevel(undefined), "muted");
  });

  it("itemText: chuỗi, đối tượng, rỗng", () => {
    assert.equal(itemText("a"), "a");
    assert.equal(itemText({ title: "T" }), "T");
    assert.equal(itemText(null), "");
  });

  it("deliverySummary: chỉ bảng điều khiển hay đã gửi kênh ngoài", () => {
    const lab = { dashboardOnly: "Chỉ ở đây", telegram: "Telegram", sentVia: (c: string) => `Đã gửi qua ${c}` };
    assert.equal(deliverySummary([], lab), "Chỉ ở đây");
    assert.equal(deliverySummary(["dashboard"], lab), "Chỉ ở đây");
    assert.equal(deliverySummary(["telegram", "dashboard"], lab), "Đã gửi qua Telegram");
    assert.equal(deliverySummary(undefined, lab), "Chỉ ở đây");
  });
});
