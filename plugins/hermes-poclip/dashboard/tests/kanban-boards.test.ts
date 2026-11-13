import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isDefaultBoard,
  proposalSummary,
  boardRows,
  skippedRows,
  proposalHeadline,
  unwrapKanbanProposal,
  type KanbanProposal,
} from "../src/lib/kanban-boards";

const T: Record<string, string> = {
  "kanbanBoards.statusNotEstablished": "Chưa lập công ty",
  "kanbanBoards.statusPending": "Đề xuất {n} bảng",
  "kanbanBoards.statusApproved": "Đã tạo bảng",
  "kanbanBoards.statusRejected": "Đã bỏ qua đề xuất",
  "kanbanBoards.skippedReasonZeroFlows": "0 luồng — bỏ qua",
};

// ── isDefaultBoard ─────────────────────────────────────────────────────────────

describe("isDefaultBoard", () => {
  it("trả true cho slug='default'", () => {
    assert.strictEqual(isDefaultBoard("default"), true);
  });
  it("trả true cho slug bắt đầu bằng 'default-'", () => {
    assert.strictEqual(isDefaultBoard("default-noi-bo"), true);
  });
  it("trả false cho slug bình thường", () => {
    assert.strictEqual(isDefaultBoard("myco-khach-hang"), false);
  });
  it("trả false cho slug chứa 'default' ở giữa", () => {
    assert.strictEqual(isDefaultBoard("myco-default-test"), false);
  });
});

// ── proposalSummary ───────────────────────────────────────────────────────────

describe("proposalSummary", () => {
  it("null → createCount=0 skipCount=0 flowCount=0", () => {
    const r = proposalSummary(null);
    assert.deepStrictEqual(r, { createCount: 0, skipCount: 0, flowCount: 0 });
  });

  it("proposal có groups + skipped", () => {
    const p: KanbanProposal = {
      id: "kbp1",
      status: "pending",
      flow_count: 4,
      groups: [
        { group: "khach-hang", slug: "myco-khach-hang", name: "Khách hàng", flow_count: 4, exists: false },
        { group: "noi-bo", slug: "myco-noi-bo", name: "Nội bộ", flow_count: 0, exists: false },
      ],
      skipped: [{ group: "san-pham", reason: "0 luồng" }],
    };
    const r = proposalSummary(p);
    assert.strictEqual(r.createCount, 2);
    assert.strictEqual(r.skipCount, 1);
    assert.strictEqual(r.flowCount, 4);
  });
});

// ── boardRows ─────────────────────────────────────────────────────────────────

describe("boardRows", () => {
  it("null → []", () => {
    assert.deepStrictEqual(boardRows(null, T), []);
  });

  it("lọc slug 'default'", () => {
    const p: KanbanProposal = {
      groups: [
        { group: "noi-bo", slug: "default", name: "x", flow_count: 0 },
        { group: "khach-hang", slug: "myco-khach-hang", name: "Khách hàng", flow_count: 4 },
      ],
    };
    const rows = boardRows(p, T);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].key, "myco-khach-hang");
  });

  it("đọc groups_json dạng string", () => {
    const p: KanbanProposal = {
      groups_json: JSON.stringify([{ group: "khach-hang", slug: "co-khach-hang", name: "Khách hàng", flow_count: 3 }]),
    };
    const rows = boardRows(p, T);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].flowText, "3");
  });
});

// ── skippedRows ───────────────────────────────────────────────────────────────

describe("skippedRows", () => {
  it("null → []", () => {
    assert.deepStrictEqual(skippedRows(null, T), []);
  });

  it("trả đúng reason từ T fallback", () => {
    const p: KanbanProposal = {
      skipped: [{ group: "san-pham", reason: "" }],
    };
    const rows = skippedRows(p, T);
    assert.strictEqual(rows[0].reason, "0 luồng — bỏ qua");
  });
});

// ── proposalHeadline ──────────────────────────────────────────────────────────

describe("proposalHeadline", () => {
  it("null → statusNotEstablished", () => {
    assert.strictEqual(proposalHeadline(null, T), "Chưa lập công ty");
  });

  it("approved → statusApproved", () => {
    const p: KanbanProposal = { id: "x", status: "approved" };
    assert.strictEqual(proposalHeadline(p, T), "Đã tạo bảng");
  });

  it("rejected → statusRejected", () => {
    const p: KanbanProposal = { id: "x", status: "rejected" };
    assert.strictEqual(proposalHeadline(p, T), "Đã bỏ qua đề xuất");
  });

  it("pending với 2 groups → Đề xuất 2 bảng", () => {
    const p: KanbanProposal = {
      id: "x",
      status: "pending",
      groups: [
        { group: "khach-hang", slug: "co-khach-hang", name: "", flow_count: 4 },
        { group: "noi-bo", slug: "co-noi-bo", name: "", flow_count: 0 },
      ],
    };
    assert.strictEqual(proposalHeadline(p, T), "Đề xuất 2 bảng");
  });
});


describe("unwrapKanbanProposal — phản hồi {proposal, preview, boards} của máy chủ", () => {
  it("lấy đề xuất ra khỏi gói phản hồi", () => {
    const p = unwrapKanbanProposal({ proposal: { id: "kbp_1", status: "pending" }, preview: {}, boards: [] });
    assert.equal(p?.id, "kbp_1");
    assert.equal(p?.status, "pending");
  });
  it("chưa có đề xuất (proposal null) → null, để giao diện hiện «chưa lập»", () => {
    assert.equal(unwrapKanbanProposal({ proposal: null, preview: {}, boards: [] }), null);
  });
  it("vẫn nhận dạng cũ: chính đề xuất không bọc", () => {
    assert.equal(unwrapKanbanProposal({ id: "kbp_2", status: "approved" })?.id, "kbp_2");
  });
  it("rỗng/không hợp lệ → null", () => {
    assert.equal(unwrapKanbanProposal(null), null);
    assert.equal(unwrapKanbanProposal(undefined), null);
    assert.equal(unwrapKanbanProposal({}), null);
  });
});
