'use strict';

/* ================================================================
   sort.js — Sorting Algorithm Module
   Implements 8 sorting algorithms with real-time canvas animation
   and synchronous benchmark versions for the Compare All feature.

   Animated algorithms  : Bubble, Selection, Insertion, Merge,
                          Quick, Random-Quick, Counting, Radix
   Benchmark versions   : _bBubble … _bRadix  (no animation)
   Public API           : { init, generate, run, redraw, compareAll }
================================================================ */

const SortModule = (() => {

  const canvas = _el('vis-canvas');
  const ctx    = canvas.getContext('2d');

  // Working array and index-sets that drive canvas coloring
  let arr       = [];
  let comparing = new Set(); // indices currently being compared (blue)
  let swapping  = new Set(); // indices currently being swapped  (orange)
  let sorted    = new Set(); // indices confirmed in final position (green)

  /* ── Settings helpers ───────────────────────────────────────── */
  // Read live from the DOM so changes take effect without regenerating.
  function getBarStyle()  { return _el('bar-style-select')?.value || 'solid'; }
  function getShowValues(){ return _el('show-values-toggle')?.checked !== false; }

  /* ── Color constants ────────────────────────────────────────── */
  const COL = {
    bar:     '#c5cad8', // default / unsorted
    compare: '#2196f3', // elements under comparison
    swap:    '#ff9800', // elements being swapped
    sorted:  '#4caf50', // element confirmed in final position
    pivot:   '#9c27b0', // pivot element (Quick Sort)
  };

  /* ── Canvas resize ──────────────────────────────────────────── */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width  = r.width;
    canvas.height = r.height;
  }
  window.addEventListener('resize', () => { resize(); draw(); });

  /* ── Draw dispatcher ────────────────────────────────────────── */
  // Routes to the correct visualization based on State.vizType.
  // The default 'bar' visualization is handled locally; all others
  // are delegated to the Visualizations module.
  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;

    const vizType     = State.vizType || 'bar';
    const compareList = Array.from(comparing);
    const swapList    = Array.from(swapping);
    const opts = { comparisons: compareList, swaps: swapList,
                   active: swapping.size > 0 ? swapping : comparing,
                   sorted };

    if      (vizType === 'line')    Visualizations.drawLineGraph(ctx, arr, W, H, opts);
    else if (vizType === 'scatter') Visualizations.drawScatterPlot(ctx, arr, W, H, opts);
    else if (vizType === 'pie')     Visualizations.drawCircularChart(ctx, arr, W, H, opts);
    else if (vizType === 'bubble')  Visualizations.drawBubbleChart(ctx, arr, W, H, opts);
    else                            drawBarsDefault(); // 'bar' (default)
  }

  /* ── Bar chart (default visualization) ─────────────────────── */
  function drawBarsDefault() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!arr.length) return;

    const style    = getBarStyle();
    const showVals = getShowValues();
    const n        = arr.length;
    const maxV     = Math.max(...arr) || 1;
    const gap      = n > 150 ? 0 : n > 80 ? 0.5 : 1;
    const bw       = (W - gap * (n - 1)) / n;
    const padT     = 24;   // top padding so value labels don't clip
    const usableH  = H - padT - 4;

    for (let i = 0; i < n; i++) {
      const x  = i * (bw + gap);
      const bh = Math.max(2, (arr[i] / maxV) * usableH);
      const y  = H - bh - 4;

      // Priority: sorted < swapping < comparing (comparing wins visually)
      let baseColor = COL.bar;
      if (sorted.has(i))                           baseColor = COL.sorted;
      if (swapping.has(i))                         baseColor = COL.swap;
      if (comparing.has(i) && !swapping.has(i))   baseColor = COL.compare;

      // Apply chosen bar style
      if (style === 'gradient') {
        const grad = ctx.createLinearGradient(x, y, x, H - 4);
        grad.addColorStop(0, lighten(baseColor, 0.35));
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = baseColor;
      }

      if (style === 'outlined') {
        // Transparent fill + colored border
        ctx.strokeStyle = baseColor;
        ctx.lineWidth   = bw >= 4 ? 1.5 : 1;
        ctx.fillStyle   = baseColor + '22';
        if (bw >= 2) {
          roundRect(ctx, x, y, bw, bh, Math.min(2, bw * 0.3));
          ctx.fill(); ctx.stroke();
        } else {
          ctx.strokeRect(x, y, Math.max(1, bw), bh);
        }
      } else {
        if (bw >= 2) {
          roundRect(ctx, x, y, bw, bh, Math.min(2, bw * 0.3));
          ctx.fill();
        } else {
          ctx.fillRect(x, y, Math.max(1, bw), bh);
        }
      }

      // Value label — only shown when bars are wide enough and n is small
      if (showVals && bw >= 16 && n <= 60) {
        ctx.fillStyle    = (swapping.has(i) || comparing.has(i)) ? '#fff' : '#8892aa';
        ctx.font         = `${Math.min(11, bw * 0.65)}px Source Code Pro, monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(arr[i], x + bw / 2, y - 2);
      }
    }
  }

  /* ── Canvas drawing utilities ───────────────────────────────── */

  // Draws a rectangle with rounded top corners (bottom stays square).
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Blends a 6-digit hex color toward white by `amt` (0 = original, 1 = white).
  function lighten(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r + (255-r)*amt)},${Math.round(g + (255-g)*amt)},${Math.round(b + (255-b)*amt)})`;
  }

  /* ── Animated step primitives ───────────────────────────────── */

  // Highlights indices i and j as "comparing", waits one frame, returns arr[i] > arr[j].
  async function cmp(i, j) {
    comparing = new Set([i, j]);
    State.comps++; State.steps++;
    draw(); updateMetrics();
    await sleep(speedDelay());
    comparing.clear();
    return arr[i] > arr[j];
  }

  // Swaps arr[i] and arr[j] with an orange highlight and one frame of delay.
  async function swap(i, j) {
    swapping = new Set([i, j]);
    [arr[i], arr[j]] = [arr[j], arr[i]];
    State.swaps++;
    draw(); updateMetrics();
    addLog(`Swap [${i}]=${arr[i]} ↔ [${j}]=${arr[j]}`, 'swap');
    await sleep(speedDelay());
    swapping.clear();
  }

  /* ── Sorting algorithms (animated) ─────────────────────────── */
  //
  // Progress tracking convention across all algorithms:
  //   State.totalSteps = worst-case comparison count for the chosen algorithm.
  //   State.steps      = comparisons performed so far (incremented via cmp()).
  // This keeps the progress bar accurate across all input types.

  async function bubbleSort() {
    const n = arr.length;
    // Worst case: every pair compared — n*(n-1)/2 comparisons.
    State.totalSteps = Math.floor(n * (n - 1) / 2);

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        const gt = await cmp(j, j + 1);
        if (gt) { await swap(j, j + 1); swapped = true; }
      }
      sorted.add(n - i - 1); // rightmost unsorted element is now in place
      if (!swapped) {
        // Early-exit: remaining prefix is already sorted
        for (let k = 0; k <= n - i - 2; k++) sorted.add(k);
        break;
      }
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  async function selectionSort() {
    const n = arr.length;
    // Exactly n*(n-1)/2 comparisons regardless of input order.
    State.totalSteps = Math.floor(n * (n - 1) / 2);

    for (let i = 0; i < n - 1; i++) {
      let mi = i; // index of the minimum found so far
      for (let j = i + 1; j < n; j++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        comparing = new Set([mi, j]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        if (arr[j] < arr[mi]) mi = j;
        comparing.clear();
      }
      if (mi !== i) await swap(i, mi);
      sorted.add(i);
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  async function insertionSort() {
    const n = arr.length;
    // Worst case (reversed input): n*(n-1)/2 inner comparisons.
    State.totalSteps = Math.floor(n * (n - 1) / 2);

    sorted.add(0); // single-element prefix is trivially sorted
    for (let i = 1; i < n; i++) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);
      const key = arr[i];
      let j = i - 1;
      comparing = new Set([i]);
      draw(); await sleep(speedDelay());
      while (j >= 0) {
        State.comps++; State.steps++;
        if (arr[j] > key) {
          arr[j + 1] = arr[j];
          swapping = new Set([j, j + 1]);
          State.swaps++;
          draw(); updateMetrics();
          await sleep(speedDelay());
          swapping.clear();
          j--;
        } else break;
      }
      arr[j + 1] = key;
      sorted.add(i);
      comparing.clear();
      draw();
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  async function mergeSort() {
    const n = arr.length;
    // n * ceil(log2 n) is a tight upper bound on merge comparisons.
    State.totalSteps = n * Math.ceil(Math.log2(n + 1));

    async function merge(lo, mid, hi) {
      const L = arr.slice(lo, mid + 1);
      const R = arr.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        State.comps++; State.steps++;
        comparing = new Set([k]);
        if (L[i] <= R[j]) { arr[k++] = L[i++]; }
        else               { arr[k++] = R[j++]; State.swaps++; }
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
      }
      // Drain remaining elements (no more comparisons needed)
      while (i < L.length) { arr[k++] = L[i++]; draw(); await sleep(speedDelay() / 3); }
      while (j < R.length) { arr[k++] = R[j++]; draw(); await sleep(speedDelay() / 3); }
    }

    async function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      await sort(lo, mid);
      await sort(mid + 1, hi);
      await merge(lo, mid, hi);
    }

    await sort(0, n - 1);
    sorted = new Set(arr.map((_, i) => i));
  }

  async function quickSort() {
    const n = arr.length;
    // Average case: n * log2 n. Worst case (sorted input) is n², but we
    // use this as the display budget — actual steps often finish earlier.
    State.totalSteps = n * Math.ceil(Math.log2(n + 1));

    async function partition(lo, hi) {
      const pivot = arr[hi];
      // Flash the pivot before partitioning
      swapping = new Set([hi]); draw(); await sleep(speedDelay()); swapping.clear();
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (State.cancel) return lo;
        while (State.paused && !State.cancel) await sleep(50);
        comparing = new Set([j, hi]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
        if (arr[j] <= pivot) { i++; if (i !== j) await swap(i, j); }
      }
      await swap(i + 1, hi); // place pivot in its final position
      return i + 1;
    }

    async function sort(lo, hi) {
      if (lo < hi) {
        const p = await partition(lo, hi);
        sorted.add(p); // pivot is now in its correct final position
        await sort(lo, p - 1);
        await sort(p + 1, hi);
      }
    }

    await sort(0, n - 1);
    sorted = new Set(arr.map((_, i) => i));
  }

  async function randomQuickSort() {
    const n = arr.length;
    // Random pivot selection prevents worst-case O(n²) on sorted input.
    State.totalSteps = n * Math.ceil(Math.log2(n + 1));

    async function partition(lo, hi) {
      const r = rand(lo, hi);
      if (r !== hi) await swap(r, hi); // move random pivot to last position
      const pivot = arr[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (State.cancel) return lo;
        while (State.paused && !State.cancel) await sleep(50);
        comparing = new Set([j, hi]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
        if (arr[j] <= pivot) { i++; if (i !== j) await swap(i, j); }
      }
      await swap(i + 1, hi);
      return i + 1;
    }

    async function sort(lo, hi) {
      if (lo < hi) {
        const p = await partition(lo, hi);
        sorted.add(p);
        await sort(lo, p - 1);
        await sort(p + 1, hi);
      }
    }

    await sort(0, n - 1);
    sorted = new Set(arr.map((_, i) => i));
  }

  async function countingSort() {
    const n   = arr.length;
    const max = Math.max(...arr);
    // Phase 1: n counting passes. Phase 2: max write-back passes.
    State.totalSteps = n + max;

    const cnt = new Array(max + 1).fill(0);

    // Phase 1 — count frequency of each value
    for (let i = 0; i < n; i++) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);
      comparing = new Set([i]); State.comps++; State.steps++;
      draw(); updateMetrics();
      await sleep(speedDelay());
      cnt[arr[i]]++;
      comparing.clear();
    }

    // Phase 2 — write values back in sorted order
    let k = 0;
    for (let v = 0; v <= max; v++) {
      while (cnt[v]-- > 0) {
        if (State.cancel) return;
        arr[k] = v; State.steps++;
        sorted.add(k); k++;
        draw(); updateMetrics();
        await sleep(speedDelay() / 2);
      }
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  async function radixSort() {
    const max    = Math.max(...arr);
    const digits = String(max).length;
    // One pass of n comparisons per digit.
    State.totalSteps = arr.length * digits;

    let exp = 1; // current digit place (1 = ones, 10 = tens, …)
    while (Math.floor(max / exp) > 0) {
      const buckets = Array.from({ length: 10 }, () => []);

      // Distribute into digit buckets
      for (let i = 0; i < arr.length; i++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        const d = Math.floor(arr[i] / exp) % 10;
        buckets[d].push(arr[i]);
        comparing = new Set([i]); State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
      }

      // Collect buckets back into arr
      let k = 0;
      for (const b of buckets) {
        for (const v of b) {
          if (State.cancel) return;
          arr[k++] = v; draw();
          await sleep(speedDelay() / 3);
        }
      }
      exp *= 10;
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  // Dispatch table — maps State.algo key to the animated algorithm function
  const FN = {
    bubble:    bubbleSort,
    selection: selectionSort,
    insertion: insertionSort,
    merge:     mergeSort,
    quick:     quickSort,
    rquick:    randomQuickSort,
    counting:  countingSort,
    radix:     radixSort,
  };

  /* ── Synchronous benchmark implementations ──────────────────── */
  // These mirror each animated algorithm but contain no async/await,
  // no DOM updates, and no sleep calls. They are used exclusively by
  // compareAll() to measure raw algorithmic performance.
  // Each returns { comps, swaps } on the mutated input array.

  function _bBubble(a) {
    let comps = 0, swaps = 0;
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        comps++;
        if (a[j] > a[j + 1]) { [a[j], a[j+1]] = [a[j+1], a[j]]; swaps++; swapped = true; }
      }
      if (!swapped) break;
    }
    return { comps, swaps };
  }

  function _bSelection(a) {
    let comps = 0, swaps = 0;
    for (let i = 0; i < a.length - 1; i++) {
      let mi = i;
      for (let j = i + 1; j < a.length; j++) { comps++; if (a[j] < a[mi]) mi = j; }
      if (mi !== i) { [a[i], a[mi]] = [a[mi], a[i]]; swaps++; }
    }
    return { comps, swaps };
  }

  function _bInsertion(a) {
    let comps = 0, swaps = 0;
    for (let i = 1; i < a.length; i++) {
      const key = a[i];
      let j = i - 1;
      // Count each comparison separately for clarity (avoid comma-operator trick)
      while (j >= 0 && a[j] > key) {
        comps++;
        a[j + 1] = a[j]; swaps++; j--;
      }
      // Count the final comparison that broke the loop (a[j] <= key or j < 0)
      if (j >= 0) comps++;
      a[j + 1] = key;
    }
    return { comps, swaps };
  }

  function _bMerge(a) {
    let comps = 0, swaps = 0;
    function merge(lo, mid, hi) {
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) {
        comps++;
        if (L[i] <= R[j]) a[k++] = L[i++];
        else               { a[k++] = R[j++]; swaps++; }
      }
      while (i < L.length) a[k++] = L[i++];
      while (j < R.length) a[k++] = R[j++];
    }
    function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      sort(lo, mid); sort(mid + 1, hi); merge(lo, mid, hi);
    }
    sort(0, a.length - 1);
    return { comps, swaps };
  }

  function _bQuick(a) {
    let comps = 0, swaps = 0;
    function partition(lo, hi) {
      const pivot = a[hi]; let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comps++;
        if (a[j] <= pivot) { i++; if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; swaps++; } }
      }
      [a[i+1], a[hi]] = [a[hi], a[i+1]]; swaps++;
      return i + 1;
    }
    function sort(lo, hi) {
      if (lo < hi) { const p = partition(lo, hi); sort(lo, p-1); sort(p+1, hi); }
    }
    sort(0, a.length - 1);
    return { comps, swaps };
  }

  function _bRQuick(a) {
    let comps = 0, swaps = 0;
    function partition(lo, hi) {
      const r = lo + Math.floor(Math.random() * (hi - lo + 1));
      [a[r], a[hi]] = [a[hi], a[r]]; swaps++;
      const pivot = a[hi]; let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comps++;
        if (a[j] <= pivot) { i++; if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; swaps++; } }
      }
      [a[i+1], a[hi]] = [a[hi], a[i+1]]; swaps++;
      return i + 1;
    }
    function sort(lo, hi) {
      if (lo < hi) { const p = partition(lo, hi); sort(lo, p-1); sort(p+1, hi); }
    }
    sort(0, a.length - 1);
    return { comps, swaps };
  }

  function _bCounting(a) {
    let comps = 0, swaps = 0;
    const max = Math.max(...a);
    const cnt = new Array(max + 1).fill(0);
    for (let i = 0; i < a.length; i++) { comps++; cnt[a[i]]++; }
    let k = 0;
    for (let v = 0; v <= max; v++) while (cnt[v]-- > 0) { a[k++] = v; swaps++; }
    return { comps, swaps };
  }

  function _bRadix(a) {
    let comps = 0, swaps = 0;
    const max = Math.max(...a);
    let exp = 1;
    while (Math.floor(max / exp) > 0) {
      const buckets = Array.from({ length: 10 }, () => []);
      for (let i = 0; i < a.length; i++) { comps++; buckets[Math.floor(a[i] / exp) % 10].push(a[i]); }
      let k = 0;
      for (const b of buckets) for (const v of b) { a[k++] = v; swaps++; }
      exp *= 10;
    }
    return { comps, swaps };
  }

  /* ── Compare All ────────────────────────────────────────────── */
  // Lock flag prevents concurrent invocations (e.g. double-clicking).
  let _compareRunning = false;

  function compareAll() {
    if (State.running || _compareRunning) return;
    _compareRunning = true;

    // Benchmark on at least 1000 elements so O(n²) algorithms produce
    // clearly distinguishable times from O(n log n) ones.
    const BENCH_SIZE   = Math.max(1000, State.size);
    const benchDataset = makeDataset(BENCH_SIZE, State.dataset);

    const BENCH = [
      { label: 'Bubble Sort',       fn: _bBubble    },
      { label: 'Selection Sort',    fn: _bSelection  },
      { label: 'Insertion Sort',    fn: _bInsertion  },
      { label: 'Merge Sort',        fn: _bMerge      },
      { label: 'Quick Sort',        fn: _bQuick      },
      { label: 'Random-Quick Sort', fn: _bRQuick     },
      { label: 'Counting Sort',     fn: _bCounting   },
      { label: 'Radix Sort',        fn: _bRadix      },
    ];

    // Time-budget approach:
    //   t0 is set ONCE before the loop; wall time is read ONCE at the end.
    //   Measuring inside the loop would give 0 ms per fast rep because
    //   browsers clamp performance.now() to ~1 ms for security. Measuring
    //   the whole block accumulates enough wall time to produce a real average:
    //     Counting Sort at 0.001 ms/rep × 2000 reps → total ≈ 40 ms
    //     → avgMs = 40 / 2000 = 0.020 ms  (not 0.000)
    //   Slow algorithms (Bubble) exhaust the budget in 1–2 reps and still
    //   yield an accurate per-sort average.
    const BUDGET   = 40;   // ms of wall time to spend per algorithm
    const MAX_REPS = 3000; // hard cap so extremely fast algos don't spin forever

    const results = BENCH.map(b => {
      // Throw-away warm-up run primes the JIT compiler before timing starts
      b.fn([...benchDataset]);

      let reps = 0, comps = 0, swaps = 0;
      const t0 = performance.now(); // single start timestamp

      while (reps < MAX_REPS) {
        const copy = [...benchDataset];
        const res  = b.fn(copy);
        comps = res.comps;
        swaps = res.swaps;
        reps++;
        if (performance.now() - t0 >= BUDGET) break;
      }

      const avgMs = (performance.now() - t0) / reps; // single end read
      return { label: b.label, time: avgMs, comps, swaps, reps };
    });

    _compareRunning = false;

    // ── Render overlay ─────────────────────────────────────────
    const overlay = _el('compare-overlay');
    if (!overlay) return;

    // Sort by time; use comparison count as a deterministic tiebreaker
    // so the ranking never flips arbitrarily between identical times.
    const ranked = [...results].sort((a, b) =>
      a.time !== b.time ? a.time - b.time : a.comps - b.comps
    );

    const maxTime  = ranked[ranked.length - 1].time || 1;
    const maxComps = Math.max(...ranked.map(r => r.comps)) || 1;

    // Only rank #1 gets the "fastest" badge — guaranteed exactly one.
    const rows = ranked.map((r, rank) => {
      const pct     = Math.max(2, (r.time  / maxTime)  * 100);
      const compPct = Math.max(2, (r.comps / maxComps) * 100);
      const isFastest = rank === 0;
      return `
        <tr class="${isFastest ? 'cmp-row cmp-best' : 'cmp-row'}">
          <td class="cmp-rank">${rank + 1}</td>
          <td class="cmp-name">${r.label}${isFastest ? ' <span class="cmp-badge">fastest</span>' : ''}</td>
          <td class="cmp-time">${r.time < 0.001 ? r.time.toFixed(4) : r.time.toFixed(3)}</td>
          <td class="cmp-bar-cell">
            <div class="cmp-bar-wrap"><div class="cmp-bar" style="width:${pct.toFixed(1)}%"></div></div>
          </td>
          <td class="cmp-num">${r.comps.toLocaleString()}</td>
          <td class="cmp-bar-cell">
            <div class="cmp-bar-wrap"><div class="cmp-bar cmp-bar-comps" style="width:${compPct.toFixed(1)}%"></div></div>
          </td>
          <td class="cmp-num">${r.swaps.toLocaleString()}</td>
        </tr>`;
    }).join('');

    _el('compare-subtitle').textContent =
      `Benchmark size: ${BENCH_SIZE.toLocaleString()} elements  ·  Type: ${State.dataset}  ·  avg time per sort (wall-clock ÷ reps)  ·  Fastest → Slowest`;

    _el('compare-tbody').innerHTML = rows;
    overlay.style.display = 'flex';
  }

  /* ── Public API ─────────────────────────────────────────────── */

  function generate() {
    // Stop any running animation before generating a new dataset
    State.cancel  = true;
    State.running = false;
    State.paused  = false;
    setTimeout(() => {
      State.cancel = false;
      arr = makeDataset(State.size, State.dataset);
      comparing = new Set(); swapping = new Set(); sorted = new Set();
      resetStats(); updateMetrics(); clearLog();
      resize(); draw();
      setStatus(`${arr.length} elements generated (${State.dataset}).`);
      addLog(`Generated ${arr.length}-element ${State.dataset} dataset.`, 'info');
    }, 20);
  }

  async function run() {
    const fn = FN[State.algo];
    if (!fn) return;
    if (!arr.length) { generate(); await sleep(60); }

    // If already running, toggle pause
    if (State.running) {
      State.paused = !State.paused;
      setRunBtn(!State.paused);
      setStatus(State.paused ? 'Paused' : 'Running...', State.paused ? 'idle' : 'running');
      return;
    }

    State.running = true;
    State.cancel  = false;
    State.paused  = false;
    sorted = new Set(); comparing = new Set(); swapping = new Set();
    resetStats();
    State.startTime = performance.now();
    setRunBtn(true);
    clearLog();
    addLog(`Starting ${State.algo} on ${arr.length} elements.`, 'info');
    setStatus('Running...', 'running');

    await fn();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    State.running   = false;

    if (!State.cancel) {
      comparing = new Set(); swapping = new Set();
      sorted    = new Set(arr.map((_, i) => i));
      if (State.totalSteps > 0) State.steps = State.totalSteps;
      draw(); updateMetrics();
      setRunBtn(false);
      const msg = `Done. ${fmtNum(State.comps)} comparisons, ${fmtNum(State.swaps)} swaps, ${State.elapsedMs.toFixed(1)} ms.`;
      setStatus(msg, 'done');
      addLog(msg, 'done');
    }
  }

  function init() {
    // Wire the dataset-type dropdown; actual generation is triggered by switchSection
    const typeSelect = _el('type-select');
    if (typeSelect) typeSelect.addEventListener('change', function() {
      State.dataset = this.value;
      if (!State.running) generate();
    });
  }

  return { init, generate, run, redraw: draw, compareAll };
})();
