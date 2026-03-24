/* ════════════════════════════════════════════════════════════════════
   mst.js — Part 2: MST Simulation (Kruskal's & Prim's)

   Data Structures used:
   - Adjacency List   : { vertex → [(neighbor, weight)] }
   - Union-Find (DSU) : Disjoint Set Union with path compression + union by rank
   - Min-Heap (sorted array) : priority queue for Prim's algorithm
   - Edge List        : sorted array of {u, v, w} for Kruskal's
   ════════════════════════════════════════════════════════════════════ */

const MSTModule = (() => {

  /* ══════════════════════════════════════════════════════════════════
     DATA STRUCTURE 1: UNION-FIND (Disjoint Set Union)
     Used by Kruskal's to detect cycles in O(α(n)) ≈ O(1) amortized.

     Operations:
       find(x)    → returns root of x's component (with path compression)
       union(x,y) → merges components of x and y (by rank to keep tree flat)
     ══════════════════════════════════════════════════════════════════ */
  class UnionFind {
    constructor(n) {
      this.parent = Array.from({ length: n }, (_, i) => i); // each node is its own root
      this.rank   = new Array(n).fill(0);                   // used to keep tree shallow
    }

    /** Path compression: make every node on the path point directly to root */
    find(x) {
      if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
      return this.parent[x];
    }

    /**
     * Union by rank: attach smaller tree under root of taller tree.
     * Returns false if x and y are already in the same set (cycle detected).
     */
    union(x, y) {
      const rx = this.find(x), ry = this.find(y);
      if (rx === ry) return false; // same component → adding edge = cycle
      if (this.rank[rx] < this.rank[ry]) { this.parent[rx] = ry; }
      else if (this.rank[rx] > this.rank[ry]) { this.parent[ry] = rx; }
      else { this.parent[ry] = rx; this.rank[rx]++; }
      return true;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     DATA STRUCTURE 2: ADJACENCY LIST
     Graph stored as Map<vertex → [{v, w, idx}]>
     Space: O(V + E), Lookup: O(degree(v))
     ══════════════════════════════════════════════════════════════════ */
  function buildAdjList(nodes, edges) {
    const adj = new Map(nodes.map((_, i) => [i, []]));
    edges.forEach((e, idx) => {
      adj.get(e.u).push({ v: e.v, w: e.w, idx });
      adj.get(e.v).push({ v: e.u, w: e.w, idx });
    });
    return adj;
  }

  /* ── INPUT VALIDATION ────────────────────────────────────────────── */
  function validateGraph(nodes, edges) {
    if (nodes.length < 2) throw new Error('Need at least 2 nodes.');
    for (const e of edges) {
      if (e.u < 0 || e.u >= nodes.length || e.v < 0 || e.v >= nodes.length)
        throw new Error(`Edge (${e.u}--${e.v}) references invalid node.`);
      if (e.u === e.v) throw new Error(`Self-loop on node ${e.u}.`);
      if (e.w <= 0)    throw new Error(`Weight must be > 0, got ${e.w} on (${e.u}--${e.v}).`);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     KRUSKAL'S ALGORITHM
     Data structures: Edge List (sorted) + Union-Find
     Time: O(E log E) — dominated by sorting
     ══════════════════════════════════════════════════════════════════ */
  function kruskalSteps(nodes, edges) {
    validateGraph(nodes, edges);
    const n          = nodes.length;
    const uf         = new UnionFind(n);
    const sorted     = [...edges].sort((a, b) => a.w - b.w); // sort edge list by weight
    const mstEdges   = [];
    const steps      = [];
    const log        = [];

    log.push(`<span class="out-hi">Graph Structure — Adjacency List:</span>`);
    const adj = buildAdjList(nodes, edges);
    adj.forEach((nbrs, v) => {
      log.push(`<span class="out-dim">  Node ${v} → [${nbrs.map(n=>`${n.v}(w=${n.w})`).join(', ')}]</span>`);
    });
    log.push('');
    log.push(`<span class="out-hi">Edge List — sorted by weight (ascending):</span>`);
    sorted.forEach(e => log.push(`<span class="out-dim">  (${e.u}--${e.v}, w=${e.w})</span>`));
    log.push('');
    log.push(`<span class="out-hi">Edge Selection + Cycle Detection (Union-Find):</span>`);
    steps.push({ type: 'init', log: [...log], edgeStates: {}, nodeVisited: {} });

    for (const e of sorted) {
      const edgeStates = Object.fromEntries(edges.map((_, i) => [i, edges[i]._state || 'normal']));
      edgeStates[e._idx] = 'active';

      const added = uf.union(e.u, e.v);
      if (added) {
        mstEdges.push(e);
        edgeStates[e._idx] = 'mst';
        log.push(`<span class="out-add">  ✓ (${e.u}--${e.v}, w=${e.w})  ADDED — MST formation grows</span>`);
      } else {
        edgeStates[e._idx] = 'rejected';
        log.push(`<span class="out-skip">  ✗ (${e.u}--${e.v}, w=${e.w})  SKIPPED — find(${e.u})==find(${e.v}) → cycle detected</span>`);
      }
      // persist chosen states
      Object.entries(edgeStates).forEach(([i, s]) => { if (edges[i]) edges[i]._state = s; });
      steps.push({ type: 'edge', log: [...log], edgeStates: { ...edgeStates }, added, edge: e });
      if (mstEdges.length === n - 1) break;
    }

    const cost = mstEdges.reduce((s, e) => s + e.w, 0);
    log.push('');
    log.push(`<span class="out-hi">Edges selected for MST:</span>`);
    mstEdges.forEach(e => log.push(`<span class="out-add">  ${e.u} -- ${e.v}  (weight ${e.w})</span>`));
    log.push(`<span class="out-hi">Total MST Cost = ${cost}</span>`);
    steps.push({ type: 'done', log: [...log], cost, mstResult: mstEdges });
    return { steps, cost, mstResult: mstEdges };
  }

  /* ══════════════════════════════════════════════════════════════════
     PRIM'S ALGORITHM
     Data structures: Adjacency List + Min-Heap (simulated via sorted array)
     Time: O(E log V) with binary heap
     ══════════════════════════════════════════════════════════════════ */
  function primSteps(nodes, edges, startNode = 0) {
    validateGraph(nodes, edges);
    const adj      = buildAdjList(nodes, edges);
    const visited  = new Set();
    const mstEdges = [];
    const steps    = [];
    const log      = [];

    log.push(`<span class="out-hi">Graph Structure — Adjacency List:</span>`);
    adj.forEach((nbrs, v) => {
      log.push(`<span class="out-dim">  Node ${v} → [${nbrs.map(n=>`${n.v}(w=${n.w})`).join(', ')}]</span>`);
    });
    log.push('');
    log.push(`<span class="out-hi">Starting vertex: ${startNode}</span>`);
    log.push(`<span class="out-hi">Growing MST step by step:</span>`);
    steps.push({ type: 'init', log: [...log], edgeStates: {}, nodeVisited: {} });

    /* ── Min-Heap (priority queue via sorted array) ────────────────── */
    // Each entry: { w, from, to, eidx }
    const heap = [{ w: 0, from: null, to: startNode, eidx: -1 }];
    const heapPush = item => { heap.push(item); heap.sort((a, b) => a.w - b.w); };

    let stepNum = 0;
    while (heap.length) {
      const { w, from, to, eidx } = heap.shift(); // pop minimum
      if (visited.has(to)) continue;
      visited.add(to);

      const edgeStates = Object.fromEntries(edges.map((e, i) => [i, e._state || 'normal']));
      if (from !== null) {
        mstEdges.push({ u: from, v: to, w, eidx });
        edgeStates[eidx] = 'mst';
        edges[eidx]._state = 'mst';
        stepNum++;
        log.push(`<span class="out-add">  Step ${stepNum}: Add (${from}--${to}, w=${w})</span>`);
        log.push(`<span class="out-dim">  Visited: {${[...visited].sort((a,b)=>a-b).join(', ')}}</span>`);
      } else {
        log.push(`<span class="out-hi">  Starting at node ${to} — push all its edges into min-heap</span>`);
      }

      const nodeVisited = Object.fromEntries([...visited].map(v => [v, true]));
      steps.push({ type: from === null ? 'init2' : 'edge', log: [...log], edgeStates: { ...edgeStates }, nodeVisited: { ...nodeVisited } });

      for (const nb of (adj.get(to) || [])) {
        if (!visited.has(nb.v)) heapPush({ w: nb.w, from: to, to: nb.v, eidx: nb.idx });
      }
    }

    const cost = mstEdges.reduce((s, e) => s + e.w, 0);
    log.push('');
    log.push(`<span class="out-hi">Edges selected for MST:</span>`);
    mstEdges.forEach(e => log.push(`<span class="out-add">  ${e.u} -- ${e.v}  (weight ${e.w})</span>`));
    log.push(`<span class="out-hi">Total MST Cost = ${cost}</span>`);
    steps.push({ type: 'done', log: [...log], cost, mstResult: mstEdges });
    return { steps, cost, mstResult: mstEdges };
  }

  /* ── CANVAS STATE ────────────────────────────────────────────────── */
  const canvas   = document.getElementById('mst-canvas');
  const ctx      = canvas.getContext('2d');
  let mstNodes   = [];    // [{x, y, visited}]
  let mstEdges   = [];    // [{u, v, w, _state, _idx}]
  let mstSelected = null;
  let mstSteps   = [], mstStepIdx = 0, mstPlaying = false;

  const ECOL = { normal: '#CBD5E1', mst: '#4ECDC4', rejected: '#FCA5A5', active: '#FF6B6B' };
  const NCOL = { normal: '#1E1B4B', visited: '#4ECDC4', start: '#A855F7' };

  function resizeMST() {
    const w = canvas.parentElement.clientWidth;
    canvas.width  = Math.min(w - 4, 960);
    canvas.height = clamp(Math.round(window.innerHeight * 0.42), 320, 480);
    drawMST();
  }
  window.addEventListener('resize', resizeMST);

  function drawMST() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const startNode = parseInt(document.getElementById('prim-start').value) || 0;

    // draw edges
    for (const e of mstEdges) {
      const u = mstNodes[e.u], v = mstNodes[e.v];
      if (!u || !v) continue;
      const col = ECOL[e._state] || ECOL.normal;
      ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = col;
      ctx.lineWidth   = e._state === 'mst' ? 4 : e._state === 'active' ? 3 : 1.8;
      ctx.setLineDash(e._state === 'rejected' ? [6, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // weight label
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(mx, my, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#1E1B4B';
      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.w, mx, my);
    }

    // draw nodes
    for (let i = 0; i < mstNodes.length; i++) {
      const n = mstNodes[i];
      const isSelected = mstSelected === i;
      ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = n.visited ? NCOL.visited : i === startNode ? NCOL.start : NCOL.normal;
      ctx.fill();
      if (isSelected) { ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 4; ctx.stroke(); }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Fredoka One, cursive';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i, n.x, n.y);
    }
  }

  canvas.addEventListener('click', e => {
    if (mstPlaying) return;
    const rect   = canvas.getBoundingClientRect();
    const sx     = canvas.width  / rect.width;
    const sy     = canvas.height / rect.height;
    const cx     = (e.clientX - rect.left) * sx;
    const cy     = (e.clientY - rect.top)  * sy;
    const hit    = mstNodes.findIndex(n => Math.hypot(n.x - cx, n.y - cy) < 22);

    if (hit >= 0) {
      if (mstSelected === null) { mstSelected = hit; }
      else if (mstSelected !== hit) {
        const dup = mstEdges.some(e => (e.u === mstSelected && e.v === hit) || (e.u === hit && e.v === mstSelected));
        if (!dup) {
          const w = rand(1, 20);
          mstEdges.push({ u: mstSelected, v: hit, w, _state: 'normal', _idx: mstEdges.length });
        }
        mstSelected = null;
      } else { mstSelected = null; }
    } else {
      if (mstNodes.length >= 15) return;
      mstNodes.push({ x: cx, y: cy, visited: false });
      updatePrimStart();
      mstSelected = null;
    }
    drawMST();
  });

  function updatePrimStart() {
    const sel = document.getElementById('prim-start');
    const cur = sel.value;
    sel.innerHTML = mstNodes.map((_, i) => `<option value="${i}">${i}</option>`).join('');
    if (parseInt(cur) < mstNodes.length) sel.value = cur;
  }

  function addRandomGraph(n) {
    clearMST();
    const W = canvas.width, H = canvas.height, pad = 55;
    for (let i = 0; i < n; i++) mstNodes.push({ x: rand(pad, W - pad), y: rand(pad, H - pad), visited: false });
    for (let i = 0; i < n - 1; i++) mstEdges.push({ u: i, v: i + 1, w: rand(1, 20), _state: 'normal', _idx: mstEdges.length });
    for (let k = 0; k < n * 2; k++) {
      const u = rand(0, n - 1), v = rand(0, n - 1);
      if (u !== v && !mstEdges.some(e => (e.u===u&&e.v===v)||(e.u===v&&e.v===u))) {
        mstEdges.push({ u, v, w: rand(1, 20), _state: 'normal', _idx: mstEdges.length });
      }
    }
    updatePrimStart(); resizeMST(); drawMST();
  }

  function clearMST() {
    mstNodes = []; mstEdges = []; mstSelected = null; mstSteps = []; mstStepIdx = 0; mstPlaying = false;
    document.getElementById('mst-output-card').style.display = 'none';
    document.getElementById('mst-step-btn').style.display   = 'none';
    document.getElementById('mst-reset-btn').style.display  = 'none';
    document.getElementById('mst-run-btn').style.display    = 'inline-flex';
    updatePrimStart(); drawMST();
  }

  function resetMSTRun() {
    mstEdges.forEach(e => { e._state = 'normal'; });
    mstNodes.forEach(n => { n.visited = false; });
    mstSteps = []; mstStepIdx = 0; mstPlaying = false;
    document.getElementById('mst-output-card').style.display = 'none';
    document.getElementById('mst-step-btn').style.display    = 'none';
    document.getElementById('mst-reset-btn').style.display   = 'none';
    document.getElementById('mst-run-btn').style.display     = 'inline-flex';
    drawMST();
  }

  function runMST() {
    if (mstNodes.length < 2) { alert('⚠️ Add at least 2 nodes!'); return; }
    if (mstEdges.length < 1) { alert('⚠️ Add some edges! (Click two nodes to connect them)'); return; }

    // reset edge states before running
    mstEdges.forEach((e, i) => { e._state = 'normal'; e._idx = i; });
    mstNodes.forEach(n => { n.visited = false; });

    const algo  = document.getElementById('mst-algo').value;
    const start = parseInt(document.getElementById('prim-start').value) || 0;
    let result;
    try {
      result = algo === 'kruskal'
        ? kruskalSteps(mstNodes, mstEdges)
        : primSteps(mstNodes, mstEdges, start);
    } catch (err) { alert('⚠️ ' + err.message); return; }

    mstSteps = result.steps; mstStepIdx = 0; mstPlaying = true;
    document.getElementById('mst-run-btn').style.display    = 'none';
    document.getElementById('mst-step-btn').style.display   = 'inline-flex';
    document.getElementById('mst-reset-btn').style.display  = 'inline-flex';
    document.getElementById('mst-output-card').style.display = 'block';
    document.getElementById('mst-algo-label').textContent   = algo === 'kruskal' ? "Kruskal's" : "Prim's";
    document.getElementById('mst-log').innerHTML    = '';
    document.getElementById('mst-result').innerHTML = '';
    document.getElementById('mst-cost').textContent  = '—';
    document.getElementById('mst-edge-count').textContent = '—';
    document.getElementById('mst-output-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    autoPlayMST();
  }

  const MST_SPEED = { 1: 1400, 2: 800, 3: 450, 4: 200, 5: 60 };

  async function autoPlayMST() {
    while (mstPlaying && mstStepIdx < mstSteps.length) {
      applyStep(mstSteps[mstStepIdx]); mstStepIdx++;
      await sleep(MST_SPEED[parseInt(document.getElementById('mst-speed').value)] || 450);
    }
    if (mstStepIdx >= mstSteps.length) { mstPlaying = false; confetti(); }
  }

  function stepMST() {
    if (mstStepIdx < mstSteps.length) { applyStep(mstSteps[mstStepIdx]); mstStepIdx++; }
  }

  function applyStep(step) {
    if (step.edgeStates) Object.entries(step.edgeStates).forEach(([i, s]) => { if (mstEdges[i]) mstEdges[i]._state = s; });
    if (step.nodeVisited) mstNodes.forEach((n, i) => { n.visited = !!step.nodeVisited[i]; });
    drawMST();
    if (step.log) { document.getElementById('mst-log').innerHTML = step.log.join('\n'); document.getElementById('mst-log').scrollTop = 9999; }
    if (step.type === 'done') {
      const lines = [`<span class="out-hi">Edges selected for MST:</span>`];
      step.mstResult.forEach(e => lines.push(`<span class="out-add">  ${e.u} -- ${e.v}  (weight ${e.w})</span>`));
      lines.push(`<span class="out-hi">Total MST Cost = ${step.cost}</span>`);
      document.getElementById('mst-result').innerHTML = lines.join('\n');
      animCounter(document.getElementById('mst-cost'), step.cost);
      animCounter(document.getElementById('mst-edge-count'), step.mstResult.length);
    }
  }

  function init() {
    setTimeout(() => { resizeMST(); addRandomGraph(6); }, 150);
  }

  return { init, addRandomGraph, clearMST, resetMSTRun, runMST, stepMST };

})();
