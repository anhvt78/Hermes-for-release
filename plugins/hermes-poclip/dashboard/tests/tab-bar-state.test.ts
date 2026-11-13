import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeTabBarState, clampScrollLeft } from "../src/lib/tabBarState";

// ── computeTabBarState ────────────────────────────────────────────────────────

describe("computeTabBarState — không tràn", () => {
  it("nội dung vừa khung (scrollWidth === clientWidth) → scrollable false", () => {
    const s = computeTabBarState({ scrollLeft: 0, clientWidth: 400, scrollWidth: 400 });
    assert.equal(s.scrollable, false);
    assert.equal(s.canPrev, false);
    assert.equal(s.canNext, false);
  });

  it("nội dung nhỏ hơn khung → scrollable false", () => {
    const s = computeTabBarState({ scrollLeft: 0, clientWidth: 600, scrollWidth: 400 });
    assert.equal(s.scrollable, false);
    assert.equal(s.canPrev, false);
    assert.equal(s.canNext, false);
  });

  it("chênh lệch nhỏ hơn epsilon mặc định (1px) → scrollable false", () => {
    const s = computeTabBarState({ scrollLeft: 0, clientWidth: 400, scrollWidth: 400.5 });
    assert.equal(s.scrollable, false);
  });
});

describe("computeTabBarState — tràn, ở đầu", () => {
  it("scrollLeft=0, nội dung tràn → canPrev false, canNext true", () => {
    const s = computeTabBarState({ scrollLeft: 0, clientWidth: 400, scrollWidth: 800 });
    assert.equal(s.scrollable, true);
    assert.equal(s.canPrev, false);
    assert.equal(s.canNext, true);
  });

  it("scrollLeft nhỏ hơn epsilon → vẫn được coi là ở đầu (canPrev false)", () => {
    const s = computeTabBarState({ scrollLeft: 0.5, clientWidth: 400, scrollWidth: 800 });
    assert.equal(s.canPrev, false);
    assert.equal(s.canNext, true);
  });
});

describe("computeTabBarState — tràn, ở giữa", () => {
  it("scrollLeft giữa chừng → canPrev true, canNext true", () => {
    const s = computeTabBarState({ scrollLeft: 200, clientWidth: 400, scrollWidth: 800 });
    assert.equal(s.scrollable, true);
    assert.equal(s.canPrev, true);
    assert.equal(s.canNext, true);
  });
});

describe("computeTabBarState — tràn, ở cuối", () => {
  it("scrollLeft = scrollWidth - clientWidth (chính xác) → canNext false", () => {
    const s = computeTabBarState({ scrollLeft: 400, clientWidth: 400, scrollWidth: 800 });
    assert.equal(s.scrollable, true);
    assert.equal(s.canPrev, true);
    assert.equal(s.canNext, false);
  });

  it("scrollLeft lệch 0.5px (trong epsilon) → vẫn được coi là ở cuối", () => {
    // scrollWidth - clientWidth = 400; scrollLeft = 399.5 → còn cách 0.5px < epsilon(1)
    const s = computeTabBarState({ scrollLeft: 399.5, clientWidth: 400, scrollWidth: 800 });
    assert.equal(s.canNext, false);
    assert.equal(s.canPrev, true);
  });
});

describe("computeTabBarState — epsilon tuỳ chỉnh", () => {
  it("epsilon lớn hơn cho phép sai số nhiều hơn", () => {
    // scrollLeft = 3, epsilon = 5 → canPrev false dù scrollLeft > 0
    const s = computeTabBarState({ scrollLeft: 3, clientWidth: 400, scrollWidth: 800 }, 5);
    assert.equal(s.canPrev, false);
  });
});

// ── clampScrollLeft ───────────────────────────────────────────────────────────

describe("clampScrollLeft", () => {
  const m = { scrollLeft: 0, clientWidth: 400, scrollWidth: 800 };

  it("giá trị âm bị kẹp về 0", () => {
    assert.equal(clampScrollLeft(m, -100), 0);
  });

  it("giá trị trong khoảng hợp lệ giữ nguyên", () => {
    assert.equal(clampScrollLeft(m, 200), 200);
  });

  it("giá trị vượt max bị kẹp về max (scrollWidth - clientWidth)", () => {
    // max = 800 - 400 = 400
    assert.equal(clampScrollLeft(m, 999), 400);
  });

  it("giá trị đúng bằng max giữ nguyên", () => {
    assert.equal(clampScrollLeft(m, 400), 400);
  });

  it("khi scrollWidth <= clientWidth → max = 0, mọi giá trị về 0", () => {
    const small = { scrollLeft: 0, clientWidth: 600, scrollWidth: 400 };
    assert.equal(clampScrollLeft(small, 100), 0);
    assert.equal(clampScrollLeft(small, -5), 0);
  });
});
