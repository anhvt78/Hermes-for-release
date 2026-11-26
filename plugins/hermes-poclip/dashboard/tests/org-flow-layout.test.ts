import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LAYOUTS, layoutTree, type LayoutNode } from "../src/lib/org-flow-layout";

// Xếp sơ đồ tổ chức NGANG cho React Flow (23/11/2026): chiều rộng theo số cấp, không theo số phòng

const leaf = (id: string): LayoutNode => ({ id, children: [] });
const tree: LayoutNode[] = [{
  id: "chu_tich",
  children: [
    leaf("audit"),
    { id: "ceo", children: [
      { id: "lead-a", children: [leaf("a1"), leaf("a2"), leaf("a3")] },
      { id: "lead-b", children: [leaf("b1")] },
      leaf("lead-c"),
    ] },
  ],
}];
const { nodeW, nodeH, gapX, gapY } = LAYOUTS.LR;

describe("layoutTree", () => {
  it("mỗi cấp một cột; mỗi lá một hàng; nút cha đứng giữa các con", () => {
    const r = layoutTree(tree, new Set(), "LR");
    assert.equal(r.rows, 6);                                   // a1 a2 a3 b1 lead-c + audit
    assert.equal(r.positions.get("chu_tich")!.x, 0);
    assert.equal(r.positions.get("ceo")!.x, nodeW + gapX);
    assert.equal(r.positions.get("a2")!.x, 3 * (nodeW + gapX));
    assert.equal(r.width, 3 * (nodeW + gapX) + nodeW);          // chỉ 4 cột dù có nhiều phòng
    const ys = ["a1", "a2", "a3"].map((i) => r.positions.get(i)!.y);
    assert.equal(r.positions.get("lead-a")!.y, ys[1]);          // đứng giữa ba con
    assert.equal(r.height, 5 * (nodeH + gapY) + nodeH);
  });

  it("nhánh thu gọn chỉ chiếm một hàng và không có đường nối xuống con", () => {
    const r = layoutTree(tree, new Set(["lead-a"]), "LR");
    assert.equal(r.rows, 4);
    assert.equal(r.positions.has("a1"), false);
    assert.equal(r.edges.some((e) => e.source === "lead-a"), false);
    assert.equal(r.edges.some((e) => e.source === "ceo" && e.target === "lead-a"), true);
  });

  it("đường nối đủ cho mọi nút đang hiện; nhiều gốc xếp chồng nhau; rỗng không lỗi", () => {
    const r = layoutTree(tree, new Set(), "LR");
    assert.equal(r.edges.length, r.positions.size - 1);
    const two = layoutTree([leaf("x"), leaf("y")], new Set(), "LR");
    assert.equal(two.positions.get("y")!.y, nodeH + gapY);
    const none = layoutTree([], new Set());
    assert.deepEqual([none.rows, none.width, none.height], [0, 0, 0]);
  });

  it("DỌC (máy tính): cây ở các cấp trên; từ trưởng phòng trở xuống nhân viên xếp thành MỘT CỘT dưới trưởng phòng (rộng chỉ bằng số phòng)", () => {
    const tb = LAYOUTS.TB;
    const r = layoutTree(tree, new Set(), "TB");
    const stepD = tb.nodeH + tb.gapY;
    const stackStep = tb.nodeH + tb.stackGap;
    assert.equal(r.positions.get("chu_tich")!.y, 0);
    assert.equal(r.positions.get("ceo")!.y, stepD);
    assert.equal(r.positions.get("lead-a")!.y, 2 * stepD);
    // 4 cột: audit + 3 phòng (nhân viên KHÔNG thêm cột)
    assert.equal(r.rows, 4);
    assert.equal(r.width, 3 * (tb.nodeW + tb.gapX) + tb.nodeW);
    const a = r.positions.get("lead-a")!;
    ["a1", "a2", "a3"].forEach((id, k) => {
      const p = r.positions.get(id)!;
      assert.equal(p.x, a.x + tb.indent);                   // thụt vào một đoạn
      assert.equal(p.y, a.y + (k + 1) * stackStep);          // xếp dọc dưới trưởng phòng
      assert.equal(r.stacked.get(id), 1);
    });
    assert.equal(r.height, a.y + 3 * stackStep + tb.nodeH);
    // đường nối: ba người trong cột nối từ cạnh trái trưởng phòng; phần cây nối bình thường
    assert.equal(r.edges.filter((e) => e.stack).length, 4);  // a1 a2 a3 b1
    assert.equal(r.edges.find((e) => e.target === "ceo")!.stack, false);
  });

  it("DỌC: thu gọn một phòng thì cột nhân viên biến mất, chiều cao co lại", () => {
    const open = layoutTree(tree, new Set(), "TB");
    const shut = layoutTree(tree, new Set(["lead-a"]), "TB");
    assert.equal(shut.positions.has("a1"), false);
    assert.ok(shut.height < open.height);
    assert.equal(shut.edges.some((e) => e.source === "lead-a"), false);
  });

  it("cha đứng THẲNG HÀNG với con chiếm hơn nửa số người bên dưới (Chủ tịch ngay trên CEO); nếu không thì ở giữa các con", () => {
    const tb = layoutTree(tree, new Set(), "TB");
    assert.equal(tb.positions.get("chu_tich")!.x, tb.positions.get("ceo")!.x);          // CEO chiếm gần hết công ty
    const lr = layoutTree(tree, new Set(), "LR");
    assert.equal(lr.positions.get("chu_tich")!.y, lr.positions.get("ceo")!.y);
    // CEO có 3 con cân nhau (trưởng phòng a có 4 nút, b 2, c 1) → a chiếm 4/7 > một nửa → CEO thẳng hàng với phòng a
    assert.equal(tb.positions.get("ceo")!.x, tb.positions.get("lead-a")!.x);
    // hai con cân nhau → ở giữa
    const even = layoutTree([{ id: "r", children: [leaf("p"), leaf("q")] }], new Set(), "TB");
    assert.equal(even.positions.get("r")!.x, (even.positions.get("p")!.x + even.positions.get("q")!.x) / 2);
  });
});
