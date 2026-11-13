import type { Translations } from "@/i18n/types";

const BUILTIN: Record<string, keyof Translations["app"]["nav"]> = {
  "/chat": "chat",
  "/sessions": "sessions",
  "/analytics": "analytics",
  "/channels": "channels",
  "/files": "files",
  "/models": "models",
  "/logs": "logs",
  "/cron": "cron",
  "/mcp": "mcp",
  "/skills": "skills",
  "/plugins": "plugins",
  "/pairing": "pairing",
  "/profiles": "profiles",
  "/config": "config",
  "/env": "keys",
  "/docs": "documentation",
  "/system": "system",
  "/webhooks": "webhooks",
};

// Fallback literals for locales that have not yet translated the optional
// nav keys. Keep in sync with the sidebar labels in App.tsx — the naive
// capitalize fallback below mangles initialisms ("/mcp" → "Mcp").
const BUILTIN_LITERAL: Record<string, string> = {
  "/files": "Files",
  "/mcp": "MCP",
  "/channels": "Channels",
  "/webhooks": "Webhooks",
  "/pairing": "Pairing",
  "/system": "System",
};

export function resolvePageTitle(
  pathname: string,
  t: Translations,
  pluginTabs: { path: string; label: string }[],
): string {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/") {
    return t.app.nav.sessions;
  }
  const plugin = pluginTabs.find((p) => p.path === normalized);
  if (plugin) {
    return plugin.label;
  }
  const key = BUILTIN[normalized];
  if (key) {
    const translated = t.app.nav[key];
    if (translated) return translated;
  }
  const literal = BUILTIN_LITERAL[normalized];
  if (literal) {
    return literal;
  }
  // Derive title from pathname: "/profiles" → "Profiles"
  const segment = normalized.slice(1);
  if (segment) {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
  return t.app.webUi;
}
