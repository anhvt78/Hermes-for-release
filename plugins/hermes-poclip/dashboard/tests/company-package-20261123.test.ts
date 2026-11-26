import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { activeAiCount, errorTextFromBody, filterProfiles, foldAscii, importBlockReason, shownError, sortHistoryInventory } from "../src/lib/company-package-view";

// Tab «Xuất, nhập công ty» — đợt rà soát 23/11/2026

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

describe("câu lỗi", () => {
  it("errorTextFromBody: ưu tiên message_vi; không bao giờ hiện «HTTP …» hay khối JSON", () => {
    assert.equal(errorTextFromBody({ detail: { message_vi: "Tệp sai mật khẩu." } }, 400, "Lỗi chung"), "Tệp sai mật khẩu.");
    assert.equal(errorTextFromBody({ detail: "Máy chưa trống." }, 409, "Lỗi chung"), "Máy chưa trống.");
    assert.equal(errorTextFromBody({ detail: "HTTP 500" }, 500, "Lỗi chung"), "Lỗi chung");
    assert.equal(errorTextFromBody({ detail: { error: "X", code: 5, nested: { a: 1 } } }, 500, "Lỗi chung"), "Lỗi chung");
    assert.equal(errorTextFromBody(null, 500, "Lỗi chung"), "Lỗi chung");
  });
  it("shownError giữ câu đã Việt hoá, bỏ dạng thô", () => {
    assert.equal(shownError(new Error("Không có quyền."), "Lỗi chung"), "Không có quyền.");
    assert.equal(shownError(new Error("HTTP 502"), "Lỗi chung"), "Lỗi chung");
    assert.equal(shownError(new Error("Failed to fetch"), "Lỗi chung"), "Lỗi chung");
    assert.equal(shownError(undefined, "Lỗi chung"), "Lỗi chung");
  });
});

describe("danh sách nhân viên: tìm, xếp", () => {
  const items = [
    { profile_id: "audit-agent", messages: 468, sessions: 195 },
    { profile_id: "ceo-agent", messages: 1055, sessions: 435 },
    { profile_id: "bug-triage-agent", messages: 2, sessions: 1 },
    { profile_id: "backend-dev-agent", messages: 2, sessions: 1 },
  ];
  const label = (id: string) => ({ "ceo-agent": "Giám đốc điều hành (CEO)", "audit-agent": "Kiểm toán viên nội bộ" } as Record<string, string>)[id] ?? id;
  it("foldAscii bỏ dấu, đ→d", () => {
    assert.equal(foldAscii("Giám đốc Điều hành"), "giam doc dieu hanh");
  });
  it("tìm theo tên hiển thị (không phân biệt dấu) hoặc mã; ô trống giữ nguyên", () => {
    assert.deepEqual(filterProfiles(items, "kiem toan", label).map((x) => x.profile_id), ["audit-agent"]);
    assert.deepEqual(filterProfiles(items, "CEO", label).map((x) => x.profile_id), ["ceo-agent"]);
    assert.deepEqual(filterProfiles(items, "bug", label).map((x) => x.profile_id), ["bug-triage-agent"]);
    assert.equal(filterProfiles(items, "  ", label).length, 4);
    assert.equal(filterProfiles(items, "không-có", label).length, 0);
  });
  it("sortHistoryInventory: nhiều tin nhắn trước, bằng nhau theo phiên rồi mã; không đổi mảng gốc", () => {
    assert.deepEqual(sortHistoryInventory(items).map((x) => x.profile_id), ["ceo-agent", "audit-agent", "backend-dev-agent", "bug-triage-agent"]);
    assert.equal(items[0].profile_id, "audit-agent");
  });
});

describe("đếm nhân viên AI không tính Chủ tịch", () => {
  const tree = [{ profile_id: "chu_tich", children: [{ profile_id: "ceo-agent", children: [{ profile_id: "x-agent" }] }] }];
  it("trừ node Chủ tịch khỏi tổng của máy chủ", () => {
    assert.equal(activeAiCount(tree, 40), 39);
    assert.equal(activeAiCount(tree, 1), 0);
  });
  it("không có Chủ tịch trong cây thì giữ nguyên; thiếu số liệu = 0", () => {
    assert.equal(activeAiCount([{ profile_id: "ceo-agent" }], 5), 5);
    assert.equal(activeAiCount(undefined, undefined), 0);
    assert.equal(activeAiCount([], 0), 0);
  });
});

describe("khi nào chặn phần Nhập", () => {
  it("đang tải / máy trống / giấy phép / đang chạy / đã có công ty", () => {
    assert.equal(importBlockReason(null), "loading");
    assert.equal(importBlockReason({ empty_machine: true }), null);
    assert.equal(importBlockReason({ empty_machine: true, migration: { allowed: false } }), "license");
    assert.equal(importBlockReason({ empty_machine: true, running: true }), "running");
    assert.equal(importBlockReason({ empty_machine: false, marker: null }), "not_empty");
    assert.equal(importBlockReason({ empty_machine: false, marker: { status: "done" } }), "not_empty");
  });
  it("lần nhập dở dang của một tệp vẫn chạy tiếp được dù máy đã có một phần công ty", () => {
    assert.equal(importBlockReason({ empty_machine: false, marker: { status: "partial" } }), null);
  });
});

