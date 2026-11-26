/* dashboard.js — D6 Executive Dashboard TD-04 */

const TIER_ICON = { T0: '', T1: '🟢', T2: '🟡', T3: '🔴' };
const TIER_LABEL = { T0: 'T0', T1: 'T1', T2: 'T2', T3: 'T3' };

let _autoRefreshTimer = null;
let _wnmZoneData = null;
let _wnmLayerFilter = 'all';

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtHours(h) {
  if (h === null || h === undefined) return '—';
  const abs = Math.abs(h);
  if (abs < 1) return `${Math.round(abs * 60)}ph`;
  return `${abs.toFixed(1)}h`;
}

function alertBadge(level) {
  if (level === 'critical') return '<span class="alert-critical">🔴 Critical</span>';
  if (level === 'warning')  return '<span class="alert-warn">🟡 Warning</span>';
  return '<span class="alert-ok">🟢 OK</span>';
}

function zoneErrorHtml(msg) {
  return `<div style="color:#dc2626;padding:0.75rem;background:#fef2f2;border-radius:6px;font-size:0.85rem;">
    ⚠ Lỗi lấy dữ liệu: ${escHtml(msg)}
  </div>`;
}

// ── Load & render ─────────────────────────────────────────────────────────────

async function loadDashboard(forceRefresh) {
  const spinner = document.getElementById('db-spinner');
  const genAt   = document.getElementById('db-generated-at');
  spinner.style.display = 'inline';

  try {
    const url = '/api/v1/dashboard/executive' + (forceRefresh ? '?refresh=true' : '');
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      showToast('Lỗi tải dashboard: ' + (data.detail?.error || res.status));
      return;
    }

    renderSystemHealth(data.system_health);
    renderFinanceRunway(data.finance_runway);
    renderBottlenecks(data.bottlenecks);
    renderWhatNeedsMe(data.whatneeds_me);
    renderCompliance(data.compliance);
    renderAudit(data.audit);
    renderMeetings(data.meetings);

    if (data.generated_at) {
      genAt.textContent = 'Cập nhật lúc: ' + data.generated_at.replace('T', ' ').replace('Z', ' UTC');
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message);
  } finally {
    spinner.style.display = 'none';
  }
}

// ── Zone renderers ─────────────────────────────────────────────────────────────

function renderSystemHealth(zone) {
  const el = document.getElementById('zone-system-health');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  const hb = zone.heartbeat || {};
  el.innerHTML = `
    <div class="db-zone-row">
      ${alertBadge(zone.alert_level)}
    </div>
    <table class="db-table">
      <tr><td>Heartbeat (active nodes)</td>
          <td>Tổng: <b>${hb.total||0}</b> | 🟢 ${hb['thức']||0} thức | ⚫ ${hb['ngủ']||0} ngủ | 🔴 ${hb.stale||0} stale</td></tr>
      <tr><td>Contracts đang thực hiện</td><td><b>${zone.contracts_in_progress||0}</b></td></tr>
      <tr><td>Contracts chờ review</td>
          <td><b>${zone.contracts_pending_review||0}</b>
            <a href="/approval-queue" class="db-link">→ Approval Queue</a></td></tr>
      <tr><td>Event Bus DLQ</td><td><b>${zone.eventbus_dlq||0}</b></td></tr>
      <tr><td>Events expired (24h)</td><td><b>${zone.eventbus_expired_24h||0}</b></td></tr>
    </table>
    <div class="db-drill"><a href="/org-chart" class="db-link">→ Org Chart</a></div>
  `;
}

