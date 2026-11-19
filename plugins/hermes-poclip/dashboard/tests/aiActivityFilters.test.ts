import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emptyAiLogFilters,
  buildAiLogQuery,
  formatTokenCount,
  kindOptions,
  clampPreview,
  roleLabelKey,
  auditActionLabel,
  PAGE_SIZE_OPTIONS,
  clampPage,
  pageRange,
  collapseText,
} from "../src/lib/aiActivityFilters";

// ── emptyAiLogFilters ─────────────────────────────────────────────────────────

describe("emptyAiLogFilters", () => {
  it("page=1, page_size=25, profile='all', kind='all'", () => {
    const f = emptyAiLogFilters();
    assert.equal(f.page, 1);
    assert.equal(f.page_size, 25);
    assert.equal(f.profile, "all");
    assert.equal(f.kind, "all");
  });

  it("q, from, to là chuỗi rỗng", () => {
    const f = emptyAiLogFilters();
    assert.equal(f.q, "");
    assert.equal(f.from, "");
    assert.equal(f.to, "");
  });
});

// ── buildAiLogQuery ───────────────────────────────────────────────────────────

describe("buildAiLogQuery", () => {
  it("bộ lọc mặc định (all/rỗng) trả chuỗi rỗng", () => {
    const q = buildAiLogQuery(emptyAiLogFilters());
    assert.equal(q, "", `phải rỗng, got: ${q}`);
  });

  it("profile='all' bị bỏ qua", () => {
    const f = { ...emptyAiLogFilters(), profile: "all" };
    const q = buildAiLogQuery(f);
    assert.ok(!q.includes("profile="), "profile=all không được xuất hiện");
  });

  it("profile cụ thể được đưa vào query", () => {
    const f = { ...emptyAiLogFilters(), profile: "agent_sales" };
    const q = buildAiLogQuery(f);
    assert.ok(q.includes("profile=agent_sales"), `phải có profile=agent_sales, got: ${q}`);
  });

  it("kind='all' bị bỏ qua", () => {
    const f = { ...emptyAiLogFilters(), kind: "all" };
    const q = buildAiLogQuery(f);
    assert.ok(!q.includes("kind="), "kind=all không được xuất hiện");
  });

  it("kind cụ thể được đưa vào query", () => {
    const f = { ...emptyAiLogFilters(), kind: "tool_call" };
    const q = buildAiLogQuery(f);
    assert.ok(q.includes("kind=tool_call"), `phải có kind=tool_call, got: ${q}`);
  });

  it("q rỗng bị bỏ qua; q có giá trị được encode", () => {
    const f1 = { ...emptyAiLogFilters(), q: "" };
    assert.ok(!buildAiLogQuery(f1).includes("q="), "q rỗng không xuất hiện");

    const f2 = { ...emptyAiLogFilters(), q: "  " };
    assert.ok(!buildAiLogQuery(f2).includes("q="), "q khoảng trắng không xuất hiện");

    const f3 = { ...emptyAiLogFilters(), q: "hello world" };
    const q3 = buildAiLogQuery(f3);
    assert.ok(q3.includes("q="), `phải có q=, got: ${q3}`);
    assert.ok(!q3.includes("hello world"), "phải encode ký tự khoảng trắng");
  });

  it("from/to được đưa vào query", () => {
    const f = { ...emptyAiLogFilters(), from: "2026-10-01T00:00", to: "2026-10-07T23:59" };
    const q = buildAiLogQuery(f);
    assert.ok(q.includes("from="), "phải có from");
    assert.ok(q.includes("to="), "phải có to");
  });

  it("page=1 bị bỏ qua; page>1 được đưa vào", () => {
    const f1 = { ...emptyAiLogFilters(), page: 1 };
    assert.ok(!buildAiLogQuery(f1).includes("page="), "page=1 không cần thiết");

    const f2 = { ...emptyAiLogFilters(), page: 3 };
    assert.ok(buildAiLogQuery(f2).includes("page=3"), "page=3 phải xuất hiện");
  });

  it("page_size=25 bị bỏ qua; page_size khác được đưa vào", () => {
    const f1 = emptyAiLogFilters();
    assert.ok(!buildAiLogQuery(f1).includes("page_size="), "page_size=25 không cần thiết");

    const f2 = { ...emptyAiLogFilters(), page_size: 50 };
    assert.ok(buildAiLogQuery(f2).includes("page_size=50"));
  });
});

