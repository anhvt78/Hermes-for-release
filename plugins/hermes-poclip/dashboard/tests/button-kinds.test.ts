import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Cannot find ${relPath} from ${process.cwd()} up 5 levels`);
}

function findSrcDir(): string {
  return path.dirname(findSrc("src/index.tsx"));
}

// ── 1. theme.ts content checks ──────────────────────────────────────────────

describe("BUTTON_CSS / HEADING_CSS in theme.ts", () => {
  const themeFile = findSrc("src/lib/theme.ts");
  const themeContent = fs.readFileSync(themeFile, "utf-8");

  const required = [
    "min-height: 36px",
    "min-height: 32px",
    ":focus-visible",
    ":disabled",
    ".pc-btn--primary",
    ".pc-btn--secondary",
    ".pc-btn--danger",
    "font-weight: 700",
  ];

  for (const needle of required) {
    it(`theme.ts contains "${needle}"`, () => {
      assert.ok(
        themeContent.includes(needle),
        `Expected to find "${needle}" in lib/theme.ts`,
      );
    });
  }
});

// ── 2. Every <button in src/**/*.tsx must carry pc-btn ─────────────────────

function collectTsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "i18n") continue; // skip i18n per spec
      files.push(...collectTsxFiles(full));
    } else if (e.isFile() && e.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

describe("All <button elements carry pc-btn class", () => {
  const srcDir = findSrcDir();
  const files = collectTsxFiles(srcDir);
  let totalChecked = 0;

  for (const filePath of files) {
    const relPath = path.relative(srcDir, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("<button")) continue;

      // Collect window: the line itself + 11 following lines (12 total per spec)
      const window = lines.slice(i, i + 12).join("\n");

      // Exception: index.tsx group-bar buttons with data-tab-group
      // (tab-bar items use <TabsTrigger not <button, so data-tab-id is not an actual <button)
      if (
        relPath === "index.tsx" &&
        window.includes("data-tab-group")
      ) {
        continue;
      }

      totalChecked++;
      const capturedWindow = window;
      const capturedRelPath = relPath;
      const capturedLine = i + 1;
      it(`${capturedRelPath}:${capturedLine} — <button has pc-btn`, () => {
        assert.ok(
          capturedWindow.includes("pc-btn"),
          `${capturedRelPath}:${capturedLine} — <button found without pc-btn class:\n${capturedWindow}`,
        );
      });
    }
  }

  it("button count — at least 30 buttons scanned across all tsx files", () => {
    assert.ok(totalChecked >= 30, `Only ${totalChecked} buttons scanned — expected >= 30`);
    console.log(`  ✓ ${totalChecked} <button elements verified across src/**/*.tsx`);
  });
});
