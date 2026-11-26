import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeProposal, draftProposals, isRiskyTool, type ProposalItem, type ProposalTexts } from "../src/lib/policyProposal";

const X: ProposalTexts = {
  everyone: "everyone",
  toolAllow: (w, t) => `ALLOW ${w} ${t}`,
  toolDeny: (w, t) => `DENY ${w} ${t}`,
  sandboxSet: (w, m, a) => `SANDBOX ${w} ${m} ${a}`,
  a2aTwoWay: (a, b) => `TWO ${a} ${b}`,
  a2aOneWay: (a, b) => `ONE ${a} ${b}`,
  channelBind: (w, c) => `CH ${w} ${c}`,
  unknown: (t, k) => `?? ${t} ${k}`,
  sandboxModes: { off: "Off", "non-main": "Non-main", all: "All" },
  workspaceAccess: { ro: "read-only", rw: "read-write" },
  types: { tool_policy: "Tool", sandbox: "Sandbox", a2a_grant: "A2A", channel_binding: "Channel" },
  reasons: { tool_policy_from_role_card: "from card", a2a_from_org_line: "org line" },
};
const L = { person: (id: string) => `P(${id})`, tool: (c: string) => ({ terminal: "Run command", read_file: "Read file" } as Record<string, string>)[c] ?? "" };
const mk = (over: Partial<ProposalItem>): ProposalItem => ({ id: "s1", policy_type: "tool_policy", target_key: "a|b", payload: {}, rationale_key: "", status: "draft", ...over });

describe("Đề xuất chính sách → một câu tiếng thường (21/11/2026)", () => {
  it("công cụ: cho phép / cấm, dùng tên dễ hiểu; chưa có tên thì dùng mã", () => {
    const a = describeProposal(mk({ payload: { profile_id: "ceo", tool_pattern: "read_file", policy_action: "allow" } }), L, X);
    assert.equal(a.effect, "ALLOW P(ceo) Read file");
    assert.equal(a.typeLabel, "Tool");
    const d = describeProposal(mk({ payload: { profile_id: "ceo", tool_pattern: "group:web", policy_action: "deny" } }), L, X);
    assert.equal(d.effect, "DENY P(ceo) group:web");
  });

  it("cấp quyền mạnh (chạy lệnh, mọi công cụ…) bị đánh dấu rủi ro; cấm hay công cụ thường thì không", () => {
    assert.equal(describeProposal(mk({ payload: { profile_id: "x", tool_pattern: "terminal", policy_action: "allow" } }), L, X).risky, true);
    assert.equal(describeProposal(mk({ payload: { profile_id: "x", tool_pattern: "*", policy_action: "allow" } }), L, X).risky, true);
    assert.equal(describeProposal(mk({ payload: { profile_id: "x", tool_pattern: "terminal", policy_action: "deny" } }), L, X).risky, false);
    assert.equal(describeProposal(mk({ payload: { profile_id: "x", tool_pattern: "read_file", policy_action: "allow" } }), L, X).risky, false);
    assert.equal(isRiskyTool("poclip_*"), true);
    assert.equal(isRiskyTool("kanban_show"), false);
  });

  it("profile_id «*» hoặc rỗng → «mọi nhân viên», không gọi hàm tên người", () => {
    assert.equal(describeProposal(mk({ payload: { profile_id: "*", tool_pattern: "read_file", policy_action: "allow" } }), L, X).effect, "ALLOW everyone Read file");
    assert.equal(describeProposal(mk({ payload: { tool_pattern: "read_file", policy_action: "deny" } }), L, X).effect, "DENY everyone Read file");
  });

  it("cách ly: dịch chế độ + quyền thư mục; tắt cách ly là rủi ro", () => {
    const s = describeProposal(mk({ policy_type: "sandbox", payload: { profile_id: "ops", sandbox_mode: "non-main", workspace_access: "ro" } }), L, X);
    assert.equal(s.effect, "SANDBOX P(ops) Non-main read-only");
    assert.equal(s.risky, false);
    assert.equal(describeProposal(mk({ policy_type: "sandbox", payload: { profile_id: "ops", sandbox_mode: "off", workspace_access: "rw" } }), L, X).risky, true);
    // mã lạ giữ nguyên chứ không vỡ
    assert.equal(describeProposal(mk({ policy_type: "sandbox", payload: { profile_id: "ops", sandbox_mode: "zzz", workspace_access: "yyy" } }), L, X).effect, "SANDBOX P(ops) zzz yyy");
  });

  it("liên lạc: hai chiều (mặc định) hoặc một chiều", () => {
    const two = describeProposal(mk({ policy_type: "a2a_grant", payload: { from_profile: "m", to_profile: "n", direction: "bidirectional" } }), L, X);
    assert.equal(two.effect, "TWO P(m) P(n)");
    const one = describeProposal(mk({ policy_type: "a2a_grant", payload: { from_profile: "m", to_profile: "n", direction: "unidirectional" } }), L, X);
    assert.equal(one.effect, "ONE P(m) P(n)");
  });

  it("kênh nhắn tin và loại lạ", () => {
    assert.equal(describeProposal(mk({ policy_type: "channel_binding", payload: { profile_id: "ceo", channel: "telegram" } }), L, X).effect, "CH P(ceo) telegram");
    const u = describeProposal(mk({ policy_type: "future_type", target_key: "k1" }), L, X);
    assert.equal(u.effect, "?? future_type k1");
    assert.equal(u.typeLabel, "future_type");
  });

  it("lý do: mã có dấu chấm hay gạch dưới đều tra được; mã lạ → rỗng", () => {
    assert.equal(describeProposal(mk({ rationale_key: "tool_policy.from_role_card" }), L, X).reason, "from card");
    assert.equal(describeProposal(mk({ rationale_key: "a2a_from_org_line" }), L, X).reason, "org line");
    assert.equal(describeProposal(mk({ rationale_key: "khong.co" }), L, X).reason, "");
  });

  it("chỉ giữ đề xuất đang chờ (draft)", () => {
    const kept = draftProposals([mk({ id: "1", status: "draft" }), mk({ id: "2", status: "approved" }), mk({ id: "3", status: "rejected" })]);
    assert.deepEqual(kept.map((i) => i.id), ["1"]);
    assert.deepEqual(draftProposals(null), []);
    assert.deepEqual(draftProposals(undefined), []);
  });
});
