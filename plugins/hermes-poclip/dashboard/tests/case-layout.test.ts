import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { layoutCase } from "../src/lib/caseLayout";
import { NODE_H, NODE_W, PAD, PITCH_X, PITCH_Y } from "../src/lib/mapLayout";

const n = (id: string, column: number, next: string[] = []) => ({ id, column, next: next.map((x) => ({ id: x })) });
const at = (l: ReturnType<typeof layoutCase>, id: string) => l.nodes.find((x) => x.key === id)!;

describe("layoutCase", () => {
  it("cột trái xong trước: x tăng theo thứ tự cột, không phụ thuộc số cột có khoảng trống", () => {
    const l = layoutCase([n("a", 0, ["b"]), n("b", 3, ["c"]), n("c", 7)]);
    assert.deepEqual(l.nodes.map((x) => x.x), [PAD, PAD + PITCH_X, PAD + 2 * PITCH_X]);
  });

  it("việc cùng cột xếp chồng dọc, cột ít việc hơn được căn giữa", () => {
    const l = layoutCase([n("a", 0, ["p", "q"]), n("p", 1, ["z"]), n("q", 1, ["z"]), n("z", 2)]);
    assert.equal(at(l, "q").y - at(l, "p").y, PITCH_Y);
    assert.equal(at(l, "a").y, (at(l, "p").y + at(l, "q").y) / 2);
    assert.equal(at(l, "z").y, at(l, "a").y);
  });

  it("đường nối đi từ việc này sang việc kế tiếp, bỏ việc trỏ tới thẻ không có trong sự vụ và đường trùng", () => {
    const l = layoutCase([n("a", 0, ["b", "b", "khong-co", "a"]), n("b", 1)]);
    assert.deepEqual(l.edges, [{ from: "a", to: "b", kind: "main" }]);
  });

  it("trong một cột, ô xếp theo trung bình vị trí của các việc đứng trước để đường nối ít cắt nhau", () => {
    // cột 1 nhập theo thứ tự y, x; nhưng x do việc phía trên (u) sinh ra còn y do việc phía dưới (d) → x phải đứng trên y
    const l = layoutCase([n("u", 0, ["x"]), n("d", 0, ["y"]), n("y", 1), n("x", 1)]);
    assert.ok(at(l, "x").y < at(l, "y").y);
  });

  it("kích thước bao đủ mọi ô; sự vụ rỗng vẫn có khung tối thiểu", () => {
    const l = layoutCase([n("a", 0, ["b", "c"]), n("b", 1), n("c", 1)]);
    for (const x of l.nodes) assert.ok(x.x + NODE_W <= l.width && x.y + NODE_H <= l.height);
    const e = layoutCase([]);
    assert.deepEqual([e.nodes.length, e.edges.length], [0, 0]);
    assert.ok(e.width > 0 && e.height > 0);
  });
});
