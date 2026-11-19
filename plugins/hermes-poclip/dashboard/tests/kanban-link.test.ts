import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  kanbanLinkOf,
  buildTaskIdsQuery,
  kanbanShortCode,
  type KanbanLink,
} from "../src/lib/kanban-link";

// ── kanbanLinkOf ───────────────────────────────────────────────────────────────

describe("kanbanLinkOf", () => {
  it("trả KanbanLink khi đủ 4 trường", () => {
    const rec = {
      task_id: "t_abc123",
      kanban_task_id: "t_k001",
      kanban_board: "vortoxai-san-pham",
      kanban_url: "/kanban?board=vortoxai-san-pham&task=t_k001",
    };
    const link = kanbanLinkOf(rec);
    assert.ok(link !== null);
    assert.strictEqual(link!.task_id, "t_abc123");
    assert.strictEqual(link!.kanban_task_id, "t_k001");
    assert.strictEqual(link!.kanban_board, "vortoxai-san-pham");
    assert.strictEqual(link!.kanban_url, "/kanban?board=vortoxai-san-pham&task=t_k001");
  });

  it("trả null khi kanban_task_id rỗng", () => {
    assert.strictEqual(kanbanLinkOf({ task_id: "t_abc", kanban_task_id: "", kanban_board: "b", kanban_url: "/kanban" }), null);
  });

  it("trả null khi kanban_board thiếu", () => {
    assert.strictEqual(kanbanLinkOf({ task_id: "t_abc", kanban_task_id: "t_k1", kanban_url: "/kanban" }), null);
  });

  it("trả null khi kanban_url thiếu", () => {
    assert.strictEqual(kanbanLinkOf({ task_id: "t_abc", kanban_task_id: "t_k1", kanban_board: "b" }), null);
  });

  it("trả null khi task_id thiếu", () => {
    assert.strictEqual(kanbanLinkOf({ kanban_task_id: "t_k1", kanban_board: "b", kanban_url: "/kanban" }), null);
  });

  it("trả null khi rec là null", () => {
    assert.strictEqual(kanbanLinkOf(null), null);
  });

  it("trả null khi rec là undefined", () => {
    assert.strictEqual(kanbanLinkOf(undefined), null);
  });

  it("trả null khi record có trường số thay vì chuỗi", () => {
    // task_id phải là truthy string
    assert.strictEqual(
      kanbanLinkOf({ task_id: 0 as any, kanban_task_id: "t_k1", kanban_board: "b", kanban_url: "/k" }),
      null,
    );
  });
});

// ── buildTaskIdsQuery ──────────────────────────────────────────────────────────

describe("buildTaskIdsQuery", () => {
  it("nối các id bằng dấu phẩy", () => {
    assert.strictEqual(buildTaskIdsQuery(["t_a", "t_b", "t_c"]), "t_a,t_b,t_c");
  });

  it("khử trùng giữ thứ tự xuất hiện đầu tiên", () => {
    assert.strictEqual(buildTaskIdsQuery(["t_a", "t_b", "t_a", "t_c"]), "t_a,t_b,t_c");
  });

  it("cắt còn max phần tử (mặc định 200)", () => {
    const ids = Array.from({ length: 205 }, (_, i) => `t_${i}`);
    const result = buildTaskIdsQuery(ids);
    const parts = result.split(",");
    assert.strictEqual(parts.length, 200);
    assert.strictEqual(parts[0], "t_0");
    assert.strictEqual(parts[199], "t_199");
  });

  it("tôn trọng tham số max tuỳ chỉnh", () => {
    const ids = ["t_a", "t_b", "t_c", "t_d"];
    const result = buildTaskIdsQuery(ids, 2);
    assert.strictEqual(result, "t_a,t_b");
  });

  it("trả chuỗi rỗng khi mảng rỗng", () => {
    assert.strictEqual(buildTaskIdsQuery([]), "");
  });

  it("không cắt khi số lượng chính xác bằng max", () => {
    const ids = ["t_a", "t_b"];
    assert.strictEqual(buildTaskIdsQuery(ids, 2), "t_a,t_b");
  });
});

// ── kanbanShortCode ────────────────────────────────────────────────────────────

describe("kanbanShortCode", () => {
  it("giữ nguyên id ngắn hơn hoặc bằng 18 ký tự", () => {
    assert.strictEqual(kanbanShortCode("t_7859fc3e"), "t_7859fc3e");
    assert.strictEqual(kanbanShortCode("t_123456789012345"), "t_123456789012345"); // 17 chars
    assert.strictEqual(kanbanShortCode("t_1234567890123456"), "t_1234567890123456"); // 18 chars
  });

  it("rút gọn id dài hơn 18 ký tự, tổng <= 18 ký tự", () => {
    const long = "t_abcdefghijklmnopqrstuvwxyz"; // 28 chars
    const result = kanbanShortCode(long);
    assert.ok(result.includes("…"), "phải chứa dấu …");
    assert.ok(result.length <= 18, `độ dài phải <= 18, nhưng nhận ${result.length}`);
  });

  it("phần đầu và đuôi vẫn đọc được sau rút gọn", () => {
    const long = "t_abcdefghijklmnopqrstuvwxyz";
    const result = kanbanShortCode(long);
    assert.ok(result.startsWith("t_abcdefg"), "phần đầu phải khớp");
    assert.ok(result.endsWith("stuvwxyz"), "phần đuôi phải khớp");
  });

  it("id đúng 19 ký tự cũng được rút gọn", () => {
    const id19 = "t_abcdefghijklmnop"; // 18 chars
    assert.strictEqual(kanbanShortCode(id19), id19); // 18 = limit, not truncated
    const id19b = "t_abcdefghijklmnopq"; // 19 chars
    const r = kanbanShortCode(id19b);
    assert.ok(r.includes("…"));
    assert.ok(r.length <= 18);
  });
});
