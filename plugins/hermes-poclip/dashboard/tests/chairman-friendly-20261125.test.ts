import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { vi } from "../src/i18n/vi";
import { en } from "../src/i18n/en";
import { plainName } from "../src/lib/plainName";
import { friendlyTitle } from "../src/lib/caseTitle";

// Giao diện cho Chủ tịch không làm kỹ thuật (25/11/2026, nhánh giao-dien-chu-tich): 6 mục.

function findSrc(rel: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 6; i++) {
    const c = path.join(dir, rel);
    if (fs.existsSync(c)) return c;
    dir = path.dirname(dir);
  }
  throw new Error(rel);
}
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");
const pm = read("src/pages/ProcessMap.tsx");
const idx = read("src/index.tsx");

describe("1. dải tóm tắt cho Chủ tịch", () => {
  it("đầu trang «Việc đang chạy theo quy trình» có dải tóm tắt: việc chờ quyết, việc kẹt, phòng chậm nhất", () => {
    assert.ok(pm.includes("function ChairmanBrief("));
    assert.ok(pm.includes("{data ? <ChairmanBrief data={data} /> : null}"));
    for (const k of ["data-pm-brief-inbox", "data-pm-brief-stuck", "data-pm-brief-unit", "data-pm-brief-open-inbox"]) assert.ok(pm.includes(k), k);
    assert.ok(pm.includes('navigateToTab("approval-queue")'));
  });
  it("con số «chờ bạn quyết» là CÙNG con số trên nút «Chờ duyệt» (cấp qua ngữ cảnh từ khung ứng dụng)", () => {
    assert.ok(idx.includes("<InboxCountContext.Provider value={countProposals ? inboxCount : null}>"));
    assert.ok(pm.includes("useContext(InboxCountContext)"));
  });
  it("câu chữ", () => {
    assert.equal(vi.processMap.briefInbox(2), "Có 2 việc đang chờ bạn quyết.");
    assert.ok(vi.processMap.briefAiPaused(186).includes("186 việc đang chờ nhân viên AI nhận, vì AI đang tạm dừng"));
    assert.equal(vi.processMap.briefSlowest("Kiểm toán nội bộ", 34), "Phòng đang chậm nhất: Kiểm toán nội bộ (34 việc kẹt).");
    assert.ok(en.processMap.briefTitle.length > 0);
  });
});

describe("2. đổi tên theo cách nói của Chủ tịch", () => {
  it("tên tab con và các từ chuyên môn", () => {
    assert.equal(vi.flowsProgress.modeProcess, "Việc đang chạy theo quy trình");
    assert.equal(vi.flowsProgress.modeCases, "Theo dõi từng vụ việc");
    assert.equal(vi.flowsProgress.modeFlow, "Mạng lưới giao việc (chi tiết)");          // giữ nguyên: đây là tên Chủ tịch vẫn dùng
    assert.equal(vi.liveMap.bottleneck, "Chỗ đang chậm nhất");
    assert.equal(vi.processMap.traceBtn, "Lịch sử việc này");
    assert.equal(vi.companyFlows.bottlenecksTitle, "Việc kẹt lâu nhất");
  });
  it("không còn «nút thắt», «dấu vết», «sự vụ» trong chữ tiếng Việt hiển thị của các màn này", () => {
    const sect = (name: string) => { const i = read("src/i18n/vi.ts").indexOf(`  ${name}: {`); return read("src/i18n/vi.ts").slice(i, read("src/i18n/vi.ts").indexOf("\n  },", i)); };
    for (const name of ["flowsProgress", "caseChain", "liveMap"]) {
      const t = sect(name);
      assert.ok(!/nút thắt/i.test(t) && !/dấu vết/i.test(t) && !/sự vụ/i.test(t), name);
    }
  });
});

describe("3. tùy chọn nâng cao", () => {
  it("tạm dừng, nhịp làm mới, chấm sáng nằm trong phần gập «Tùy chọn nâng cao»", () => {
    const i = pm.indexOf("data-pm-advanced");
    assert.ok(i > 0);
    const inside = pm.slice(i, pm.indexOf("<LiveTicker compact", i));
    for (const k of ["data-pm-pause", "lm.refresh", "lm.dots"]) assert.ok(inside.includes(k), k);
    assert.equal(vi.processMap.advancedTitle, "Tùy chọn nâng cao (tạm dừng, nhịp làm mới, chấm sáng)");
  });
});

