'use strict';

const SortModule = (() => {

  const canvas = _el('vis-canvas');
  const ctx    = canvas.getContext('2d');

  let arr       = [];
  let comparing = new Set();
  let swapping  = new Set();
  let sorted    = new Set();

  /* ── Bar style & display options ────────────────────────────── */
  // These read live from the DOM so changing the dropdown updates instantly
  function getBarStyle() {
    return document.getElementById('bar-style-select')?.value || 'solid';
  }
  function getShowValues() {
    return document.getElementById('show-values-toggle')?.checked !== false;
  }

  /* ── Colors ─────────────────────────────────────────────────── */
  const COL = {
    bar:     '#c5cad8',
    compare: '#2196f3',
    swap:    '#ff9800',
    sorted:  '#4caf50',
    pivot:   '#9c27b0',
  };

  /* ── Resize + draw ──────────────────────────────────────────── */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width  = r.width;
    canvas.height = r.height;
  }

  window.addEventListener('resize', () => { resize(); draw(); });

  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;
    
    const vizType = State.vizType || 'bar';
    const compareList = Array.from(comparing);
    const swapList = Array.from(swapping);
    
    // Use the appropriate visualization function
    if (vizType === 'line') {
      Visualizations.drawLineGraph(ctx, arr, W, H, {
        comparisons: compareList,
        swaps: swapList,
        active: swapping.size > 0 ? swapping : comparing,
        sorted: sorted
      });
    } else if (vizType === 'scatter') {
      Visualizations.drawScatterPlot(ctx, arr, W, H, {
        comparisons: compareList,
        swaps: swapList,
        active: swapping.size > 0 ? swapping : comparing,
        sorted: sorted
      });
    } else if (vizType === 'pie') {
      Visualizations.drawCircularChart(ctx, arr, W, H, {
        comparisons: compareList,
        swaps: swapList,
        active: swapping.size > 0 ? swapping : comparing,
        sorted: sorted
      });
    } else if (vizType === 'bubble') {
      Visualizations.drawBubbleChart(ctx, arr, W, H, {
        comparisons: compareList,
        swaps: swapList,
        active: swapping.size > 0 ? swapping : comparing,
        sorted: sorted
      });
    } else if (vizType === 'histogram') {
      Visualizations.drawHistogram(ctx, arr, W, H, {
        comparisons: compareList,
        swaps: swapList,
        active: swapping.size > 0 ? swapping : comparing,
        sorted: sorted
      });
    } else {
      // Default bar chart
      drawBarsDefault();
    }
  }

  function drawBarsDefault() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!arr.length) return;

    const style    = getBarStyle();
    const showVals = getShowValues();
    const n    = arr.length;
    const maxV = Math.max(...arr) || 1;
    const gap  = n > 150 ? 0 : n > 80 ? 0.5 : 1;
    const bw   = (W - gap * (n - 1)) / n;
    const padT = 24;
    const usableH = H - padT - 4;

    for (let i = 0; i < n; i++) {
      const x  = i * (bw + gap);
      const bh = Math.max(2, (arr[i] / maxV) * usableH);
      const y  = H - bh - 4;

      // Determine base color
      let baseColor = COL.bar;
      if (sorted.has(i))                              baseColor = COL.sorted;
      if (swapping.has(i))                            baseColor = COL.swap;
      if (comparing.has(i) && !swapping.has(i))      baseColor = COL.compare;

      // Apply style
      if (style === 'gradient') {
        const grad = ctx.createLinearGradient(x, y, x, H - 4);
        grad.addColorStop(0, lighten(baseColor, 0.35));
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = baseColor;
      }

      // Draw bar shape
      if (style === 'outlined') {
        // Hollow outline only
        ctx.strokeStyle = baseColor;
        ctx.lineWidth   = bw >= 4 ? 1.5 : 1;
        ctx.fillStyle   = baseColor + '22';
        if (bw >= 2) {
          const rad = Math.min(2, bw * 0.3);
          roundRect(ctx, x, y, bw, bh, rad);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, Math.max(1, bw), bh);
        }
      } else {
        if (bw >= 2) {
          const rad = Math.min(2, bw * 0.3);
          roundRect(ctx, x, y, bw, bh, rad);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, Math.max(1, bw), bh);
        }
      }

      // Value labels
      if (showVals && bw >= 16 && n <= 60) {
        ctx.fillStyle = (swapping.has(i) || comparing.has(i)) ? '#fff' : '#8892aa';
        ctx.font = `${Math.min(11, bw * 0.65)}px Source Code Pro, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(arr[i], x + bw / 2, y - 2);
      }
    }
  }

  // Helpers
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

  function lighten(hex, amt) {
    // Simple hex lighten by blending toward white
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const lr = Math.round(r + (255-r)*amt), lg = Math.round(g + (255-g)*amt), lb = Math.round(b + (255-b)*amt);
    return `rgb(${lr},${lg},${lb})`;
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  async function cmp(i, j) {
    comparing = new Set([i, j]);
    State.comps++; State.steps++;
    draw(); updateMetrics();
    await sleep(speedDelay());
    comparing.clear();
    return arr[i] > arr[j];
  }

  async function swap(i, j) {
    swapping = new Set([i, j]);
    [arr[i], arr[j]] = [arr[j], arr[i]];
    State.swaps++;
    draw(); updateMetrics();
    addLog(`Swap [${i}]=${arr[i]} with [${j}]=${arr[j]}`, 'swap');
    await sleep(speedDelay());
    swapping.clear();
  }

  async function highlight(indices) {
    comparing = new Set(indices);
    draw();
    await sleep(speedDelay());
    comparing.clear();
  }

  /* ── Algorithms ─────────────────────────────────────────────── */

  async function bubbleSort() {
    const n = arr.length;
    State.totalSteps = n * n;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (State.cancel) return;
        while (State.paused && !State.cancel) await sleep(50);
        const gt = await cmp(j, j + 1);
        if (gt) { await swap(j, j + 1); swapped = true; }
      }
      sorted.add(n - i - 1);
      if (!swapped) {
        for (let k = 0; k <= n - i - 2; k++) sorted.add(k);
        break;
      }
    }
    sorted = new Set(arr.map((_, i) => i));
  }

  async function selectionSort() {
    const n = arr.length;
    State.totalSteps = n * n / 2;
    for (let i = 0; i < n - 1; i++) {
      let mi = i;
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
    State.totalSteps = n;
    sorted.add(0);
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
        else { arr[k++] = R[j++]; State.swaps++; }
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
      }
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
    State.totalSteps = n * Math.ceil(Math.log2(n + 1));

    async function partition(lo, hi) {
      const pivot = arr[hi];
      swapping = new Set([hi]);
      draw(); await sleep(speedDelay());
      swapping.clear();
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (State.cancel) return lo;
        while (State.paused && !State.cancel) await sleep(50);
        comparing = new Set([j, hi]);
        State.comps++; State.steps++;
        draw(); updateMetrics();
        await sleep(speedDelay());
        comparing.clear();
        if (arr[j] <= pivot) {
          i++;
          if (i !== j) { await swap(i, j); }
        }
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

  async function randomQuickSort() {
    const n = arr.length;
    State.totalSteps = n * Math.ceil(Math.log2(n + 1));

    async function partition(lo, hi) {
      const r = rand(lo, hi);
      if (r !== hi) await swap(r, hi);
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
    const n = arr.length;
    const max = Math.max(...arr);
    State.totalSteps = n + max;
    const cnt = new Array(max + 1).fill(0);

    for (let i = 0; i < n; i++) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);
      comparing = new Set([i]); State.comps++; State.steps++;
      draw(); updateMetrics();
      await sleep(speedDelay());
      cnt[arr[i]]++;
      comparing.clear();
    }

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
    const max = Math.max(...arr);
    const digits = String(max).length;
    State.totalSteps = arr.length * digits;
    let exp = 1;

    while (Math.floor(max / exp) > 0) {
      const buckets = Array.from({ length: 10 }, () => []);
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

  const FN = {
    bubble: bubbleSort, selection: selectionSort, insertion: insertionSort,
    merge: mergeSort, quick: quickSort, rquick: randomQuickSort,
    counting: countingSort, radix: radixSort,
  };

  /* ── Public API ─────────────────────────────────────────────── */
  function generate() {
    // Called either from switchSection (already cancelled) or button press
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
    setStatus(`Running...`, 'running');

    await fn();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    State.running   = false;

    if (!State.cancel) {
      comparing = new Set(); swapping = new Set();
      sorted = new Set(arr.map((_, i) => i));
      draw(); updateMetrics();
      setRunBtn(false);
      const msg = `Done. ${fmtNum(State.comps)} comparisons, ${fmtNum(State.swaps)} swaps, ${State.elapsedMs.toFixed(1)} ms.`;
      setStatus(msg, 'done');
      addLog(msg, 'done');
    }
  }

  function init() {
    // Wire up dataset type select (event listener only; generate called by switchSection)
    const typeSelect = _el('type-select');
    if (typeSelect) typeSelect.addEventListener('change', function() {
      State.dataset = this.value;
      if (!State.running) generate();
    });
  }

  return { init, generate, run, redraw: draw };
})();