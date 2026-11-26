import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FINDINGS_PAGE, groupAuditFindings } from "../src/lib/auditFindings";

const f = (severity: string, category: string, description: string, status = "open") => ({ severity, category, description, status });

describe("Gộp phát hiện kiểm toán giống hệt nhau (21/11/2026)", () => {
  it("cùng mức + loại + nội dung → một dòng kèm số lần; giữ thứ tự xuất hiện đầu tiên", () => {
    const items = [
      f("critical", "unauthorized_action", "Cổng duyệt khớp chuỗi lệnh"),
      f("warn", "policy_violation", "Tự chấm kết luận (thẻ #1)"),
      f("warn", "policy_violation", "Tự chấm kết luận (thẻ #2)"),
      f("warn", "policy_violation", "Tự chấm kết luận (thẻ #1)"),
      f("warn", "policy_violation", "Tự chấm kết luận (thẻ #1)"),
    ];
    const g = groupAuditFindings(items, (x) => x.description);
    assert.deepEqual(g.map((x) => [x.first.description, x.count]), [
      ["Cổng duyệt khớp chuỗi lệnh", 1],
      ["Tự chấm kết luận (thẻ #1)", 3],
      ["Tự chấm kết luận (thẻ #2)", 1],
    ]);
  });

  it("khác mức hoặc khác loại thì KHÔNG gộp dù cùng nội dung", () => {
    const g = groupAuditFindings([f("warn", "a", "X"), f("critical", "a", "X"), f("warn", "b", "X")], (x) => x.description);
    assert.equal(g.length, 3);
  });

  it("nội dung so sánh theo hàm textOf (nội dung đã làm sạch), không phải bản gốc", () => {
    const g = groupAuditFindings([f("warn", "a", "Thẻ t_aaa lỗi"), f("warn", "a", "Thẻ t_bbb lỗi")], () => "Thẻ lỗi");
    assert.equal(g.length, 1);
    assert.equal(g[0].count, 2);
  });

  it("danh sách rỗng và không đổi mảng gốc", () => {
    assert.deepEqual(groupAuditFindings([], () => ""), []);
    const items = [f("warn", "a", "X"), f("warn", "a", "X")];
    groupAuditFindings(items, (x) => x.description);
    assert.equal(items.length, 2);
  });

  it("mỗi lần «Xem thêm» mở thêm 10 dòng", () => {
    assert.equal(FINDINGS_PAGE, 10);
  });
});
