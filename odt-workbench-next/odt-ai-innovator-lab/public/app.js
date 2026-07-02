const state = {
  contracts: [],
  selectedId: '',
  readiness: null,
  handoff: ''
};

const form = document.querySelector('#contractForm');
const picker = document.querySelector('#contractPicker');
const notice = document.querySelector('#notice');
const readinessSummary = document.querySelector('#readinessSummary');
const readinessChecks = document.querySelector('#readinessChecks');
const handoffOutput = document.querySelector('#handoffOutput');

function showNotice(message, tone = 'info') {
  notice.textContent = message;
  notice.dataset.tone = tone;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => {
    notice.textContent = '';
    notice.dataset.tone = 'info';
  }, 5000);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

function toLines(value) {
  return (value || []).join('\n');
}

function fromLines(value) {
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function selectedContract() {
  return state.contracts.find((contract) => contract.id === state.selectedId) || null;
}

function setField(name, value) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value || '';
}

function readField(name) {
  const field = form.elements.namedItem(name);
  return field ? field.value : '';
}

function renderPicker() {
  picker.replaceChildren(...state.contracts.map((contract) => {
    const option = document.createElement('option');
    option.value = contract.id;
    option.textContent = contract.projectName;
    return option;
  }));
  picker.value = state.selectedId;
}

function renderContract(contract) {
  if (!contract) return;
  setField('projectName', contract.projectName);
  setField('ownerTeam', contract.ownerTeam);
  setField('repoPath', contract.repoPath);
  setField('baseBranch', contract.baseBranch);
  setField('riskProfile', contract.riskProfile || 'medium');
  setField('installCommand', contract.installCommand);
  setField('buildCommand', contract.buildCommand);
  setField('testCommand', contract.testCommand);
  setField('runUiCommand', contract.runUiCommand);
  setField('runApiCommand', contract.runApiCommand);
  setField('deployCommand', contract.deployCommand);
  setField('knownIssues', toLines(contract.knownIssues));
  setField('blockedCommands', toLines(contract.blockedCommands));
  setField('approvalNotes', toLines(contract.approvalNotes));
  setField('evidenceNotes', toLines(contract.evidenceNotes));
}

function contractFromForm() {
  return {
    id: state.selectedId,
    projectName: readField('projectName'),
    ownerTeam: readField('ownerTeam'),
    repoPath: readField('repoPath'),
    baseBranch: readField('baseBranch'),
    riskProfile: readField('riskProfile'),
    installCommand: readField('installCommand'),
    buildCommand: readField('buildCommand'),
    testCommand: readField('testCommand'),
    runUiCommand: readField('runUiCommand'),
    runApiCommand: readField('runApiCommand'),
    deployCommand: readField('deployCommand'),
    knownIssues: fromLines(readField('knownIssues')),
    blockedCommands: fromLines(readField('blockedCommands')),
    approvalNotes: fromLines(readField('approvalNotes')),
    evidenceNotes: fromLines(readField('evidenceNotes'))
  };
}

function badge(status) {
  const safeStatus = escapeHtml(status);
  return `<span class="status-badge" data-status="${safeStatus}">${safeStatus.replace(/_/g, ' ')}</span>`;
}

function renderReadiness(readiness) {
  state.readiness = readiness;
  if (!readiness) {
    readinessSummary.innerHTML = '<div class="empty-state">Run readiness to inspect this contract.</div>';
    readinessChecks.innerHTML = '';
    return;
  }
  const readinessStatus = escapeHtml(readiness.status);
  readinessSummary.innerHTML = `
    <div class="score-orb" data-status="${readinessStatus}">
      <strong>${escapeHtml(readiness.score)}%</strong>
      <span>${readinessStatus.replace(/_/g, ' ')}</span>
    </div>
    <div>
      <h4>${readiness.status === 'ready' ? 'Ready for governed handoff' : 'Needs attention before trusted automation'}</h4>
      <p>Generated ${escapeHtml(new Date(readiness.generatedAt).toLocaleString())} from read-only checks.</p>
    </div>
  `;
  readinessChecks.innerHTML = readiness.checks.map((item) => `
    <article class="check-card" data-status="${escapeHtml(item.status)}">
      <div>
        ${badge(item.status)}
        <h4>${escapeHtml(item.label)}</h4>
      </div>
      <p>${escapeHtml(item.detail)}</p>
      ${item.remediation ? `<small>${escapeHtml(item.remediation)}</small>` : ''}
    </article>
  `).join('');
}

async function loadContracts() {
  const payload = await api('/api/contracts');
  state.contracts = payload.contracts || [];
  state.selectedId = state.selectedId || state.contracts[0]?.id || '';
  renderPicker();
  renderContract(selectedContract());
  renderReadiness(null);
}

async function saveContract(event) {
  event.preventDefault();
  const payload = await api('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(contractFromForm())
  });
  const index = state.contracts.findIndex((item) => item.id === payload.contract.id);
  if (index >= 0) state.contracts[index] = payload.contract;
  else state.contracts.unshift(payload.contract);
  state.selectedId = payload.contract.id;
  renderPicker();
  renderContract(payload.contract);
  showNotice('Project contract saved. Readiness can now be refreshed.', 'success');
}

async function runReadiness() {
  if (!state.selectedId) return;
  const payload = await api(`/api/contracts/${encodeURIComponent(state.selectedId)}/readiness`, { method: 'POST' });
  renderReadiness(payload.readiness);
  showNotice('Readiness checks completed.', payload.readiness.status === 'ready' ? 'success' : 'warning');
}

async function generateHandoff() {
  if (!state.selectedId) return;
  const payload = await api(`/api/contracts/${encodeURIComponent(state.selectedId)}/handoff`, { method: 'POST' });
  state.handoff = payload.handoff;
  handoffOutput.textContent = payload.handoff;
  renderReadiness(payload.readiness);
  showNotice('Agent handoff generated from the selected contract.', 'success');
}

async function copyHandoff() {
  const text = state.handoff || handoffOutput.textContent || '';
  if (!text.trim()) {
    showNotice('No handoff text to copy yet.', 'warning');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showNotice('Handoff copied to clipboard.', 'success');
  } catch {
    showNotice('Clipboard access was blocked. Select the handoff text manually.', 'warning');
  }
}

function newContract() {
  state.selectedId = '';
  form.reset();
  setField('projectName', 'New Project Contract');
  setField('baseBranch', 'main');
  setField('riskProfile', 'medium');
  setField('blockedCommands', 'git reset --hard\nrm -rf\ngit checkout -- .');
  setField('approvalNotes', 'Writes, dependency installs, PR creation, and deployment require explicit human approval.');
  renderReadiness(null);
  handoffOutput.textContent = 'Save the new contract, then generate a handoff.';
}

picker.addEventListener('change', () => {
  state.selectedId = picker.value;
  renderContract(selectedContract());
  renderReadiness(null);
  handoffOutput.textContent = 'Generate a handoff after selecting a contract.';
});
form.addEventListener('submit', saveContract);
document.querySelector('#newContractButton').addEventListener('click', newContract);
document.querySelector('#runReadinessButton').addEventListener('click', runReadiness);
document.querySelector('#generateHandoffButton').addEventListener('click', generateHandoff);
document.querySelector('#copyHandoffButton').addEventListener('click', copyHandoff);

loadContracts().catch((err) => showNotice(err.message, 'danger'));
