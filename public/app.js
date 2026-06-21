const form = document.getElementById('regexForm');
const regexInput = document.getElementById('regexInput');
const resetBtn = document.getElementById('resetBtn');
const messageBox = document.getElementById('message');
const svg = document.getElementById('dfaSvg');
const tableBody = document.querySelector('#transitionTable tbody');
const historyBody = document.querySelector('#historyTable tbody');
const loadHistoryBtn = document.getElementById('loadHistoryBtn');
const runStringBtn = document.getElementById('runStringBtn');
const testStringInput = document.getElementById('testString');
const simulationOutput = document.getElementById('simulationOutput');

let currentResult = null;
let currentPositions = new Map();
let simulationTimer = null;

function showMessage(text, type = 'info') {
  messageBox.textContent = text;
  messageBox.className = `message ${type === 'error' ? 'error' : ''}`;
}

function clearMessage() {
  messageBox.className = 'message hidden';
  messageBox.textContent = '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function convertRegex(regex) {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regex }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Unable to convert regex.');
  }
  return data;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  const regex = regexInput.value.trim();
  if (!regex) {
    showMessage('Please enter a regular expression first.', 'error');
    return;
  }

  form.querySelector('button[type="submit"]').disabled = true;
  form.querySelector('button[type="submit"]').textContent = 'Generating...';

  try {
    const data = await convertRegex(regex);
    currentResult = data.result;
    renderAll(data.result);
    showMessage(data.database.message, data.database.saved ? 'info' : 'info');
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    form.querySelector('button[type="submit"]').disabled = false;
    form.querySelector('button[type="submit"]').textContent = 'Generate DFA';
  }
});

resetBtn.addEventListener('click', () => {
  regexInput.value = '';
  currentResult = null;
  currentPositions.clear();
  clearMessage();
  renderEmpty();
});

document.querySelectorAll('[data-regex]').forEach((button) => {
  button.addEventListener('click', () => {
    regexInput.value = button.dataset.regex;
    form.requestSubmit();
  });
});

function renderAll(result) {
  renderStats(result);
  renderGraph(result);
  renderTransitionTable(result);
  renderExplanation(result);
  renderSamples(result);
  simulationOutput.textContent = 'Machine path will appear here.';
}

function renderStats(result) {
  document.getElementById('alphabetStat').textContent = result.alphabet.length ? `{ ${result.alphabet.join(', ')} }` : '{ ε }';
  document.getElementById('statesStat').textContent = result.states.length;
  document.getElementById('finalStat').textContent = result.states.filter(s => s.isFinal).map(s => s.name).join(', ') || 'None';
  document.getElementById('deadStat').textContent = result.states.some(s => s.isDead) ? 'Required' : 'Not Required';
}

function groupedTransitions(transitions) {
  const map = new Map();
  for (const t of transitions) {
    const key = `${t.from}->${t.to}`;
    if (!map.has(key)) map.set(key, { from: t.from, to: t.to, inputs: [] });
    map.get(key).inputs.push(t.input);
  }
  return [...map.values()].map(item => ({ ...item, label: item.inputs.join(', ') }));
}

