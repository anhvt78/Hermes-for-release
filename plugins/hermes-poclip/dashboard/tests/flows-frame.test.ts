import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveClusterRef,
  buildFrameEdges,
  buildUnitLabelMap,
  frameNodeSet,
  mergeEdgePairs,
  extractOrgUnits,
  splitFrameUnmatched,
  SPECIAL_CLUSTER_REFS,
} from "../src/lib/flowsFrame";

// ── resolveClusterRef ─────────────────────────────────────────────────────────

describe("resolveClusterRef — tìm slug từ raw value", () => {
  const slugSet = new Set(["hr_core", "finance", "tech_product"]);
  const labelToSlug = new Map([["HR", "hr_core"], ["Finance", "finance"]]);

  it("raw là slug thật → trả về slug đó", () => {
    assert.equal(resolveClusterRef("hr_core", slugSet, labelToSlug), "hr_core");
  });

  it("raw là nhãn hiển thị → trả về slug tương ứng", () => {
    assert.equal(resolveClusterRef("HR", slugSet, labelToSlug), "hr_core");
  });

  it("raw là nhãn nhưng slug không có trong slugSet → null", () => {
    const partialSlugSet = new Set(["tech_product"]);
    assert.equal(resolveClusterRef("HR", partialSlugSet, labelToSlug), null);
  });

  it("raw là '*' → null (không có trong slugSet)", () => {
    assert.equal(resolveClusterRef("*", slugSet, labelToSlug), null);
  });

  it("raw là giá trị hoàn toàn lạ → null", () => {
    assert.equal(resolveClusterRef("chairman_human", slugSet, labelToSlug), null);
  });

  it("raw là chuỗi rỗng → null", () => {
    assert.equal(resolveClusterRef("", slugSet, labelToSlug), null);
  });

  it("slugSet rỗng → luôn null", () => {
    assert.equal(resolveClusterRef("hr_core", new Set(), labelToSlug), null);
  });
});

// ── buildFrameEdges ───────────────────────────────────────────────────────────

describe("buildFrameEdges — dựng cạnh khung từ event-topics", () => {
  const slugSet = new Set(["hr_core", "finance", "tech_product", "compliance"]);
  const emptyLabel = new Map<string, string>();

  it("topics rỗng → edges rỗng, unmatched rỗng", () => {
    const { edges, unmatched } = buildFrameEdges([], slugSet, emptyLabel);
    assert.equal(edges.length, 0);
    assert.equal(unmatched.length, 0);
  });

  it("cả producer lẫn consumer resolve được → 1 cạnh", () => {
    const topics = [{ name: "hr.onboard", producer_clusters: ["hr_core"], consumer_clusters: ["finance"] }];
    const { edges, unmatched } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 1);
    assert.equal(edges[0].from, "hr_core");
    assert.equal(edges[0].to, "finance");
    assert.deepEqual(edges[0].topics, ["hr.onboard"]);
    assert.equal(unmatched.length, 0);
  });

  it("producer không resolve được → cạnh bị bỏ, unmatched ghi nhận giá trị", () => {
    const topics = [{ name: "x.flow", producer_clusters: ["*"], consumer_clusters: ["finance"] }];
    const { edges, unmatched } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 0);
    assert.equal(unmatched.length, 1);
    assert.equal(unmatched[0].value, "*");
    assert.deepEqual(unmatched[0].topics, ["x.flow"]);
  });

  it("consumer không resolve được → cạnh bị bỏ, unmatched ghi nhận", () => {
    const topics = [{ name: "y.flow", producer_clusters: ["finance"], consumer_clusters: ["chairman_human"] }];
    const { edges, unmatched } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 0);
    assert.equal(unmatched.length, 1);
    assert.equal(unmatched[0].value, "chairman_human");
  });

  it("dedupe: cùng cặp từ nhiều topics → 1 cạnh, topics gộp lại", () => {
    const topics = [
      { name: "a.flow", producer_clusters: ["hr_core"], consumer_clusters: ["finance"] },
      { name: "b.flow", producer_clusters: ["hr_core"], consumer_clusters: ["finance"] },
    ];
    const { edges } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 1);
    assert.deepEqual(edges[0].topics.sort(), ["a.flow", "b.flow"]);
  });

  it("cạnh tự thân (from === to) vẫn được giữ", () => {
    const topics = [{ name: "hr.internal", producer_clusters: ["hr_core"], consumer_clusters: ["hr_core"] }];
    const { edges } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 1);
    assert.equal(edges[0].from, "hr_core");
    assert.equal(edges[0].to, "hr_core");
  });

  it("unmatched gộp topics từ nhiều entries dùng cùng giá trị không khớp", () => {
    const topics = [
      { name: "a.flow", producer_clusters: ["*"], consumer_clusters: ["finance"] },
      { name: "b.flow", producer_clusters: ["hr_core"], consumer_clusters: ["*"] },
    ];
    const { unmatched } = buildFrameEdges(topics, slugSet, emptyLabel);
    const star = unmatched.find((u) => u.value === "*");
    assert.ok(star, "'*' phải có trong unmatched");
    assert.equal(star!.topics.length, 2);
    assert.ok(star!.topics.includes("a.flow"));
    assert.ok(star!.topics.includes("b.flow"));
  });

  it("fromRaw và toRaw giữ giá trị GỐC từ topic", () => {
    const topics = [{ name: "t.flow", producer_clusters: ["hr_core"], consumer_clusters: ["finance"] }];
    const { edges } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges[0].fromRaw, "hr_core");
    assert.equal(edges[0].toRaw, "finance");
  });

  it("labelToSlug được dùng để resolve nhãn", () => {
    const labelMap = new Map([["Nhân sự", "hr_core"]]);
    const topics = [{ name: "t.flow", producer_clusters: ["Nhân sự"], consumer_clusters: ["finance"] }];
    const { edges, unmatched } = buildFrameEdges(topics, slugSet, labelMap);
    assert.equal(edges.length, 1);
    assert.equal(edges[0].from, "hr_core");
    assert.equal(unmatched.length, 0);
  });

  it("producer_clusters là mảng rỗng → không có cạnh nào", () => {
    const topics = [{ name: "t.flow", producer_clusters: [], consumer_clusters: ["finance"] }];
    const { edges, unmatched } = buildFrameEdges(topics, slugSet, emptyLabel);
    assert.equal(edges.length, 0);
    assert.equal(unmatched.length, 0);
  });
});

