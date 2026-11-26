import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalizeDrift } from "../src/lib/operatingInsights";

// «Cơ chế vận hành» — đợt rà soát 23/11/2026

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

describe("normalizeDrift: số mẫu hiện ra", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ ref: `u${i}`, title: null, pair: null, label: null, reasons: [], days_overdue: null }));
  const raw = [{ kind: "unit_without_flow", count: 9, samples: many, link: null }] as Parameters<typeof normalizeDrift>[0];
  it("mặc định vẫn cắt ở 5 (hành vi cũ)", () => {
    assert.equal(normalizeDrift(raw)[1].samples.length, 5);
  });
  it("trang truyền 100 nên hiện đủ 9 phòng, không cắt âm thầm", () => {
    const item = normalizeDrift(raw, null, 100).find((x) => x.kind === "unit_without_flow")!;
    assert.equal(item.samples.length, 9);
    assert.equal(item.count, 9);
  });
});

describe("trang Cơ chế vận hành: bố cục", () => {
  const src = fs.readFileSync(findSrc("src/pages/OperatingModel.tsx"), "utf-8");
  it("mỗi khối chỉ có MỘT nút, ghi rõ tên tab đích (không còn «Mở màn gốc»/«Điều chỉnh» + chữ gợi ý vô hình)", () => {
    assert.ok(src.includes("om.btnOpenTab(blockTabName(t, blockId))"));
    assert.ok(!src.includes("om.editSameTargetHint"));
    assert.ok(!src.includes("data-om-open-source"));
  });
  it("không còn dòng «hiệu lực» lặp ở đầu trang; «?» giải thích «xác nhận»", () => {
    assert.ok(!src.includes("om.effectiveLine("));
    assert.ok(src.includes("om.ackExplain"));
  });
  it("danh sách thiếu nhân sự được gộp theo tiêu chí và gập lại", () => {
    assert.ok(src.includes("data-om-staff-group"));
    assert.ok(src.includes("om.staffGroupHeader("));
  });
  it("đường dẫn máy chủ và dòng lệnh nằm trong «Chi tiết kỹ thuật»", () => {
    assert.ok(src.includes("data-om-handbook-tech"));
    assert.ok(src.includes("om.handbookTech"));
  });
  it("đối chiếu: không cắt mẫu ở 5, cách phát hiện vào «?»", () => {
    assert.ok(src.includes("normalizeDrift(drift.items ?? [], drift.threshold ?? null, 100)"));
    assert.ok(!src.includes("{t.common.technicalCodePrefix} {item.threshold_key}"));
  });

  it("nút: chỉ «Xác nhận» nổi bật; nút chuyển tab/xem/tải/mở hồ sơ là nút viền cùng cỡ", () => {
    assert.ok(src.includes("outlined style={navBtnStyle}"), "nút chuyển tab của khối: viền + cùng rộng");
    assert.match(src, /data-om-handbook-view\s+size="sm"\s+outlined/);
    assert.match(src, /data-om-handbook-download\s+size="sm"\s+outlined/);
    assert.ok(src.includes('data-om-drift-open size="sm" outlined'));
    assert.ok(src.includes('data-om-staff-open size="sm" outlined'));
    assert.ok(!src.includes("om.driftBtnOpen}"), "không còn nhãn «Mở màn liên quan»");
    assert.ok(src.includes("om.staffOpenProfile"), "nút nhân sự nói rõ mở hồ sơ/luồng");
  });
});
