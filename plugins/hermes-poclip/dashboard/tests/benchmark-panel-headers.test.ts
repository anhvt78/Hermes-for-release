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
  throw new Error(`không thấy ${relPath}`);
}

describe("BenchmarkPanel — gửi danh tính Chủ tịch", () => {
  const src = fs.readFileSync(findSrc("src/components/BenchmarkPanel.tsx"), "utf8");
  it("mọi lệnh ghi (chạy bộ kiểm tra, thêm/tắt câu hỏi) đều kèm X-Member-Id của Chủ tịch — thiếu thì máy chủ trả 403", () => {
    const calls = src.match(/poclipMutate\([\s\S]*?\);/g) ?? [];
    assert.ok(calls.length >= 3);
    for (const c of calls) assert.match(c, /CHAIRMAN_HEADERS/, c.slice(0, 80));
    assert.match(src, /"X-Member-Id":\s*"chu_tich"/);
  });
});
