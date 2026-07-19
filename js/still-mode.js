// Still Mode: one alternate renderer for reduced-motion, no-WebGL, and
// hopeless hardware. Same nine epochs as static frames — gradient + a
// once-painted 2D-canvas starfield — same copy, same index, same readout.

import { EPOCHS, epochAt, EXTINCTION_T } from './content.js';

export function stillModeRequested() {
  const params = new URLSearchParams(location.search);
  if (params.has('still')) return 'forced';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';
  if (!webglAvailable()) return 'no-webgl';
  return null;
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function paintStars(canvas, tint, density) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  const n = Math.floor(180 * density * (innerWidth / 1440 + 0.4));
  for (let i = 0; i < n; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = (Math.random() ** 3) * 1.6 * dpr + 0.4;
    const a = 0.25 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = tint;
    ctx.globalAlpha = a;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export class StillMode {
  constructor(ui, timeline) {
    this.ui = ui;
    this.timeline = timeline;
    document.body.classList.add('still-mode');
    const host = document.getElementById('still');
    host.hidden = false;
    this.frames = new Map();
    for (const epoch of EPOCHS) {
      const f = document.createElement('div');
      f.className = 'still-frame';
      const [top, mid, bot] = epoch.still.grad;
      f.style.background = `radial-gradient(ellipse 90% 70% at 50% 45%, ${mid} 0%, ${top} 45%, ${bot} 100%)`;
      const c = document.createElement('canvas');
      f.appendChild(c);
      host.appendChild(f);
      paintStars(c, epoch.still.star, epoch.still.density);
      this.frames.set(epoch.id, f);
    }
    this._active = null;
  }

  /** Driven from the same loop (or a scroll listener when there is no loop). */
  update(t) {
    const epoch = epochAt(t);
    if (epoch !== this._active) {
      if (this._active) this.frames.get(this._active.id).classList.remove('active');
      this.frames.get(epoch.id).classList.add('active');
      this._active = epoch;
    }
    this.ui.update(t);
    // keyboard/still ending: always show the ember beside the closing line
    if (t >= EXTINCTION_T + 0.015) {
      const el = document.getElementById('ending-light');
      if (el.hidden) {
        el.style.left = '50%';
        el.style.top = '46%';
        el.hidden = false;
      }
    }
  }
}
