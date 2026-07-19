// Boot, preloader, quality tiers + governor, the single rAF loop, ?debug.

import { Timeline } from './timeline.js';
import { UI } from './ui.js';
import { StillMode, stillModeRequested } from './still-mode.js';
import { CosmicAudio } from './audio.js';

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

  // sound: off by default, synthesized on demand, works in every mode
  const audio = new CosmicAudio();
  const soundBtn = document.getElementById('sound-toggle');
  soundBtn.addEventListener('click', async () => {
    const on = await audio.toggle();
    soundBtn.textContent = on ? 'SOUND — ON' : 'SOUND — OFF';
    soundBtn.setAttribute('aria-pressed', String(on));
  });

  if (stillWhy) {
    await loadFonts();
    setProgress(0.9);
    // no rAF loop in still mode → eased jumps can't run; jump instantly instead
    timeline.jumpTo = (t) => window.scrollTo(0, t * (document.documentElement.scrollHeight - innerHeight));
    const still = new StillMode(ui, timeline);
    const step = () => {
      still.update(timeline.rawT);
      audio.update(timeline.rawT, 0.016, 0);
    };
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

  let bailed = false;
  function bailToStill() {
    // even T0 can't hold a frame rate — restage the piece rather than stutter
    bailed = true;
    const still = new StillMode(ui, timeline);
    timeline.jumpTo = (tt) => window.scrollTo(0, tt * (document.documentElement.scrollHeight - innerHeight));
    const step = () => {
      still.update(timeline.rawT);
      audio.update(timeline.rawT, 0.016, 0);
    };
    window.addEventListener('scroll', step, { passive: true });
    window.addEventListener('resize', step, { passive: true });
    step();
  }

  function frame(now) {
    if (bailed) return;
    const rawDt = (now - last) / 1000; // unclamped: the honest frame time
    const dt = Math.min(0.05, rawDt);
    last = now;
    const time = now / 1000;

    timeline.update(dt);
    rig.scrollVelocity = timeline.velocity;
    epochs.update(timeline.t, dt, time);
    rig.update(timeline.t, dt, time);
    rig.render();
    ui.update(timeline.t);
    audio.update(timeline.t, dt, timeline.velocity);

    // rolling FPS + downshift-only governor (measured on unclamped frame time)
    if (rawDt > 0) {
      fpsWindow.push(1 / rawDt);
      if (fpsWindow.length > 120) fpsWindow.shift();
      fps = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
      if (governorArmed && fpsWindow.length >= 120 && fps < 48 && tier > 0) {
        tier -= 1;
        rig.applyTier(tier);
        fpsWindow.length = 0;
        governorArmed = false;
        setTimeout(() => { governorArmed = true; }, 3000);
      } else if (governorArmed && fpsWindow.length >= 120 && fps < 30 && tier === 0) {
        bailToStill();
        return;
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