// ── buildUnitLabelMap ────────────────────────────────────────────────────────

describe("buildUnitLabelMap — dựng map slug→nhãn", () => {
  it("rỗng cả hai → map rỗng", () => {
    assert.equal(buildUnitLabelMap([], []).size, 0);
  });

  it("unitStats được ưu tiên hơn missingUnits khi cùng slug", () => {
    const unitStats = [{ cluster: "hr_core", label: "HR (from stats)" }];
    const missingUnits = [{ cluster: "hr_core", label: "HR (from missing)" }];
    const map = buildUnitLabelMap(unitStats, missingUnits);
    assert.equal(map.get("hr_core"), "HR (from stats)");
  });

  it("null cluster → bỏ qua", () => {
    const unitStats = [{ cluster: null as unknown as string, label: "??" }];
    const map = buildUnitLabelMap(unitStats, []);
    assert.equal(map.size, 0);
  });

  it("label rỗng → fallback về slug", () => {
    const unitStats = [{ cluster: "hr_core", label: "" }];
    const map = buildUnitLabelMap(unitStats, []);
    assert.equal(map.get("hr_core"), "hr_core");
  });

  it("missingUnits điền vào slug chưa có trong unitStats", () => {
    const unitStats = [{ cluster: "finance", label: "Finance" }];
    const missingUnits = [{ cluster: "qa", label: "QA" }];
    const map = buildUnitLabelMap(unitStats, missingUnits);
    assert.equal(map.get("qa"), "QA");
    assert.equal(map.get("finance"), "Finance");
  });
});

// ── frameNodeSet ──────────────────────────────────────────────────────────────

