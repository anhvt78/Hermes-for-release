import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { NODE_H, NODE_W, PITCH_X, PITCH_Y, edgeGeom, edgeLevel, findRoute, layoutProcess, pathEdgeKeys, type MapSegmentIn } from "../src/lib/mapLayout";

const st = (key: string, branch = false, branch_from: string | null = null) => ({ key, branch, branch_from });
const at = (l: ReturnType<typeof layoutProcess>, k: string) => l.nodes.find((n) => n.key === k)!;

describe("layoutProcess", () => {
  it("không có sơ đồ: các bước chính nằm trên một hàng, nối ngang theo thứ tự", () => {
    const l = layoutProcess([st("a"), st("b"), st("c")], null);
    assert.deepEqual(l.nodes.map((n) => [n.key, n.y]), [["a", 40], ["b", 40], ["c", 40]]);
    assert.deepEqual(l.edges.map((e) => `${e.from}>${e.to}:${e.kind}`), ["a>b:main", "b>c:main"]);
    assert.equal(at(l, "b").x - at(l, "a").x, PITCH_X);
  });

  it("rẽ nhánh nằm NGAY DƯỚI bước gốc và nối thẳng đứng (không xiên)", () => {
    const l = layoutProcess([st("wait"), st("run"), st("done"), st("blocked", true, "run")], null);
    const run = at(l, "run");
    const blk = at(l, "blocked");
    assert.equal(blk.x, run.x);
    assert.equal(blk.y, run.y + PITCH_Y);
    const g = edgeGeom(l.nodes, l.edges.find((e) => e.kind === "branch")!)!;
    assert.equal(g.d, `M${run.x + NODE_W / 2},${run.y + NODE_H} L${run.x + NODE_W / 2},${blk.y}`);
  });

  it("nhánh song song xếp chồng quanh hàng chính, vào/ra đúng các bước nối tiếp", () => {
    const layout: MapSegmentIn[] = [{ type: "chain", keys: ["a"] }, { type: "parallel", branches: [["p1"], ["p2", "p3"]] }, { type: "chain", keys: ["z"] }];
    const l = layoutProcess([st("a"), st("p1"), st("p2"), st("p3"), st("z")], layout);
    assert.equal(at(l, "p1").y + PITCH_Y, at(l, "p2").y);
    assert.equal(at(l, "p3").x, at(l, "p2").x + PITCH_X);
    assert.equal(at(l, "a").y, (at(l, "p1").y + at(l, "p2").y) / 2);
    assert.equal(at(l, "z").x, at(l, "p3").x + PITCH_X);
    const names = l.edges.map((e) => `${e.from}>${e.to}`).sort();
    assert.deepEqual(names, ["a>p1", "a>p2", "p1>z", "p2>p3", "p3>z"]);
  });

  it("bước chính hàng chính luôn cùng một y (đường ngang thẳng) khi không có song song", () => {
    const l = layoutProcess([st("a"), st("b"), st("c"), st("x", true, "b")], [{ type: "chain", keys: ["a", "b", "c"] }]);
    assert.equal(new Set(l.nodes.filter((n) => !n.branch).map((n) => n.y)).size, 1);
  });

  it("nhánh rẽ từ một bước trong cột song song đẩy ô phía dưới xuống để không bị đường nối cắt qua", () => {
    const layout: MapSegmentIn[] = [{ type: "parallel", branches: [["p1"], ["p2"]] }];
    const l = layoutProcess([st("p1"), st("p2"), st("x", true, "p1")], layout);
    assert.equal(at(l, "x").x, at(l, "p1").x);
    assert.equal(at(l, "x").y, at(l, "p1").y + PITCH_Y);
    assert.ok(at(l, "p2").y >= at(l, "x").y + PITCH_Y);
  });

  it("nhánh rẽ không rõ bước gốc rơi về bước chính cuối; sơ đồ sai khoá thì bỏ khoá thừa và thêm khoá thiếu", () => {
    const l = layoutProcess([st("a"), st("b"), st("orphan", true, "khong-co")], [{ type: "chain", keys: ["a", "ghost"] }]);
    assert.equal(at(l, "orphan").x, at(l, "b").x);
    assert.deepEqual(l.nodes.map((n) => n.key).sort(), ["a", "b", "orphan"]);
    assert.ok(l.edges.some((e) => e.from === "a" && e.to === "b"));
  });

  it("hai nhánh cùng một bước gốc xếp chồng nối tiếp xuống dưới", () => {
    const l = layoutProcess([st("a"), st("x", true, "a"), st("y", true, "a")], null);
    assert.equal(at(l, "x").y, at(l, "a").y + PITCH_Y);
    assert.equal(at(l, "y").y, at(l, "a").y + 2 * PITCH_Y);
  });

  it("kích thước bao đủ mọi ô", () => {
    const l = layoutProcess([st("a"), st("b"), st("x", true, "a")], null);
    for (const n of l.nodes) {
      assert.ok(n.x + NODE_W <= l.width && n.y + NODE_H <= l.height);
    }
  });
});

