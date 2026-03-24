/* ════════════════════════════════════════════════════════════════════
   app.js — Main application: tab routing, shared utilities, confetti
   ════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── SHARED UTILITIES ─────────────────────────────────────────────── */
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const rand   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Animate a stat-value counter with a flash effect */
function animCounter(el, target) {
  if (!el) return;
  el.classList.add('flash');
  el.textContent = typeof target === 'number' ? target.toLocaleString() : target;
  setTimeout(() => el.classList.remove('flash'), 380);
}

/** Confetti burst — called when an algorithm finishes */
function confetti(count = 60) {
  const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#A855F7','#38BDF8','#4ADE80','#FB923C','#F472B6'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = rand(8, 15);
    el.style.cssText = `
      left:${rand(0,100)}vw; top:-20px;
      width:${size}px; height:${size}px;
      background:${colors[rand(0, colors.length-1)]};
      border-radius:${rand(0,1) ? '50%' : '3px'};
      animation-duration:${rand(1100,2300)}ms;
      animation-delay:${rand(0,550)}ms;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

/* ── TAB NAVIGATION ───────────────────────────────────────────────── */
function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const section = document.getElementById('tab-' + tab);
  const btn     = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (section) section.classList.add('active');
  if (btn)     btn.classList.add('active');
}

/* ── ACCORDION ────────────────────────────────────────────────────── */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const body = hdr.nextElementSibling;
      const isOpen = hdr.classList.contains('open');
      // close all in same parent
      hdr.closest('.accordion-group')?.querySelectorAll('.accordion-header').forEach(h => {
        h.classList.remove('open');
        h.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) {
        hdr.classList.add('open');
        body.classList.add('open');
      }
    });
  });
}

/* ── CHECKBOX GROUPS ──────────────────────────────────────────────── */
function initCheckGroups() {
  document.querySelectorAll('.check-label input').forEach(inp => {
    // set initial visual state
    inp.closest('.check-label').classList.toggle('checked', inp.checked);
    inp.addEventListener('change', function () {
      this.closest('.check-label').classList.toggle('checked', this.checked);
    });
  });
}

/* ── BOOT ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  switchTab('sort');
  initAccordions();
  initCheckGroups();

  // init each module
  SortModule.init();
  MSTModule.init();
  RecModule.init();
  DSModule.init();
});
