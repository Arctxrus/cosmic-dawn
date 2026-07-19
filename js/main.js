// Boot, preloader, quality tiers + governor, the single rAF loop, ?debug.

import { Timeline } from './timeline.js';
import { UI } from './ui.js';
import { StillMode, stillModeRequested } from './still-mode.js';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

const preFill = document.getElementById('pre-fill');
const preStatus = document.getElementById('pre-status');
const preloader = document.getElementById('preloader');
const bootStart = performance.now();

function setProgress(p, label) {
  preFill.style.width = Math.round(p * 100) + '%';
  if (label) preStatus.textContent = label;
}

async function loadFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('500 80px "Bodoni Moda"'),
        document.fonts.load('italic 400 80px "Bodoni Moda"'),
        document.fonts.load('400 10px "Martian Mono"'),
      ]),
      new Promise((r) => setTimeout(r, 3500)), // never hold the universe for a font
    ]);
  } catch { /* system fallbacks are acceptable */ }
}

function detectTier() {
  if (params.has('tier')) return Math.max(0, Math.min(2, +params.get('tier') || 0));
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const mobile = innerWidth <= 768;
  if (cores >= 8 && mem >= 8 && !mobile) return 2;
  if (cores >= 4) return mobile ? 1 : 2;
  return 1;
}

async function dismissPreloader() {
  const elapsed = performance.now() - bootStart;
  if (elapsed < 900) await new Promise((r) => setTimeout(r, 900 - elapsed));
  setProgress(1);
  preloader.classList.add('done');
  setTimeout(() => preloader.remove(), 1300);
}

// ---------------------------------------------------------------------------

async function boot() {
  setProgress(0.1, 'CALIBRATING 13,800,000,000 YEARS');
  const timeline = new Timeline();
  const ui = new UI(timeline);
  const stillWhy = stillModeRequested();

  if (stillWhy) {
    await loadFonts();
    setProgress(0.9);
    // no rAF loop in still mode → eased jumps can't run; jump instantly instead
    timeline.jumpTo = (t) => window.scrollTo(0, t * (document.documentElement.scrollHeight - innerHeight));
    const still = new StillMode(ui, timeline);
    const step = () => still.update(timeline.rawT);
    window.addEventListener('scroll', step, { passive: true });
    window.addEventListener('resize', step, { passive: true });
    step();
    if (DEBUG) initDebug(() => ({ fps: '—', tier: `still (${stillWhy})`, t: timeline.rawT }));
    await dismissPreloader();
    return;
  }

  setProgress(0.25, 'WARMING THE ENGINES');
  const [{ SceneRig }, { EpochManager }, { createSpark }, { createAfterglow }, { createDarkAges }, { createFirstLight }, { createWeb }, { createHome }, { createFading }, { createLongNight }, { createLastStar }] =
    await Promise.all([
      import('./scene.js'),
      import('./epochs/manager.js'),
      import('./epochs/01-spark.js'),
      import('./epochs/02-afterglow.js'),
      import('./epochs/03-darkages.js'),
      import('./epochs/04-firstlight.js'),
      import('./epochs/05-web.js'),
      import('./epochs/06-home.js'),
      import('./epochs/07-fading.js'),
      import('./epochs/08-longnight.js'),
      import('./epochs/09-laststar.js'),
      loadFonts(),
    ]);
  setProgress(0.6, 'PLACING THE STARS');

  let tier = detectTier();
  const rig = new SceneRig(document.getElementById('scene'), tier);
  const epochs = new EpochManager(rig);
  epochs.register(createSpark());
  epochs.register(createAfterglow());
  epochs.register(createDarkAges());
  epochs.register(createFirstLight());
  epochs.register(createWeb());
  epochs.register(createHome());
  epochs.register(createFading());
  epochs.register(createLongNight());
  epochs.register(createLastStar());
  epochs.update(timeline.rawT, 0.016, 0); // init near epochs behind the preloader
  rig.renderer.compile(rig.scene, rig.camera);
  rig.update(timeline.rawT, 0.016, 0);
  rig.render(); // first frame behind the preloader — reveal is seamless
  setProgress(0.95);
  await dismissPreloader();

  // ---- the single rAF loop ----
  let last = performance.now();
  let fps = 60;
  const fpsWindow = [];
  let governorArmed = false;
  setTimeout(() => { governorArmed = true; }, 4000); // ignore boot turbulence

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    timeline.update(dt);
    rig.scrollVelocity = timeline.velocity;
    epochs.update(timeline.t, dt, time);
    rig.update(timeline.t, dt, time);
    rig.render();
    ui.update(timeline.t);

    // rolling FPS + downshift-only governor
    if (dt > 0) {
      fpsWindow.push(1 / dt);
      if (fpsWindow.length > 120) fpsWindow.shift();
      fps = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
      if (governorArmed && fpsWindow.length >= 120 && fps < 48 && tier > 0) {
        tier -= 1;
        rig.applyTier(tier);
        fpsWindow.length = 0;
        governorArmed = false;
        setTimeout(() => { governorArmed = true; }, 3000);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (DEBUG) initDebug(() => ({ fps: fps.toFixed(0), tier: `T${tier}`, t: timeline.t, raw: timeline.rawT }));
}

function initDebug(read) {
  const el = document.getElementById('debug');
  el.hidden = false;
  setInterval(() => {
    const d = read();
    el.textContent =
      `FPS ${d.fps}\nTIER ${d.tier}\nT ${(+d.t).toFixed(4)}` +
      (d.raw !== undefined ? `\nRAW ${(+d.raw).toFixed(4)}` : '');
  }, 250);
}

boot();
