import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// Giao diện cho Chủ tịch — nhóm 1: Mức kiểm soát, Cơ chế vận hành, Bàn giao giữa các phòng (26/11/2026).
function src(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, "src", rel);
    if (fs.existsSync(c)) return fs.readFileSync(c, "utf-8");
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}

describe("Mức kiểm soát: nhóm thông số gập lại", () => {
  const s = src("pages/ControlLevel.tsx");
  it("mỗi nhóm là <details>, chỉ mở khi có thông số chỉnh riêng", () => {
    assert.ok(s.includes("<details key={g.group} open={differsN > 0 ? true : undefined}"));
    assert.ok(s.includes("c.groupSummary(g.items.length, differsN)"));
  });
  it("câu tóm tắt", () => {
    assert.equal(vi.controlLevel!.groupSummary!(5, 0), "5 thông số, đều theo mức đang chọn");
    assert.equal(vi.controlLevel!.groupSummary!(5, 2), "5 thông số, 2 đang chỉnh riêng");
    assert.equal(en.controlLevel.groupSummary(5, 2), "5 settings, 2 tuned individually");
  });
});

describe("Cơ chế vận hành: gập khối và danh sách kiểm lệch", () => {
  const s = src("pages/OperatingModel.tsx");
  it("5 khối mở khi chưa xác nhận, gập khi đã xác nhận", () => {
    assert.ok(s.includes("<details open={!isConfirmed} style={cardStyle} data-om-blocks>"));
  });
  it("danh sách mục đã kiểm gập lại khi không lệch", () => {
    assert.ok(s.includes("function DriftItemsWrap"));
    assert.ok(s.includes("<DriftItemsWrap clean={!!drift.clean}"));
    assert.equal(vi.operatingModel!.driftItemsFold!(7), "Xem 7 mục đã kiểm (đều không lệch)");
  });
});

describe("Bàn giao giữa các phòng: mỗi trang 10 chủ đề", () => {
  it("pageSize 10", () => {
    assert.ok(src("pages/InterDeptFlows.tsx").includes("items={shownTopics} pageSize={10}"));
  });
});
