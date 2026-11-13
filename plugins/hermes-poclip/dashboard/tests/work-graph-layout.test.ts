import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { NODE_H, NODE_W, assignLayers, layoutWorkGraph, neighbours, nodeLevel, type WGData, type WGEdge, type WGMember } from "../src/lib/workGraphLayout";

const cards = (total = 0, bad = 0, warn = 0) => ({ ok: total - bad - warn, warn, bad, open: 0, running: 0, total });
const mem = (id: string, lead = false): WGMember => ({ id, name: id, role: lead ? "lead" : "worker", lead, cards: cards(1) });
const edge = (from: string, to: string, n = 3, give = n, back = 0): WGEdge => ({ from, to, n, give, back, samples: [] });
const g = (m: Record<string, Map<string, number>>) => new Map(Object.entries(m));

describe("assignLayers", () => {
  it("chuỗi A→B→C: ba cột liên tiếp", () => {
    const l = assignLayers(["A", "B", "C"], g({ A: new Map([["B", 2]]), B: new Map([["C", 1]]) }));
    assert.deepEqual([l.get("A"), l.get("B"), l.get("C")], [0, 1, 2]);
  });

  it("phòng nhận việc từ nhiều phòng nằm sau tất cả các phòng đó (đường dài nhất)", () => {
    const l = assignLayers(["A", "B", "C"], g({ A: new Map([["B", 1], ["C", 1]]), B: new Map([["C", 1]]) }));
    assert.equal(l.get("C"), 2);
  });

  it("vòng lặp A↔B bị cắt một cạnh, không treo", () => {
    const l = assignLayers(["A", "B"], g({ A: new Map([["B", 1]]), B: new Map([["A", 1]]) }));
    assert.deepEqual([l.get("A"), l.get("B")], [0, 1]);
  });

  it("phòng không có đường giao việc nào xếp cột cuối; không có đường nào cả thì cột 0", () => {
    const l = assignLayers(["A", "B", "Z"], g({ A: new Map([["B", 1]]) }));
    assert.equal(l.get("Z"), 2);
    const none = assignLayers(["A", "B"], g({}));
    assert.deepEqual([none.get("A"), none.get("B")], [0, 0]);
  });

  it("phòng được ghim (hệ thống) đứng cột 0 dù có phòng khác cũng là nguồn", () => {
    const l = assignLayers(["A", "_system", "B"], g({ _system: new Map([["B", 1]]), A: new Map([["B", 1]]) }), ["_system"]);
    assert.equal(l.get("_system"), 0);
    assert.equal(l.get("B"), 1);
  });
});

const data = (): WGData => ({
  units: [
    { key: "_system", label: "Hệ thống tự động", members: [mem("sys")] },
    { key: "exec", label: "Điều hành", members: [mem("ceo", true)] },
    { key: "macro", label: "Vĩ mô", members: [mem("macro-lead", true), mem("macro-w")] },
    { key: "tuanthu", label: "Tuân thủ", members: [mem("comp", true)] },
  ],
  edges: [edge("sys", "ceo", 9), edge("ceo", "macro-lead", 5), edge("macro-lead", "macro-w", 4), edge("macro-lead", "ceo", 5, 0, 5), edge("ceo", "comp", 2), edge("sys", "comp", 6)],
});

