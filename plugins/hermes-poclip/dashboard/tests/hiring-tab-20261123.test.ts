import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Tab «Tuyển dụng» (màn «đã lập xong công ty») — đợt rà soát 23/11/2026

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

const src = fs.readFileSync(findSrc("src/pages/GenesisWizard.tsx"), "utf-8");
const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");

describe("Tuyển dụng sau khi lập xong công ty", () => {
  it("banner chúc mừng thu thành một dòng; có số thật của CẢ công ty từ /wizard/overview", () => {
    assert.ok(src.includes("data-genesis-done-line"));
    assert.ok(src.includes('"/api/v1/wizard/overview"'));
    assert.ok(src.includes("countGroups(items)"));
    assert.ok(src.includes("data-onboard-counts"));
  });
  it("không còn danh sách 8 thẻ lặp «Nhân sự AI cần tiếp nhận» và không còn nạp trạng thái từng người", () => {
    assert.ok(!src.includes("data-onboard-agents"));
    assert.ok(!src.includes("onboardStates"));
    assert.ok(!src.includes("OnboardAgentState"));
  });
  it("hàng đợi + biểu mẫu thuê chỉ hiện khi CÒN vị trí chưa thuê", () => {
    const queueCard = src.indexOf("{t.genesisWizard.completed.onboardingQueue}");
    const guard = src.lastIndexOf("{!allHired && (", queueCard);
    assert.ok(queueCard > 0 && guard > 0 && queueCard - guard < 200, "hàng đợi phải nằm ngay sau điều kiện !allHired");
    assert.ok(src.includes("startDepartmentHiring"));
  });
  it("không còn mã thô «(mã · tên phòng)» trong hàng đợi", () => {
    assert.ok(!src.includes('item.agent !== "ceo-agent"'));
  });
  it("có khối «Muốn tuyển thêm?» với hai đường dẫn; chỉ MỘT nút nổi bật ở khối tiến độ", () => {
    assert.ok(src.includes("data-hire-more"));
    assert.ok(src.includes("data-hire-blueprint"));
    assert.ok(src.includes("data-hire-proposals"));
    assert.ok(src.includes("<Button data-continue-onboarding style={wrapBtn}"));
    assert.ok(src.includes("<Button outlined data-open-operating-model style={wrapBtn}"));
  });
  it("nút dài tự xuống dòng (không đè chữ trên điện thoại)", () => {
    assert.ok(src.includes('height: "auto", whiteSpace: "normal"'));
  });
  it("chữ của khối «đã lập xong» không còn «API» và «(D7)»", () => {
    const start = vi.indexOf("    completed: {");
    const end = vi.indexOf("    queueStatus: {", start);
    assert.ok(start > 0 && end > start, "không thấy khối completed");
    const block = vi.slice(start, end);
    assert.ok(!block.includes("API"));
    assert.ok(!block.includes("(D7)"));
    assert.ok(block.includes("progressCounts"));
  });
});
