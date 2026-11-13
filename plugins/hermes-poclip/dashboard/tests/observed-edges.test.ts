import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { NODE_H, NODE_W, layoutProcess } from "../src/lib/mapLayout";
import { layoutObserved, observedLabel } from "../src/lib/observedEdges";

const st = (key: string) => ({ key, branch: false, branch_from: null });
const base = () => layoutProcess([st("a"), st("b"), st("c"), st("d")], null);   // a→b→c→d trên một hàng

describe("layoutObserved — đường đi thực tế", () => {
  it("việc đi đúng đường thiết kế thì không vẽ thêm, chỉ đánh dấu đường thiết kế đã dùng", () => {
    const l = base();
    const o = layoutObserved(l.nodes, [{ from: "a", to: "b", n: 3, kind: "give" }], l.edges, l.height);
    assert.equal(o.paths.length, 0);
    assert.deepEqual([...o.usedDesign], ["a>b"]);
    assert.equal(o.extraTop, 0);
    assert.equal(o.extraBottom, 0);
  });

  it("việc nhảy cóc từ b sang d (bỏ qua c) được vẽ thành MỘT đường cong mềm vồng qua phía trên ô c (không có góc vuông)", () => {
    const l = base();
    const o = layoutObserved(l.nodes, [{ from: "b", to: "d", n: 2, kind: "give" }], l.edges, l.height);
    assert.equal(o.paths.length, 1);
    const p = o.paths[0];
    assert.equal(p.lane, "top");
    assert.equal(p.key, "b>d");
    assert.match(p.d, /^M[\d.,-]+ C[\d.,\s-]+$/);           // đúng một đoạn cong bậc ba, không có đoạn thẳng gấp khúc
    assert.ok(!p.d.includes(" L") && !p.d.includes("Q"));
    // điểm đầu ở cổng phải ô b, điểm cuối ở cổng trái ô d
    const b = l.nodes.find((n) => n.key === "b")!;
    const d = l.nodes.find((n) => n.key === "d")!;
    assert.ok(p.d.startsWith(`M${b.x + NODE_W},${b.y + NODE_H / 2}`));
    assert.ok(p.d.endsWith(`${d.x},${d.y + NODE_H / 2}`));
    assert.ok(p.mid.y < b.y, "đỉnh cung phải cao hơn mép trên của các ô cùng hàng để không chạy ngầm sau ô c");
    assert.ok(o.extraTop >= 0);
  });

  it("việc chảy NGƯỢC (kết quả về lại ô đứng trước) là đường cong vồng qua phía dưới, đi từ cổng trái ô nguồn sang cổng phải ô đích", () => {
    const l = base();
    const o = layoutObserved(l.nodes, [{ from: "d", to: "a", n: 4, kind: "back" }], l.edges, l.height);
    assert.equal(o.paths[0].lane, "bottom");
    const a = l.nodes.find((n) => n.key === "a")!;
    const d = l.nodes.find((n) => n.key === "d")!;
    assert.ok(o.paths[0].d.startsWith(`M${d.x},${d.y + NODE_H / 2}`) && o.paths[0].d.endsWith(`${a.x + NODE_W},${a.y + NODE_H / 2}`));
    assert.ok(o.paths[0].mid.y > d.y + NODE_H, "đỉnh cung phải thấp hơn mép dưới của các ô cùng hàng");
    assert.equal(o.extraBottom, 0);          // cung nằm gọn trong phần đệm của sơ đồ, không cần nới thêm
  });

  it("mô hình trung tâm: ô cuối giao cho các ô trước rồi nhận về — hai chiều của một cặp gộp thành MỘT đường hai đầu mũi tên", () => {
    const l = base();
    const obs = [
      { from: "d", to: "a", n: 5, kind: "give" as const },
      { from: "d", to: "b", n: 4, kind: "give" as const },
      { from: "d", to: "c", n: 3, kind: "give" as const },
      { from: "a", to: "d", n: 5, kind: "back" as const },
      { from: "b", to: "d", n: 2, kind: "back" as const },
    ];
    const o = layoutObserved(l.nodes, obs, l.edges, l.height);
    assert.deepEqual(o.paths.map((p) => p.key).sort(), ["a>d", "b>d", "d>c"]);
    const by = Object.fromEntries(o.paths.map((p) => [p.key, p]));
    // hai chiều: đầu «từ» là ô bên trái; n = số lần trái → phải, nBack = số lần phải → trái
    assert.deepEqual([by["a>d"].both, by["a>d"].n, by["a>d"].nBack], [true, 5, 5]);
    assert.deepEqual([by["b>d"].both, by["b>d"].n, by["b>d"].nBack], [true, 2, 4]);
    // một chiều (d→c; c→d là đường thiết kế nên không vẽ thêm): chạy làn dưới vì đi ngược
    assert.deepEqual([by["d>c"].both, by["d>c"].lane, by["d>c"].n], [false, "bottom", 3]);
    const tops = o.paths.filter((p) => p.lane === "top").map((p) => p.mid.y).sort((x, y) => y - x);
    assert.equal(tops.length, 2);
    assert.notEqual(tops[0], tops[1]);               // hai cung xếp lệch nhau, không chồng khít
    assert.ok(!o.paths.some((p) => p.key === "c>d"));
  });

  it("nhãn: «5» một chiều, «5 ⇄» hai chiều bằng nhau, «2⇄4» hai chiều lệch", () => {
    assert.equal(observedLabel({ n: 5, nBack: 0, both: false }), "5");
    assert.equal(observedLabel({ n: 5, nBack: 5, both: true }), "5 ⇄");
    assert.equal(observedLabel({ n: 2, nBack: 4, both: true }), "2⇄4");
  });

  it("bỏ qua cặp không có trên sơ đồ, cặp tự nối chính nó và số lần không dương", () => {
    const l = base();
    const o = layoutObserved(l.nodes, [{ from: "a", to: "zzz", n: 1, kind: "give" }, { from: "a", to: "a", n: 1, kind: "give" }, { from: "a", to: "c", n: 0, kind: "give" }], l.edges, l.height);
    assert.equal(o.paths.length, 0);
  });

  it("không có dữ liệu thì không thêm đường nào và không nới sơ đồ", () => {
    const l = base();
    for (const v of [undefined, null, []]) {
      const o = layoutObserved(l.nodes, v as never, l.edges, l.height);
      assert.deepEqual([o.paths.length, o.extraTop, o.extraBottom], [0, 0, 0]);
    }
  });
});
