# UNTIL THE LAST STAR

**The whole of time, compressed into one scroll.**

A scroll-driven WebGL experience: the biography of the universe from the first instant to
the death of the last star. One continuous 3D scene; scrolling is the timeline. The visitor
is not a viewer — their cursor is a small warm light that travels through all of time, and
in the final frame it is the only light left. That is the signature: **the payoff of the
entire piece is that the cursor you've carried for three minutes turns out to be the last
star.**

Design language per `references/REFERENCES.md`; interaction vocabulary informed by
`references/INSPIRATION.md`.

---

## 1. Narrative arc — three acts, nine epochs

Act I — **Ignition** (violence, heat, light being born)
Act II — **Abundance** (structure, galaxies, us — the warm middle of time)
Act III — **The Long Goodbye** (entropy, dimming, the last light)

The emotional spine: the universe gets brighter until "HOME", then the second half of the
piece is the slow exhale. The visitor realizes at "THE FADING" that the story will not end
warmly — and the ending re-frames the whole experience (`you were the light all along`).

### Epoch table

| # | Epoch (index label) | Cosmic time | Scroll | Scene beat |
|---|---------------------|-------------|--------|-----------|
| 0 | *(prologue — no label)* | before time | 0–4% | Title card on deep navy. Faint starfield breathes. "Scroll" whisper. |
| 1 | THE SPARK | t = 10⁻³² s | 4–12% | A single point detonates into an expanding particle field — white-violet, blinding, fast. |
| 2 | THE AFTERGLOW | 380,000 yr | 12–21% | Amber plasma fog everywhere; it cools, thins, and space becomes transparent for the first time. |
| 3 | THE DARK AGES | 100 Myr | 21–29% | Near-black. Faint hydrogen filaments drift and slowly clump. The quietest frame. |
| 4 | FIRST LIGHT | 300 Myr | 29–41% | The first star ignites — the reference-image moment: a huge amber particle sphere with a blown-white core. |
| 5 | THE WEB | 1–10 Gyr | 41–53% | Massive pull-back: galaxies strung along cosmic-web filaments; supernovae spark and seed the elements. |
| 6 | HOME | 13.8 Gyr — NOW | 53–68% | Dive into one spiral arm, to one yellow star, to a pale blue dot. The year counter slows and stops on NOW. Longest dwell. |
| 7 | THE FADING | +5 Gyr → 10¹² yr | 68–79% | The Sun swells red, collapses to a white dwarf. Star formation ends. The sky de-populates and reddens. |
| 8 | THE LONG NIGHT | 10¹² → 10¹⁴ yr | 79–90% | Almost nothing. An empty, reddening sky; red dwarfs gutter out one by one. A black hole lenses the last starlight. |
| 9 | THE LAST STAR | ≈ 10¹⁴ yr — then the numbers alone | 90–100% | The final red dwarf, guttering like a candle, dies at ≈10¹⁴ years. Black. Only then does the counter race on without it — 10¹⁸ → 10⁴⁰ → 10¹⁰⁰ — the numbers outliving the light. The visitor's light is the only light. Title returns, tiny. Tucked credits. |

Pacing: ~70% dwell / 30% transition. Camera scale alternates engulfing close-ups (1, 4, 9)
with vast pull-backs (2→3, 5, 8) — the zoom contrast is the rhythm (per references).

**Scroll length**: ~3,200vh desktop (≈ 30–33 viewport-heights, ≈ 3 minutes unhurried),
~2,300vh mobile. Native scroll on an empty spacer track; nothing is hijacked.

### Text beats

Each epoch carries: one serif headline (2–5 words), and 1–3 whispered captions in mono with
**real numbers as diegetic fact** ("380,000 years after the beginning, the fog lifts").
Copy voice: plain, factual, quietly devastating. No exclamation, no metaphor soup — the
numbers do the awe. Captions are DOM text revealed line-by-line by the same eased timeline
value that drives the scene (crisp, synchronized, cheap). Full copy deck written at build
time, one file (`js/content.js`) so it's editable in one place.

The "HOME" epoch contains the piece's only second-person line: **"You are here. Thirteen
point eight billion years in."** — and "THE LAST STAR" contains its answer: **"The last
light in the universe is yours."**

---

## 2. Interaction inventory (for approval)

