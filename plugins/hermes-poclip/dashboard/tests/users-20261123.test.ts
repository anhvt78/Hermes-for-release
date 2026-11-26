import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { accountSubtitle, errorMessageVi, passwordIssue } from "../src/lib/users-view";

// Tab «Người dùng» — đợt rà soát 23/11/2026

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

describe("mật khẩu và câu lỗi", () => {
  it("passwordIssue: ngắn hơn 8 ký tự, không khớp, hợp lệ", () => {
    assert.equal(passwordIssue("abc1234", "abc1234"), "short");
    assert.equal(passwordIssue("abcd1234", "abcd12345"), "mismatch");
    assert.equal(passwordIssue("abcd1234", "abcd1234"), null);
  });
  it("errorMessageVi: ưu tiên câu của máy chủ; không bao giờ hiện «HTTP 400» thô", () => {
    assert.equal(errorMessageVi({ detail: { message_vi: "Mật khẩu hiện tại không đúng." } }, "Lỗi chung"), "Mật khẩu hiện tại không đúng.");
    assert.equal(errorMessageVi({ detail: "Tên đã tồn tại" }, "Lỗi chung"), "Tên đã tồn tại");
    assert.equal(errorMessageVi({ detail: "HTTP 400" }, "Lỗi chung"), "Lỗi chung");
    assert.equal(errorMessageVi(new Error("HTTP 400"), "Lỗi chung"), "Lỗi chung");
    assert.equal(errorMessageVi(null, "Lỗi chung"), "Lỗi chung");
  });
  it("accountSubtitle chỉ ghép phần có giá trị", () => {
    assert.equal(accountSubtitle({ username: "President" }), "President");
    assert.equal(accountSubtitle({ username: "ketoan", unit: "Kế toán", profile: "" }), "ketoan · Kế toán");
    assert.equal(accountSubtitle({ username: "a", unit: "Kế toán", profile: "Nhân viên X" }), "a · Kế toán · Nhân viên X");
  });
});

describe("trang Người dùng: bố cục", () => {
  const page = fs.readFileSync(findSrc("src/pages/Users.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("tiêu đề + nút «Thêm tài khoản» đứng trước khung «Tài khoản của bạn»", () => {
    assert.ok(page.indexOf("data-poclip-add-button") < page.indexOf("data-poclip-own-account"));
    assert.ok(page.includes("<InfoHint wide>{t.users.rolesHelp}</InfoHint>"));
  });
  it("danh sách là thẻ, không còn bảng 9 cột (điện thoại không bị cắt cột Trạng thái/Xoá)", () => {
    assert.ok(!page.includes("<table"));
    assert.ok(!page.includes("<tr "));
    assert.ok(page.includes("data-poclip-account-row"));
    assert.ok(page.includes("data-users-list"));
  });
  it("tài khoản gốc: ghi chú thay cho nút Xoá xám «Root protected»", () => {
    assert.ok(!page.includes("Root protected"));
    assert.ok(page.includes("data-poclip-root-note"));
  });
  it("biểu mẫu: ô nhập vừa phải, nhập lại mật khẩu, kiểm ≥ 8 ký tự, chỉ mở một biểu mẫu, chọn phòng từ danh sách", () => {
    assert.ok(page.includes("maxWidth: 420"));
    assert.ok(page.includes("data-poclip-password-confirm"));
    assert.equal((page.match(/passwordIssue\(/g) ?? []).length, 2);
    assert.ok(page.includes("function openPanel("));
    assert.ok(page.includes("<select data-poclip-org-unit"));
    assert.ok(!page.includes('style={{ display: "block", width: "100%", marginTop: 4 }}'));
  });
  it("lỗi hiện câu tiếng Việt, không còn err.message thô", () => {
    assert.ok(!page.includes("err instanceof Error ? err.message"));
    assert.ok(page.includes("errorMessageVi(err, t.users.errorGeneric)"));
  });
  it("chữ mới có trong tiếng Việt", () => {
    for (const k of ["yourAccountTitle:", "rolesHelp:", "rootAccountNote:", "confirmPasswordLabel:", "errorPasswordShort:", "orgUnitPick:"]) assert.ok(vi.includes(k), k);
  });
});
