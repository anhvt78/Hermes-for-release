import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyCron, buildWeeklyCron, describeSchedule, parseDailyCron, parseTimeValue, parseWeeklyCron, timeValue,
} from "../src/lib/digest-time";

// Giờ tạo báo cáo tóm tắt ↔ mã lịch cron 5 trường (tab «Lịch và nhắc việc»)

describe("digest-time", () => {
  it("đọc lịch hằng ngày đơn giản; lịch lạ trả null (không đoán)", () => {
    assert.deepEqual(parseDailyCron("0 8 * * *"), { h: 8, m: 0 });
    assert.deepEqual(parseDailyCron(" 30  17 * * * "), { h: 17, m: 30 });
    assert.equal(parseDailyCron("0 8 1 * *"), null);
    assert.equal(parseDailyCron("0 25 * * *"), null);
    assert.equal(parseDailyCron("*/5 8 * * *"), null);
    assert.equal(parseDailyCron(""), null);
  });

  it("đọc lịch hằng tuần; 7 cũng là Chủ nhật", () => {
    assert.deepEqual(parseWeeklyCron("0 9 * * 1"), { h: 9, m: 0, d: 1 });
    assert.deepEqual(parseWeeklyCron("15 7 * * 7"), { h: 7, m: 15, d: 0 });
    assert.equal(parseWeeklyCron("0 9 * * 1-5"), null);
  });

  it("dựng mã lịch từ giờ đã chọn", () => {
    assert.equal(buildDailyCron(8, 0), "0 8 * * *");
    assert.equal(buildWeeklyCron(9, 30, 1), "30 9 * * 1");
    assert.equal(buildWeeklyCron(9, 0, 7), "0 9 * * 0");
  });

  it("giờ dạng «08:05»", () => {
    assert.deepEqual(parseTimeValue("08:05"), { h: 8, m: 5 });
    assert.equal(parseTimeValue("8:5"), null);
    assert.equal(parseTimeValue("24:00"), null);
    assert.equal(timeValue({ h: 8, m: 5 }), "08:05");
  });

  it("câu mô tả cho người đọc", () => {
    const days = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const d = (t: string) => `Mỗi ngày lúc ${t}`;
    const w = (day: string, t: string) => `${day} hằng tuần lúc ${t}`;
    assert.equal(describeSchedule("0 8 * * *", d, w, days), "Mỗi ngày lúc 08:00");
    assert.equal(describeSchedule("0 9 * * 1", d, w, days), "Thứ Hai hằng tuần lúc 09:00");
    assert.equal(describeSchedule("0 8 1 * *", d, w, days), null);
  });
});

import { formatInTz } from "../src/lib/digest-time";

describe("formatInTz", () => {
  it("hiển thị theo múi giờ đã cấu hình, không theo trình duyệt", () => {
    assert.equal(formatInTz("2026-11-24T01:00:00Z", "Asia/Ho_Chi_Minh"), "08:00 24/11/2026");
    assert.equal(formatInTz("2026-11-24T01:00:00Z", "UTC"), "01:00 24/11/2026");
    assert.equal(formatInTz("2026-11-30T02:00:00Z", "Asia/Tokyo"), "11:00 30/11/2026");
  });
  it("nửa đêm là 00:00 (không phải 24:00); múi giờ lạ hoặc ngày sai không làm hỏng", () => {
    assert.equal(formatInTz("2026-11-23T17:00:00Z", "Asia/Ho_Chi_Minh"), "00:00 24/11/2026");
    assert.equal(formatInTz("2026-11-24T01:00:00Z", "Khong/Co"), "2026-11-24T01:00:00Z");
    assert.equal(formatInTz("khong-phai-ngay", "UTC"), "khong-phai-ngay");
    assert.equal(formatInTz(null, "UTC"), "—");
  });
});
