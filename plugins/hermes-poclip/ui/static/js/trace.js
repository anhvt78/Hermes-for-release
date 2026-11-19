// Task Trace View — TD-06 D8
// Vanilla JS, no external dependencies.

const SOURCE_ICONS = {
  kanban: '📋',
  comm_log: '💬',
  audit_log: '🛡️',
};

const SOURCE_LABELS = {
  kanban: 'Kanban',
  comm_log: 'Liên lạc',
  audit_log: 'Audit',
};

function fmtTs(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch (_) {
    return ts;
  }
}

function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setBanner(html, cls) {
  const el = document.getElementById('status-banner');
  el.innerHTML = html ? `<div class="banner ${cls}">${html}</div>` : '';
}

function setSourcesBar(sc, total) {
  if (!sc) { document.getElementById('sources-bar').innerHTML = ''; return; }
  const el = document.getElementById('sources-bar');
  el.innerHTML = `<div class="sources-bar">
    <span>Tổng: ${total} events</span>
    <span>📋 Kanban: ${sc.kanban}</span>
    <span>💬 Liên lạc: ${sc.comm_log}</span>
    <span>🛡️ Audit: ${sc.audit_log}</span>
  </div>`;
}

function renderTimeline(events, currentSource) {
  const container = document.getElementById('timeline-container');
  if (!events || events.length === 0) {
    container.innerHTML = '<div id="empty-state">Chưa có dòng thời gian</div>';
    return;
  }

  // Client-side source filter re-render
  const filtered = currentSource && currentSource !== 'all'
    ? events.filter(e => e.source === currentSource)
    : events;

  if (filtered.length === 0) {
    container.innerHTML = '<div id="empty-state">Không có events cho nguồn đã chọn</div>';
    return;
  }

  const items = filtered.map(ev => {
    const badge = `<span class="tl-badge badge-${escHtml(ev.source)}">${SOURCE_ICONS[ev.source] || ''} ${escHtml(SOURCE_LABELS[ev.source] || ev.source)}</span>`;
    const stateHtml = (ev.state_before || ev.state_after) ? `
      <div class="tl-states">
        ${ev.state_before ? `<span class="tl-state-chip">${escHtml(ev.state_before)}</span>` : ''}
        ${(ev.state_before && ev.state_after) ? '<span class="tl-arrow">→</span>' : ''}
        ${ev.state_after ? `<span class="tl-state-chip">${escHtml(ev.state_after)}</span>` : ''}
      </div>` : '';
    const evidenceHtml = ev.evidence_link
      ? `<div class="tl-evidence">🔗 <a href="${escHtml(ev.evidence_link)}" target="_blank">${escHtml(ev.evidence_link)}</a></div>`
      : '';
    return `
      <div class="timeline-item">
        <div class="tl-top">
          ${badge}
          <span class="tl-ts">${fmtTs(ev.timestamp)}</span>
          <span class="tl-actor">@${escHtml(ev.actor)}</span>
        </div>
        <div class="tl-action">${escHtml(ev.action)}</div>
        ${ev.detail ? `<div class="tl-detail">${escHtml(ev.detail)}</div>` : ''}
        ${evidenceHtml}
        ${stateHtml}
      </div>`;
  }).join('');

  container.innerHTML = `<div class="timeline">${items}</div>`;
}

// Store last loaded data for client-side source re-filter
let _lastData = null;

function applySourceFilter() {
  if (!_lastData) return;
  const src = document.getElementById('inp-source').value;
  renderTimeline(_lastData.timeline, src);
}

document.getElementById('inp-source').addEventListener('change', applySourceFilter);

async function loadTrace() {
  const taskId = document.getElementById('inp-task-id').value.trim();
  const corrId = document.getElementById('inp-corr-id').value.trim();
  const source = document.getElementById('inp-source').value;
  const limit = document.getElementById('inp-limit').value || 200;

  setBanner('', '');
  setSourcesBar(null, 0);
  document.getElementById('timeline-container').innerHTML = '';
  _lastData = null;

  if (!taskId && !corrId) {
    setBanner('Cần nhập Task ID hoặc Correlation ID.', 'banner-err');
    return;
  }

  const params = new URLSearchParams();
  if (taskId) params.set('task_id', taskId);
  if (corrId) params.set('correlation_id', corrId);
  params.set('limit', limit);
  params.set('source', 'all'); // always fetch all; filter client-side

  document.getElementById('loading').style.display = 'block';
  try {
    const res = await fetch('/api/v1/trace?' + params.toString());
    const data = await res.json();
    document.getElementById('loading').style.display = 'none';

    if (!res.ok) {
      const msg = (data.detail && data.detail.message) ? data.detail.message : JSON.stringify(data.detail);
      setBanner('Lỗi: ' + msg, 'banner-err');
      return;
    }

    _lastData = data;
    setSourcesBar(data.sources_count, data.total_events);

    if (data.truncated && data.message) {
      setBanner(data.message, 'banner-warn');
    } else if (data.message) {
      setBanner(data.message, 'banner-info');
    }

    renderTimeline(data.timeline, source);
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    setBanner('Lỗi kết nối: ' + err.message, 'banner-err');
  }
}

// Auto-load from URL params on page load
(function autoLoad() {
  const sp = new URLSearchParams(window.location.search);
  const tid = sp.get('task_id');
  const cid = sp.get('correlation_id');
  if (tid) document.getElementById('inp-task-id').value = tid;
  if (cid) document.getElementById('inp-corr-id').value = cid;
  if (tid || cid) loadTrace();
})();
