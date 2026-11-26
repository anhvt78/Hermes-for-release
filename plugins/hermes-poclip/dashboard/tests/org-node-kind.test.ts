import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  orgNodeKind,
  isHumanNode,
  detailKind,
  humanDisplayName,
  humanRoleLabelKey,
  humanPermLabelKey,
} from "../src/lib/org-node-kind";

// ── orgNodeKind ───────────────────────────────────────────────────────────────

describe("orgNodeKind: node_type='human'", () => {
  it("trả 'human'", () => {
    assert.strictEqual(orgNodeKind({ profile_id: "ceo-agent", node_type: "human" }), "human");
  });
});

describe("orgNodeKind: node_type='ai'", () => {
  it("trả 'ai'", () => {
    assert.strictEqual(orgNodeKind({ profile_id: "ceo-agent", node_type: "ai" }), "ai");
  });
});

describe("orgNodeKind: profile_id='chu_tich' không có node_type", () => {
  it("tương thích dữ liệu cũ — trả 'human'", () => {
    assert.strictEqual(orgNodeKind({ profile_id: "chu_tich" }), "human");
  });
});

describe("orgNodeKind: human_account != null nhưng thiếu node_type", () => {
  it("trả 'human' vì human_account có giá trị", () => {
    assert.strictEqual(
      orgNodeKind({ profile_id: "ceo-agent", human_account: { account_id: "hacc_1" } }),
      "human",
    );
  });
});

describe("orgNodeKind: node_type='ai' + human_account=null", () => {
  it("trả 'ai'", () => {
    assert.strictEqual(
      orgNodeKind({ profile_id: "ceo-agent", node_type: "ai", human_account: null }),
      "ai",
    );
  });
});

describe("orgNodeKind: human_account=null và không có node_type", () => {
  it("trả 'ai'", () => {
    assert.strictEqual(orgNodeKind({ profile_id: "hr-lead-agent", human_account: null }), "ai");
  });
});

describe("orgNodeKind: node null hoặc undefined", () => {
  it("null → 'ai'", () => {
    assert.strictEqual(orgNodeKind(null), "ai");
  });
  it("undefined → 'ai'", () => {
    assert.strictEqual(orgNodeKind(undefined), "ai");
  });
});

// ── isHumanNode ───────────────────────────────────────────────────────────────

describe("isHumanNode", () => {
  it("human node → true", () => {
    assert.ok(isHumanNode({ node_type: "human" }));
  });
  it("ai node → false", () => {
    assert.ok(!isHumanNode({ node_type: "ai" }));
  });
});

// ── humanDisplayName ──────────────────────────────────────────────────────────

describe("humanDisplayName: ưu tiên full_name", () => {
  it("có cả hai → trả full_name", () => {
    assert.strictEqual(
      humanDisplayName({ account_id: "h1", username: "president", full_name: "Chủ tịch", role: "chu_tich" }),
      "Chủ tịch",
    );
  });
});

describe("humanDisplayName: thiếu full_name dùng username", () => {
  it("full_name rỗng → trả username", () => {
    assert.strictEqual(
      humanDisplayName({ account_id: "h1", username: "president", full_name: "", role: "chu_tich" }),
      "president",
    );
  });
});

describe("humanDisplayName: cả hai đều rỗng", () => {
  it("trả chuỗi rỗng", () => {
    assert.strictEqual(
      humanDisplayName({ account_id: "h1", username: "", full_name: "", role: "chu_tich" }),
      "",
    );
  });
});

describe("humanDisplayName: ha = null", () => {
  it("trả chuỗi rỗng", () => {
    assert.strictEqual(humanDisplayName(null), "");
  });
});

describe("humanDisplayName: ha = undefined", () => {
  it("trả chuỗi rỗng", () => {
    assert.strictEqual(humanDisplayName(undefined), "");
  });
});

// ── humanRoleLabelKey ─────────────────────────────────────────────────────────

describe("humanRoleLabelKey: 3 nhánh chính", () => {
  it("chu_tich → humanRoleChairman", () => {
    assert.strictEqual(humanRoleLabelKey("chu_tich"), "humanRoleChairman");
  });
  it("truong_phong → humanRoleDeptHead", () => {
    assert.strictEqual(humanRoleLabelKey("truong_phong"), "humanRoleDeptHead");
  });
  it("chi_xem → humanRoleReadOnly", () => {
    assert.strictEqual(humanRoleLabelKey("chi_xem"), "humanRoleReadOnly");
  });
});

describe("humanRoleLabelKey: vai trò lạ → humanRoleReadOnly (fallback)", () => {
  it("vai trò không rõ → humanRoleReadOnly", () => {
    assert.strictEqual(humanRoleLabelKey("unknown_role"), "humanRoleReadOnly");
  });
});

// ── humanPermLabelKey ─────────────────────────────────────────────────────────

describe("humanPermLabelKey: 3 nhánh", () => {
  it("chu_tich → humanPermChairman", () => {
    assert.strictEqual(humanPermLabelKey("chu_tich"), "humanPermChairman");
  });
  it("truong_phong → humanPermDeptHead", () => {
    assert.strictEqual(humanPermLabelKey("truong_phong"), "humanPermDeptHead");
  });
  it("chi_xem → humanPermReadOnly", () => {
    assert.strictEqual(humanPermLabelKey("chi_xem"), "humanPermReadOnly");
  });
});

// ── detailKind ────────────────────────────────────────────────────────────────

describe("detailKind: các nhánh", () => {
  it("detail null → 'ai'", () => {
    assert.strictEqual(detailKind(null), "ai");
  });
  it("detail.node_type='human' → 'human'", () => {
    assert.strictEqual(detailKind({ node_type: "human", human_account: null }), "human");
  });
  it("detail.node_type='ai' → 'ai'", () => {
    assert.strictEqual(detailKind({ node_type: "ai", human_account: null }), "ai");
  });
  it("human_account != null nhưng không có node_type → 'human'", () => {
    assert.strictEqual(detailKind({ human_account: { account_id: "h1" } }), "human");
  });
  it("human_account null và không có node_type → 'ai'", () => {
    assert.strictEqual(detailKind({ human_account: null }), "ai");
  });
});

describe("detailKind: fallbackProfileId", () => {
  it("fallbackProfileId='chu_tich' + detail={node_type:'ai'} → 'human'", () => {
    assert.strictEqual(detailKind({ node_type: "ai" }, "chu_tich"), "human");
  });
  it("fallbackProfileId='ceo-agent' + detail={} → 'ai'", () => {
    assert.strictEqual(detailKind({}, "ceo-agent"), "ai");
  });
});
