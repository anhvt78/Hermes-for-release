import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compactVi, humanizeFinding, humanizeTitle, severityOf, sortBySeverity, tabHref, worstSeverity } from "../src/lib/dashFormat";

describe("compactVi", () => {
  it("rút gọn số lớn", () => {
    assert.equal(compactVi(17886212), "17,9 triệu");
    assert.equal(compactVi(2500000000), "2,5 tỷ");
    assert.equal(compactVi(12345), "12,3 nghìn");
  });
  it("số nhỏ giữ nguyên", () => {
    assert.equal(compactVi(0), "0");
    assert.equal(compactVi(950), "950");
    assert.equal(compactVi(5821), "5.821");
  });
});

describe("severity", () => {
  it("map mức cảnh báo của máy chủ", () => {
    assert.equal(severityOf("critical"), "critical");
    assert.equal(severityOf("warning"), "warning");
    assert.equal(severityOf("warn"), "warning");
    assert.equal(severityOf("ok"), "ok");
    assert.equal(severityOf(undefined), "ok");
  });
  it("worstSeverity lấy mức nặng nhất", () => {
    assert.equal(worstSeverity("ok", "warning", "ok"), "warning");
    assert.equal(worstSeverity("warning", "critical"), "critical");
    assert.equal(worstSeverity(), "ok");
  });
  it("sortBySeverity: nặng lên trước, cùng mức giữ thứ tự gốc", () => {
    const z = [
      { id: "a", sev: "ok" as const }, { id: "b", sev: "warning" as const }, { id: "c", sev: "ok" as const },
      { id: "d", sev: "critical" as const }, { id: "e", sev: "warning" as const },
    ];
    assert.deepEqual(sortBySeverity(z).map((x) => x.id), ["d", "b", "e", "a", "c"]);
  });
});

describe("humanizeFinding", () => {
  const opts = { name: (id: string) => (id === "compliance-agent" ? "Kiểm soát viên tuân thủ" : id), cardWord: "thẻ" };
  it("đổi actor/task kỹ thuật thành câu đọc được", () => {
    const r = humanizeFinding("Tự chấm kết luận cho thẻ do chính mình làm: actor='compliance-agent' task='t_e26abc'", opts);
    assert.equal(r.text, "Tự chấm kết luận cho thẻ do chính mình làm: Kiểm soát viên tuân thủ (thẻ #e26abc)");
    assert.equal(r.changed, true);
    assert.match(r.raw, /actor='compliance-agent'/);
  });
  it("rút gọn UUID", () => {
    const r = humanizeFinding("Tuân thủ TỪ CHỐI phiếu ba5e2e59-2f02-40bc-955a-d46a7cbc43ae (tool_use)", opts);
    assert.equal(r.text, "Tuân thủ TỪ CHỐI phiếu #ba5e2e59 (tool_use)");
  });
  it("chữ thường không đổi, null an toàn", () => {
    assert.equal(humanizeFinding("Vượt ngân sách", opts).changed, false);
    assert.equal(humanizeFinding(null, opts).text, "");
  });
});

describe("humanizeTitle / tabHref", () => {
  it("bỏ mã công ty nội bộ", () => {
    assert.equal(humanizeTitle("Đề xuất cấu hình giám sát cho công ty default: 33/33"), "Đề xuất cấu hình giám sát cho công ty: 33/33");
    assert.equal(humanizeTitle("Công ty Phần mềm AI"), "Công ty Phần mềm AI");
  });
  it("tabHref giữ profile, đổi tab", () => {
    assert.equal(tabHref("meeting-room", "?profile=default&tab=executive-dashboard"), "/hermes-poclip?profile=default&tab=meeting-room");
    assert.equal(tabHref("goal-tree", ""), "/hermes-poclip?tab=goal-tree");
  });
});

import { groupFindings } from "../src/lib/dashFormat";
describe("groupFindings", () => {
  const f = (source: string, severity: number, subject: string, age: number) => ({ source, severity, subject, age_minutes: age });
  it("gộp dòng giống hệt, đếm số lần, lấy tuổi nhỏ nhất", () => {
    const g = groupFindings([f("a", 1, "x", 30), f("a", 1, "x", 5), f("a", 1, "x", 9), f("b", 2, "y", 1)]);
    assert.equal(g.length, 2);
    assert.deepEqual([g[0].subject, g[0].count, g[0].age_minutes], ["x", 3, 5]);
    assert.deepEqual([g[1].subject, g[1].count], ["y", 1]);
  });
  it("mức nặng (1) lên trước dù ít lần hơn; rỗng an toàn", () => {
    const g = groupFindings([f("a", 2, "nhiều", 1), f("a", 2, "nhiều", 1), f("a", 1, "nặng", 9)]);
    assert.equal(g[0].subject, "nặng");
    assert.deepEqual(groupFindings([]), []);
  });
});

