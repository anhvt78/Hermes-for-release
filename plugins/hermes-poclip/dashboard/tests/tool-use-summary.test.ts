import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { summarizeToolArgs } from "../src/lib/toolUseSummary";

const NL = String.fromCharCode(10);

describe("summarizeToolArgs — tóm tắt «việc định làm» của phiếu xin phép dùng công cụ", () => {
  it("lệnh nhiều dòng trong JSON → là lệnh, đếm số dòng, lấy dòng đầu có nội dung, gập lại", () => {
    const cmd = ["# ghi chú", "cd /tmp/x", "echo hi", "ls"].join(NL);
    const s = summarizeToolArgs(JSON.stringify({ command: cmd }));
    assert.equal(s.isCommand, true);
    assert.equal(s.lines, 4);
    assert.equal(s.first, "cd /tmp/x");           // bỏ dòng chú thích «#…»
    assert.equal(s.collapse, true);
    assert.equal(s.full, cmd);
  });

  it("lệnh một dòng ngắn → không gập", () => {
    const s = summarizeToolArgs(JSON.stringify({ command: "ls -la" }));
    assert.equal(s.isCommand, true);
    assert.equal(s.lines, 1);
    assert.equal(s.collapse, false);
  });

  it("lệnh một dòng rất dài → gập và dòng đầu được cắt có «…»", () => {
    const long = "echo " + "x".repeat(400);
    const s = summarizeToolArgs(JSON.stringify({ command: long }));
    assert.equal(s.collapse, true);
    assert.ok(s.first.endsWith("…") && s.first.length <= 110);
  });

  it("văn bản thường (không phải JSON) → giữ nguyên, không coi là lệnh", () => {
    const s = summarizeToolArgs("Đọc tệp báo cáo tuần");
    assert.equal(s.isCommand, false);
    assert.equal(s.full, "Đọc tệp báo cáo tuần");
    assert.equal(s.collapse, false);
  });

  it("JSON hỏng hoặc rỗng không làm hỏng giao diện", () => {
    assert.equal(summarizeToolArgs("{không phải json").isCommand, false);
    const e = summarizeToolArgs(undefined);
    assert.equal(e.full, "");
    assert.equal(e.lines, 0);
  });
});
