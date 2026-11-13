# Hermes Agent — Development Guide

Instructions for AI coding assistants and developers working on the hermes-agent codebase.

**Never give up on the right solution.**

## Table of Contents

1. [What Hermes Is](#what-hermes-is)
2. [Core Rules](#core-rules)
3. [Footprint Ladder](#footprint-ladder)
4. [How This File Is Loaded](#how-this-file-is-loaded)
5. [References](#references)

---

## What Hermes Is

Hermes is a personal AI agent running the same core across CLI, messaging gateway (Telegram, Discord, Slack, ~20 platforms), TUI, and Electron desktop. It learns across sessions, delegates to subagents, and runs scheduled jobs. Capability grows via **plugins and skills**, not by expanding the core.

Two properties govern nearly every design decision:

- **Prompt caching is sacred.** Each turn reuses a cached prefix. Anything that mutates past context, swaps toolsets, or rebuilds the system prompt mid-conversation invalidates the cache and multiplies user cost. We do not do it (sole exception: context compression).
- **Narrow waist.** Every model tool ships on every API call. The bar for a new core tool is high. Most new capability belongs at the edges.

---

## Core Rules

These rules are mandatory. They are enforced in code review and CI.

### 1. Prompt caching — inviolable

**Never** alter past context mid-conversation, change toolsets mid-conversation, or rebuild the system prompt mid-conversation. Sole exception: context compression.

Slash commands that mutate system-prompt state (skills, tools, memory) must default to **deferred invalidation** (takes effect next session), with an opt-in `--now` for immediate invalidation. See `/skills install --now` for the canonical pattern.

### 2. TypeScript — fix errors for real

TypeScript errors must be fixed properly. **No** `@ts-ignore`, `as any`, or disabling the type-checker to pass CI. Fix the root cause.

### 3. Behavior contracts, not snapshots

Tests must assert **invariants — how two pieces of data must relate** — not freeze a current value. Do not write change-detector tests that hard-code model catalogs, config version literals, or enum counts.

```python
# BAD — change-detector
assert DEFAULT_CONFIG["_config_version"] == 21
assert len(_PROVIDER_MODELS["openai"]) == 8

# GOOD — behavior contract
assert raw["_config_version"] == DEFAULT_CONFIG["_config_version"]
assert len(_PROVIDER_MODELS["openai"]) >= 1
```

### 4. E2E real paths — mocks are not enough

For config resolution, auth/permission boundaries, and file/network I/O: use **real imports** and a temp `HERMES_HOME`. Unit mocks hide integration bugs on these paths and are insufficient on their own.

### 5. Plugins must not modify core files

Plugins live in their own directory and work within the ABCs/hooks provided. **Never** edit `run_agent.py`, `cli.py`, `gateway/run.py`, or `hermes_cli/main.py` from a plugin. If a plugin needs more surface, widen the **generic** plugin API — never special-case plugin logic in core.

### 6. `.env` for secrets only

`.env` holds **only** credentials (API keys, tokens, passwords). All behavioral config (timeouts, feature flags, display prefs, thresholds) goes in `config.yaml`. Never add a new `HERMES_*` env var for non-secret configuration.

### 7. Narrow waist — use the Footprint Ladder

Before adding capability, pick the highest (least-footprint) rung. See [Footprint Ladder](#footprint-ladder) below.

### 8. Tests must not write to `~/.hermes/`

The `_isolate_hermes_home` autouse fixture (`tests/conftest.py`) redirects `HERMES_HOME` to a temp dir for every test. Never hardcode `~/.hermes/` paths in tests.

---

## Footprint Ladder

Each rung adds more permanent surface than the one above. Choose the highest rung that correctly solves the problem:

1. **Extend existing code** — zero new surface.
2. **CLI command + skill** — zero model-tool footprint. Default for subscriptions, scheduled tasks, service setup.
3. **Service-gated tool (`check_fn`)** — zero footprint when the prerequisite is unconfigured.
4. **Plugin** — `~/.hermes/plugins/` or pip entry point, discovered at runtime.
5. **MCP server** — structured I/O without growing the core schema; reusable by any MCP host.
6. **New core tool** — only when fundamental to nearly every user AND unreachable via terminal + file.

When 3+ PRs target the same category (memory backends, providers, notifiers): design an ABC + orchestrator, wrap the built-in as the first provider, and convert the competing PRs into plugins.

**Surface capability is session-scoped, never process-env–scoped.** A tool gated on `HERMES_DESKTOP=1` silently breaks on every non-locally-spawned topology (SSH backend, Hermes Cloud, plain URL+token). Gate on the session's own platform signal instead; use a named toolset that the GUI gateway folds in when the session's platform says GUI. See the full AGENTS for the complete toolset-based pattern.

---

## How This File Is Loaded

- `agent/subdirectory_hints.py` caps hint bundles at `_MAX_HINT_CHARS = 8000`.
- `agent/prompt_builder.py` caps individual context files at `CONTEXT_FILE_MAX_CHARS = 20000`; the ceiling is 6% of the context window × 4, max 500k. `_load_agents_md` walks from git-root down to the current working directory, loading each `AGENTS.md` it finds along the chain.

**Keep this file ≤ 8000 characters** so every load path remains cheap.

---

## References

- **Full detail** (architecture, tutorials, policies, known pitfalls):
  [`hermes-plus-docs-tests/docs/hermes-agent-main/AGENTS-FULL-CHI-TIET.md`](../hermes-plus-docs-tests/docs/hermes-agent-main/AGENTS-FULL-CHI-TIET.md)
- **Verification commands & gate conventions**:
  [`RUNBOOK.md`](../RUNBOOK.md) at repo root.
