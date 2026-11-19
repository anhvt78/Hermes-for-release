/** Select the display label for a plugin based on the current locale; falls back to default label. */
export function resolvePluginLabel(
  plugin: { label: string; labels?: Record<string, string> | null },
  locale: string,
): string {
  const localized = plugin.labels?.[locale];
  if (typeof localized === "string" && localized.trim() !== "") return localized;
  return plugin.label;
}
