import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emptyFilters,
  buildAuditQuery,
  isFiltered,
  mergeBeforeAfter,
  pretty,
  localDayStartUtcIso,
  localDayEndExclusiveUtcIso,
  AUDIT_SOURCES,
  AUDIT_ACTIONS,
} from "../src/lib/auditTrailFilters";

// ── emptyFilters ──────────────────────────────────────────────────────────────

describe("emptyFilters", () => {
  it("trả object với page=1, page_size=20, company_id='default'", () => {
    const f = emptyFilters();
    assert.equal(f.page, 1);
    assert.equal(f.page_size, 20);
    assert.equal(f.company_id, "default");
  });

  it("tất cả trường text là chuỗi rỗng", () => {
    const f = emptyFilters();
    for (const k of ["from", "to", "source", "entity", "actor", "action", "q"] as const) {
      assert.equal(f[k], "", `field ${k} should be empty string`);
    }
  });
});

// ── buildAuditQuery ───────────────────────────────────────────────────────────

describe("buildAuditQuery", () => {
  it("bộ lọc mặc định chỉ có company_id", () => {
    const q = buildAuditQuery(emptyFilters());
    assert.ok(q.includes("company_id=default"), "phải có company_id=default");
    assert.ok(!q.includes("from="), "from rỗng không xuất hiện");
    assert.ok(!q.includes("to="), "to rỗng không xuất hiện");
  });

  it("luôn có company_id trong query", () => {
    const f = emptyFilters();
    f.company_id = "acme";
    const q = buildAuditQuery(f);
    assert.ok(q.includes("company_id=acme"));
  });

  it("bỏ tham số rỗng", () => {
    const f = emptyFilters();
    f.from = "";
    f.actor = "";
    const q = buildAuditQuery(f);
    assert.ok(!q.includes("from="));
    assert.ok(!q.includes("actor="));
  });

  it("encodeURIComponent cho ký tự đặc biệt", () => {
    const f = emptyFilters();
    f.q = "test với dấu";
    const q = buildAuditQuery(f);
    assert.ok(q.includes("q=test%20v%E1%BB%9Bi%20d%E1%BA%A5u") ||
              q.includes("q=test+v"), "phải encode ký tự đặc biệt");
  });

  it("bỏ page=1 (mặc định), giữ page khác 1", () => {
    const f = { ...emptyFilters(), page: 1 };
    const q1 = buildAuditQuery(f);
    assert.ok(!q1.includes("page="), "page=1 không cần thiết");

    const f2 = { ...emptyFilters(), page: 3 };
    const q2 = buildAuditQuery(f2);
    assert.ok(q2.includes("page=3"));
  });

  it("bỏ page_size=20 (mặc định), giữ page_size khác 20", () => {
    const f = emptyFilters();
    const q1 = buildAuditQuery(f);
    assert.ok(!q1.includes("page_size="), "page_size=20 không cần thiết");

    const f2 = { ...emptyFilters(), page_size: 50 };
    const q2 = buildAuditQuery(f2);
    assert.ok(q2.includes("page_size=50"));
  });
});

// ── isFiltered ────────────────────────────────────────────────────────────────

describe("isFiltered", () => {
  it("bộ lọc mặc định → false", () => {
    assert.equal(isFiltered(emptyFilters()), false);
  });

  it("có from → true", () => {
    const f = { ...emptyFilters(), from: "2026-09-01" };
    assert.equal(isFiltered(f), true);
  });

  it("có source → true", () => {
    const f = { ...emptyFilters(), source: "config" };
    assert.equal(isFiltered(f), true);
  });

  it("có q → true", () => {
    const f = { ...emptyFilters(), q: "test" };
    assert.equal(isFiltered(f), true);
  });

  it("page và page_size không ảnh hưởng isFiltered", () => {
    const f = { ...emptyFilters(), page: 3, page_size: 50 };
    assert.equal(isFiltered(f), false);
  });
});

// ── mergeBeforeAfter ──────────────────────────────────────────────────────────

describe("mergeBeforeAfter", () => {
  it("hợp khoá của 2 object thành bảng so sánh", () => {
    const result = mergeBeforeAfter({ a: 1, b: 2 }, { a: 10, c: 30 });
    const keys = result.map((r) => r.key).sort();
    assert.deepEqual(keys, ["a", "b", "c"]);
    const a = result.find((r) => r.key === "a")!;
    assert.equal(a.before, 1);
    assert.equal(a.after, 10);
    const b = result.find((r) => r.key === "b")!;
    assert.equal(b.before, 2);
    assert.equal(b.after, null);
    const c = result.find((r) => r.key === "c")!;
    assert.equal(c.before, null);
    assert.equal(c.after, 30);
  });

  it("khoá chỉ có 1 bên → bên kia là null", () => {
    const result = mergeBeforeAfter({ x: "old" }, { y: "new" });
    const x = result.find((r) => r.key === "x")!;
    assert.equal(x.before, "old");
    assert.equal(x.after, null);
    const y = result.find((r) => r.key === "y")!;
    assert.equal(y.before, null);
    assert.equal(y.after, "new");
  });

  it("không phải object (null) → trả []", () => {
    assert.deepEqual(mergeBeforeAfter(null, { a: 1 }), []);
    assert.deepEqual(mergeBeforeAfter({ a: 1 }, null), []);
    assert.deepEqual(mergeBeforeAfter(null, null), []);
  });

  it("mảng → trả []", () => {
    assert.deepEqual(mergeBeforeAfter([1, 2], { a: 1 }), []);
    assert.deepEqual(mergeBeforeAfter({ a: 1 }, [1, 2]), []);
  });

  it("string/number → trả []", () => {
    assert.deepEqual(mergeBeforeAfter("string", { a: 1 }), []);
    assert.deepEqual(mergeBeforeAfter(42, { a: 1 }), []);
  });
});

