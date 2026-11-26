import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, validateReminderForm, type ReminderForm } from "../src/lib/reminder-thresholds";

// Biểu mẫu «Thời hạn nhắc việc» (tab «Báo cáo định kỳ»): kiểm tra bằng lời dễ hiểu trước khi gửi máy chủ

const msg = { positive: "SO_DUONG", orderSla: (k: string) => `THU_TU_CHI_THI ${k}`, orderAlert: (k: string) => `THU_TU_CANH_BAO ${k}` };
const good = (): ReminderForm => ({
  sla: { T1: { warn1: "4", warn2: "8", escalate: "12" }, T3: { warn1: "1", warn2: "", escalate: "2" } },
  ack: { critical: { remind: "15", escalate: "45" } },
});

describe("parseAmount", () => {
  it("nhận số nguyên, số thập phân dùng dấu phẩy hoặc chấm; rỗng/chữ → NaN", () => {
    assert.equal(parseAmount("4"), 4);
    assert.equal(parseAmount(" 2,5 "), 2.5);
    assert.equal(parseAmount("2.5"), 2.5);
    assert.ok(Number.isNaN(parseAmount("")));
    assert.ok(Number.isNaN(parseAmount("abc")));
  });
});

describe("validateReminderForm", () => {
  it("biểu mẫu hợp lệ → dựng đúng nội dung gửi (mốc nhắc lần 2 trống = null)", () => {
    const r = validateReminderForm(good(), msg);
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.payload, {
      directive_sla_hours: {
        T1: { warn1_hours: 4, warn2_hours: 8, escalate_hours: 12 },
        T3: { warn1_hours: 1, warn2_hours: null, escalate_hours: 2 },
      },
      alert_ack: { critical: { reminder_minutes: 15, escalate_minutes: 45 } },
    });
  });

  it("số không dương hoặc để trống → một lời báo chung, không gửi", () => {
    const f = good(); f.sla.T1.warn1 = "0"; f.sla.T3.escalate = ""; f.ack.critical.remind = "-1";
    const r = validateReminderForm(f, msg);
    assert.deepEqual(r.errors, ["SO_DUONG"]);
    assert.equal(r.payload, null);
  });

  it("thứ tự mốc sai: nhắc 1 < nhắc 2 < chuyển lên; có tên mức rủi ro trong lời báo", () => {
    const f = good(); f.sla.T1.warn2 = "13";
    assert.deepEqual(validateReminderForm(f, msg).errors, ["THU_TU_CHI_THI T1"]);
    const g = good(); g.sla.T3.escalate = "1";
    assert.deepEqual(validateReminderForm(g, msg).errors, ["THU_TU_CHI_THI T3"]);
  });

  it("cảnh báo: leo thang phải lớn hơn nhắc lại", () => {
    const f = good(); f.ack.critical.escalate = "15";
    assert.deepEqual(validateReminderForm(f, msg).errors, ["THU_TU_CANH_BAO critical"]);
  });
});
