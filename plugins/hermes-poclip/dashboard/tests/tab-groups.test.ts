import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TAB_GROUPS,
  groupIdOfTab,
  tabsOfGroup,
  firstGroupWithVisibleTab,
  firstVisibleTabInGroup,
  genesisTabVisible,
} from "../src/lib/tabGroups";
import { tabLabelWithCount } from "../src/lib/proposalsBadge";

// ── Cấu trúc TAB_GROUPS ───────────────────────────────────────────────────────
// 2 tầng: nhóm → tab. 4 nhóm theo việc của Chủ tịch; "Đề xuất cơ cấu" và "Cài đặt điều hành" được tách
// ra từ trang Cơ chế vận hành (trước đây là 3 hàng tab chồng nhau).

const EXPECTED_GROUPS = 4;
const EXPECTED_TABS = 26; // +1: quality-board (Chất lượng nhân viên AI); +1: control-level (Mức kiểm soát)
const MAX_TABS_PER_GROUP = 8;   // nhóm «Tổ chức» có 8 tab từ khi thêm «Mức kiểm soát»

// 19 tab của cấu trúc cũ — không tab nào được mất, đường dẫn cũ (?tab=<id>) vẫn phải dùng được.
const LEGACY_TAB_IDS = [
  "genesis-wizard", "operating-model", "executive-dashboard", "inter-dept-flows", "notifications",
  "flows-progress", "approval-queue", "goal-tree", "meeting-room", "projects",
  "org-chart", "onboarding-wizard", "budget",
  "monitoring", "system-health", "connection-keys", "users", "audit-trail",
  "customer-portal",
];

describe("TAB_GROUPS — structure", () => {
  it("đúng 4 nhóm", () => {
    assert.equal(TAB_GROUPS.length, EXPECTED_GROUPS);
  });

  it("đúng 26 tab id (gồm tab Xuất, nhập công ty)", () => {
    const allIds = TAB_GROUPS.flatMap((g) => [...g.tabIds]);
    assert.equal(allIds.length, EXPECTED_TABS);
  });

  it("không có id trùng", () => {
    const allIds = TAB_GROUPS.flatMap((g) => [...g.tabIds]);
    assert.equal(new Set(allIds).size, EXPECTED_TABS);
  });

  it("không tab cũ nào bị mất; thêm 2 tab tách từ Cơ chế vận hành và tab Hộp kiểm soát", () => {
    const allIds = new Set(TAB_GROUPS.flatMap((g) => [...g.tabIds]));
    for (const id of LEGACY_TAB_IDS) assert.ok(allIds.has(id), `thiếu tab cũ ${id}`);
    assert.ok(allIds.has("org-change-proposals"));
    assert.ok(allIds.has("operating-settings"));
    assert.ok(allIds.has("control-box"));
  });

  it("mỗi nhóm không quá 8 tab (thanh tab không dài/rối)", () => {
    for (const g of TAB_GROUPS) {
      assert.ok(g.tabIds.length >= 1 && g.tabIds.length <= MAX_TABS_PER_GROUP, `nhóm ${g.id} có ${g.tabIds.length} tab`);
    }
  });

  it("thứ tự nhóm: inbox, work, organization, system", () => {
    assert.deepEqual(TAB_GROUPS.map((g) => g.id), ["inbox", "work", "organization", "system"]);
  });

  it("inbox — việc cần xử lý, đúng thứ tự khai báo", () => {
    const g = TAB_GROUPS.find((g) => g.id === "inbox")!;
    assert.deepEqual([...g.tabIds], ["notifications", "approval-queue", "org-change-proposals", "control-box"]);
  });

  it("work — công việc", () => {
    const g = TAB_GROUPS.find((g) => g.id === "work")!;
    assert.deepEqual([...g.tabIds], [
      "executive-dashboard", "flows-progress", "goal-tree", "meeting-room", "projects", "customer-portal",
    ]);
  });

  it("organization — tổ chức (genesis-wizard đứng CUỐI: sau khi lập xong nó là tab «Tuyển dụng» và không được chiếm trang mặc định)", () => {
    const g = TAB_GROUPS.find((g) => g.id === "organization")!;
    assert.deepEqual([...g.tabIds], [
      "org-chart", "quality-board", "control-level", "operating-model", "inter-dept-flows", "onboarding-wizard", "budget", "genesis-wizard",
    ]);
  });

  it("system — hệ thống", () => {
    const g = TAB_GROUPS.find((g) => g.id === "system")!;
    assert.deepEqual([...g.tabIds], [
      "monitoring", "system-health", "audit-trail", "ai-activity-log", "users", "connection-keys", "company-package", "operating-settings",
    ]);
  });

  it("mỗi nhóm có labelKey trùng id", () => {
    for (const g of TAB_GROUPS) {
      assert.equal(g.labelKey, g.id, `nhóm ${g.id} labelKey`);
    }
  });
});

// ── groupIdOfTab ──────────────────────────────────────────────────────────────

