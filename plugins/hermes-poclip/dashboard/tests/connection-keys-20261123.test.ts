import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_SCOPE, auditExpiresAt, auditKind, effectiveStatus, endOfDayIso, expiryIsoFromDays, formatDay,
  friendlyError, isExtendDateValid, minExtendDate, needsSaveConfirm, testReason,
} from "../src/lib/connection-keys";

// Tab «Khoá kết nối» — đợt rà soát 23/11/2026

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

describe("trạng thái khoá hiện cho người dùng", () => {
  const now = new Date(2026, 10, 23, 12, 0, 0).getTime();
  it("khoá quá hạn không còn ghi «đang hoạt động»", () => {
    assert.equal(effectiveStatus({ status: "active", expired: true }, now), "expired");
    assert.equal(effectiveStatus({ status: "active", expires_at: "2026-11-01T00:00:00Z" }, now), "expired");
    assert.equal(effectiveStatus({ status: "paused", expired: true }, now), "expired");
  });
  it("thu hồi luôn thắng; còn hạn thì giữ trạng thái lưu", () => {
    assert.equal(effectiveStatus({ status: "revoked", expired: true }, now), "revoked");
    assert.equal(effectiveStatus({ status: "paused", expired: false }, now), "paused");
    assert.equal(effectiveStatus({ status: "active", expires_at: null }, now), "active");
    assert.equal(effectiveStatus({ status: "active", expires_at: "2099-01-01T00:00:00Z" }, now), "active");
    assert.equal(effectiveStatus({ status: "lạ" }, now), "unknown");
  });
});

describe("mã lý do khi kiểm tra khoá", () => {
  it("nhận cả mã máy chủ trả (ERR-APIKEY-…) lẫn mã cũ", () => {
    assert.equal(testReason("ERR-APIKEY-REVOKED"), "revoked");
    assert.equal(testReason("KEY_REVOKED"), "revoked");
    assert.equal(testReason("ERR-APIKEY-EXPIRED"), "expired");
    assert.equal(testReason("ERR-APIKEY-PAUSED"), "paused");
    assert.equal(testReason("ERR-APIKEY-READONLY"), "readonly");
    assert.equal(testReason("INVALID_API_KEY"), "invalid");
    assert.equal(testReason("gì đó"), null);
    assert.equal(testReason(null), null);
  });
});

describe("ngày gia hạn", () => {
  const now = new Date(2026, 10, 23, 23, 30, 0);
  it("sớm nhất là ngày mai (kể cả cuối tháng)", () => {
    assert.equal(minExtendDate(now), "2026-11-24");
    assert.equal(minExtendDate(new Date(2026, 10, 30, 8, 0, 0)), "2026-12-01");
  });
  it("hôm nay/quá khứ/định dạng lạ không hợp lệ", () => {
    assert.equal(isExtendDateValid("2026-11-23", now), false);
    assert.equal(isExtendDateValid("2026-11-01", now), false);
    assert.equal(isExtendDateValid("2026-11-24", now), true);
    assert.equal(isExtendDateValid("", now), false);
    assert.equal(isExtendDateValid("24/11/2026", now), false);
  });
  it("hạn lấy hết ngày đã chọn (23:59:59 giờ máy)", () => {
    const d = new Date(endOfDayIso("2026-11-24"));
    assert.equal(d.getDate(), 24);
    assert.equal(d.getHours(), 23);
    assert.equal(d.getMinutes(), 59);
  });
  it("hạn theo số ngày: «none» = không hết hạn", () => {
    assert.equal(expiryIsoFromDays("none"), null);
    const base = new Date(2026, 10, 23, 12, 0, 0);
    const iso = expiryIsoFromDays("30", base);
    assert.ok(iso && iso.endsWith("Z"));
    const days = (Date.parse(iso as string) - base.getTime()) / 86400000;
    assert.ok(days > 29 && days < 31);
  });
  it("formatDay kiểu Việt; không đọc được thì «—»", () => {
    assert.equal(formatDay(new Date(2026, 10, 23, 12).toISOString()), "23/11/2026");
    assert.equal(formatDay(null), "—");
    assert.equal(formatDay("abc"), "—");
  });
});

describe("lịch sử thao tác và câu lỗi", () => {
  it("auditKind gom về 6 loại + khác", () => {
    assert.equal(auditKind("create"), "create");
    assert.equal(auditKind("api_key.pause"), "pause");
    assert.equal(auditKind("REVOKE"), "revoke");
    assert.equal(auditKind("lạ"), "other");
    assert.equal(auditKind(null), "other");
  });
  it("auditExpiresAt đọc được chuỗi JSON lẫn đối tượng", () => {
    assert.equal(auditExpiresAt("{\"expires_at\":\"2027-01-01T00:00:00Z\"}"), "2027-01-01T00:00:00Z");
    assert.equal(auditExpiresAt({ expires_at: "2027-01-01T00:00:00Z" }), "2027-01-01T00:00:00Z");
    assert.equal(auditExpiresAt("không phải json"), null);
    assert.equal(auditExpiresAt(null), null);
  });
  it("friendlyError ưu tiên câu của máy chủ, không bao giờ hiện «HTTP 400»/«error» thô", () => {
    assert.equal(friendlyError({ detail: { message_vi: "Tên khoá đã tồn tại." } }, "Lỗi chung"), "Tên khoá đã tồn tại.");
    assert.equal(friendlyError({ body: { detail: { message_vi: "Khoá đã thu hồi." } } }, "Lỗi chung"), "Khoá đã thu hồi.");
    assert.equal(friendlyError({ detail: "HTTP 400" }, "Lỗi chung"), "Lỗi chung");
    assert.equal(friendlyError(new Error("HTTP 409"), "Lỗi chung"), "Lỗi chung");
    assert.equal(friendlyError(new Error("error"), "Lỗi chung"), "Lỗi chung");
    assert.equal(friendlyError(new Error("Không có quyền thực hiện."), "Lỗi chung"), "Không có quyền thực hiện.");
    assert.equal(friendlyError(null, "Lỗi chung"), "Lỗi chung");
  });
  it("đóng khoá mới chưa lưu thì phải hỏi; đã sao chép/tải/gửi thì không", () => {
    assert.equal(needsSaveConfirm({ copied: false, downloaded: false, telegram: false }), true);
    assert.equal(needsSaveConfirm({ copied: true, downloaded: false, telegram: false }), false);
    assert.equal(needsSaveConfirm({ copied: false, downloaded: true, telegram: false }), false);
    assert.equal(needsSaveConfirm({ copied: false, downloaded: false, telegram: true }), false);
  });
  it("quyền mặc định khi tạo khoá là chỉ đọc", () => {
    assert.equal(DEFAULT_SCOPE, "read_only");
  });
});

