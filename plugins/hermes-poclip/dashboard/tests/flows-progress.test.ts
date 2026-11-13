import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOverviewQuery, mergeClusterOptions, FLOWS_FILTER_ALL } from "../src/lib/flowsFilters";
import { LEGACY_TAB_ALIASES, FLOWS_TAB_ID, TRACE_SUBTAB } from "../src/lib/tabUrl";

// ── buildOverviewQuery ────────────────────────────────────────────────────────

describe("buildOverviewQuery — window luôn gửi", () => {
  it("window=today, cluster=__all__, risk=__all__ → chỉ window", () => {
    const q = buildOverviewQuery({ window: "today", cluster: FLOWS_FILTER_ALL, risk: FLOWS_FILTER_ALL });
    const p = new URLSearchParams(q);
    assert.equal(p.get("window"), "today");
    assert.equal(p.has("cluster"), false);
    assert.equal(p.has("risk"), false);
  });

  it("window=7d, cluster=finance, risk=__all__ → window + cluster, không risk", () => {
    const q = buildOverviewQuery({ window: "7d", cluster: "finance", risk: FLOWS_FILTER_ALL });
    const p = new URLSearchParams(q);
    assert.equal(p.get("window"), "7d");
    assert.equal(p.get("cluster"), "finance");
    assert.equal(p.has("risk"), false);
  });

  it("window=30d, cluster=__all__, risk=T1 → window + risk, không cluster", () => {
    const q = buildOverviewQuery({ window: "30d", cluster: FLOWS_FILTER_ALL, risk: "T1" });
    const p = new URLSearchParams(q);
    assert.equal(p.get("window"), "30d");
    assert.equal(p.has("cluster"), false);
    assert.equal(p.get("risk"), "T1");
  });

  it("window=30d, cluster=tech_product, risk=T2 → cả 3 tham số", () => {
    const q = buildOverviewQuery({ window: "30d", cluster: "tech_product", risk: "T2" });
    const p = new URLSearchParams(q);
    assert.equal(p.get("window"), "30d");
    assert.equal(p.get("cluster"), "tech_product");
    assert.equal(p.get("risk"), "T2");
  });

  it("kết quả KHÔNG bắt đầu bằng dấu ?", () => {
    const q = buildOverviewQuery({ window: "7d", cluster: FLOWS_FILTER_ALL, risk: FLOWS_FILTER_ALL });
    assert.equal(q.startsWith("?"), false);
  });
});

// ── mergeClusterOptions ───────────────────────────────────────────────────────

describe("mergeClusterOptions — hợp nhất + khử trùng", () => {
  it("cả 2 rỗng → mảng rỗng", () => {
    assert.deepEqual(mergeClusterOptions([], []), []);
  });

  it("unit_stats không null, missingUnits rỗng", () => {
    assert.deepEqual(
      mergeClusterOptions([{ cluster: "a" }, { cluster: "b" }], []),
      ["a", "b"],
    );
  });

  it("null cluster → __unmapped__", () => {
    assert.deepEqual(mergeClusterOptions([{ cluster: null }], []), ["__unmapped__"]);
  });

  it("khử trùng trong unitStats", () => {
    assert.deepEqual(
      mergeClusterOptions([{ cluster: "a" }, { cluster: "a" }], []),
      ["a"],
    );
  });

  it("khử trùng giữa unitStats và missingUnits", () => {
    assert.deepEqual(
      mergeClusterOptions([{ cluster: "a" }], [{ cluster: "a" }]),
      ["a"],
    );
  });

  it("thứ tự ổn định: unitStats trước, missingUnits sau", () => {
    assert.deepEqual(
      mergeClusterOptions(
        [{ cluster: "b" }, { cluster: "a" }],
        [{ cluster: "c" }, { cluster: "b" }],
      ),
      ["b", "a", "c"],
    );
  });

  it("null trong cả 2 nguồn → __unmapped__ chỉ 1 lần", () => {
    assert.deepEqual(
      mergeClusterOptions([{ cluster: null }], [{ cluster: null }]),
      ["__unmapped__"],
    );
  });
});

// ── LEGACY_TAB_ALIASES ────────────────────────────────────────────────────────

describe("LEGACY_TAB_ALIASES — cấu trúc đúng theo spec", () => {
  it("company-flows → tab=flows-progress, subtab=flow", () => {
    assert.equal(LEGACY_TAB_ALIASES["company-flows"].tab, FLOWS_TAB_ID);
    assert.equal(LEGACY_TAB_ALIASES["company-flows"].subtab, "flow");
  });

  it("work-progress → tab=flows-progress, subtab=progress", () => {
    assert.equal(LEGACY_TAB_ALIASES["work-progress"].tab, FLOWS_TAB_ID);
    assert.equal(LEGACY_TAB_ALIASES["work-progress"].subtab, "progress");
  });

  it("task-trace → tab=flows-progress, subtab=trace", () => {
    assert.equal(LEGACY_TAB_ALIASES["task-trace"].tab, FLOWS_TAB_ID);
    assert.equal(LEGACY_TAB_ALIASES["task-trace"].subtab, TRACE_SUBTAB);
  });

  it("FLOWS_TAB_ID đúng là flows-progress", () => {
    assert.equal(FLOWS_TAB_ID, "flows-progress");
  });

  it("TRACE_SUBTAB đúng là trace", () => {
    assert.equal(TRACE_SUBTAB, "trace");
  });

  it("không có alias nào khác ngoài 3 khoá đã chốt", () => {
    assert.deepEqual(Object.keys(LEGACY_TAB_ALIASES).sort(), ["company-flows", "task-trace", "work-progress"]);
  });
});