describe("groupIdOfTab", () => {
  const cases: Array<[string, string]> = [
    ["notifications", "inbox"],
    ["approval-queue", "inbox"],
    ["org-change-proposals", "inbox"],
    ["executive-dashboard", "work"],
    ["flows-progress", "work"],
    ["goal-tree", "work"],
    ["meeting-room", "work"],
    ["projects", "work"],
    ["customer-portal", "work"],
    ["genesis-wizard", "organization"],
    ["org-chart", "organization"],
    ["operating-model", "organization"],
    ["inter-dept-flows", "organization"],
    ["onboarding-wizard", "organization"],
    ["budget", "organization"],
    ["monitoring", "system"],
    ["system-health", "system"],
    ["audit-trail", "system"],
    ["ai-activity-log", "system"],
    ["users", "system"],
    ["connection-keys", "system"],
    ["company-package", "system"],
    ["operating-settings", "system"],
  ];
  for (const [tab, group] of cases) {
    it(`${tab} → ${group}`, () => {
      assert.equal(groupIdOfTab(tab), group);
    });
  }

  it("id lạ → null", () => {
    assert.equal(groupIdOfTab("không-tồn-tại"), null);
    assert.equal(groupIdOfTab(""), null);
  });
});

// ── tabsOfGroup ───────────────────────────────────────────────────────────────

describe("tabsOfGroup", () => {
  it("chỉ trả tab đang hiển thị, giữ thứ tự khai báo", () => {
    const visible = ["org-change-proposals", "notifications", "flows-progress"];
    assert.deepEqual(tabsOfGroup("inbox", visible), ["notifications", "org-change-proposals"]);
  });

  it("nhóm không có tab hiển thị → mảng rỗng", () => {
    assert.deepEqual(tabsOfGroup("work", ["notifications"]), []);
  });

  it("nhóm không tồn tại → mảng rỗng", () => {
    assert.deepEqual(tabsOfGroup("không-tồn-tại", ["notifications"]), []);
  });

  it("visibleIds rỗng → mảng rỗng", () => {
    assert.deepEqual(tabsOfGroup("inbox", []), []);
  });

  it("công ty chưa lập: chỉ có genesis-wizard → nhóm organization chỉ còn 1 tab", () => {
    assert.deepEqual(tabsOfGroup("organization", ["genesis-wizard"]), ["genesis-wizard"]);
  });
});

// ── firstGroupWithVisibleTab ──────────────────────────────────────────────────

describe("firstGroupWithVisibleTab", () => {
  it("trả nhóm đầu tiên (theo thứ tự TAB_GROUPS) có tab hiển thị", () => {
    assert.equal(firstGroupWithVisibleTab(["goal-tree", "org-chart"]), "work");
  });

  it("khi tab của nhóm đầu cũng có mặt, ưu tiên nhóm đó", () => {
    assert.equal(firstGroupWithVisibleTab(["notifications", "goal-tree"]), "inbox");
  });

  it("khi không có tab hiển thị nào → null", () => {
    assert.equal(firstGroupWithVisibleTab([]), null);
  });

  it("chỉ tab của nhóm system → system", () => {
    assert.equal(firstGroupWithVisibleTab(["system-health"]), "system");
  });
});

// ── firstVisibleTabInGroup ────────────────────────────────────────────────────

describe("firstVisibleTabInGroup", () => {
  it("trả tab đầu tiên theo thứ tự khai báo, không phải thứ tự visibleIds", () => {
    const visible = ["org-change-proposals", "approval-queue"];
    assert.equal(firstVisibleTabInGroup("inbox", visible), "approval-queue");
  });

  it("nhóm không có tab hiển thị → null", () => {
    assert.equal(firstVisibleTabInGroup("system", ["notifications"]), null);
  });

  it("nhóm không tồn tại → null", () => {
    assert.equal(firstVisibleTabInGroup("không-tồn-tại", ["notifications"]), null);
  });

  it("visibleIds rỗng → null", () => {
    assert.equal(firstVisibleTabInGroup("inbox", []), null);
  });

  it("work: meeting-room và goal-tree đều hiển thị → trả goal-tree (thứ tự khai báo)", () => {
    assert.equal(firstVisibleTabInGroup("work", ["meeting-room", "goal-tree"]), "goal-tree");
  });
});

// ── số đề xuất trên nhãn tab ──────────────────────────────────────────────────

describe("tabLabelWithCount", () => {
  it("có việc chờ → kèm số", () => {
    assert.equal(tabLabelWithCount("Đề xuất cơ cấu", 10), "Đề xuất cơ cấu (10)");
  });
  it("không có việc → giữ nguyên nhãn", () => {
    assert.equal(tabLabelWithCount("Đề xuất cơ cấu", 0), "Đề xuất cơ cấu");
  });
});


describe("genesisTabVisible — tab Thành lập công ty / Tuyển dụng", () => {
  it("chưa lập xong công ty → luôn hiện", () => {
    assert.equal(genesisTabVisible(false, 0), true);
    assert.equal(genesisTabVisible(false, 4), true);
  });
  it("lập xong và còn vị trí trong hàng đợi → vẫn hiện để còn chỗ nhập khoá tuyển dụng", () => {
    assert.equal(genesisTabVisible(true, 4), true);
  });
  it("lập xong và hàng đợi rỗng → ẩn", () => {
    assert.equal(genesisTabVisible(true, 0), false);
  });
  it("organization: sau khi lập xong, tab đầu của nhóm vẫn là org-chart (không bị tab tuyển dụng chiếm)", () => {
    const visible = ["org-chart", "quality-board", "genesis-wizard"];
    assert.equal(tabsOfGroup("organization", visible)[0], "org-chart");
  });
});
