import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_MODELS,
  MANUAL_KEY,
  entryKey,
  guessSelectionFromKey,
  keyHintOf,
  labelOf,
  manualError,
  resolveSelection,
  type ModelEntry,
  type ProviderInfo,
} from "../src/lib/model-choices";

const ENTRIES: ModelEntry[] = [
  { provider: "deepseek", model: "deepseek-v4-flash", label: "DeepSeek — flash" },
  { provider: "anthropic", model: "claude-sonnet-5", label: "Claude — sonnet", label_en: "Claude — sonnet (EN)", key_hint: "Dán khoá sk-ant-…", key_hint_en: "Paste sk-ant-…" },
  { provider: "anthropic", model: "claude-sonnet-5", auth: "claude_code", label: "Claude Code — sonnet" },
  { provider: "kimi-coding", model: "kimi-k3", label: "Kimi — k3" },
  { provider: "openrouter", model: "openrouter/pareto-code", label: "OpenRouter" },
];
const PROVIDERS: ProviderInfo[] = [
  { id: "kimi-coding", label: "Kimi", key_env: "KIMI_API_KEY" },
  { id: "xai", label: "xAI", key_env: "XAI_API_KEY" },
];

describe("entryKey / labelOf / keyHintOf", () => {
  it("cùng nhà cung cấp + mô hình nhưng khác loại khoá thì khác khoá", () => {
    assert.notEqual(entryKey(ENTRIES[1]), entryKey(ENTRIES[2]));
    assert.equal(entryKey(ENTRIES[0]), "deepseek|deepseek-v4-flash|");
  });
  it("nhãn và gợi ý theo ngôn ngữ, thiếu bản tiếng Anh thì dùng bản tiếng Việt", () => {
    assert.equal(labelOf(ENTRIES[1], "vi"), "Claude — sonnet");
    assert.equal(labelOf(ENTRIES[1], "en"), "Claude — sonnet (EN)");
    assert.equal(labelOf(ENTRIES[0], "en"), "DeepSeek — flash");
    assert.equal(keyHintOf(ENTRIES[1], "en"), "Paste sk-ant-…");
    assert.equal(keyHintOf(ENTRIES[0], "vi"), "");
    assert.equal(keyHintOf(undefined, "vi"), "");
  });
});

describe("resolveSelection", () => {
  it("mục chọn sẵn → nhà cung cấp + mô hình của mục đó", () => {
    const r = resolveSelection(entryKey(ENTRIES[3]), ENTRIES, { provider: "", model: "" });
    assert.deepEqual([r.provider, r.model, r.manual], ["kimi-coding", "kimi-k3", false]);
  });
  it("khoá lạ → rơi về mục đầu danh sách", () => {
    const r = resolveSelection("zzz|zzz|", ENTRIES, { provider: "", model: "" });
    assert.equal(r.model, "deepseek-v4-flash");
  });
  it("nhập tay → lấy từ ô nhập, bỏ khoảng trắng", () => {
    const r = resolveSelection(MANUAL_KEY, ENTRIES, { provider: " xai ", model: " grok-9 " });
    assert.deepEqual([r.provider, r.model, r.manual], ["xai", "grok-9", true]);
  });
  it("danh sách rỗng → dùng mục dự phòng", () => {
    assert.equal(resolveSelection("x", [], { provider: "", model: "" }).provider, FALLBACK_MODELS[0].provider);
  });
});

describe("manualError", () => {
  it("thiếu nhà cung cấp hoặc không có trong danh sách → provider", () => {
    assert.equal(manualError({ provider: "", model: "kimi-k3" }, PROVIDERS), "provider");
    assert.equal(manualError({ provider: "lạ", model: "kimi-k3" }, PROVIDERS), "provider");
  });
  it("tên mô hình sai khuôn → model", () => {
    assert.equal(manualError({ provider: "xai", model: "" }, PROVIDERS), "model");
    assert.equal(manualError({ provider: "xai", model: "có dấu cách" }, PROVIDERS), "model");
    assert.equal(manualError({ provider: "xai", model: "a".repeat(129) }, PROVIDERS), "model");
  });
  it("hợp lệ → null (kể cả tên có / : @ +)", () => {
    assert.equal(manualError({ provider: "kimi-coding", model: "kimi-k3" }, PROVIDERS), null);
    assert.equal(manualError({ provider: "xai", model: "org/model:v1@2+x" }, PROVIDERS), null);
  });
  it("chưa tải được danh sách nhà cung cấp → chỉ cần có chọn", () => {
    assert.equal(manualError({ provider: "bất kỳ", model: "m1" }, []), null);
  });
});

describe("guessSelectionFromKey", () => {
  const cur = entryKey(ENTRIES[0]);
  it("token Claude Code (sk-ant-oat…) → mục Claude Code", () => {
    assert.equal(guessSelectionFromKey("sk-ant-oat01-abc", ENTRIES, cur), entryKey(ENTRIES[2]));
  });
  it("khoá Anthropic thường (sk-ant-…) → mục Claude thường", () => {
    assert.equal(guessSelectionFromKey("sk-ant-api03-abc", ENTRIES, cur), entryKey(ENTRIES[1]));
  });
  it("sk-kimi- → Kimi; sk-or- → OpenRouter", () => {
    assert.equal(guessSelectionFromKey("sk-kimi-xyz", ENTRIES, cur), entryKey(ENTRIES[3]));
    assert.equal(guessSelectionFromKey("sk-or-v1-xyz", ENTRIES, cur), entryKey(ENTRIES[4]));
  });
  it("«sk-» trần không đoán (OpenAI/DeepSeek/Kimi cùng dùng)", () => {
    assert.equal(guessSelectionFromKey("sk-abcdef", ENTRIES, cur), null);
    assert.equal(guessSelectionFromKey("", ENTRIES, cur), null);
  });
  it("không ghi đè lựa chọn đã đúng nhà cung cấp và loại khoá", () => {
    assert.equal(guessSelectionFromKey("sk-ant-api03-abc", ENTRIES, entryKey(ENTRIES[1])), null);
    assert.equal(guessSelectionFromKey("sk-ant-oat01-abc", ENTRIES, entryKey(ENTRIES[2])), null);
  });
  it("đang chọn Claude thường mà dán token Claude Code → chuyển sang Claude Code", () => {
    assert.equal(guessSelectionFromKey("sk-ant-oat01-abc", ENTRIES, entryKey(ENTRIES[1])), entryKey(ENTRIES[2]));
  });
  it("nhà cung cấp không có trong danh sách → null", () => {
    assert.equal(guessSelectionFromKey("xai-abc", ENTRIES, cur), null);
  });
});
