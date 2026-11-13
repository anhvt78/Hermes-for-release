import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  addAssignee,
  addProcessFrom,
  addStep,
  isDirty,
  libraryChoices,
  moveStep,
  newBlankProcess,
  parseTags,
  removeAssignee,
  removeProcess,
  removeStep,
  selectorLabel,
  setBranchFrom,
  setCaseTags,
  setProcText,
  setStepField,
  setThreshold,
  uniqueId,
  type Catalog,
  type Directory,
} from "../src/lib/processCatalogDraft";

const dir: Directory = {
  units: [{ key: "tech", label: "Kỹ thuật" }],
  roles: ["manager"],
  people: [{ id: "minh", name: "Minh", unit: "tech", role: "worker" }],
};
const pre = { unit: "Phòng", role: "Vai trò", profile: "Nhân viên" };

function base(): Catalog {
  return {
    version: 1,
    processes: [
      {
        id: "support",
        kind: "steps",
        title: "Khiếu nại",
        case_tags: ["[KHIẾU NẠI]"],
        steps: [
          { key: "a", label: "Nhận", assignees: ["unit:tech"] },
          { key: "b", label: "Xử lý", assignees: [], branch_from: "a" },
          { key: "c", label: "Đóng", assignees: [] },
        ],
        layout: [{ type: "chain", keys: ["a", "b", "c"] }],
      },
      { id: "work", kind: "builtin", builtin: "work", title: "Xử lý công việc" },
    ],
  };
}

describe("processCatalogDraft", () => {
  it("không sửa bản gốc và nhận ra thay đổi", () => {
    const c = base();
    const n = setProcText(c, 0, "title", "Mới");
    assert.equal(c.processes[0].title, "Khiếu nại");
    assert.equal(n.processes[0].title, "Mới");
    assert.equal(isDirty(c, c), false);
    assert.equal(isDirty(c, n), true);
  });

  it("nhãn người thực hiện dễ đọc, thiếu thì rơi về mã", () => {
    assert.equal(selectorLabel("unit:tech", dir, pre), "Phòng: Kỹ thuật");
    assert.equal(selectorLabel("role:manager", dir, pre), "Vai trò: manager");
    assert.equal(selectorLabel("profile:minh", dir, pre), "Nhân viên: Minh");
    assert.equal(selectorLabel("unit:zzz", dir, pre), "Phòng: zzz");
  });

  it("thêm/bỏ người thực hiện không trùng lặp", () => {
    let c = addAssignee(base(), 0, 1, "role:manager");
    c = addAssignee(c, 0, 1, "role:manager");
    assert.deepEqual(c.processes[0].steps![1].assignees, ["role:manager"]);
    c = removeAssignee(c, 0, 1, "role:manager");
    assert.deepEqual(c.processes[0].steps![1].assignees, []);
    assert.deepEqual(addAssignee(base(), 0, 1, "").processes[0].steps![1].assignees, []);
  });

  it("thêm bước đặt mã mới không trùng và vẽ lại nối tiếp", () => {
    const c = addStep(base(), 0, "Mới");
    const keys = c.processes[0].steps!.map((s) => s.key);
    assert.equal(new Set(keys).size, 4);
    assert.deepEqual(c.processes[0].layout, [{ type: "chain", keys }]);
  });

  it("xóa bước bỏ luôn nhánh rẽ trỏ vào nó", () => {
    const c = removeStep(base(), 0, 0);
    assert.deepEqual(c.processes[0].steps!.map((s) => s.key), ["b", "c"]);
    assert.equal("branch_from" in c.processes[0].steps![0], false);
    assert.deepEqual(c.processes[0].layout, [{ type: "chain", keys: ["b", "c"] }]);
  });

  it("đổi chỗ bước theo thứ tự và không vượt biên", () => {
    const c = moveStep(base(), 0, 0, 1);
    assert.deepEqual(c.processes[0].steps!.map((s) => s.key), ["b", "a", "c"]);
    assert.deepEqual(c.processes[0].layout, [{ type: "chain", keys: ["b", "a", "c"] }]);
    assert.deepEqual(moveStep(base(), 0, 0, -1), base());
    assert.deepEqual(moveStep(base(), 0, 2, 1), base());
  });

  it("nhánh rẽ đặt và bỏ được", () => {
    const set = setBranchFrom(base(), 0, 2, "a");
    assert.equal(set.processes[0].steps![2].branch_from, "a");
    const clear = setBranchFrom(set, 0, 2, "");
    assert.equal("branch_from" in clear.processes[0].steps![2], false);
  });

  it("chữ nhận ra sự vụ tách theo dấu phẩy, bỏ mục rỗng", () => {
    assert.deepEqual(parseTags(" [A] , ,[B]  ,"), ["[A]", "[B]"]);
    assert.deepEqual(setCaseTags(base(), 0, "[X], [Y]").processes[0].case_tags, ["[X]", "[Y]"]);
  });

  it("ngưỡng giữ giá trị còn lại và có mặc định", () => {
    const c = setThreshold(base(), 0, "warn_hours", 4);
    assert.deepEqual(c.processes[0].thresholds, { warn_hours: 4, bad_hours: 72 });
    assert.deepEqual(setThreshold(c, 0, "bad_hours", 12).processes[0].thresholds, { warn_hours: 4, bad_hours: 12 });
  });

  it("sửa chữ của bước", () => {
    assert.equal(setStepField(base(), 0, 0, "label", "Tiếp nhận").processes[0].steps![0].label, "Tiếp nhận");
    assert.equal(setStepField(base(), 0, 0, "who_label", "Tổng đài").processes[0].steps![0].who_label, "Tổng đài");
  });

  it("thêm quy trình từ thư viện đổi mã khi trùng; thư viện chỉ còn mục chưa có", () => {
    const lib = [
      { source: "default", fits: true, process: base().processes[1] },
      { source: "default", fits: true, process: { id: "hiring", kind: "builtin" as const, builtin: "hiring" } },
    ];
    assert.deepEqual(libraryChoices(lib, base()).map((x) => x.process.id), ["hiring"]);
    const c = addProcessFrom(base(), base().processes[1]);
    assert.deepEqual(c.processes.map((p) => p.id), ["support", "work", "work_2"]);
    assert.equal(uniqueId(c.processes, "work"), "work_3");
  });

  it("quy trình trống hợp lệ về hình dạng; bỏ quy trình theo vị trí", () => {
    const blank = newBlankProcess(base(), "Quy trình mới", "Bước mới");
    assert.equal(blank.kind, "steps");
    assert.deepEqual(blank.layout, [{ type: "chain", keys: ["step_1"] }]);
    assert.deepEqual(removeProcess(base(), 0).processes.map((p) => p.id), ["work"]);
  });
});
