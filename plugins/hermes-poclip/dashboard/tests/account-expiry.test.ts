import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expiryStateOf, daysLeftOf, EXPIRY_CHOICES } from "../src/lib/accountExpiry";

// ── daysLeftOf ────────────────────────────────────────────────────────────────

describe("daysLeftOf", () => {
  it("null expiresAt → null", () => {
    assert.strictEqual(daysLeftOf(null), null);
    assert.strictEqual(daysLeftOf(undefined), null);
  });

  it("hết hạn hôm nay → 0 hoặc âm", () => {
    const now = new Date();
    const expired = new Date(now.getTime() - 1000).toISOString();
    const v = daysLeftOf(expired, now);
    assert.ok(v !== null && v <= 0, `expected <=0 got ${v}`);
  });

  it("hết hạn sau 5 ngày → 5", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 5 * 86400000 + 60000).toISOString();
    const v = daysLeftOf(future, now);
    assert.strictEqual(v, 5);
  });

  it("hết hạn sau 90 ngày → 90", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 90 * 86400000 + 60000).toISOString();
    const v = daysLeftOf(future, now);
    assert.strictEqual(v, 90);
  });
});

// ── expiryStateOf ─────────────────────────────────────────────────────────────

describe("expiryStateOf — none", () => {
  it("không có expires_at → none", () => {
    assert.strictEqual(expiryStateOf({}), "none");
    assert.strictEqual(expiryStateOf({ expires_at: null }), "none");
  });
});

describe("expiryStateOf — active", () => {
  it("còn >7 ngày → active", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 86400000 + 60000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: future, days_left: 30 }), "active");
  });
});

describe("expiryStateOf — expiring", () => {
  it("còn 5 ngày → expiring", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 5 * 86400000 + 60000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: future, days_left: 5 }), "expiring");
  });

  it("còn 0 ngày → expiring (borderline)", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: future, days_left: 0 }), "expiring");
  });
});

describe("expiryStateOf — expired", () => {
  it("days_left < 0 → expired", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: past, days_left: -1 }), "expired");
  });

  it("lock_reason === expired → expired", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: future, lock_reason: "expired", days_left: 10 }), "expired");
  });

  it("is_expired = true → expired", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    assert.strictEqual(expiryStateOf({ expires_at: future, is_expired: true, days_left: 10 }), "expired");
  });
});

// ── EXPIRY_CHOICES ────────────────────────────────────────────────────────────

describe("EXPIRY_CHOICES", () => {
  it("chứa 30, 90, 365", () => {
    assert.deepStrictEqual([...EXPIRY_CHOICES], [30, 90, 365]);
  });
});
