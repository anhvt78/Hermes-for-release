import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOverview, pickHub, type OvRelation } from "../src/lib/flowOverview";

// Số liệu thật trích từ máy 218 (30 ngày, 22/11/2026): các đường giữa phòng với phòng có từ 3 việc, cộng đường nối với Điều hành.
const IDS = ["executive", "client_advisory", "market_data", "fundamental_research", "technical_research", "macro_strategy", "risk_management", "portfolio_execution", "report_synthesis", "compliance", "audit", "training", "hr_core", "infrastructure_ops"];
const ANALYSTS = ["market_data", "fundamental_research", "technical_research", "macro_strategy", "risk_management", "portfolio_execution"];
const rel = (from: string, to: string, kind: "assign" | "handoff" | "report", count: number): OvRelation => ({ from, to, kind, count });

const REAL: OvRelation[] = [
  rel("technical_research", "report_synthesis", "handoff", 22), rel("compliance", "client_advisory", "handoff", 15),
  rel("macro_strategy", "report_synthesis", "handoff", 14), rel("report_synthesis", "compliance", "handoff", 11),
  rel("market_data", "report_synthesis", "handoff", 11), rel("fundamental_research", "report_synthesis", "handoff", 11),
  rel("risk_management", "report_synthesis", "handoff", 11), rel("portfolio_execution", "report_synthesis", "handoff", 11),
  rel("client_advisory", "report_synthesis", "assign", 10), rel("client_advisory", "compliance", "assign", 9),
  rel("compliance", "client_advisory", "assign", 8), rel("client_advisory", "market_data", "assign", 7),
  rel("client_advisory", "fundamental_research", "assign", 7), rel("client_advisory", "macro_strategy", "assign", 7),
  rel("client_advisory", "risk_management", "assign", 7), rel("training", "compliance", "handoff", 7),
  rel("client_advisory", "technical_research", "assign", 6), rel("client_advisory", "portfolio_execution", "assign", 6),
  rel("compliance", "audit", "assign", 6), rel("training", "compliance", "assign", 5), rel("compliance", "audit", "handoff", 5),
  rel("fundamental_research", "market_data", "assign", 4), rel("fundamental_research", "market_data", "handoff", 4), rel("market_data", "macro_strategy", "handoff", 4),
  rel("audit", "compliance", "assign", 2), rel("audit", "compliance", "handoff", 2),
  // «báo cáo» (leo thang) không phải đường đi của việc
  rel("technical_research", "client_advisory", "report", 4),
  // nối với Điều hành: phòng nào cũng có
  ...IDS.filter((i) => i !== "executive").map((i) => rel("executive", i, "assign", 9)),
];