describe("frameNodeSet — tập node của khung, sắp xếp cố định", () => {
  it("tất cả rỗng → mảng rỗng", () => {
    assert.deepEqual(frameNodeSet([], [], []), []);
  });

  it("lấy node từ frameEdges (from và to)", () => {
    const edges = [{ from: "b", to: "a", fromRaw: "b", toRaw: "a", topics: [] }];
    const result = frameNodeSet(edges, [], []);
    assert.deepEqual(result, ["a", "b"]);
  });

  it("lấy node từ unitStats", () => {
    const result = frameNodeSet([], [{ cluster: "finance" }, { cluster: "hr_core" }], []);
    assert.deepEqual(result, ["finance", "hr_core"]);
  });

  it("lấy node từ missingUnits", () => {
    const result = frameNodeSet([], [], [{ cluster: "qa" }, { cluster: "infrastructure_ops" }]);
    assert.deepEqual(result, ["infrastructure_ops", "qa"]);
  });

  it("khử trùng giữa các nguồn", () => {
    const edges = [{ from: "hr_core", to: "finance", fromRaw: "hr_core", toRaw: "finance", topics: [] }];
    const unitStats = [{ cluster: "hr_core" }, { cluster: "finance" }];
    const missing = [{ cluster: "qa" }];
    const result = frameNodeSet(edges, unitStats, missing);
    assert.deepEqual(result, ["finance", "hr_core", "qa"]);
  });

  it("sắp xếp theo slug (lexicographic) → bố cục ổn định", () => {
    const edges = [
      { from: "tech_product", to: "hr_core", fromRaw: "tech_product", toRaw: "hr_core", topics: [] },
    ];
    const result = frameNodeSet(edges, [], [{ cluster: "audit" }]);
    assert.deepEqual(result, ["audit", "hr_core", "tech_product"]);
  });

  it("null cluster trong unitStats → bỏ qua", () => {
    const result = frameNodeSet([], [{ cluster: null as unknown as string }], []);
    assert.deepEqual(result, []);
  });
});

// ── mergeEdgePairs ────────────────────────────────────────────────────────────

describe("mergeEdgePairs — tập key cặp vừa có quy định vừa có thực tế", () => {
  it("cả hai rỗng → set rỗng", () => {
    assert.equal(mergeEdgePairs([], []).size, 0);
  });

  it("cặp khớp cả frame lẫn real → có trong set", () => {
    const real = [{ from: "hr_core", to: "finance" }];
    const frame = [{ from: "hr_core", to: "finance", fromRaw: "hr_core", toRaw: "finance", topics: [] }];
    const shared = mergeEdgePairs(real, frame);
    assert.ok(shared.has("hr_core->finance"));
  });

  it("real edge không có trong frame → không có trong set", () => {
    const real = [{ from: "hr_core", to: "finance" }];
    const frame = [{ from: "tech_product", to: "finance", fromRaw: "tech_product", toRaw: "finance", topics: [] }];
    const shared = mergeEdgePairs(real, frame);
    assert.equal(shared.size, 0);
  });

  it("frame edge không có trong real → không có trong set", () => {
    const real: { from: string | null; to: string | null }[] = [];
    const frame = [{ from: "hr_core", to: "finance", fromRaw: "hr_core", toRaw: "finance", topics: [] }];
    const shared = mergeEdgePairs(real, frame);
    assert.equal(shared.size, 0);
  });

  it("real edge có from=null → dùng __unmapped__ làm key", () => {
    const real = [{ from: null, to: "finance" }];
    const frame = [{ from: "__unmapped__", to: "finance", fromRaw: "__unmapped__", toRaw: "finance", topics: [] }];
    const shared = mergeEdgePairs(real, frame);
    assert.ok(shared.has("__unmapped__->finance"));
  });

  it("nhiều cặp khớp → tất cả đều có trong set", () => {
    const real = [
      { from: "hr_core", to: "finance" },
      { from: "finance", to: "tech_product" },
    ];
    const frame = [
      { from: "hr_core", to: "finance", fromRaw: "hr_core", toRaw: "finance", topics: [] },
      { from: "finance", to: "tech_product", fromRaw: "finance", toRaw: "tech_product", topics: [] },
      { from: "hr_core", to: "tech_product", fromRaw: "hr_core", toRaw: "tech_product", topics: [] },
    ];
    const shared = mergeEdgePairs(real, frame);
    assert.equal(shared.size, 2);
    assert.ok(shared.has("hr_core->finance"));
    assert.ok(shared.has("finance->tech_product"));
    assert.ok(!shared.has("hr_core->tech_product"));
  });
});

// ── extractOrgUnits ───────────────────────────────────────────────────────────

