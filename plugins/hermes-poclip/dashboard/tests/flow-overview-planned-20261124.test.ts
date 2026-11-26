import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildOverview, MAX_PLANNED_EDGES, type OvRelation } from "../src/lib/flowOverview";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Hướng B (24/11/2026): luồng đã khai báo nhưng chưa có việc nào đi qua được vẽ mờ, nét chấm, cho phòng chưa có đường thật.

const rel = (from: string, to: string, kind: "assign" | "handoff" | "report", count: number): OvRelation => ({ from, to, kind, count });

// Máy 26: Điều hành ở giữa; 8 phòng có việc; 6 phòng phần mềm chưa có việc nào.
const IDS = ["executive", "hr_core", "training", "compliance", "audit", "client", "infra", "security", "design", "engineering", "quality", "product", "product_ops", "learning"];
const REAL: OvRelation[] = [
  rel("executive", "hr_core", "assign", 9), rel("executive", "training", "assign", 9), rel("executive", "compliance", "assign", 9),
  rel("executive", "audit", "assign", 9), rel("executive", "client", "assign", 9), rel("executive", "infra", "assign", 9), rel("executive", "security", "assign", 9),
  rel("training", "compliance", "handoff", 7), rel("compliance", "audit", "assign", 6), rel("security", "infra", "handoff", 4),
];
// Luật đã khai báo ở máy 26: 5 phòng phần mềm nối đủ mọi cặp (thiết kế → … → chất lượng) + gửi rà soát qua Tuân thủ + nhiễu
const PLANNED = [
  { from: "design", to: "engineering" }, { from: "design", to: "product" }, { from: "design", to: "product_ops" }, { from: "design", to: "quality" },
  { from: "engineering", to: "product" }, { from: "engineering", to: "product_ops" }, { from: "engineering", to: "quality" },
  { from: "product", to: "product_ops" }, { from: "product", to: "quality" }, { from: "product_ops", to: "quality" },
  { from: "design", to: "executive" }, { from: "executive", to: "design" },            // nối với trung tâm: không vẽ (đã có chấm xanh)
  { from: "design", to: "compliance" }, { from: "quality", to: "compliance" },          // một đầu đã có đường thật: không vẽ (không phải đường chính)
  { from: "training", to: "compliance" },                                              // cả hai đầu đã có đường thật: không thêm
  { from: "compliance", to: "audit" },                                                 // trùng đường thật: không thêm
];
const SOFT = ["design", "engineering", "product", "product_ops", "quality"];

