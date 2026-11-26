import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { serverUnitName, serverPersonName, setServerNames } from "../src/lib/server-names";
import { unitChoices } from "../src/lib/placement-fields";

// Giao diện cho Chủ tịch — các màn còn lại (Tổ chức: Cây tổ chức, Bàn giao giữa các phòng, Tiếp nhận nhân viên mới), 26/11/2026.

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

describe("tên phòng và người do máy chủ gửi không còn phần tiếng Anh trong ngoặc", () => {
  it("serverUnitName / serverPersonName", () => {
    setServerNames({ units: { design: "Thiết kế (Design Lead)", cpi: "Lạm phát (CPI)" }, people: { a: "Rà soát mã (Code Reviewer)" } });
    assert.equal(serverUnitName("design"), "Thiết kế");
    assert.equal(serverUnitName("cpi"), "Lạm phát (CPI)");          // viết tắt toàn chữ hoa có nghĩa → giữ
    assert.equal(serverPersonName("a"), "Rà soát mã");
  });
  it("ô chọn phòng (Tiếp nhận nhân viên mới, thuê người) dùng tên gọn; mã phòng thêm vào vẫn giữ", () => {
    const c = unitChoices([{ slug: "design", display_name: "Thiết kế (Design Lead)", in_org: true } as never], true);
    assert.equal(c[0].label, "Thiết kế (design)");
    assert.equal(unitChoices([{ slug: "design", display_name: "Thiết kế (Design Lead)", in_org: true } as never], false)[0].label, "Thiết kế");
  });
  it("Bàn giao giữa các phòng và Cây tổ chức dùng tên gọn", () => {
    assert.ok(read("src/pages/InterDeptFlows.tsx").includes("plainName(u.display_name) || clusterLabel(t, u.slug)"));
    assert.ok(read("src/pages/OrgChart.tsx").includes("sub: rawTitle && !sameLabelText(plainName(rawTitle), name) ? plainName(rawTitle) : \"\""));
  });
});

describe("«Nghi bị bỏ rơi» đổi sang chữ dễ hiểu", () => {
  it("nhãn trạng thái và tóm tắt", () => {
    const lg = read("src/i18n/label-groups.vi.ts");
    assert.ok(lg.includes('stale: "Có việc dở, chưa ai xử lý"') && !lg.includes("Nghi bị bỏ rơi"));
    const v = read("src/i18n/vi.ts");
    assert.ok(!v.includes("nghi bị bỏ rơi") && !v.includes("Nghi bị bỏ rơi"));
  });
});
