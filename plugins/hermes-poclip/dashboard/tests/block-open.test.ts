import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readStoredOpen, resolveOpen, saveStoredOpen } from "../src/lib/blockOpen";

describe("resolveOpen", () => {
  it("chưa có lựa chọn của người dùng → theo gợi ý tự động", () => {
    assert.equal(resolveOpen(null, true), true);
    assert.equal(resolveOpen(null, false), false);
  });
  it("người dùng đã chọn → lựa chọn thắng gợi ý tự động", () => {
    assert.equal(resolveOpen("1", false), true);
    assert.equal(resolveOpen("0", true), false);
  });
});

describe("readStoredOpen / saveStoredOpen", () => {
  it("không có window/localStorage (hoặc bị chặn) → null, không ném lỗi", () => {
    assert.equal(readStoredOpen("k"), null);
    assert.doesNotThrow(() => saveStoredOpen("k", true));
  });
  it("lưu rồi đọc lại đúng", () => {
    const mem = new Map<string, string>();
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
        setItem: (k: string, v: string) => void mem.set(k, v),
      },
    };
    try {
      assert.equal(readStoredOpen("k"), null);
      saveStoredOpen("k", false);
      assert.equal(readStoredOpen("k"), "0");
      saveStoredOpen("k", true);
      assert.equal(readStoredOpen("k"), "1");
      mem.set("k", "rác");
      assert.equal(readStoredOpen("k"), null);
    } finally {
      delete (globalThis as any).window;
    }
  });
});
