"use strict";

const PC_API = "/api/policy";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (isError ? " error" : "");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = "toast"; }, 4000);
}

async function api(path, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(PC_API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 202) {
    throw Object.assign(
      new Error(data?.detail?.error || data?.detail || "API error"),
      { status: res.status, detail: data?.detail }
    );
  }
  return { status: res.status, data };
}

function activeBadge(active) {
  return active
    ? '<span class="badge-active">active</span>'
    : '<span class="badge-inactive">inactive</span>';
}

function showPendingNotice(aprId) {
  return `<div class="pending-notice">⏳ Chờ duyệt T2 — approval_request_id: <strong>${aprId}</strong></div>`;
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach((b, i) => {
    const tabs = ["tool-policy", "a2a-grants", "sandbox", "channel-bindings"];
    b.classList.toggle("active", tabs[i] === name);
  });
  document.querySelectorAll(".tab-content").forEach(el => {
    el.classList.toggle("active", el.id === "tab-" + name);
  });
  if (name === "tool-policy") loadToolPolicies();
  if (name === "a2a-grants") loadA2AGrants();
  if (name === "channel-bindings") loadChannelBindings();
}

// ── Tab 1: Tool Policy ────────────────────────────────────────────────────────

async function loadToolPolicies() {
  const pid = document.getElementById("tpProfileFilter").value.trim();
  const qs = pid ? `?profile_id=${encodeURIComponent(pid)}` : "";
  try {
    const { data } = await api("/tool-policies" + qs);
    const tbody = document.getElementById("tpBody");
    if (!data.items.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">Không có rule nào.</td></tr>';
      return;
    }
    tbody.innerHTML = data.items.map(r => `
      <tr>
        <td style="font-family:monospace;font-size:.78rem">${r.id}</td>
        <td>${r.profile_id}</td>
        <td><code>${r.tool_pattern}</code></td>
        <td><span class="badge-${r.policy_action}">${r.policy_action}</span></td>
        <td>${r.scope}</td>
        <td>${r.layer_priority}</td>
        <td>${r.policy_revision}</td>
        <td>${activeBadge(r.active)}</td>
        <td>
          <button class="btn btn-reject" style="padding:.2rem .6rem;font-size:.78rem" onclick="deleteToolPolicy('${r.id}')">Xóa</button>
        </td>
      </tr>`).join("");
  } catch (e) {
    toast("Lỗi tải tool policies: " + e.message, true);
  }
}

async function createToolPolicy() {
  const body = {
    profile_id: document.getElementById("tpProfileId").value.trim(),
    tool_pattern: document.getElementById("tpPattern").value.trim(),
    policy_action: document.getElementById("tpAction").value,
    scope: document.getElementById("tpScope").value,
    layer_priority: parseInt(document.getElementById("tpPriority").value) || 100,
    note: document.getElementById("tpNote").value.trim() || null,
  };
  if (!body.profile_id || !body.tool_pattern) { toast("profile_id và tool_pattern là bắt buộc", true); return; }
  try {
    const { status, data } = await api("/tool-policies", "POST", body);
    if (status === 202) {
      document.getElementById("tpBody").insertAdjacentHTML("afterend", showPendingNotice(data.approval_request_id));
      toast("Thay đổi lớn — chờ duyệt T2: " + data.approval_request_id);
    } else {
      toast("Đã tạo rule: " + data.id);
      loadToolPolicies();
    }
  } catch (e) {
    toast("Lỗi: " + (e.detail?.hint || e.message), true);
  }
}

async function deleteToolPolicy(id) {
  if (!confirm("Xác nhận xóa rule " + id + "?")) return;
  try {
    await api("/tool-policies/" + id, "DELETE", {});
    toast("Đã xóa (soft) rule " + id);
    loadToolPolicies();
  } catch (e) {
    toast("Lỗi: " + e.message, true);
  }
}

