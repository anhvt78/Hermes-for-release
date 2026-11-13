import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPaused, pausedRows, minutesToNextProbe, probeLabelKey } from "../src/lib/provider-health";

describe("provider-health — chuông báo cháy nhà cung cấp hết tiền", () => {
  it("chỉ nhà cung cấp đang «paused» mới được coi là đang dừng", () => {
    assert.equal(isPaused({ state: "paused" }), true);
    assert.equal(isPaused({ state: "ok" }), false);
    assert.equal(isPaused({}), false);
    assert.deepEqual(pausedRows([{ state: "ok" }, { state: "paused", provider: "deepseek" }] as any).length, 1);
    assert.deepEqual(pausedRows(undefined), []);
  });
  it("số phút tới lượt thử kế tiếp không âm; không biết thì null", () => {
    const now = 1_000_000_000_000;
    assert.equal(minutesToNextProbe(now / 1000 + 600, now), 10);
    assert.equal(minutesToNextProbe(now / 1000 - 60, now), 0);
    assert.equal(minutesToNextProbe(null, now), null);
    assert.equal(minutesToNextProbe(undefined, now), null);
  });
  it("kết quả lượt thử lạ hoặc rỗng → «chưa thử»", () => {
    assert.equal(probeLabelKey("still_out"), "still_out");
    assert.equal(probeLabelKey("ok"), "ok");
    assert.equal(probeLabelKey("stuck"), "stuck");
    assert.equal(probeLabelKey("khac"), "none");
    assert.equal(probeLabelKey(null), "none");
  });
});