describe("đường đã khai báo, chưa có việc", () => {
  it("phòng chưa có việc nhưng có luồng khai báo thì rời hàng «chưa có đường» và có đường mờ", () => {
    const L = buildOverview(IDS, REAL, { planned: PLANNED });
    assert.ok(L.edges.filter((e) => e.planned).length >= 4);
    const inCols = new Set(L.cols.flat().map((n) => n.id));
    for (const id of SOFT) assert.ok(inCols.has(id), id);
    const support = L.support.map((n) => n.id);
    assert.ok(support.includes("learning"));   // learning không có luồng khai báo nào tới phòng khác
    for (const id of SOFT) assert.ok(!support.includes(id), id);
  });

  it("rút gọn: nối đủ mọi cặp chỉ còn một chuỗi, bỏ đường tắt", () => {
    const L = buildOverview(IDS, REAL, { planned: PLANNED });
    const keys = L.edges.filter((e) => e.planned).map((e) => `${e.from}>${e.to}`).sort();
    assert.deepEqual(keys, ["design>engineering", "engineering>product", "product>product_ops", "product_ops>quality"]);
  });

  it("không vẽ đường tới/đi từ trung tâm, không trùng đường thật, không vẽ khi có một đầu đã có đường thật", () => {
    const L = buildOverview(IDS, REAL, { planned: PLANNED });
    const keys = L.edges.filter((e) => e.planned).map((e) => `${e.from}>${e.to}`);
    assert.ok(!keys.some((k) => k.includes("executive") || k.includes("compliance") || k.includes("audit")));
    assert.equal(L.edges.filter((e) => !e.planned).length, buildOverview(IDS, REAL).edges.length);
  });

  it("đường thật giữ nguyên khi thêm đường mờ (cùng đường, cùng loại)", () => {
    const base = buildOverview(IDS, REAL).edges.map((e) => `${e.from}>${e.to}:${e.kind}`).sort();
    const withPlanned = buildOverview(IDS, REAL, { planned: PLANNED }).edges.filter((e) => !e.planned).map((e) => `${e.from}>${e.to}:${e.kind}`).sort();
    assert.deepEqual(withPlanned, base);
  });

  it("khi phòng đó có việc thật thì đường mờ nhường chỗ cho đường thật (không vẽ chồng)", () => {
    const rels = [...REAL, rel("design", "engineering", "assign", 2)];
    const L = buildOverview(IDS, rels, { planned: PLANNED });
    const same = L.edges.filter((e) => e.from === "design" && e.to === "engineering");
    assert.equal(same.length, 1);
    assert.equal(same[0].planned, undefined);
  });

  it("việc chảy trái sang phải theo luồng khai báo: Thiết kế → Kỹ thuật → Sản phẩm → Vận hành sản phẩm → Chất lượng", () => {
    const L = buildOverview(IDS, REAL, { planned: PLANNED });
    const col = (id: string) => L.cols.findIndex((c) => c.some((n) => n.id === id));
    for (let i = 0; i + 1 < SOFT.length; i++) assert.ok(col(SOFT[i]) < col(SOFT[i + 1]), `${SOFT[i]} < ${SOFT[i + 1]}`);
  });

  it("rút gọn không làm mất phòng khi có vòng (A→B, B→A, A→C, C→B)", () => {
    const L = buildOverview(["a", "b", "c"], [], { planned: [{ from: "a", to: "b" }, { from: "b", to: "a" }, { from: "a", to: "c" }, { from: "c", to: "b" }] });
    const touched = new Set(L.edges.flatMap((e) => [e.from, e.to]));
    assert.deepEqual([...touched].sort(), ["a", "b", "c"]);
  });

  it("không có luồng khai báo thì kết quả y như trước; công ty chưa có việc nhưng có luồng khai báo vẫn vẽ được", () => {
    assert.deepEqual(buildOverview(IDS, REAL, { planned: [] }), buildOverview(IDS, REAL));
    const L = buildOverview(["a", "b", "c"], [], { planned: [{ from: "a", to: "b" }, { from: "b", to: "c" }] });
    assert.equal(L.edges.length, 2);
    assert.ok(L.edges.every((e) => e.planned));
  });

  it("giới hạn số đường mờ và bỏ qua giá trị rỗng/đúng tên phòng", () => {
    const ids = Array.from({ length: 80 }, (_, i) => `p${i}`);
    const pairs = Array.from({ length: 40 }, (_, i) => ({ from: `p${2 * i}`, to: `p${2 * i + 1}` }));
    const L = buildOverview(ids, [], { planned: [...pairs, { from: null, to: "p1" }, { from: "p1", to: "p1" }, { from: "zz", to: "p1" }] });
    assert.equal(L.edges.length, MAX_PLANNED_EDGES);
  });
});

describe("giao diện: vẽ mờ, chú thích, chữ vi/en", () => {
  const find = (p: string): string => {
    let dir = process.cwd();
    for (let i = 0; i <= 5; i++) {
      const c = path.join(dir, p);
      if (fs.existsSync(c)) return c;
      dir = path.dirname(dir);
    }
    throw new Error(p);
  };
  const map = fs.readFileSync(find("src/components/FlowOverviewMap.tsx"), "utf-8");
  const page = fs.readFileSync(find("src/pages/CompanyFlows.tsx"), "utf-8");

  it("đường mờ: xám, nét chấm, không chuyển động; có chú thích và câu mô tả riêng", () => {
    assert.ok(map.includes("data-ov-planned"));
    assert.ok(map.includes('strokeDasharray="2 5"'));
    const planned = map.slice(map.indexOf("data-ov-planned"), map.indexOf("data-ov-planned") + 520);
    assert.ok(!planned.includes("pc-ov-line"), "đường mờ không dùng lớp chuyển động");
    assert.ok(map.includes("data-ov-legend-planned") && map.includes("P.footNotePlanned") && map.includes("P.selPlanned"));
  });
  it("«nhận việc từ/giao tiếp cho» chỉ tính đường có việc thật", () => {
    assert.ok(map.includes("!e.planned && e.to === sel") && map.includes("!e.planned && e.from === sel"));
  });
  it("trang truyền luồng khai báo (theo bộ lọc cặp phòng) vào sơ đồ", () => {
    assert.ok(page.includes("planned={plannedPairs}"));
    assert.ok(page.includes("frameEdges.filter((fe) => pairVisible(fe.fromRaw, fe.toRaw))"));
  });
  it("chữ tiếng Việt và tiếng Anh đủ cả ba khoá", () => {
    for (const d of [vi, en]) {
      assert.ok(d.flowPathMap.legendPlanned.length > 10 && d.flowPathMap.footNotePlanned.length > 30);
      assert.match(d.flowPathMap.selPlanned("A", "B"), /A/);
      assert.match(d.flowPathMap.selPlanned("", ""), /—/);
    }
    assert.match(vi.flowPathMap.footNotePlanned, /chưa có việc thật/);
  });
});
