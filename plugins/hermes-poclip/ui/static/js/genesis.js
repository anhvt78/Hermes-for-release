/* Genesis Wizard (D0) — hermes-poclip */

const STEPS = ['D0.1', 'D0.2', 'D0.3', 'D0.4', 'D0.5'];
const STEP_PANEL = {
  'D0.1': 'panel-d01', 'D0.2': 'panel-d02',
  'D0.3': 'panel-d03', 'D0.4': 'panel-d04', 'D0.5': 'panel-d05',
};
const STEP_TAB = {
  'D0.1': 'tab-d01', 'D0.2': 'tab-d02',
  'D0.3': 'tab-d03', 'D0.4': 'tab-d04', 'D0.5': 'tab-d05',
};
const STEP_DB = {
  'D0.1': 'D0.1_interview', 'D0.2': 'D0.2_ceo_decision',
  'D0.3': 'D0.3_knowledge_baseline', 'D0.4': 'D0.4_strategy_decomposition',
  'D0.5': 'D0.5_onboarding_queue',
};
const DB_TO_STEP = Object.fromEntries(Object.entries(STEP_DB).map(([k, v]) => [v, k]));

let currentStep = 'D0.1';

function getCompanyId() {
  return document.getElementById('company-id-input').value.trim() || 'hermes-poclip-demo';
}

function showPanel(step) {
  STEPS.forEach(s => {
    const p = document.getElementById(STEP_PANEL[s]);
    const t = document.getElementById(STEP_TAB[s]);
    if (p) p.style.display = s === step ? '' : 'none';
    if (t) {
      t.classList.remove('active', 'done');
      const idx = STEPS.indexOf(s);
      const curIdx = STEPS.indexOf(step);
      if (s === step) t.classList.add('active');
      else if (idx < curIdx) t.classList.add('done');
    }
  });
  currentStep = step;
}

function setProgress(pct) {
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
}

function showResult(panelId, html, isError) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.innerHTML = isError
    ? `<div class="error-box">${html}</div>`
    : `<div class="result-box">${html}</div>`;
}

async function runStep(step) {
  const company_id = getCompanyId();
  let payload = {};

  if (step === 'D0.1') {
    const mission = document.getElementById('d01-mission').value.trim();
    if (!mission) { showResult('result-d01', '❌ Vui lòng nhập Mission Statement', true); return; }
    payload = {
      mission_statement: mission,
      industry: document.getElementById('d01-industry').value.trim(),
      risk_tolerance: document.getElementById('d01-risk').value,
      vision_target_metrics: document.getElementById('d01-vision').value.trim(),
      initial_budget_vnd: parseInt(document.getElementById('d01-budget').value) || 0,
      needs_ceo_layer_preference: document.getElementById('d01-ceo-pref').value,
      compliance_requirements: document.getElementById('d01-compliance').value.trim() || 'Không có yêu cầu đặc thù',
    };
  } else if (step === 'D0.2') {
    const nClusters = parseInt(document.getElementById('d02-n-clusters').value) || 0;
    const decision = parseInt(document.getElementById('d02-decision').value);
    payload = { ceo_decision: decision, n_variable_clusters: nClusters };
  } else if (step === 'D0.3') {
    const overrides = document.getElementById('d03-overrides').value.trim();
    payload = { company_overrides: overrides || null };
  } else if (step === 'D0.4') {
    const lines = document.getElementById('d04-clusters').value.trim().split('\n').filter(l => l.trim());
    const clusters = lines.map(l => {
      const [id, prio] = l.split(',').map(s => s.trim());
      return { id: id || '', priority_at_genesis: parseInt(prio) || 1 };
    }).filter(c => c.id);
    if (!clusters.length) { showResult('result-d04', '❌ Cần ít nhất 1 cluster', true); return; }
    payload = { variable_clusters: clusters };
  } else if (step === 'D0.5') {
    payload = { confirmed: true };
  }

  try {
    const res = await fetch('/api/v1/genesis/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id, step, payload }),
    });
    const data = await res.json();
    const resultId = 'result-' + step.toLowerCase().replace('.', '');

    if (!res.ok) {
      const msg = data.detail?.message || data.detail?.error || JSON.stringify(data.detail);
      showResult(resultId, `❌ ${msg}`, true);
      return;
    }

    if (data.completed) {
      showCompletedView(data.data);
      return;
    }

    showResult(resultId, `✅ ${data.prompt || 'Bước hoàn tất'}`, false);
    setProgress(_PROGRESS[data.next_step] || 0);

    // Post-step UI updates
    if (step === 'D0.1' && data.data) {
      const doc = data.data.strategy_doc || '';
      // pre-fill D0.2 recommendation hint
      const el = document.getElementById('d02-recommendation');
      if (el) el.textContent = 'Nhập số cluster dự kiến để nhận đề xuất CEO Agent.';
    }
    if (step === 'D0.2' && data.data) {
      const rec = data.data.recommendation;
      const el = document.getElementById('d02-recommendation');
      if (el) el.textContent = rec ? '📊 Đề xuất: Nên có CEO Agent (≥ ngưỡng cluster)' : '📊 Đề xuất: Không cần CEO Agent (< ngưỡng cluster)';
    }

    if (data.next_step) showPanel(data.next_step);
  } catch (e) {
    const resultId = 'result-' + step.toLowerCase().replace('.', '');
    showResult(resultId, `❌ Lỗi kết nối: ${e.message}`, true);
  }
}

const _PROGRESS = { 'D0.1': 20, 'D0.2': 40, 'D0.3': 60, 'D0.4': 80, 'D0.5': 100 };

function showCompletedView(data) {
  document.getElementById('wizard-view').style.display = 'none';
  document.getElementById('completed-view').style.display = '';

  const queueEl = document.getElementById('queue-list');
  if (queueEl && data && data.onboarding_queue) {
    queueEl.innerHTML = data.onboarding_queue.map((item, i) =>
      `<li>${i + 1}. <strong>${item.agent}</strong> — priority: ${item.priority} (${item.d7_status})</li>`
    ).join('');
  }
}

async function loadStatus() {
  const company_id = getCompanyId();
  try {
    const res = await fetch(`/api/v1/genesis/status?company_id=${encodeURIComponent(company_id)}`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.status === 'completed') {
      showCompletedView({ onboarding_queue: [] });
      return;
    }

    if (data.status === 'in_progress' && data.step_current) {
      const step = DB_TO_STEP[data.step_current] || 'D0.1';
      showPanel(step);
      setProgress(data.progress_pct || 0);
    } else {
      showPanel('D0.1');
    }
  } catch (e) {
    showPanel('D0.1');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStatus();

  // Tab click navigation (only allow going back to completed steps)
  STEPS.forEach(step => {
    const tab = document.getElementById(STEP_TAB[step]);
    if (tab) {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('done')) showPanel(step);
      });
    }
  });
});
