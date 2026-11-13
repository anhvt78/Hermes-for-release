import { describe, expect, it } from "vitest";

import { resolvePluginLabel } from "./plugin-labels";

describe("resolvePluginLabel", () => {
  it("returns the localized label when the locale has a translation", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: { vi: "Thẻ công việc", en: "Kanban" } }, "en"),
    ).toBe("Kanban");
  });

  it("returns the localized label for vi locale", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: { vi: "Thẻ công việc", en: "Kanban" } }, "vi"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when locale is missing from labels", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: { vi: "Thẻ công việc", en: "Kanban" } }, "fr"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when labels is undefined", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc" }, "en"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when labels is null", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: null }, "en"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when labels is an empty object", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: {} }, "en"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when the localized value is an empty string", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: { en: "" } }, "en"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label when the localized value is only whitespace", () => {
    expect(
      resolvePluginLabel({ label: "Thẻ công việc", labels: { en: "   " } }, "en"),
    ).toBe("Thẻ công việc");
  });

  it("returns default label for an unknown locale (e.g. ja)", () => {
    expect(
      resolvePluginLabel({ label: "Thành tích", labels: { vi: "Thành tích", en: "Achievements" } }, "ja"),
    ).toBe("Thành tích");
  });
});