### Global layer (always on, every epoch)
- **Camera presence**: pointer position eases the camera ±2–3° (parallax drift, spring-damped,
  never fights scroll). On touch: replaced by slow autonomous drift + device-independent life.
- **Illumination**: particles within a scene-space radius of the cursor ray brighten subtly
  (+15–25% emissive) — your presence warms whatever you're near, in every epoch.
- **Scroll-velocity turbulence**: scroll speed feeds particle agitation and streak/blur —
  scrolling fast literally feels like rushing through time; stopping lets the scene settle.
- **Custom cursor**: native cursor hidden; a small warm-gold dot (~10px, subtle outer glow)
  drawn in DOM, spring-following the pointer. It subtly reflects each epoch (cools to
  blue-white in THE SPARK, warms amber by FIRST LIGHT, ember-red in THE LONG NIGHT). Hidden
  on touch devices and when using keyboard nav.

### Per-epoch signature interactions
| Epoch | Pointer behaviour | Physics it plays |
|---|---|---|
| 1 THE SPARK | Moving the pointer stirs the expanding field — curl-noise swirl injected at the cursor, rippling anisotropies into the burst | You seed the quantum fluctuations that become structure |
| 2 THE AFTERGLOW | The cursor clears the fog locally — plasma particles displace and thin around it, revealing black behind | Wiping condensation off the newborn universe |
| 3 THE DARK AGES | Gravity well: filaments accelerate toward a held cursor, clump, and faintly glow; release and they disperse | You play gravity in a universe that has nothing else |
| 4 FIRST LIGHT | Proximity flares: particles near the cursor ignite as embers and scatter; the protostar's core leans brighter toward your side | Stirring a stellar nursery |
| 5 THE WEB | Slow swirl + deepened parallax: galaxies near the cursor twinkle, drift, and shear as if lensed | A hand passed over the cosmic web |
| 6 HOME | The Sun throws a soft flare toward the cursor; orbit paths illuminate near it; near the pale blue dot, a faint ring of light acknowledges it | The system notices being looked at |
| 7 THE FADING | **Rekindle**: dying stars near the cursor briefly re-brighten — then fade faster than before | You cannot hold them (the piece's most emotional interaction) |
| 8 THE LONG NIGHT | Gravitational lensing distortion follows the cursor near the black hole — the starfield smears and slides around it | Frame-dragging at the horizon |
| 9 THE LAST STAR | The ember leans toward the cursor like a candle flame. After it dies, the cursor dot brightens slightly — the only light left | The cursor becomes the last star |

**The ending pays off on every input mode** (no audience gets an ending without the light):
- *Pointer*: the cursor dot brightens — as above.
- *Touch*: after extinction, an ember-gold dot appears (at the last touch point, else
  centre) and follows the visitor's finger across the black frame, so "the last light in
  the universe is yours" has a referent.
- *Keyboard and Still Mode*: the final frame itself shows the ember dot beside the
  closing line, gently alive (breathing glow; static in reduced-motion).

### Touch equivalents (mobile)
- Scroll remains 100% native with momentum. No gesture stealing.
- **Tap** = a pulse at that point: emits the epoch's signature effect as a radial event
  (spark-swirl, fog-clearing ring, gravity pinch, ember scatter, rekindle flash, lens ripple).
- Scroll-velocity turbulence carries most of the "alive" feeling on mobile for free.
- Scene has autonomous micro-motion everywhere (slow rotation, drift, shimmer) so it never
  looks paused without a hover state.

---

## 3. Visual & technical approach per epoch

One `WebGLRenderer`, one `Scene`, one shared architecture: every epoch is a module
(`js/epochs/*.js`) exporting `{ range, init(), enter(), update(t, dt, pointer), exit(), dispose() }`.
Epochs lazy-`init()` when the timeline comes within ~8% of their range; at most two epochs
are active during a crossfade; distant epochs release their GPU resources.

All matter is particles + additive glow (per the references — grain and light, never smooth
meshes). Particles are `BufferGeometry` point clouds animated **in the vertex shader**
(uniforms: time, epoch-local progress, pointer ray, agitation) — zero per-particle CPU work.
Transitions between epochs are choreographed camera moves + particle-target morphs
(attribute A → attribute B lerped by a shader uniform), so the world never "cuts".

- **1 THE SPARK** — 80k-point radial burst; positions on a noise-jittered sphere, velocity
  outward in the shader; white-violet → cooling amber over the epoch; camera pushed back by
  the expansion. Curl-noise uniform injects the pointer swirl.
- **2 THE AFTERGLOW** — 3–4 large layered planes with animated FBM noise (fake volumetric
  fog, very cheap) + 40k plasma sparks; global color temperature lerps 3000K-orange →
  transparent; fog alpha decays to reveal the starfield skybox for the first time.
- **3 THE DARK AGES** — 60k particles pre-distributed along noise-biased filaments
  (generated once at init); near-black palette, faint indigo; slow gravitational drift
  baked into the shader; cursor gravity via a pointer-ray uniform.
- **4 FIRST LIGHT** — the hero object: ~120k-particle sphere with radial density falloff,
  additive blending, blown-out core via bloom-free trick (core sprite + exponential falloff
  texture — no postprocessing pass needed at tier 1/0). Ignition flash mid-epoch (screen
  flash + audio ping + counter jump).
- **5 THE WEB** — instanced galaxy impostors (a few thousand `InstancedMesh` quads with a
  procedural spiral-galaxy sprite texture drawn once to an offscreen canvas) along 3D
  filaments; supernova events: timed bright points + expanding ring shader.
- **6 HOME** — spiral-arm particle galaxy (log-spiral distribution) → camera dives to a
  single warm star (reuses the FIRST LIGHT sphere at yellow-white, smaller) → planets as
  luminous points with hairline orbit lines; the pale blue dot gets two pixels and a ring
  of attention. Skybox stars dense and colorful here — peak abundance.
- **7 THE FADING** — the star sphere expands ×40 and reddens (same particle rig, new
  targets), then collapses to a tiny white dwarf; skybox star count and temperature decay
  along the epoch; rekindle interaction runs on the skybox shader.
- **8 THE LONG NIGHT** — a handful of ember-red dwarfs; one black hole: a dark disc +
  screen-space lensing distortion in a fullscreen shader (tier-gated) + thin hot accretion
  line; starfield sparse, near-monochrome.
- **9 THE LAST STAR** — single ~30k-particle ember with candle-like flicker (low-frequency
  noise on brightness); its extinction is scroll-driven (not timed) so the visitor performs
  it; then black frame, DOM-only typography, cursor glow-up.

**Skybox**: one shared points-based starfield (~20k) whose density, color temperature and
brightness are *globally driven by the timeline* — it is the single continuous thread that
makes ten epochs feel like one universe aging.

---

## 4. Typography system

Two voices only (per references). Chosen for character and free licensing (Google Fonts):

- **Display — Bodoni Moda** (variable: weight + optical size, real italic). A true didone:
  hairline thins against fat stems, and the optical-size axis keeps hairlines crisp at
  20vh scale. Set in all caps, tight lines, generous letterspacing; *one italic line per
  lockup* (the reference's single twist — e.g. "UNTIL THE *LAST* STAR"). Not Playfair —
  Bodoni Moda is sharper, less templated, and the optical axis is genuinely functional here.
- **Micro/utility — Martian Mono** (variable: weight + width). A wide, instrument-grade
  mono — reads as spacecraft telemetry at 9–11px uppercase with 0.22em tracking. Used for:
  wordmark, epoch index, captions, year readout, toggles, credits. Its condensed width axis
  lets the year readout tick without layout shift.

Scale (desktop → mobile via clamp):
- Title lockup: `clamp(3.5rem, 17vh, 13rem)` per line, line-height 0.95
- Epoch headline: `clamp(2rem, 8vh, 5.5rem)`
- Caption: 13px / 1.9 (mono, max-width 34ch)
- Micro UI: 10px, uppercase, 0.22em tracking

Opacity system (all UI is white on scene): **100%** active · **55%** secondary ·
**30%** resting · **12%** hairlines. No greys — opacity only, so the scene's color always
bleeds through and the UI feels printed on space.

---

## 5. Palette

Color belongs to the physics; the UI stays white + one accent.

- `--void: #08070F` (deepest space, end of time) · `--dusk: #10122A` (prologue navy)
- `--paper: #EDE9E0` (type white — warm, never pure)
- `--ember-gold: #E4B85C` — **the accent**: cursor dot, active index item, focus rings,
  the last star. One saturated color in the whole piece; it *is* the visitor.
- Scene temperatures (shader-driven, not UI): violet-white `#C9C4FF` (Spark) → plasma amber
  `#E08A4E` (Afterglow) → indigo `#232848` (Dark Ages) → star amber `#F0A860`/core `#FFF4E2`
  (First Light) → blue-white `#BFD3F2` + warm cores (Web) → sun yellow `#FFD98C` + pale blue
  `#8FB8D8` (Home) → giant red `#C25538` (Fading) → dwarf ember `#772019` (Long Night) →
  final ember `#8A2A1D` → black.

The overall journey: **blue-violet → amber → blue-white → gold → red → black** — the actual
thermodynamic story of the universe, told in color temperature.

---

## 6. UI inventory (complete — nothing else exists)

1. **Wordmark**, top-left: "UNTIL THE LAST STAR", micro mono, 30% → 55% on hover, links to top.
2. **Epoch index**, left edge, vertically centered: nine micro labels + a 12%-opacity
   hairline rule; active label 100% + ember-gold tick; others 30%. Each is a real `<button>`
   (clickable → eased scroll jump ~1.6s; focusable; `aria-current`). On mobile: collapses to
   nine 3px ticks on the left edge (labels appear only on the active one).
3. **Year readout**, bottom-left: mono, e.g. `T + 380,000 YEARS` — the diegetic progress
   indicator. Non-linear mapping (log through the early universe, linear-feeling through
   HOME, then exponents through Act III up to `10¹⁴ YEARS` at the last star's death; the
   race through `10¹⁸ → 10⁴⁰ → 10¹⁰⁰ YEARS` happens only in the post-extinction black
   frame — the numbers outliving the light). Stops on `NOW` during HOME's dwell — the
   piece's quietest flex.
4. **Sound toggle**, bottom-right: `SOUND — OFF` / `SOUND — ON`, micro mono, 30%.
5. **Scroll whisper**, prologue only: `SCROLL` + 12% hairline that drains downward once;
   fades permanently after first scroll.
6. **Credits, tucked** (per brief): in the final black frame only, bottom edge, 30% opacity
   micro mono: `MADE BY ZAYN · CODE · PORTFOLIO` (links placeholder — supply final
   text/URLs before ship). Also one HTML comment credit. Nothing during the story.
7. **Cursor dot** (desktop only) — see interaction inventory.

---

## 7. Sound (self-sourced: 100% procedural WebAudio — no assets, no licensing)

Off by default (autoplay policy makes this mandatory anyway); the toggle starts/suspends an
`AudioContext`. Three synthesized layers, all timeline-driven:

1. **The drone** — two detuned sines + a soft triangle an octave down (~55Hz region);
   pitch glides down nearly an octave across all of time; volume swells at transitions.
2. **Radiation** — filtered brown noise; the low-pass cutoff tracks the universe's
   temperature (hissing-bright at THE SPARK, nearly closed by THE LONG NIGHT).
3. **Events** — sparse struck-glass partials (short enveloped sine stacks) on star
   ignitions, supernovae, and epoch boundaries; a single low bell when the last star dies,
   then true silence for the black frame.
Scroll velocity adds a faint shimmer (noise send). Reduced-motion users still get sound
if they opt in — it's non-motion. Total cost: a few hundred lines, zero bytes of media.

---

## 8. Architecture & performance

**Stack**: vanilla ES modules, import map pinning `three` from a CDN, no build step.
Shaders as template-literal strings in their epoch modules. Deploys as static files.

```
index.html          css/main.css        js/main.js (boot, loop, quality)
js/timeline.js      (scroll → smoothed t; spring; jump API)
js/content.js       (all copy + epoch ranges — single source of truth)
js/scene.js         (renderer, camera rig, skybox, pointer ray)
js/epochs/00-prologue.js … 09-laststar.js
js/ui.js            (index, readout, captions, cursor, toggles)
js/audio.js         js/still-mode.js    (fallback renderer, see §10)
```

- **Timeline**: raw `scrollY / (scrollHeight − innerHeight)` → critically-damped spring in
  the rAF loop → eased `t` consumed by camera, epochs, UI, audio. Keyboard paging works
  natively (it's real scroll). Velocity derived from the spring feeds turbulence.
- **Camera**: one spline-driven rig (position + look-target keyframed per epoch boundary,
  eased per-segment) + the pointer parallax layer on top.
- **Budgets**: target 60fps mid-range laptop. DPR capped at 2 (desktop) / 1.5 (mobile).
  Single rAF; pointer effects are uniforms in existing shaders (zero extra passes).
- **Quality tiers**: T2 full (all counts above, lensing, fog layers) · T1 (DPR 1.5, 60%
  particle counts, lensing on, 2 fog layers) · T0 (DPR 1, 35% counts, lensing off, 1 fog
  layer). Governor: rolling 2s average FPS < 48 → downshift one tier (never up-shifts back,
  no oscillation). Initial tier guessed from `navigator.hardwareConcurrency`, `deviceMemory`
  and a 20-frame boot benchmark.
- **Memory**: epochs dispose geometry/textures on exit-with-distance; shared materials
  where rigs are reused (FIRST LIGHT sphere ↔ HOME sun ↔ THE FADING giant).
- **`?debug` flag**: URL param renders a corner overlay with live FPS, current quality
  tier, and timeline `t` (raw + smoothed). Used by the verifier; also `?still` forces
  Still Mode (§10).

---

## 9. Loading (act zero)

`<html>` ships with inline critical CSS: `--dusk` background immediately — **no white flash
ever**. The preloader is the story's first frame: wordmark in micro mono, a 12% hairline
that fills ember-gold with real progress (fonts via `FontFace.load`, three.js import,
epoch-0/1 `init()`, `renderer.compile()` warm-up), and beneath it the counter's first
appearance: `CALIBRATING 13,800,000,000 YEARS`. Minimum display 900ms so it reads as
intentional even on fast connections; then the hairline becomes the title's underline as
the starfield fades in — the loader dissolves *into* the prologue rather than being removed.

---

## 10. Fallbacks — one "Still Mode" serving three audiences

A single alternate renderer covers **reduced-motion, WebGL-unavailable, and hopeless
hardware** (T0 still failing after two downshifts):

- The same nine epochs as full-viewport static frames: CSS gradient + pre-drawn 2D-canvas
  starfield compositions per epoch (no rAF loop, no WebGL), same typography, same copy,
  same index, same year readout.
- Scrolling steps between frames with plain crossfades (`prefers-reduced-motion`: opacity
  only, 300ms, or instant). The epoch index and keyboard nav work identically.
- Entered automatically (media query / capability detection / governor bail-out) and
  manually via `?still` for testing. The story survives intact — only the staging simplifies.

Accessibility floor: real `<h2>` per epoch in DOM order, `aria-current` on the index,
visible ember-gold focus rings, all interactive elements are native elements, captions are
real text, `lang="en"`, works scrolled by keyboard end-to-end.

---

## 11. Build stages (post-approval)

1. Scaffold: index.html, timeline, camera rig, skybox, epoch module system, UI shell, preloader. ✅ verify 1440/390
2. Prologue + THE SPARK + THE AFTERGLOW. ✅ verify
3. THE DARK AGES + FIRST LIGHT (hero rig). ✅ verify
4. THE WEB + HOME. ✅ verify
5. THE FADING + THE LONG NIGHT + THE LAST STAR + credits. ✅ verify
6. Pointer interaction pass (global layer + all nine signatures). ✅ verify
7. Audio. Still Mode. Quality governor. Mobile pass. ✅ verify
8. Copy polish, meta/OG, favicon (ember dot), final performance audit. ✅ verify

Each stage: webapp-testing screenshots at 1440px and 390px, plus a scroll-through
capture; commit after each verified stage (repo needs `git init` — will do at stage 1).

### Autonomous run protocol (approved)

All 8 stages run without stopping for approval. Per stage: (1) build; (2) invoke the
`verifier` subagent (`.claude/agents/verifier.md`) against its checklist — it serves the
site, runs Playwright at 1440px/390px, captures to `verify/stage-N/`, checks console
errors, FPS via `?debug`, scroll/keyboard/index behaviour, `?still`, reduced-motion;
(3) on FAIL, fix and re-verify, max 3 cycles, then log the open defect in PROGRESS.md
with a diagnosis and move on; (4) on PASS, commit `stage N: <summary> [verified]` and
proceed immediately. PROGRESS.md at root is the resume point for fresh sessions: current
stage, verdicts, open issues, decisions. Never delete anything under `verify/`. Stop only
for genuine blockers; design calls are made, noted in PROGRESS.md, not asked.