function renderGraph(result) {
  const width = 980;
  const height = 540;
  const centerX = width / 2;
  const centerY = height / 2 + 8;
  const radiusX = Math.min(360, 120 + result.states.length * 26);
  const radiusY = 180;
  const nodeRadius = 33;
  currentPositions = new Map();

  result.states.forEach((state, index) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * index) / result.states.length;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    currentPositions.set(state.name, { x, y });
  });

  const groups = groupedTransitions(result.transitions);
  let markup = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" class="arrow-head"></path>
      </marker>
    </defs>
  `;

  const startState = result.states.find(s => s.isStart);
  if (startState) {
    const pos = currentPositions.get(startState.name);
    markup += `<path class="start-arrow" d="M ${pos.x - 92} ${pos.y} L ${pos.x - nodeRadius - 8} ${pos.y}" />`;
    markup += `<text class="edge-label" x="${pos.x - 112}" y="${pos.y - 12}">start</text>`;
  }

  groups.forEach((edge, index) => {
    const from = currentPositions.get(edge.from);
    const to = currentPositions.get(edge.to);
    if (!from || !to) return;

    if (edge.from === edge.to) {
      const loopTop = from.y - 75;
      markup += `<path id="edge-${index}" class="edge" d="M ${from.x - 16} ${from.y - nodeRadius + 6} C ${from.x - 78} ${loopTop}, ${from.x + 78} ${loopTop}, ${from.x + 16} ${from.y - nodeRadius + 6}" />`;
      markup += `<text class="edge-label" x="${from.x}" y="${loopTop - 6}" text-anchor="middle">${escapeHtml(edge.label)}</text>`;
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const unitX = dx / distance;
    const unitY = dy / distance;
    const startX = from.x + unitX * (nodeRadius + 5);
    const startY = from.y + unitY * (nodeRadius + 5);
    const endX = to.x - unitX * (nodeRadius + 8);
    const endY = to.y - unitY * (nodeRadius + 8);
    const curveOffset = edge.from < edge.to ? 36 : -36;
    const midX = (startX + endX) / 2 - unitY * curveOffset;
    const midY = (startY + endY) / 2 + unitX * curveOffset;

    markup += `<path id="edge-${index}" class="edge" d="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}" />`;
    markup += `<text class="edge-label" x="${midX}" y="${midY - 8}" text-anchor="middle">${escapeHtml(edge.label)}</text>`;
  });

  result.states.forEach((state) => {
    const pos = currentPositions.get(state.name);
    const classes = ['node-circle'];
    if (state.isFinal) classes.push('final');
    if (state.isDead) classes.push('dead');
    const smallLabel = state.isFinal ? 'FINAL' : state.isStart ? 'START' : state.isDead ? 'DEAD' : '';
    markup += `
      <g class="node" id="node-${state.name}">
        <circle class="${classes.join(' ')}" cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}"></circle>
        <text class="node-label" x="${pos.x}" y="${pos.y + 6}" text-anchor="middle">${escapeHtml(state.name)}</text>
        <text class="node-small" x="${pos.x}" y="${pos.y + 51}" text-anchor="middle">${smallLabel}</text>
      </g>
    `;
  });

  svg.innerHTML = markup;
}

function renderTransitionTable(result) {
  const rows = [];
  for (const state of result.states) {
    for (const symbol of result.alphabet) {
      const transition = result.transitions.find(t => t.from === state.name && t.input === symbol);
      rows.push(`
        <tr data-from="${escapeHtml(state.name)}" data-input="${escapeHtml(symbol)}">
          <td>${escapeHtml(state.name)}</td>
          <td>${state.isStart ? 'Start' : state.isFinal ? 'Final' : state.isDead ? 'Dead' : 'Normal'}</td>
          <td>${escapeHtml(symbol)}</td>
          <td>${escapeHtml(transition ? transition.to : '-')}</td>
        </tr>
      `);
    }
  }
  tableBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4">No alphabet transitions available.</td></tr>';
}

function renderExplanation(result) {
  const e = result.explanation;
  const notes = e.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('');
  document.getElementById('explanation').innerHTML = `
    <p><b>Input Regex:</b> <code>${escapeHtml(e.original)}</code></p>
    <p><b>Normalized Regex:</b> <code>${escapeHtml(e.normalized)}</code></p>
    <p><b>Regex with explicit concatenation:</b> <code>${escapeHtml(e.regexWithConcat)}</code></p>
    <p><b>Postfix Expression:</b> <code>${escapeHtml(e.postfix)}</code></p>
    <p><b>Method:</b> ${escapeHtml(e.method)}</p>
    <p><b>Start State:</b> ${escapeHtml(e.startState)} · <b>Final State(s):</b> ${escapeHtml(e.finalStates.join(', ') || 'None')} · <b>Dead State:</b> ${escapeHtml(e.deadState)}</p>
    <p><b>NFA States:</b> ${e.totalNfaStates} · <b>DFA States:</b> ${e.totalDfaStates}</p>
    <ul>${notes}</ul>
  `;
}

function renderSamples(result) {
  const accepted = result.samples.accepted.length ? result.samples.accepted : ['No accepted sample found up to length 4'];
  const rejected = result.samples.rejected.length ? result.samples.rejected : ['No rejected sample found up to length 4'];
  document.getElementById('acceptedSamples').innerHTML = accepted.map(s => `<li><code>${escapeHtml(s)}</code></li>`).join('');
  document.getElementById('rejectedSamples').innerHTML = rejected.map(s => `<li><code>${escapeHtml(s)}</code></li>`).join('');
}

function renderEmpty() {
  document.getElementById('alphabetStat').textContent = '-';
  document.getElementById('statesStat').textContent = '-';
  document.getElementById('finalStat').textContent = '-';
  document.getElementById('deadStat').textContent = '-';
  tableBody.innerHTML = '<tr><td colspan="4">No transition table generated yet.</td></tr>';
  document.getElementById('explanation').innerHTML = '<p>The explanation will appear after conversion.</p>';
  document.getElementById('acceptedSamples').innerHTML = '<li>-</li>';
  document.getElementById('rejectedSamples').innerHTML = '<li>-</li>';
  simulationOutput.textContent = 'Machine path will appear here.';
  svg.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" class="arrow-head"></path>
      </marker>
    </defs>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="empty-graph">Enter a regex and click Generate DFA.</text>
  `;
}

