/* ═══════════════════════════════════════════════════════════════════
   mst.js — MST Algorithms: Kruskal's + Prim's
   Interactive canvas graph — click to add nodes, click 2 nodes for edge
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const MSTModule = (() => {

  const canvas = document.getElementById('mst-canvas');
  const ctx    = canvas.getContext('2d');

  let nodes    = [];   // [{x, y, id}]
  let edges    = [];   // [{u, v, w, state}]  state: 'normal'|'active'|'mst'|'rejected'
  let selected = null; // node index for edge creation
  let mstRunning = false;

  // Colors
  const C = {
    node:     '#1E3A5F',
    nodeText: '#E2E8F0',
    nodeActive: '#00D4FF',
    nodeMst:    '#10B981',
    edgeNormal:   '#1E3A5F',
    edgeActive:   '#F59E0B',
    edgeMst:      '#10B981',
    edgeRejected: '#EF4444',
    selected: '#8B5CF6',
    weight:   '#64748B',
    bg:       'transparent',
  };

  /* ── RESIZE ──────────────────────────────────────────────────────────── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
  }
  window.addEventListener('resize', () => { resize(); draw(); });

  /* ── DRAW ────────────────────────────────────────────────────────────── */
  function draw() {
    resize();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (nodes.length === 0) {
      ctx.fillStyle = '#1E3A5F';
      ctx.font = '14px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Click to add nodes · Click two nodes to add an edge', W/2, H/2 - 10);
      ctx.fillText('or use "Random Graph" to generate one', W/2, H/2 + 18);
      return;
    }

    // Draw edges
    for (const e of edges) {
      const u = nodes[e.u], v = nodes[e.v];
      if (!u || !v) continue;
      const col = e.state === 'mst'      ? C.edgeMst
                : e.state === 'active'   ? C.edgeActive
                : e.state === 'rejected' ? C.edgeRejected
                : C.edgeNormal;
      const lw  = e.state === 'mst' ? 3.5 : e.state === 'active' ? 2.5 : 1.5;

      ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = col;
      ctx.lineWidth   = lw;
      ctx.setLineDash(e.state === 'rejected' ? [6, 4] : []);

      if (e.state === 'mst' || e.state === 'active') {
        ctx.shadowColor  = col;
        ctx.shadowBlur   = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Weight label
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      ctx.fillStyle = '#0E1525';
      ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = e.state === 'mst' ? '#10B981'
                    : e.state === 'active' ? '#F59E0B'
                    : '#64748B';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.w, mx, my);
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isSel  = selected === i;
      const inMST  = edges.some(e => (e.u === i || e.v === i) && e.state === 'mst');
      const isActive = edges.some(e => (e.u === i || e.v === i) && e.state === 'active');

      const col = isSel ? C.selected
                : inMST ? C.nodeMst
                : isActive ? C.nodeActive
                : C.node;

      // Outer glow ring
      if (isSel || inMST || isActive) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = col + '22';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = col;
      if (inMST || isSel) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Node label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i, n.x, n.y);
    }
  }

  /* ── INTERACTION ─────────────────────────────────────────────────────── */
  canvas.addEventListener('click', e => {
    if (mstRunning) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top)  * sy;

    const hit = nodes.findIndex(n => Math.hypot(n.x - cx, n.y - cy) < 22);
    if (hit >= 0) {
      if (selected === null) {
        selected = hit;
      } else if (selected !== hit) {
        // Check for duplicate edge
        const dup = edges.some(ed =>
          (ed.u === selected && ed.v === hit) || (ed.u === hit && ed.v === selected)
        );
        if (!dup) {
          const w = rand(1, 20);
          edges.push({ u: selected, v: hit, w, state: 'normal' });
          addLog(`Edge (${selected}–${hit}, w=${w}) added`, '');
        }
        selected = null;
      } else {
        selected = null;
      }
    } else {
      if (nodes.length < 14) {
        nodes.push({ x: cx, y: cy, id: nodes.length });
        addLog(`Node ${nodes.length - 1} added at (${Math.round(cx)}, ${Math.round(cy)})`, '');
      }
      selected = null;
    }
    draw();
    updatePrimStart();
  });

  function updatePrimStart() {
    const sel = document.getElementById('prim-start-select');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = nodes.map((_, i) => `<option value="${i}">${i}</option>`).join('');
    if (parseInt(cur) < nodes.length) sel.value = cur;
  }

  /* ── UNION-FIND ──────────────────────────────────────────────────────── */
  class UF {
    constructor(n) { this.p = Array.from({length:n},(_,i)=>i); this.r=[0]*n||new Array(n).fill(0); }
    find(x) { if(this.p[x]!==x) this.p[x]=this.find(this.p[x]); return this.p[x]; }
    union(x,y) {
      const rx=this.find(x),ry=this.find(y);
      if(rx===ry) return false;
      if(this.r[rx]<this.r[ry]){this.p[rx]=ry;}
      else if(this.r[rx]>this.r[ry]){this.p[ry]=rx;}
      else{this.p[ry]=rx;this.r[rx]++;}
      return true;
    }
  }

  /* ── KRUSKAL ─────────────────────────────────────────────────────────── */
  async function runKruskal() {
    const n = nodes.length;
    if (n < 2) { addLog('Need at least 2 nodes', 'skip'); return; }
    const uf = new UF(n);
    const sorted = [...edges].sort((a, b) => a.w - b.w);
    const mst = [];

    edges.forEach(e => e.state = 'normal'); draw();
    addLog(`Kruskal's: sorting ${edges.length} edges by weight`, '');

    for (const e of sorted) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      e.state = 'active';
      draw(); State.steps++; updateMetrics();
      await sleep(speedDelay() * 4);

      if (uf.union(e.u, e.v)) {
        e.state = 'mst'; mst.push(e);
        State.comps++;
        addLog(`Edge (${e.u}–${e.v}, w=${e.w}) → ADDED to MST`, 'add');
        setStatus(`Kruskal's: added edge ${e.u}–${e.v} (w=${e.w})`, 'running');
      } else {
        e.state = 'rejected';
        addLog(`Edge (${e.u}–${e.v}, w=${e.w}) → SKIPPED (cycle detected)`, 'skip');
      }
      draw(); await sleep(speedDelay() * 3);
      if (mst.length === n - 1) break;
    }

    const cost = mst.reduce((s, e) => s + e.w, 0);
    draw(); updateMetrics();
    addLog(`Kruskal's done — MST cost = ${cost}`, 'done');
    setStatus(`Kruskal's MST complete — Total Cost = ${cost}`, 'done');

    // Update right panel MST result
    const el = document.getElementById('mst-result-log');
    if (el) {
      let html = `<div style="color:#10B981;font-weight:700;margin-bottom:4px">Edges selected for MST:</div>`;
      mst.forEach(e => {
        html += `<div style="color:#CBD5E1">${e.u} -- ${e.v} &nbsp;<span style="color:#64748B">(weight ${e.w})</span></div>`;
      });
      html += `<div style="color:#F59E0B;font-weight:700;margin-top:6px">Total MST Cost = ${cost}</div>`;
      el.innerHTML = html;
    }
  }

  /* ── PRIM ────────────────────────────────────────────────────────────── */
  async function runPrim() {
    const n = nodes.length;
    if (n < 2) { addLog('Need at least 2 nodes', 'skip'); return; }

    const startNode = parseInt(document.getElementById('prim-start-select')?.value || '0');
    edges.forEach(e => e.state = 'normal'); draw();

    const adj = Array.from({length: n}, () => []);
    edges.forEach((e, idx) => {
      adj[e.u].push({v: e.v, w: e.w, idx});
      adj[e.v].push({v: e.u, w: e.w, idx});
    });

    const visited = new Set([startNode]);
    const mst = [];
    const heap = [];

    for (const nb of adj[startNode]) heap.push({w: nb.w, u: startNode, v: nb.v, idx: nb.idx});
    heap.sort((a, b) => a.w - b.w);

    addLog(`Prim's: starting at node ${startNode}`, '');
    setStatus(`Prim's: growing MST from node ${startNode}`, 'running');

    while (heap.length && visited.size < n) {
      if (State.cancel) return;
      while (State.paused && !State.cancel) await sleep(50);

      const best = heap.shift();
      if (visited.has(best.v)) continue;

      edges[best.idx].state = 'active';
      draw(); State.steps++; updateMetrics();
      await sleep(speedDelay() * 4);

      visited.add(best.v);
      edges[best.idx].state = 'mst';
      mst.push(edges[best.idx]);
      State.comps++;
      addLog(`Step ${mst.length}: Add (${best.u}–${best.v}, w=${best.w})  Visited: {${[...visited].sort().join(',')}}`, 'add');
      draw(); await sleep(speedDelay() * 2);

      for (const nb of adj[best.v]) {
        if (!visited.has(nb.v)) {
          heap.push({w: nb.w, u: best.v, v: nb.v, idx: nb.idx});
          heap.sort((a,b) => a.w - b.w);
        }
      }
    }

    // Reject unused edges
    edges.forEach(e => { if (e.state === 'normal') e.state = 'rejected'; });
    const cost = mst.reduce((s, e) => s + e.w, 0);
    draw(); updateMetrics();
    addLog(`Prim's done — MST cost = ${cost}`, 'done');
    setStatus(`Prim's MST complete — Total Cost = ${cost}`, 'done');

    const el = document.getElementById('mst-result-log');
    if (el) {
      let html = `<div style="color:#10B981;font-weight:700;margin-bottom:4px">Edges selected for MST:</div>`;
      mst.forEach(e => {
        html += `<div style="color:#CBD5E1">${e.u} -- ${e.v} &nbsp;<span style="color:#64748B">(weight ${e.w})</span></div>`;
      });
      html += `<div style="color:#F59E0B;font-weight:700;margin-top:6px">Total MST Cost = ${cost}</div>`;
      el.innerHTML = html;
    }
  }

  /* ── RANDOM GRAPH ────────────────────────────────────────────────────── */
  function randomGraph(n = 7) {
    clearGraph();
    resize();
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(W, H) * 0.32;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      nodes.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), id: i });
    }

    // Spanning chain
    for (let i = 0; i < n - 1; i++) {
      edges.push({ u: i, v: i + 1, w: rand(1, 20), state: 'normal' });
    }
    edges.push({ u: n - 1, v: 0, w: rand(1, 20), state: 'normal' });

    // Extra random edges
    const attempts = n * 3;
    for (let k = 0; k < attempts; k++) {
      const u = rand(0, n - 1), v = rand(0, n - 1);
      if (u !== v) {
        const dup = edges.some(e => (e.u===u&&e.v===v)||(e.u===v&&e.v===u));
        if (!dup) edges.push({ u, v, w: rand(1, 20), state: 'normal' });
      }
    }

    updatePrimStart(); draw();
    addLog(`Generated random graph: ${n} nodes, ${edges.length} edges`, '');
    setStatus(`Graph ready — ${n} vertices, ${edges.length} edges`);
  }

  function clearGraph() {
    nodes = []; edges = []; selected = null;
    const el = document.getElementById('mst-result-log');
    if (el) el.innerHTML = '<span style="color:#475569">Run an algorithm to see results here.</span>';
    draw();
    updatePrimStart();
    clearLog();
  }

  function resetGraph() {
    edges.forEach(e => e.state = 'normal');
    draw();
    const el = document.getElementById('mst-result-log');
    if (el) el.innerHTML = '<span style="color:#475569">Run an algorithm to see results here.</span>';
    clearLog();
    setStatus('Graph reset — edges cleared');
  }

  async function run() {
    if (mstRunning) return;
    mstRunning = true;
    State.running = true;
    State.cancel  = false;
    State.paused  = false;
    resetStats();
    State.startTime = performance.now();
    clearLog();
    updatePlayBtn(true);

    const algo = State.algo;
    if (algo === 'kruskal') await runKruskal();
    else if (algo === 'prim') await runPrim();

    State.elapsedMs = performance.now() - State.startTime;
    State.startTime = 0;
    mstRunning = false;
    State.running = false;
    updatePlayBtn(false);
    updateMetrics();
  }

  function init() {
    resize();
    randomGraph(7);
  }

  return { init, randomGraph, clearGraph, resetGraph, run };
})();