async function previewPolicy() {
  const profile_id = document.getElementById("pvProfileId").value.trim();
  const tool_name = document.getElementById("pvToolName").value.trim();
  if (!profile_id || !tool_name) { toast("profile_id và tool_name là bắt buộc", true); return; }
  try {
    const { data } = await api("/tool-policies/preview", "POST", { profile_id, tool_name });
    const color = data.allowed ? "#dcfce7" : "#fee2e2";
    const label = data.allowed ? "✅ ALLOWED" : "❌ DENIED";
    document.getElementById("pvResult").innerHTML = `
      <div style="background:${color};border-radius:8px;padding:.75rem 1rem;font-size:.875rem;">
        <strong>${label}</strong> — ${data.reason}
        ${data.matched_rule ? `<div style="margin-top:.4rem;font-size:.8rem;color:#475569;">Rule: <code>${data.matched_rule.id}</code> (${data.matched_rule.tool_pattern})</div>` : ""}
      </div>`;
  } catch (e) {
    toast("Preview lỗi: " + e.message, true);
  }
}

// ── Tab 2: A2A Grants ─────────────────────────────────────────────────────────

async function loadA2AGrants() {
  try {
    const { data } = await api("/a2a-grants");
    const tbody = document.getElementById("a2aBody");
    if (!data.items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Không có grant nào.</td></tr>';
      return;
    }
    tbody.innerHTML = data.items.map(g => `
      <tr>
        <td style="font-family:monospace;font-size:.78rem">${g.id}</td>
        <td>${g.from_profile}</td>
        <td>${g.to_profile}</td>
        <td>${g.direction}</td>
        <td style="font-size:.78rem">${g.allowed_operations}</td>
        <td>${activeBadge(g.active)}</td>
        <td>
          <button class="btn btn-reject" style="padding:.2rem .6rem;font-size:.78rem" onclick="revokeA2AGrant('${g.id}')">Thu hồi</button>
        </td>
      </tr>`).join("");
  } catch (e) {
    toast("Lỗi tải a2a grants: " + e.message, true);
  }
}

async function createA2AGrant() {
  const body = {
    from_profile: document.getElementById("a2aFrom").value.trim(),
    to_profile: document.getElementById("a2aTo").value.trim(),
    direction: document.getElementById("a2aDir").value,
    note: document.getElementById("a2aNote").value.trim() || null,
  };
  if (!body.from_profile || !body.to_profile) { toast("from_profile và to_profile là bắt buộc", true); return; }
  try {
    const { data } = await api("/a2a-grants", "POST", body);
    toast("Đã tạo grant: " + data.id);
    loadA2AGrants();
  } catch (e) {
    toast("Lỗi: " + e.message, true);
  }
}

async function revokeA2AGrant(id) {
  if (!confirm("Xác nhận thu hồi grant " + id + "?")) return;
  try {
    const { status, data } = await api("/a2a-grants/" + id, "DELETE", {});
    if (status === 202) {
      toast("Chờ duyệt T2 — approval_request_id: " + data.approval_request_id);
    } else {
      toast("Đã thu hồi grant " + id);
      loadA2AGrants();
    }
  } catch (e) {
    toast("Lỗi: " + e.message, true);
  }
}

// ── Tab 3: Sandbox ────────────────────────────────────────────────────────────

async function loadSandbox() {
  const pid = document.getElementById("sbProfileId").value.trim();
  if (!pid) { toast("Nhập profile_id", true); return; }
  try {
    const { data } = await api("/sandbox/" + encodeURIComponent(pid));
    document.getElementById("sbResult").innerHTML = `
      <div class="pc-form">
        <div class="detail-grid">
          <div class="field"><label>ID</label><span>${data.id}</span></div>
          <div class="field"><label>profile_id</label><span>${data.profile_id}</span></div>
          <div class="field"><label>sandbox_mode</label><span>${data.sandbox_mode}</span></div>
          <div class="field"><label>backend</label><span>${data.backend}</span></div>
          <div class="field"><label>workspace_access</label><span>${data.workspace_access}</span></div>
          <div class="field"><label>prune_on_exit</label><span>${data.prune_on_exit}</span></div>
        </div>
      </div>`;
  } catch (e) {
    document.getElementById("sbResult").innerHTML = `<div class="empty">Không tìm thấy: ${e.message}</div>`;
  }
}

