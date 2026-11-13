import { describe, expect, it } from "vitest";
import { viTranslate } from "./vi-overlay";

describe("viTranslate", () => {
  it("dịch khớp chính xác, không phân biệt hoa/thường, giữ khoảng trắng", () => {
    expect(viTranslate("Drop files here")).toBe("Thả tệp vào đây");
    expect(viTranslate("  UPTIME ")).toBe("  Đã chạy ");
  });
  it("chuỗi lạ giữ nguyên", () => {
    expect(viTranslate("Some unknown label")).toBe("Some unknown label");
    expect(viTranslate("t_91741019")).toBe("t_91741019");
  });
  it("đổi ngày giờ kiểu Anh sang dd/mm/yyyy 24 giờ", () => {
    expect(viTranslate("Oct 23, 2026, 6:30 PM")).toBe("23/10/2026 18:30");
    expect(viTranslate("Nov 9, 2026, 12:05 AM")).toBe("09/11/2026 00:05");
    expect(viTranslate("Nov 9, 2026, 12:05 PM")).toBe("09/11/2026 12:05");
  });
  it("dịch dòng điều kiện của huy hiệu", () => {
    expect(viTranslate("Requirement: lifetime terminal calls. Tier ladder: Copper 750, Silver 2000, Gold 6000, Diamond 15000, Olympian 50000.")).toBe(
      "Điều kiện: tổng số lần gọi terminal. Các hạng: Đồng 750, Bạc 2000, Vàng 6000, Kim cương 15000, Olympian 50000.");
  });
  it("quy tắc Open / inference provider", () => {
    expect(viTranslate("Open .cache")).toBe("Mở .cache");
    expect(viTranslate("inference provider: deepseek")).toBe("nhà cung cấp suy luận: deepseek");
  });
});
