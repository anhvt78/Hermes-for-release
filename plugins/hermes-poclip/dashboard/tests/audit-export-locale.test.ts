import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { buildAuditExportPath } from "../src/lib/auditExport";
import { emptyFilters, buildAuditQuery } from "../src/lib/auditTrailFilters";

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 4; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Không tìm thấy ${relPath} từ ${process.cwd()} lên 4 cấp`);
}

describe("buildAuditExportPath", () => {
  it("emptyFilters + csv + vi => chứa format=csv, lang=vi, page=1 (implicit), page_size=20 (implicit), company_id=default", () => {
    const result = buildAuditExportPath(emptyFilters(), "csv", "vi");
    assert.ok(result.includes("format=csv"), `Thiếu format=csv trong: ${result}`);
    assert.ok(result.includes("lang=vi"),    `Thiếu lang=vi trong: ${result}`);
    assert.ok(result.includes("company_id=default"), `Thiếu company_id=default trong: ${result}`);
    // page=1 và page_size=20 là giá trị mặc định — buildAuditQuery không thêm chúng vào query string
    // nhưng đường dẫn vẫn phải không chứa page khác
    assert.ok(!result.includes("page=2"), `Phải ép page=1 (không có page=2): ${result}`);
  });

  it("emptyFilters + json + vi => chứa format=json và lang=vi", () => {
    const result = buildAuditExportPath(emptyFilters(), "json", "vi");
    assert.ok(result.includes("format=json"), `Thiếu format=json trong: ${result}`);
    assert.ok(result.includes("lang=vi"),     `Thiếu lang=vi trong: ${result}`);
  });

  it("locale en => chứa lang=en và KHÔNG chứa lang=vi", () => {
    const result = buildAuditExportPath(emptyFilters(), "csv", "en");
    assert.ok(result.includes("lang=en"),     `Thiếu lang=en trong: ${result}`);
    assert.ok(!result.includes("lang=vi"),    `Không được chứa lang=vi khi locale=en: ${result}`);
  });

  it("bộ lọc thật + vi + csv => path khớp chính xác buildAuditQuery + &format=csv&lang=vi", () => {
    const f = {
      ...emptyFilters(),
      actor: "chu_tich",
      source: "policy",
      from: "2026-09-30",
      to: "2026-10-01",
      company_id: "default",
    };
    const expected =
      `/api/v1/audit-trail/export?` +
      buildAuditQuery({ ...f, page: 1, page_size: 20 }) +
      `&format=csv&lang=vi`;
    const result = buildAuditExportPath(f, "csv", "vi");
    assert.equal(result, expected);
  });

  it("bộ lọc thật + en + json => path khớp chính xác buildAuditQuery + &format=json&lang=en", () => {
    const f = {
      ...emptyFilters(),
      actor: "giam_doc",
      source: "budget",
      from: "2026-10-01",
      to: "2026-10-03",
      company_id: "default",
    };
    const expected =
      `/api/v1/audit-trail/export?` +
      buildAuditQuery({ ...f, page: 1, page_size: 20 }) +
      `&format=json&lang=en`;
    const result = buildAuditExportPath(f, "json", "en");
    assert.equal(result, expected);
  });

  // Ca CHỐNG HỒI QUY: khoá luật "hook không nằm trong handler" ở mức source.
  // runner test:unit stub React nên không render component được; ca này khoá luật
  // hook ở mức source bằng cách đọc trực tiếp cả 2 file liên quan.
  it("source check: auditExport.ts dùng lang=${locale} (thuần), AuditTrail.tsx gọi useLocale() đúng vị trí", () => {
    // --- auditExport.ts: hàm thuần, không được đụng hook/i18n ---
    const exportSrc = fs.readFileSync(findSrc("src/lib/auditExport.ts"), "utf8");
    assert.ok(
      exportSrc.includes("lang=${locale}"),
      "auditExport.ts phải chứa template literal 'lang=${locale}'"
    );
    assert.ok(
      !exportSrc.includes("currentLocale"),
      "auditExport.ts không được chứa 'currentLocale' — hàm phải thuần, không dùng hook/i18n"
    );

    // --- AuditTrail.tsx: bỏ các dòng comment bắt đầu bằng // ---
    const rawTsx = fs.readFileSync(findSrc("src/pages/AuditTrail.tsx"), "utf8");
    const codeLines = rawTsx
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");

    assert.ok(
      codeLines.includes("const locale = useLocale()"),
      "AuditTrail.tsx phải có 'const locale = useLocale()' trong thân component"
    );
    assert.ok(
      codeLines.includes(`handleExport("csv", locale)`),
      `AuditTrail.tsx phải có handleExport("csv", locale)`
    );
    assert.ok(
      codeLines.includes(`handleExport("json", locale)`),
      `AuditTrail.tsx phải có handleExport("json", locale)`
    );
    assert.ok(
      !/currentLocale\s*\(/.test(codeLines),
      "AuditTrail.tsx không được gọi currentLocale(...) trong code thực — vi phạm luật hook trong handler"
    );
  });
});
