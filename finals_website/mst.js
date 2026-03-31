'use strict';

const MSTModule = (() => {

  const canvas = _el('vis-canvas');
  const ctx    = canvas.getContext('2d');

  let nodes      = [];
  let edges      = [];
  let selNode    = null;
  let primStart  = 0;
  let isRunning  = false;

  /* ── Colors ─────────────────────────────────────────────────── */
  const C = {
    node:       '#1a2035',
    nodeText:   '#ffffff',
    nodeActive: '#0097a7',
    nodeMst:    '#4caf50',
    edgeNormal: '#c5cad8',
    edgeActive: '#ff9800',
    edgeMst:    '#0097a7',
    edgeReject: '#f44336',
    weightBg:   '#ffffff',
    weightBdr:  '#c5cad8',
    selected:   '#9c27b0',
  };

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width  = r.width;
    canvas.height = r.height;
  }

  window.addEventListener('resize', () => { resize(); draw(); });

  /* ── Draw ────────────────────────────────────────────────────── */
  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!nodes.length) {
      ctx.fillStyle = '#9aa0b0';
      ctx.font = '13px Source Sans 3, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click anywhere to add a node, or use "Random Graph".', W / 2, H / 2 - 10);
      ctx.fillText('Click two nodes consecutively to add an edge.', W / 2, H / 2 + 14);
      return;
    }

    // Edges
    for (const e of edges) {
      const u = nodes[e.u], v = nodes[e.v];
      if (!u || !v) continue;

      const col = e.state === 'mst'    ? C.edgeMst
                : e.state === 'active' ? C.edgeActive
                : e.state === 'reject' ? C.edgeReject
                : C.edgeNormal;
      const lw  = e.state === 'mst' || e.state === 'active' ? 2.5 : 1.5;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = col;
      ctx.lineWidth   = lw;
      if (e.state === 'reject') ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.restore();

      // Weight badge
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      const badgeR = 12;
      ctx.beginPath();
      ctx.arc(mx, my, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = e.state === 'normal' ? '#d0d4de' : col;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = e.state === 'mst'    ? '#0097a7'
                    : e.state === 'active' ? '#e65100'
                    : '#6b7a99';
      ctx.font = 'bold 10px Source Code Pro, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.w, mx, my);
    }

    // Nodes
    for (let i = 0; i < nodes.length; i++) {
      const n   = nodes[i];
      const sel = selNode === i;
      const inMst = edges.some(e => (e.u === i || e.v === i) && e.state === 'mst');
      const isAct = edges.some(e => (e.u === i || e.v === i) && e.state === 'active');
      const isPS  = (primStart === i);

      const fill = sel ? C.selected : inMst ? C.nodeMst : isAct ? C.nodeActive : C.node;

      // Halo
      if (sel || inMst || isAct || isPS) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = fill + '22';
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      if (isPS && State.algo === 'prim') {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Source Code Pro, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i, n.x, n.y);
    }
  }

  /* ── Interaction ─────────────────────────────────────────────── */
  canvas.addEventListener('click', e => {
    if (isRunning || State.running) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top)  * sy;

    const hit = nodes.findIndex(n => Math.hypot(n.x - cx, n.y - cy) < 22);
    if (hit >= 0) {
      if (selNode === null) {
        selNode = hit;
      } else if (selNode !== hit) {
        const dup = edges.some(ed =>
          (ed.u === selNode && ed.v === hit) || (ed.u === hit && ed.v === selNode)
        );
        if (!dup) {
          const w = rand(1, 20);
          edges.push({ u: selNode, v: hit, w, state: 'normal' });
          addLog(`Edge (${selNode} - ${hit}, w=${w}) added.`, 'info');
        }
        selNode = null;
      } else {
        selNode = null;
      }
    } else {
      if (nodes.length < 14) {
        nodes.push({ x: cx, y: cy });
        updatePrimSelect();
        addLog(`Node ${nodes.length - 1} added.`, 'info');
      }
      selNode = null;
    }
    draw();
  });

  function updatePrimSelect() {
    const sel = _el('prim-start');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = nodes.map((_, i) => `<option value="${i}">Node ${i}</option>`).join('');
    if (parseInt(cur) < nodes.length) sel.value = cur;
  }

  /* ── Union-Find ──────────────────────────────────────────────── */
  class UF {
    constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); this.r = new Array(n).fill(0); }
    find(x) { if (this.p[x] !== x) this.p[x] = this.find(this.p[x]); return this.p[x]; }
    union(x, y) {
      const rx = this.find(x), ry = this.find(y);
      if (rx === ry) return false;
      if (this.r[rx] < this.r[ry]) { this.p[rx] = ry; }
      else if (this.r[rx] > this.r[ry]) { this.p[ry] = rx; }
      else { this.p[ry] = rx; this.r[rx]++; }
      return true;
    }
  }

  /* ── Kruskal ─────────────────────────────────────────────────── */
  async function runKruskal() {
    if (nodes.length < 2 || !edges.length) {
      addLog('Add at least 2 nodes and some edges first.', 'info');
      return;
    }
    const n  = nodes.length;
    const uf = new UF(n);
    const se = [...edges].sort((a, b) => a.w - b.w);
    const mst = [];
    edges.forEach(e => { e.state = 'normal'; });
    draw();

    addLog(`Kruskal: sorting ${edges.length} edges by weight...`, 'info');
    for (const e of se) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      e.state = 'active';
      draw(); State.steps++; updateMetrics();
      await sleep(speedDelay() * 5);

      if (uf.union(e.u, e.v)) {
        e.state = 'mst'; mst.push(e);
        State.comps++;
        addLog(`Add edge (${e.u} - ${e.v}, w=${e.w}). MST edges: ${mst.length}.`, 'add');
      } else {
        e.state = 'reject';
        addLog(`Skip edge (${e.u} - ${e.v}, w=${e.w}). Would form a cycle.`, 'skip');
      }
      draw();
      await sleep(speedDelay() * 3);
      if (mst.length === n - 1) break;
    }

    const cost = mst.reduce((s, e) => s + e.w, 0);
    showMstResult(mst, cost);
    addLog(`Kruskal complete. MST cost = ${cost}.`, 'done');
    setStatus(`Kruskal done. MST total cost = ${cost}.`, 'done');
  }

  /* ── Prim ────────────────────────────────────────────────────── */
  async function runPrim() {
    if (nodes.length < 2 || !edges.length) {
      addLog('Add at least 2 nodes and some edges first.', 'info');
      return;
    }
    const n   = nodes.length;
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e, idx) => {
      adj[e.u].push({ v: e.v, w: e.w, idx });
      adj[e.v].push({ v: e.u, w: e.w, idx });
    });

    edges.forEach(e => { e.state = 'normal'; });
    draw();

    const visited = new Set([primStart]);
    const mst     = [];
    const heap    = adj[primStart].map(nb => ({ w: nb.w, u: primStart, v: nb.v, idx: nb.idx }));
    heap.sort((a, b) => a.w - b.w);

    addLog(`Prim: starting from node ${primStart}.`, 'info');

    while (heap.length && visited.size < n) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      const best = heap.shift();
      if (visited.has(best.v)) continue;

      edges[best.idx].state = 'active';
      draw(); State.steps++; updateMetrics();
      await sleep(speedDelay() * 5);

      visited.add(best.v);
      edges[best.idx].state = 'mst';
      mst.push(edges[best.idx]);
      State.comps++;
      addLog(`Add edge (${best.u} - ${best.v}, w=${best.w}). Visited: {${[...visited].sort((a,b)=>a-b).join(', ')}}.`, 'add');
      draw();
      await sleep(speedDelay() * 2);

      for (const nb of adj[best.v]) {
        if (!visited.has(nb.v)) {
          heap.push({ w: nb.w, u: best.v, v: nb.v, idx: nb.idx });
          heap.sort((a, b) => a.w - b.w);
        }
      }
    }

    edges.forEach(e => { if (e.state === 'normal') e.state = 'reject'; });
    const cost = mst.reduce((s, e) => s + e.w, 0);
    draw();
    showMstResult(mst, cost);
    addLog(`Prim complete. MST cost = ${cost}.`, 'done');
    setStatus(`Prim done. MST total cost = ${cost}.`, 'done');
  }

  function showMstResult(mst, cost) {
    const body = _el('mst-result-body');
    if (!body) return;
    let html = `<div style="color:#66bb6a;font-weight:600;margin-bottom:6px;font-size:11px">Edges selected for MST:</div>`;
    mst.forEach(e => {
      html += `<div style="color:#8892aa">${e.u} -- ${e.v} <span style="color:#5a6480">(weight ${e.w})</span></div>`;
    });
    html += `<div style="color:#ffb74d;font-weight:600;margin-top:8px;font-size:12px">Total MST Cost = ${cost}</div>`;
    body.innerHTML = html;
    updateMetrics();
  }

  /* ── Random graph ────────────────────────────────────────────── */
  function randomGraph(n) {
    clearAll();
    resize();
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(W, H) * 0.31;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      nodes.push({ x: Math.round(cx + r * Math.cos(a)), y: Math.round(cy + r * Math.sin(a)) });
    }
    // Spanning tree to ensure connectivity
    for (let i = 0; i < n - 1; i++) {
      edges.push({ u: i, v: i + 1, w: rand(1, 20), state: 'normal' });
    }
    // Extra edges
    let attempts = n * 4;
    while (attempts-- > 0) {
      const u = rand(0, n - 1), v = rand(0, n - 1);
      if (u !== v && !edges.some(e => (e.u===u&&e.v===v)||(e.u===v&&e.v===u))) {
        edges.push({ u, v, w: rand(1, 20), state: 'normal' });
      }
    }
    updatePrimSelect();
    draw();
    addLog(`Random graph: ${n} nodes, ${edges.length} edges.`, 'info');
    setStatus(`Graph ready. ${n} nodes, ${edges.length} edges.`);
  }

  function resetEdges() {
    edges.forEach(e => { e.state = 'normal'; });
    draw();
    const body = _el('mst-result-body');
    if (body) body.innerHTML = '<span style="color:var(--text-dim);font-size:11px">Run an algorithm to see output here.</span>';
    clearLog(); resetStats(); updateMetrics();
    setStatus('Edges reset.');
  }

  function clearAll() {
    nodes = []; edges = []; selNode = null;
    resetEdges();
    draw();
    updatePrimSelect();
    setStatus('Graph cleared.');
  }

  function setPrimStart(n) { primStart = n; draw(); }

  /* ── Public ──────────────────────────────────────────────────── */
  async function run() {
    if (isRunning) return;
    isRunning = true;
    State.running = true;
    State.cancel  = false;
    State.paused  = false;
    resetStats();
    State.startTime = performance.now();
    clearLog(); setRunBtn(true);

    if (State.algo === 'kruskal') await runKruskal();
    else if (State.algo === 'prim') await runPrim();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    isRunning = false;
    State.running = false;
    setRunBtn(false);
    updateMetrics();
  }

  function init() {
    // Canvas click handler only; randomGraph called by switchSection
    resize();
  }

  return { init, randomGraph, resetEdges, clearAll, run, setPrimStart };
})();