// ── formatTokenCount ──────────────────────────────────────────────────────────

describe("formatTokenCount", () => {
  it("null/undefined → '0'", () => {
    assert.equal(formatTokenCount(null), "0");
    assert.equal(formatTokenCount(undefined), "0");
  });

  it("0 → '0'", () => {
    assert.equal(formatTokenCount(0), "0");
  });

  it("999 → '999'", () => {
    assert.equal(formatTokenCount(999), "999");
  });

  it("1000 → '1k'", () => {
    assert.equal(formatTokenCount(1000), "1k");
  });

  it("12345 → '12.3k'", () => {
    assert.equal(formatTokenCount(12345), "12.3k");
  });

  it("1500 → '1.5k'", () => {
    assert.equal(formatTokenCount(1500), "1.5k");
  });

  it("100000 → '100k'", () => {
    assert.equal(formatTokenCount(100000), "100k");
  });
});

// ── kindOptions ───────────────────────────────────────────────────────────────

describe("kindOptions", () => {
  const mockT = {
    kindAll: "Tất cả",
    kindMessage: "Tin nhắn",
    kindToolCall: "Tool call",
    kindError: "Lỗi",
  };

  it("trả đúng 4 tùy chọn", () => {
    const opts = kindOptions(mockT);
    assert.equal(opts.length, 4);
  });

  it("value đầu tiên là 'all'", () => {
    const opts = kindOptions(mockT);
    assert.equal(opts[0].value, "all");
    assert.equal(opts[0].label, "Tất cả");
  });

  it("các value: all, message, tool_call, error", () => {
    const opts = kindOptions(mockT);
    const values = opts.map((o) => o.value);
    assert.deepEqual(values, ["all", "message", "tool_call", "error"]);
  });

  it("label dùng đúng nhãn từ t", () => {
    const opts = kindOptions(mockT);
    assert.equal(opts.find((o) => o.value === "tool_call")!.label, "Tool call");
    assert.equal(opts.find((o) => o.value === "error")!.label, "Lỗi");
  });
});

// ── clampPreview ──────────────────────────────────────────────────────────────

describe("clampPreview", () => {
  it("null/undefined → chuỗi rỗng", () => {
    assert.equal(clampPreview(null, 100), "");
    assert.equal(clampPreview(undefined, 100), "");
  });

  it("chuỗi ngắn hơn max → giữ nguyên", () => {
    assert.equal(clampPreview("hello", 10), "hello");
  });

  it("chuỗi bằng max → giữ nguyên (không thêm …)", () => {
    assert.equal(clampPreview("hello", 5), "hello");
  });

  it("chuỗi dài hơn max → cắt + thêm …", () => {
    const result = clampPreview("hello world", 5);
    assert.equal(result, "hello…");
  });

  it("max=0 → chuỗi rỗng + …", () => {
    const result = clampPreview("abc", 0);
    assert.equal(result, "…");
  });

  it("chuỗi dài 200 ký tự, max=100 → cắt đúng chỗ", () => {
    const long = "a".repeat(200);
    const result = clampPreview(long, 100);
    assert.equal(result.length, 101); // 100 chars + "…"
    assert.ok(result.endsWith("…"));
  });
});

// ── roleLabelKey ──────────────────────────────────────────────────────────────

describe("roleLabelKey", () => {
  it("'user' → 'roleUser'", () => {
    assert.equal(roleLabelKey("user"), "roleUser");
  });

  it("'assistant' → 'roleAssistant'", () => {
    assert.equal(roleLabelKey("assistant"), "roleAssistant");
  });

  it("'system' → 'roleSystem'", () => {
    assert.equal(roleLabelKey("system"), "roleSystem");
  });

  it("'tool' → 'roleTool'", () => {
    assert.equal(roleLabelKey("tool"), "roleTool");
  });

  it("role lạ → null", () => {
    assert.equal(roleLabelKey("tool_calls"), null);
    assert.equal(roleLabelKey("unknown_role"), null);
  });

  it("null/undefined → null", () => {
    assert.equal(roleLabelKey(null), null);
    assert.equal(roleLabelKey(undefined), null);
  });
});

// ── auditActionLabel ──────────────────────────────────────────────────────────

