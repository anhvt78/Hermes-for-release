import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { groupByLayer, groupSelfHeal, incidentLabel, isCardId, kanbanHref, splitQuotaFindings, splitTarget } from "../src/lib/monitoring-view";
import type { SelfHealRow } from "../src/lib/incident-activity";

// Tab «Giám sát» — đợt rà soát 23/11/2026

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không tìm thấy ${relPath}`);
}

describe("tách cảnh báo «chuyển model dự phòng do hạn mức»", () => {
  const f = (cls: string, subject: string) => ({ incident_class: cls, subject });
  it("gom theo nhân viên, nhiều lần trước; phần còn lại giữ nguyên", () => {
    const items = [
      f("agent_du_phong_han_muc", "Hồ sơ ceo-agent chuyển model dự phòng do hạn mức"),
      f("agent_du_phong_han_muc", "Hồ sơ ops-agent chuyển model dự phòng do hạn mức"),
      f("agent_du_phong_han_muc", "Hồ sơ ceo-agent chuyển model dự phòng do hạn mức"),
      f("action_item_overdue", "Việc cần làm abc quá hạn 12 ngày"),
    ];
    const r = splitQuotaFindings(items);
    assert.deepEqual(r.quota, [{ profile: "ceo-agent", count: 2 }, { profile: "ops-agent", count: 1 }]);
    assert.equal(r.rest.length, 1);
    assert.equal(r.rest[0].incident_class, "action_item_overdue");
  });
  it("không đọc được tên nhân viên thì giữ dòng ở phần còn lại (không mất dòng nào)", () => {
    const r = splitQuotaFindings([f("agent_du_phong_han_muc", "Nội dung lạ")]);
    assert.equal(r.quota.length, 0);
    assert.equal(r.rest.length, 1);
  });
});

describe("gộp dòng tự khắc phục lặp", () => {
  const row = (id: string, at: string, over: Partial<SelfHealRow> = {}): SelfHealRow => ({
    id, incident_class: "task_blocked_da_xu_ly", action: "resolve_card:done", target: `cty/t_${id}`, actor: "ops-agent",
    result: "refused", attempt: 0, created_at: at, ...over,
  });
  it("cùng loại, việc, kết quả, người làm, liền nhau trong 2 phút → một dòng × N, giữ danh sách thẻ", () => {
    const g = groupSelfHeal([row("a1", "2026-11-16T03:21:59.000Z"), row("a2", "2026-11-16T03:21:58.000Z"), row("a3", "2026-11-16T03:21:58.000Z")]);
    assert.equal(g.length, 1);
    assert.equal(g[0].count, 3);
    assert.deepEqual(g[0].targets, ["cty/t_a1", "cty/t_a2", "cty/t_a3"]);
  });
  it("người làm khác nhau nhưng dòng trông giống hệt → vẫn gộp (cột người làm không hiện ra)", () => {
    const g = groupSelfHeal([row("d1", "2026-11-16T03:21:59.000Z", { actor: "hr-lead-agent" }), row("d2", "2026-11-16T03:21:58.000Z", { actor: "ops-agent" })]);
    assert.equal(g.length, 1);
    assert.equal(g[0].count, 2);
  });
  it("khác kết quả hoặc cách xa nhau thì KHÔNG gộp", () => {
    const g = groupSelfHeal([
      row("b1", "2026-11-16T03:21:59.000Z"),
      row("b2", "2026-11-16T03:21:58.000Z", { result: "recovered" }),
      row("b3", "2026-11-16T01:00:00.000Z"),
    ]);
    assert.equal(g.length, 3);
    assert.ok(g.every((x) => x.count === 1));
  });
});

describe("tên loại sự cố, liên kết thẻ, nhóm theo tầng", () => {
  it("incidentLabel: từ điển trước, rồi tên máy chủ (nếu khác mã), cuối cùng là mã", () => {
    const labels = { a: "Tên thường" };
    assert.equal(incidentLabel(labels, "a", "Task A (tiếng Anh)"), "Tên thường");
    assert.equal(incidentLabel(labels, "b", "Tên máy chủ"), "Tên máy chủ");
    assert.equal(incidentLabel(labels, "b", "b"), "b");
    assert.equal(incidentLabel(labels, "b", null), "b");
  });
  it("splitTarget / kanbanHref chỉ làm liên kết khi có bảng và mã thẻ hợp lệ", () => {
    assert.deepEqual(splitTarget("cty-phan-mem/t_91741019"), { board: "cty-phan-mem", id: "t_91741019" });
    assert.ok(isCardId("t_91741019"));
    assert.ok(!isCardId("gateway"));
    assert.equal(kanbanHref("cty/t_ab12"), "/kanban?board=cty&task=t_ab12");
    assert.equal(kanbanHref("gateway"), null);
    assert.equal(kanbanHref("cty/dich-vu"), null);
  });
  it("groupByLayer: Vận hành → Kinh doanh → Hệ thống; tầng lạ cuối; giữ thứ tự trong nhóm", () => {
    const items = [
      { id: 1, monitor_layer: "T1_HE_THONG" }, { id: 2, monitor_layer: "T3_NGHIEP_VU" }, { id: 3, monitor_layer: "T2_VAN_HANH" },
      { id: 4, monitor_layer: "T2_VAN_HANH" }, { id: 5, monitor_layer: "KHAC" },
    ];
    const g = groupByLayer(items);
    assert.deepEqual(g.map((x) => x.layer), ["T2_VAN_HANH", "T3_NGHIEP_VU", "T1_HE_THONG", "KHAC"]);
    assert.deepEqual(g[0].items.map((x) => x.id), [3, 4]);
  });
});

describe("trang Giám sát: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/Monitoring.tsx"), "utf-8");
  const prov = fs.readFileSync(findSrc("src/components/ProviderHealthPanel.tsx"), "utf-8");
  const inc = fs.readFileSync(findSrc("src/components/IncidentActivityPanel.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("chỉ MỘT nút «Quét lại» ở đầu trang; các khung con không còn nút riêng", () => {
    assert.equal((page.match(/data-monitoring-refresh-all/g) ?? []).length, 1);
    assert.ok(!page.includes("data-findings-refresh"));
    assert.ok(!prov.includes("monitoring.refresh"));
    assert.ok(!inc.includes("monitoring.refresh"));
    assert.equal((page.match(/\{mon\.refresh\}/g) ?? []).length, 1, "chỉ nút chung dùng mon.refresh");
  });
  it("hai khung con nhận refreshKey để nạp lại theo nút chung", () => {
    assert.ok(page.includes("<ProviderHealthPanel quota={split.quota} refreshKey={tick}"));
    assert.ok(page.includes("<IncidentActivityPanel refreshKey={tick}"));
  });
  it("cảnh báo hạn mức nằm trong khung nhà cung cấp, không lặp trong bảng phát hiện", () => {
    assert.ok(page.includes("splitQuotaFindings("));
    assert.ok(page.includes("groupFindings(split.rest)"));
    assert.ok(prov.includes("data-provider-quota"));
  });
  it("nhật ký tự khắc phục: gộp dòng lặp, 5 dòng đầu + «Xem thêm», thẻ bấm được", () => {
    assert.ok(inc.includes("groupSelfHeal(rows)"));
    assert.ok(inc.includes("SHORT_LIST = 5"));
    assert.ok(inc.includes("kanbanHref("));
    assert.ok(inc.includes("data-fold-toggle"));
  });
  it("mọi bảng nằm trong khung cuộn ngang (điện thoại không tràn trang)", () => {
    assert.ok((page.match(/style=\{scrollBox\}/g) ?? []).length >= 3);
    assert.ok((inc.match(/style=\{scrollBox\}/g) ?? []).length >= 2);
  });
  it("cấu hình gom theo tầng; giải thích dài nằm sau «?»", () => {
    assert.ok(page.includes("<CoverageGroups"));
    assert.ok(page.includes("<InfoHint>{mon.thresholdHelp[k]}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{mon.modeHelp}</InfoHint>"));
    assert.ok(!page.includes("data-mode-help"));
  });
  it("chữ tiếng Việt: không còn «agent» trong nhãn cách xử lý, không còn «Đang kiểm»", () => {
    const start = vi.indexOf("    modeLabels: {");
    const block = vi.slice(start, vi.indexOf("    modeSummary:", start));
    // khoá «agent: …» của tập chế độ vẫn là mã nội bộ; chỉ chữ HIỆN RA (trong dấu nháy) mới không được có «agent»
    const shown = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    assert.ok(shown.length >= 5, "đọc được các chuỗi hiển thị");
    assert.ok(!shown.some((s) => /\bagent\b/i.test(s)), "nhãn/ghi chú cách xử lý không còn chữ agent");
    assert.ok(!vi.includes('dang_kiem: "Đang kiểm"'));
    assert.ok(!vi.includes("(khai ở cấu hình «self_heal.restart_commands»)"));
  });
  it("từ điển tên loại sự cố có đủ 33 loại + 2 mã lạ đã gặp", () => {
    const start = vi.indexOf("    incidentClassLabels: {");
    const block = vi.slice(start, vi.indexOf("} as Record<string, string>", start));
    for (const k of [
      "task_blocked_lan_dau", "task_blocked_loop", "task_ket_heartbeat", "trat_tu_task", "ton_dong_task", "waiting_review_sla", "vi_pham_quy_trinh",
      "su_co_milestone", "chi_phi_ha_tang", "task_ready_ket", "dispatcher_chet", "phien_hop_ket", "cap_phat_ket", "agent_du_phong_han_muc",
      "service_process_chet", "errors_log_moi", "cron_db_loi", "task_cho_reset", "gateway_dung", "de_xuat_chot_done", "quyet_dinh_nghiep_vu",
      "ban_va", "plugin_loi", "tai_nguyen", "tool_health", "meeting_agent_timeout", "event_delivery", "todo_triage_ket", "worker_blocked_root_cause",
      "duyet_done", "logic_nghiep_vu_sai", "kien_truc_lon", "gd_khong_xu_ly_48h", "infra_alert_undelivered", "compliance_legal_basis_superseded",
    ]) {
      assert.ok(block.includes(`${k}:`), k);
    }
  });
});
