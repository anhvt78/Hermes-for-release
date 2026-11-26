import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { alertGroupKey, groupAlertHistory, localizeUtcStamps, plainIncidentNames } from "../src/lib/control-alerts";

// Tab «Công cụ kiểm soát» — đợt rà soát 23/11/2026

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

const A = (id: string, source: string, title: string, at: string, acked: string | null = null) => ({ id, source, title, created_at: at, acked_at: acked });

describe("gộp cảnh báo lặp", () => {
  it("số đứng riêng thành «#»; số dính vào mã giữ nguyên (hai thẻ khác nhau không bị gộp)", () => {
    assert.equal(alertGroupKey("ops", "deepseek hết tiền đã 13 ngày 0 giờ"), alertGroupKey("ops", "deepseek hết tiền đã 12 ngày 5 giờ"));
    assert.notEqual(alertGroupKey("monitoring", "Thẻ t_897049e4 bị tắc 20 phút"), alertGroupKey("monitoring", "Thẻ t_9a37b14b bị tắc 20 phút"));
    assert.notEqual(alertGroupKey("a", "x"), alertGroupKey("b", "x"));
  });
  it("groupAlertHistory: gộp đúng, đếm chưa xác nhận, mới nhất làm đại diện, nhóm xếp theo mới nhất", () => {
    const alerts = [
      A("1", "ops", "dừng đã 11 ngày", "2026-11-21T07:00:00Z", "x"),
      A("2", "ops", "dừng đã 13 ngày", "2026-11-23T07:00:00Z"),
      A("3", "ops", "dừng đã 12 ngày", "2026-11-22T07:00:00Z", "x"),
      A("4", "ceo", "việc khác", "2026-11-22T12:00:00Z"),
    ];
    const g = groupAlertHistory(alerts);
    assert.equal(g.length, 2);
    assert.equal(g[0].items[0].id, "2");
    assert.equal(g[0].count, 3);
    assert.equal(g[0].unacked.length, 1);
    assert.equal(g[0].first, "2026-11-21T07:00:00Z");
    assert.equal(g[0].last, "2026-11-23T07:00:00Z");
    assert.equal(g[1].items[0].id, "4");
  });
  it("không có gì để gộp thì mỗi cảnh báo một nhóm", () => {
    assert.equal(groupAlertHistory([A("1", "a", "x", "2026-01-01T00:00:00Z"), A("2", "a", "y", "2026-01-02T00:00:00Z")]).length, 2);
    assert.deepEqual(groupAlertHistory([]), []);
  });
});

describe("mốc UTC → giờ Việt Nam; tên sự cố tiếng thường", () => {
  it("localizeUtcStamps đổi «2026-11-10 07:38 UTC» và giữ phần còn lại", () => {
    const out = localizeUtcStamps("từ 2026-11-10 07:38 UTC, đã 12 ngày", (iso) => `<${iso}>`);
    assert.equal(out, "từ <2026-11-10T07:38:00Z>, đã 12 ngày");
    assert.equal(localizeUtcStamps("không có mốc", (i) => i), "không có mốc");
  });
  const labels = { compliance_legal_basis_superseded: "Căn cứ pháp lý đã bị thay thế", task_ready_ket: "Thẻ sẵn sàng nhưng chưa ai nhận", waiting_review_sla: "Thẻ chờ duyệt quá hạn", task_blocked_lan_dau: "Thẻ bị chặn lần đầu" };
  it("mã thô và tên tiếng Anh của máy chủ → tên tiếng thường", () => {
    assert.equal(plainIncidentNames("Sự cố: compliance_legal_basis_superseded — Hai biểu mẫu", labels), "Sự cố: Căn cứ pháp lý đã bị thay thế — Hai biểu mẫu");
    assert.equal(plainIncidentNames("Sự cố: Task READY kẹt không được xử lý — Bảng x", labels), "Sự cố: Thẻ sẵn sàng nhưng chưa ai nhận — Bảng x");
    assert.equal(plainIncidentNames("Sự cố: Waiting review SLA — Phiếu", labels), "Sự cố: Thẻ chờ duyệt quá hạn — Phiếu");
  });
  it("câu không có gì để đổi giữ nguyên; mã nằm trong từ dài hơn không bị đụng", () => {
    assert.equal(plainIncidentNames("Kiểm toán báo kết quả", labels), "Kiểm toán báo kết quả");
    assert.equal(plainIncidentNames("my_task_ready_ket_x", labels), "my_task_ready_ket_x");
  });
});

describe("trang Công cụ kiểm soát: bố cục", () => {
  const box = fs.readFileSync(findSrc("src/pages/ControlBox.tsx"), "utf-8");
  const tools = fs.readFileSync(findSrc("src/pages/ControlTools.tsx"), "utf-8");
  it("đóng băng và tố giác là thẻ, không còn bảng 640px", () => {
    assert.ok(!box.includes("minWidth: 640"));
    assert.ok(!box.includes("<table"));
    assert.ok(box.includes("data-control-freeze={f.id}"));
    assert.ok(box.includes("data-control-tip={x.id}"));
  });
  it("lịch sử gộp cảnh báo lặp, một nút xác nhận cho nhóm có hỏi lại", () => {
    assert.ok(box.includes("groupAlertHistory(alertList)"));
    assert.ok(box.includes("c.ackGroupConfirm("));
    assert.ok(box.includes("data-control-alert-ack"));
  });
  it("tên sự cố tiếng thường + giờ Việt Nam trong cảnh báo", () => {
    assert.ok(box.includes("plainIncidentNames("));
    assert.ok(box.includes("localizeUtcStamps("));
  });
  it("tiêu đề trang cỡ chung (h2)", () => {
    assert.ok(tools.includes("<h2 style={{ margin: 0 }}>"));
    assert.ok(!tools.includes("<h1"));
  });
});