describe("trang Khoá kết nối: bố cục và chữ", () => {
  const page = fs.readFileSync(findSrc("src/pages/ConnectionKeys.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("tiêu đề có «?»; thứ tự: Tạo khoá → Danh sách → Hướng dẫn gập → Kiểm tra → Lịch sử → Nhập khoá cũ", () => {
    assert.ok(page.includes("{ck.pageTitle}<InfoHint wide>{ck.introHelp}</InfoHint>"));
    const order = ["<CreateBlock", "<KeyListBlock", "<GuideBlock />", "<TestBlock />", 'id="ck-history"', 'id="ck-import"']
      .map((s) => page.lastIndexOf(s));
    for (let i = 1; i < order.length; i++) assert.ok(order[i - 1] < order[i], `thứ tự ${i}`);
    assert.ok(page.includes("<FoldSection title={ck.guideTitle}"));
  });
  it("danh sách là thẻ, trạng thái lấy từ effectiveStatus, nút đỏ chỉ có «Thu hồi»", () => {
    assert.ok(!page.includes("<table"));
    assert.ok(page.includes("effectiveStatus(k)"));
    assert.ok(page.includes("data-ck-key-row"));
    assert.equal((page.match(/pc-btn--danger/g) ?? []).length, 1);
    assert.ok(page.includes("<PagedRows as=\"list\""));
  });
  it("làm mới chung: nhập khoá cũ/tạo/đổi trạng thái tải lại danh sách + lịch sử + khoá cũ; không còn mẹo onNeedRefresh", () => {
    assert.ok(!page.includes("onNeedRefresh"));
    assert.ok(page.includes("onImported={bump}"));
    assert.ok(page.includes("onChanged={bump}"));
    assert.ok(page.includes('"/api/v1/api-keys/env" : null, [refreshToken]'));
  });
  it("quyền mặc định chỉ đọc, cảnh báo «không hết hạn», «?» giải thích quyền", () => {
    assert.ok(page.includes("useState(DEFAULT_SCOPE)"));
    assert.ok(page.includes("data-ck-expiry-warning"));
    assert.ok(page.includes("<InfoHint>{ck.scopeHelp}</InfoHint>"));
  });
  it("gia hạn: chặn ngày quá khứ, hết ngày đã chọn", () => {
    assert.ok(page.includes("min={minExtendDate()}"));
    assert.ok(page.includes("isExtendDateValid(extendDate)"));
    assert.ok(page.includes("endOfDayIso(extendDate)"));
    assert.ok(page.includes("data-ck-extend-invalid"));
  });
  it("khoá mới: nút «Tôi đã lưu khoá» + hỏi lại khi chưa lưu; «?» cho Telegram", () => {
    assert.ok(page.includes("data-ck-saved"));
    assert.ok(page.includes("ck.confirmDismissUnsaved"));
    assert.ok(page.includes("<InfoHint wide>{ck.telegramHint}</InfoHint>"));
    assert.ok(!page.includes("✕ {t.common.cancel}"));
  });
  it("lỗi: luôn qua friendlyError, không còn «error» thô hay err.message trần", () => {
    assert.ok(!page.includes('"error")'));
    assert.ok(!page.includes("err instanceof Error ? err.message"));
    assert.ok((page.match(/friendlyError\(/g) ?? []).length >= 5);
  });
  it("ô dán khoá che ký tự; biểu mẫu hẹp 420px; kiểm tra dùng mã lý do chung", () => {
    assert.equal((page.match(/type="password"/g) ?? []).length >= 3, true);
    assert.ok(page.includes("maxWidth: 420"));
    assert.ok(page.includes("testReason(code)"));
    assert.ok(page.includes("ck.testOkLegacy"));
  });
  it("lịch sử thao tác: tên người thay mã, gập sẵn, Xem thêm", () => {
    assert.ok(page.includes("personLabel(t, row.actor)"));
    assert.ok(page.includes("data-ck-history-more"));
    assert.ok(page.includes("api-keys/audit?limit=200"));
  });
  it("chữ mới có trong tiếng Việt", () => {
    for (const k of ["introHelp:", "scopeHelp:", "expiryNoneWarning:", "btnSaved:", "confirmDismissUnsaved:", "telegramHint:", "errExtendPast:", "historyTitle:", "historyHelp:", "testHelp:", "importHelp:", "guideFoldSummary:"]) {
      assert.ok(vi.includes(k), k);
    }
  });
});