describe("edgeGeom — đường dài không xuyên qua ô ở cột giữa", () => {
  const layout: MapSegmentIn[] = [{ type: "chain", keys: ["a"] }, { type: "parallel", branches: [["p1"], ["p2", "p3"]] }, { type: "chain", keys: ["z"] }];
  const l = layoutProcess([st("a"), st("p1"), st("p2"), st("p3"), st("z")], layout);

  it("đường từ nhánh ngắn tới ô nối sau nhánh dài chạy ngang theo hàng của nó rồi mới uốn vào ô đích", () => {
    const e = l.edges.find((x) => x.from === "p1" && x.to === "z")!;
    const g = edgeGeom(l.nodes, e)!;
    const p1 = at(l, "p1");
    const z = at(l, "z");
    const y1 = p1.y + NODE_H / 2;
    assert.ok(g.d.startsWith(`M${p1.x + NODE_W},${y1} L`));
    const horizontalEnd = Number(g.d.split(" L")[1].split(",")[0]);
    assert.ok(horizontalEnd > at(l, "p3").x, "đoạn ngang phải đi qua hết cột có ô p3");
    assert.ok(horizontalEnd <= z.x);
  });

  it("đường nối giữa hai cột liền kề vẫn là đường cong thường", () => {
    const g = edgeGeom(l.nodes, l.edges.find((x) => x.from === "a" && x.to === "p1")!)!;
    assert.ok(g.d.includes(" C"));
    assert.ok(!g.d.includes(" L"));
  });

  it("đường nằm ngang thẳng (cùng hàng) không bị đổi dạng", () => {
    const g = edgeGeom(l.nodes, l.edges.find((x) => x.from === "p3" && x.to === "z")!)!;
    assert.ok(g.d.startsWith("M"));
  });
});

describe("findRoute / edgeLevel", () => {
  const edges = layoutProcess([st("wait"), st("run"), st("review"), st("done"), st("blocked", true, "run")], null).edges;
  it("tìm đường đi qua các bước trung gian; đường rẽ nhánh đi được cả hai chiều", () => {
    assert.deepEqual(findRoute(edges, "run", "done"), [{ key: "run>review", reverse: false }, { key: "review>done", reverse: false }]);
    assert.deepEqual(findRoute(edges, "run", "blocked"), [{ key: "run>blocked", reverse: false }]);
    assert.deepEqual(findRoute(edges, "blocked", "run"), [{ key: "run>blocked", reverse: true }]);
    assert.deepEqual(findRoute(edges, "done", "wait"), []);
    assert.deepEqual(findRoute(edges, "run", "run"), []);
  });
  it("không cảnh báo thì dòng chảy thông suốt: đường vào một bước trống vẫn xanh nếu quy trình có việc", () => {
    assert.equal(edgeLevel({ status: "grey" }, true), "ok");
    assert.equal(edgeLevel({ status: "green" }, true), "ok");
    assert.equal(edgeLevel({ status: "grey" }, false), "idle");        // cả quy trình chưa có việc nào
  });
  it("đỏ/vàng chỉ khi bước đích có sự cố/cảnh báo", () => {
    assert.equal(edgeLevel({ status: "red" }, true), "bad");
    assert.equal(edgeLevel({ status: "yellow" }, true), "warn");
    assert.equal(edgeLevel({ status: "red" }, false), "bad");
  });
  it("đường rẽ nhánh chỉ có màu khi nhánh có việc", () => {
    assert.equal(edgeLevel({ status: "grey" }, true, "branch"), "idle");
    assert.equal(edgeLevel({ status: "red" }, true, "branch"), "bad");
    assert.equal(edgeLevel({ status: "green" }, true, "branch"), "ok");
  });
});

describe("pathEdgeKeys", () => {
  const edges = layoutProcess([st("wait"), st("run"), st("review"), st("done"), st("blocked", true, "run")], null).edges;
  it("nối các bước việc đã đi qua theo thứ tự", () => {
    assert.deepEqual([...pathEdgeKeys(edges, ["wait", "run", "review"])].sort(), ["review>done".replace("review>done", "run>review"), "wait>run"].sort());
  });
  it("việc bị chặn rồi được gỡ đi qua đường rẽ nhánh cả hai chiều, mỗi đường chỉ tính một lần", () => {
    assert.deepEqual([...pathEdgeKeys(edges, ["wait", "run", "blocked", "run", "done"])].sort(), ["review>done", "run>blocked", "run>review", "wait>run"]);
  });
  it("chưa đi qua bước nào hoặc chỉ một bước thì không có đường nối nào", () => {
    assert.equal(pathEdgeKeys(edges, []).size, 0);
    assert.equal(pathEdgeKeys(edges, ["run"]).size, 0);
  });
});