describe("layoutWorkGraph", () => {
  it("các phòng xếp thành cột theo chiều việc chảy; nhân viên nằm gọn trong khối phòng, không chồng nhau", () => {
    const l = layoutWorkGraph(data(), 1);
    const box = Object.fromEntries(l.units.map((u) => [u.key, u]));
    assert.deepEqual([box._system.layer, box.exec.layer, box.macro.layer], [0, 1, 2]);
    assert.ok(box._system.x < box.exec.x && box.exec.x < box.macro.x);
    for (const n of l.nodes) {
      const b = box[n.unit];
      assert.ok(n.x >= b.x && n.x + NODE_W <= b.x + b.w && n.y >= b.y && n.y + NODE_H <= b.y + b.h, n.id);
    }
    const col = l.nodes.filter((n) => n.unit === "macro").sort((a, b) => a.y - b.y);
    assert.ok(col[1].y >= col[0].y + NODE_H);
    assert.equal(col[0].id, "macro-lead");
  });

  it("đường sang cột liền kề là đường cong từ cổng phải ô đến cổng trái ô", () => {
    const l = layoutWorkGraph(data(), 1);
    const e = l.edges.find((x) => x.key === "sys>ceo")!;
    const a = l.nodes.find((n) => n.id === "sys")!;
    const b = l.nodes.find((n) => n.id === "ceo")!;
    assert.equal(e.lane, "mid");
    assert.ok(e.d.startsWith(`M${a.x + NODE_W},${a.y + NODE_H / 2}`) && e.d.endsWith(`${b.x},${b.y + NODE_H / 2}`));
  });

  it("mọi đường là MỘT đường cong mềm (không góc vuông): nhảy cột vồng phía trên, quay ngược vồng phía dưới, trong cùng phòng là chữ «C» bên phải ô", () => {
    const l = layoutWorkGraph(data(), 1);
    const by = Object.fromEntries(l.edges.map((e) => [e.key, e]));
    assert.equal(by["sys>comp"].lane, "top");           // hệ thống (cột 0) → tuân thủ (cột 2 hoặc 3): nhảy cột
    assert.equal(by["macro-lead>ceo"].lane, "bottom");
    assert.equal(by["macro-lead>macro-w"].lane, "loop");
    assert.ok(l.extraBottom >= 0 && l.extraTop >= 0);
    for (const e of l.edges) {
      assert.match(e.d, /^M[\d.,-]+ C[\d.,\s-]+$/, e.key);          // không còn đoạn thẳng nối góc (L) hay góc bo (Q)
      assert.ok(!e.d.includes(" L") && !e.d.includes("Q"), e.key);
    }
  });

  it("ngưỡng số lần chỉ ẩn đường, không đổi vị trí khối", () => {
    const all = layoutWorkGraph(data(), 1);
    const few = layoutWorkGraph(data(), 6);
    assert.deepEqual(few.units.map((u) => [u.key, u.x, u.y]), all.units.map((u) => [u.key, u.x, u.y]));
    assert.deepEqual(few.edges.map((e) => e.key).sort(), ["sys>ceo", "sys>comp"]);
  });

  it("dữ liệu rỗng không lỗi", () => {
    const l = layoutWorkGraph({ units: [], edges: [] }, 1);
    assert.deepEqual([l.units.length, l.nodes.length, l.edges.length], [0, 0, 0]);
  });
});

describe("neighbours và nodeLevel", () => {
  it("nút được chọn kéo theo các nút nối với nó bằng đường đang hiện", () => {
    const l = layoutWorkGraph(data(), 1);
    const n = neighbours(l.edges, "ceo");
    assert.deepEqual([...n.nodes].sort(), ["ceo", "comp", "macro-lead", "sys"]);
    assert.ok(n.edges.has("sys>ceo") && !n.edges.has("macro-lead>macro-w"));
  });

  it("màu nút: sự cố > cảnh báo > ổn > chưa có việc", () => {
    assert.equal(nodeLevel(cards(3, 1, 1)), "bad");
    assert.equal(nodeLevel(cards(3, 0, 1)), "warn");
    assert.equal(nodeLevel(cards(3)), "ok");
    assert.equal(nodeLevel(cards(0)), "idle");
  });
});

describe("chỉ chiều đi", () => {
  const d = (): WGData => ({
    units: [
      { key: "A", label: "A", members: [mem("a1", true), mem("a2")] },
      { key: "B", label: "B", members: [mem("b1")] },
    ],
    edges: [edge("a1", "b1", 4, 4, 0), edge("b1", "a1", 4, 0, 4), edge("a1", "a2", 3, 3, 0), edge("a2", "a1", 3, 0, 3)],
  });

  it("mặc định (tắt) vẫn hiện đủ cả đường phản hồi", () => {
    assert.equal(layoutWorkGraph(d(), 1).edges.length, 4);
  });

  it("bật: chỉ giữ giao việc tiến sang cột sau và giao việc trong phòng; bỏ đường quay ngược", () => {
    const keys = layoutWorkGraph(d(), 1, true).edges.map((e) => e.key).sort();
    assert.deepEqual(keys, ["a1>a2", "a1>b1"]);
  });
});
