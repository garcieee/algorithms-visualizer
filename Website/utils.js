/* ═══════════════════════════════════════════════════════════════════
   utils.js — Shared utilities
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Format a number nicely */
function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toLocaleString();
}

/** Generate a dataset */
function makeDataset(n, type = 'random') {
  if (type === 'random')   return Array.from({ length: n }, () => rand(1, 100));
  if (type === 'sorted')   return Array.from({ length: n }, (_, i) => Math.round((i + 1) / n * 100));
  if (type === 'reversed') return Array.from({ length: n }, (_, i) => Math.round((n - i) / n * 100));
  if (type === 'nearly')   {
    const a = Array.from({ length: n }, (_, i) => Math.round((i + 1) / n * 100));
    for (let k = 0; k < Math.max(1, Math.floor(n * 0.05)); k++) {
      const i = rand(0, n - 1), j = rand(0, n - 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  return Array.from({ length: n }, () => rand(1, 100));
}

/** Global state */
const State = {
  running: false,
  paused: false,
  cancel: false,
  section: 'sort',   // 'sort' | 'mst' | 'rec'
  algo: 'bubble',
  speed: 5,
  size: 60,
  dataset: 'random',
  comps: 0,
  swaps: 0,
  steps: 0,
  totalSteps: 0,
  startTime: 0,
  elapsedMs: 0,
};

function resetStats() {
  State.comps = 0;
  State.swaps = 0;
  State.steps = 0;
  State.totalSteps = 0;
  State.startTime = 0;
  State.elapsedMs = 0;
}

/** Speed → delay ms */
function speedDelay() {
  const s = State.speed;
  const map = { 1: 500, 2: 200, 3: 100, 4: 50, 5: 25, 6: 12, 7: 6, 8: 3, 9: 1, 10: 0 };
  return map[s] ?? 25;
}

/** Update metric cards */
function updateMetrics() {
  setMetric('m-comps', fmtNum(State.comps));
  setMetric('m-swaps', fmtNum(State.swaps));
  setMetric('m-steps', State.totalSteps > 0
    ? `${State.steps}/${State.totalSteps}` : fmtNum(State.steps));
  const ms = State.startTime
    ? ((performance.now() - State.startTime)).toFixed(1)
    : State.elapsedMs.toFixed(1);
  setMetric('m-time', ms + ' ms');

  const pct = State.totalSteps > 0
    ? (State.steps / State.totalSteps * 100) : 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const pLabel = document.getElementById('progress-pct');
  if (pLabel) pLabel.textContent = Math.round(pct) + '%';

  const badge = document.getElementById('step-badge');
  if (badge) badge.innerHTML =
    State.totalSteps > 0
      ? `Step <span>${State.steps.toLocaleString()}</span> / <span>${State.totalSteps.toLocaleString()}</span>`
      : `Steps <span>${State.steps.toLocaleString()}</span>`;
}

function setMetric(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== val) {
    el.textContent = val;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 300);
  }
}

/** Log panel */
let logCount = 0;
const MAX_LOG = 200;
function addLog(text, type = '') {
  const log = document.getElementById('log-output');
  if (!log) return;
  logCount++;
  if (logCount > MAX_LOG) {
    const old = log.querySelector('.log-line');
    if (old) old.remove();
  }
  const line = document.createElement('div');
  line.className = 'log-line ' + type;
  const tag = type === 'swap' ? '[SWP]'
            : type === 'done' ? '[END]'
            : type === 'add'  ? '[ADD]'
            : type === 'skip' ? '[SKP]'
            : '[CMP]';
  line.innerHTML = `<span class="log-tag">${tag}</span><span>${text}</span>`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}
function clearLog() {
  const log = document.getElementById('log-output');
  if (log) { log.innerHTML = ''; logCount = 0; }
}

/** Status bar */
function setStatus(msg, state = 'idle') {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-msg');
  if (dot) {
    dot.className = 'status-dot';
    if (state === 'running') dot.classList.add('running');
    if (state === 'done') dot.classList.add('active');
  }
  if (txt) txt.textContent = msg;
}

/** Play/Pause button */
function updatePlayBtn(running) {
  const btn = document.getElementById('run-btn');
  if (!btn) return;
  if (running) {
    btn.textContent = '⏸ Pause';
    btn.classList.add('running');
  } else {
    btn.textContent = '▶ Run';
    btn.classList.remove('running');
  }
}