describe("trang Xuất, nhập công ty: bố cục", () => {
  const page = fs.readFileSync(findSrc("src/pages/CompanyPackage.tsx"), "utf-8");
  const dissolve = fs.readFileSync(findSrc("src/components/DissolveCompanyPanel.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("thứ tự: Tình trạng → Xuất → Nhập → Tiến độ → Lịch sử (gập) → Giải thể (gập, cuối)", () => {
    const marks = ["{cp.statusTitle}", 'data-cp-export=""', 'data-cp-import=""', 'data-cp-progress=""', 'data-cp-history-fold=""', 'data-cp-dissolve-fold=""']
      .map((s) => page.lastIndexOf(s));
    for (let i = 1; i < marks.length; i++) assert.ok(marks[i - 1] < marks[i], `thứ tự ${i}`);
    assert.ok(page.lastIndexOf("<DissolveCompanyPanel embedded />") > page.lastIndexOf('data-cp-dissolve-fold=""'));
  });
  it("tiêu đề có «?»; đoạn dài chuyển sau «?»", () => {
    assert.ok(page.includes("{cp.pageTitle}<InfoHint wide>{cp.introHelp}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{cp.exportHelp}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{cp.memHelp}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{cp.histHelp}</InfoHint>"));
    assert.ok(page.includes("<InfoHint wide>{cp.histImportHelp}</InfoHint>"));
    assert.ok(!page.includes("<p style={muted}>{cp.exportHelp}</p>"));
    assert.ok(!page.includes("<p style={muted}>{cp.memHelp}</p>"));
  });
  it("phần Nhập gập + giải thích khi máy đã có công ty; ô tải tệp bị khoá", () => {
    assert.ok(page.includes("importOpenUser ?? !importBlocked"));
    assert.ok(page.includes("data-cp-import-blocked"));
    assert.ok(page.includes("disabled={importBlocked}"));
    assert.ok(page.includes("importBlockReason(status)"));
    assert.ok(page.includes("const uploadWhy = importBlocked ? null"));
  });
  it("tiến độ nhập tự cuộn vào tầm nhìn", () => {
    assert.ok(page.includes("scrollIntoView"));
    assert.ok(page.includes("ref={jobRef}"));
  });
  it("tên người thay mã ở mọi danh sách; không còn dán mã thô vào dòng", () => {
    assert.ok(page.includes("personLabel(t, m.profile_id)"));
    assert.ok(!page.includes("cp.histRow(m.profile_id"));
    assert.ok(!page.includes("cp.memRow(m.profile_id"));
  });
  it("danh sách chọn: khung cuộn ≤ 260px, ô tìm, ô tích rộng 18px", () => {
    assert.ok(page.includes("maxHeight: 260"));
    assert.ok(page.includes("data-cp-search"));
    assert.ok(page.includes("width: 18, height: 18"));
  });
  it("tuyển thật: chọn mô hình từ danh mục máy chủ (ModelPicker), không còn ô gõ tự do «deepseek»", () => {
    assert.ok(page.includes("<ModelPicker"));
    assert.ok(!page.includes('useState("deepseek")'));
    assert.ok(!page.includes('useState("deepseek-chat")'));
    assert.ok(page.includes("provider: resolvedModel.provider"));
    assert.ok(page.includes("/api/v1/org/model-catalog"));
  });
  it("nút mờ có dòng lý do", () => {
    assert.ok((page.match(/<Why text=/g) ?? []).length >= 6);
    for (const k of ["whyNoFile", "whyNoMove", "whyAck", "whyNeedKey", "whyPickMember", "whyBusy"]) assert.ok(page.includes(`cp.${k}`), k);
  });
  it("lỗi: qua errorTextFromBody/shownError, không còn JSON.stringify hay (e as Error).message", () => {
    assert.ok(!page.includes("JSON.stringify(det)"));
    assert.ok(!page.includes("(e as Error).message"));
    assert.ok(!page.includes("`HTTP ${"));
    assert.ok((page.match(/shownError\(/g) ?? []).length >= 8);
  });
  it("giải thể: không tính Chủ tịch, lỗi gọn, có chế độ nhúng", () => {
    assert.ok(dissolve.includes("activeAiCount("));
    assert.ok(!dissolve.includes("e.message ||"));
    assert.ok(dissolve.includes("embedded"));
  });
  it("tiêu đề phần rõ nghĩa; chữ mới có trong tiếng Việt", () => {
    assert.ok(vi.includes('exportTitle: "Xuất công ty ra tệp"'));
    assert.ok(vi.includes('importTitle: "Nhập công ty từ tệp"'));
    for (const k of ["introHelp:", "importBlockedNotEmpty:", "whyNoFile:", "searchPlaceholder:", "histFoldSummary:", "dissolveFoldSummary:", "modelMoneyHint:", "errorGeneric:"]) {
      assert.ok(vi.includes(k), k);
    }
  });
});

describe("máy chủ: cổng giải thể và câu «Cơ cấu đang có»", () => {
  const genesis = fs.readFileSync(findSrc("genesis/__init__.py"), "utf-8");
  const importer = fs.readFileSync(findSrc("company_package/package_importer.py"), "utf-8");
  it("giải thể không đếm node Chủ tịch", () => {
    assert.ok(genesis.includes("WHERE active=1 AND profile_id <> ?"));
  });
  it("câu trạng thái ghi rõ «nhân viên AI (chưa tính Chủ tịch)»", () => {
    assert.ok(importer.includes("nhân viên AI (chưa tính Chủ tịch)"));
  });
});
