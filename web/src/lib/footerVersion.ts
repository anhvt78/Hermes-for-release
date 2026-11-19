import type { StatusResponse } from "@/lib/api";

/** Chữ ở góc trái chân thanh bên: SỐ HIỆU BẢN PHÁT HÀNH Hermes+ (vd "2026.11.12-1").
 * Chỉ bản mã nguồn chạy thẳng từ thư mục phát triển (không có số hiệu phát hành) mới rơi về số phiên bản lõi của Hermes gốc. */
export function footerVersionText(status: Pick<StatusResponse, "plus_release" | "version"> | null | undefined): string {
  if (status?.plus_release) return status.plus_release;
  return status?.version != null ? `v${status.version}` : "—";
}
