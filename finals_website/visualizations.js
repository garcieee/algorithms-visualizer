'use strict';

/**
 * Enhanced Visualization Module
 * Provides multiple chart types: bar, line, scatter, pie/circular
 */

const Visualizations = {
  
  /**
   * Draw bars vertically (original style)
   */
  drawBars(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    
    const n = arr.length;
    if (n === 0) return;
    
    const barW = Math.max(1, w / n);
    const maxVal = Math.max(...arr);
    const padding = 20;
    const graphH = Math.max(1, h - padding * 2);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphH * i / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Draw bars
    for (let i = 0; i < n; i++) {
      const val = arr[i];
      const barH = (val / maxVal) * graphH;
      const x = i * barW;
      const y = h - padding - barH;
      
      // Determine color
      let color = '#3b82f6';
      if (sorted.has(i)) color = '#10b981';
      else if (swaps.includes(i)) color = '#f59e0b';
      else if (comparisons.includes(i)) color = '#fbbf24';
      else if (active.has(i)) color = '#ec4899';
      
      // Draw bar
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(1, barW - 1), barH);
      
      // Border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, Math.max(1, barW - 1), barH);
    }
  },

  /**
   * Draw line graph
   */
  drawLineGraph(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    
    const n = arr.length;
    if (n === 0) return;
    
    const maxVal = Math.max(...arr);
    const padding = 40;
    const graphW = Math.max(1, w - padding * 2);
    const graphH = Math.max(1, h - padding * 2);
    
    // Draw axes
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, h - padding);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphH * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < n; i++) {
      const x = padding + (i / (n - 1)) * graphW;
      const y = h - padding - (arr[i] / maxVal) * graphH;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw points with colors
    for (let i = 0; i < n; i++) {
      const x = padding + (i / Math.max(1, n - 1)) * graphW;
      const y = h - padding - (arr[i] / maxVal) * graphH;
      
      let color = '#3b82f6';
      if (sorted.has(i)) color = '#10b981';
      else if (swaps.includes(i)) color = '#f59e0b';
      else if (comparisons.includes(i)) color = '#fbbf24';
      else if (active.has(i)) color = '#ec4899';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Labels
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = h - padding + (graphH * i / 5);
      const val = Math.round((maxVal * (5 - i)) / 5);
      ctx.fillText(val, padding - 10, y + 4);
    }
  },

  /**
   * Draw scatter plot
   */
  drawScatterPlot(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    
    const n = arr.length;
    if (n === 0) return;
    
    const maxVal = Math.max(...arr);
    const padding = 40;
    const graphW = Math.max(1, w - padding * 2);
    const graphH = Math.max(1, h - padding * 2);
    
    // Draw axes
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, h - padding);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphH * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }
    
    // Draw points with larger size
    for (let i = 0; i < n; i++) {
      const x = padding + (i / (n - 1)) * graphW;
      const y = h - padding - (arr[i] / maxVal) * graphH;
      
      let color = '#3b82f6';
      let size = 5;
      
      if (sorted.has(i)) {
        color = '#10b981';
        size = 6;
      } else if (swaps.includes(i)) {
        color = '#f59e0b';
        size = 7;
      } else if (comparisons.includes(i)) {
        color = '#fbbf24';
        size = 6;
      } else if (active.has(i)) {
        color = '#ec4899';
        size = 8;
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  /**
   * Draw circular/pie chart with index and percentage labels
   */
  drawCircularChart(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    
    const n = arr.length;
    if (n === 0) return;
    
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - 50;
    const total = arr.reduce((a, b) => a + b, 0);
    
    let currentAngle = -Math.PI / 2;
    
    // Colors for segments (consistent with other visualizations)
    const colors = [
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', 
      '#ef4444', '#8b5cf6', '#ec4899', '#f97316'
    ];
    
    // Draw legend at top
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const legendY = 15;
    ctx.fillText('Legend: ', 20, legendY);
    ctx.fillText('█ Sorted (Green)', 80, legendY);
    ctx.fillText('█ Active (Pink)', 220, legendY);
    ctx.fillText('█ Compared (Yellow)', 350, legendY);
    
    // Draw each slice
    for (let i = 0; i < n; i++) {
      const sliceAngle = (arr[i] / total) * Math.PI * 2;
      const percentage = ((arr[i] / total) * 100).toFixed(1);
      
      let color = colors[i % colors.length];
      let opacity = 0.6;
      
      // Determine color and opacity based on state
      if (sorted.has(i)) {
        color = '#10b981';
        opacity = 1;
      } else if (active.has(i)) {
        color = '#ec4899';
        opacity = 0.9;
      } else if (swaps.includes(i) || comparisons.includes(i)) {
        color = '#fbbf24';
        opacity = 0.8;
      }
      
      // Draw slice
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Border
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Labels: value, index, and percentage
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 0.65;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Show value on inner label
      ctx.fillText(arr[i], labelX, labelY);
      
      // Show index below value
      ctx.font = '9px monospace';
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(`idx:${i}`, labelX, labelY + 12);
      
      // Show percentage on outer edge
      const percentX = centerX + Math.cos(labelAngle) * (radius + 20);
      const percentY = centerY + Math.sin(labelAngle) * (radius + 20);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${percentage}%`, percentX, percentY);
      
      currentAngle += sliceAngle;
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Draw radial/bubble chart
   */
  drawBubbleChart(ctx, arr, w, h, { comparisons = [], swaps = [], active = new Set(), sorted = new Set() } = {}) {
    ctx.clearRect(0, 0, w, h);
    
    const n = arr.length;
    if (n === 0) return;
    
    const centerX = w / 2;
    const centerY = h / 2;
    const angleStep = (Math.PI * 2) / n;
    const maxRadius = Math.min(w, h) / 2 - 60;
    const maxVal = Math.max(...arr);
    
    const colors = [
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#ec4899', '#f97316'
    ];
    
    // Draw center circle
    ctx.fillStyle = 'rgba(100, 150, 200, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();
    
    for (let i = 0; i < n; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const bubbleRadius = (arr[i] / maxVal) * 30 + 10;
      const distance = maxRadius * 0.7;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      let color = colors[i % colors.length];
      
      if (sorted.has(i)) {
        color = '#10b981';
        ctx.globalAlpha = 1;
      } else if (swaps.includes(i)) {
        ctx.globalAlpha = 0.8;
      } else if (comparisons.includes(i)) {
        ctx.globalAlpha = 0.7;
      } else if (active.has(i)) {
        ctx.globalAlpha = 0.9;
      } else {
        ctx.globalAlpha = 0.6;
      }
      
      // Draw bubble
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, bubbleRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Value text
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(arr[i], x, y);
    }
    ctx.globalAlpha = 1;
  },

};

