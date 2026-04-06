'use strict';

/* ================================================================
   mst.js — Minimum Spanning Tree Module
   Implements Kruskal's and Prim's algorithms on an interactive
   canvas graph editor. Users can add nodes and edges manually or
   generate a random connected graph.

   Algorithms : Kruskal's (Union-Find + edge sort)
                Prim's    (greedy min-heap expansion)
   Public API : { init, randomGraph, resetEdges, clearAll, run,
                  setPrimStart, redraw }
================================================================ */

const MSTModule = (() => {

  const canvas = _el('vis-canvas');
  const ctx    = canvas.getContext('2d');

  let nodes     = [];   // { x, y, label }  — graph vertices
  let edges     = [];   // { u, v, w, state } — graph edges
  let selNode   = null; // index of the first node clicked when connecting
  let primStart = 0;    // index of Prim's starting node
  let isRunning = false;

  const NODE_R = 20; // node circle radius in pixels

  // Color palette for the graph canvas
  const C = {
    nodeDefault:  '#1a2035',
    nodeInMST:    '#4caf50',
    nodeActive:   '#0097a7',
    nodeSelected: '#8b5cf6',
    edgeNormal:   '#d0d4de',
    edgeMST:      '#0097a7',
    edgeActive:   '#ff9800',
    edgeReject:   '#e0e0e0',
    labelDefault: '#6b7a99',
    labelMST:     '#0097a7',
    labelActive:  '#e65100',
  };

  /* ── Canvas resize ──────────────────────────────────────────── */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width  = r.width;
    canvas.height = r.height;
  }
  window.addEventListener('resize', () => { resize(); draw(); });

  /* ── Draw ───────────────────────────────────────────────────── */
  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!nodes.length) {
      ctx.fillStyle    = '#9aa0b0';
      ctx.font         = '13px Source Sans 3, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click "Random Graph" or click the canvas to add nodes.', W/2, H/2 - 10);
      ctx.fillText('Click two nodes to connect them with an edge.', W/2, H/2 + 14);
      return;
    }

    // ── Draw edges ──────────────────────────────────────────────
    for (const e of edges) {
      const a = nodes[e.u], b = nodes[e.v];
      if (!a || !b) continue;

      const isMST    = e.state === 'mst';
      const isActive = e.state === 'active';
      const isReject = e.state === 'reject';

      const col = isMST    ? C.edgeMST    :
                  isActive ? C.edgeActive :
                  isReject ? C.edgeReject : C.edgeNormal;
      const lw  = isMST ? 3 : isActive ? 2.5 : 1.5;

      ctx.save();
      ctx.strokeStyle  = col;
      ctx.lineWidth    = lw;
      if (isReject) ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();

      // Weight badge on the midpoint of each non-rejected edge
      if (!isReject) {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.beginPath();
        ctx.arc(mx, my, 11, 0, Math.PI * 2);
        ctx.fillStyle   = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isMST ? C.edgeMST : isActive ? C.edgeActive : '#dde0ea';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.fillStyle    = isMST ? C.labelMST : isActive ? C.labelActive : C.labelDefault;
        ctx.font         = 'bold 10px Source Code Pro, monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.w, mx, my);
      }
    }

    // ── Draw nodes ──────────────────────────────────────────────
    for (let i = 0; i < nodes.length; i++) {
      const nd     = nodes[i];
      const isSel   = selNode === i;
      const isStart = primStart === i && State.algo === 'prim';
      const inMST   = edges.some(e => (e.u === i || e.v === i) && e.state === 'mst');
      const isAct   = edges.some(e => (e.u === i || e.v === i) && e.state === 'active');

      const fill = isSel ? C.nodeSelected :
                   inMST ? C.nodeInMST    :
                   isAct ? C.nodeActive   : C.nodeDefault;

      // Soft glow ring for selected/active/MST nodes
      if (isSel || inMST || isAct) {
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, NODE_R + 6, 0, Math.PI * 2);
        ctx.fillStyle = fill + '28';
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Yellow outline marks Prim's starting node before it joins the MST
      if (isStart && !inMST) {
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, NODE_R, 0, Math.PI * 2);
        ctx.strokeStyle = '#fdd835';
        ctx.lineWidth   = 2.5;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 13px Source Code Pro, monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nd.label, nd.x, nd.y);
    }
  }

  /* ── Canvas interaction ─────────────────────────────────────── */
  // Handles node placement and edge creation via click.
  // Guard against firing when not in the MST section.
  canvas.addEventListener('click', e => {
    if (State.section !== 'mst') return;
    if (isRunning || State.running) return;

    const rect = canvas.getBoundingClientRect();
    const sx   = canvas.width  / rect.width;
    const sy   = canvas.height / rect.height;
    const cx   = (e.clientX - rect.left) * sx;
    const cy   = (e.clientY - rect.top)  * sy;

    // Check if a node was clicked (with a small hit-radius padding)
    const hit = nodes.findIndex(nd => Math.hypot(nd.x - cx, nd.y - cy) < NODE_R + 4);

    if (hit >= 0) {
      // Node clicked — either start a connection or complete one
      if (selNode === null) {
        selNode = hit; // first node selected
      } else if (selNode !== hit) {
        // Second node selected — add edge if not already connected
        const dup = edges.some(ed =>
          (ed.u === selNode && ed.v === hit) || (ed.u === hit && ed.v === selNode)
        );
        if (!dup) {
          const w = rand(1, 20);
          edges.push({ u: selNode, v: hit, w, state: 'normal' });
          addLog(`Edge ${nodes[selNode].label}–${nodes[hit].label} (w=${w}) added.`, 'info');
        }
        selNode = null;
      } else {
        selNode = null; // clicked same node — deselect
      }
    } else {
      // Empty canvas clicked — add a new node (max 12)
      if (nodes.length < 12) {
        const label = String.fromCharCode(65 + nodes.length); // A, B, C, …
        nodes.push({ x: Math.round(cx), y: Math.round(cy), label });
        updatePrimSelect();
        addLog(`Node ${label} added.`, 'info');
      }
      selNode = null;
    }
    draw();
  });

  /* ── Prim start-node dropdown ───────────────────────────────── */
  function updatePrimSelect() {
    const sel = _el('prim-start');
    if (!sel) return;
    const cur = parseInt(sel.value) || 0;
    sel.innerHTML = nodes.map((nd, i) => `<option value="${i}">Node ${nd.label}</option>`).join('');
    if (cur < nodes.length) sel.value = cur;
  }

  /* ── Union-Find (disjoint-set) ──────────────────────────────── */
  // Used by Kruskal's to detect cycles in O(α(n)) ≈ O(1) amortised.
  class UF {
    constructor(n) {
      // parent[i] = i means node i is its own root (each node starts alone)
      this.p = Array.from({ length: n }, (_, i) => i);
      // rank[i] tracks tree height to keep union by rank balanced
      this.r = new Array(n).fill(0);
    }

    // Path-compressed find: flattens the tree on the way up
    find(x) {
      if (this.p[x] !== x) this.p[x] = this.find(this.p[x]);
      return this.p[x];
    }

    // Union by rank: attach the shorter tree under the taller one
    union(x, y) {
      const rx = this.find(x), ry = this.find(y);
      if (rx === ry) return false; // already in the same set → cycle detected
      if      (this.r[rx] < this.r[ry]) this.p[rx] = ry;
      else if (this.r[rx] > this.r[ry]) this.p[ry] = rx;
      else                               { this.p[ry] = rx; this.r[rx]++; }
      return true;
    }
  }

  /* ── Kruskal's Algorithm ────────────────────────────────────── */
  async function runKruskal() {
    const n = nodes.length;
    if (n < 2 || !edges.length) {
      addLog('Need at least 2 nodes and 1 edge.', 'info');
      return;
    }

    edges.forEach(e => { e.state = 'normal'; });
    draw();

    const uf      = new UF(n);
    const byWeight = [...edges].sort((a, b) => a.w - b.w); // process cheapest first
    const mst     = [];

    State.totalSteps = edges.length;
    addLog(`Kruskal: ${edges.length} edges sorted by weight. Need ${n-1} edges for MST.`, 'info');

    for (const e of byWeight) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      e.state = 'active';
      State.steps++; updateMetrics();
      draw();
      await sleep(speedDelay() * 6);

      const la = nodes[e.u].label, lb = nodes[e.v].label;

      if (uf.union(e.u, e.v)) {
        e.state = 'mst';
        mst.push(e);
        State.comps++;
        addLog(`Add ${la}–${lb} (w=${e.w}) — no cycle. MST has ${mst.length}/${n-1} edges.`, 'add');
      } else {
        e.state = 'reject';
        addLog(`Skip ${la}–${lb} (w=${e.w}) — would create a cycle.`, 'skip');
      }
      draw();
      await sleep(speedDelay() * 3);
      if (mst.length === n - 1) break; // MST complete — stop early
    }

    // Mark any untouched edges as rejected
    edges.forEach(e => { if (e.state === 'normal') e.state = 'reject'; });
    State.steps = State.totalSteps;

    const cost = mst.reduce((s, e) => s + e.w, 0);
    draw();
    showResult(mst, cost);
    addLog(`Kruskal complete. MST cost = ${cost}.`, 'done');
    setStatus(`Kruskal done. Total MST cost = ${cost}.`, 'done');
  }

  /* ── Prim's Algorithm ───────────────────────────────────────── */
  async function runPrim() {
    const n = nodes.length;
    if (n < 2 || !edges.length) {
      addLog('Need at least 2 nodes and 1 edge.', 'info');
      return;
    }

    edges.forEach(e => { e.state = 'normal'; });
    draw();

    // Build an adjacency list for fast neighbour lookup
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e, idx) => {
      adj[e.u].push({ neighbor: e.v, w: e.w, edgeIdx: idx });
      adj[e.v].push({ neighbor: e.u, w: e.w, edgeIdx: idx });
    });

    const inTree = new Array(n).fill(false);
    const mst    = [];
    // Min-heap stored as a sorted array: { w, from, to, edgeIdx }
    // Note: sort-after-push is O(n log n) per insert, but with at most
    // 12 nodes and ~18 edges the heap stays tiny — this is intentional.
    const heap = [];
    function heapPush(entry) {
      heap.push(entry);
      heap.sort((a, b) => a.w - b.w);
    }

    inTree[primStart] = true;
    adj[primStart].forEach(nb =>
      heapPush({ w: nb.w, from: primStart, to: nb.neighbor, edgeIdx: nb.edgeIdx })
    );

    State.totalSteps = n - 1; // need exactly n-1 edges for a spanning tree
    addLog(`Prim: starting at node ${nodes[primStart].label}. Need ${n-1} edges.`, 'info');

    while (heap.length > 0 && mst.length < n - 1) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      const best = heap.shift(); // cheapest available edge

      // Skip stale heap entries whose destination is already in the tree
      if (inTree[best.to]) continue;

      edges[best.edgeIdx].state = 'active';
      State.steps++; updateMetrics();
      draw();
      await sleep(speedDelay() * 6);

      inTree[best.to] = true;
      edges[best.edgeIdx].state = 'mst';
      mst.push(edges[best.edgeIdx]);
      State.comps++;

      const la      = nodes[best.from].label, lb = nodes[best.to].label;
      const visited = nodes.filter((_, i) => inTree[i]).map(nd => nd.label).join(', ');
      addLog(`Add ${la}–${lb} (w=${best.w}). In MST: {${visited}}.`, 'add');
      draw();
      await sleep(speedDelay() * 3);

      // Push all edges from the newly added node that lead outside the tree
      adj[best.to].forEach(nb => {
        if (!inTree[nb.neighbor])
          heapPush({ w: nb.w, from: best.to, to: nb.neighbor, edgeIdx: nb.edgeIdx });
      });
    }

    edges.forEach(e => { if (e.state === 'normal') e.state = 'reject'; });
    State.steps = State.totalSteps; // mark progress bar complete

    const cost     = mst.reduce((s, e) => s + e.w, 0);
    const complete = mst.length === n - 1;
    const note     = complete ? '' : ' (graph may not be fully connected)';
    draw();
    showResult(mst, cost);
    addLog(`Prim complete. MST cost = ${cost}.${note}`, 'done');
    setStatus(`Prim done. Total MST cost = ${cost}.${note}`, 'done');
  }

  /* ── Result pane ────────────────────────────────────────────── */
  function showResult(mst, cost) {
    const body = _el('mst-result-body');
    if (!body) return;
    let html = `<div style="color:#66bb6a;font-weight:600;margin-bottom:6px;font-size:11px">Edges selected for MST:</div>`;
    mst.forEach(e => {
      const la = nodes[e.u]?.label ?? e.u;
      const lb = nodes[e.v]?.label ?? e.v;
      html += `<div style="color:#8892aa">${la} — ${lb} <span style="color:#5a6480">(weight ${e.w})</span></div>`;
    });
    html += `<div style="color:#ffb74d;font-weight:600;margin-top:8px;font-size:12px">Total MST Cost = ${cost}</div>`;
    body.innerHTML = html;
    updateMetrics();
  }

  /* ── Random graph generation ────────────────────────────────── */
  function randomGraph(n) {
    clearAll();
    resize();
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.33;

    // Place nodes evenly around a circle with a small positional jitter
    for (let i = 0; i < n; i++) {
      const angle  = (i / n) * Math.PI * 2 - Math.PI / 2;
      const jitter = n <= 5 ? 0 : 15;
      nodes.push({
        x:     Math.round(cx + (radius + (Math.random() - 0.5) * jitter) * Math.cos(angle)),
        y:     Math.round(cy + (radius + (Math.random() - 0.5) * jitter) * Math.sin(angle)),
        label: String.fromCharCode(65 + i),
      });
    }

    // Build a random spanning tree first so the graph is always connected
    const inTree  = new Set([0]);
    const shuffled = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (const i of shuffled) {
      if (inTree.has(i)) continue;
      const treeArr = [...inTree];
      const parent  = treeArr[Math.floor(Math.random() * treeArr.length)];
      edges.push({ u: parent, v: i, w: rand(1, 20), state: 'normal' });
      inTree.add(i);
    }

    // Add a handful of extra edges so the MST algorithm has meaningful choices
    const maxExtra = Math.ceil(n / 2);
    let added = 0, attempts = maxExtra * 8;
    while (attempts-- > 0 && added < maxExtra) {
      const u = rand(0, n-1), v = rand(0, n-1);
      if (u !== v && !edges.some(e => (e.u===u && e.v===v) || (e.u===v && e.v===u))) {
        edges.push({ u, v, w: rand(1, 20), state: 'normal' });
        added++;
      }
    }

    updatePrimSelect();
    draw();
    addLog(`Graph: ${n} nodes (${nodes.map(nd => nd.label).join(', ')}), ${edges.length} edges.`, 'info');
    setStatus(`Graph ready. ${n} nodes, ${edges.length} edges.`);
  }

  /* ── Control functions ──────────────────────────────────────── */

  // Resets all edge states back to 'normal' and clears the result pane.
  function resetEdges() {
    if (isRunning) return;
    edges.forEach(e => { e.state = 'normal'; });
    const body = _el('mst-result-body');
    if (body) body.innerHTML = '<span style="color:var(--text-dim);font-size:11px">Run an algorithm to see output here.</span>';
    clearLog(); resetStats(); updateMetrics();
    draw();
    setStatus('Edges reset. Ready to run.');
  }

  // Removes all nodes and edges, returning the canvas to a blank state.
  function clearAll() {
    nodes = []; edges = []; selNode = null; primStart = 0;
    const body = _el('mst-result-body');
    if (body) body.innerHTML = '<span style="color:var(--text-dim);font-size:11px">Run an algorithm to see output here.</span>';
    updatePrimSelect();
    clearLog(); resetStats(); updateMetrics();
    draw();
  }

  function setPrimStart(idx) { primStart = idx; draw(); }

  async function run() {
    if (isRunning) return;
    isRunning = true; State.running = true; State.cancel = false; State.paused = false;
    resetStats(); State.startTime = performance.now();
    clearLog(); setRunBtn(true);

    if      (State.algo === 'kruskal') await runKruskal();
    else if (State.algo === 'prim')    await runPrim();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    isRunning       = false;
    State.running   = false;
    setRunBtn(false); updateMetrics();
  }

  function init() { resize(); }

  return { init, randomGraph, resetEdges, clearAll, run, setPrimStart, redraw: draw };
})();
