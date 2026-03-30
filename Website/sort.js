/* ═══════════════════════════════════════════════════════════════════
   sort.js — Sorting algorithms + canvas bar visualizer
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const SortModule = (() => {

  const canvas = document.getElementById('sort-canvas');
  const ctx    = canvas.getContext('2d');

  let arr = [];
  let highlight = new Set();   // indices being compared/swapped
  let swapSet   = new Set();   // indices currently swapping

  const ALGO_META = {
    bubble:    { name:'Bubble Sort',       best:'O(n)',      avg:'O(n²)',      space:'O(1)',    stable:true  },
    selection: { name:'Selection Sort',    best:'O(n²)',     avg:'O(n²)',      space:'O(1)',    stable:false },
    insertion: { name:'Insertion Sort',    best:'O(n)',      avg:'O(n²)',      space:'O(1)',    stable:true  },
    merge:     { name:'Merge Sort',        best:'O(n log n)',avg:'O(n log n)', space:'O(n)',    stable:true  },
    quick:     { name:'Quick Sort',        best:'O(n log n)',avg:'O(n log n)', space:'O(log n)',stable:false },
    rquick:    { name:'Random-Quick Sort', best:'O(n log n)',avg:'O(n log n)', space:'O(log n)',stable:false },
    counting:  { name:'Counting Sort',     best:'O(n+k)',    avg:'O(n+k)',     space:'O(k)',    stable:true  },
    radix:     { name:'Radix Sort',        best:'O(nk)',     avg:'O(nk)',      space:'O(n+k)',  stable:true  },
  };

  /* ── DRAW ──────────────────────────────────────────────────────────── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
  }
  window.addEventListener('resize', () => { resize(); draw(); });

  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!arr.length) return;

    const n    = arr.length;
    const maxV = Math.max(...arr);
    const gap  = n > 100 ? 0.5 : n > 60 ? 1 : 2;
    const bw   = (W - gap * (n + 1)) / n;

    for (let i = 0; i < n; i++) {
      const x  = gap + i * (bw + gap);
      const bh = (arr[i] / maxV) * (H - 20);
      const y  = H - bh;

      // Color logic
      let fillColor;
      if (swapSet.has(i)) {
        fillColor = '#F59E0B'; // amber — swapping
      } else if (highlight.has(i)) {
        fillColor = '#00D4FF'; // cyan — comparing
      } else {
        // Gradient: dark at bottom, bright at top
        const norm = arr[i] / maxV;
        fillColor = lerpColor('#1E3A5F', '#00D4FF', norm * 0.6 + 0.1);
      }

      // Bar
      ctx.fillStyle = fillColor;
      if (bw > 3) {
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, [bw < 8 ? 1 : 3, bw < 8 ? 1 : 3, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, bw, bh);
      }

      // Glow for active bars
      if (swapSet.has(i) || highlight.has(i)) {
        const glow = ctx.createLinearGradient(x, y, x, H);
        const glowCol = swapSet.has(i) ? '#F59E0B' : '#00D4FF';
        glow.addColorStop(0, glowCol + '44');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 2, y, bw + 4, bh);
      }

      // Value label for small arrays
      if (bw > 14 && n <= 50) {
        ctx.fillStyle = highlight.has(i) || swapSet.has(i) ? '#fff' : '#64748B';
        ctx.font = `${Math.min(11, bw * 0.7)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(arr[i], x + bw / 2, y + 3);
      }
    }
  }

  function lerpColor(hex1, hex2, t) {
    const r1=parseInt(hex1.slice(1,3),16), g1=parseInt(hex1.slice(3,5),16), b1=parseInt(hex1.slice(5,7),16);
    const r2=parseInt(hex2.slice(1,3),16), g2=parseInt(hex2.slice(3,5),16), b2=parseInt(hex2.slice(5,7),16);
    const r=Math.round(r1+(r2-r1)*t), g=Math.round(g1+(g2-g1)*t), b=Math.round(b1+(b2-b1)*t);
    return `rgb(${r},${g},${b})`;
  }

  /* ── ALGORITHMS ────────────────────────────────────────────────────── */

  async function bubbleSort() {
    const n = arr.length;
    let totalSteps = 0;
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < n - i - 1; j++) totalSteps++;
    State.totalSteps = totalSteps;

    for (let i = 0; i < n; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);

        highlight = new Set([j, j + 1]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        addLog(`Compare arr[${j}]=${arr[j]} vs arr[${j+1}]=${arr[j+1]}`, 'compare');
        await sleep(speedDelay());

        if (arr[j] > arr[j + 1]) {
          swapSet = new Set([j, j + 1]);
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          State.swaps++;
          draw();
          addLog(`Swap ${arr[j+1]} ↔ ${arr[j]}`, 'swap');
          await sleep(speedDelay());
          swapped = true;
          swapSet.clear();
        }
        highlight.clear();
      }
      if (!swapped) break;
    }
  }

  async function selectionSort() {
    const n = arr.length;
    State.totalSteps = n * n / 2;
    for (let i = 0; i < n - 1; i++) {
      let mi = i;
      for (let j = i + 1; j < n; j++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        highlight = new Set([mi, j]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        if (arr[j] < arr[mi]) { mi = j; }
        highlight.clear();
      }
      if (mi !== i) {
        swapSet = new Set([i, mi]);
        addLog(`Select min=${arr[mi]}, swap with idx ${i}`, 'swap');
        [arr[i], arr[mi]] = [arr[mi], arr[i]];
        State.swaps++;
        draw(); updateMetrics();
        await sleep(speedDelay() * 2);
        swapSet.clear();
      }
    }
  }

  async function insertionSort() {
    const n = arr.length;
    State.totalSteps = n;
    for (let i = 1; i < n; i++) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);
      const key = arr[i];
      let j = i - 1;
      highlight = new Set([i]);
      draw(); await sleep(speedDelay());
      while (j >= 0) {
        State.comps++; State.steps++;
        if (arr[j] > key) {
          arr[j + 1] = arr[j];
          State.swaps++;
          swapSet = new Set([j, j + 1]);
          draw(); updateMetrics();
          await sleep(speedDelay());
          swapSet.clear();
          j--;
        } else break;
      }
      arr[j + 1] = key;
      highlight.clear();
      draw();
    }
  }

  async function mergeSort() {
    const aux = arr.slice();
    const totalOps = arr.length * Math.ceil(Math.log2(arr.length));
    State.totalSteps = totalOps;

    async function merge(lo, mid, hi) {
      const L = arr.slice(lo, mid + 1);
      const R = arr.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        State.comps++; State.steps++;
        highlight = new Set([k]);
        if (L[i] <= R[j]) { arr[k++] = L[i++]; }
        else { arr[k++] = R[j++]; State.swaps++; }
        draw(); updateMetrics();
        await sleep(speedDelay());
        highlight.clear();
      }
      while (i < L.length) { arr[k++] = L[i++]; draw(); await sleep(speedDelay() / 2); }
      while (j < R.length) { arr[k++] = R[j++]; draw(); await sleep(speedDelay() / 2); }
    }

    async function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      await sort(lo, mid);
      await sort(mid + 1, hi);
      await merge(lo, mid, hi);
    }
    await sort(0, arr.length - 1);
  }

  async function quickSort() {
    const n = arr.length;
    State.totalSteps = n * Math.ceil(Math.log2(n));

    async function partition(lo, hi) {
      const pivot = arr[hi];
      swapSet = new Set([hi]);
      draw(); await sleep(speedDelay());
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (State.cancel) return lo;
        while (State.paused && !State.cancel) await sleep(50);
        highlight = new Set([j, hi]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        if (arr[j] <= pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          State.swaps++;
          swapSet = new Set([i, j]);
          draw(); await sleep(speedDelay());
          swapSet.clear();
        }
        highlight.clear();
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      State.swaps++;
      swapSet.clear();
      return i + 1;
    }

    async function sort(lo, hi) {
      if (lo < hi) {
        const p = await partition(lo, hi);
        await sort(lo, p - 1);
        await sort(p + 1, hi);
      }
    }
    await sort(0, n - 1);
  }

  async function randomQuickSort() {
    const n = arr.length;
    State.totalSteps = n * Math.ceil(Math.log2(n));

    async function partition(lo, hi) {
      const r = rand(lo, hi);
      [arr[r], arr[hi]] = [arr[hi], arr[r]]; State.swaps++;
      const pivot = arr[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (State.cancel) return lo;
        while (State.paused && !State.cancel) await sleep(50);
        highlight = new Set([j, hi]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        if (arr[j] <= pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]]; State.swaps++;
          swapSet = new Set([i, j]); draw(); await sleep(speedDelay()); swapSet.clear();
        }
        highlight.clear();
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]]; State.swaps++;
      return i + 1;
    }

    async function sort(lo, hi) {
      if (lo < hi) { const p = await partition(lo, hi); await sort(lo, p-1); await sort(p+1, hi); }
    }
    await sort(0, n - 1);
  }

  async function countingSort() {
    const n = arr.length;
    const max = Math.max(...arr);
    State.totalSteps = n + max;
    const cnt = new Array(max + 1).fill(0);

    // Count
    for (let i = 0; i < n; i++) {
      if (State.cancel) return;
      cnt[arr[i]]++;
      highlight = new Set([i]); State.comps++; State.steps++;
      draw(); updateMetrics();
      await sleep(speedDelay());
      highlight.clear();
    }

    // Reconstruct
    let k = 0;
    for (let v = 0; v <= max; v++) {
      while (cnt[v]-- > 0) {
        if (State.cancel) return;
        arr[k] = v; State.steps++;
        highlight = new Set([k]); k++;
        draw(); updateMetrics();
        await sleep(speedDelay() / 2);
        highlight.clear();
      }
    }
  }

  async function radixSort() {
    const max = Math.max(...arr);
    const digits = Math.floor(Math.log10(max)) + 1;
    State.totalSteps = arr.length * digits;

    let exp = 1;
    while (Math.floor(max / exp) > 0) {
      const buckets = Array.from({ length: 10 }, () => []);
      for (let i = 0; i < arr.length; i++) {
        if (State.cancel) return;
        const digit = Math.floor(arr[i] / exp) % 10;
        buckets[digit].push(arr[i]);
        highlight = new Set([i]); State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        highlight.clear();
      }
      let k = 0;
      for (const b of buckets) {
        for (const v of b) {
          if (State.cancel) return;
          arr[k] = v; State.steps++;
          highlight = new Set([k]); k++;
          draw(); updateMetrics();
          await sleep(speedDelay() / 3);
          highlight.clear();
        }
      }
      exp *= 10;
    }
  }

  const FN_MAP = {
    bubble: bubbleSort, selection: selectionSort, insertion: insertionSort,
    merge: mergeSort, quick: quickSort, rquick: randomQuickSort,
    counting: countingSort, radix: radixSort,
  };

  /* ── PUBLIC ─────────────────────────────────────────────────────────── */
  function generate() {
    arr = makeDataset(State.size, State.dataset);
    highlight.clear(); swapSet.clear();
    resetStats(); updateMetrics();
    clearLog();
    resize(); draw();
    setStatus(`Dataset ready — ${arr.length} elements`);
    addLog(`Generated ${arr.length}-element ${State.dataset} dataset`, '');
  }

  function reset() {
    State.cancel = true;
    State.running = false;
    State.paused  = false;
    setTimeout(() => {
      State.cancel = false;
      generate();
      updatePlayBtn(false);
    }, 50);
  }

  function updateComplexity(algoKey) {
    const m = ALGO_META[algoKey];
    if (!m) return;
    const set = (id, val, cls) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = val; el.className = 'complexity-value ' + (cls||''); }
    };
    set('cx-best',  m.best,  m.best.includes('n²')||m.best.includes('n)') ? 'green' : '');
    set('cx-avg',   m.avg,   m.avg.includes('n²') ? 'red' : '');
    set('cx-worst', m.avg,   m.avg.includes('n²') ? 'red' : '');
    set('cx-space', m.space, m.space === 'O(1)' ? 'green' : '');
    set('cx-stable', m.stable ? 'Yes' : 'No', m.stable ? 'green' : 'red');
  }

  async function run() {
    const fn = FN_MAP[State.algo];
    if (!fn) return;
    if (!arr.length) generate();

    if (State.running) {
      State.paused = !State.paused;
      updatePlayBtn(!State.paused);
      setStatus(State.paused ? 'Paused' : 'Running…', State.paused ? 'idle' : 'running');
      return;
    }

    State.running = true;
    State.cancel  = false;
    State.paused  = false;
    resetStats();
    State.startTime = performance.now();
    updatePlayBtn(true);
    setStatus('Running ' + (ALGO_META[State.algo]?.name || State.algo) + '…', 'running');
    clearLog();

    await fn();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    State.running   = false;

    if (!State.cancel) {
      highlight = new Set(); swapSet.clear();
      draw();
      updateMetrics();
      updatePlayBtn(false);
      setStatus(`Done — ${fmtNum(State.comps)} comparisons, ${fmtNum(State.swaps)} swaps`, 'done');
      addLog(`Sorted! ${fmtNum(State.comps)} comps · ${fmtNum(State.swaps)} swaps · ${State.elapsedMs.toFixed(1)}ms`, 'done');
    }
  }

  function init() {
    generate();
    updateComplexity(State.algo);
  }

  return { init, generate, reset, run, updateComplexity };
})();
