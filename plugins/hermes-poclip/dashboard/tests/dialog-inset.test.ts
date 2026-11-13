import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { measureInsets } from "../src/lib/dialogInset";

type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };
const box = (left: number, top: number, width: number, height: number): Box => ({ left, top, right: left + width, bottom: top + height, width, height });
interface Fake {
  rect: Box;
  style: { position: string; display?: string; visibility?: string };
}
const el = (rect: Box, style: Fake["style"]): Fake => ({ rect, style, getBoundingClientRect: () => rect } as unknown as Fake);

const g = globalThis as unknown as Record<string, unknown>;
function setup(opts: { byId?: Fake | null; asides?: Fake[]; header?: Fake | null; innerWidth?: number }) {
  g.window = { innerWidth: opts.innerWidth ?? 1400 };
  g.document = {
    querySelector: (sel: string) => (sel === "#app-sidebar" ? opts.byId ?? null : sel === "header" ? opts.header ?? null : null),
    querySelectorAll: (sel: string) => (sel === "aside" ? opts.asides ?? [] : []),
  };
  g.getComputedStyle = (e: Fake) => ({ position: e.style.position, display: e.style.display ?? "flex", visibility: e.style.visibility ?? "visible" });
}

afterEach(() => {
  delete g.window;
  delete g.document;
  delete g.getComputedStyle;
});

describe("measureInsets", () => {
  it("menu STICKY ở màn hình máy tính (không phải fixed): hộp thoại bắt đầu từ mép phải menu", () => {
    setup({ byId: el(box(0, 0, 256, 900), { position: "sticky" }) });
    assert.deepEqual(measureInsets(), { left: 256, top: 0 });
  });

  it("menu đang thu gọn thì theo bề rộng thu gọn", () => {
    setup({ byId: el(box(0, 0, 56, 900), { position: "sticky" }) });
    assert.equal(measureInsets().left, 56);
  });

  it("menu fixed (điện thoại) đang mở thì cũng tránh nó", () => {
    setup({ byId: el(box(0, 0, 256, 900), { position: "fixed" }), innerWidth: 390 });
    assert.equal(measureInsets().left, 256);
  });

  it("menu trượt ra ngoài màn hình (điện thoại, đang đóng) hoặc bị ẩn thì không chừa chỗ", () => {
    setup({ byId: el(box(-256, 0, 256, 900), { position: "fixed" }), innerWidth: 390 });
    assert.equal(measureInsets().left, 0);
    setup({ byId: el(box(0, 0, 256, 900), { position: "sticky", display: "none" }) });
    assert.equal(measureInsets().left, 0);
  });

  it("không có id thì dùng phần tử aside nằm sát mép trái; aside khác (nằm giữa trang) bị bỏ qua", () => {
    setup({ byId: null, asides: [el(box(600, 0, 300, 500), { position: "static" }), el(box(0, 0, 256, 900), { position: "sticky" })] });
    assert.equal(measureInsets().left, 256);
    setup({ byId: null, asides: [el(box(600, 0, 300, 500), { position: "static" })] });
    assert.equal(measureInsets().left, 0);
  });

  it("thanh trên cố định (điện thoại) thì hộp thoại nằm dưới nó; thanh trên không cố định thì bỏ qua", () => {
    setup({ byId: null, header: el(box(0, 0, 390, 56), { position: "fixed" }), innerWidth: 390 });
    assert.deepEqual(measureInsets(), { left: 0, top: 56 });
    setup({ byId: null, header: el(box(0, 0, 1400, 56), { position: "static" }) });
    assert.equal(measureInsets().top, 0);
  });

  it("không có gì trên trang thì (0, 0)", () => {
    setup({});
    assert.deepEqual(measureInsets(), { left: 0, top: 0 });
  });
});
