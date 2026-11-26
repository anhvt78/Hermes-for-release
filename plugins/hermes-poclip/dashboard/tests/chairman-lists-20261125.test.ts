import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Giao diện cho Chủ tịch — bốn danh sách dài được rút gọn (25/11/2026, nhánh giao-dien-chu-tich).

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");

describe("Báo cáo định kỳ: gom các phòng cùng một lý do", () => {
  it("từ 3 phòng cùng «việc dở quá 3 ngày» thì gom một dòng liệt kê tên kèm (số nhân viên/tổng)", () => {
    const rv = read("src/lib/report-view.ts");
    assert.ok(rv.includes("entries.filter((e) => e.stale).length >= 3"));
    assert.ok(rv.includes("L.unitReasonStaleGroup!(names)"));
    assert.equal((rv.match(/plainName\(unitName\(/g) || []).length, 5);          // tên phòng trong báo cáo cũng bỏ tên vai trò tiếng Anh
    const L = (vi as any).scheduleReminders.report;
    assert.equal(L.unitReasonStaleGroupLabel(11), "11 phòng cùng vấn đề");
    assert.ok(L.unitReasonStaleGroup("Điều hành (1/3)").includes("Điều hành (1/3)"));
  });
});

describe("Thông báo, Ngân sách: mỗi trang 10 dòng", () => {
  it("Thông báo (hàng đợi cảnh báo và nhật ký) và Ngân sách", () => {
    assert.ok(read("src/components/DecisionQueue.tsx").includes('items={shown} pageSize={10} as="list"'));
    assert.ok(read("src/pages/Notifications.tsx").includes("groupNotifications(rows)} pageSize={10}"));
    assert.ok(read("src/pages/Budget.tsx").includes("<PagedRows items={shown} pageSize={10} colSpan={8}"));
  });
});

describe("Chờ duyệt: đề xuất chính sách có dòng tóm tắt theo loại", () => {
  it("từ 6 đề xuất trở lên", () => {
    const pp = read("src/components/PolicyProposals.tsx");
    assert.ok(pp.includes("if (items.length >= 6)") && pp.includes("data-policy-groups"));
    assert.equal(vi.policyProposals.groupsLead(59), "59 đề xuất, gồm:");
    assert.equal(vi.policyProposals.groupsMore(2), "và 2 loại khác");
    assert.ok(en.policyProposals.groupsLead(1).includes("1 proposal"));
  });
});
