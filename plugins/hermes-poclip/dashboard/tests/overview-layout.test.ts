import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BOX_H, BOX_W, layoutOverview, overviewUnits, wrapTitle, type OvSegment, type OvStage } from "../src/lib/overviewLayout";

const st = (key: string, extra: Partial<OvStage> = {}): OvStage => ({ key, label: key, who: "", count: 0, status: "grey", ...extra });
const KEYS = ["intake", "dispatch", "profile", "data", "fundamental", "technical", "macro", "risk", "sizing", "committee", "synthesis", "editor"];
const SEG: OvSegment[] = [
  { type: "chain", keys: ["intake", "dispatch", "profile", "data"] },
  { type: "parallel", branches: [["fundamental"], ["technical"], ["macro"]] },
  { type: "chain", keys: ["risk", "sizing", "committee", "synthesis", "editor"] },
];

describe("overviewLayout — sơ đồ tổng quan một chiều", () => {
  it("các bước song song gộp thành MỘT ô nhóm, các bước nối tiếp mỗi bước một ô", () => {
    const u = overviewUnits(KEYS.map((k) => st(k)), SEG);
    assert.deepEqual(u.map((x) => x.length), [1, 1, 1, 1, 3, 1, 1, 1, 1, 1]);
    assert.deepEqual(u[4], ["fundamental", "technical", "macro"]);
  });

  it("xếp thành hai hàng khi 5 ô mỗi hàng; mọi bước xuất hiện đúng một lần", () => {
    const l = layoutOverview(KEYS.map((k) => st(k)), SEG, 5);
    assert.equal(l.boxes.length, 10);
    assert.deepEqual([...new Set(l.boxes.map((b) => b.row))], [0, 1]);
    const keys = l.boxes.flatMap((b) => b.keys).sort();
    assert.deepEqual(keys, [...KEYS].sort());
    assert.equal(l.boxes.filter((b) => b.group).length, 1);
  });

  it("đường nối: mỗi ô nối với ô kế tiếp, đi một chiều (tổng số đường = số ô - 1), đường qua hàng có ba đoạn", () => {
    const l = layoutOverview(KEYS.map((k) => st(k)), SEG, 5);
    assert.equal(l.arrows.length, l.boxes.length - 1);
    const wrap = l.arrows.filter((d) => d.split("L").length === 4);
    assert.equal(wrap.length, 1);
    for (const d of l.arrows.filter((x) => x.split("L").length === 2)) {
      const [a, b] = d.replace("M", "").split(" L").map((p) => p.split(",").map(Number));
      assert.ok(b[0] > a[0] && a[1] === b[1], d);              // chỉ đi sang phải, ngang hàng
    }
  });

  it("ô nhóm cao hơn ô đơn, các ô cùng hàng canh giữa theo chiều dọc và không chồng nhau", () => {
    const l = layoutOverview(KEYS.map((k) => st(k)), SEG, 5);
    const g = l.boxes.find((b) => b.group)!;
    assert.ok(g.h > BOX_H);
    const row0 = l.boxes.filter((b) => b.row === 0);
    const mid = (b: { y: number; h: number }) => b.y + b.h / 2;
    assert.ok(row0.every((b) => Math.abs(mid(b) - mid(g)) < 1e-6));
    for (let i = 1; i < row0.length; i++) assert.ok(row0[i].x >= row0[i - 1].x + BOX_W);
    for (const b of l.boxes) assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= l.width && b.y + b.h <= l.height);
  });

  it("không có sơ đồ nối tiếp-song song thì mỗi bước một ô theo thứ tự; bước rẽ nhánh không vẽ; bước thiếu trong sơ đồ nối vào cuối", () => {
    const u = overviewUnits([st("a"), st("b"), st("x", { branch: true }), st("c")], undefined);
    assert.deepEqual(u, [["a"], ["b"], ["c"]]);
    const u2 = overviewUnits([st("a"), st("b"), st("c")], [{ type: "chain", keys: ["b"] }]);
    assert.deepEqual(u2, [["b"], ["a"], ["c"]]);
  });

  it("một nhánh song song duy nhất thành ô đơn; danh sách rỗng không lỗi", () => {
    assert.deepEqual(overviewUnits([st("a"), st("b")], [{ type: "parallel", branches: [["a"]] }, { type: "chain", keys: ["b"] }]), [["a"], ["b"]]);
    const l = layoutOverview([], null);
    assert.deepEqual([l.boxes.length, l.arrows.length], [0, 0]);
  });
});

describe("wrapTitle — tên giai đoạn tối đa hai dòng", () => {
  it("ngắn thì một dòng; dài thì ngắt ở dấu cách, dòng hai cắt khi vẫn dài", () => {
    assert.deepEqual(wrapTitle("Vĩ mô"), ["Vĩ mô"]);
    const two = wrapTitle("Điều phối và gửi trả lời");
    assert.equal(two.length, 2);
    assert.equal(two.join(" "), "Điều phối và gửi trả lời");
    const long = wrapTitle("Quy mô vị thế, thuế và kỷ luật của từng người hỏi");
    assert.equal(long.length, 2);
    assert.ok(long.every((x) => x.length <= 21) && long[1].endsWith("…"));
  });
});
