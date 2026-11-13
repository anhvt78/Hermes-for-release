import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  __resetConfirmForTests,
  confirmDialog,
  getPendingConfirm,
  resolveConfirm,
  subscribeConfirm,
} from "../src/lib/confirm";

afterEach(() => __resetConfirmForTests());

describe("confirmDialog — có ConfirmHost", () => {
  it("hiện hộp thoại và trả true khi đồng ý", async () => {
    subscribeConfirm(() => {});
    const p = confirmDialog({ message: "Xóa?", destructive: true });
    const pending = getPendingConfirm();
    assert.ok(pending);
    assert.equal(pending!.message, "Xóa?");
    assert.equal(pending!.destructive, true);
    resolveConfirm(pending!.id, true);
    assert.equal(await p, true);
    assert.equal(getPendingConfirm(), null);
  });

  it("trả false khi hủy", async () => {
    subscribeConfirm(() => {});
    const p = confirmDialog({ message: "Duyệt?" });
    resolveConfirm(getPendingConfirm()!.id, false);
    assert.equal(await p, false);
  });

  it("nhiều hộp thoại xếp hàng theo thứ tự, mỗi cái chốt riêng", async () => {
    subscribeConfirm(() => {});
    const a = confirmDialog({ message: "A" });
    const b = confirmDialog({ message: "B" });
    assert.equal(getPendingConfirm()!.message, "A");
    resolveConfirm(getPendingConfirm()!.id, true);
    assert.equal(await a, true);
    assert.equal(getPendingConfirm()!.message, "B");
    resolveConfirm(getPendingConfirm()!.id, false);
    assert.equal(await b, false);
  });

  it("chốt cùng id lần 2 (bấm đúp) bị bỏ qua", async () => {
    subscribeConfirm(() => {});
    const a = confirmDialog({ message: "A" });
    const b = confirmDialog({ message: "B" });
    const idA = getPendingConfirm()!.id;
    resolveConfirm(idA, true);
    resolveConfirm(idA, false); // đúp: không được chốt nhầm cho B
    assert.equal(await a, true);
    assert.equal(getPendingConfirm()!.message, "B");
    resolveConfirm(getPendingConfirm()!.id, true);
    assert.equal(await b, true);
  });

  it("báo cho người nghe mỗi khi hàng đợi đổi, và hủy đăng ký được", () => {
    let n = 0;
    const off = subscribeConfirm(() => { n++; });
    void confirmDialog({ message: "A" });
    assert.equal(n, 1);
    resolveConfirm(getPendingConfirm()!.id, true);
    assert.equal(n, 2);
    off();
    void confirmDialog({ message: "B" }); // không còn host → rơi về window.confirm (không có trong node → false)
    assert.equal(n, 2);
  });
});

describe("confirmDialog — chưa có ConfirmHost", () => {
  it("không có window.confirm (môi trường không trình duyệt) → false, tuyệt đối không tự đồng ý", async () => {
    assert.equal(await confirmDialog({ message: "Xóa?" }), false);
  });
});