describe("auditActionLabel", () => {
  it("locale vi → nhãn tiếng Việt", () => {
    assert.equal(auditActionLabel("view_sessions", "vi"), "Xem danh sách phiên");
    assert.equal(auditActionLabel("view_turns", "vi"), "Xem chi tiết phiên");
    assert.equal(auditActionLabel("search", "vi"), "Tìm kiếm");
    assert.equal(auditActionLabel("export", "vi"), "Xuất tệp");
    assert.equal(auditActionLabel("view_exchanges", "vi"), "Xem trao đổi");
    assert.equal(auditActionLabel("view_audit", "vi"), "Xem vết kiểm toán");
    assert.equal(auditActionLabel("deny", "vi"), "Bị từ chối");
    assert.equal(auditActionLabel("grant", "vi"), "Cấp quyền");
    assert.equal(auditActionLabel("view_profiles", "vi"), "Xem danh sách hồ sơ");
  });

  it("locale en → trả lại chính mã", () => {
    assert.equal(auditActionLabel("view_sessions", "en"), "view_sessions");
    assert.equal(auditActionLabel("export", "en"), "export");
    assert.equal(auditActionLabel("deny", "en"), "deny");
  });

  it("mã lạ (vi) → trả lại chính mã", () => {
    assert.equal(auditActionLabel("unknown_action", "vi"), "unknown_action");
  });

  it("mã lạ (en) → trả lại chính mã", () => {
    assert.equal(auditActionLabel("unknown_action", "en"), "unknown_action");
  });

  it("null/undefined → chuỗi rỗng", () => {
    assert.equal(auditActionLabel(null, "vi"), "");
    assert.equal(auditActionLabel(undefined, "en"), "");
  });
});

// ── Phân trang & rút gọn ─────────────────────────────────────

describe("PAGE_SIZE_OPTIONS", () => {
  it("các lựa chọn nằm trong giới hạn API (≤ 100) và tăng dần", () => {
    const o = [...PAGE_SIZE_OPTIONS];
    assert.ok(o.every((n) => n >= 1 && n <= 100));
    assert.deepEqual(o, [...o].sort((a, b) => a - b));
  });
});

describe("clampPage", () => {
  it("trong khoảng → giữ nguyên", () => assert.equal(clampPage(3, 10), 3));
  it("quá lớn → trang cuối", () => assert.equal(clampPage(99, 10), 10));
  it("nhỏ hơn 1 / không phải số → 1", () => {
    assert.equal(clampPage(0, 10), 1);
    assert.equal(clampPage(-4, 10), 1);
    assert.equal(clampPage(Number.NaN, 10), 1);
  });
  it("số thập phân → làm tròn xuống", () => assert.equal(clampPage(2.9, 10), 2));
  it("pages=0 (chưa có dữ liệu) → không cắt trên", () => assert.equal(clampPage(5, 0), 5));
});

describe("pageRange", () => {
  it("trang đầu", () => assert.deepEqual(pageRange(1, 25, 100), { from: 1, to: 25 }));
  it("trang giữa", () => assert.deepEqual(pageRange(3, 25, 100), { from: 51, to: 75 }));
  it("trang cuối lẻ", () => assert.deepEqual(pageRange(5, 25, 101), { from: 101, to: 101 }));
  it("ít hơn một trang", () => assert.deepEqual(pageRange(1, 25, 7), { from: 1, to: 7 }));
  it("không có bản ghi → 0–0", () => assert.deepEqual(pageRange(1, 25, 0), { from: 0, to: 0 }));
});

describe("collapseText", () => {
  it("ngắn → không rút gọn", () => {
    assert.deepEqual(collapseText("xin chào"), { text: "xin chào", collapsed: false });
  });
  it("rỗng/null → rỗng, không rút gọn", () => {
    assert.deepEqual(collapseText(null), { text: "", collapsed: false });
    assert.deepEqual(collapseText(""), { text: "", collapsed: false });
  });
  it("nhiều dòng → cắt theo số dòng", () => {
    const text = Array.from({ length: 30 }, (_, i) => `dòng ${i + 1}`).join("\n");
    const r = collapseText(text, 5000, 14);
    assert.equal(r.collapsed, true);
    assert.equal(r.text.split("\n").length, 14);
  });
  it("một dòng rất dài → cắt theo số ký tự", () => {
    const r = collapseText("x".repeat(5000), 1200, 14);
    assert.equal(r.collapsed, true);
    assert.equal(r.text.length, 1200);
  });
  it("đúng ngưỡng → không cắt", () => {
    const r = collapseText("y".repeat(1200), 1200, 14);
    assert.equal(r.collapsed, false);
  });
});
