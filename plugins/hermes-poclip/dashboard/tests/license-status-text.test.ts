import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { en } from "../src/i18n/en";
import { vi } from "../src/i18n/vi";

// 21/11/2026: giao diện tiếng Anh hiện «Giấy phép hợp lệ (không hết hạn).» vì chữ trạng thái giấy phép do máy chủ ghi bằng tiếng Việt.
// Nay máy chủ gửi kèm MÃ ổn định và giao diện dịch theo mã.
const CODES = ["missing", "bad_format", "bad_signature", "other_machine", "valid_perpetual", "valid_term", "grace", "expired",
  "trial_tampered", "trial_other_machine", "trial_valid", "trial_grace", "trial_expired"];

describe("statusMsg — dịch trạng thái giấy phép theo mã", () => {
  it("bản tiếng Anh: mọi mã đều có câu tiếng Anh, không còn dấu tiếng Việt", () => {
    for (const c of CODES) {
      const s = (en as any).license.statusMsg(c, 5);
      assert.ok(s, c);
      assert.ok(!/[à-ỹĐđ]/i.test(s), `${c}: ${s}`);
    }
    assert.equal((en as any).license.statusMsg("valid_perpetual", 0), "License is valid (no expiry).");
    assert.match((en as any).license.statusMsg("valid_term", 12), /12 days left/);
    assert.match((en as any).license.statusMsg("trial_valid", 7), /7 days left/);
  });
  it("bản tiếng Việt: mọi mã đều có câu và giữ nguyên chữ máy chủ cũ", () => {
    for (const c of CODES) assert.ok((vi as any).license.statusMsg(c, 5), c);
    assert.equal((vi as any).license.statusMsg("valid_perpetual", 0), "Giấy phép hợp lệ (không hết hạn).");
    assert.equal((vi as any).license.statusMsg("valid_term", 3), "Giấy phép hợp lệ, còn 3 ngày.");
  });
  it("mã lạ → null để rơi về chữ máy chủ", () => {
    assert.equal((en as any).license.statusMsg("something_new", 0), null);
  });
});
