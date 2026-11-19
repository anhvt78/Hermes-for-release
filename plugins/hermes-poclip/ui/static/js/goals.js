/* goals.js — D2 Goal Tree TD-01 */

async function loadTree() {
  const wrap = document.getElementById('gt-tree-wrap');
  const status = document.getElementById('gt-status');
  wrap.innerHTML = '<div class="gt-empty"><span class="spinner"></span> Đang tải cây mục tiêu...</div>';
  status.textContent = '';

  try {
    const res = await fetch('/api/v1/goals/tree?include_tasks=true');
    const data = await res.json();

    if (!res.ok) {
      wrap.innerHTML = `<div class="gt-empty" style="color:#ef4444;">Lỗi: ${data.detail?.error || 'Không tải được'}</div>`;
      return;
    }

    if (!data.goals || data.goals.length === 0) {
      wrap.innerHTML = '<div class="gt-empty">Chưa có goal nào. Tạo goal cấp company trước.</div>';
    } else {
      wrap.innerHTML = '';
      data.goals.forEach(g => wrap.appendChild(buildNode(g)));
    }

    renderOrphanTasks(data.orphan_tasks || []);
    status.textContent = `Cập nhật: ${new Date(data.generated_at).toLocaleString('vi-VN')}`;
  } catch (err) {
    wrap.innerHTML = `<div class="gt-empty" style="color:#ef4444;">Lỗi kết nối: ${err.message}</div>`;
  }
}

function buildNode(goal) {
  const div = document.createElement('div');
  div.className = 'gt-node';

  const pct = (goal.progress_pct || 0).toFixed(1);
  const fillClass = pct >= 100 ? 'done' : '';
  const budget = goal.budget_allocated_usd > 0 ? `$${goal.budget_allocated_usd.toLocaleString()}` : '';

  div.innerHTML = `
    <div class="gt-node-header gt-level-${goal.level}" onclick="toggleChildren(this, '${goal.id}')">
      <span style="font-size:0.7rem;color:#94a3b8;min-width:70px;">${goal.level.toUpperCase()}</span>
      <span class="gt-title">${escHtml(goal.title)}</span>
      <span class="gt-owner">👤 ${escHtml(goal.owner)}</span>
      ${budget ? `<span class="gt-budget">💰 ${budget}</span>` : ''}
      <span class="badge-status badge-${goal.status}">${goal.status}</span>
      <div class="gt-progress-bar"><div class="gt-progress-fill ${fillClass}" style="width:${pct}%"></div></div>
      <span class="gt-pct">${pct}%</span>
      ${goal.task_count > 0 ? `<span style="font-size:0.72rem;color:#6366f1;">📋 ${goal.task_count}</span>` : ''}
    </div>
    <div class="gt-children" id="children-${goal.id}" style="display:none;"></div>
  `;

  if (goal.children && goal.children.length > 0) {
    const childWrap = div.querySelector(`#children-${goal.id}`);
    goal.children.forEach(c => childWrap.appendChild(buildNode(c)));
  }

  // Task-level nodes: click header opens contract modal
  if (goal.level === 'task') {
    div.querySelector('.gt-node-header').onclick = (e) => {
      e.stopPropagation();
      openContractModal(goal.id, goal.title);
    };
  }

  return div;
}

function toggleChildren(el, goalId) {
  const childWrap = document.getElementById(`children-${goalId}`);
  if (!childWrap) return;
  childWrap.style.display = childWrap.style.display === 'none' ? 'block' : 'none';
}

function renderOrphanTasks(tasks) {
  const section = document.getElementById('gt-orphan-section');
  const heading = document.getElementById('gt-orphan-heading');
  const list = document.getElementById('gt-orphan-list');

  if (!tasks || tasks.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  const critical = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending_review');
  const warnClass = critical.length >= 3 ? 'gt-orphan-warn-red' : 'gt-orphan-warn-yellow';
  heading.textContent = `⚠ Tasks Mồ Côi (${tasks.length})${critical.length > 0 ? ` — ${critical.length} đang chạy!` : ''}`;

  list.innerHTML = `<div class="${warnClass}">` +
    tasks.map(t => `
      <div class="gt-orphan-item">
        <span class="task-id">${escHtml(t.task_id)}</span>
        <span class="gt-orphan-badge badge-${(t.status || '').replace('_', '-')}">${t.status}</span>
        <span>${escHtml(t.responsible || '')}</span>
      </div>
    `).join('') +
    '</div>';
}

async function openContractModal(goalId, goalTitle) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');

  title.textContent = goalTitle;
  body.innerHTML = '<span class="spinner"></span> Đang tải...';
  overlay.classList.add('open');

  try {
    // Lấy task_contracts liên kết với goal này qua tree API
    const res = await fetch(`/api/v1/goals/${encodeURIComponent(goalId)}`);
    const goal = await res.json();

    if (!res.ok) {
      body.innerHTML = `<div style="color:#ef4444;">Không tải được: ${goal.detail?.error || 'Lỗi'}</div>`;
      return;
    }

    body.innerHTML = renderGoalDetail(goal);
  } catch (err) {
    body.innerHTML = `<div style="color:#ef4444;">Lỗi: ${err.message}</div>`;
  }
}

function renderGoalDetail(goal) {
  const fields = [
    ['ID', goal.id],
    ['Level', goal.level],
    ['Owner', goal.owner],
    ['Status', goal.status],
    ['Tiến độ', `${(goal.progress_pct || 0).toFixed(1)}%`],
    ['Ngân sách', goal.budget_allocated_usd > 0 ? `$${goal.budget_allocated_usd}` : '—'],
    ['Điều kiện đạt', goal.done_when || '—'],
    ['Bằng chứng', goal.evidence_url ? `<a href="${escHtml(goal.evidence_url)}" target="_blank">Link</a>` : '—'],
    ['Mô tả', goal.description || '—'],
    ['Tạo lúc', goal.created_at],
  ];
  return fields.map(([label, val]) =>
    `<div class="modal-field"><span class="modal-label">${label}</span><span class="modal-value">${val}</span></div>`
  ).join('');
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