describe("Sơ đồ đường đi của việc: xếp vị trí tự động (22/11/2026)", () => {
  it("nhận ra trung tâm là phòng nối với hầu hết các phòng khác; không có thì null", () => {
    assert.equal(pickHub(IDS, REAL), "executive");
    assert.equal(pickHub(["a", "b", "c", "d"], [rel("a", "b", "assign", 9), rel("c", "d", "assign", 9)]), null);
    assert.equal(pickHub([], []), null);
  });

  it("phòng chưa có việc nào không tính vào mẫu số khi tìm trung tâm (máy 26: 8 phòng có việc + 6 phòng trống)", () => {
    const ids = ["executive", "hr_core", "training", "compliance", "security", "client", "audit", "infra", "d1", "d2", "d3", "d4", "d5", "d6"];
    const rels = [
      rel("executive", "compliance", "assign", 9), rel("executive", "client", "assign", 9), rel("executive", "audit", "assign", 9),
      rel("executive", "infra", "assign", 9), rel("executive", "training", "assign", 9), rel("executive", "hr_core", "assign", 9),
      rel("compliance", "executive", "handoff", 9), rel("hr_core", "compliance", "assign", 9), rel("compliance", "audit", "handoff", 9),
    ];
    assert.equal(pickHub(ids, rels), "executive");
    const L = buildOverview(ids, rels);
    assert.equal(L.hub, "executive");
    assert.ok(L.edges.every((e) => e.from !== "executive" && e.to !== "executive"));
    assert.deepEqual(L.support.map((n) => n.id).filter((i) => i.startsWith("d")).length, 6);
  });

  it("số liệu thật: Khách hàng đứng đầu, 6 phòng phân tích kế tiếp, rồi Báo cáo → Tuân thủ", () => {
    const L = buildOverview(IDS, REAL);
    assert.equal(L.hub, "executive");
    const col = (id: string) => L.cols.findIndex((c) => c.some((n) => n.id === id));
    for (const a of ANALYSTS) assert.equal(col(a), col("client_advisory") + 1, a);
    assert.equal(col("report_synthesis"), col("client_advisory") + 2);
    assert.equal(col("compliance"), col("report_synthesis") + 1);
    assert.equal(col("audit"), col("compliance") + 1);
  });

  it("đường ngang hàng giữa hai phòng cùng bước (cùng nhận từ một phòng, cùng chuyển cho một phòng) không được vẽ và không kéo phòng nào sang cột khác", () => {
    const L = buildOverview(["s", "b", "c", "d", "p", "q", "r", "t"], [rel("s", "b", "assign", 9), rel("s", "c", "assign", 9), rel("b", "d", "handoff", 9), rel("c", "d", "handoff", 9), rel("b", "c", "assign", 9), rel("p", "q", "assign", 9), rel("q", "r", "assign", 9), rel("r", "t", "assign", 9)]);
    assert.ok(!L.edges.some((e) => e.from === "b" && e.to === "c"));
    const col = (id: string) => L.cols.findIndex((c) => c.some((n) => n.id === id));
    assert.equal(col("b"), col("c"));
    assert.equal(L.edges.length, 7);
  });

  it("cùng một thẻ vừa là giao việc vừa là chuyển kết quả không bị đếm hai lần (4 + 4 vẫn dưới ngưỡng 6)", () => {
    assert.equal(buildOverview(["a", "b"], [rel("a", "b", "assign", 4), rel("a", "b", "handoff", 4)], { minItems: 6 }).edges.length, 0);
    assert.equal(buildOverview(["a", "b"], [rel("a", "b", "assign", 6), rel("a", "b", "handoff", 4)], { minItems: 6 }).edges.length, 1);
  });

  it("khoảng thời gian ngắn ít việc: ngưỡng tự hạ để vẫn vẽ được; đủ đường thì giữ ngưỡng 6", () => {
    const few = [rel("a", "b", "assign", 2), rel("b", "c", "handoff", 2), rel("c", "d", "handoff", 1)];
    assert.equal(buildOverview(["a", "b", "c", "d", "e", "f", "g", "h"], few).edges.length, 3);
    const L = buildOverview(IDS, REAL);
    assert.ok(!L.edges.some((e) => e.from === "audit" && e.to === "compliance"), "số liệu 30 ngày đủ đường nên vẫn giữ ngưỡng 6");
  });

  it("phòng có đường vòng dưới (Báo cáo nhận từ Khách hàng) nằm cuối cột, để dây không cắt qua hộp khác", () => {
    const L = buildOverview(IDS, REAL);
    const c = L.cols.find((x) => x.some((n) => n.id === "report_synthesis"))!;
    assert.equal(c[c.length - 1].id, "report_synthesis");
  });

  it("đường khép vòng Tuân thủ → Khách hàng vẽ vòng phía trên; Khách hàng → Báo cáo (nhảy cột) vẽ vòng phía dưới", () => {
    const L = buildOverview(IDS, REAL);
    const e = (f: string, t: string) => L.edges.find((x) => x.from === f && x.to === t);
    assert.equal(e("compliance", "client_advisory")?.route, "over");
    assert.equal(e("client_advisory", "report_synthesis")?.route, "under");
    assert.equal(e("client_advisory", "market_data")?.route, "forward");
    assert.equal(e("client_advisory", "market_data")?.kind, "assign");
    assert.equal(e("market_data", "report_synthesis")?.kind, "handoff");
  });

  it("không có đường nào chạm trung tâm, không có đường «báo cáo», mọi phòng chỉ xuất hiện đúng một chỗ", () => {
    const L = buildOverview(IDS, REAL);
    assert.ok(L.edges.every((x) => x.from !== "executive" && x.to !== "executive"));
    assert.ok(!L.edges.some((x) => x.from === "technical_research" && x.to === "client_advisory"));
    const seen = [...L.cols.flat(), ...L.support].map((n) => n.id);
    assert.equal(new Set(seen).size, seen.length);
    assert.deepEqual([...seen].sort(), IDS.filter((i) => i !== "executive").sort());
  });

  it("mọi phòng có làm việc với trung tâm đều được đánh dấu", () => {
    const L = buildOverview(IDS, REAL);
    assert.ok([...L.cols.flat(), ...L.support].every((n) => n.hubLink));
  });

  it("đường quá ít việc bị bỏ; phòng chỉ có đường nhỏ xuống hàng hỗ trợ chứ không lọt vào giữa các cột", () => {
    const rels = [rel("a", "b", "assign", 9), rel("b", "c", "handoff", 8), rel("c", "d", "handoff", 1), rel("e", "d", "assign", 6), rel("x", "y", "assign", 1)];
    const L = buildOverview(["a", "b", "c", "d", "e", "x", "y", "z"], rels, { minItems: 6 });
    const has = (f: string, t: string) => L.edges.some((e) => e.from === f && e.to === t);
    assert.ok(has("a", "b") && has("b", "c") && has("e", "d"));
    assert.ok(!has("c", "d") && !has("x", "y"));
    assert.deepEqual(L.support.map((n) => n.id).sort(), ["x", "y", "z"]);
  });

  it("số liệu thật: Nhân sự và Hạ tầng (chỉ có đường nhỏ) nằm ở hàng hỗ trợ, Đào tạo đứng cạnh Báo cáo", () => {
    const withSmall = [...REAL, rel("compliance", "infrastructure_ops", "handoff", 3), rel("training", "hr_core", "handoff", 3)];
    const L = buildOverview(IDS, withSmall);
    assert.deepEqual(L.support.map((n) => n.id).sort(), ["hr_core", "infrastructure_ops"]);
    const col = (id: string) => L.cols.findIndex((c) => c.some((n) => n.id === id));
    assert.equal(col("training"), col("report_synthesis"));
  });

  it("phòng không có đường nào xuống hàng «hỗ trợ»; không có dữ liệu thì không vỡ", () => {
    const L = buildOverview(["a", "b", "z"], [rel("a", "b", "assign", 9)]);
    assert.deepEqual(L.support.map((n) => n.id), ["z"]);
    const empty = buildOverview(["a", "b"], []);
    assert.equal(empty.cols.length, 0);
    assert.equal(empty.edges.length, 0);
    assert.deepEqual(empty.support.map((n) => n.id), ["a", "b"]);
  });

  it("vòng khép kín giữa hai phòng không làm treo; đường ngược thành vòng trên", () => {
    const L = buildOverview(["a", "b"], [rel("a", "b", "assign", 9), rel("b", "a", "handoff", 8)]);
    assert.equal(L.edges.length, 2);
    assert.equal(L.edges.find((e) => e.from === "a")?.route, "forward");
    assert.equal(L.edges.find((e) => e.from === "b")?.route, "over");
  });
});
