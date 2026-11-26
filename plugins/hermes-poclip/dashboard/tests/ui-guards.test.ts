// Rào chắn quy ước giao diện — quét mã nguồn, thất bại nếu ai đó (hoặc công cụ sinh mã) làm lại điều đã bỏ:
//   1. Không dùng hộp thoại của trình duyệt (confirm/alert/prompt) — dùng confirmDialog/alertDialog/promptDialog.
//   2. Hộp thoại/lớp phủ KHÔNG được đóng khi bấm ra ngoài vùng hộp thoại: chỉ đóng bằng nút (hoặc Esc ở hộp xác nhận).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(SRC).filter((p) => !p.includes(`${join("src", "i18n")}`));

describe("quy ước giao diện (quét mã)", () => {
  it("tìm thấy mã nguồn để quét", () => {
    assert.ok(files.length > 10, `chỉ thấy ${files.length} tệp trong ${SRC}`);
  });

  it("không có confirm()/alert()/prompt() của trình duyệt (ngoài lib/confirm.ts dùng làm phương án dự phòng)", () => {
    const re = /(^|[^.\w$])(?:window\.)?(?:confirm|alert|prompt)\(/;
    const bad: string[] = [];
    for (const f of files) {
      if (f.endsWith(join("lib", "confirm.ts"))) continue;
      readFileSync(f, "utf-8").split("\n").forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
        if (/function (confirm|alert|prompt)\(/.test(line)) return; // hàm cục bộ trùng tên, không phải của trình duyệt
        if (re.test(line)) bad.push(`${relative(SRC, f)}:${i + 1}: ${t.slice(0, 90)}`);
      });
    }
    assert.deepEqual(bad, [], "dùng await confirmDialog({...}) thay cho hộp thoại hệ thống:\n" + bad.join("\n"));
  });

  it("hộp xác nhận (ConfirmHost) có z-index cao hơn MỌI hộp thoại khác — không thì nó hiện sau hộp thoại và nút Lưu \"không phản ứng\"", () => {
    let confirmZ = 0;
    let otherMax = 0;
    for (const f of files) {
      const isHost = f.endsWith(join("components", "ConfirmHost.tsx"));
      for (const m of readFileSync(f, "utf-8").matchAll(/zIndex:\s*(\d+)/g)) {
        const z = Number(m[1]);
        if (isHost) confirmZ = Math.max(confirmZ, z);
        else otherMax = Math.max(otherMax, z);
      }
    }
    assert.ok(confirmZ > 0, "không thấy zIndex của ConfirmHost");
    assert.ok(confirmZ > otherMax, `ConfirmHost zIndex=${confirmZ} phải lớn hơn zIndex lớn nhất của hộp thoại khác (${otherMax})`);
  });

  it("lớp phủ/hộp thoại không đóng khi bấm ra ngoài", () => {
    const bad: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, "utf-8");
      if (!/position:\s*"fixed"/.test(text)) continue;
      if (/e\.target\s*===\s*e\.currentTarget/.test(text)) bad.push(`${relative(SRC, f)}: đóng khi bấm nền (target === currentTarget)`);
      if (/onClick=\{onClose\}\s*\n\s*style=\{\{\s*\n\s*position:\s*"fixed"/.test(text)) {
        bad.push(`${relative(SRC, f)}: nền (position: fixed) gắn onClick={onClose}`);
      }
      if (/onMouseDown=\{[^}]*resolveConfirm/.test(text)) bad.push(`${relative(SRC, f)}: nền gọi resolveConfirm khi bấm`);
    }
    assert.deepEqual(bad, [], bad.join("\n"));
  });
});
