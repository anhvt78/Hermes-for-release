import { describe, expect, it } from "vitest";
import { checkPasswordForm, serverErrorMessage } from "./changePassword";

describe("checkPasswordForm", () => {
  it("thiếu mật khẩu hiện tại", () => {
    expect(checkPasswordForm("", "matkhaumoi1", "matkhaumoi1")).toBe("missingCurrent");
  });
  it("mật khẩu mới dưới 8 ký tự", () => {
    expect(checkPasswordForm("cu", "ngan", "ngan")).toBe("tooShort");
  });
  it("nhập lại không khớp", () => {
    expect(checkPasswordForm("cu", "matkhaumoi1", "matkhaumoi2")).toBe("mismatch");
  });
  it("hợp lệ → null", () => {
    expect(checkPasswordForm("cu", "matkhaumoi1", "matkhaumoi1")).toBeNull();
  });
  it("thứ tự kiểm tra: thiếu mật khẩu cũ trước, rồi độ dài, rồi khớp", () => {
    expect(checkPasswordForm("", "a", "b")).toBe("missingCurrent");
    expect(checkPasswordForm("cu", "a", "b")).toBe("tooShort");
  });
});

describe("serverErrorMessage", () => {
  it("ưu tiên thông điệp tiếng Việt, rồi tiếng Anh, rồi dự phòng", () => {
    expect(serverErrorMessage({ detail: { message_vi: "Sai mật khẩu.", message_en: "Wrong." } }, "x")).toBe("Sai mật khẩu.");
    expect(serverErrorMessage({ detail: { message_en: "Wrong." } }, "x")).toBe("Wrong.");
    expect(serverErrorMessage({}, "x")).toBe("x");
    expect(serverErrorMessage(null, "x")).toBe("x");
  });
});