// ── pretty ────────────────────────────────────────────────────────────────────

describe("pretty", () => {
  it("null/undefined → chuỗi rỗng", () => {
    assert.equal(pretty(null), "");
    assert.equal(pretty(undefined), "");
  });

  it("object → JSON.stringify indent 2", () => {
    const result = pretty({ a: 1, b: "x" });
    const parsed = JSON.parse(result);
    assert.deepEqual(parsed, { a: 1, b: "x" });
    assert.ok(result.includes("\n"), "phải có newline (indent 2)");
  });

  it("chuỗi → giữ nguyên chuỗi", () => {
    assert.equal(pretty("hello"), "hello");
  });

  it("số → chuỗi số", () => {
    assert.equal(pretty(42), "42");
  });
});

// ── localDayStartUtcIso / localDayEndExclusiveUtcIso ──────────────────────────

describe("localDayStartUtcIso", () => {
  it("2026-10-01 → 2026-09-30T17:00:00.000Z (chuẩn VN UTC+7)", () => {
    assert.equal(localDayStartUtcIso("2026-10-01"), "2026-09-30T17:00:00.000Z");
  });

  it("input rỗng → chuỗi rỗng", () => {
    assert.equal(localDayStartUtcIso(""), "");
  });

  it("input không hợp lệ → chuỗi rỗng", () => {
    assert.equal(localDayStartUtcIso("not-a-date"), "");
    assert.equal(localDayStartUtcIso("2026-13-01"), "");
  });
});

describe("localDayEndExclusiveUtcIso", () => {
  it("2026-10-01 → 2026-10-01T17:00:00.000Z (00:00 VN ngày kế tiếp)", () => {
    assert.equal(localDayEndExclusiveUtcIso("2026-10-01"), "2026-10-01T17:00:00.000Z");
  });

  it("input rỗng → chuỗi rỗng", () => {
    assert.equal(localDayEndExclusiveUtcIso(""), "");
  });

  it("input không hợp lệ → chuỗi rỗng", () => {
    assert.equal(localDayEndExclusiveUtcIso("not-a-date"), "");
  });
});

describe("múi giờ: dòng at so sánh với boundary to/from", () => {
  // at = 2026-10-01T23:59:00.000Z → hiển thị 06:59 02/10/2026 giờ VN
  const atLate = "2026-10-01T23:59:00.000Z";

  it("at='2026-10-01T23:59:00.000Z' BỊ LOẠI khi to='2026-10-01' (exclusive end = 2026-10-01T17:00:00.000Z)", () => {
    const end = localDayEndExclusiveUtcIso("2026-10-01");
    // atLate > end → dòng này nằm ngoài phạm vi lọc
    assert.ok(atLate > end, `${atLate} phải > ${end}`);
  });

  it("at='2026-10-01T23:59:00.000Z' ĐƯỢC NHẬN khi from='2026-10-02' (start = 2026-10-01T17:00:00.000Z)", () => {
    const start = localDayStartUtcIso("2026-10-02");
    // atLate >= start → dòng này nằm trong phạm vi lọc
    assert.ok(atLate >= start, `${atLate} phải >= ${start}`);
  });
});

describe("buildAuditQuery chuyển đổi múi giờ", () => {
  it("from='2026-10-01' gửi ISO UTC VN thay vì chuỗi YYYY-MM-DD", () => {
    const f = { ...emptyFilters(), from: "2026-10-01" };
    const q = buildAuditQuery(f);
    assert.ok(q.includes("from="), "phải có from");
    assert.ok(q.includes("2026-09-30T17"), "phải encode thành UTC VN (2026-09-30T17...)");
    assert.ok(!q.includes("from=2026-10-01"), "KHÔNG được gửi nguyên chuỗi YYYY-MM-DD");
  });

  it("to='2026-10-01' gửi ISO UTC VN exclusive end", () => {
    const f = { ...emptyFilters(), to: "2026-10-01" };
    const q = buildAuditQuery(f);
    assert.ok(q.includes("to="), "phải có to");
    assert.ok(q.includes("2026-10-01T17"), "phải encode thành UTC VN ngày kế tiếp (2026-10-01T17...)");
  });
});

// ── AUDIT_SOURCES và AUDIT_ACTIONS ────────────────────────────────────────────

describe("AUDIT_SOURCES và AUDIT_ACTIONS", () => {
  it("AUDIT_SOURCES có đúng 8 nguồn", () => {
    assert.equal(AUDIT_SOURCES.length, 8);
  });

  it("AUDIT_SOURCES có đủ các key bắt buộc", () => {
    const keys = AUDIT_SOURCES.map((s) => s.key);
    for (const k of ["policy", "goal", "config", "approval", "comm", "reconcile", "customer", "digest"]) {
      assert.ok(keys.includes(k as any), `thiếu source: ${k}`);
    }
  });

  it("AUDIT_ACTIONS có đúng 6 hành động", () => {
    assert.equal(AUDIT_ACTIONS.length, 6);
    const expected = ["create", "update", "delete", "approve", "reject", "other"];
    for (const a of expected) {
      assert.ok(AUDIT_ACTIONS.includes(a as any), `thiếu action: ${a}`);
    }
  });
});