runStringBtn.addEventListener('click', () => {
  if (!currentResult) {
    simulationOutput.textContent = 'Generate a DFA first, then run a string.';
    return;
  }
  const input = testStringInput.value.trim();
  runSimulation(input);
});

function setActiveNode(stateName, statusClass = '') {
  document.querySelectorAll('.node').forEach(node => node.classList.remove('active-node', 'accepted', 'rejected'));
  const node = document.getElementById(`node-${stateName}`);
  if (node) {
    node.classList.add('active-node');
    if (statusClass) node.classList.add(statusClass);
  }
}

function setActiveRow(from, input) {
  document.querySelectorAll('#transitionTable tbody tr').forEach(row => row.classList.remove('active-row'));
  const row = document.querySelector(`#transitionTable tbody tr[data-from="${CSS.escape(from)}"][data-input="${CSS.escape(input)}"]`);
  if (row) row.classList.add('active-row');
}

function runSimulation(input) {
  if (simulationTimer) clearInterval(simulationTimer);
  document.querySelectorAll('#transitionTable tbody tr').forEach(row => row.classList.remove('active-row'));

  const dfa = currentResult;
  let current = dfa.states.find(s => s.isStart)?.name || 'q0';
  const path = [current];
  const steps = [];

  for (const char of input) {
    if (!dfa.alphabet.includes(char)) {
      simulationOutput.innerHTML = `Symbol <code>${escapeHtml(char)}</code> is not in alphabet { ${escapeHtml(dfa.alphabet.join(', '))} }. String rejected.`;
      setActiveNode(current, 'rejected');
      return;
    }
    const transition = dfa.transitions.find(t => t.from === current && t.input === char);
    if (!transition) {
      simulationOutput.innerHTML = `No transition from <code>${escapeHtml(current)}</code> on <code>${escapeHtml(char)}</code>. String rejected.`;
      setActiveNode(current, 'rejected');
      return;
    }
    steps.push({ from: current, input: char, to: transition.to });
    current = transition.to;
    path.push(current);
  }

  let index = 0;
  setActiveNode(path[0]);
  simulationOutput.innerHTML = `Start at <code>${escapeHtml(path[0])}</code>`;

  simulationTimer = setInterval(() => {
    if (index >= steps.length) {
      clearInterval(simulationTimer);
      const isAccepted = dfa.states.some(s => s.name === current && s.isFinal);
      setActiveNode(current, isAccepted ? 'accepted' : 'rejected');
      simulationOutput.innerHTML = `Path: ${path.map(p => `<code>${escapeHtml(p)}</code>`).join(' → ')}<br><b>${isAccepted ? 'Accepted' : 'Rejected'}</b> because machine stopped at <code>${escapeHtml(current)}</code>${isAccepted ? ', a final state.' : ', not a final state.'}`;
      return;
    }

    const step = steps[index];
    setActiveNode(step.to);
    setActiveRow(step.from, step.input);
    simulationOutput.innerHTML = `Reading <code>${escapeHtml(step.input)}</code>: <code>${escapeHtml(step.from)}</code> → <code>${escapeHtml(step.to)}</code>`;
    index++;
  }, 700);
}

loadHistoryBtn.addEventListener('click', async () => {
  historyBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
  try {
    const response = await fetch('/api/history');
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Unable to load history.');
    if (!data.database) {
      historyBody.innerHTML = '<tr><td colspan="7">DATABASE_URL is not configured, so SQL history is not available locally.</td></tr>';
      return;
    }
    if (!data.rows.length) {
      historyBody.innerHTML = '<tr><td colspan="7">No conversions saved yet.</td></tr>';
      return;
    }
    historyBody.innerHTML = data.rows.map(row => `
      <tr>
        <td>${row.id}</td>
        <td><code>${escapeHtml(row.regex_text)}</code></td>
        <td>${escapeHtml(row.alphabet)}</td>
        <td>${row.dfa_state_count}</td>
        <td>${row.transition_count}</td>
        <td>${escapeHtml(row.final_states)}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (error) {
    historyBody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  form.requestSubmit();
});
