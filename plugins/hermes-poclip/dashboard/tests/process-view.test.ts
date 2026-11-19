import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_VIEW, VIEW_ALL, groupProcesses, pickProcessView } from "../src/lib/processView";

const ids = ["escalation", "work", "hiring"];

describe("pickProcessView", () => {
  it("mặc định là luồng công việc khi chưa có lựa chọn đã lưu", () => {
    assert.equal(pickProcessView(null, ids), DEFAULT_VIEW);
    assert.equal(pickProcessView(undefined, ids), "work");
  });

  it("nhớ lựa chọn của người dùng nếu quy trình còn tồn tại", () => {
    assert.equal(pickProcessView("hiring", ids), "hiring");
    assert.equal(pickProcessView(VIEW_ALL, ids), "all");
  });

  it("lựa chọn đã lưu không còn tồn tại thì quay về luồng công việc", () => {
    assert.equal(pickProcessView("da-xoa", ids), "work");
  });

  it("công ty không có quy trình «work» thì lấy quy trình đầu tiên; không có gì thì «all»", () => {
    assert.equal(pickProcessView(null, ["a", "b"]), "a");
    assert.equal(pickProcessView("zzz", ["a", "b"]), "a");
    assert.equal(pickProcessView(null, []), "all");
  });
});

describe("groupProcesses", () => {
  const p = (id: string, group?: string) => ({ id, group });

  it("chia theo nhóm theo thứ tự cố định, giữ nguyên thứ tự trong từng nhóm", () => {
    const g = groupProcesses([p("meeting", "meetings"), p("work", "work"), p("hiring", "company"), p("inv_question", "work")]);
    assert.deepEqual(g.map((x) => [x.group, x.items.map((i) => i.id)]), [["work", ["work", "inv_question"]], ["company", ["hiring"]], ["meetings", ["meeting"]]]);
  });

  it("nhóm lạ hoặc thiếu rơi vào «other» và nhóm rỗng bị bỏ", () => {
    const g = groupProcesses([p("a"), p("b", "khong-biet"), p("c", "work")]);
    assert.deepEqual(g.map((x) => x.group), ["work", "other"]);
    assert.deepEqual(g[1].items.map((i) => i.id), ["a", "b"]);
    assert.deepEqual(groupProcesses([]), []);
  });
});
