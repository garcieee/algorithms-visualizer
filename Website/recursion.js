'use strict';

const RecModule = (() => {

  let isRunning = false;

  /* ── Helpers ─────────────────────────────────────────────────── */
  function pad(depth) { return '\u00a0\u00a0\u00a0\u00a0'.repeat(depth); }

  function getTrace() {
    const traceEl = _el('rec-trace');
    if (!traceEl) return null;
    return traceEl;
  }

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
    State.totalSteps = n + 2;
    await appendLine(`<span class="c-fn">factorial(${n})</span>`);
    for (let i = n; i > 1; i--) {
      if (State.cancel) return;
      await appendLine(`<span class="c-op">-&gt; ${i} * </span><span class="c-fn">factorial(${i - 1})</span>`);
    }
    await appendLine(`<span class="c-base">-&gt; base case: return 1</span>`);
    let result = 1; for (let i = 2; i <= n; i++) result *= i;
    await appendLine(`<span class="c-result">Result = ${result.toLocaleString()}</span>`);
  }

  /* ── Fibonacci ───────────────────────────────────────────────── */
  async function fibonacci(n, depth, memo, useMemo) {
    if (State.cancel) return;
    if (useMemo && memo.has(n)) {
      await appendLine(`${pad(depth)}<span class="c-fn">fibonacci(${n})</span> <span class="c-cache">  [cache hit = ${memo.get(n)}]</span>`);
      return memo.get(n);
    }
    await appendLine(`${pad(depth)}<span class="c-fn">fibonacci(${n})</span>`);
    if (n <= 1) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">-&gt; base case: return ${n}</span>`);
      if (useMemo) memo.set(n, n);
      return n;
    }
    const l = await fibonacci(n - 1, depth + 1, memo, useMemo);
    const r = await fibonacci(n - 2, depth + 1, memo, useMemo);
    const result = l + r;
    if (useMemo) memo.set(n, result);
    await appendLine(`${pad(depth)}<span class="c-op">-&gt; fib(${n-1}) + fib(${n-2}) = ${l} + ${r} = </span><span class="c-ret">${result}</span>`);
    return result;
  }

  /* ── Hanoi ───────────────────────────────────────────────────── */
  async function hanoi(n, src, aux, dst, depth) {
    if (State.cancel) return;
    if (n <= 3) {
      await appendLine(`${pad(depth)}<span class="c-fn">hanoi(${n}, ${src} &rarr; ${dst})</span>`);
    }
    if (n === 1) {
      await appendLine(`${pad(depth + 1)}<span class="c-move">Move disk 1 from ${src} to ${dst}</span>`);
      return;
    }
    await hanoi(n - 1, src, dst, aux, depth + 1);
    await appendLine(`${pad(depth)}<span class="c-move">Move disk ${n} from ${src} to ${dst}</span>`);
    await hanoi(n - 1, aux, src, dst, depth + 1);
  }

  /* ── GCD ─────────────────────────────────────────────────────── */
  async function gcd(a, b, depth) {
    if (State.cancel) return;
    await appendLine(`${pad(depth)}<span class="c-fn">gcd(${a}, ${b})</span>`);
    if (b === 0) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">-&gt; base case: return ${a}</span>`);
      await appendLine(`<span class="c-result">Result = ${a}</span>`);
      return a;
    }
    const result = await gcd(b, a % b, depth + 1);
    await appendLine(`${pad(depth)}<span class="c-op">-&gt; gcd(${b}, ${a % b}) = </span><span class="c-ret">${result}</span>`);
    return result;
  }

  /* ── Binary Search ───────────────────────────────────────────── */
  async function bsearch(arr, target, lo, hi, depth) {
    if (State.cancel) return -1;
    await appendLine(`${pad(depth)}<span class="c-fn">bsearch([${lo}..${hi}], target=${target})</span>`);
    if (lo > hi) {
      await appendLine(`${pad(depth + 1)}<span class="c-base">-&gt; not found</span>`);
      return -1;
    }
    const mid = (lo + hi) >> 1;
    await appendLine(`${pad(depth + 1)}<span class="c-op">-&gt; mid=${mid}, arr[${mid}]=${arr[mid]}</span>`);
    if (arr[mid] === target) {
      await appendLine(`${pad(depth + 1)}<span class="c-ret">-&gt; Found at index ${mid}</span>`);
      await appendLine(`<span class="c-result">Result = index ${mid}</span>`);
      return mid;
    }
    if (arr[mid] < target) return bsearch(arr, target, mid + 1, hi, depth + 1);
    return bsearch(arr, target, lo, mid - 1, depth + 1);
  }

  /* ── Run ─────────────────────────────────────────────────────── */
  async function run() {
    if (isRunning) {
      State.paused = !State.paused;
      setRunBtn(!State.paused);
      return;
    }

    const algo = State.algo;
    const n    = clamp(parseInt(_el('rec-n-input')?.value || '6'), 0, 20);
    const b    = parseInt(_el('rec-b-input')?.value || '18');

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
    setStatus(`Running ${algo}...`, 'running');

    const maxN = { factorial:12, fibonacci:9, fib_memo:15, hanoi:7, gcd:99, bsearch:20 };
    const safeN = Math.min(n, maxN[algo] || 12);

    if (algo === 'factorial') {
      await factorial(safeN);

    } else if (algo === 'fibonacci') {
      State.totalSteps = Math.pow(2, safeN);
      const result = await fibonacci(safeN, 0, new Map(), false);
      if (!State.cancel) await appendLine(`<span class="c-result">Result = ${result}</span>`);

    } else if (algo === 'fib_memo') {
      State.totalSteps = safeN;
      const result = await fibonacci(safeN, 0, new Map(), true);
      if (!State.cancel) await appendLine(`<span class="c-result">Result = ${result}</span>`);

    } else if (algo === 'hanoi') {
      State.totalSteps = Math.pow(2, safeN) - 1;
      if (safeN <= 4) {
        await appendLine(`<span class="c-fn">Tower of Hanoi (${safeN} disks, A &rarr; C)</span>`);
        await hanoi(safeN, 'A', 'B', 'C', 1);
      } else {
        // For larger n show moves directly
        await appendLine(`<span class="c-fn">Tower of Hanoi (${safeN} disks)</span>`);
        const moves = getAllHanoiMoves(safeN);
        for (const m of moves) {
          if (State.cancel) break;
          while (State.paused && !State.cancel) await sleep(50);
          await appendLine(`<span class="c-move">${m}</span>`);
        }
        const expected = Math.pow(2, safeN) - 1;
        if (!State.cancel) await appendLine(`<span class="c-result">Total moves: ${moves.length} = 2^${safeN} - 1 = ${expected}</span>`);
      }

    } else if (algo === 'gcd') {
      State.totalSteps = Math.ceil(Math.log(Math.max(safeN, b)) / Math.log(1.618));
      await gcd(safeN, b, 0);

    } else if (algo === 'bsearch') {
      const arr2 = Array.from({ length: safeN * 2 }, (_, i) => i * 2);
      State.totalSteps = Math.ceil(Math.log2(arr2.length));
      await appendLine(`<span class="c-op">Array: [${arr2.join(', ')}]</span>`);
      await appendLine('');
      await bsearch(arr2, b, 0, arr2.length - 1, 0);
    }

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    isRunning       = false;
    State.running   = false;
    setRunBtn(false);
    updateMetrics();

    if (!State.cancel) {
      const msg = `Done. ${State.steps} lines traced.`;
      setStatus(msg, 'done');
      addLog(msg, 'done');
    }
  }

  function getAllHanoiMoves(n, src = 'A', aux = 'B', dst = 'C') {
    if (n === 1) return [`Move disk 1 from ${src} to ${dst}`];
    return [
      ...getAllHanoiMoves(n - 1, src, dst, aux),
      `Move disk ${n} from ${src} to ${dst}`,
      ...getAllHanoiMoves(n - 1, aux, src, dst),
    ];
  }

  function reset() {
    State.cancel    = true;
    State.running   = false;
    State.paused    = false;
    isRunning       = false;
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
