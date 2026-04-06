'use strict';

/* ================================================================
   recursion.js — Recursive Function Simulation Module
   Traces recursive calls with indented text output showing
   function calls, base cases, return values, and cache hits.

   Algorithms : Factorial, Fibonacci (naive + memoized),
                Tower of Hanoi, GCD (Euclidean), Binary Search
   Public API : { init, run, reset }
================================================================ */

const RecModule = (() => {

  let isRunning = false;

  /* ── Helpers ─────────────────────────────────────────────────── */

  // Returns `depth` levels of non-breaking-space indent for trace output.
  function pad(depth) { return '\u00a0\u00a0\u00a0\u00a0'.repeat(depth); }

  function getTrace() { return _el('rec-trace'); }

  // Appends one coloured line to the trace panel, waits for the animation
  // delay, and increments step/comparison counters.
  async function appendLine(html, cls = '') {
    if (State.cancel) return;
    while (State.paused && !State.cancel) await sleep(50);
    const trace = getTrace();
    if (!trace) return;
    const span = document.createElement('span');
    span.className = 'rec-line' + (cls ? ' ' + cls : '');
    span.innerHTML = html + '<br>';
    trace.appendChild(span);
    trace.scrollTop = trace.scrollHeight;
    State.steps++; State.comps++;
    updateMetrics();
    addLog(span.textContent.trim().replace(/\s+/g, ' '), 'info');
    await sleep(speedDelay() * 3);
  }

  /* ── Factorial ───────────────────────────────────────────────── */
  async function factorial(n) {
    State.totalSteps = n + 2; // n unwinding lines + base case + result
    await appendLine(`<span class="c-fn">factorial(${n})</span>`);
    for (let i = n; i > 1; i--) {
      if (State.cancel) return;
      await appendLine(`<span class="c-op">→ ${i} × </span><span class="c-fn">factorial(${i - 1})</span>`);
    }
    await appendLine(`<span class="c-base">→ base case: return 1</span>`);
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    await appendLine(`<span class="c-result">Result = ${result.toLocaleString()}</span>`);
  }

  /* ── Fibonacci ───────────────────────────────────────────────── */
  // Handles both naive (useMemo = false) and memoized (useMemo = true) variants.
  // The `memo` Map is shared across the entire recursive call tree so cache
  // hits are visible in the trace.
  async function fibonacci(n, depth, memo, useMemo) {
    if (State.cancel) return 0;

    if (useMemo && memo.has(n)) {
      await appendLine(`${pad(depth)}<span class="c-fn">fibonacci(${n})</span> <span class="c-cache">  [cache hit = ${memo.get(n)}]</span>`);
      return memo.get(n);
    }

    await appendLine(`${pad(depth)}<span class="c-fn">fibonacci(${n})</span>`);

    if (n <= 1) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">→ base case: return ${n}</span>`);
      if (useMemo) memo.set(n, n);
      return n;
    }

    const l = await fibonacci(n - 1, depth + 1, memo, useMemo);
    const r = await fibonacci(n - 2, depth + 1, memo, useMemo);
    const result = l + r;
    if (useMemo) memo.set(n, result);
    await appendLine(`${pad(depth)}<span class="c-op">→ fib(${n-1}) + fib(${n-2}) = ${l} + ${r} = </span><span class="c-ret">${result}</span>`);
    return result;
  }

  /* ── Tower of Hanoi ──────────────────────────────────────────── */
  // Only prints call headers for small subproblems (n ≤ 3) to keep the
  // output readable — larger sub-trees only show the move lines.
  async function hanoi(n, src, aux, dst, depth) {
    if (State.cancel) return;
    if (n <= 3) {
      await appendLine(`${pad(depth)}<span class="c-fn">hanoi(${n}, ${src} → ${dst})</span>`);
    }
    if (n === 1) {
      await appendLine(`${pad(depth + 1)}<span class="c-move">Move disk 1 from ${src} to ${dst}</span>`);
      return;
    }
    await hanoi(n - 1, src, dst, aux, depth + 1);
    await appendLine(`${pad(depth)}<span class="c-move">Move disk ${n} from ${src} to ${dst}</span>`);
    await hanoi(n - 1, aux, src, dst, depth + 1);
  }

  // Pre-computes all 2ⁿ−1 move strings without animation.
  // Used for n > 4 where the animated recursive version would be too slow.
  function getAllHanoiMoves(n, src = 'A', aux = 'B', dst = 'C') {
    if (n === 1) return [`Move disk 1 from ${src} to ${dst}`];
    return [
      ...getAllHanoiMoves(n - 1, src, dst, aux),
      `Move disk ${n} from ${src} to ${dst}`,
      ...getAllHanoiMoves(n - 1, aux, src, dst),
    ];
  }

  /* ── GCD (Euclidean) ─────────────────────────────────────────── */
  async function gcd(a, b, depth) {
    if (State.cancel) return 0;
    await appendLine(`${pad(depth)}<span class="c-fn">gcd(${a}, ${b})</span>`);
    if (b === 0) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">→ base case: return ${a}</span>`);
      await appendLine(`<span class="c-result">Result = ${a}</span>`);
      return a;
    }
    const result = await gcd(b, a % b, depth + 1);
    await appendLine(`${pad(depth)}<span class="c-op">→ gcd(${b}, ${a % b}) = </span><span class="c-ret">${result}</span>`);
    return result;
  }

  /* ── Binary Search ───────────────────────────────────────────── */
  // BUG FIX: recursive branches must use `await` — without it, the function
  // returns a Promise object (not the resolved index) to the caller, which
  // causes the result line to show "[object Promise]" instead of the index.
  async function bsearch(arr, target, lo, hi, depth) {
    if (State.cancel) return -1;
    await appendLine(`${pad(depth)}<span class="c-fn">bsearch([${lo}..${hi}], target=${target})</span>`);
    if (lo > hi) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">→ not found</span>`);
      return -1;
    }
    const mid = (lo + hi) >> 1;
    await appendLine(`${pad(depth + 1)}<span class="c-op">→ mid=${mid}, arr[${mid}]=${arr[mid]}</span>`);
    if (arr[mid] === target) {
      await appendLine(`${pad(depth + 1)}<span class="c-ret">→ Found at index ${mid}</span>`);
      await appendLine(`<span class="c-result">Result = index ${mid}</span>`);
      return mid;
    }
    // Both branches must await so return values propagate correctly up the call stack
    if (arr[mid] < target) return await bsearch(arr, target, mid + 1, hi,      depth + 1);
    else                   return await bsearch(arr, target, lo,      mid - 1, depth + 1);
  }

  /* ── Run ─────────────────────────────────────────────────────── */
  async function run() {
    // If already running, toggle pause/resume
    if (isRunning) {
      State.paused = !State.paused;
      setRunBtn(!State.paused);
      return;
    }

    const algo  = State.algo;
    const n     = clamp(parseInt(_el('rec-n-input')?.value  || '6'),  0, 20);
    const b     = parseInt(_el('rec-b-input')?.value || '18');
    const trace = getTrace();
    if (trace) trace.innerHTML = '';

    isRunning       = true;
    State.running   = true;
    State.cancel    = false;
    State.paused    = false;
    resetStats();
    State.startTime = performance.now();
    setRunBtn(true);
    clearLog();
    setStatus(`Running ${algo}…`, 'running');

    // Each algorithm caps its own n to prevent exponential blow-up
    const maxN  = { factorial:12, fibonacci:9, fib_memo:15, hanoi:7, gcd:99, bsearch:20 };
    const safeN = Math.min(n, maxN[algo] || 12);

    if (algo === 'factorial') {
      await factorial(safeN);

    } else if (algo === 'fibonacci') {
      // Naive: 2ⁿ calls (exponential)
      State.totalSteps = Math.pow(2, safeN);
      const result = await fibonacci(safeN, 0, new Map(), false);
      if (!State.cancel) await appendLine(`<span class="c-result">Result = ${result}</span>`);

    } else if (algo === 'fib_memo') {
      // Memoized: only n unique calls (linear)
      State.totalSteps = safeN;
      const result = await fibonacci(safeN, 0, new Map(), true);
      if (!State.cancel) await appendLine(`<span class="c-result">Result = ${result}</span>`);

    } else if (algo === 'hanoi') {
      if (safeN <= 4) {
        // Small n: use the fully animated recursive trace
        // Pre-computed line counts: n=1→3, n=2→7, n=3→15, n=4→30
        const hanoiLineCounts = [0, 3, 7, 15, 30];
        State.totalSteps = hanoiLineCounts[safeN] || (Math.pow(2, safeN) - 1);
        await appendLine(`<span class="c-fn">Tower of Hanoi (${safeN} disks, A → C)</span>`);
        await hanoi(safeN, 'A', 'B', 'C', 1);
      } else {
        // Large n: pre-generate all moves and stream them (avoids deep call stack)
        await appendLine(`<span class="c-fn">Tower of Hanoi (${safeN} disks)</span>`);
        const moves = getAllHanoiMoves(safeN);
        State.totalSteps = moves.length + 2; // moves + header + summary lines
        for (const m of moves) {
          if (State.cancel) break;
          while (State.paused && !State.cancel) await sleep(50);
          await appendLine(`<span class="c-move">${m}</span>`);
        }
        const expected = Math.pow(2, safeN) - 1;
        if (!State.cancel)
          await appendLine(`<span class="c-result">Total moves: ${moves.length} = 2^${safeN} − 1 = ${expected}</span>`);
      }

    } else if (algo === 'gcd') {
      // Depth bound by Fibonacci growth: steps ≈ log₁.₆₁₈(max(a,b))
      State.totalSteps = Math.ceil(Math.log(Math.max(safeN, b)) / Math.log(1.618));
      await gcd(safeN, b, 0);

    } else if (algo === 'bsearch') {
      // Array of safeN*2 even numbers; search for target b
      const arr2 = Array.from({ length: safeN * 2 }, (_, i) => i * 2);
      State.totalSteps = Math.ceil(Math.log2(arr2.length));
      await appendLine(`<span class="c-op">Array: [${arr2.join(', ')}]</span>`);
      await bsearch(arr2, b, 0, arr2.length - 1, 0);
    }

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    if (!State.cancel && State.totalSteps > 0) State.steps = State.totalSteps;
    isRunning     = false;
    State.running = false;
    setRunBtn(false);
    updateMetrics();

    if (!State.cancel) {
      const msg = `Done. ${State.steps} lines traced.`;
      setStatus(msg, 'done');
      addLog(msg, 'done');
    }
  }

  /* ── Reset ───────────────────────────────────────────────────── */
  function reset() {
    State.cancel  = true;
    State.running = false;
    State.paused  = false;
    isRunning     = false;
    setTimeout(() => {
      State.cancel = false;
      const trace = getTrace();
      if (trace) trace.innerHTML = '<span style="color:#9aa0b0">Select a recursive function and click Run.</span>';
      resetStats(); updateMetrics(); clearLog();
      setRunBtn(false);
      setStatus('Ready.');
    }, 50);
  }

  function init() {
    const trace = getTrace();
    if (trace) trace.innerHTML = '<span style="color:#9aa0b0">Select a recursive function and click Run.</span>';
  }

  return { init, run, reset };
})();
