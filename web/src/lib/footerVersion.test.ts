import { describe, expect, it } from "vitest";
import { footerVersionText } from "./footerVersion";

describe("footerVersionText — chân thanh bên hiện số hiệu bản Hermes+", () => {
  it("bản cài Hermes+: số hiệu bản phát hành, KHÔNG phải số phiên bản của Hermes gốc", () => {
    expect(footerVersionText({ plus_release: "2026.11.12-1", version: "0.21.7" })).toBe("2026.11.12-1");
  });
  it("bản thử giữ nguyên hậu tố", () => {
    expect(footerVersionText({ plus_release: "2026.11.12-1-thu", version: "0.21.7" })).toBe("2026.11.12-1-thu");
  });
  it("bản mã nguồn (không có số hiệu phát hành) rơi về số phiên bản lõi", () => {
    expect(footerVersionText({ plus_release: null, version: "0.21.7" })).toBe("v0.21.7");
    expect(footerVersionText({ version: "0.21.7" })).toBe("v0.21.7");
  });
  it("chưa có dữ liệu trạng thái", () => {
    expect(footerVersionText(null)).toBe("—");
    expect(footerVersionText(undefined)).toBe("—");
  });
});
