/* ════════════════════════════════════════════════════════════════════
   recursion.js — Part 3: Recursive Function Simulation

   Data Structures used:
   - Call Stack  : modeled as an array of frames (LIFO)
   - Recursion Tree : each node = one function call with depth/result
   - Memoization : JavaScript Map for fibonacci cache
   ════════════════════════════════════════════════════════════════════ */

const RecModule = (() => {

  /* ── FUNCTION CONFIG ─────────────────────────────────────────────── */
  const FN_META = {
    factorial: { label: 'Factorial(n)',            hasB: false, maxN: 12, hanoiVis: false },
    fibonacci: { label: 'Fibonacci — Naive',       hasB: false, maxN: 9,  hanoiVis: false },
    fib_memo:  { label: 'Fibonacci — Memoized ⚡', hasB: false, maxN: 15, hanoiVis: false },
    hanoi:     { label: 'Tower of Hanoi',          hasB: false, maxN: 7,  hanoiVis: true  },
    gcd:       { label: 'GCD (Euclidean)',          hasB: true,  bLabel: 'b value', bDefault: 18, maxN: 60 },
    power:     { label: 'Fast Power (base^n)',      hasB: true,  bLabel: 'base',    bDefault: 2,  maxN: 15 },
    binary:    { label: 'Binary Search',            hasB: true,  bLabel: 'target',  bDefault: 8,  maxN: 12 },
  };

  /* ── CALL STACK MODEL ────────────────────────────────────────────── */
  /* The call stack is an array of { fnName, args, depth, result }
     We push when entering a call and pop when returning.
     This is displayed in the #rec-stack panel.               */
  let callStack = [];
  let totalCalls = 0, maxDepth = 0;
  let hanoiMoves = [];
  let lines = []; // trace lines (HTML strings)

  function push(frame) { callStack.push(frame); totalCalls++; maxDepth = Math.max(maxDepth, callStack.length); }
  function pop()       { return callStack.pop(); }

  function indent(d) { return '&nbsp;'.repeat(d * 4); }

  function addLine(html) { lines.push(html); }

  /* ══════════════════════════════════════════════════════════════════
     FACTORIAL — O(n) calls, O(n) depth
     Call stack grows to depth n, then unwinds multiplying results.
     ══════════════════════════════════════════════════════════════════ */
  function traceFactorial(n, depth = 0) {
    push({ fnName: `factorial(${n})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">factorial(${n})</span></span>`);
    if (n <= 1) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> base case: return 1</span></span>`);
      pop();
      return 1;
    }
    const sub    = traceFactorial(n - 1, depth + 1);
    const result = n * sub;
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> ${n} * factorial(${n-1}) = <span class="c-ret">${result}</span></span>`);
    pop();
    return result;
  }

  /* ══════════════════════════════════════════════════════════════════
     FIBONACCI — Naive: O(2^n) calls | Memoized: O(n) calls
     Naive shows exponential tree. Memoized shows cache hits.
     ══════════════════════════════════════════════════════════════════ */
  function traceFib(n, depth = 0, memo = null) {
    const useMemo = memo !== null;
    if (useMemo && memo.has(n)) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">fibonacci(${n})</span> <span class="c-cache">→ [cached] ${memo.get(n)}</span></span>`);
      return memo.get(n);
    }
    push({ fnName: `fibonacci(${n})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">fibonacci(${n})</span></span>`);
    if (n <= 1) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> base case: return ${n}</span></span>`);
      if (useMemo) memo.set(n, n);
      pop();
      return n;
    }
    const l = traceFib(n - 1, depth + 1, memo);
    const r = traceFib(n - 2, depth + 1, memo);
    const result = l + r;
    if (useMemo) memo.set(n, result);
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> fib(${n-1}) + fib(${n-2}) = ${l} + ${r} = <span class="c-ret">${result}</span></span>`);
    pop();
    return result;
  }

  /* ══════════════════════════════════════════════════════════════════
     TOWER OF HANOI — O(2^n - 1) moves
     Moves n disks from src to dst using aux as helper peg.
     Each disk move is one recursive base case.
     ══════════════════════════════════════════════════════════════════ */
  function traceHanoi(n, src = 'A', aux = 'B', dst = 'C', depth = 0) {
    push({ fnName: `hanoi(${n}, ${src}→${dst})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">hanoi(${n}, ${src}→${dst} via ${aux})</span></span>`);
    if (n === 1) {
      const move = `Move disk 1 from ${src} to ${dst}`;
      hanoiMoves.push({ disk: 1, from: src, to: dst });
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> ${move}</span></span>`);
      pop(); return;
    }
    traceHanoi(n - 1, src, dst, aux, depth + 1);
    const move = `Move disk ${n} from ${src} to ${dst}`;
    hanoiMoves.push({ disk: n, from: src, to: dst });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> <span class="c-ret">${move}</span></span>`);
    traceHanoi(n - 1, aux, src, dst, depth + 1);
    pop();
  }

  /* ══════════════════════════════════════════════════════════════════
     GCD — Euclidean algorithm: O(log min(a,b)) depth
     gcd(a, b) = gcd(b, a mod b) until b = 0
     ══════════════════════════════════════════════════════════════════ */
  function traceGCD(a, b, depth = 0) {
    push({ fnName: `gcd(${a}, ${b})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">gcd(${a}, ${b})</span></span>`);
    if (b === 0) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> base case: return ${a}</span></span>`);
      pop(); return a;
    }
    const result = traceGCD(b, a % b, depth + 1);
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> gcd(${b}, ${a}%${b}=${a%b}) = <span class="c-ret">${result}</span></span>`);
    pop(); return result;
  }

  /* ══════════════════════════════════════════════════════════════════
     FAST POWER — exponentiation by squaring: O(log n) depth
     base^exp = (base^(exp/2))^2  if exp is even
              = base * base^(exp-1) if exp is odd
     ══════════════════════════════════════════════════════════════════ */
  function tracePower(base, exp, depth = 0) {
    push({ fnName: `power(${base}, ${exp})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">power(${base}, ${exp})</span></span>`);
    if (exp === 0) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> base case: return 1</span></span>`);
      pop(); return 1;
    }
    if (exp % 2 === 0) {
      const half   = tracePower(base, exp / 2, depth + 1);
      const result = half * half;
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> (power(${base},${exp/2}))² = ${half}² = <span class="c-ret">${result}</span></span>`);
      pop(); return result;
    } else {
      const sub    = tracePower(base, exp - 1, depth + 1);
      const result = base * sub;
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-arrow">-></span> ${base} × power(${base},${exp-1}) = <span class="c-ret">${result}</span></span>`);
      pop(); return result;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     BINARY SEARCH — O(log n) depth
     Halves the search space each recursive call.
     ══════════════════════════════════════════════════════════════════ */
  function traceBinarySearch(arr, target, lo, hi, depth = 0) {
    push({ fnName: `bsearch([${lo}..${hi}], ${target})`, depth });
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth)}<span class="c-fn">binary_search([${lo}..${hi}], target=${target})</span></span>`);
    if (lo > hi) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-base">-> not found</span></span>`);
      pop(); return -1;
    }
    const mid = Math.floor((lo + hi) / 2);
    addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-arrow">-></span> mid=${mid}, arr[mid]=${arr[mid]}</span>`);
    if (arr[mid] === target) {
      addLine(`<span class="call-line" style="animation-delay:${lines.length*8}ms">${indent(depth + 1)}<span class="c-ret">-> FOUND at index ${mid} ✓</span></span>`);
      pop(); return mid;
    }
    const result = arr[mid] < target
      ? traceBinarySearch(arr, target, mid + 1, hi, depth + 1)
      : traceBinarySearch(arr, target, lo, mid - 1, depth + 1);
    pop(); return result;
  }

  /* ── ANIMATION RUNNER ────────────────────────────────────────────── */
  let animRunning = false;

  async function runRecursion() {
    if (animRunning) return;
    const fn   = document.getElementById('rec-fn').value;
    const n    = parseInt(document.getElementById('rec-n').value) || 5;
    const b    = parseInt(document.getElementById('rec-b').value) || 2;

    // reset state
    callStack = []; totalCalls = 0; maxDepth = 0; hanoiMoves = []; lines = [];
    document.getElementById('rec-tree').innerHTML = '';
    document.getElementById('rec-calls').textContent  = '0';
    document.getElementById('rec-depth').textContent  = '0';
    document.getElementById('rec-result').textContent = '—';

    // build trace (synchronously)
    let result;
    if (fn === 'factorial') {
      result = traceFactorial(n);
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>Result = ${result}</strong></span>`);

    } else if (fn === 'fibonacci') {
      const cap = Math.min(n, 9);
      if (n > 9) lines.push(`<span class="call-line c-dim">(Capping trace at n=9 — naive fibonacci has 2^n calls)</span>`);
      result = traceFib(cap, 0, null);
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>Result = ${result}</strong></span>`);

    } else if (fn === 'fib_memo') {
      result = traceFib(n, 0, new Map());
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>Result = ${result}</strong><span class="c-cache"> (memoized — only ${totalCalls} unique calls vs ${Math.pow(2,n)} naive)</span></span>`);

    } else if (fn === 'hanoi') {
      const disks = Math.min(n, 7);
      traceHanoi(disks);
      const expected = Math.pow(2, disks) - 1;
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>Total moves: ${hanoiMoves.length} (= 2^${disks} - 1 = ${expected})</strong></span>`);
      result = hanoiMoves.length;
      document.getElementById('hanoi-card').style.display = 'block';
      document.getElementById('hanoi-total').textContent  = hanoiMoves.length;
      initHanoi(disks);

    } else if (fn === 'gcd') {
      result = traceGCD(n, b);
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>gcd(${n}, ${b}) = ${result}</strong></span>`);

    } else if (fn === 'power') {
      result = tracePower(b, n);
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>${b}^${n} = ${result}</strong></span>`);

    } else if (fn === 'binary') {
      const arr = Array.from({ length: n * 2 }, (_, i) => i * 2); // [0,2,4,...2n-1]
      const target = b;
      lines.unshift(`<span class="call-line c-dim"><strong>Array: [${arr.join(', ')}]</strong></span>`);
      lines.push('');
      result = traceBinarySearch(arr, target, 0, arr.length - 1);
      lines.push(`<span class="call-line" style="font-weight:800;color:#4ADE80"><br><strong>Result = ${result >= 0 ? 'index ' + result : 'not found'}</strong></span>`);
    }

    animCounter(document.getElementById('rec-result'), typeof result === 'number' ? result : result);

    // animate lines with delay
    animRunning = true;
    const treeEl   = document.getElementById('rec-tree');
    const SPEED    = { 1: 700, 2: 350, 3: 160, 4: 60, 5: 8 };
    const delay    = () => SPEED[parseInt(document.getElementById('rec-speed').value)] || 160;

    for (const lineHtml of lines) {
      await sleep(delay());
      const el = document.createElement('span');
      el.innerHTML = lineHtml;
      treeEl.appendChild(el);
      treeEl.scrollTop = treeEl.scrollHeight;
      animCounter(document.getElementById('rec-calls'), totalCalls);
      animCounter(document.getElementById('rec-depth'), maxDepth);
    }
    animRunning = false;

    // play Hanoi animation after trace
    if (fn === 'hanoi' && hanoiMoves.length) {
      await sleep(300);
      await animateHanoi(hanoiMoves);
    }
  }

  function clearRec() {
    animRunning = false;
    document.getElementById('rec-tree').innerHTML = '<span style="color:#6B7280;font-family:\'Nunito\';font-weight:600">Choose a function above and click Animate! ✨</span>';
    document.getElementById('rec-calls').textContent  = '0';
    document.getElementById('rec-depth').textContent  = '0';
    document.getElementById('rec-result').textContent = '—';
  }

  /* ── FUNCTION CHANGE HANDLER ─────────────────────────────────────── */
  function onFnChange() {
    const fn   = document.getElementById('rec-fn').value;
    const meta = FN_META[fn];
    if (!meta) return;
    document.getElementById('rec-b-wrap').style.display   = meta.hasB ? 'flex' : 'none';
    document.getElementById('rec-b-label').textContent    = meta.bLabel || 'b:';
    if (meta.hasB) document.getElementById('rec-b').value = meta.bDefault;
    document.getElementById('rec-n').max                  = meta.maxN;
    if (parseInt(document.getElementById('rec-n').value) > meta.maxN)
      document.getElementById('rec-n').value = Math.min(5, meta.maxN);
    if (!meta.hanoiVis) document.getElementById('hanoi-card').style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════
     TOWER OF HANOI CANVAS
     Data structure: 3 stacks (one per peg), each holding disk sizes
     ══════════════════════════════════════════════════════════════════ */
  const hCanvas = document.getElementById('hanoi-canvas');
  const hCtx    = hCanvas.getContext('2d');
  let pegs      = [[], [], []];
  let numDisks  = 3;

  const DISK_COLORS = ['#FF6B6B','#FB923C','#FFE66D','#4ADE80','#4ECDC4','#38BDF8','#A855F7'];
  const PEG_MAP     = { A: 0, B: 1, C: 2 };

  function initHanoi(n) {
    numDisks = n;
    pegs = [[], [], []];
    for (let i = n; i >= 1; i--) pegs[0].push(i); // biggest disk at bottom
    drawHanoi();
  }

  function drawHanoi() {
    const W = hCanvas.width, H = hCanvas.height - 22;
    hCtx.clearRect(0, 0, W, H + 22);
    const pegXs = [W / 6, W / 2, 5 * W / 6];
    const baseY = H - 8;
    const pegH  = H - 30;
    const maxW  = W / 3.5;
    const diskH = Math.min(30, (pegH - 20) / (numDisks + 1));

    // base
    hCtx.fillStyle = '#78350F';
    hCtx.fillRect(18, baseY, W - 36, 10);

    // pegs
    for (const px of pegXs) {
      const g = hCtx.createLinearGradient(px - 5, 0, px + 5, 0);
      g.addColorStop(0, '#92400E'); g.addColorStop(.5, '#D97706'); g.addColorStop(1, '#92400E');
      hCtx.fillStyle = g;
      hCtx.fillRect(px - 5, baseY - pegH, 10, pegH + 10);
    }

    // disks
    for (let p = 0; p < 3; p++) {
      for (let d = 0; d < pegs[p].length; d++) {
        const size = pegs[p][d];
        const diskW = (size / numDisks) * maxW;
        const x     = pegXs[p] - diskW / 2;
        const y     = baseY - (d + 1) * diskH;
        const col   = DISK_COLORS[size - 1] || '#A855F7';
        const g     = hCtx.createLinearGradient(x, y, x, y + diskH);
        g.addColorStop(0, col); g.addColorStop(1, col + 'AA');
        hCtx.fillStyle = g;
        hCtx.beginPath();
        hCtx.roundRect(x, y, diskW, diskH - 3, 6);
        hCtx.fill();
        hCtx.strokeStyle = 'rgba(0,0,0,.12)'; hCtx.lineWidth = 1.5; hCtx.stroke();
        hCtx.fillStyle = 'white';
        hCtx.font = `bold ${Math.min(13, diskH - 7)}px Nunito, sans-serif`;
        hCtx.textAlign = 'center'; hCtx.textBaseline = 'middle';
        hCtx.fillText(size, pegXs[p], y + diskH / 2 - 1.5);
      }
    }
  }

  async function animateHanoi(moves) {
    const logEl = document.getElementById('hanoi-move-log');
    const SPEED = { 1: 900, 2: 500, 3: 260, 4: 110, 5: 30 };
    const delay = () => SPEED[parseInt(document.getElementById('rec-speed').value)] || 260;

    for (let i = 0; i < moves.length; i++) {
      const { disk, from, to } = moves[i];
      const fp = PEG_MAP[from], tp = PEG_MAP[to];
      const idx = pegs[fp].lastIndexOf(disk);
      if (idx >= 0) pegs[fp].splice(idx, 1);
      pegs[tp].push(disk);
      drawHanoi();
      animCounter(document.getElementById('hanoi-move-num'), i + 1);
      logEl.textContent = `Move ${i + 1}/${moves.length}: Move disk ${disk} from ${from} to ${to}`;
      await sleep(delay());
    }
  }

  /* ── INIT ────────────────────────────────────────────────────────── */
  function init() {
    initHanoi(3);
    onFnChange();
    document.getElementById('rec-fn').addEventListener('change', onFnChange);
  }

  return { init, runRecursion, clearRec };

})();
