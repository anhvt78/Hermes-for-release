import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeNewKey } from "../src/lib/connection-keys";
import type { EnvKeyItem } from "../src/lib/connection-keys";

// ── normalizeNewKey ────────────────────────────────────────────────────────────

describe("normalizeNewKey — ánh xạ trường khoá thô", () => {
  it("API trả về trường `key` → raw_key nhận giá trị đó", () => {
    const result = normalizeNewKey({ key: "pcl_abc", id: "1", name: "test" });
    assert.equal(result.raw_key, "pcl_abc");
    assert.equal(result.id, "1");
  });

  it("đã có raw_key → giữ nguyên, không ghi đè", () => {
    const result = normalizeNewKey({ raw_key: "pcl_z", key: "pcl_other" });
    assert.equal(result.raw_key, "pcl_z");
  });

  it("thiếu cả hai trường → raw_key là chuỗi rỗng", () => {
    const result = normalizeNewKey({ id: "x" });
    assert.equal(result.raw_key, "");
  });
});

// ── EnvKeyItem — nhãn danh sách env ──────────────────────────────────────────

describe("EnvKeyItem — nhãn danh sách", () => {
  it("item managed → có dấu ✓ khi dùng theo quy ước giao diện", () => {
    const item: EnvKeyItem = { prefix: "poclip-3ab", managed: true };
    const label = item.prefix + (item.managed ? " ✓" : "");
    assert.equal(label, "poclip-3ab ✓");
  });

  it("item chưa managed → không có ✓", () => {
    const item: EnvKeyItem = { prefix: "poclip-7cd", managed: false };
    const label = item.prefix + (item.managed ? " ✓" : "");
    assert.equal(label, "poclip-7cd");
  });
});