async function updateSandbox() {
  const profile_id = document.getElementById("sbUpdateProfile").value.trim();
  if (!profile_id) { toast("Nhập profile_id", true); return; }
  const body = {};
  const mode = document.getElementById("sbMode").value;
  const backend = document.getElementById("sbBackend").value.trim();
  const workspace = document.getElementById("sbWorkspace").value;
  if (mode) body.sandbox_mode = mode;
  if (backend) body.backend = backend;
  if (workspace) body.workspace_access = workspace;
  try {
    const { status, data } = await api("/sandbox/" + encodeURIComponent(profile_id), "PUT", body);
    if (status === 202) {
      toast("Thay đổi lớn — chờ duyệt T2: " + data.approval_request_id);
    } else {
      toast("Đã cập nhật sandbox cho " + profile_id);
    }
  } catch (e) {
    toast("Lỗi: " + e.message, true);
  }
}

// ── Tab 4: Channel Bindings ───────────────────────────────────────────────────

async function loadChannelBindings() {
  try {
    const { data } = await api("/channel-bindings");
    const tbody = document.getElementById("cbBody");
    if (!data.items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">Không có channel binding nào.</td></tr>';
      return;
    }
    tbody.innerHTML = data.items.map(cb => `
      <tr>
        <td style="font-family:monospace;font-size:.78rem">${cb.id}</td>
        <td>${cb.channel}</td>
        <td>${cb.profile_id}</td>
        <td>${cb.role || "—"}</td>
        <td>${activeBadge(cb.active)}</td>
        <td>
          <button class="btn btn-reject" style="padding:.2rem .6rem;font-size:.78rem" onclick="deleteChannelBinding('${cb.id}')">Xóa</button>
        </td>
      </tr>`).join("");
  } catch (e) {
    toast("Lỗi tải channel bindings: " + e.message, true);
  }
}

async function createChannelBinding() {
  const body = {
    channel: document.getElementById("cbChannel").value,
    profile_id: document.getElementById("cbProfileId").value.trim(),
    role: document.getElementById("cbRole").value.trim() || null,
    note: document.getElementById("cbNote").value.trim() || null,
  };
  if (!body.profile_id) { toast("profile_id là bắt buộc", true); return; }
  try {
    const { data } = await api("/channel-bindings", "POST", body);
    toast("Đã tạo channel binding: " + data.id);
    loadChannelBindings();
  } catch (e) {
    toast("Lỗi: " + (e.detail?.hint || e.message), true);
  }
}

async function deleteChannelBinding(id) {
  if (!confirm("Xác nhận xóa channel binding " + id + "?")) return;
  try {
    await api("/channel-bindings/" + id, "DELETE", {});
    toast("Đã xóa channel binding " + id);
    loadChannelBindings();
  } catch (e) {
    toast("Lỗi: " + e.message, true);
  }
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

async function loadAuditLog() {
  const pt = document.getElementById("auditTypeFilter").value;
  const qs = pt ? `?policy_type=${encodeURIComponent(pt)}` : "";
  try {
    const { data } = await api("/audit-log" + qs);
    const tbody = document.getElementById("auditBody");
    if (!data.items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Không có log nào.</td></tr>';
      return;
    }
    tbody.innerHTML = data.items.map(e => `
      <tr>
        <td style="font-size:.78rem">${e.created_at}</td>
        <td>${e.policy_type}</td>
        <td style="font-family:monospace;font-size:.78rem">${e.policy_id}</td>
        <td><strong>${e.action}</strong></td>
        <td>${e.changed_by}</td>
        <td>${e.policy_revision}</td>
        <td>${e.requires_approval ? '<span class="badge-deny">T2</span>' : ''}</td>
      </tr>`).join("");
  } catch (e) {
    toast("Lỗi tải audit log: " + e.message, true);
  }
}

// ── Khởi tạo ─────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  loadToolPolicies();
});
