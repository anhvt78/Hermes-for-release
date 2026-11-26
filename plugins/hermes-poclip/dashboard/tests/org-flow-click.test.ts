// Sơ đồ tổ chức: bấm chuột thật vào một ô phải mở được chi tiết.
// Thư viện React Flow đặt pointer-events:none cho ô không «chọn được / kéo được / có onNodeClick» → ô không nhận chuột (bấm bằng mã vẫn chạy, bấm thật thì không).
// Bài kiểm tra này giữ cho sơ đồ luôn khai báo onNodeClick.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không tìm thấy ${relPath}`);
}

const src = fs.readFileSync(findSrc("src/components/OrgFlow.tsx"), "utf-8");

describe("OrgFlow: bấm vào ô", () => {
  it("khai báo onNodeClick ở cấp sơ đồ để ô nhận chuột", () => {
    assert.match(src, /onNodeClick=\{\(_e, node\) => onSelect\(node\.id\)\}/);
  });
  it("không còn nút tròn mở/thu ở đáy ô", () => {
    assert.ok(!src.includes("data-branch-toggle"));
  });
});
