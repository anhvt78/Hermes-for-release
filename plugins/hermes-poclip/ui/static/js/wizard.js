/* Onboarding Wizard D7 — TD-05 */

let currentStep = 1;

function profileId() {
  return document.getElementById('profileId').value.trim();
}

function showStep(n) {
  currentStep = n;
  for (let i = 1; i <= 6; i++) {
    const panel = document.getElementById('panel' + i);
    if (panel) panel.style.display = i === n ? '' : 'none';
    const tab = document.getElementById('tab' + i);
    if (tab) {
      tab.classList.remove('active');
      if (i === n) tab.classList.add('active');
    }
  }
}

function updateTabStates(stateData) {
  if (!stateData) return;
  const completed = stateData.wizard_step_completed || 0;
  const retired = stateData.lifecycle_stage === 'retired';
  for (let i = 1; i <= 6; i++) {
    const tab = document.getElementById('tab' + i);
    if (!tab) continue;
    tab.classList.remove('done', 'denied', 'active');
    if (retired) {
      tab.classList.add('denied');
    } else if (i <= completed) {
      tab.classList.add('done');
    } else if (i === currentStep) {
      tab.classList.add('active');
    }
  }
}

async function loadState() {
  const pid = profileId();
  if (!pid) { alert('Nhập Profile ID trước'); return; }
  try {
    const resp = await fetch('/api/v1/wizard/' + encodeURIComponent(pid) + '/state');
    const data = await resp.json();
    const bar = document.getElementById('stateBar');
    bar.style.display = '';
    if (resp.ok) {
      bar.innerHTML =
        '<strong>Profile:</strong> ' + pid +
        ' &nbsp;|&nbsp; <strong>Bước đã xong:</strong> ' + (data.wizard_step_completed || 0) +
        ' &nbsp;|&nbsp; <strong>Lifecycle:</strong> <code>' + (data.lifecycle_stage || 'design') + '</code>' +
        (data.next_step ? ' &nbsp;|&nbsp; <strong>Bước tiếp theo:</strong> ' + data.next_step : ' &nbsp;|&nbsp; ✅ Hoàn tất') +
        (data.blocked_by ? ' &nbsp;|&nbsp; <span style="color:#ef4444">Chặn: ' + data.blocked_by + '</span>' : '');
      updateTabStates(data);
      // Jump to next uncompleted step
      const next = Math.min((data.wizard_step_completed || 0) + 1, 6);
      showStep(next);
    } else {
      bar.innerHTML = '<span style="color:#ef4444">Lỗi: ' + JSON.stringify(data.detail || data) + '</span>';
    }
  } catch (e) {
    console.error(e);
    alert('Lỗi kết nối: ' + e.message);
  }
}

function showResult(stepNum, data, isError) {
  const el = document.getElementById('result' + stepNum);
  el.style.display = '';
  el.className = 'wiz-result ' + (isError ? 'error' : 'success');
  el.textContent = JSON.stringify(data, null, 2);
}

async function runStep(n) {
  const pid = profileId();
  if (!pid) { alert('Nhập Profile ID trước'); return; }

  let body = {};

  if (n === 1) {
    body = {
      manager_id: document.getElementById('s1_manager_id').value.trim(),
      org_unit: document.getElementById('s1_org_unit').value.trim(),
      base_model: document.getElementById('s1_base_model').value.trim(),
    };
  } else if (n === 2) {
    body = {
      policy: {
        amount_usd: parseFloat(document.getElementById('s2_amount').value) || 0,
        window: document.getElementById('s2_window').value,
        soft_limit_pct: parseFloat(document.getElementById('s2_soft').value) || 70,
        hard_limit_pct: parseFloat(document.getElementById('s2_hard').value) || 100,
      }
    };
  } else if (n === 3) {
    let policies = [];
    const raw = document.getElementById('s3_policies').value.trim();
    if (raw) {
      try { policies = JSON.parse(raw); } catch(e) { alert('JSON không hợp lệ: ' + e.message); return; }
    }
    body = { policies };
  } else if (n === 4) {
    let grants = [];
    const gRaw = document.getElementById('s4_grants').value.trim();
    if (gRaw) {
      try { grants = JSON.parse(gRaw); } catch(e) { alert('JSON grants không hợp lệ: ' + e.message); return; }
    }
    body = {
      sandbox: {
        sandbox_mode: document.getElementById('s4_mode').value,
        backend: document.getElementById('s4_backend').value,
        workspace_access: document.getElementById('s4_workspace').value,
      },
      grants,
    };
  } else if (n === 5) {
    let test_case_ids = [];
    const tcRaw = document.getElementById('s5_test_cases').value.trim();
    if (tcRaw) {
      try { test_case_ids = JSON.parse(tcRaw); } catch(e) { alert('JSON test cases không hợp lệ: ' + e.message); return; }
    }
    let results = null;
    const rRaw = document.getElementById('s5_results').value.trim();
    if (rRaw) {
      try { results = JSON.parse(rRaw); } catch(e) { alert('JSON results không hợp lệ: ' + e.message); return; }
    }
    body = { test_case_ids, results };
  } else if (n === 6) {
    body = {};
  }

  try {
    const resp = await fetch(
      '/api/v1/wizard/' + encodeURIComponent(pid) + '/step/' + n,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json();
    showResult(n, data, !resp.ok);
    if (resp.ok) {
      await loadState();
    }
  } catch (e) {
    console.error(e);
    showResult(n, { error: e.message }, true);
  }
}

// Init: show step 1 by default
showStep(1);