describe("extractOrgUnits — trích xuất org_unit từ cây tổ chức", () => {
  it("cây rỗng → set rỗng", () => {
    assert.equal(extractOrgUnits([]).size, 0);
  });

  it("nút phẳng → thu thập đủ org_unit", () => {
    const nodes = [
      { org_unit: "hr_core", children: [] },
      { org_unit: "finance", children: [] },
    ];
    const s = extractOrgUnits(nodes);
    assert.ok(s.has("hr_core"));
    assert.ok(s.has("finance"));
    assert.equal(s.size, 2);
  });

  it("cây lồng nhau → thu thập đệ quy", () => {
    const nodes = [
      {
        org_unit: "executive",
        children: [
          { org_unit: "hr_core", children: [] },
          { org_unit: "finance", children: [{ org_unit: "qa", children: [] }] },
        ],
      },
    ];
    const s = extractOrgUnits(nodes);
    assert.ok(s.has("executive"));
    assert.ok(s.has("hr_core"));
    assert.ok(s.has("finance"));
    assert.ok(s.has("qa"));
    assert.equal(s.size, 4);
  });

  it("nút không có org_unit → bỏ qua", () => {
    const nodes = [{ children: [{ org_unit: "hr_core" }] }];
    const s = extractOrgUnits(nodes);
    assert.ok(s.has("hr_core"));
    assert.equal(s.size, 1);
  });

  it("dedup: org_unit xuất hiện nhiều lần → chỉ 1 giá trị", () => {
    const nodes = [
      { org_unit: "hr_core" },
      { org_unit: "hr_core", children: [{ org_unit: "hr_core" }] },
    ];
    const s = extractOrgUnits(nodes);
    assert.equal(s.size, 1);
  });
});

// ── FIX 1: cơ cấu phòng thật với slugSet từ org tree ────────────────────────

const REAL_ORG_UNITS = new Set([
  "executive", "audit", "compliance", "customer_success", "finance",
  "hr_core", "marketing", "qa", "sales", "tech_product", "training", "infrastructure_ops",
]);

describe("(a) giá trị không thuộc cơ cấu thật → vào unmatched, KHÔNG tạo cạnh", () => {
  const emptyLabel = new Map<string, string>();

  it("chairman_human với slugSet cơ cấu thật → vào unmatched", () => {
    const topics = [{ name: "t.flow", producer_clusters: ["chairman_human"], consumer_clusters: ["hr_core"] }];
    const { edges, unmatched } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    assert.equal(edges.length, 0);
    assert.ok(unmatched.some((u) => u.value === "chairman_human"));
  });

  it("external_anonymous với slugSet cơ cấu thật → vào unmatched", () => {
    const topics = [{ name: "t.flow", producer_clusters: ["sales"], consumer_clusters: ["external_anonymous"] }];
    const { edges, unmatched } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    assert.equal(edges.length, 0);
    assert.ok(unmatched.some((u) => u.value === "external_anonymous"));
  });

  it("'*' với slugSet cơ cấu thật → vào unmatched", () => {
    const topics = [{ name: "t.flow", producer_clusters: ["*"], consumer_clusters: ["hr_core"] }];
    const { edges, unmatched } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    assert.equal(edges.length, 0);
    assert.ok(unmatched.some((u) => u.value === "*"));
  });

  it("cả hai phòng đều là phòng thật → tạo cạnh bình thường", () => {
    const topics = [{ name: "sales.flow", producer_clusters: ["sales"], consumer_clusters: ["tech_product"] }];
    const { edges, unmatched } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    assert.equal(edges.length, 1);
    assert.equal(unmatched.length, 0);
    assert.equal(edges[0].from, "sales");
    assert.equal(edges[0].to, "tech_product");
  });
});

