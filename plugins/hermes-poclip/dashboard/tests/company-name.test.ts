import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCompanyName,
  companyNameError,
  companyBrandTitle,
  COMPANY_NAME_MAX,
} from "../src/lib/company-name";

const MSGS = { empty: "Tên không được rỗng.", tooLong: "Quá dài." };

// ── normalizeCompanyName ──────────────────────────────────────────────────────

describe("normalizeCompanyName", () => {
  it("cắt khoảng trắng đầu/cuối", () => {
    assert.equal(normalizeCompanyName("  Acme  "), "Acme");
  });

  it("gộp khoảng trắng giữa", () => {
    assert.equal(normalizeCompanyName("Acme  Corp   Ltd"), "Acme Corp Ltd");
  });

  it("chuỗi rỗng → rỗng", () => {
    assert.equal(normalizeCompanyName(""), "");
  });

  it("chỉ khoảng trắng → rỗng", () => {
    assert.equal(normalizeCompanyName("   "), "");
  });
});

// ── companyNameError ──────────────────────────────────────────────────────────

describe("companyNameError", () => {
  it("rỗng → thông báo empty", () => {
    assert.equal(companyNameError("", MSGS), MSGS.empty);
  });

  it("chỉ khoảng trắng → thông báo empty", () => {
    assert.equal(companyNameError("   ", MSGS), MSGS.empty);
  });

  it("tên 121 ký tự → thông báo tooLong", () => {
    const long = "A".repeat(COMPANY_NAME_MAX + 1);
    assert.equal(companyNameError(long, MSGS), MSGS.tooLong);
  });

  it("tên đúng 120 ký tự → null (hợp lệ)", () => {
    const exact = "B".repeat(COMPANY_NAME_MAX);
    assert.equal(companyNameError(exact, MSGS), null);
  });

  it("tên bình thường → null (hợp lệ)", () => {
    assert.equal(companyNameError("Hermes SME Studio", MSGS), null);
  });
});

// ── companyBrandTitle ─────────────────────────────────────────────────────────

describe("companyBrandTitle", () => {
  it("tên rỗng → trả về fallback", () => {
    assert.equal(companyBrandTitle("", "Hermes+ - Dashboard"), "Hermes+ - Dashboard");
  });

  it("tên hợp lệ → `<tên> - Dashboard`", () => {
    assert.equal(companyBrandTitle("Acme", "Hermes+ - Dashboard"), "Acme - Dashboard");
  });

  it("tên chỉ khoảng trắng → trả về fallback", () => {
    assert.equal(companyBrandTitle("   ", "Fallback"), "Fallback");
  });
});
