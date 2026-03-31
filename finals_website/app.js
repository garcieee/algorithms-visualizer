'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Algorithm metadata ─────────────────────────────────────── */
  const ALGOS = {
    sort: [
      { key:'bubble',    label:'Bubble Sort',        desc:'Repeatedly compares and swaps adjacent elements. Early exit when no swaps occur.' },
      { key:'selection', label:'Selection Sort',      desc:'Finds the minimum in the unsorted region and places it at the front each pass.' },
      { key:'insertion', label:'Insertion Sort',      desc:'Builds a sorted prefix by inserting each element into its correct position.' },
      { key:'merge',     label:'Merge Sort',          desc:'Divide-and-conquer: recursively split, sort, then merge. Guaranteed O(n log n).' },
      { key:'quick',     label:'Quick Sort',          desc:'Partitions around a pivot. Average O(n log n), worst case O(n\u00b2) on sorted input.' },
      { key:'rquick',    label:'Random-Quick Sort',   desc:'Quick Sort with random pivot selection to avoid worst-case on sorted input.' },
      { key:'counting',  label:'Counting Sort',       desc:'Non-comparison sort. Counts element frequencies. O(n+k) time, best for small ranges.' },
      { key:'radix',     label:'Radix Sort',          desc:'Non-comparison sort. Processes digits from least to most significant. O(nk).' },
    ],
    mst: [
      { key:'kruskal', label:"Kruskal's Algorithm", desc:'Sorts all edges by weight, then greedily adds edges that do not form a cycle (Union-Find).' },
      { key:'prim',    label:"Prim's Algorithm",    desc:'Grows the MST from a starting vertex by always choosing the cheapest border edge.' },
    ],
    rec: [
      { key:'factorial', label:'Factorial',           desc:'Computes n! = n x (n-1) x ... x 1 recursively. O(n) calls, O(n) stack depth.' },
      { key:'fibonacci', label:'Fibonacci (Naive)',    desc:'Computes fib(n) with two recursive calls. O(2^n) total calls, exponential.' },
      { key:'fib_memo',  label:'Fibonacci (Memoized)', desc:'Same as Fibonacci but caches results. Reduces to O(n) calls via memoization.' },
      { key:'hanoi',     label:'Tower of Hanoi',       desc:'Moves n disks between pegs. Exactly 2^n - 1 moves required.' },
      { key:'gcd',       label:'GCD (Euclidean)',       desc:'Greatest common divisor via gcd(a,b) = gcd(b, a mod b). O(log min(a,b)).' },
      { key:'bsearch',   label:'Binary Search',         desc:'Searches a sorted array by halving the search space each call. O(log n) depth.' },
    ],
  };

  /* ── Sync speed across both sort/mst speed controls ─────────── */
  syncPair('speed-input', 'speed-range', v => { State.speed = v; });
  syncPair('speed-input-mst', 'speed-range-mst', v => { State.speed = v; });
  syncPair('rec-speed-input', 'rec-speed-range', v => { State.speed = v; });
  syncPair('size-input', 'size-range', v => {
    State.size = v;
    if (!State.running && State.section === 'sort') SortModule.generate();
  });
  syncPair('graph-size-input', 'graph-size-range', v => { /* used when generating */ });
  syncPair('rec-n-input', 'rec-n-range', v => { State.size = v; });

  /* ── Section switching ──────────────────────────────────────── */
  function switchSection(key) {
    // Hard stop anything running
    State.cancel  = true;
    State.running = false;
    State.paused  = false;
    setRunBtn(false);

    // Small delay so async loops can check cancel before we redraw
    setTimeout(() => {
      State.cancel  = false;
      State.section = key;

      // Nav tabs
      document.querySelectorAll('.nav-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.section === key)
      );

      // Settings panels
      _el('sort-settings').style.display = key === 'sort' ? '' : 'none';
      _el('mst-settings').style.display  = key === 'mst'  ? '' : 'none';
      _el('rec-settings').style.display  = key === 'rec'  ? '' : 'none';

      // Canvas vs recursion panel
      const canvas    = _el('vis-canvas');
      const recPanel  = _el('rec-panel');
      const mstHint   = _el('mst-hint');
      const mstTbar   = _el('mst-toolbar');
      const mstResult = _el('mst-result-pane');

      // Always wipe the canvas immediately
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (key === 'rec') {
        canvas.style.display = 'none';
        recPanel.classList.add('visible');
      } else {
        canvas.style.display = 'block';
        recPanel.classList.remove('visible');
      }

      mstHint.classList.toggle('visible', key === 'mst');
      mstTbar.style.display = key === 'mst' ? 'flex' : 'none';
      mstResult.classList.toggle('visible', key === 'mst');

      // Section breadcrumb
      const secLabels = { sort:'Sorting', mst:'MST', rec:'Recursion' };
      const tbSection = _el('tb-section');
      if (tbSection) tbSection.textContent = secLabels[key] || key;

      // Reset stats + log
      resetStats(); updateMetrics(); clearLog();
      setStatus('Ready');

      // Populate algo dropdown
      buildAlgoSelect(key);

      // Initialize the new section fresh
      if (key === 'sort') {
        SortModule.generate();
      } else if (key === 'mst') {
        const n = clamp(parseInt(_el('graph-size-input')?.value || '7'), 3, 12);
        MSTModule.randomGraph(n);
      } else if (key === 'rec') {
        RecModule.reset();
      }
    }, 40);
  }

  /* ── Algo select dropdown ───────────────────────────────────── */
  function buildAlgoSelect(section) {
    const sel  = _el('algo-select');
    const list = ALGOS[section] || [];
    sel.innerHTML = list.map(a =>
      `<option value="${a.key}">${a.label}</option>`
    ).join('');

    const first = list[0];
    if (first) selectAlgo(first.key, section);
    sel.value = first?.key || '';
  }

  function selectAlgo(key, section) {
    State.algo = key;
    const sec  = section || State.section;
    const meta = (ALGOS[sec] || []).find(a => a.key === key);

    // Description
    const desc = _el('algo-description');
    if (desc) desc.textContent = meta?.desc || '';

    // Breadcrumb
    const tbAlgo = _el('tb-algo');
    if (tbAlgo) tbAlgo.textContent = meta?.label || key;

    // Complexity
    updateComplexity(key);

    // Prim start node visibility
    const primWrap = _el('prim-start-wrap');
    if (primWrap) primWrap.style.display = key === 'prim' ? '' : 'none';

    // Rec second param visibility
    const bRow = _el('rec-b-row');
    if (bRow) {
      const needsB = key === 'gcd' || key === 'bsearch';
      bRow.style.display = needsB ? '' : 'none';
      const bLbl = _el('rec-b-label');
      if (bLbl) bLbl.textContent = key === 'gcd' ? 'b (second value)' : 'Target value';
    }

    // Rec n range max
    const recMaxN = { factorial:12, fibonacci:9, fib_memo:15, hanoi:7, gcd:99, bsearch:20 };
    const recRng  = _el('rec-n-range');
    const recInp  = _el('rec-n-input');
    if (recRng && recMaxN[key]) {
      recRng.max = recMaxN[key];
      if (parseInt(recInp?.value) > recMaxN[key] && recInp) recInp.value = Math.min(6, recMaxN[key]);
    }
  }

  /* ── Stop any running algo ──────────────────────────────────── */
  function stopAll() {
    State.cancel  = true;
    State.running = false;
    State.paused  = false;
    setRunBtn(false);
  }

  /* ── Keyboard shortcuts ─────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      _el('btn-run')?.click();
    }
    if (e.key === 'r' || e.key === 'R') _el('btn-reset')?.click();
    if (e.key === 'g' || e.key === 'G') _el('btn-generate')?.click();
  });

  /* ── Bar style + show values (sorting visualization options) ── */
  _el('bar-style-select')?.addEventListener('change', () => {
    if (!State.running && State.section === 'sort') SortModule.redraw();
  });
  _el('show-values-toggle')?.addEventListener('change', () => {
    if (!State.running && State.section === 'sort') SortModule.redraw();
  });

  /* ── Wire algo dropdown ─────────────────────────────────────── */
  _el('algo-select').addEventListener('change', function() {
    selectAlgo(this.value, State.section);
  });

  /* ── Wire nav tabs ──────────────────────────────────────────── */
  document.querySelectorAll('.nav-tab').forEach(btn =>
    btn.addEventListener('click', () => switchSection(btn.dataset.section))
  );

  /* ── Header buttons ─────────────────────────────────────────── */
  _el('btn-run').addEventListener('click', () => {
    if (State.running) {
      State.paused = !State.paused;
      setRunBtn(!State.paused);
      setStatus(State.paused ? 'Paused' : 'Running...', State.paused ? 'idle' : 'running');
    } else {
      if (State.section === 'sort') SortModule.run();
      else if (State.section === 'mst') MSTModule.run();
      else if (State.section === 'rec') RecModule.run();
    }
  });

  _el('btn-generate').addEventListener('click', () => {
    if (State.section === 'sort') {
      State.cancel = true; State.running = false; State.paused = false;
      setTimeout(() => { State.cancel = false; SortModule.generate(); }, 50);
    } else if (State.section === 'mst') {
      const n = clamp(parseInt(_el('graph-size-input')?.value || '7'), 3, 12);
      MSTModule.randomGraph(n);
    } else if (State.section === 'rec') {
      RecModule.reset();
    }
  });

  _el('btn-step').addEventListener('click', () => {
    if (!State.running) {
      if (State.section === 'sort') SortModule.run();
      else if (State.section === 'mst') MSTModule.run();
      else if (State.section === 'rec') RecModule.run();
      setTimeout(() => { State.paused = true; setRunBtn(false); }, speedDelay() * 3 + 20);
    } else {
      State.paused = false;
      setTimeout(() => { if (State.running) { State.paused = true; setRunBtn(false); } }, speedDelay() * 2 + 20);
    }
  });

  _el('btn-reset').addEventListener('click', () => {
    stopAll();
    setTimeout(() => {
      if (State.section === 'sort') SortModule.generate();
      else if (State.section === 'mst') MSTModule.resetEdges();
      else if (State.section === 'rec') RecModule.reset();
      resetStats(); updateMetrics(); clearLog();
      setStatus('Ready'); setRunBtn(false);
    }, 60);
  });

  /* ── Panel buttons ──────────────────────────────────────────── */
  _el('panel-generate')?.addEventListener('click', () => _el('btn-generate').click());
  _el('panel-reset')?.addEventListener('click', () => _el('btn-reset').click());

  _el('mst-panel-generate')?.addEventListener('click', () => {
    const n = clamp(parseInt(_el('graph-size-input')?.value || '7'), 3, 12);
    MSTModule.randomGraph(n);
  });
  _el('mst-panel-reset')?.addEventListener('click', () => MSTModule.resetEdges());

  _el('rec-panel-reset')?.addEventListener('click', () => RecModule.reset());

  /* ── MST toolbar buttons ────────────────────────────────────── */
  _el('mst-random')?.addEventListener('click', () => {
    const n = clamp(parseInt(_el('graph-size-input')?.value || '7'), 3, 12);
    MSTModule.randomGraph(n);
  });
  _el('mst-reset-edges')?.addEventListener('click', () => MSTModule.resetEdges());
  _el('mst-clear')?.addEventListener('click', () => MSTModule.clearAll());

  /* ── Log clear ──────────────────────────────────────────────── */
  _el('btn-log-clear')?.addEventListener('click', clearLog);

  /* ── Prim start node select ─────────────────────────────────── */
  _el('prim-start')?.addEventListener('change', function() {
    MSTModule.setPrimStart(parseInt(this.value));
  });

  /* ── Visualization type select ──────────────────────────────── */
  _el('viz-type-select')?.addEventListener('change', function() {
    State.vizType = this.value;
    // Trigger redraw
    if (State.section === 'sort') SortModule.redraw();
    else if (State.section === 'mst') MSTModule.redraw();
  });

  /* ── Metrics ticker ─────────────────────────────────────────── */
  setInterval(() => {
    if (State.running && State.startTime) updateMetrics();
  }, 120);

  /* ── Init ───────────────────────────────────────────────────── */
  SortModule.init();   // registers event listeners only
  MSTModule.init();    // registers click handler only
  RecModule.init();    // sets placeholder text
  switchSection('sort');  // triggers fresh generate + UI setup

  setStatus('Ready. Select an algorithm and click Run.');
});