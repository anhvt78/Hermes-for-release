import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addGrant,
  applyPreset,
  flattenAgents,
  groupChecked,
  missingCoreGroups,
  otherRules,
  parseRules,
  removeGrant,
  rulesToText,
  setGrantDirection,
  toggleGroup,
  type ToolGroup,
} from "../src/lib/tool-rules";

const g = (id: string, tools: string[], core = false): ToolGroup => ({
  id, tools, core, risk: "low", label_vi: id, label_en: id, hint_vi: "", hint_en: "",
});
const KANBAN = g("kanban", ["kanban_*"], true);
const MEMORY = g("memory", ["memory", "todo_list"]);
const GROUPS = [KANBAN, MEMORY];

describe("nhóm công cụ", () => {
  it("bật nhóm thêm đủ quy tắc cho phép, không trùng", () => {
    const r1 = toggleGroup([], MEMORY, true);
    assert.deepEqual(r1.map((r) => r.tool_pattern), ["memory", "todo_list"]);
    assert.ok(r1.every((r) => r.policy_action === "allow"));
    assert.equal(toggleGroup(r1, MEMORY, true).length, 2);
    assert.equal(groupChecked(r1, MEMORY), true);
  });

  it("nhóm chỉ được tính là đã chọn khi đủ mọi công cụ", () => {
    assert.equal(groupChecked([{ tool_pattern: "memory", policy_action: "allow" }], MEMORY), false);
    assert.equal(groupChecked([{ tool_pattern: "memory", policy_action: "deny" }, { tool_pattern: "todo_list" }], MEMORY), false);
  });

  it("tắt nhóm chỉ bỏ quy tắc của nhóm đó, giữ ghi chú và quy tắc khác", () => {
    const rules = [
      { tool_pattern: "kanban_*", policy_action: "allow", note: "giữ" },
      { tool_pattern: "memory" }, { tool_pattern: "todo_list" },
      { tool_pattern: "my_tool", policy_action: "allow" },
    ];
    const out = toggleGroup(rules, MEMORY, false);
    assert.deepEqual(out.map((r) => r.tool_pattern), ["kanban_*", "my_tool"]);
    assert.equal(out[0].note, "giữ");
  });

  it("quy tắc ngoài nhóm được liệt kê riêng (kể cả quy tắc cấm)", () => {
    const rules = [{ tool_pattern: "kanban_*" }, { tool_pattern: "lạ" }, { tool_pattern: "memory", policy_action: "deny" }];
    assert.deepEqual(otherRules(rules, GROUPS).map((r) => r.tool_pattern), ["lạ", "memory"]);
  });

  it("bộ mẫu giữ quy tắc ngoài nhóm đang có", () => {
    const out = applyPreset([{ tool_pattern: "lạ" }, { tool_pattern: "memory" }], [{ tool_pattern: "kanban_*", policy_action: "allow" }], GROUPS);
    assert.deepEqual(out.map((r) => r.tool_pattern), ["lạ", "kanban_*"]);
  });

  it("nhắc nhóm lõi còn thiếu", () => {
    assert.deepEqual(missingCoreGroups([], GROUPS).map((x) => x.id), ["kanban"]);
    assert.deepEqual(missingCoreGroups(toggleGroup([], KANBAN, true), GROUPS), []);
  });
});

describe("ô Nâng cao (JSON)", () => {
  it("rỗng là hợp lệ và là danh sách rỗng", () => {
    assert.deepEqual(parseRules("  "), { ok: true, rules: [] });
    assert.equal(rulesToText([]), "");
  });
  it("chấp nhận mảng quy tắc, đi về nguyên vẹn", () => {
    const rules = [{ tool_pattern: "read_file", policy_action: "allow", note: "Đọc tệp" }];
    assert.deepEqual(parseRules(rulesToText(rules)), { ok: true, rules });
  });
  it("từ chối JSON hỏng, không phải mảng, hoặc quy tắc thiếu tool_pattern", () => {
    assert.equal(parseRules("[{").ok, false);
    assert.deepEqual(parseRules('{"a":1}'), { ok: false, error: "not-array" });
    assert.deepEqual(parseRules('[{"policy_action":"allow"}]'), { ok: false, error: "bad-rule" });
    assert.deepEqual(parseRules('[{"tool_pattern":"  "}]'), { ok: false, error: "bad-rule" });
  });
});

describe("quyền A2A", () => {
  it("thêm mặc định một chiều, không trùng, bỏ trống thì bỏ qua", () => {
    const a = addGrant([], "compliance-agent");
    assert.deepEqual(a, [{ to_profile: "compliance-agent", direction: "unidirectional" }]);
    assert.equal(addGrant(a, "compliance-agent"), a);
    assert.equal(addGrant(a, ""), a);
  });
  it("đổi hướng và xoá đúng dòng", () => {
    let a = addGrant(addGrant([], "x"), "y");
    a = setGrantDirection(a, "y", "bidirectional");
    assert.equal(a[1].direction, "bidirectional");
    assert.equal(a[0].direction, "unidirectional");
    assert.deepEqual(removeGrant(a, "x").map((x) => x.to_profile), ["y"]);
  });
  it("danh sách nhân viên từ cây tổ chức: phẳng, bỏ chính mình và người, không trùng", () => {
    const tree = [
      { profile_id: "chu_tich", node_type: "human", children: [{ profile_id: "ceo-agent", node_type: "ai", children: [{ profile_id: "hr-lead-agent" }] }] },
      { profile_id: "ceo-agent" },
    ];
    assert.deepEqual(flattenAgents(tree, "hr-lead-agent"), ["ceo-agent"]);
    assert.deepEqual(flattenAgents(undefined, "x"), []);
  });
});
