import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { genesisTabVisible, onboardingQueueAllHired } from "../src/lib/tabGroups";

// Dọn nội dung trùng lặp giữa tab «Công ty» và «Chính sách» — đợt 24/11/2026

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
const read = (rel: string) => fs.readFileSync(findSrc(rel), "utf-8");

describe("tab Tuyển dụng: ẩn khi đã thuê đủ", () => {
  it("chưa lập xong công ty → luôn hiện", () => {
    assert.equal(genesisTabVisible(false, 0), true);
    assert.equal(genesisTabVisible(false, 8, true), true);
  });
  it("lập xong, còn vị trí chưa thuê → hiện (còn chỗ nhập khoá, bấm tuyển)", () => {
    assert.equal(genesisTabVisible(true, 8, false), true);
  });
  it("lập xong, thuê đủ → ẩn (tab chỉ còn nút chuyển trang + lặp dòng tiến độ của Tiếp nhận)", () => {
    assert.equal(genesisTabVisible(true, 8, true), false);
    assert.equal(genesisTabVisible(true, 0), false);
  });
  it("onboardingQueueAllHired: chỉ true khi hàng đợi không rỗng và mọi dòng có exists=true", () => {
    assert.equal(onboardingQueueAllHired([{ exists: true }, { exists: true }]), true);
    assert.equal(onboardingQueueAllHired([{ exists: true }, { exists: false }]), false);
    assert.equal(onboardingQueueAllHired([{ exists: true }, {}]), false);
    assert.equal(onboardingQueueAllHired([]), false);
    assert.equal(onboardingQueueAllHired(undefined), false);
    assert.equal(onboardingQueueAllHired([null]), false);
  });
  it("index.tsx truyền cờ thuê đủ vào quy tắc hiện tab", () => {
    const idx = read("src/index.tsx");
    assert.ok(idx.includes("onboardingQueueAllHired(genesisStatus.data?.onboarding_queue)"));
  });
});

describe("«Duyệt tất cả» đề xuất chính sách: bỏ khỏi trang Chính sách (khớp trang Chờ duyệt)", () => {
  const sugg = read("../hermes-poclip-policy/dashboard/src/pages/PolicyConfig/SuggestionBlock.tsx");
  it("không còn nút / hàm duyệt hàng loạt", () => {
    assert.ok(!sugg.includes("data-sugg-approve-all"));
    assert.ok(!sugg.includes("handleApproveAll"));
    assert.ok(!sugg.includes("approve-all"));
  });
  it("câu «?» không còn dặn bấm «Duyệt tất cả»", () => {
    const vi = read("../hermes-poclip-policy/dashboard/src/i18n/vi.ts");
    assert.ok(!vi.includes("hoặc bấm «Duyệt tất cả»"));
    assert.ok(vi.includes("cố ý không có nút «Duyệt tất cả»"));
  });
  it("duyệt/từ chối từng đề xuất vẫn còn", () => {
    assert.ok(sugg.includes("/approve`"));
    assert.ok(sugg.includes("/reject`"));
  });
  it("trang Chờ duyệt vẫn cố ý không có «duyệt tất cả»", () => {
    const pp = read("src/components/PolicyProposals.tsx");
    assert.ok(pp.includes("KHÔNG có nút «duyệt tất cả»"));
    assert.ok(!pp.includes("approve-all"));
  });
});

describe("Phòng chưa có luồng: một nguồn số liệu, dải ở Bàn giao không liệt kê lại tên", () => {
  const page = read("src/pages/InterDeptFlows.tsx");
  const vi = read("src/i18n/vi.ts");
  it("dải dùng cờ của máy chủ, không tự lọc lại", () => {
    assert.ok(page.includes("u.without_flow === true"));
    assert.ok(!page.includes("(u.rules_count ?? 0) === 0"));
  });
  it("dải chỉ còn số phòng + «?» + nút sang Cơ chế vận hành (không liệt kê tên)", () => {
    assert.ok(page.includes("f.noRuleHint"));
    assert.ok(!page.includes("f.noRuleBody"));
    assert.ok(!page.includes("f.noRuleMore"));
  });
  it("không còn đại từ «anh» trong chữ giao diện của dải", () => {
    assert.ok(!vi.includes("để anh duyệt"));
  });
});

describe("Chế độ «Thay đổi cơ cấu tổ chức»: nói rõ là cùng một giá trị ở hai tab", () => {
  it("Mức kiểm soát có liên kết sang Cài đặt điều hành", () => {
    const cl = read("src/pages/ControlLevel.tsx");
    assert.ok(cl.includes('org_structure_mode: "operating-settings"'));
    const vi = read("src/i18n/vi.ts");
    assert.ok(vi.includes('"operating-settings": "Thông số này cũng chỉnh được ở tab Cài đặt điều hành'));
  });
  it("Cài đặt điều hành có liên kết ngược sang Mức kiểm soát", () => {
    const om = read("src/pages/OperatingModel.tsx");
    assert.ok(om.includes("data-om-org-also-in-control"));
    assert.ok(om.includes('navigateToTab("control-level")'));
  });
});

describe("Thông báo: nhóm «Phiếu chờ duyệt» đổi tên để khỏi nhầm với phiếu ở trang Chờ duyệt", () => {
  it("nhãn mới ở cả hai nơi khai", () => {
    assert.ok(read("src/i18n/label-groups.vi.ts").includes('approval: "Nhắc việc chờ duyệt"'));
    const vi = read("src/i18n/vi.ts");
    assert.ok(vi.includes('approval: "Nhắc việc chờ duyệt"'));
  });
});
