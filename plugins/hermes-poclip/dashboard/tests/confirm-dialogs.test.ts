import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  __resetConfirmForTests,
  alertDialog,
  getPendingConfirm,
  promptDialog,
  resolveConfirm,
  subscribeConfirm,
} from "../src/lib/confirm";

afterEach(() => __resetConfirmForTests());

describe("alertDialog", () => {
  it("hiện hộp thoại chỉ có nút OK và hoàn tất khi đóng", async () => {
    subscribeConfirm(() => undefined);
    let done = false;
    const p = alertDialog("Không lưu được").then(() => {
      done = true;
    });
    const pending = getPendingConfirm();
    assert.ok(pending);
    assert.equal(pending.hideCancel, true);
    assert.equal(pending.message, "Không lưu được");
    assert.equal(done, false);
    resolveConfirm(pending.id, true);
    await p;
    assert.equal(done, true);
  });

  it("chưa có ConfirmHost → rơi về window.alert (không mất thông báo)", async () => {
    const calls: string[] = [];
    (globalThis as any).window = { alert: (m: string) => calls.push(m) };
    try {
      await alertDialog("Lỗi nào đó");
    } finally {
      delete (globalThis as any).window;
    }
    assert.deepEqual(calls, ["Lỗi nào đó"]);
  });
});

describe("promptDialog", () => {
  it("trả chuỗi đã nhập khi bấm OK", async () => {
    subscribeConfirm(() => undefined);
    const p = promptDialog({ message: "Lý do?", defaultValue: "mặc định" });
    const pending = getPendingConfirm();
    assert.ok(pending);
    assert.equal(pending.input?.defaultValue, "mặc định");
    resolveConfirm(pending.id, true, "vì chưa đủ số liệu");
    assert.equal(await p, "vì chưa đủ số liệu");
  });

  it("trả null khi Hủy/Esc", async () => {
    subscribeConfirm(() => undefined);
    const p = promptDialog({ message: "Lý do?" });
    const pending = getPendingConfirm();
    assert.ok(pending);
    resolveConfirm(pending.id, false);
    assert.equal(await p, null);
  });

  it("OK với ô trống trả chuỗi rỗng (khác Hủy)", async () => {
    subscribeConfirm(() => undefined);
    const p = promptDialog({ message: "Ghi chú?" });
    const pending = getPendingConfirm();
    assert.ok(pending);
    resolveConfirm(pending.id, true, "");
    assert.equal(await p, "");
  });

  it("chưa có ConfirmHost → rơi về window.prompt", async () => {
    (globalThis as any).window = { prompt: (_m: string, d: string) => `${d}!` };
    try {
      assert.equal(await promptDialog({ message: "x", defaultValue: "a" }), "a!");
    } finally {
      delete (globalThis as any).window;
    }
  });
});
