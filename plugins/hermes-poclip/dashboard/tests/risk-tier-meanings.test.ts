import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRiskTierMeanings } from "../src/lib/risk-tier-meanings";

// ── Test data ─────────────────────────────────────────────────────────────────

const ITEMS = [
  { code: "T0", meaning: "Tự động hoàn toàn, không cần theo dõi", meaning_en: "Fully automated, no monitoring needed" },
  { code: "T1", meaning: "Rủi ro trung bình", meaning_en: "Medium risk" },
  { code: "T2", meaning: "Rủi ro cao", meaning_en: null },
  { code: "T3", meaning: "Rủi ro rất cao", meaning_en: "Very high risk" },
];

// ── (a) locale vi: lấy meaning ────────────────────────────────────────────────

describe("buildRiskTierMeanings — vi: lấy meaning", () => {
  it("T0 trả về meaning tiếng Việt", () => {
    const m = buildRiskTierMeanings(ITEMS, "vi");
    assert.equal(m["T0"], "Tự động hoàn toàn, không cần theo dõi");
  });

  it("T1 trả về meaning tiếng Việt", () => {
    const m = buildRiskTierMeanings(ITEMS, "vi");
    assert.equal(m["T1"], "Rủi ro trung bình");
  });

  it("vi: kết quả có đủ 4 mã", () => {
    const m = buildRiskTierMeanings(ITEMS, "vi");
    assert.equal(Object.keys(m).length, 4);
  });

  it("locale không phải en cũng lấy meaning (vd 'fr')", () => {
    const m = buildRiskTierMeanings(ITEMS, "fr");
    assert.equal(m["T0"], "Tự động hoàn toàn, không cần theo dõi");
  });
});

// ── (b) locale en: lấy meaning_en ────────────────────────────────────────────

describe("buildRiskTierMeanings — en: lấy meaning_en", () => {
  it("T0 trả về meaning_en tiếng Anh", () => {
    const m = buildRiskTierMeanings(ITEMS, "en");
    assert.equal(m["T0"], "Fully automated, no monitoring needed");
  });

  it("T1 trả về meaning_en tiếng Anh", () => {
    const m = buildRiskTierMeanings(ITEMS, "en");
    assert.equal(m["T1"], "Medium risk");
  });
});

// ── (c) en + thiếu meaning_en → KHÔNG có khoá trong kết quả ─────────────────

describe("buildRiskTierMeanings — en + thiếu meaning_en → fallback i18n", () => {
  it("T2 không có meaning_en → khoá T2 vắng mặt trong kết quả", () => {
    const m = buildRiskTierMeanings(ITEMS, "en");
    assert.equal(Object.prototype.hasOwnProperty.call(m, "T2"), false);
  });

  it("T2 vắng mặt, các mã có bản dịch vẫn có mặt", () => {
    const m = buildRiskTierMeanings(ITEMS, "en");
    assert.ok("T0" in m);
    assert.ok("T1" in m);
    assert.ok(!("T2" in m));
    assert.ok("T3" in m);
  });
});

// ── (d) item rỗng / null → không vỡ ─────────────────────────────────────────

describe("buildRiskTierMeanings — item rỗng/null → không vỡ", () => {
  it("mảng rỗng → kết quả rỗng", () => {
    const m = buildRiskTierMeanings([], "en");
    assert.equal(Object.keys(m).length, 0);
  });

  it("item null trong mảng → bỏ qua, không ném lỗi", () => {
    const items = [null, { code: "T0", meaning: "vi", meaning_en: "en" }] as Parameters<typeof buildRiskTierMeanings>[0];
    const m = buildRiskTierMeanings(items, "en");
    assert.equal(m["T0"], "en");
  });

  it("item với code rỗng → bỏ qua", () => {
    const items = [
      { code: "", meaning: "vi", meaning_en: "en" },
      { code: "T1", meaning: "vi1", meaning_en: "en1" },
    ];
    const m = buildRiskTierMeanings(items, "en");
    assert.ok(!("" in m));
    assert.equal(m["T1"], "en1");
  });

  it("item với cả meaning lẫn meaning_en null → bỏ qua (vi)", () => {
    const items = [{ code: "T0", meaning: null, meaning_en: null }];
    const m = buildRiskTierMeanings(items, "vi");
    assert.ok(!("T0" in m));
  });

  it("vi: meaning null nhưng meaning_en có → fallback sang meaning_en", () => {
    const items = [{ code: "T0", meaning: null, meaning_en: "en fallback" }];
    const m = buildRiskTierMeanings(items, "vi");
    assert.equal(m["T0"], "en fallback");
  });
});