describe("4. bỏ mã kỹ thuật và tiếng Anh trong tên phòng / việc", () => {
  it("plainName bỏ phần ngoặc là tên vai trò hoặc mã nhân viên, giữ viết tắt có nghĩa và phần có dấu hoặc chữ số", () => {
    assert.equal(plainName("Kỹ thuật (Solution Architect)"), "Kỹ thuật");
    assert.equal(plainName("Rà soát mã (Code Reviewer)"), "Rà soát mã");
    assert.equal(plainName("Chưa rõ (tool_use)"), "Chưa rõ (tool_use)");                       // mã lạ viết thường được cố ý hiện ra
    assert.equal(plainName("Rà soát mã (code-reviewer-agent)"), "Rà soát mã (code-reviewer-agent)");
    assert.equal(plainName("Vận hành sản phẩm (DevOps)"), "Vận hành sản phẩm");
    assert.equal(plainName("Giao diện (UI & Design System)"), "Giao diện");
    assert.equal(plainName("Lạm phát Mỹ (CPI)"), "Lạm phát Mỹ (CPI)");
    assert.equal(plainName("Phân tích nghiệp vụ (BA)"), "Phân tích nghiệp vụ");                   // viết tắt tên vai trò tiếng Anh: bỏ
    assert.equal(plainName("Giám sát sản phẩm & sự cố (SRE)"), "Giám sát sản phẩm & sự cố");
    assert.equal(plainName("Chấm kết quả (C1–C5)"), "Chấm kết quả (C1–C5)");
    assert.equal(plainName("Bản v3 (vá chống tiêm lệnh)"), "Bản v3 (vá chống tiêm lệnh)");
    assert.equal(plainName("(Code Reviewer)"), "(Code Reviewer)");
    assert.equal(plainName(""), "");
  });
  it("tên việc gọn cũng bỏ tên vai trò tiếng Anh", () => {
    assert.equal(friendlyTitle("Đối chiếu hồ sơ vị trí mới: Rà soát mã (Code Reviewer) (code-reviewer-agent)"), "Đối chiếu hồ sơ vị trí mới: Rà soát mã");
  });
  it("dòng «Vừa xảy ra gần đây» và bảng việc kẹt lâu nhất cũng dùng tên gọn", () => {
    const lt = read("src/pages/LiveTicker.tsx");
    assert.ok(lt.includes("friendlyTitle(e.title)") && lt.includes("const w = plainName(who);") && lt.includes("friendlyTitle(c.title)"));
    assert.ok(read("src/pages/CompanyFlows.tsx").includes("friendlyTitle(b.title)"));
  });
  it("các màn dùng plainName cho tên phòng và người", () => {
    assert.ok(pm.includes("plainName(u.label)") && pm.includes("personLabelOr(t, x.id, x.name)"));
    assert.ok(read("src/pages/CaseChain.tsx").includes("plainName(node.unit_label)"));
    assert.ok(read("src/pages/CompanyFlows.tsx").includes("return plainName(clusters[code])"));
    assert.ok(read("src/pages/FlowsProgress.tsx").includes("return plainName(known ??"));
  });
});

describe("5. cổng G1… thành tên mô tả", () => {
  const pack = JSON.parse(read("company-packs/software-company/process_catalog/software_company.json"));
  const proj = pack.processes.find((p: { id: string }) => p.id === "sw_project");
  it("danh mục quy trình của gói phần mềm không còn mã G/D trong tên bước, giai đoạn, mô tả", () => {
    const texts: string[] = [];
    for (const p of pack.processes) {
      texts.push(p.purpose ?? "");
      for (const s of p.steps ?? []) texts.push(s.label ?? "", s.who_label ?? "");
      for (const ph of p.phases ?? []) texts.push(ph.label ?? "");
    }
    const left = texts.join(" | ").match(/\b(?:G\d(?:\.\d)?|D\d(?:–D\d)?)\b/g);
    assert.equal(left, null, String(left));
  });
  it("khoá bước không đổi (chỉ đổi nhãn), nên số liệu và liên kết cũ vẫn khớp", () => {
    const keys = proj.steps.map((s: { key: string }) => s.key);
    for (const k of ["g1", "g15", "g25", "g2", "g29", "g5", "clarify", "prd", "review8", "handoff"]) assert.ok(keys.includes(k), k);
    assert.equal(keys.length, 29);
  });
  it("tên mới là tên mô tả", () => {
    const by = (k: string) => proj.steps.find((s: { key: string }) => s.key === k).label;
    assert.equal(by("g1"), "Chốt yêu cầu (Chủ tịch và khách duyệt)");
    assert.equal(by("g5"), "Duyệt phát hành (Chủ tịch)");
    assert.equal(by("prd"), "Viết tài liệu yêu cầu sản phẩm");
  });
  it("quy trình dự án của gói (nháp) cũng không còn mã cổng", () => {
    for (const f of ["DRAFT-default.json", "DRAFT-chay-luong-A.json", "DRAFT-su_co.json"]) {
      const d = JSON.parse(read(`company-packs/software-company/project_flows/${f}`));
      const t = JSON.stringify([...(d.steps ?? []).map((s: { label: string }) => s.label), ...(d.milestones ?? []).map((m: { label: string }) => m.label)]);
      assert.equal(t.match(/\b(?:G\d(?:\.\d)?|D\d(?:–D\d)?)\b/g), null, f);
    }
  });
});
