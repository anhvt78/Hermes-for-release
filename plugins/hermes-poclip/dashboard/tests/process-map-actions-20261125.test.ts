import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { VIEW_ALL, pickProcessView } from "../src/lib/processView";

// «Luồng xử lý» (25/11/2026): mặc định không rơi vào sơ đồ trống, «Tất cả luồng» là tổng quan gọn, lọc theo phòng/người, nút «Nhắc người nhận» + «Mở thẻ».

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const pm = fs.readFileSync(findSrc("src/pages/ProcessMap.tsx"), "utf-8");

describe("chọn luồng mặc định", () => {
  const ids = ["a", "work", "b"];
  it("đã lưu lựa chọn thì giữ nguyên (kể cả «tất cả»)", () => {
    assert.equal(pickProcessView(VIEW_ALL, ids, { work: 5 }), VIEW_ALL);
    assert.equal(pickProcessView("b", ids, { work: 5, b: 0 }), "b");
  });
  it("chưa lưu: luồng công việc nếu đang có việc", () => {
    assert.equal(pickProcessView(null, ids, { work: 3, a: 9 }), "work");
  });
  it("chưa lưu và luồng công việc trống: luồng đầu tiên đang có việc", () => {
    assert.equal(pickProcessView(null, ids, { work: 0, a: 0, b: 4 }), "b");
  });
  it("không có số liệu đếm hoặc toàn trống: như cũ (luồng công việc, rồi luồng đầu)", () => {
    assert.equal(pickProcessView(null, ids), "work");
    assert.equal(pickProcessView(null, ids, { work: 0, a: 0, b: 0 }), "work");
    assert.equal(pickProcessView(null, ["x", "y"]), "x");
  });
});

describe("«Tất cả luồng» = tổng quan gọn", () => {
  it("mặc định chỉ liệt kê mỗi luồng một dòng, có nút «Xem sơ đồ» và nút hiện đủ sơ đồ", () => {
    assert.ok(pm.includes("function AllSummary("));
    assert.ok(pm.includes("{view === VIEW_ALL && !allFull ? <AllSummary processes={data.processes} onOpen={choose} /> : null}"));
    assert.ok(pm.includes("(view !== VIEW_ALL || allFull) ? data.processes.filter"));
    assert.ok(pm.includes("data-pm-all-toggle") && pm.includes("data-pm-all-open"));
  });
});

describe("lọc theo phòng và người", () => {
  it("gửi unit/person lên máy chủ và làm mới khi đổi", () => {
    assert.ok(pm.includes("&unit=${encodeURIComponent(unitF)}") && pm.includes("&person=${encodeURIComponent(personF)}"));
    assert.ok(pm.includes("[win, unitF, personF]"));
  });
  it("ô «Người» chỉ liệt kê người của phòng đang chọn; đổi phòng thì bỏ người không thuộc phòng đó; có nút «Bỏ lọc»", () => {
    assert.ok(pm.includes("(data?.directory?.people ?? []).filter((x) => !unitF || x.unit === unitF)"));
    assert.ok(pm.includes("data?.directory?.people.find((x) => x.id === personF)?.unit !== u"));
    assert.ok(pm.includes("data-pm-filter-clear"));
  });
  it("ghi chú nói rõ bộ lọc áp cho luồng nào, luồng nào không", () => {
    assert.ok(pm.includes("data-pm-filter-note") && pm.includes("data-pm-filter-not-applied"));
    assert.ok(pm.includes("!data.filter.applies_to.includes(view)"));
    assert.ok(vi.processMap.filterNote("Kỹ thuật", "").includes("phòng Kỹ thuật"));
    assert.ok(vi.processMap.filterNote("", "An").includes("nhân viên An"));
    assert.ok(vi.processMap.filterNote("Kỹ thuật", "An").includes("thời gian xử lý và tiến độ vẫn tính cho toàn công ty"));
  });
});

describe("nút hành động ở việc đang kẹt", () => {
  it("«Mở thẻ» là nút thật; «Nhắc người nhận» chỉ hiện ở việc chưa «ổn», hỏi lại trước khi gửi và báo kết quả", () => {
    assert.ok(pm.includes("data-pm-open-card"));
    assert.ok(pm.includes('it.link?.kind === "kanban" && it.link.board && it.level !== "ok"'));
    assert.ok(pm.includes("await confirmDialog({ message: pm.nudgeConfirm })"));
    assert.ok(pm.includes('poclipMutate("/api/v1/flows/nudge", "POST", { board: it.link.board, task_id: it.id }, { "X-Poclip-Actor": "chu_tich" })'));
    assert.ok(pm.includes("data-pm-nudge-result"));
    assert.ok(pm.includes("pm.nudgeFail(serverMessage(e))") && pm.includes("JSON.parse(body)?.detail?.error?.errors"));
  });
  it("chữ vi/en", () => {
    assert.equal(vi.processMap.nudgeBtn, "Nhắc người nhận");
    assert.equal(vi.processMap.nudgeDone("14:05"), "Đã nhắc lúc 14:05");
    assert.equal(en.processMap.nudgeBtn, "Remind assignee");
    assert.equal(vi.processMap.allCounts(1, 2, 3), "1 ổn · 2 cần theo dõi · 3 nghiêm trọng");
  });
});
