import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { eventTopicLabelSmart } from "../src/lib/display-labels";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";

// «Mạng lưới giao việc» (Sơ đồ luồng và tiến độ → chế độ flow) — sửa lỗi tìm được khi thử thật trên máy 26, 24/11/2026

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
const page = fs.readFileSync(findSrc("src/pages/CompanyFlows.tsx"), "utf-8");

describe("tên luồng đọc được (tab Bàn giao + bảng gợi ý)", () => {
  it("phối hợp ngang / chỉ đạo xuống / gửi rà soát không còn «Chưa xác định»", () => {
    for (const code of ["design.coord_with_engineering", "executive.directive_to_product", "design.review_requested"]) {
      const label = eventTopicLabelSmart(vi, code);
      assert.ok(label && !label.startsWith("Chưa xác định"), `${code} → ${label}`);
    }
    assert.match(eventTopicLabelSmart(vi, "design.coord_with_engineering"), /^Phối hợp giữa các phòng — .+ ↔ .+$/);
    assert.match(eventTopicLabelSmart(vi, "executive.directive_to_product"), /^Chỉ đạo xuống phòng — /);
    assert.match(eventTopicLabelSmart(vi, "design.review_requested"), /^Gửi sang rà soát — /);
  });
  it("mẫu báo cáo lên vẫn như cũ; tên tiếng Anh cũng có", () => {
    assert.match(eventTopicLabelSmart(vi, "product.report_to_executive"), /^Báo cáo lên Ban điều hành — /);
    assert.match(eventTopicLabelSmart(en, "design.coord_with_engineering"), /^Cross-department coordination — /);
  });
  it("bảng gợi ý: cột «Tên» có tên thường cho báo cáo lên và chỉ đạo xuống (trước đây hiện mã thô)", () => {
    assert.ok(page.includes('event.startsWith("report_to_")') && page.includes('event.startsWith("directive_to_")'));
    assert.equal(vi.companyFlows.lawKindReport, "Báo cáo lên cấp trên");
    assert.equal(vi.companyFlows.lawKindDirective, "Chỉ đạo xuống phòng");
  });
});

describe("nút «Sửa» thay «Lưu» ở dòng, form sửa được cuộn tới", () => {
  it("dòng có nút «Sửa» (data-law-edit); «Lưu» chỉ còn trong form sửa", () => {
    assert.ok(page.includes('data-law-edit="" disabled={lawBusy} onClick={() => startEdit(s)}>{t.companyFlows.lawBtnEdit}'));
    assert.equal(vi.companyFlows.lawBtnEdit, "Sửa");
    assert.equal((page.match(/data-law-save=""/g) ?? []).length, 1);
  });
  it("mở form sửa thì cuộn tới form (lawFormRef) — form nằm dưới cả bảng", () => {
    assert.ok(page.includes("const lawFormRef = useRef<HTMLDivElement>(null);"));
    assert.ok(page.includes("lawFormRef.current?.scrollIntoView"));
    assert.ok(page.includes("<div ref={lawFormRef} data-flows-law-form"));
  });
});

describe("làm mới các khung phụ thuộc luật sau mỗi thao tác", () => {
  it("refreshAfterLaw nạp lại gợi ý, tổng quan, «phòng mới», quy tắc và đề xuất bảng", () => {
    const fn = page.slice(page.indexOf("function refreshAfterLaw()"), page.indexOf("async function handleLawSave()"));
    for (const call of ["refetchSuggestions()", "refetch()", "refetchStaleness()", "refetchTopics()", "refetchKanbanProposal()"]) {
      assert.ok(fn.includes(call), call);
    }
  });
  it("lưu, duyệt, từ chối, tạo gợi ý, duyệt tất cả, rà lại cơ cấu đều gọi refreshAfterLaw (không chỉ refetchSuggestions)", () => {
    assert.ok((page.match(/refreshAfterLaw\(\);/g) ?? []).length >= 6);
    assert.ok(!/setLawMsg\(\{[^}]*\}\); refetchSuggestions\(\);/.test(page));
  });
});

describe("thông báo kết quả nói rõ việc đã làm", () => {
  it("lưu nháp, rà lại cơ cấu không còn «Xong» trần", () => {
    assert.ok(!page.includes("t.companyFlows.lawOk"));
    assert.match(vi.companyFlows.lawSavedOne("Phối hợp giữa các phòng: A → B"), /Đã lưu chỉnh sửa luồng «Phối hợp giữa các phòng: A → B».*nháp/);
    assert.match(vi.companyFlows.lawSynced(0, 0, 0), /không có phòng nào/);
    assert.match(vi.companyFlows.lawSynced(2, 1, 0), /2 phòng mới, 1 phòng không còn, 0 phòng đổi tên/);
  });
  it("thông báo duyệt/từ chối dùng tên đọc được (lawFlowLabel), không phải mã", () => {
    assert.ok(page.includes("const lawFlowName = (id: string) => { const s = suggestions.find((x) => x.id === id); return s ? lawFlowLabel(t, s, unitApiLabel) : id; };"));
    assert.ok(page.includes("function lawFlowLabel("));
  });
  it("tạo gợi ý báo số gợi ý đã từ chối bị bỏ qua; duyệt tất cả báo số luồng sai bị bỏ qua", () => {
    assert.match(vi.companyFlows.lawGenerated(0, {}, 2), /2 gợi ý bạn đã từ chối trước đó nên không đề xuất lại/);
    assert.match(vi.companyFlows.lawGenerated(3, { peer: 3 }, 0), /^Đã tạo 3 gợi ý mới \(3 phối hợp ngang\)\. Xem ở danh sách bên dưới\.$/);
    assert.match(vi.companyFlows.lawApprovedAll(5, 1), /Bỏ qua 1 luồng có giá trị không hợp lệ/);
    assert.doesNotMatch(vi.companyFlows.lawApprovedAll(5), /Bỏ qua/);
  });
  it("ghi chú: luồng đã duyệt chỉ thành đường trên sơ đồ khi có việc thật", () => {
    assert.ok(page.includes("{t.companyFlows.lawGenerateScope} {t.companyFlows.lawNoLineNote}"));
    assert.match(vi.companyFlows.lawNoLineNote, /việc thật/);
  });
});

describe("lỗi do máy chủ nêu rõ trường sai được nói đúng câu đó", () => {
  it("parseServerErrors đọc `.body` (nội dung gốc) trước khi rơi về câu chung", () => {
    const fn = page.slice(page.indexOf("function parseServerErrors("), page.indexOf("/** Máy chủ trả 409"));
    assert.ok(fn.includes("(e as { body?: unknown })?.body"));
    assert.ok(fn.includes("detail?.error?.errors"));
    assert.ok(fn.indexOf("detail?.error?.errors") < fn.indexOf("const raw = "));
  });
});

describe("tên phòng không còn là mã thô khi phòng chưa có việc", () => {
  it("lấy thêm tên từ bảng tên phòng (/flows/units)", () => {
    assert.ok(page.includes('usePoclipFetch<{ items: { slug: string; display_name?: string }[] }>("/api/v1/flows/units")'));
    assert.ok(page.includes("routingUnitsData?.items?.find((u) => u.slug === c)?.display_name"));
  });
});
