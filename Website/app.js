/* ═══════════════════════════════════════════════════════════════════
   app.js — Main application controller
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── SECTION SWITCHING ────────────────────────────────────────────────
  const SECTIONS = {
    sort: { view: 'sorting-section', algos: ['bubble','selection','insertion','merge','quick','rquick','counting','radix'] },
    mst:  { view: 'mst-section',     algos: ['kruskal','prim'] },
    rec:  { view: 'rec-section',     algos: ['factorial','fibonacci','fib_memo','hanoi','gcd','bsearch'] },
  };

  function switchSection(key) {
    // Cancel running
    if (State.running) {
      State.cancel = true; State.running = false; State.paused = false;
      updatePlayBtn(false);
    }
    State.section = key;
    State.algo = SECTIONS[key].algos[0];

    // Update tab buttons
    document.querySelectorAll('.section-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.section === key);
    });

    // Show/hide canvas elements
    const sortCanvas = document.getElementById('sort-canvas');
    const mstCanvas  = document.getElementById('mst-canvas');
    const recOutput  = document.getElementById('rec-output');
    if (sortCanvas) sortCanvas.style.display = key === 'sort' ? 'block' : 'none';
    if (mstCanvas)  mstCanvas.style.display  = key === 'mst'  ? 'block' : 'none';
    if (recOutput)  { recOutput.style.display = key === 'rec'  ? 'flex' : 'none'; }

    // MST controls overlay
    const mstControls = document.getElementById('mst-controls-overlay');
    if (mstControls) mstControls.style.display = key === 'mst' ? 'flex' : 'none';

    // Update sidebar algo list
    renderAlgoList(key);
    selectAlgo(SECTIONS[key].algos[0], key);

    // Show/hide right panel MST result
    const mstResultSection = document.getElementById('mst-result-section');
    if (mstResultSection) mstResultSection.style.display = key === 'mst' ? 'block' : 'none';

    // Show/hide B input in rec
    const bWrap = document.getElementById('rec-b-wrap');
    if (bWrap) bWrap.style.display = key === 'rec' ? 'flex' : 'none';

    // Prim start select
    const primWrap = document.getElementById('prim-start-wrap');
    if (primWrap) primWrap.style.display = key === 'mst' && State.algo === 'prim' ? 'flex' : 'none';

    resetStats(); updateMetrics(); clearLog();
    setStatus('Ready');
  }

  // ── ALGO LIST RENDER ─────────────────────────────────────────────────
  const ALGO_NAMES = {
    bubble:    'Bubble Sort',
    selection: 'Selection Sort',
    insertion: 'Insertion Sort',
    merge:     'Merge Sort',
    quick:     'Quick Sort',
    rquick:    'Random-Quick Sort',
    counting:  'Counting Sort',
    radix:     'Radix Sort',
    kruskal:   "Kruskal's",
    prim:      "Prim's",
    factorial: 'Factorial',
    fibonacci: 'Fibonacci (Naive)',
    fib_memo:  'Fibonacci (Memo)',
    hanoi:     'Tower of Hanoi',
    gcd:       'GCD (Euclidean)',
    bsearch:   'Binary Search',
  };

  const ALGO_DESC = {
    bubble:    'Compare & swap adjacent pairs',
    selection: 'Find min, place at front each pass',
    insertion: 'Build sorted prefix, insert key',
    merge:     'Divide, sort halves, merge O(n log n)',
    quick:     'Partition around pivot, recurse',
    rquick:    'Quick Sort with random pivot',
    counting:  'Count frequencies, non-comparison',
    radix:     'Sort digit by digit, LSD',
    kruskal:   'Sort edges, add if no cycle (Union-Find)',
    prim:      'Grow MST greedily from start vertex',
    factorial: 'n! = n × (n-1) × … × 1',
    fibonacci: 'fib(n) = fib(n-1) + fib(n-2), O(2^n)',
    fib_memo:  'Fibonacci with memoization, O(n)',
    hanoi:     'Move n disks, 2^n - 1 moves',
    gcd:       'gcd(a,b) = gcd(b, a mod b)',
    bsearch:   'Halve search space each call, O(log n)',
  };

  function renderAlgoList(section) {
    const list = document.getElementById('algo-list');
    if (!list) return;
    list.innerHTML = '';
    for (const key of SECTIONS[section].algos) {
      const div = document.createElement('div');
      div.className = 'algo-item';
      div.dataset.algo = key;
      div.innerHTML = `<span class="algo-dot"></span>${ALGO_NAMES[key] || key}`;
      div.addEventListener('click', () => selectAlgo(key, section));
      list.appendChild(div);

      const desc = document.createElement('div');
      desc.className = 'algo-desc';
      desc.textContent = ALGO_DESC[key] || '';
      list.appendChild(desc);
    }
  }

  function selectAlgo(key, section) {
    State.algo = key;
    document.querySelectorAll('.algo-item').forEach(el => {
      el.classList.toggle('active', el.dataset.algo === key);
    });

    // Update complexity display if sorting
    if (section === 'sort' || State.section === 'sort') {
      SortModule.updateComplexity(key);
    }

    // Prim start select visibility
    const primWrap = document.getElementById('prim-start-wrap');
    if (primWrap) primWrap.style.display = (key === 'prim') ? 'flex' : 'none';

    // B input for rec algos that need it
    const bWrap = document.getElementById('rec-b-wrap');
    const bLabel = document.getElementById('rec-b-label');
    if (bWrap && State.section === 'rec') {
      const meta = { gcd: {hasB:true,bLabel:'b value'}, bsearch: {hasB:true,bLabel:'target'} };
      const m = meta[key];
      bWrap.style.display = m ? 'flex' : 'none';
      if (bLabel && m) bLabel.textContent = m.bLabel + ':';
    }

    // Update header algo display
    const algoDisplay = document.getElementById('algo-display');
    if (algoDisplay) algoDisplay.textContent = ALGO_NAMES[key] || key;
  }

  // ── CONTROLS WIRING ──────────────────────────────────────────────────
  // Section tabs
  document.querySelectorAll('.section-tab').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  // Play/Run button
  document.getElementById('run-btn')?.addEventListener('click', () => {
    if (State.section === 'sort') SortModule.run();
    else if (State.section === 'mst') MSTModule.run();
    else if (State.section === 'rec') RecModule.run();
  });

  // Step button (pause then advance one tick)
  document.getElementById('step-btn')?.addEventListener('click', () => {
    if (!State.running) {
      if (State.section === 'sort') SortModule.run();
      else if (State.section === 'mst') MSTModule.run();
      else if (State.section === 'rec') RecModule.run();
      State.paused = true;
      updatePlayBtn(false);
    } else {
      State.paused = false;
      setTimeout(() => { State.paused = true; }, speedDelay() * 2 || 100);
    }
  });

  // Reset button
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    if (State.section === 'sort')      SortModule.reset();
    else if (State.section === 'mst')  { State.cancel=true; setTimeout(()=>{MSTModule.resetGraph(); State.cancel=false;},50); }
    else if (State.section === 'rec')  RecModule.reset();
    updatePlayBtn(false);
  });

  // Generate
  document.getElementById('gen-btn')?.addEventListener('click', () => {
    if (State.section === 'sort') SortModule.generate();
    else if (State.section === 'mst') {
      const n = parseInt(document.getElementById('size-input')?.value || '7');
      MSTModule.randomGraph(clamp(n, 4, 12));
    } else if (State.section === 'rec') {
      clearLog();
      const trace = document.getElementById('rec-trace');
      if (trace) trace.innerHTML = '<span style="color:#475569;font-family:var(--mono)">Ready — click ▶ Run</span>';
    }
  });

  // Size slider
  const sizeSlider = document.getElementById('size-slider');
  const sizeDisplay = document.getElementById('size-display');
  sizeSlider?.addEventListener('input', () => {
    State.size = parseInt(sizeSlider.value);
    if (sizeDisplay) sizeDisplay.textContent = State.size;
    if (!State.running && State.section === 'sort') SortModule.generate();
  });

  // Speed slider
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  speedSlider?.addEventListener('input', () => {
    State.speed = parseInt(speedSlider.value);
    if (speedDisplay) speedDisplay.textContent = State.speed;
  });

  // Dataset type
  document.getElementById('dataset-select')?.addEventListener('change', function() {
    State.dataset = this.value;
    if (!State.running && State.section === 'sort') SortModule.generate();
  });

  // Log clear
  document.getElementById('log-clear-btn')?.addEventListener('click', clearLog);

  // MST specific
  document.getElementById('mst-random-btn')?.addEventListener('click', () => {
    const n = clamp(parseInt(sizeSlider?.value || '7'), 4, 12);
    MSTModule.randomGraph(n);
  });
  document.getElementById('mst-clear-btn')?.addEventListener('click', () => MSTModule.clearGraph());
  document.getElementById('mst-reset-btn2')?.addEventListener('click', () => MSTModule.resetGraph());

  // ── INIT ──────────────────────────────────────────────────────────────
  switchSection('sort');
  SortModule.init();
  MSTModule.init();
  RecModule.init();

  // Initial status
  setStatus('Ready — select an algorithm and click ▶ Run');

  // Metrics auto-update ticker
  setInterval(() => {
    if (State.running && State.startTime) updateMetrics();
  }, 100);
});
