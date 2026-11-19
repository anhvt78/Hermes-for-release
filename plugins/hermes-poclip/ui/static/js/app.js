"use strict";

const API = "/api/approval-queue";

let currentId = null;
let allItems = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (isError ? " error" : "");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = "toast"; }, 3000);
}

function statusPill(s) {
  return `<span class="status-pill s-${s}">${s}</span>`;
}

function tierBadge(t) {
  return `<span class="tier-badge tier-${t}">${t}</span>`;
}

function formatSLA(sla) {
  if (!sla) return "—";
  const dt = new Date(sla);
  const overdue = dt < new Date();
  const label = dt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  return `<span class="card-sla${overdue ? " overdue" : ""}">${overdue ? "⚠ " : ""}${label}</span>`;
}

function jsonBlock(val) {
  if (!val) return "—";
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return `<div class="json-block">${JSON.stringify(parsed, null, 2)}</div>`;
  } catch {
    return `<div class="json-block">${val}</div>`;
  }
}

function rowTitleText(item) {
  return item.title || item.raw_message || item.affected_summary || item.request_type || '';
}

async function api(path, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.detail?.error || data?.detail || "API error"), { status: res.status });
  return data;
}

// ── Load queue list ────────────────────────────────────────────────────────────

async function loadQueue() {
  const status = document.getElementById("filterStatus").value;
  const tier = document.getElementById("filterTier").value;
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (tier) qs.set("risk_tier", tier);

  const list = document.getElementById("queueList");
  list.innerHTML = '<div class="loading">Đang tải…</div>';

  try {
    const data = await api("?" + qs.toString());
    allItems = data.items || [];
    document.getElementById("totalCount").textContent = data.total ?? allItems.length;
    renderList(allItems);
  } catch (e) {
    list.innerHTML = `<div class="empty">Lỗi: ${e.message}</div>`;
  }
}

// Layer filter intentionally omitted here: the queue is server-paginated 20/page —
// a client-side tier filter would silently hide items on later pages (silent-miss).
// Filter by layer only on the Executive Dashboard WhatNeedsMe zone.
function renderList(items) {
  const list = document.getElementById("queueList");
  if (!items.length) {
    list.innerHTML = '<div class="empty">Không có request nào.</div>';
    return;
  }
  list.innerHTML = items.map(item => {
    const sel = item.id === currentId ? " selected" : "";
    const chip = renderGsChip(rowTitleText(item));
    return `<div class="card${sel}" data-id="${item.id}" onclick="selectItem('${item.id}')">
      <div class="card-header">
        <span class="card-type">${chip}${item.request_type || "—"}</span>
        ${tierBadge(item.risk_tier)}
      </div>
      <div class="card-agent">${item.requester_agent_id}</div>
      ${statusPill(item.status)}
      ${formatSLA(item.sla_deadline)}
    </div>`;
  }).join("");
}

// ── Select & load detail ───────────────────────────────────────────────────────

