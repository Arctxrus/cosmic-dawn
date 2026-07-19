// The cheap Gargantua: a pre-composed lensed-disc painting used as a billboard
// at T1/T0 and as the Still Mode frame. Painted once on a canvas — shadow,
// photon ring, near-side disc band crossing the shadow, and the over/under
// arcs (the far side of the same disc, bent around the hole), with doppler
// asymmetry baked in. Warm white / ember-gold family.

/**
 * Paint the lensed composition into ctx.
 * cx, cy — shadow centre in canvas px; R — shadow radius in px;
 * tilt — roll in radians (reference is ~ -0.18).
 */
export function paintGargantua(ctx, cx, cy, R, tilt = -0.18) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  const gold = (a) => `rgba(255, 214, 160, ${a})`;
  const white = (a) => `rgba(255, 248, 238, ${a})`;
  const ember = (a) => `rgba(214, 126, 58, ${a})`;

  // --- ambient halo: strictly circular, fading to true zero well inside
  // the canvas so no sprite-bound edge can ever show ---
  let g = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 2.1);
  g.addColorStop(0, gold(0.06));
  g.addColorStop(0.55, ember(0.025));
  g.addColorStop(0.92, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // --- over/under arcs: the far side of the disc, bent around the hole.
  // Drawn as thick half-ring caps hugging the shadow, brighter than the halo. ---
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(1, sign);
    // arc bands hugging the shadow — the far side of the disc folded over.
    // The over-arc (drawn when sign=-1, i.e. above) burns brighter than the
    // under-arc, as in the lensed render; both sit clear of the photon ring.
    // canvas y is DOWN: the unflipped pass (sign=+1) draws the π..2π arc at
    // the TOP of the screen — that's the bright over-arc
    const strength = sign > 0 ? 1.0 : 0.6;
    // a single tight warm crescent hugging the shadow — the folded far side
    const rr = R * 1.24;
    const w = R * 0.17;
    const grad = ctx.createRadialGradient(0, 0, rr - w, 0, 0, rr + w);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.45, `rgba(255,210,140,${0.9 * strength})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rr + w, Math.PI + 0.55, 2 * Math.PI - 0.55);
    ctx.arc(0, 0, Math.max(1, rr - w), 2 * Math.PI - 0.55, Math.PI + 0.55, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- the shadow: absolute black ---
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();

  // --- photon ring hugging the shadow edge ---
  g = ctx.createRadialGradient(0, 0, R * 0.98, 0, 0, R * 1.13);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.45, 'rgba(255,230,188,0.85)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.16, 0, Math.PI * 2);
  ctx.arc(0, 0, R * 0.97, 0, Math.PI * 2, true);
  ctx.fill();

  // --- near-side disc band: thin, blazing, crossing IN FRONT across the
  // shadow's midline; doppler gradient left(bright/white)→right(warm/dim).
  // The span reaches nearly the full canvas so its tips fall off-screen. ---
  const span = R * 6.1;
  const bandY = R * 0.06;
  const bandH = R * 0.09;
  // soft under-glow of the band — a whisper, never a wash
  const under = ctx.createLinearGradient(-span, 0, span, 0);
  under.addColorStop(0, gold(0.16));
  under.addColorStop(0.5, gold(0.09));
  under.addColorStop(1, ember(0.05));
  ctx.fillStyle = under;
  ctx.beginPath();
  ctx.ellipse(0, bandY, span, bandH * 1.9, 0, 0, Math.PI * 2);
  ctx.fill();
  // the band itself — hard doppler: white-hot approach, deep ember retreat
  const dop = ctx.createLinearGradient(-span, 0, span, 0);
  dop.addColorStop(0, white(1.0));
  dop.addColorStop(0.25, 'rgba(255,208,140,0.95)');
  dop.addColorStop(0.52, 'rgba(235,145,70,0.85)');
  dop.addColorStop(0.78, 'rgba(190,98,44,0.6)');
  dop.addColorStop(1, 'rgba(150,70,30,0.35)');
  ctx.fillStyle = dop;
  ctx.beginPath();
  ctx.ellipse(0, bandY, span, bandH, 0, 0, Math.PI * 2);
  ctx.fill();
  // hot core streak
  const hot = ctx.createLinearGradient(-span, 0, span, 0);
  hot.addColorStop(0, white(0.95));
  hot.addColorStop(0.5, 'rgba(255,226,180,0.5)');
  hot.addColorStop(0.75, 'rgba(255,200,140,0.2)');
  hot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.ellipse(0, bandY - bandH * 0.15, span * 0.9, bandH * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Build a canvas ready for a THREE.CanvasTexture (transparent background). */
export function gargantuaCanvas(w = 1536, h = 640) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  paintGargantua(ctx, w * 0.5, h * 0.5, h * 0.19, -0.18);
  return c;
}
