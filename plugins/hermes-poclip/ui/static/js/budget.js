/* Budget View JS — TD-02 D3 */

let _stopPolicyId = null;
const NOW_ISO = new Date().toISOString().slice(0, 10);
const MONTH_START = NOW_ISO.slice(0, 7) + '-01';

async function loadAll() {
  document.getElementById('bv-status').textContent = 'Đang tải...';
  await Promise.all([loadPolicies(), loadRoas()]);
  document.getElementById('bv-status').textContent = 'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN');
}

async function loadPolicies() {
  const grid = document.getElementById('bv-policies-grid');
  try {
    const res = await fetch('/api/v1/budget/policies');
    const policies = await res.json();
    if (!policies.length) {
      grid.innerHTML = '<div class="bv-empty">Chưa có budget policy nào.</div>';
      return;
    }
    const cards = await Promise.all(policies.map(p => buildPolicyCard(p)));
    grid.innerHTML = cards.join('');
  } catch (e) {
    grid.innerHTML = `<div class="bv-empty" style="color:#ef4444;">Lỗi tải policies: ${e.message}</div>`;
  }
}

async function buildPolicyCard(p) {
  let spent = 0, usedPct = 0, alertLevel = 'green';
  try {
    const sid = p.scope_id ? `&scope_id=${encodeURIComponent(p.scope_id)}` : '';
    const r = await fetch(`/api/v1/budget/status?scope_type=${p.scope_type}${sid}&window=${p.window}`);
    if (r.ok) {
      const s = await r.json();
      spent = s.spent_usd; usedPct = s.used_pct; alertLevel = s.alert_level;
    }
  } catch (_) {}

  let burnHtml = '';
  try {
    const sid = p.scope_id ? `&scope_id=${encodeURIComponent(p.scope_id)}` : '';
    const br = await fetch(`/api/v1/budget/burn-rate?scope_type=${p.scope_type}${sid}&days=7`);
    if (br.status === 422) {
      burnHtml = '<div class="bv-burn-rate">Burn rate: chưa đủ dữ liệu (cần >=3 ngày)</div>';
    } else if (br.ok) {
      const bd = await br.json();
      const daysLeft = bd.days_until_limit !== null ? `, còn ~${bd.days_until_limit.toFixed(1)} ngày` : '';
      burnHtml = `<div class="bv-burn-rate">Burn 7d: ${bd.avg_daily_usd.toFixed(2)}/ngày, trend ${bd.trend}${daysLeft}</div>`;
    }
  } catch (_) {}

  const barClass = alertLevel === 'critical' ? 'bar-critical' : alertLevel === 'warning' ? 'bar-warning' : 'bar-green';
  const alertClass = 'alert-' + alertLevel;
  const alertEmoji = alertLevel === 'critical' ? '🔴' : alertLevel === 'warning' ? '🟡' : '🟢';
  const alertLabel = alertLevel === 'critical' ? 'Vượt hạn mức' : alertLevel === 'warning' ? 'Cảnh báo' : 'Bình thường';
  const stopActive = p.emergency_stop_active;

  return `
<div class="bv-card">
  <div class="bv-card-title">
    <span class="bv-scope-badge scope-${p.scope_type}">${p.scope_type}</span>
    ${p.scope_id || '(company-wide)'}
  </div>
  <div class="bv-stat"><span class="bv-stat-label">Hạn mức</span><span class="bv-stat-val">$${p.amount_usd.toFixed(2)}</span></div>
  <div class="bv-stat"><span class="bv-stat-label">Đã dùng</span><span class="bv-stat-val">$${spent.toFixed(2)} (${usedPct.toFixed(1)}%)</span></div>
  <div class="bv-stat"><span class="bv-stat-label">Chu kỳ</span><span class="bv-stat-val">${p.window}</span></div>
  ${burnHtml}
  <div class="bv-bar-wrap"><div class="bv-bar ${barClass}" style="width:${Math.min(usedPct,100).toFixed(1)}%"></div></div>
  <div>
    <span class="bv-alert-badge ${alertClass}">${alertEmoji} ${alertLabel}</span>
    ${stopActive ? '<span class="bv-alert-badge alert-critical" style="margin-left:0.5rem;">🚨 Emergency Stop ACTIVE</span>' : ''}
  </div>
  ${!stopActive ? `<button class="bv-stop-btn" onclick="openStopModal('${p.id}','${p.scope_id || p.scope_type}')">🛑 Emergency Stop</button>` : ''}
</div>`;
}

async function loadRoas() {
  const el = document.getElementById('bv-roas-list');
  const periodEnd = new Date().toISOString().slice(0, 10) + 'T23:59:59Z';
  try {
    const r = await fetch(`/api/v1/budget/roas?period_start=${MONTH_START}T00:00:00Z&period_end=${periodEnd}`);
    const data = await r.json();
    if (!data.length) {
      el.innerHTML = '<div class="bv-empty">Chưa có dữ liệu ROAS tháng này.</div>';
      return;
    }
    el.innerHTML = data.map(row => `
<div class="bv-roas-row">
  <span class="bv-cluster-name">${row.cluster}</span>
  <span>Chi phí: $${row.cost_usd.toFixed(2)}</span>
  <span>Doanh thu: ${row.revenue_usd !== null ? '$' + row.revenue_usd.toFixed(2) : '<span style="color:#94a3b8">—</span>'}</span>
  <span class="bv-roas-val ${row.roas !== null ? 'roas-good' : 'roas-null'}">
    ROAS: ${row.roas !== null ? row.roas.toFixed(2) + 'x' : 'N/A'}
  </span>
</div>`).join('');
  } catch (e) {
    el.innerHTML = `<div class="bv-empty" style="color:#ef4444;">Lỗi tải ROAS: ${e.message}</div>`;
  }
}

function openStopModal(policyId, label) {
  _stopPolicyId = policyId;
  document.getElementById('stop-policy-label').textContent = label + ' (' + policyId.slice(0, 8) + '...)';
  document.getElementById('stop-reason').value = '';
  document.getElementById('stop-modal').classList.add('open');
}

function closeStopModal() {
  _stopPolicyId = null;
  document.getElementById('stop-modal').classList.remove('open');
}

async function confirmStop() {
  const actor = document.getElementById('stop-actor').value.trim();
  const reason = document.getElementById('stop-reason').value.trim();
  if (!reason) { alert('Vui lòng nhập lý do.'); return; }
  try {
    const r = await fetch('/api/v1/budget/emergency-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_id: _stopPolicyId, reason, actor }),
    });
    const data = await r.json();
    if (!r.ok) {
      alert('Lỗi: ' + (data.detail?.error || JSON.stringify(data.detail)));
      return;
    }
    closeStopModal();
    await loadAll();
  } catch (e) {
    alert('Lỗi kết nối: ' + e.message);
  }
}

document.addEventListener('DOMContentLoaded', loadAll);