function renderFinanceRunway(zone) {
  const el = document.getElementById('zone-finance-runway');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  const roas = zone.roas_30d !== null && zone.roas_30d !== undefined
    ? zone.roas_30d.toFixed(2) : '—';
  const days = zone.days_until_limit !== null && zone.days_until_limit !== undefined
    ? zone.days_until_limit + ' ngày' : '—';
  el.innerHTML = `
    <div class="db-zone-row">
      ${alertBadge(zone.alert_level)}
      ${zone.emergency_stop_active_count > 0 ? '<span class="alert-critical">🚨 Emergency Stop ACTIVE</span>' : ''}
    </div>
    <table class="db-table">
      <tr><td>Chi tiêu 7 ngày</td><td><b>$${(zone.spend_7d_usd||0).toFixed(2)}</b></td></tr>
      <tr><td>Chi tiêu 30 ngày</td><td><b>$${(zone.spend_30d_usd||0).toFixed(2)}</b></td></tr>
      <tr><td>Doanh thu 30 ngày</td><td><b>$${(zone.revenue_30d_usd||0).toFixed(2)}</b></td></tr>
      <tr><td>ROAS (30 ngày)</td><td><b>${roas}</b></td></tr>
      <tr><td>Runway</td><td><b>${days}</b></td></tr>
      <tr><td>Budget policies</td><td><b>${zone.policy_count||0}</b>
          (${zone.emergency_stop_active_count||0} emergency stop)</td></tr>
    </table>
    <div class="db-drill"><a href="/budget" class="db-link">→ Budget View</a></div>
  `;
}

function renderBottlenecks(zone) {
  const el = document.getElementById('zone-bottlenecks');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  if (!Array.isArray(zone) || zone.length === 0) {
    el.innerHTML = '<div style="color:#16a34a;padding:0.5rem;">✅ Không có điểm nghẽn.</div>';
    return;
  }
  const rows = zone.slice(0, 10).map(b => `
    <tr>
      <td>${escHtml(b.group)}</td>
      <td><span class="status-pill s-${escHtml(b.status)}">${escHtml(b.status)}</span></td>
      <td>${b.count}</td>
      <td>${fmtHours(b.oldest_hours)}</td>
      <td>${fmtHours(b.avg_hours)}</td>
      <td>${fmtHours(b.p50_hours)}</td>
      <td>${fmtHours(b.p95_hours)}</td>
    </tr>`).join('');
  el.innerHTML = `
    <table class="db-table">
      <thead><tr>
        <th>Nhóm</th><th>Trạng thái</th><th>SL</th>
        <th>Cũ nhất</th><th>TB</th><th>P50</th><th>P95</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function ensureLayerFilter() {
  const el = document.getElementById('zone-whatneeds-me');
  if (!el) return;
  const card = el.closest('.db-zone-card');
  if (!card) return;
  const header = card.querySelector('.db-zone-header');
  if (!header) return;
  if (header.querySelector('#gs-layer-filter')) return;

  const wrapper = document.createElement('span');
  wrapper.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;gap:0.3rem;';

  const label = document.createElement('span');
  label.textContent = 'Tầng giám sát:';
  label.style.cssText = 'font-size:0.75rem;color:#475569;font-weight:600;white-space:nowrap;';

  const sel = document.createElement('select');
  sel.id = 'gs-layer-filter';
  sel.style.cssText = 'font-size:0.75rem;padding:0.15rem 0.3rem;border:1px solid #cbd5e1;border-radius:4px;background:#fff;cursor:pointer;';

  [
    { value: 'all', label: 'Tầng giám sát: Tất cả' },
    { value: 'T1',  label: 'T1 · Hệ thống' },
    { value: 'T2',  label: 'T2 · Vận hành' },
    { value: 'T3',  label: 'T3 · Nghiệp vụ' },
  ].forEach(function(o) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });

  sel.value = _wnmLayerFilter;
  sel.onchange = function() {
    _wnmLayerFilter = this.value;
    renderWhatNeedsMeBody();
  };

  wrapper.appendChild(label);
  wrapper.appendChild(sel);
  header.appendChild(wrapper);
}

function renderWhatNeedsMeBody() {
  const el = document.getElementById('zone-whatneeds-me');
  const all = (_wnmZoneData.items || []);
  const overdue = _wnmZoneData.overdue_count || 0;
  const total   = _wnmZoneData.total_pending || 0;

  const header = `
    <div class="db-zone-row">
      <span>Tổng chờ duyệt: <b>${total}</b></span>
      ${overdue > 0 ? `<span class="alert-critical">⚠ ${overdue} quá hạn</span>` : ''}
      <a href="/approval-queue" class="db-link">→ Xem tất cả</a>
    </div>`;

  if (all.length === 0) {
    el.innerHTML = header + '<div style="color:#16a34a;padding:0.5rem;">✅ Hàng đợi trống.</div>';
    return;
  }

  const visible = _wnmLayerFilter === 'all'
    ? all
    : all.filter(function(it) { const p = parseGsTag(it.title); return p && p.tier === _wnmLayerFilter; });

  if (visible.length === 0) {
    el.innerHTML = header + '<div style="color:#64748b;padding:0.5rem;font-size:0.85rem;">Không có mục nào cho tầng đang lọc.</div>';
    return;
  }

  const cards = visible.slice(0, 5).map(function(item) {
    const tier = item.risk_tier || '';
    const icon = TIER_ICON[tier] || tier;
    const hrs  = item.hours_remaining;
    const overdueCls = hrs < 0 ? 'overdue' : '';
    const hrsText = hrs < 0
      ? `⚠ Quá hạn ${fmtHours(-hrs)}`
      : `⏱ Còn ${fmtHours(hrs)}`;

    return `
    <div class="card" id="wnm-${escHtml(item.id)}">
      <div class="card-header">
        <span class="card-type">${escHtml(item.request_type)}</span>
        <span class="tier-badge tier-${escHtml(tier)}">${icon} ${escHtml(tier)}</span>
      </div>
      <div class="card-agent">${renderGsChip(item.title)}${escHtml(item.title)}</div>
      <div class="card-agent" style="font-size:0.78rem;color:#64748b;">
        by ${escHtml(item.requester_id)}
      </div>
      <span class="status-pill s-${escHtml(item.status)}">${escHtml(item.status)}</span>
      <div class="card-sla ${overdueCls}">${hrsText} — SLA: ${escHtml(item.sla_deadline)}</div>
      <div class="actions" style="margin-top:0.6rem;">
        <button class="btn btn-approve" onclick="doDecide('${escHtml(item.id)}','approved')">✓ Duyệt</button>
        <button class="btn btn-reject"  onclick="doDecide('${escHtml(item.id)}','rejected')">✗ Từ chối</button>
        <button class="btn btn-changes" onclick="doDecide('${escHtml(item.id)}','changes_requested')">✏ Yêu cầu chỉnh sửa</button>
        <button class="btn btn-escalate" onclick="doDecide('${escHtml(item.id)}','escalated')">↑ Escalate</button>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = header + cards;
}

