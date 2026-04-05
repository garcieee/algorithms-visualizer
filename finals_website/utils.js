'use strict';

/* ================================================================
   utils.js — Shared utilities, global state, and UI helpers
   Used by all algorithm modules (sort, mst, recursion).
================================================================ */

/* ── Utilities ────────────────────────────────────────────────── */

/** Pauses execution for `ms` milliseconds (used for animation delays). */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Returns a random integer in the range [a, b] (inclusive). */
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/** Clamps value `v` to the range [lo, hi]. */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Formats a large number for compact display in metric cells.
 * e.g. 1500000 → "1.5M", 2300 → "2.3k", 42 → "42"
 */
function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toLocaleString();
}

/**
 * Generates a dataset of `n` integers for sorting benchmarks.
 * @param {number} n      - Number of elements
 * @param {string} type   - 'random' | 'sorted' | 'reversed' | 'nearly'
 * @returns {number[]}    - Array of integers in range [2, 100]
 */
function makeDataset(n, type = 'random') {
  n = Math.max(2, n);
  if (type === 'random')   return Array.from({ length: n }, () => rand(2, 100));
  if (type === 'sorted')   return Array.from({ length: n }, (_, i) => Math.round(2 + (i / (n - 1)) * 98));
  if (type === 'reversed') return Array.from({ length: n }, (_, i) => Math.round(100 - (i / (n - 1)) * 98));
  if (type === 'nearly') {
    // Start sorted, then introduce ~8% random swaps (best-case-adjacent input)
    const a = Array.from({ length: n }, (_, i) => Math.round(2 + (i / (n - 1)) * 98));
    const swaps = Math.max(1, Math.floor(n * 0.08));
    for (let k = 0; k < swaps; k++) {
      const i = rand(0, n - 1), j = rand(0, n - 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  return Array.from({ length: n }, () => rand(2, 100));
}

/* ── Global State ─────────────────────────────────────────────── */
/**
 * Shared application state accessed by all modules.
 * Modules read/write this object to coordinate animation flow.
 */
const State = {
  section:    'sort',
  algo:       'bubble',
  running:    false,
  paused:     false,
  cancel:     false,
  speed:      5,
  size:       60,
  dataset:    'random',
  comps:      0,
  swaps:      0,
  steps:      0,
  totalSteps: 0,
  startTime:  0,
  elapsedMs:  0,
  vizType:    'bar',  // New: visualization type
};

function resetStats() {
  State.comps      = 0;
  State.swaps      = 0;
  State.steps      = 0;
  State.totalSteps = 0;
  State.startTime  = 0;
  State.elapsedMs  = 0;
}

/**
 * Maps the speed slider value (1–10) to a millisecond delay.
 * Speed 1 = 600ms/step (very slow), Speed 10 = 0ms (instant).
 * @returns {number} Delay in milliseconds
 */
function speedDelay() {
  const map = { 1:600, 2:250, 3:120, 4:60, 5:28, 6:14, 7:6, 8:3, 9:1, 10:0 };
  return map[clamp(State.speed, 1, 10)] ?? 28;
}

/* ── Metrics UI ───────────────────────────────────────────────── */
function updateMetrics() {
  const ms = State.startTime
    ? (performance.now() - State.startTime).toFixed(1)
    : State.elapsedMs.toFixed(1);

  _setMetric('m-time',  ms);
  _setMetric('m-comps', fmtNum(State.comps));
  _setMetric('m-swaps', fmtNum(State.swaps));

  if (State.totalSteps > 0) {
    _setMetric('m-steps', `${State.steps}/${State.totalSteps}`);
    const pct = Math.min(100, Math.round(State.steps / State.totalSteps * 100));
    _el('progress-fill').style.width = pct + '%';
    _el('progress-pct').textContent  = pct + '%';
  } else {
    _setMetric('m-steps', String(State.steps));
    _el('progress-fill').style.width = '0%';
    _el('progress-pct').textContent  = '0%';
  }

  const cur = _el('sc-cur'), tot = _el('sc-tot');
  if (cur) cur.textContent = State.steps.toLocaleString();
  if (tot) tot.textContent = State.totalSteps > 0 ? State.totalSteps.toLocaleString() : '?';
}

function _setMetric(id, val) {
  const el = _el(id);
  if (!el) return;
  if (el.textContent !== val) {
    el.textContent = val;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 280);
  }
}

function _el(id) { return document.getElementById(id); }

/* ── Log ──────────────────────────────────────────────────────── */
let _logCount = 0;
const MAX_LOG = 300;

function addLog(text, type = 'info') {
  const body = _el('log-body');
  if (!body) return;
  if (_logCount++ > MAX_LOG) {
    const first = body.querySelector('.log-entry');
    if (first) first.remove();
  }
  const tags = { cmp:'CMP', swap:'SWP', add:'ADD', skip:'SKP', done:'END', info:'INF' };
  const div  = document.createElement('div');
  div.className = `log-entry log-${type}`;
  div.innerHTML = `<span class="log-tag">${tags[type] || 'INF'}</span><span>${escHtml(text)}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function clearLog() {
  const b = _el('log-body');
  if (b) b.innerHTML = '';
  _logCount = 0;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Status bar ───────────────────────────────────────────────── */
function setStatus(msg, state = 'idle') {
  const dot = _el('sb-dot'), txt = _el('sb-msg');
  if (txt) txt.textContent = msg;
  if (dot) {
    dot.className = 'sb-dot';
    dot.classList.add(state);
  }
}

/* ── Run button ───────────────────────────────────────────────── */
function setRunBtn(running) {
  const btn   = _el('btn-run');
  const icon  = _el('run-icon');
  const label = _el('run-label');
  if (!btn) return;
  if (running) {
    btn.classList.add('paused');
    if (label) label.textContent = 'Pause';
    if (icon)  icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    btn.classList.remove('paused');
    if (label) label.textContent = 'Run';
    if (icon)  icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

/* ── Complexity table ─────────────────────────────────────────── */
const CX_DATA = {
  bubble:    { best:'O(n)',       avg:'O(n²)',       worst:'O(n²)',       space:'O(1)',     stable:'Yes' },
  selection: { best:'O(n²)',      avg:'O(n²)',        worst:'O(n²)',       space:'O(1)',     stable:'No'  },
  insertion: { best:'O(n)',       avg:'O(n²)',        worst:'O(n²)',       space:'O(1)',     stable:'Yes' },
  merge:     { best:'O(n log n)', avg:'O(n log n)',   worst:'O(n log n)', space:'O(n)',     stable:'Yes' },
  quick:     { best:'O(n log n)', avg:'O(n log n)',   worst:'O(n²)',      space:'O(log n)', stable:'No'  },
  rquick:    { best:'O(n log n)', avg:'O(n log n)',   worst:'O(n²)*',     space:'O(log n)', stable:'No'  },
  counting:  { best:'O(n+k)',     avg:'O(n+k)',       worst:'O(n+k)',     space:'O(k)',     stable:'Yes' },
  radix:     { best:'O(nk)',      avg:'O(nk)',        worst:'O(nk)',      space:'O(n+k)',   stable:'Yes' },
  kruskal:   { best:'O(E log E)', avg:'O(E log E)',   worst:'O(E log E)', space:'O(V)',     stable:'-'   },
  prim:      { best:'O(E log V)', avg:'O(E log V)',   worst:'O(E log V)', space:'O(V+E)',   stable:'-'   },
  factorial: { best:'O(n)',       avg:'O(n)',         worst:'O(n)',        space:'O(n)',     stable:'-'   },
  fibonacci: { best:'O(2^n)',     avg:'O(2^n)',       worst:'O(2^n)',      space:'O(n)',     stable:'-'   },
  fib_memo:  { best:'O(n)',       avg:'O(n)',         worst:'O(n)',        space:'O(n)',     stable:'-'   },
  hanoi:     { best:'O(2^n)',     avg:'O(2^n)',       worst:'O(2^n)',      space:'O(n)',     stable:'-'   },
  gcd:       { best:'O(log n)',   avg:'O(log n)',     worst:'O(log n)',    space:'O(log n)', stable:'-'   },
  bsearch:   { best:'O(1)',       avg:'O(log n)',     worst:'O(log n)',    space:'O(log n)', stable:'-'   },
};

function updateComplexity(key) {
  const d = CX_DATA[key];
  if (!d) return;
  const colorFor = v => {
    if (!v || v === '-') return '';
    if (v.includes('1)') || v.includes('log n') || v.includes('nk') || v.includes('n+k') || v.includes('n log'))
      return 'cx-ok';
    if (v.includes('n²') || v.includes('2^n')) return 'cx-bad';
    if (v === 'O(n)') return 'cx-good';
    return 'cx-ok';
  };
  const set = (id, val, cls) => {
    const el = _el(id);
    if (!el) return;
    el.textContent  = val || '-';
    el.className    = cls || '';
  };
  set('cx-best',   d.best,   colorFor(d.best));
  set('cx-avg',    d.avg,    colorFor(d.avg));
  set('cx-worst',  d.worst,  colorFor(d.worst));
  set('cx-space',  d.space,  colorFor(d.space));
  set('cx-stable', d.stable, d.stable === 'Yes' ? 'cx-good' : d.stable === 'No' ? 'cx-slow' : '');
}

/* ── Sync input+range pairs ───────────────────────────────────── */
function syncPair(inputId, rangeId, onChange) {
  const inp = _el(inputId), rng = _el(rangeId);
  if (!inp || !rng) return;
  const apply = val => {
    const v = clamp(parseInt(val) || 0, parseInt(rng.min), parseInt(rng.max));
    inp.value = v; rng.value = v;
    if (onChange) onChange(v);
  };
  inp.addEventListener('input', () => apply(inp.value));
  rng.addEventListener('input', () => apply(rng.value));
}