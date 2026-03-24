/* ════════════════════════════════════════════════════════════════════
   datastructs.js — Data Structures used by the algorithms

   Visualizes:
   1. Array          — used by all sorting algorithms
   2. Stack (LIFO)   — used by recursion call stack
   3. Queue (FIFO)   — contrast with stack
   4. Linked List    — foundation for dynamic structures
   5. Min-Heap       — used by Prim's algorithm
   6. Graph          — used by both MST algorithms
   7. Union-Find     — used by Kruskal's algorithm
   ════════════════════════════════════════════════════════════════════ */

const DSModule = (() => {

  const canvas = document.getElementById('ds-canvas');
  const ctx    = canvas.getContext('2d');

  // color tokens matching CSS
  const C = {
    coral:  '#FF6B6B', mint: '#4ECDC4', yellow: '#FFE66D',
    purple: '#A855F7', sky: '#38BDF8',  green:  '#4ADE80',
    orange: '#FB923C', indigo: '#6366F1', dark: '#1E1B4B',
    gray:   '#E5E7EB', muted: '#94A3B8',
  };

  let currentDS = 'array';

  // ds-specific state
  let dsData = {
    array:   [42, 17, 89, 5, 63, 31, 78, 24],
    stack:   [30, 15, 45, 8],
    queue:   [10, 20, 30, 40],
    list:    [12, 7, 45, 3, 28],
    heap:    [1, 4, 6, 9, 8, 12, 15],   // min-heap
    graph:   null,
    uf:      null,
  };

  /* ── CANVAS RESIZE ───────────────────────────────────────────────── */
  function resizeDS() {
    const w = canvas.parentElement.clientWidth;
    canvas.width  = Math.min(w - 4, 920);
    canvas.height = 260;
    draw();
  }
  window.addEventListener('resize', resizeDS);

  /* ── HELPERS ─────────────────────────────────────────────────────── */
  function pill(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function text(str, x, y, color = C.dark, size = 13, weight = 700, align = 'center') {
    ctx.font      = `${weight} ${size}px Nunito, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }
  function arrow(x1, y1, x2, y2, color = C.muted) {
    const headLen = 10;
    const angle   = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  /* ── DRAW ROUTER ─────────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentDS === 'array')  drawArray();
    if (currentDS === 'stack')  drawStack();
    if (currentDS === 'queue')  drawQueue();
    if (currentDS === 'list')   drawLinkedList();
    if (currentDS === 'heap')   drawHeap();
    if (currentDS === 'graph')  drawGraph();
    if (currentDS === 'uf')     drawUnionFind();
  }

  /* ── 1. ARRAY ────────────────────────────────────────────────────── */
  function drawArray() {
    const a = dsData.array;
    const W = canvas.width, H = canvas.height;
    const bw = Math.min(70, (W - 60) / a.length);
    const bh = 56;
    const x0 = (W - bw * a.length) / 2;
    const y0 = H / 2 - bh / 2;
    const mx = Math.max(...a);

    // bar heights (behind boxes)
    a.forEach((v, i) => {
      const barH = (v / mx) * 100;
      pill(x0 + i * bw + 4, y0 - barH, bw - 8, barH, 4, C.coral + '33');
    });

    // cells
    a.forEach((v, i) => {
      const x = x0 + i * bw, y = y0;
      pill(x + 2, y, bw - 4, bh, 6, '#EEF2FF', C.indigo);
      text(v, x + bw / 2, y + bh / 2, C.dark, 15, 800);
      text(i, x + bw / 2, y + bh + 14, C.muted, 11, 600); // index
    });

    text('Index →',  x0 - 10,       y0 + bh + 14, C.muted, 11, 700, 'right');
    text('← Value',  x0 - 10,       y0 + bh / 2,  C.muted, 11, 700, 'right');
    text(`Array  —  Random Access  O(1)`, W / 2, 22, C.indigo, 13, 800);
    text('Used by all sorting algorithms. Index-based access.', W / 2, 42, C.muted, 11, 600);
  }

  /* ── 2. STACK (LIFO) ─────────────────────────────────────────────── */
  function drawStack() {
    const a = dsData.stack;
    const W = canvas.width, H = canvas.height;
    const bw = 120, bh = 36, gap = 4;
    const x0 = W / 2 - bw / 2;
    let   y  = H - 50;

    text('Stack  (LIFO — Last In, First Out)', W / 2, 22, C.purple, 13, 800);
    text('Used for the recursion call stack', W / 2, 42, C.muted, 11, 600);

    // base
    pill(x0 - 8, y + bh, bw + 16, 10, 4, C.dark);

    // stack frames
    a.forEach((v, i) => {
      const isTop = i === a.length - 1;
      pill(x0, y, bw, bh, 6, isTop ? C.purple : '#EEF2FF', isTop ? C.purple : C.indigo);
      text(v, x0 + bw / 2, y + bh / 2, isTop ? '#fff' : C.dark, 14, 800);
      if (isTop) {
        text('← TOP (next to pop)', x0 + bw + 10, y + bh / 2, C.purple, 11, 700, 'left');
      }
      y -= bh + gap;
    });

    // push label
    text('PUSH ↑', x0 + bw / 2, y + 10, C.green, 12, 800);
    text('POP ↓', W / 2 + 70, H - 40, C.coral, 12, 800);
  }

  /* ── 3. QUEUE (FIFO) ─────────────────────────────────────────────── */
  function drawQueue() {
    const a = dsData.queue;
    const W = canvas.width, H = canvas.height;
    const bw = 68, bh = 48, gap = 3;
    const totalW = a.length * (bw + gap) - gap;
    const x0 = (W - totalW) / 2;
    const y0 = H / 2 - bh / 2;

    text('Queue  (FIFO — First In, First Out)', W / 2, 22, C.mint, 13, 800);
    text('Min-Heap (Prim\'s) is a priority queue — smallest weight exits first', W / 2, 42, C.muted, 11, 600);

    a.forEach((v, i) => {
      const x     = x0 + i * (bw + gap);
      const isFront = i === 0;
      const isBack  = i === a.length - 1;
      pill(x, y0, bw, bh, 6, isFront ? C.coral : isBack ? C.mint : '#EEF2FF', isFront ? C.coral : isBack ? C.mint : C.indigo);
      text(v, x + bw / 2, y0 + bh / 2, (isFront || isBack) ? C.dark : C.dark, 14, 800);
    });

    // labels
    text('DEQUEUE →', x0 - 12, y0 + bh / 2, C.coral, 11, 700, 'right');
    text('← ENQUEUE', x0 + totalW + 12, y0 + bh / 2, C.mint, 11, 700, 'left');
    text('FRONT', x0 + bw / 2, y0 + bh + 18, C.coral, 11, 700);
    text('BACK', x0 + totalW - bw / 2, y0 + bh + 18, C.mint, 11, 700);
  }

  /* ── 4. LINKED LIST ──────────────────────────────────────────────── */
  function drawLinkedList() {
    const a = dsData.list;
    const W = canvas.width, H = canvas.height;
    const nodeW = 72, nodeH = 44, gap = 44;
    const totalW = a.length * (nodeW + gap) - gap;
    const x0 = (W - totalW) / 2;
    const y0 = H / 2 - nodeH / 2;

    text('Singly Linked List  —  O(n) traversal, O(1) insert at head', W / 2, 22, C.orange, 13, 800);
    text('Foundation for stacks, queues, adjacency lists', W / 2, 42, C.muted, 11, 600);

    a.forEach((v, i) => {
      const x = x0 + i * (nodeW + gap);
      // data cell
      pill(x, y0, nodeW * 0.6, nodeH, [6,0,0,6], '#FFF7ED', C.orange);
      text(v, x + nodeW * 0.3, y0 + nodeH / 2, C.dark, 14, 800);
      // next pointer cell
      pill(x + nodeW * 0.6, y0, nodeW * 0.4, nodeH, [0,6,6,0], '#FED7AA', C.orange);
      text(i < a.length - 1 ? '→' : 'null', x + nodeW * 0.8, y0 + nodeH / 2, C.orange, 12, 800);
      // arrow
      if (i < a.length - 1) {
        arrow(x + nodeW + 2, y0 + nodeH / 2, x + nodeW + gap - 2, y0 + nodeH / 2, C.orange);
      }
      // head label
      if (i === 0) {
        text('HEAD', x + nodeW * 0.3, y0 - 16, C.orange, 11, 700);
        arrow(x + nodeW * 0.3, y0 - 6, x + nodeW * 0.3, y0 - 1, C.orange);
      }
    });
  }

  /* ── 5. MIN-HEAP ─────────────────────────────────────────────────── */
  function drawHeap() {
    const a = dsData.heap; // min-heap array representation
    const W = canvas.width, H = canvas.height;

    text("Min-Heap  —  O(log n) insert & extract-min  |  Used by Prim's Algorithm", W / 2, 22, C.sky, 13, 800);
    text('Parent ≤ both children. Root is always the minimum.', W / 2, 42, C.muted, 11, 600);

    // draw as binary tree
    const levels  = Math.floor(Math.log2(a.length)) + 1;
    const nodeR   = 22;
    const levelH  = (H - 80) / levels;
    const positions = [];

    for (let i = 0; i < a.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      const cellW = W / nodesInLevel;
      const x = cellW * posInLevel + cellW / 2;
      const y = 70 + level * levelH;
      positions.push({ x, y });
    }

    // edges first
    for (let i = 0; i < a.length; i++) {
      const li = 2 * i + 1, ri = 2 * i + 2;
      if (li < a.length) { const p = positions[i], c = positions[li]; ctx.beginPath(); ctx.moveTo(p.x, p.y + nodeR); ctx.lineTo(c.x, c.y - nodeR); ctx.strokeStyle = C.sky + '88'; ctx.lineWidth = 2; ctx.stroke(); }
      if (ri < a.length) { const p = positions[i], c = positions[ri]; ctx.beginPath(); ctx.moveTo(p.x, p.y + nodeR); ctx.lineTo(c.x, c.y - nodeR); ctx.strokeStyle = C.sky + '88'; ctx.lineWidth = 2; ctx.stroke(); }
    }

    // nodes
    for (let i = 0; i < a.length; i++) {
      const { x, y } = positions[i];
      const isRoot = i === 0;
      ctx.beginPath(); ctx.arc(x, y, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = isRoot ? C.sky : '#EFF6FF';
      ctx.fill();
      ctx.strokeStyle = C.sky; ctx.lineWidth = 2; ctx.stroke();
      text(a[i], x, y, isRoot ? C.dark : C.dark, 14, 800);
      // array index below
      text(`[${i}]`, x, y + nodeR + 12, C.muted, 10, 600);
    }

    // heap property indicator
    text('root = min', positions[0].x + nodeR + 6, positions[0].y, C.sky, 11, 700, 'left');
  }

  /* ── 6. GRAPH (adjacency list) ───────────────────────────────────── */
  function drawGraph() {
    const W = canvas.width, H = canvas.height;
    text('Graph  —  Adjacency List  |  Used by both MST algorithms', W / 2, 22, C.mint, 13, 800);
    text('V vertices, E edges. Space O(V+E). Lookup O(degree(v)).', W / 2, 42, C.muted, 11, 600);

    // preset small graph
    const nodes = [
      { x: W/2,         y: 80,       id: 0 },
      { x: W/2 - 130,   y: 160,      id: 1 },
      { x: W/2 + 130,   y: 160,      id: 2 },
      { x: W/2 - 70,    y: 240,      id: 3 },
      { x: W/2 + 70,    y: 240,      id: 4 },
    ];
    const edges = [
      { u: 0, v: 1, w: 4 }, { u: 0, v: 2, w: 3 },
      { u: 1, v: 3, w: 6 }, { u: 2, v: 4, w: 5 },
      { u: 3, v: 4, w: 7 }, { u: 1, v: 2, w: 2 },
    ];

    // edges
    for (const e of edges) {
      const u = nodes[e.u], v = nodes[e.v];
      ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = C.mint + 'AA'; ctx.lineWidth = 2.5; ctx.stroke();
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      pill(mx - 12, my - 10, 24, 20, 5, '#fff', C.mint);
      text(e.w, mx, my, C.dark, 11, 800);
    }

    // nodes
    for (const n of nodes) {
      ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = C.dark; ctx.fill();
      text(n.id, n.x, n.y, '#fff', 13, 800);
    }

    // adjacency list panel on right
    const lx = W - 185, ly = 60;
    pill(lx, ly - 8, 178, 175, 10, '#F0FDF4', C.mint);
    text('Adjacency List:', lx + 89, ly + 8, C.mint, 11, 800);
    const adj = [
      '0 → [1(4), 2(3)]',
      '1 → [0(4), 3(6), 2(2)]',
      '2 → [0(3), 4(5), 1(2)]',
      '3 → [1(6), 4(7)]',
      '4 → [2(5), 3(7)]',
    ];
    adj.forEach((line, i) => {
      text(line, lx + 89, ly + 28 + i * 24, C.dark, 10, 700);
    });
  }

  /* ── 7. UNION-FIND ───────────────────────────────────────────────── */
  function drawUnionFind() {
    const W = canvas.width, H = canvas.height;
    text('Union-Find (Disjoint Set Union)  —  Used by Kruskal\'s for cycle detection', W / 2, 22, C.coral, 13, 800);
    text('find(x): O(α(n)) ≈ O(1) amortized  |  union(x,y): O(α(n))', W / 2, 42, C.muted, 11, 600);

    // show before and after union
    const nodeR = 20;
    // 6 nodes, initially separate
    const nodes = [0, 1, 2, 3, 4, 5];
    const before = {
      parent: [0, 1, 2, 3, 4, 5],
      label: 'Before unions — 6 separate components',
      sets: [[0], [1], [2], [3], [4], [5]],
    };
    const after = {
      parent: [0, 0, 0, 3, 3, 3],
      label: 'After union(0,1), union(0,2), union(3,4), union(3,5)',
      sets: [[0, 1, 2], [3, 4, 5]],
    };

    // draw "before" — top row
    const y1 = 90;
    text(before.label, W / 2, y1 - 15, C.muted, 10, 700);
    nodes.forEach((n, i) => {
      const x = 80 + i * 120;
      ctx.beginPath(); ctx.arc(x, y1, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = '#EEF2FF'; ctx.fill();
      ctx.strokeStyle = C.indigo; ctx.lineWidth = 2; ctx.stroke();
      text(n, x, y1, C.dark, 13, 800);
      // parent pointer (self)
      text(`p=${n}`, x, y1 + nodeR + 14, C.muted, 10, 600);
    });

    // draw "after" — bottom row
    const y2 = 185;
    text(after.label, W / 2, y2 - 15, C.muted, 10, 700);
    const aCols = [C.coral, C.coral, C.coral, C.mint, C.mint, C.mint];
    nodes.forEach((n, i) => {
      const x = 80 + i * 120;
      ctx.beginPath(); ctx.arc(x, y2, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = aCols[i] + '33'; ctx.fill();
      ctx.strokeStyle = aCols[i]; ctx.lineWidth = 2.5; ctx.stroke();
      text(n, x, y2, C.dark, 13, 800);
      text(`p=${after.parent[n]}`, x, y2 + nodeR + 14, aCols[i], 10, 700);
      // union arrows (parent edges)
      if (after.parent[n] !== n) {
        const px = 80 + after.parent[n] * 120;
        arrow(x, y2 - nodeR - 2, px, y2 - nodeR - 2, aCols[i]);
      }
    });

    // set labels
    text('Set {0,1,2}', 80 + 120, y2 + 46, C.coral, 11, 800);
    text('Set {3,4,5}', 80 + 120 * 4, y2 + 46, C.mint, 11, 800);
  }

  /* ── OPERATIONS ──────────────────────────────────────────────────── */
  function dsOp(op) {
    const input = parseInt(document.getElementById('ds-input').value);
    if (isNaN(input) && op !== 'pop' && op !== 'dequeue' && op !== 'shuffle') return;

    if (currentDS === 'array') {
      if (op === 'push' && dsData.array.length < 12)    { dsData.array.push(input); }
      if (op === 'pop'  && dsData.array.length > 0)     { dsData.array.pop(); }
      if (op === 'shuffle') { for (let i=dsData.array.length-1;i>0;i--){const j=rand(0,i);[dsData.array[i],dsData.array[j]]=[dsData.array[j],dsData.array[i]];} }
    }
    if (currentDS === 'stack') {
      if (op === 'push' && dsData.stack.length < 8)  { dsData.stack.push(input); }
      if (op === 'pop'  && dsData.stack.length > 0)  { dsData.stack.pop(); }
    }
    if (currentDS === 'queue') {
      if (op === 'push' && dsData.queue.length < 8)  { dsData.queue.push(input); }
      if (op === 'pop'  && dsData.queue.length > 0)  { dsData.queue.shift(); }
    }
    if (currentDS === 'list') {
      if (op === 'push' && dsData.list.length < 8)   { dsData.list.unshift(input); }
      if (op === 'pop'  && dsData.list.length > 0)   { dsData.list.shift(); }
    }
    if (currentDS === 'heap') {
      if (op === 'push') {
        dsData.heap.push(input);
        // bubble up to maintain heap property
        let i = dsData.heap.length - 1;
        while (i > 0) {
          const parent = Math.floor((i - 1) / 2);
          if (dsData.heap[parent] > dsData.heap[i]) { [dsData.heap[parent], dsData.heap[i]] = [dsData.heap[i], dsData.heap[parent]]; i = parent; }
          else break;
        }
      }
      if (op === 'pop' && dsData.heap.length > 0) {
        // extract min (root), put last element at root, sift down
        dsData.heap[0] = dsData.heap.pop();
        let i = 0;
        while (true) {
          const l = 2*i+1, r = 2*i+2; let m = i;
          if (l < dsData.heap.length && dsData.heap[l] < dsData.heap[m]) m = l;
          if (r < dsData.heap.length && dsData.heap[r] < dsData.heap[m]) m = r;
          if (m === i) break;
          [dsData.heap[i], dsData.heap[m]] = [dsData.heap[m], dsData.heap[i]]; i = m;
        }
      }
    }
    draw();
  }

  /* ── DS TAB SWITCH ───────────────────────────────────────────────── */
  function switchDS(ds) {
    currentDS = ds;
    document.querySelectorAll('.ds-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ds-tab[data-ds="${ds}"]`)?.classList.add('active');

    // show/hide info panels
    document.querySelectorAll('.ds-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`ds-panel-${ds}`)?.classList.add('active');

    // update op labels
    const opLabels = {
      array:  { push: '➕ Append', pop: '➖ Remove Last', extra: '🔀 Shuffle' },
      stack:  { push: '⬆️ Push',  pop: '⬇️ Pop',         extra: null },
      queue:  { push: '➕ Enqueue', pop: '➡️ Dequeue',   extra: null },
      list:   { push: '⬆️ Prepend', pop: '➡️ Remove Head', extra: null },
      heap:   { push: '⬆️ Insert',  pop: '⬇️ Extract Min', extra: null },
      graph:  { push: null, pop: null, extra: null },
      uf:     { push: null, pop: null, extra: null },
    };
    const lbl = opLabels[ds] || {};
    const pushBtn  = document.getElementById('ds-push-btn');
    const popBtn   = document.getElementById('ds-pop-btn');
    const extraBtn = document.getElementById('ds-extra-btn');
    const inputEl  = document.getElementById('ds-input');

    if (pushBtn)  { pushBtn.textContent  = lbl.push  || '➕ Add';    pushBtn.style.display = lbl.push  ? 'inline-flex' : 'none'; }
    if (popBtn)   { popBtn.textContent   = lbl.pop   || '➖ Remove'; popBtn.style.display  = lbl.pop   ? 'inline-flex' : 'none'; }
    if (extraBtn) { extraBtn.textContent = lbl.extra  || '';          extraBtn.style.display = lbl.extra ? 'inline-flex' : 'none'; }
    if (inputEl)  { inputEl.style.display = (ds === 'graph' || ds === 'uf') ? 'none' : 'inline-block'; }

    draw();
  }

  /* ── INIT ────────────────────────────────────────────────────────── */
  function init() {
    setTimeout(() => { resizeDS(); switchDS('array'); }, 100);

    document.querySelectorAll('.ds-tab').forEach(tab => {
      tab.addEventListener('click', () => switchDS(tab.dataset.ds));
    });
  }

  return { init, dsOp, switchDS };

})();
