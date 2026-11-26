import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { approvalsLevel, countApprovals, isHighRiskTier, maxLevel, orderSections, orgLevel, plainLevel, policyLevel, type Level } from "../src/lib/inboxPriority";
import { countRiskyProposals, isRiskyProposal, sortProposals } from "../src/lib/policyProposal";

const NOW = new Date("2026-11-21T12:00:00Z");
const past = "2026-11-20T00:00:00Z";
const future = "2026-11-25T00:00:00Z";

describe("Mức độ gấp của trang «Chờ duyệt» (21/11/2026)", () => {
  it("T2, T3 là rủi ro cao; T0, T1 và rỗng thì không", () => {
    assert.equal(isHighRiskTier("T2"), true);
    assert.equal(isHighRiskTier("T3"), true);
    assert.equal(isHighRiskTier("T1"), false);
    assert.equal(isHighRiskTier("T0"), false);
    assert.equal(isHighRiskTier(null), false);
    assert.equal(isHighRiskTier(undefined), false);
  });

  it("đếm phiếu: tổng, quá hạn, rủi ro cao", () => {
    const c = countApprovals([
      { risk_tier: "T1", sla_deadline: future },
      { risk_tier: "T3", sla_deadline: future },
      { risk_tier: "T0", sla_deadline: past },
      { risk_tier: "T2", sla_deadline: null },
    ], NOW);
    assert.deepEqual(c, { open: 4, overdue: 1, highRisk: 2 });
    assert.deepEqual(countApprovals([], NOW), { open: 0, overdue: 0, highRisk: 0 });
  });

  it("phiếu: quá hạn hoặc rủi ro cao → Gấp; còn lại → Thường; không có → null", () => {
    assert.equal(approvalsLevel({ open: 0, overdue: 0, highRisk: 0 }), null);
    assert.equal(approvalsLevel({ open: 3, overdue: 0, highRisk: 0 }), "normal");
    assert.equal(approvalsLevel({ open: 3, overdue: 1, highRisk: 0 }), "urgent");
    assert.equal(approvalsLevel({ open: 3, overdue: 0, highRisk: 2 }), "urgent");
  });

  it("đề xuất cơ cấu luôn là Quan trọng khi có; chính sách Quan trọng nếu có quyền mạnh, không thì Thường", () => {
    assert.equal(orgLevel(0), null);
    assert.equal(orgLevel(2), "important");
    assert.equal(policyLevel(0, 0), null);
    assert.equal(policyLevel(4, 0), "normal");
    assert.equal(policyLevel(4, 2), "important");
  });

  it("phần chỉ có việc thường (quy định luồng nháp, đề xuất bảng): có việc → Thường, không → null", () => {
    assert.equal(plainLevel(0), null);
    assert.equal(plainLevel(73), "normal");
    assert.equal(plainLevel(1), "normal");
  });

  it("mức cao nhất trong nhiều phần", () => {
    assert.equal(maxLevel([null, null]), null);
    assert.equal(maxLevel(["normal", null]), "normal");
    assert.equal(maxLevel(["normal", "important", null]), "important");
    assert.equal(maxLevel(["normal", "urgent", "important"]), "urgent");
  });

  it("sắp các phần: gấp lên trên, bằng mức giữ thứ tự cũ, phần trống xuống cuối; không đổi mảng gốc", () => {
    const src = [
      { key: "approvals", level: "normal" as Level | null },
      { key: "org", level: null as Level | null },
      { key: "policy", level: "important" as Level | null },
    ];
    assert.deepEqual(orderSections(src).map((s) => s.key), ["policy", "approvals", "org"]);
    assert.deepEqual(src.map((s) => s.key), ["approvals", "org", "policy"]);
    const eq = [
      { key: "approvals", level: "important" as Level | null },
      { key: "org", level: "important" as Level | null },
      { key: "policy", level: "important" as Level | null },
    ];
    assert.deepEqual(orderSections(eq).map((s) => s.key), ["approvals", "org", "policy"]);
    const urgentLast = [
      { key: "approvals", level: null as Level | null },
      { key: "org", level: "important" as Level | null },
      { key: "policy", level: "urgent" as Level | null },
    ];
    assert.deepEqual(orderSections(urgentLast).map((s) => s.key), ["policy", "org", "approvals"]);
  });

  it("đề xuất chính sách «quyền mạnh»: cho phép công cụ nguy hiểm hoặc tắt cách ly; cấm thì không", () => {
    assert.equal(isRiskyProposal({ policy_type: "tool_policy", payload: { policy_action: "allow", tool_pattern: "terminal" } }), true);
    assert.equal(isRiskyProposal({ policy_type: "tool_policy", payload: { policy_action: "deny", tool_pattern: "terminal" } }), false);
    assert.equal(isRiskyProposal({ policy_type: "tool_policy", payload: { policy_action: "allow", tool_pattern: "read_file" } }), false);
    assert.equal(isRiskyProposal({ policy_type: "sandbox", payload: { sandbox_mode: "off" } }), true);
    assert.equal(isRiskyProposal({ policy_type: "sandbox", payload: { sandbox_mode: "all" } }), false);
    assert.equal(isRiskyProposal({ policy_type: "a2a_grant", payload: {} }), false);
  });

  it("đếm quyền mạnh chỉ tính đề xuất đang chờ; xếp quyền mạnh lên trước, còn lại giữ thứ tự", () => {
    const items = [
      { id: "a", policy_type: "tool_policy", payload: { policy_action: "allow", tool_pattern: "read_file" }, status: "draft" },
      { id: "b", policy_type: "tool_policy", payload: { policy_action: "allow", tool_pattern: "terminal" }, status: "draft" },
      { id: "c", policy_type: "sandbox", payload: { sandbox_mode: "off" }, status: "approved" },
      { id: "d", policy_type: "a2a_grant", payload: {}, status: "draft" },
    ];
    assert.equal(countRiskyProposals(items), 1);
    assert.deepEqual(sortProposals(items).map((i) => i.id), ["b", "c", "a", "d"]);
  });
});