async function selectItem(id) {
  currentId = id;
  document.querySelectorAll(".card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
  const panel = document.getElementById("detailPanel");
  panel.innerHTML = '<div class="loading">Đang tải chi tiết…</div>';

  try {
    const item = await api(`/${id}`);
    renderDetail(item);
  } catch (e) {
    panel.innerHTML = `<div class="placeholder">Lỗi: ${e.message}</div>`;
  }
}

function renderDetail(d) {
  const panel = document.getElementById("detailPanel");
  panel.innerHTML = `
    <div class="detail-card">
      <h2>${d.request_type} ${tierBadge(d.risk_tier)} ${statusPill(d.status)}</h2>
      <div class="detail-grid">
        <div class="field"><label>ID</label><span>${d.id}</span></div>
        <div class="field"><label>Requester</label><span>${d.requester_agent_id}</span></div>
        <div class="field"><label>Correlation ID</label><span>${d.correlation_id || "—"}</span></div>
        <div class="field"><label>SLA Deadline</label><span>${d.sla_deadline || "—"}</span></div>
        <div class="field"><label>Budget Còn Lại</label><span>${d.budget_remaining != null ? d.budget_remaining.toLocaleString("vi-VN") + " VNĐ" : "—"}</span></div>
        <div class="field"><label>Escalation Count</label><span>${d.escalation_count ?? 0}</span></div>
        <div class="field"><label>Compliance Verdict</label><span>${d.compliance_verdict || "—"}</span></div>
        <div class="field"><label>Chairman Decision</label><span>${d.chairman_decision || "—"}</span></div>
        <div class="field"><label>Created At</label><span>${d.created_at || "—"}</span></div>
        <div class="field"><label>Updated At</label><span>${d.updated_at || "—"}</span></div>
      </div>
      <div class="field"><label>Goal Ancestry</label>${jsonBlock(d.goal_ancestry)}</div>
      <div style="margin-top:.75rem" class="field"><label>Evidence Summary</label>${jsonBlock(d.evidence_summary)}</div>
      <div style="margin-top:.75rem" class="field"><label>Affected Summary</label><span>${d.affected_summary || "—"}</span></div>
      <div style="margin-top:.75rem" class="field"><label>Decision Reason</label><span>${d.decision_reason || "—"}</span></div>
      <div class="actions">
        <button class="btn btn-approve" onclick="doApprove()">✓ Approve</button>
        <button class="btn btn-reject" onclick="doReject()">✗ Reject</button>
        <button class="btn btn-changes" onclick="doRequestChanges()">↩ Request Changes</button>
        <button class="btn btn-escalate" onclick="doEscalate()">↑ Escalate</button>
        <button class="btn btn-compliance" onclick="doComplianceVerdict()">🔍 Compliance Verdict</button>
      </div>
    </div>`;
}

// ── Action handlers ────────────────────────────────────────────────────────────

async function doApprove() {
  if (!currentId) return;
  const reason = prompt("Lý do phê duyệt (tùy chọn):");
  try {
    const res = await api(`/${currentId}/approve`, "POST", { reason });
    toast(`Đã approve — ${res.approved_at}`);
    await loadQueue();
    if (currentId) selectItem(currentId);
  } catch (e) {
    if (e.status === 409) toast("T2 cần Compliance verdict trước! (ERR-TC07-001)", true);
    else toast(e.message, true);
  }
}

async function doReject() {
  if (!currentId) return;
  const reason = prompt("Lý do từ chối (bắt buộc):");
  if (!reason) { toast("Reason là bắt buộc khi reject.", true); return; }
  try {
    await api(`/${currentId}/reject`, "POST", { reason });
    toast("Đã reject.");
    await loadQueue();
  } catch (e) {
    toast(e.message, true);
  }
}

async function doRequestChanges() {
  if (!currentId) return;
  const changes = prompt("Nội dung yêu cầu chỉnh sửa:");
  if (!changes) return;
  try {
    await api(`/${currentId}/request-changes`, "POST", { changes_requested: changes });
    toast("Đã yêu cầu chỉnh sửa.");
    await loadQueue();
    selectItem(currentId);
  } catch (e) {
    toast(e.message, true);
  }
}

async function doEscalate() {
  if (!currentId) return;
  const reason = prompt("Lý do escalate:");
  try {
    const res = await api(`/${currentId}/escalate`, "POST", { reason });
    toast(`Đã escalate (lần ${res.escalation_count}).`);
    await loadQueue();
    selectItem(currentId);
  } catch (e) {
    toast(e.message, true);
  }
}

async function doComplianceVerdict() {
  if (!currentId) return;
  const verdict = prompt("Verdict (approved / rejected / uncertain):");
  if (!["approved","rejected","uncertain"].includes(verdict)) { toast("Verdict không hợp lệ.", true); return; }
  const rationale = prompt("Rationale (tùy chọn):");
  try {
    const res = await api(`/${currentId}/compliance-verdict`, "POST", { verdict, rationale });
    toast(`Compliance verdict: ${res.compliance_verdict}`);
    await loadQueue();
    selectItem(currentId);
  } catch (e) {
    toast(e.message, true);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadQueue();
});
