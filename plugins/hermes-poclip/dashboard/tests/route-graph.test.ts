import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { dur, placeRoute, type RouteNode } from "../src/lib/routeLayout";

const node = (id: string, col: number): RouteNode => ({ id, name: id, unit: "", col, cards: 1, done: 1, running: 0, level: "ok", work_median_s: 60, wait_median_s: null });

describe("placeRoute", () => {
  it("mỗi cột một vị trí x tăng dần từ trái sang phải", () => {
    const { pos } = placeRoute([node("a", 0), node("b", 1), node("c", 2)], 3);
    assert.ok(pos.get("a")!.x < pos.get("b")!.x && pos.get("b")!.x < pos.get("c")!.x);
  });

  it("các ô cùng cột xếp dọc, không chồng nhau; cột thấp được căn giữa theo cột cao nhất", () => {
    const { pos, height } = placeRoute([node("a", 0), node("p1", 1), node("p2", 1), node("p3", 1)], 2);
    const ys = ["p1", "p2", "p3"].map((k) => pos.get(k)!.y);
    assert.ok(ys[0] < ys[1] && ys[1] < ys[2]);
    const mid = (pos.get("a")!.y + 25) ;
    assert.ok(Math.abs(mid - (ys[0] + ys[2] + 50) / 2) < 1 && height > ys[2]);
  });
});

describe("dur", () => {
  it("giây, phút, giờ", () => {
    assert.equal(dur(30), "30 giây");
    assert.equal(dur(300), "5 phút");
    assert.equal(dur(7200), "2 giờ 0 phút");
    assert.equal(dur(null), "—");
  });
});
