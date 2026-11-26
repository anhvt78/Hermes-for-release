import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dayFromInput, delegationIssues, formatVnd, isDelegationDateValid, parseAmount, plainMessage, todayInputDate } from "../src/lib/operating-settings-view";

// Tab «Cài đặt điều hành» — đợt rà soát 24/11/2026

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

describe("ngày, tiền", () => {
  const now = new Date(2026, 10, 24, 9, 30, 0);
  it("todayInputDate + isDelegationDateValid: từ hôm nay trở đi", () => {
    assert.equal(todayInputDate(now), "2026-11-24");
    assert.equal(isDelegationDateValid("2026-11-24", now), true);
    assert.equal(isDelegationDateValid("2026-12-01", now), true);
    assert.equal(isDelegationDateValid("2026-11-23", now), false);
    assert.equal(isDelegationDateValid("", now), false);
    assert.equal(isDelegationDateValid("24/11/2026", now), false);
  });
  it("dayFromInput không lệch múi giờ; chuỗi lạ giữ nguyên", () => {
    assert.equal(dayFromInput("2026-12-01"), "01/12/2026");
    assert.equal(dayFromInput("abc"), "abc");
  });
  it("parseAmount chỉ nhận số dương", () => {
    assert.equal(parseAmount("50000000"), 50000000);
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("0"), null);
    assert.equal(parseAmount("-5"), null);
    assert.equal(parseAmount("abc"), null);
    assert.equal(parseAmount(undefined), null);
  });
  it("formatVnd có dấu chấm hàng nghìn", () => {
    assert.equal(formatVnd(50000000), "50.000.000 ₫");
    assert.equal(formatVnd(999), "999 ₫");
    assert.equal(formatVnd(1500.4), "1.500 ₫");
  });
});

describe("biểu mẫu ủy quyền: còn thiếu gì", () => {
  const now = new Date(2026, 10, 24, 9, 30, 0);
  it("thiếu lý do trước, rồi hạn mức (chỉ nhóm tài chính), rồi ngày", () => {
    assert.deepEqual(delegationIssues({ financial: false }, now), ["reason", "expires"]);
    assert.deepEqual(delegationIssues({ financial: true }, now), ["reason", "amount", "expires"]);
  });
  it("đủ thì không còn gì; ngày quá khứ báo riêng", () => {
    assert.deepEqual(delegationIssues({ reason: "Vắng 2 tuần", expires: "2026-12-01", financial: false }, now), []);
    assert.deepEqual(delegationIssues({ reason: "Vắng", amount: "1000000", expires: "2026-12-01", financial: true }, now), []);
    assert.deepEqual(delegationIssues({ reason: "Vắng", expires: "2026-11-01", financial: false }, now), ["expiresPast"]);
    assert.deepEqual(delegationIssues({ reason: "   ", expires: "2026-12-01", financial: false }, now), ["reason"]);
  });
  it("plainMessage bỏ dạng thô", () => {
    assert.equal(plainMessage("HTTP 422", "Lỗi chung"), "Lỗi chung");
    assert.equal(plainMessage("error", "Lỗi chung"), "Lỗi chung");
    assert.equal(plainMessage("Ngày hết hạn phải ở tương lai", "Lỗi chung"), "Ngày hết hạn phải ở tương lai");
    assert.equal(plainMessage(new Error("HTTP 500"), "Lỗi chung"), "Lỗi chung");
    assert.equal(plainMessage(undefined, "Lỗi chung"), "Lỗi chung");
  });
});

describe("trang Cài đặt điều hành: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/OperatingModel.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("tiêu đề là h2 có «?» (không còn h1 + dòng phụ riêng cho trang cài đặt)", () => {
    assert.ok(page.includes("data-om-settings-title"));
    assert.ok(page.includes("{t.tabs.operatingSettings}<InfoHint wide>{om.settingsSubtitle}</InfoHint>"));
    assert.ok(!page.includes('{view === "settings" ? t.tabs.operatingSettings : om.title}'));
  });
  it("mô tả dài chuyển sau «?» (chế độ tự động, ủy quyền)", () => {
    assert.ok(page.includes("<InfoHint wide>{om.automationModeDesc}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{om.delegationDesc}</InfoHint>"));
    assert.ok(!page.includes("{om.automationModeDesc}</p>"));
    assert.ok(!page.includes("{om.delegationDesc}</p>"));
  });
  it("ý nghĩa mức tự động hiện thẳng; bảng bậc rủi ro gập; có dải «chưa lưu» + Bỏ thay đổi", () => {
    assert.ok(page.includes("data-om-automation-mode-meaning"));
    assert.ok(page.includes('<FoldSection title={om.orgChangeTierLegendTitle}'));
    assert.ok(page.includes("data-om-automation-unsaved"));
    assert.ok(page.includes("data-om-automation-discard"));
  });
  it("biểu mẫu ủy quyền gập sẵn, mở bằng «Tạo ủy quyền…»", () => {
    assert.ok(page.includes("data-om-delegation-open"));
    assert.ok(page.includes("{delegateOpen[category] && ("));
    assert.ok(page.includes("data-om-delegation-fields"));
  });
  it("kiểm đủ TRƯỚC hộp xác nhận; nút chỉ sáng khi đủ; có dòng nói còn thiếu gì", () => {
    const iss = page.indexOf("const issues = issuesFor(category);");
    const dlg = page.indexOf("om.delegationConfirmGrant(");
    assert.ok(iss > 0 && dlg > iss, "kiểm trước, hỏi sau");
    assert.ok(page.includes("disabled={isSaving || issuesFor(category).length > 0}"));
    assert.ok(page.includes("data-om-delegation-missing"));
    assert.ok(page.includes("min={todayInputDate()}"));
    assert.ok(page.includes("data-om-delegation-amount-preview"));
  });
  it("hộp xác nhận dùng tên tiếng Việt, mức rủi ro có nhãn, ngày kiểu Việt, tiền có dấu chấm", () => {
    assert.ok(page.includes("delegationCategoryLabel(category),"));
    assert.ok(page.includes('riskTierQualifiedLabel(t, delegateTier[category] ?? "T0")'));
    assert.ok(page.includes("formatVnd(confirmAmount)"));
    assert.ok(page.includes('dayFromInput(delegateExpires[category] ?? "")'));
    assert.ok(!page.includes("String(confirmAmount)"));
  });
  it("lịch sử ủy quyền: tên tiếng Việt, không còn mã nhóm + 8 ký tự mã", () => {
    assert.ok(page.includes("om.delegationHistoryRow("));
    assert.ok(!page.includes("g.id.slice(0, 8)"));
  });
  it("lỗi không còn (err as Error).message trần; ủy quyền lỗi qua parseDelegationError(err, câu dự phòng)", () => {
    assert.ok(!page.includes("setAutomationError((err as Error).message"));
    assert.ok(!page.includes("om.companyNameError((err as Error).message"));
    assert.ok(page.includes("parseDelegationError(err, om.settingsErrorGeneric)"));
    assert.ok(!page.includes("parseDelegationError(err)"));
  });
  it("chữ mới có trong tiếng Việt", () => {
    for (const k of ["settingsErrorGeneric:", "automationUnsaved:", "automationDiscard:", "delegationOpenForm:", "delegationTierHelp:", "delegationNeedReason:", "delegationNeedAmount:", "delegationExpiresPast:", "delegationHistoryRow:"]) {
      assert.ok(vi.includes(k), k);
    }
    assert.ok(!vi.includes("tối đa ${amount} VND"));
  });
});