function renderWhatNeedsMe(zone) {
  ensureLayerFilter();
  const el = document.getElementById('zone-whatneeds-me');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  _wnmZoneData = zone;
  renderWhatNeedsMeBody();
}

function renderCompliance(zone) {
  const el = document.getElementById('zone-compliance');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  el.innerHTML = `
    <table class="db-table">
      <tr><td>Contracts có Goal ID</td><td><b>${(zone.goal_link_pct||0).toFixed(1)}%</b></td></tr>
      <tr><td>Contracts done có evidence</td><td><b>${(zone.evidence_done_pct||0).toFixed(1)}%</b></td></tr>
      <tr><td>Override rate (Chairman vs Compliance)</td><td><b>${(zone.override_rate_pct||0).toFixed(1)}%</b></td></tr>
      <tr><td>VETO trong 30 ngày</td><td><b>${zone.veto_count_30d||0}</b></td></tr>
    </table>
    <div class="db-drill">
      <a href="/goal-tree" class="db-link">→ Goal Tree</a>
      <a href="/org-chart" class="db-link">→ Org Chart (VETO)</a>
    </div>
  `;
}

function renderAudit(zone) {
  const el = document.getElementById('zone-audit');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  const findings = zone.findings || [];
  const tips      = zone.tips || [];

  const fRows = findings.slice(0, 5).map(f => `
    <tr>
      <td>${f.severity === 'critical' ? '🔴' : f.severity === 'warn' ? '🟡' : 'ℹ'} ${escHtml(f.severity)}</td>
      <td>${escHtml(f.category)}</td>
      <td>${escHtml(f.description?.substring(0, 80))}${(f.description?.length > 80) ? '…' : ''}</td>
      <td><span class="status-pill s-${escHtml(f.status)}">${escHtml(f.status)}</span></td>
    </tr>`).join('');

  const tRows = tips.slice(0, 3).map(t => `
    <tr>
      <td>${escHtml(t.tip_id)}</td>
      <td>${escHtml(t.subject)}</td>
      <td><span class="status-pill s-${escHtml(t.status)}">${escHtml(t.status)}</span></td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="db-zone-row">
      ${alertBadge(zone.alert_level)}
      <span>Đang điều tra: <b>${zone.investigation_count||0}</b></span>
    </div>
    ${findings.length > 0 ? `
      <div style="font-size:0.8rem;font-weight:700;color:#475569;margin:0.5rem 0 0.25rem;">Audit Findings (${findings.length})</div>
      <table class="db-table">
        <thead><tr><th>Mức độ</th><th>Danh mục</th><th>Mô tả</th><th>Trạng thái</th></tr></thead>
        <tbody>${fRows}</tbody>
      </table>` : '<div style="color:#16a34a;font-size:0.85rem;">✅ Không có findings.</div>'}
    ${tips.length > 0 ? `
      <div style="font-size:0.8rem;font-weight:700;color:#475569;margin:0.5rem 0 0.25rem;">Tố giác (${tips.length})</div>
      <table class="db-table">
        <thead><tr><th>ID</th><th>Chủ đề</th><th>Trạng thái</th></tr></thead>
        <tbody>${tRows}</tbody>
      </table>` : ''}
  `;
}

function renderMeetings(zone) {
  const el = document.getElementById('zone-meetings');
  if (!zone || zone.status === 'error') {
    el.innerHTML = zoneErrorHtml(zone?.message || '');
    return;
  }
  const meetings = zone.in_progress_meetings || [];
  const mRows = meetings.slice(0, 5).map(m => `
    <tr>
      <td>${escHtml(m.title)}</td>
      <td><span class="status-pill s-${escHtml(m.status)}">${escHtml(m.status)}</span></td>
      <td>${escHtml(m.start_time || '—')}</td>
      <td>${m.open_action_items || 0}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="db-zone-row">
      ${alertBadge(zone.alert_level)}
      <span>Cuộc họp draft: <b>${zone.total_meetings_draft||0}</b></span>
      <span>Action items mở: <b>${zone.open_action_items_total||0}</b></span>
    </div>
    ${meetings.length > 0 ? `
      <table class="db-table">
        <thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Bắt đầu</th><th>Action items</th></tr></thead>
        <tbody>${mRows}</tbody>
      </table>` : '<div style="color:#94a3b8;font-size:0.85rem;">Không có cuộc họp đang diễn ra.</div>'}
  `;
}

// ── Approval decide ───────────────────────────────────────────────────────────

async function doDecide(requestId, decision) {
  let reason = null;
  if (decision === 'rejected' || decision === 'changes_requested') {
    reason = prompt(
      decision === 'rejected' ? 'Lý do từ chối:' : 'Nội dung yêu cầu chỉnh sửa:',
      ''
    );
    if (reason === null) return; // cancelled
  }

  try {
    const res = await fetch(`/api/v1/approvals/${encodeURIComponent(requestId)}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason, actor: 'chu_tich' }),
    });
    const data = await res.json();

    if (!res.ok) {
      const errCode = data.detail?.error || res.status;
      showToast(`Lỗi: ${errCode}`);
      return;
    }

    showToast(`✓ Đã ${decision} — ID: ${requestId}`);
    // Reload WhatNeedsMe zone
    setTimeout(() => loadWhatNeedsMeZone(), 500);
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message);
  }
}

async function loadWhatNeedsMeZone() {
  try {
    const res  = await fetch('/api/v1/dashboard/whatneeds-me');
    const data = await res.json();
    if (res.ok) renderWhatNeedsMe(data);
  } catch (err) {
    // silently ignore zone reload error
  }
}

// ── Toast + auto-refresh ──────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('db-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function startAutoRefresh() {
  if (_autoRefreshTimer) clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = setInterval(() => loadDashboard(false), 60000);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  ensureLayerFilter();
  loadDashboard(false);
  startAutoRefresh();
});
