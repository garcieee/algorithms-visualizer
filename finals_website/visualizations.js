'use strict';

/* ================================================================
   visualizations.js — Alternative Visualization Module
   Provides chart types for the sorting canvas beyond the default
   bar chart. All functions share the same color palette as sort.js
   so states look consistent when switching visualization types.

   Colors (match sort.js COL):
     default  #c5cad8   unsorted element
     compare  #2196f3   element under comparison
     swap     #ff9800   element being swapped
     sorted   #4caf50   element in final position

   Each function signature:
     draw*(ctx, arr, w, h, { comparisons, swaps, active, sorted })
       comparisons — Array of indices currently being compared
       swaps       — Array of indices currently being swapped
       active      — Set of indices with any active highlight
       sorted      — Set of indices in their final sorted position
================================================================ */

const Visualizations = {

  /* ── Line Graph ─────────────────────────────────────────────── */
  // Draws the array as a connected line where X = index, Y = value.
  // Active comparison/swap points are colored and enlarged.
  drawLineGraph(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    const n = arr.length;
    if (n === 0) return;

    const maxVal  = Math.max(...arr) || 1;
    const pad     = 40;
    const graphW  = Math.max(1, w - pad * 2);
    const graphH  = Math.max(1, h - pad * 2);
    // Guard against n=1: division by (n-1) would be 0/0 → NaN
    const xScale  = n > 1 ? graphW / (n - 1) : 0;

    // Axes
    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad);     ctx.lineTo(pad, h - pad);     ctx.stroke();

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (graphH * i / 5);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Connecting line (default color, drawn first so points sit on top)
    ctx.strokeStyle = '#c5cad8';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = pad + i * xScale;
      const y = h - pad - (arr[i] / maxVal) * graphH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Points colored by state
    for (let i = 0; i < n; i++) {
      const x = pad + i * xScale;
      const y = h - pad - (arr[i] / maxVal) * graphH;

      let color = '#c5cad8';
      if (sorted.has(i))          color = '#4caf50';
      else if (swaps.includes(i)) color = '#ff9800';
      else if (comparisons.includes(i) || active.has(i)) color = '#2196f3';

      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Y-axis value labels
    ctx.fillStyle    = '#9aa0b0';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const y   = pad + (graphH * i / 5);
      const val = Math.round((maxVal * (5 - i)) / 5);
      ctx.fillText(val, pad - 8, y);
    }
  },

  /* ── Scatter Plot ───────────────────────────────────────────── */
  // Same X/Y mapping as the line graph but without the connecting line.
  // Points are sized by state to draw the eye to active elements.
  drawScatterPlot(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    const n = arr.length;
    if (n === 0) return;

    const maxVal = Math.max(...arr) || 1;
    const pad    = 40;
    const graphW = Math.max(1, w - pad * 2);
    const graphH = Math.max(1, h - pad * 2);
    const xScale = n > 1 ? graphW / (n - 1) : 0;

    // Axes
    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad);     ctx.lineTo(pad, h - pad);     ctx.stroke();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (graphH * i / 5);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Points
    for (let i = 0; i < n; i++) {
      const x = pad + i * xScale;
      const y = h - pad - (arr[i] / maxVal) * graphH;

      let color = '#c5cad8', size = 5;
      if      (sorted.has(i))                             { color = '#4caf50'; size = 6; }
      else if (swaps.includes(i))                         { color = '#ff9800'; size = 7; }
      else if (comparisons.includes(i) || active.has(i)) { color = '#2196f3'; size = 7; }

      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  },

  /* ── Circular / Pie Chart ───────────────────────────────────── */
  // Each element occupies a slice proportional to its value.
  // Useful for seeing how values are distributed and which are being touched.
  drawCircularChart(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    const n = arr.length;
    if (n === 0) return;

    const cx     = w / 2;
    const cy     = h / 2;
    const radius = Math.min(w, h) / 2 - 50;
    const total  = arr.reduce((a, b) => a + b, 0) || 1;

    // Base colors for slices (cycles for arrays longer than 8)
    const palette = [
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#ec4899', '#f97316',
    ];

    let currentAngle = -Math.PI / 2;

    for (let i = 0; i < n; i++) {
      const sliceAngle = (arr[i] / total) * Math.PI * 2;
      const pct        = ((arr[i] / total) * 100).toFixed(1);

      // State-based color overrides match the bar chart palette
      let color   = palette[i % palette.length];
      let opacity = 0.65;
      if      (sorted.has(i))                                     { color = '#4caf50'; opacity = 1.0; }
      else if (swaps.includes(i))                                 { color = '#ff9800'; opacity = 0.9; }
      else if (comparisons.includes(i) || active.has(i))         { color = '#2196f3'; opacity = 0.9; }

      // Slice fill
      ctx.globalAlpha = opacity;
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Slice border
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Inner label: value and index
      const midAngle  = currentAngle + sliceAngle / 2;
      const labelR    = radius * 0.65;
      const lx        = cx + Math.cos(midAngle) * labelR;
      const ly        = cy + Math.sin(midAngle) * labelR;

      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 12px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(arr[i], lx, ly);

      ctx.font      = '9px monospace';
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(`[${i}]`, lx, ly + 13);

      // Outer label: percentage
      const px = cx + Math.cos(midAngle) * (radius + 20);
      const py = cy + Math.sin(midAngle) * (radius + 20);
      ctx.font      = '9px monospace';
      ctx.fillStyle = '#9aa0b0';
      ctx.fillText(`${pct}%`, px, py);

      currentAngle += sliceAngle;
    }
    ctx.globalAlpha = 1; // always restore alpha after drawing
  },

  /* ── Bubble Chart ───────────────────────────────────────────── */
  // Elements are positioned around a ring; bubble size encodes value.
  // Good for spotting outliers and watching swaps ripple around the ring.
  drawBubbleChart(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    const n = arr.length;
    if (n === 0) return;

    const cx        = w / 2;
    const cy        = h / 2;
    const angleStep = (Math.PI * 2) / n;
    const ringR     = Math.min(w, h) / 2 - 60;
    const maxVal    = Math.max(...arr) || 1;

    const palette = [
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#ec4899', '#f97316',
    ];

    // Faint background circle to indicate the ring boundary
    ctx.fillStyle = 'rgba(100,150,200,0.07)';
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < n; i++) {
      const angle        = angleStep * i - Math.PI / 2;
      const bubbleRadius = (arr[i] / maxVal) * 28 + 8; // scale size to value
      const x            = cx + Math.cos(angle) * ringR * 0.72;
      const y            = cy + Math.sin(angle) * ringR * 0.72;

      let color   = palette[i % palette.length];
      let opacity = 0.65;
      if      (sorted.has(i))                                     { color = '#4caf50'; opacity = 1.0; }
      else if (swaps.includes(i))                                 { color = '#ff9800'; opacity = 0.85; }
      else if (comparisons.includes(i) || active.has(i))         { color = '#2196f3'; opacity = 0.85; }

      ctx.globalAlpha = opacity;
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(x, y, bubbleRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Value label inside the bubble
      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 10px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(arr[i], x, y);
    }
    ctx.globalAlpha = 1; // always restore after drawing
  },

};
