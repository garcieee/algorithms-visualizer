/* ═══════════════════════════════════════════════════════════════════
   recursion.js — Recursive function simulation
   Animated call tree displayed in #rec-trace panel
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const RecModule = (() => {

  const REC_ALGOS = {
    factorial: { name: 'Factorial',           maxN: 12, hasB: false },
    fibonacci:  { name: 'Fibonacci (Naive)',   maxN: 9,  hasB: false },
    fib_memo:   { name: 'Fibonacci (Memo)',    maxN: 15, hasB: false },
    hanoi:      { name: 'Tower of Hanoi',      maxN: 7,  hasB: false },
    gcd:        { name: 'GCD',                 maxN: 60, hasB: true,  bLabel: 'b', bDefault: 18 },
    bsearch:    { name: 'Binary Search',       maxN: 12, hasB: true,  bLabel: 'target', bDefault: 8 },
  };

  let lines = [];
  let animRunning = false;

  function pad(d) { return '&nbsp;&nbsp;'.repeat(d); }

  /* ── TRACE BUILDERS ─────────────────────────────────────────────────── */

  // Exact spec format for factorial
  function buildFactorial(n) {
    const out = [];
    out.push({ html: `<span class="c-fn">factorial(${n})</span>`, type: '' });
    for (let i = n; i > 1; i--) {
      out.push({ html: `<span class="c-op">-&gt; ${i} * </span><span class="c-fn">factorial(${i-1})</span>`, type: '' });
    }
    out.push({ html: `<span class="c-base">-&gt; base case: return 1</span>`, type: '' });
    const result = factorial_val(n);
    out.push({ html: `<span class="c-result">Result = ${result.toLocaleString()}</span>`, type: 'done' });
    return out;
  }

  function factorial_val(n) {
    let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
  }

  // Fibonacci naive recursive trace
  function buildFib(n, depth, memo, useMemo, out) {
    if (useMemo && memo.has(n)) {
      out.push({ html: `${pad(depth)}<span class="c-fn">fibonacci(${n})</span> <span class="c-cache">← [cache hit] = ${memo.get(n)}</span>`, type: '' });
      return memo.get(n);
    }
    out.push({ html: `${pad(depth)}<span class="c-fn">fibonacci(${n})</span>`, type: '' });
    if (n <= 1) {
      out.push({ html: `${pad(depth + 1)}<span class="c-base">-&gt; base case: return ${n}</span>`, type: '' });
      if (useMemo) memo.set(n, n);
      return n;
    }
    const l = buildFib(n - 1, depth + 1, memo, useMemo, out);
    const r = buildFib(n - 2, depth + 1, memo, useMemo, out);
    const result = l + r;
    if (useMemo) memo.set(n, result);
    out.push({ html: `${pad(depth)}<span class="c-op">-&gt; fib(${n-1}) + fib(${n-2}) = ${l} + ${r} = </span><span class="c-ret">${result}</span>`, type: '' });
    return result;
  }

  // Hanoi — exact spec format
  function buildHanoi(n, src, aux, dst, depth, out) {
    out.push({ html: `${pad(depth)}<span class="c-fn">hanoi(${n}, ${src}&rarr;${dst} via ${aux})</span>`, type: '' });
    if (n === 1) {
      out.push({ html: `${pad(depth + 1)}<span class="c-move">Move disk 1 from ${src} to ${dst}</span>`, type: '' });
      return;
    }
    buildHanoi(n - 1, src, dst, aux, depth + 1, out);
    out.push({ html: `${pad(depth)}<span class="c-move">Move disk ${n} from ${src} to ${dst}</span>`, type: '' });
    buildHanoi(n - 1, aux, src, dst, depth + 1, out);
  }

  // GCD
  function buildGCD(a, b, depth, out) {
    out.push({ html: `${pad(depth)}<span class="c-fn">gcd(${a}, ${b})</span>`, type: '' });
    if (b === 0) {
      out.push({ html: `${pad(depth + 1)}<span class="c-base">-&gt; base case: return ${a}</span>`, type: '' });
      out.push({ html: `<span class="c-result">Result = ${a}</span>`, type: 'done' });
      return a;
    }
    const r = buildGCD(b, a % b, depth + 1, out);
    out.push({ html: `${pad(depth)}<span class="c-op">-&gt; gcd(${b}, ${a}%${b}=${a%b}) = </span><span class="c-ret">${r}</span>`, type: '' });
    return r;
  }

  // Binary search
  function buildBSearch(arr, target, lo, hi, depth, out) {
    out.push({ html: `${pad(depth)}<span class="c-fn">binary_search([${lo}..${hi}], target=${target})</span>`, type: '' });
    if (lo > hi) {
      out.push({ html: `${pad(depth + 1)}<span class="c-base">-&gt; not found</span>`, type: '' });
      return -1;
    }
    const mid = Math.floor((lo + hi) / 2);
    out.push({ html: `${pad(depth + 1)}<span class="c-op">-&gt; mid=${mid}, arr[${mid}]=${arr[mid]}</span>`, type: '' });
    if (arr[mid] === target) {
      out.push({ html: `${pad(depth + 1)}<span class="c-ret">-&gt; FOUND at index ${mid} ✓</span>`, type: '' });
      out.push({ html: `<span class="c-result">Result = index ${mid}</span>`, type: 'done' });
      return mid;
    }
    if (arr[mid] < target) return buildBSearch(arr, target, mid + 1, hi, depth + 1, out);
    return buildBSearch(arr, target, lo, mid - 1, depth + 1, out);
  }

  /* ── ANIMATE ─────────────────────────────────────────────────────────── */
  async function animate(lineList) {
    const trace = document.getElementById('rec-trace');
    if (!trace) return;
    trace.innerHTML = '';
    animRunning = true;

    State.totalSteps = lineList.length;

    for (let i = 0; i < lineList.length; i++) {
      if (State.cancel) { animRunning = false; return; }
      while (State.paused && !State.cancel) await sleep(50);

      const div = document.createElement('div');
      div.className = 'rec-line';
      div.innerHTML = lineList[i].html;
      trace.appendChild(div);
      trace.scrollTop = trace.scrollHeight;

      State.steps++;
      State.comps++;
      updateMetrics();
      addLog(div.textContent.trim().replace(/\s+/g, ' '), lineList[i].type || 'compare');

      await sleep(speedDelay() * 3);
    }

    animRunning = false;
  }

  /* ── RUN ─────────────────────────────────────────────────────────────── */
  async function run() {
    if (animRunning) {
      State.paused = !State.paused;
      updatePlayBtn(!State.paused);
      return;
    }

    State.running = true;
    State.cancel  = false;
    State.paused  = false;
    resetStats();
    State.startTime = performance.now();
    clearLog();
    updatePlayBtn(true);

    const algo = State.algo;
    const n    = State.size;
    const meta = REC_ALGOS[algo];
    const safeN = Math.min(n, meta?.maxN ?? 10);

    const out = [];
    setStatus(`Running ${meta?.name || algo}(${safeN})…`, 'running');

    if (algo === 'factorial') {
      buildFactorial(safeN);
      // Build trace freshly
      const lines2 = [];
      lines2.push({ html: `<span class="c-fn">factorial(${safeN})</span>`, type: '' });
      for (let i = safeN; i > 1; i--) {
        lines2.push({ html: `<span class="c-op">-&gt; ${i} * </span><span class="c-fn">factorial(${i-1})</span>`, type: '' });
      }
      lines2.push({ html: `<span class="c-base">-&gt; base case: return 1</span>`, type: '' });
      lines2.push({ html: `<span class="c-result">Result = ${factorial_val(safeN).toLocaleString()}</span>`, type: 'done' });
      await animate(lines2);

    } else if (algo === 'fibonacci') {
      const out2 = [];
      buildFib(safeN, 0, new Map(), false, out2);
      await animate(out2);

    } else if (algo === 'fib_memo') {
      const out2 = [];
      buildFib(safeN, 0, new Map(), true, out2);
      out2.push({ html: `<span class="c-result">Result = ${fibVal(safeN)}</span>`, type: 'done' });
      await animate(out2);

    } else if (algo === 'hanoi') {
      const out2 = [];
      if (safeN <= 4) buildHanoi(safeN, 'A', 'B', 'C', 0, out2);
      else {
        // For larger n, just show the moves
        const moves = hanoiMoves(safeN);
        out2.push({ html: `<span class="c-fn">Tower of Hanoi (${safeN} disks)</span>`, type: '' });
        moves.forEach(m => out2.push({ html: `<span class="c-move">${m}</span>`, type: '' }));
        const expected = Math.pow(2, safeN) - 1;
        out2.push({ html: `<span class="c-result">Total moves: ${moves.length} = 2^${safeN} - 1 = ${expected}</span>`, type: 'done' });
      }
      await animate(out2);

    } else if (algo === 'gcd') {
      const bVal = parseInt(document.getElementById('rec-b-input')?.value || '18');
      const out2 = [];
      buildGCD(safeN, bVal, 0, out2);
      await animate(out2);

    } else if (algo === 'bsearch') {
      const arr2 = Array.from({length: safeN * 2}, (_, i) => i * 2);
      const target = parseInt(document.getElementById('rec-b-input')?.value || '8');
      const out2 = [];
      out2.push({ html: `<span class="c-op">Array: [${arr2.join(', ')}]</span>`, type: '' });
      out2.push({ html: '', type: '' });
      buildBSearch(arr2, target, 0, arr2.length - 1, 0, out2);
      await animate(out2);
    }

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    State.running = false;
    updatePlayBtn(false);
    updateMetrics();
    setStatus(`${meta?.name} complete`, 'done');
    addLog(`Done — ${State.comps} calls traced`, 'done');
  }

  function fibVal(n) { let a=0,b=1; for(let i=0;i<n;i++){[a,b]=[b,a+b];} return a; }
  function hanoiMoves(n, src='A', aux='B', dst='C') {
    if (n === 1) return [`Move disk 1 from ${src} to ${dst}`];
    return [
      ...hanoiMoves(n-1, src, dst, aux),
      `Move disk ${n} from ${src} to ${dst}`,
      ...hanoiMoves(n-1, aux, src, dst),
    ];
  }

  function reset() {
    State.cancel = true;
    State.running = false;
    State.paused  = false;
    animRunning = false;
    setTimeout(() => {
      State.cancel = false;
      const trace = document.getElementById('rec-trace');
      if (trace) trace.innerHTML = '<span style="color:#475569;font-family:var(--mono)">Choose a function and click ▶ Run…</span>';
      resetStats(); updateMetrics();
      clearLog();
      updatePlayBtn(false);
      setStatus('Ready');
    }, 50);
  }

  function init() {
    const trace = document.getElementById('rec-trace');
    if (trace) trace.innerHTML = '<span style="color:#475569;font-family:var(--mono)">Choose a function and click ▶ Run…</span>';
  }

  return { init, run, reset };
})();