import { groupEscalations, cardRef } from "../src/lib/incident-activity";
describe("groupEscalations / cardRef", () => {
  const e = (cls: string, at: string, rec: string[] = ["ceo-agent"]) => ({ incident_class: cls, raised_by: "x", recipients: rec, chairman_alert: "a", created_at: at });
  it("gộp dòng giống hệt cùng phút, giữ dòng khác", () => {
    const g = groupEscalations([e("a", "2026-11-10T14:31:01Z"), e("a", "2026-11-10T14:31:40Z"), e("a", "2026-11-10T14:32:00Z"), e("b", "2026-11-10T14:31:10Z")]);
    assert.deepEqual(g.map((x) => [x.incident_class, x.count]), [["a", 2], ["a", 1], ["b", 1]]);
  });
  it("cardRef rút gọn mã thẻ", () => {
    assert.equal(cardRef("t_91741019"), "#91741019");
    assert.equal(cardRef("gateway"), "gateway");
  });
});

import { formatAge } from "../src/lib/dashFormat";
describe("formatAge / humanize apr_ & agent ids", () => {
  const u = { min: "phút", hour: "giờ", day: "ngày" };
  it("đổi phút sang đơn vị dễ đọc", () => {
    assert.equal(formatAge(0, u), "0 phút");
    assert.equal(formatAge(45, u), "45 phút");
    assert.equal(formatAge(185, u), "3 giờ 5 phút");
    assert.equal(formatAge(1440, u), "1 ngày");
    assert.equal(formatAge(3185, u), "2 ngày 5 giờ");
  });
  it("rút gọn mã phiếu apr_… và tên agent", () => {
    const r = humanizeFinding("Phê duyệt apr_2409208aa1994c419fdf7409acd13bd3 chờ; hồ sơ security-lead-agent đổi", { name: (id) => (id === "security-lead-agent" ? "Trưởng bảo mật" : id), cardWord: "thẻ" });
    assert.equal(r.text, "Phê duyệt #2409208a chờ; hồ sơ Trưởng bảo mật đổi");
  });
});

import { stripTechTags } from "../src/lib/dashFormat";
describe("stripTechTags", () => {
  it("bỏ thẻ nguồn kỹ thuật, giữ thẻ tiếng Việt", () => {
    assert.equal(stripTechTags("[CẢNH BÁO] [monitoring] Sự cố: Tồn đọng task"), "[CẢNH BÁO] Sự cố: Tồn đọng task");
    assert.equal(stripTechTags("[ceo-agent] CEO: Vấn đề về cơ cấu"), "CEO: Vấn đề về cơ cấu");
    assert.equal(stripTechTags("[tố giác] Có tố giác"), "[tố giác] Có tố giác");
    assert.equal(stripTechTags(null), "");
  });
});

import { splitAlertBody } from "../src/lib/dashFormat";
describe("splitAlertBody", () => {
  it("bỏ dòng «Loại sự cố/Người báo»: chỉ có siêu dữ liệu → không tóm tắt, không có gì để mở thêm", () => {
    const r = splitAlertBody("Loại sự cố: Tồn đọng task (ton_dong_task). Người báo: monitoring.", "Sự cố: Tồn đọng task");
    assert.deepEqual(r, { summary: "", rest: "" });
  });
  it("ưu tiên dòng «Hiện tượng», bỏ mã kỹ thuật trong ngoặc", () => {
    const body = "Loại sự cố: X (x_y). Người báo: a.\nBối cảnh: abc\nHiện tượng: thẻ kẹt (task_ready_ket) 5 giờ";
    const r = splitAlertBody(body, "Sự cố: kẹt");
    assert.equal(r.summary, "Hiện tượng: thẻ kẹt 5 giờ");
    assert.equal(r.rest, "Bối cảnh: abc");
  });
  it("tóm tắt trùng tiêu đề thì bỏ; dòng dài bị cắt nhưng bản đầy đủ nằm ở rest", () => {
    assert.equal(splitAlertBody("Kiểm toán báo kết quả", "Kiểm toán: Kiểm toán báo kết quả kiểm tra").summary, "");
    const long = "x".repeat(200);
    const r = splitAlertBody(long, "t");
    assert.equal(r.summary.length, 138);
    assert.equal(r.rest, long);
  });
});