describe("(b) unit_stats rỗng + org tree → nodeSet giống hệt unit_stats đầy", () => {
  const emptyLabel = new Map<string, string>();
  const topics = [
    { name: "a.flow", producer_clusters: ["sales"], consumer_clusters: ["tech_product"] },
    { name: "b.flow", producer_clusters: ["hr_core"], consumer_clusters: ["finance"] },
  ];

  it("frameNodeSet với orgSlugs → bao gồm tất cả 12 phòng thật", () => {
    const { edges } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    const nodesWithOrgTree = frameNodeSet(edges, [], [], REAL_ORG_UNITS);
    // Phải có đủ 12 phòng từ org tree
    assert.equal(nodesWithOrgTree.length, 12);
    for (const u of REAL_ORG_UNITS) {
      assert.ok(nodesWithOrgTree.includes(u), `Thiếu node: ${u}`);
    }
  });

  it("nodeSet với unit_stats đầy == nodeSet với unit_stats rỗng + orgSlugs", () => {
    const { edges } = buildFrameEdges(topics, REAL_ORG_UNITS, emptyLabel);
    const fullStats = Array.from(REAL_ORG_UNITS).map((c) => ({ cluster: c }));

    const nodesWithStats = frameNodeSet(edges, fullStats, [], REAL_ORG_UNITS);
    const nodesWithOrgTree = frameNodeSet(edges, [], [], REAL_ORG_UNITS);

    assert.deepEqual(nodesWithStats, nodesWithOrgTree);
  });
});

// ── splitFrameUnmatched ───────────────────────────────────────────────────────

describe("splitFrameUnmatched — phân loại tham chiếu đặc biệt vs không khớp thật", () => {
  it("chairman_human, external_anonymous, '*' → vào specials, KHÔNG vào unknown", () => {
    const input = [
      { value: "*", topics: ["a.flow", "b.flow"] },
      { value: "chairman_human", topics: ["c.flow"] },
      { value: "external_anonymous", topics: ["d.flow"] },
    ];
    const { specials, unknown } = splitFrameUnmatched(input);
    assert.equal(specials.length, 3);
    assert.equal(unknown.length, 0);
    assert.ok(specials.some((s) => s.value === "*"));
    assert.ok(specials.some((s) => s.value === "chairman_human"));
    assert.ok(specials.some((s) => s.value === "external_anonymous"));
  });

  it("giá trị lạ (sales_new) → vào unknown, KHÔNG vào specials; không vỡ trang", () => {
    const input = [{ value: "sales_new", topics: ["x.flow"] }];
    const { specials, unknown } = splitFrameUnmatched(input);
    assert.equal(specials.length, 0);
    assert.equal(unknown.length, 1);
    assert.equal(unknown[0].value, "sales_new");
  });

  it("trộn lẫn → thứ tự giữ nguyên như đầu vào ở cả 2 danh sách", () => {
    const input = [
      { value: "finance", topics: ["t1"] },
      { value: "chairman_human", topics: ["t2"] },
      { value: "sales_new", topics: ["t3"] },
      { value: "*", topics: ["t4"] },
      { value: "ghost_dept", topics: ["t5"] },
      { value: "external_anonymous", topics: ["t6"] },
    ];
    const { specials, unknown } = splitFrameUnmatched(input);
    // Thứ tự specials: chairman_human trước *, trước external_anonymous
    assert.deepEqual(specials.map((s) => s.value), ["chairman_human", "*", "external_anonymous"]);
    // Thứ tự unknown: finance trước sales_new trước ghost_dept
    assert.deepEqual(unknown.map((u) => u.value), ["finance", "sales_new", "ghost_dept"]);
  });

  it("SPECIAL_CLUSTER_REFS khớp đúng với 3 giá trị mong đợi của backend", () => {
    assert.ok(SPECIAL_CLUSTER_REFS.includes("*"));
    assert.ok(SPECIAL_CLUSTER_REFS.includes("chairman_human"));
    assert.ok(SPECIAL_CLUSTER_REFS.includes("external_anonymous"));
    assert.equal(SPECIAL_CLUSTER_REFS.length, 3);
  });

  it("danh sách rỗng → cả 2 kết quả đều rỗng", () => {
    const { specials, unknown } = splitFrameUnmatched([]);
    assert.equal(specials.length, 0);
    assert.equal(unknown.length, 0);
  });

  it("có thể dùng bộ specials tuỳ chỉnh thay vì SPECIAL_CLUSTER_REFS mặc định", () => {
    const input = [
      { value: "custom_special", topics: ["t1"] },
      { value: "chairman_human", topics: ["t2"] },
    ];
    const { specials, unknown } = splitFrameUnmatched(input, ["custom_special"]);
    assert.equal(specials.length, 1);
    assert.equal(specials[0].value, "custom_special");
    assert.equal(unknown.length, 1);
    assert.equal(unknown[0].value, "chairman_human");
  });
});
