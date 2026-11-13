import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clusterOptions, ruleUnknownUnits, toggleCluster, unknownClusters, type UnitLite } from "../src/lib/cluster-picker";
import {
  baseModelError, flattenNodes, managerChoices, modelChoices, prefillFromTree, unitChoices, unitError, type TreeNode,
} from "../src/lib/placement-fields";

const UNITS: UnitLite[] = [
  { slug: "market_data", display_name: "Dữ liệu thị trường", in_org: true },
  { slug: "risk-management", display_name: "Quản trị Rủi ro", in_org: true },
  { slug: "finance", display_name: "Tài chính", in_org: false }, // phòng của công ty mẫu: còn tên nhưng không có người
];
const LABELS = { "*": "Tất cả", chairman_human: "Chủ tịch", external_anonymous: "Người ngoài" };

describe("chọn bên gửi/nhận", () => {
  it("bật/tắt giữ thứ tự và không trùng", () => {
    assert.equal(toggleCluster("", "a", true), "a");
    assert.equal(toggleCluster("a", "b", true), "a, b");
    assert.equal(toggleCluster("a, b", "a", true), "a, b");
    assert.equal(toggleCluster("a, b, c", "b", false), "a, c");
  });
  it("danh sách chọn gồm phòng thật + 3 giá trị đặc biệt, bỏ phòng không còn người", () => {
    const ids = clusterOptions(UNITS, LABELS).map((o) => o.id);
    assert.deepEqual(ids, ["market_data", "risk-management", "*", "chairman_human", "external_anonymous"]);
    assert.equal(clusterOptions(UNITS, LABELS)[0].label, "Dữ liệu thị trường");
  });
  it("nhận ra phòng không có trong công ty, so khớp bỏ qua - và _", () => {
    assert.deepEqual(unknownClusters(["risk_management", "finance", "*", "sales"], UNITS), ["finance", "sales"]);
    assert.deepEqual(unknownClusters(["x"], undefined), []);
  });
  it("quy tắc nhắc phòng lạ: gom cả hai bên, không trùng", () => {
    assert.deepEqual(ruleUnknownUnits({ producer_clusters: ["sales", "market_data"], consumer_clusters: ["sales", "chairman_human"] }, UNITS), ["sales"]);
    assert.deepEqual(ruleUnknownUnits({ producer_clusters: null, consumer_clusters: "x" }, UNITS), []);
  });
});

describe("bước 1 tiếp nhận: danh sách lựa chọn", () => {
  const TREE: TreeNode[] = [
    { profile_id: "chu_tich", node_type: "human", org_unit: "ban-lanh-dao", children: [
      { profile_id: "ceo-agent", role: "orchestrator", org_unit: "executive", job_title: "CEO", children: [
        { profile_id: "hr-lead-agent", org_unit: "hr_core" },
      ] },
    ] },
  ];
  it("người quản lý: bỏ chính mình, kèm chức danh", () => {
    const c = managerChoices(TREE, "hr-lead-agent", "vi");
    assert.deepEqual(c.map((x) => x.value), ["chu_tich", "ceo-agent"]);
    assert.equal(c[1].label, "ceo-agent — CEO");
  });
  it("điền sẵn người quản lý (nút cha) và phòng", () => {
    assert.deepEqual(prefillFromTree(TREE, "hr-lead-agent"), { manager_id: "ceo-agent", org_unit: "hr_core" });
    assert.equal(prefillFromTree(TREE, "khong-co"), null);
    assert.equal(prefillFromTree(TREE, " "), null);
  });
  it("flattenNodes không lặp nút", () => {
    assert.equal(flattenNodes([...TREE, ...TREE], "").length, 3);
  });
  it("phòng: chỉ phòng đang có người, nhãn kèm mã", () => {
    const c = unitChoices(UNITS.map((u) => ({ ...u, agent_count: 1 })));
    assert.deepEqual(c.map((x) => x.value), ["market_data", "risk-management"]);
    assert.equal(c[0].label, "Dữ liệu thị trường (market_data)");
  });
  it("kiểm tra mã phòng nhập tay", () => {
    assert.equal(unitError("market_data"), false);
    assert.equal(unitError("ky-thuat"), false);
    assert.equal(unitError("Phòng Mới"), true);
    assert.equal(unitError("1abc"), true);
    assert.equal(unitError(""), true);
  });
  it("mô hình: bỏ trùng Claude/Claude Code, giá trị dạng nhà-cung-cấp:mô-hình", () => {
    const c = modelChoices([
      { provider: "anthropic", model: "claude-x", label: "Claude" },
      { provider: "anthropic", model: "claude-x", label: "Claude Code", auth: "claude_code" },
      { provider: "kimi-coding", model: "kimi-k3", label: "Kimi", label_en: "Kimi EN" },
    ], "en");
    assert.deepEqual(c.map((x) => x.value), ["anthropic:claude-x", "kimi-coding:kimi-k3"]);
    assert.equal(c[1].label, "Kimi EN");
  });
  it("kiểm tra mô hình nhập tay: rỗng = giữ nguyên; thiếu tên sau nhà cung cấp là lỗi", () => {
    assert.equal(baseModelError(""), false);
    assert.equal(baseModelError("gpt-5.5"), false);
    assert.equal(baseModelError("openai:gpt-5.5"), false);
    assert.equal(baseModelError("openrouter/pareto-code"), false);
    assert.equal(baseModelError("openai:"), true);
    assert.equal(baseModelError("tên có dấu cách"), true);
  });
});
