/* org.js — D1 Org Chart TD-03 */

async function loadTree() {
  const wrap = document.getElementById('oc-tree-wrap');
  const status = document.getElementById('oc-status');
  wrap.innerHTML = '<div class="oc-empty"><span class="spinner"></span> Đang tải sơ đồ tổ chức...</div>';
  status.textContent = '';

  try {
    const res = await fetch('/api/v1/org/tree');
    const data = await res.json();

    if (!res.ok) {
      wrap.innerHTML = `<div class="oc-empty" style="color:#ef4444;">Lỗi: ${data.detail?.error || 'Không tải được'}</div>`;
      return;
    }

    if (!data.tree || data.tree.length === 0) {
      wrap.innerHTML = `
        <div class="oc-empty">Chưa có dữ liệu tổ chức.</div>
        <div class="oc-empty-hint">Chạy POST /api/v1/org/sync để đồng bộ từ role cards.</div>
      `;
    } else {
      wrap.innerHTML = '';
      data.tree.forEach(n => wrap.appendChild(buildNode(n)));
    }

    renderVetoSection(data.veto_relationships || []);

    const hb = data.heartbeat_summary || {};
    status.textContent = `Tổng: ${hb.total || 0} | 🟢 ${hb['thức'] || 0} | ⚫ ${hb['ngủ'] || 0} | 🔴 ${hb['stale'] || 0}`;
  } catch (err) {
    wrap.innerHTML = `<div class="oc-empty" style="color:#ef4444;">Lỗi kết nối: ${escHtml(err.message)}</div>`;
  }
}

function buildNode(node) {
  const div = document.createElement('div');
  div.className = 'oc-node';

  const hbStatus = node.heartbeat_status || 'ngủ';
  let hbIcon, hbClass;
  if (hbStatus === 'thức') { hbIcon = '🟢'; hbClass = 'hb-thuc'; }
  else if (hbStatus === 'stale') { hbIcon = '🔴'; hbClass = 'hb-stale'; }
  else { hbIcon = '⚫'; hbClass = 'hb-ngu'; }

  const taskCount = node.running_task_count || 0;
  const unitBadge = node.org_unit
    ? `<span class="oc-unit">${escHtml(node.org_unit)}</span>`
    : '';

  div.innerHTML = `
    <div class="oc-node-header" onclick="openDetailModal('${escHtml(node.profile_id)}')">
      <span class="oc-profile-id">${escHtml(node.profile_id)}</span>
      <span class="oc-role">${escHtml(node.role || '')}</span>
      ${unitBadge}
      <span class="oc-hb-badge ${hbClass}">${hbIcon} ${hbStatus}</span>
      <span class="oc-task-count">${taskCount > 0 ? `📋 ${taskCount} task` : ''}</span>
    </div>
    <div class="oc-children" id="oc-children-${escHtml(node.profile_id)}" style="display:block;"></div>
  `;

  if (node.children && node.children.length > 0) {
    const childWrap = div.querySelector(`#oc-children-${CSS.escape(node.profile_id)}`);
    node.children.forEach(c => childWrap.appendChild(buildNode(c)));
  }

  return div;
}

function renderVetoSection(relationships) {
  const section = document.getElementById('oc-veto-section');
  const list = document.getElementById('oc-veto-list');

  if (!relationships || relationships.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = relationships.map(r => {
    const clusters = (r.target_clusters || []).map(c =>
      `<span class="oc-veto-cluster-tag">${escHtml(c)}</span>`
    ).join('');
    return `
      <div class="oc-veto-row">
        <span class="oc-veto-from">${escHtml(r.from_profile)}</span>
        <span class="oc-veto-type">${escHtml(r.veto_type)}</span>
        <span class="oc-veto-arrow">⇢</span>
        <div class="oc-veto-clusters">${clusters}</div>
      </div>
    `;
  }).join('');
}

async function openDetailModal(profileId) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');

  title.textContent = profileId;
  body.innerHTML = '<span class="spinner"></span> Đang tải...';
  overlay.classList.add('open');

  try {
    const res = await fetch(`/api/v1/org/agents/${encodeURIComponent(profileId)}`);
    const data = await res.json();

    if (!res.ok) {
      body.innerHTML = `<div style="color:#ef4444;">Lỗi ${res.status}: ${data.detail?.error || 'Không tải được'}</div>`;
      return;
    }

    body.innerHTML = renderAgentDetail(data);
  } catch (err) {
    body.innerHTML = `<div style="color:#ef4444;">Lỗi kết nối: ${escHtml(err.message)}</div>`;
  }
}

function renderAgentDetail(data) {
  const p = data.profile || {};
  const hbStatus = p.heartbeat_status || 'ngủ';
  let hbIcon = hbStatus === 'thức' ? '🟢' : hbStatus === 'stale' ? '🔴' : '⚫';

  let html = `
    <div class="modal-section-title">Thông Tin Profile</div>
    ${field('Profile ID', p.profile_id)}
    ${field('Vai trò', p.role)}
    ${field('Đơn vị (Cluster)', p.org_unit || '—')}
    ${field('Manager', p.manager_id || '(root)')}
    ${field('Heartbeat', `${hbIcon} ${hbStatus}`)}
    ${field('Lần cuối ping', p.last_heartbeat_at || '—')}
    ${field('Hoạt động', p.active ? 'Có' : 'Không')}
  `;

  // Budget status
  const bs = data.budget_status;
  if (bs) {
    html += `<div class="modal-section-title">Ngân Sách</div>`;
    html += field('Mức cảnh báo', alertBadge(bs.alert_level));
    html += field('Đã dùng (%)', bs.used_pct != null ? `${bs.used_pct.toFixed(1)}%` : '—');
    html += field('Còn lại (USD)', bs.remaining_usd != null ? `$${bs.remaining_usd.toFixed(2)}` : '—');
  } else {
    html += `<div class="modal-section-title">Ngân Sách</div>`;
    html += `<div style="font-size:0.82rem;color:#94a3b8;">Không có chính sách ngân sách.</div>`;
  }

  // Running tasks
  const tasks = data.running_tasks || [];
  html += `<div class="modal-section-title">Task Đang Chạy (${tasks.length})</div>`;
  if (tasks.length === 0) {
    html += `<div style="font-size:0.82rem;color:#94a3b8;">Không có task đang chạy.</div>`;
  } else {
    html += tasks.map(t =>
      `<div style="font-size:0.82rem;padding:0.3rem 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-family:monospace;color:#475569;">${escHtml(t.task_id)}</span>
        <span style="color:#64748b;margin-left:0.5rem;">${escHtml(t.work_type || '')}</span>
        ${t.deadline ? `<span style="color:#dc2626;margin-left:0.5rem;font-size:0.72rem;">⏰ ${escHtml(t.deadline)}</span>` : ''}
      </div>`
    ).join('');
  }

  // Policy summary
  const ps = data.policy_summary;
  if (ps) {
    html += `<div class="modal-section-title">Tool Policy Summary</div>`;
    html += field('Tổng', ps.total);
    html += field('Allow', ps.allow);
    html += field('Deny', ps.deny);
  }

  return html;
}

function field(label, value) {
  return `<div class="modal-field"><span class="modal-label">${escHtml(label)}</span><span class="modal-value">${value != null ? value : '—'}</span></div>`;
}

function alertBadge(level) {
  if (!level) return '—';
  const cls = level === 'ok' ? 'alert-ok' : level === 'warning' ? 'alert-warn' : 'alert-critical';
  return `<span class="${cls}">${escHtml(level)}</span>`;
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
