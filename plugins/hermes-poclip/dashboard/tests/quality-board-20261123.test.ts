import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { hasNoWork, spokeTurns } from "../src/lib/quality";
import { allowedSummary } from "../src/lib/review-policy";
import { hiddenSummary } from "../src/lib/tool-visibility";

// «Chất lượng nhân viên AI» — đợt rà soát 23/11/2026

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

describe("số lượt họp thật sự phát biểu", () => {
  it("trừ xin PASS, hết giờ của riêng người đó và hết giờ hàng loạt", () => {
    assert.equal(spokeTurns({ turns: 14, passed: 0, timeout: 0, timeout_system: 13 }), 1);
    assert.equal(spokeTurns({ turns: 10, passed: 2, timeout: 3 }), 5);
    assert.equal(spokeTurns({ turns: 2, passed: 2, timeout: 2 }), 0);          // không bao giờ âm
  });
});

describe("nhân viên chưa có việc nào", () => {
  it("attempts = 0 → chưa có số liệu; có việc → có", () => {
    assert.equal(hasNoWork({ attempts: 0 }), true);
    assert.equal(hasNoWork({ attempts: 3 }), false);
  });
});

describe("tên người và tên nhóm công cụ thay cho mã", () => {
  it("người rà soát hợp lệ hiện bằng tên, dấu ★ giữ cho người mặc định", () => {
    const names: Record<string, string> = { "lead-x": "Trưởng phòng X", "compliance-agent": "Kiểm soát viên tuân thủ" };
    assert.equal(
      allowedSummary({ profile_id: "a", kind: "worker", allowed: ["lead-x", "compliance-agent"], default: "lead-x", restricted: true }, (id) => names[id] ?? id),
      "Trưởng phòng X ★, Kiểm soát viên tuân thủ",
    );
  });
  it("nhóm công cụ bị ẩn hiện bằng nhãn tiếng Việt, nhóm lạ giữ nguyên", () => {
    const groups: Record<string, string> = { terminal: "Dòng lệnh", file: "Đọc/ghi tệp" };
    assert.equal(hiddenSummary({ profile_id: "x", denied: [], hidden_toolsets: ["terminal", "file", "zzz"] }, (g) => groups[g] ?? g), "Dòng lệnh, Đọc/ghi tệp, zzz");
  });
});

describe("trang Chất lượng: bố cục", () => {
  const src = fs.readFileSync(findSrc("src/pages/QualityBoard.tsx"), "utf-8");
  it("ba khối cài đặt nằm SAU bảng chất lượng (cuối trang), trong mục gập", () => {
    const table = src.indexOf('data-table-wrap="quality-board"');
    for (const tag of ["<ReadinessPanel", "<ReviewPolicyPanel", "<ToolVisibilityPanel"]) {
      assert.ok(src.indexOf(tag) > table, `${tag} phải nằm sau bảng chất lượng`);
    }
    assert.ok(src.includes("<Fold"));
  });
  it("không còn hiện mã nhân viên trong bảng chất lượng", () => {
    assert.ok(!src.includes("{a.profile_id}</div>"));
  });
  it("nút Rà soát / Nhờ phòng Đào tạo chỉ hiện khi nhân viên có việc", () => {
    assert.match(src, /!hasNoWork\(a\) && <Button size="sm" style=\{actionBtnStyle\} onClick=\{\(\) => openReview/);
    assert.match(src, /!hasNoWork\(a\) && <Button size="sm" outlined style=\{actionBtnStyle\} disabled=\{saving\} title=\{q\.coachHint\} onClick=\{\(\) => askCoaching/);
  });
  it("các nút thao tác cùng cỡ và không bẻ dòng", () => {
    assert.match(src, /actionBtnStyle: React\.CSSProperties = \{ whiteSpace: "nowrap"/);
  });
  it("tỷ lệ lỗi không hiện khi chưa đủ dữ liệu", () => {
    assert.match(src, /a\.status !== "insufficient" && a\.error_rate !== null/);
  });
});
