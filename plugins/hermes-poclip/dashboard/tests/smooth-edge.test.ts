import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { bowFor, sideLoop, smoothCurve } from "../src/lib/smoothEdge";

describe("smoothEdge — đường nối mềm", () => {
  it("đường cong đi từ điểm đầu đến điểm cuối, tiếp tuyến nằm ngang ở hai đầu, điểm giữa là trung điểm khi không vồng", () => {
    const g = smoothCurve(100, 50, 500, 250);
    assert.ok(g.d.startsWith("M100,50 C") && g.d.endsWith(" 500,250"));
    assert.match(g.d, /^M100,50 C(\d+),50 (\d+),250 500,250$/);          // hai điểm điều khiển cùng độ cao với đầu / cuối: tiếp tuyến ngang
    assert.deepEqual(g.mid, { x: 300, y: 150 });
  });

  it("đi ngược (đích bên trái nguồn) thì điểm điều khiển đảo hướng, vẫn không có góc", () => {
    const g = smoothCurve(500, 50, 100, 50);
    const m = /^M500,50 C(\d+),50 (\d+),50 100,50$/.exec(g.d)!;
    assert.ok(m && Number(m[1]) < 500 && Number(m[2]) > 100);
  });

  it("độ vồng nhấc cả hai điểm điều khiển: đỉnh cung cao 0,75 độ vồng so với đường nối hai đầu", () => {
    const g = smoothCurve(0, 100, 600, 100, -80);
    assert.equal(g.mid.y, 100 - 60);
  });

  it("bowFor: chỉ vồng khi hai ô gần cùng hàng; đi xuôi vồng lên (âm), đi ngược vồng xuống (dương); đỉnh cung vượt mép ô ít nhất 14px", () => {
    const h = 46;
    assert.equal(bowFor(100, 400, true, 0, h), 0);
    const up = bowFor(100, 100, true, 0, h);
    const down = bowFor(100, 100, false, 0, h);
    assert.ok(up < 0 && down > 0);
    assert.ok(Math.abs(up) * 0.75 >= h / 2 + 14 - 1e-9);
    assert.notEqual(bowFor(100, 100, true, 0, h), bowFor(100, 100, true, 1, h));
  });

  it("sideLoop: chữ «C» về bên phải, hai đầu cùng một cạnh, không có đoạn thẳng gấp", () => {
    const g = sideLoop(200, 60, 160, 30);
    assert.equal(g.d, "M200,60 C230,60 230,160 200,160");
    assert.deepEqual(g.mid, { x: 222.5, y: 110 });
  });
});
