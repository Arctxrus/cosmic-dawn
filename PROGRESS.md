# PROGRESS — Until the Last Star

Autonomous build protocol per CONCEPT.md §11. Resume point for any fresh session:
read CONCEPT.md (approved, includes Act III chronology fix + all-input-mode ending +
?debug), then this file, then continue from **Current stage** below. Verifier agent:
`.claude/agents/verifier.md` — invoke after each stage, max 3 fix cycles, commit
`stage N: <summary> [verified]` on PASS. Never delete anything under `verify/`.

## Status: COMPLETE — 8 stages + final revision pass + Gargantua redesign (2026-07-19)

### Black hole redesign (Gargantua) + resilience layer ✅ PASS (3 cycles)
Screenshots: verify/blackhole/. What shipped:
- **T2**: js/lensing.js rewritten as a bent-ray Gargantua renderer — per-pixel rays
  deflect around the mass (single-deflection approximation) and sample a procedural
  disc, so the far side folds into arcs above/below the shadow; photon ring at the
  critical impact parameter; doppler beaming (approach side bright/white); background
  starfield warps through the same deflection. Composition: tilted, anchored right,
  band bleeding off-frame. Verifier scorecard: all 7 resemblance criteria PASS.
- **Interaction**: pointer never moves the hole/disc. Camera parallax orbit only
  (spring-smoothed, idles back to rest after 2.5s — scene.js _parallaxEase); lensing
  recomputed from the real camera each frame, so arcs/ring shift with viewpoint
  (verified: arc radii shift 16-28px vs ≤10px noise; hole moves only 0.69% frame).
  Old ring-lean/infall-smear pointer effects removed with the old meshes.
- **T1/T0 + fallback**: pre-composed painted sprite (js/gargantua-sprite.js) — same
  composition, static; shown whenever the lens isn't active. Still Mode paints the
  same composition into its long-night frame. Long-night text now left-aligned
  (content.js align field); desktop scrim added for this epoch.
- **Resilience layer (NEW this pass — it did not previously exist in this repo,
  despite earlier plans)**: boot().catch → emergencyStill (reuses UI/timeline if
  already built); 15s preloader watchdog; rAF-stall watchdog (4s) + webglcontextlost
  → bailToStill; cursor watchdog in ui.js (native cursor restored if the dot loop
  stalls >2.5s); LensPass feature-detected at init and guarded per-frame.
- Cycle 1 FAIL: sprite read as flat Saturn-ring; boundary pops at 0.79/0.90; desktop
  caption wash. Cycle 2 FAIL: pops persisted with magenta floor — TRUE root cause
  found by pixel probes: the lens RT stored the scene LINEAR in 8 bits, crushing the
  dark floor to (1,0,1) bytes; fixed with HalfFloatType RT + exact sRGB OETF on the
  background (boundary now byte-identical rgb(8,7,15) both sides); sprite arcs were
  inverted (canvas y-down sign). Cycle 3 PASS: smooth luma series both boundaries,
  no tint, over-arc 1.67x under-arc, 60fps T2+L.
- Software-WebGL (SwiftShader) run: full chain verified — T2+L → T1 (6.5s) → T0
  (12.7s) → Still Mode bailout (25.4s); post-bail scroll steps still frames and the
  native cursor is restored. IN-APP BROWSER UPDATE: the hard-freeze the Claude
  in-app pane exhibited was reproduced only by the PRE-Gargantua build; after the
  redesign (half-float lens RT, old infall/ring meshes removed) the pane runs the
  FULL piece at 118-120fps T2+L — verified with a 15-stop journey inside the pane
  itself (UA `Claude/… Electron/42.5.1`, real RTX 3060 via ANGLE). An Electron
  auto-still guard was prototyped and then removed as obsolete. RESIDUAL known
  limitation (unchanged in principle): if any embedder ever halts the whole tab,
  JS timers freeze with the rAF loop and no in-page watchdog can fire — the
  watchdogs cover every case where the page still gets CPU; `?still` remains the
  manual escape hatch.

## Previous status: 8 stages + final revision pass (detail below)

### Final revision pass ✅ (2 verifier cycles for groups A+B, 1 for item 5 + full regression)
Screenshots: verify/final-pass/. Items:
1. **Text protection (sitewide, mobile-first)**: portrait camera pitch (-0.12 rad,
   heroes ride high), all mobile epoch text bottom-anchored (15vh) over the darker
   lower third, soft radial scrim (~34% peak, feathered — activates with the text),
   heavier shadows; mobile padding-left clamp(130px,35vw,152px) clears the widest
   active index label; FADING giant scaled 0.72x on portrait. Luma table: worst
   headline background 14.6% >180 (was 26.9%), all epochs every-word-readable.
2. **Real gravitational lensing at T2** (js/lensing.js): screen-space pass —
   Einstein-ring distortion, absolute shadow, doppler photon ring, cursor
   frame-dragging. T1/T0 keep the fake meshes; governor drops the lens FIRST
   (<55fps while active; verified chain under 20x throttle: T2+L → T2 → T1 → T0).
   60fps at T2+L on the RTX 3060. Debug tier reads "T2+L".
3. **Crisper particles**: 256px tight-core glow texture, crisp-core falloff terms in
   all 10 point shaders, hero counts at T2 raised (first light 160k, home galaxy
   120k, ember 45k). Measured +85-90% high-frequency energy vs baselines, 60fps.
4. **Rekindle memory**: persistent screen-space scorch map (128x64 canvas texture) —
   in THE FADING, recently-died skybox stars REVIVE near the cursor (bright gold,
   size-boosted) and carry a full extinction penalty after the cursor leaves;
   memory clears scrolling back below t=0.66. Cycle-1 version was invisible
   (multiplied near-zero alpha); redesigned to additive revival. Verified
   B>>A>C≈D star-pixel counts. Still "understated at a glance" per verifier —
   acceptable; noted below.
5. **THE WEB two-level LOD** (kept — no revert needed): 6 corridor-nearest impostors
   morph into 5.5k-point particle spirals over a camera-distance window (85→45 wu);
   spirals persist into the dive (t≤0.585). Verified: monotonic hand-over (no pops,
   no double-exposure), 60fps, "reads as parallax through resolved bodies, not a
   crossfade" (verifier).
6. **Credits**: MADE BY ZAYN → github.com/Arctxrus, CODE → github.com/Arctxrus/cosmic-dawn,
   PORTFOLIO → placeholder constant PORTFOLIO_URL at top of js/content.js (null → span).

Full final regression: PASS (journeys both viewports, ?still, reduced-motion,
keyboard incl. End→10¹⁰⁰ and focus rings, tier chain, credits DOM, zero console
errors everywhere, 60fps at all 11 probe points).

Run locally: `python -m http.server 8080` in the project root → http://localhost:8080
(never port 8123 on this machine — occupied by an unrelated site).
Flags: `?debug` (FPS/tier/t overlay) · `?tier=0|1|2` (force tier) · `?still` (force Still Mode).

### Stage 8 — final polish + deliverables ✅ PASS (2 cycles)
Built: epoch-index text-shadow (legible over the accretion disk in the flagged pose —
verified fixed), cursor mix-blend-mode:screen (never hides UI text), inline-SVG ember
favicon, og:type/twitter meta, README.md.
- Cycle 1 FAIL: no visible focus ring on index buttons (all:unset beat the global
  :focus-visible rule — third strike for that cascade) → id-level focus selectors.
- Cycle 2 PASS. Full final sweep: cold load clean, 20-step journey zero errors,
  all 9 index landings exact (one-third into each epoch), FPS 60 at T2 at six
  positions, governor T2→T1 in ~9s under 10x throttle, mobile 8-step journey clean
  with strong tap pulse (RMS 79 vs 12 control), ?still all epochs + ending ember,
  reduced-motion auto-still, a11y checks (lang, h2s, buttons, aria, focus rings).
- Known cosmetic margin: "FIRST LIGHT" index label over the white-hot disk band at
  t≈0.845 in an extreme pointer pose is the lowest-contrast frame — readable, noted.
- Not machine-verifiable: audible audio output (headless CI has no speakers) — the
  procedural score needs one human listen-through; graph lifecycle/automation values
  were verified programmatically.
- Screenshots: verify/stage-8/.

### Stage 7 — audio + governor bail-out + mobile polish ✅ PASS (2 cycles)
Built: js/audio.js — fully procedural WebAudio (descending drone, temperature-tracked
brown-noise radiation, struck-glass events at ignition/collapse, low bell at
extinction then true silence, supernova pings in THE WEB, scroll shimmer, master
limiter). Off by default; toggle works in scene + still modes. Governor: added
bail-to-Still-Mode rung (T0 sustained <30fps → runtime restage); verified full chain
T2→T1→T0→Still under 20x CPU throttle. touch-action: manipulation.
- Cycle 1 FAIL: #sound-toggle unclickable — all:unset re-inherited #chrome's
  pointer-events:none (cascade beat the #chrome>* restore rule) → explicit
  pointer-events:auto on #sound-toggle and #epoch-index button. Also fixed from
  observation: governor FPS now measured on unclamped frame time (dt clamp had
  floored the metric at 20, slowing bail on hopeless hardware).
- Cycle 2 PASS: real clicks + mobile tap + still-mode click all work; AudioContext
  lifecycle verified via constructor trap; index clicks unregressed.
- Headless limitation noted: audible output/timbre not verifiable in CI — needs one
  human listen-through (flagged for the final report).
- Screenshots: verify/stage-7/.

### Stage 6 — pointer interaction pass ✅ PASS (1 cycle)
Built: unified rig.pointerStrength (fine pointer steady; touch tap = decaying 1.6
pulse landing at the touch point — fires every epoch signature). Skybox pointer
illumination everywhere + rekindle voltage in THE FADING (warm-gold flares near
cursor). All 9 epoch modules converted to pointerStrength. HOME orbit lines brighten
with presence. Cursor dot tints per epoch (violet→amber→red→gold) and grows to 13px
ember after extinction (body.after-extinction).
- Cycle 1 PASS with pixel-level measurements for all 9 signatures + parallax + touch
  pulse + FPS-under-motion (60fps). Post-verify: rekindle strengthened (2.2/2.6
  multipliers, was measured 2.1x noise but visually subtle — verifier observation).
- Polish notes for stage 8: (a) index labels wash out over accretion disk in one
  extreme pointer pose at t≈0.845; (b) re-check rekindle visibility after boost.
- Screenshots: verify/stage-6/.

### Stage 5 — The Fading + The Long Night + The Last Star ✅ PASS (2 cycles)
Built: 07-fading.js (red giant swell → white-dwarf collapse with "exhale" bloom,
COLLAPSE_T exported), 08-longnight.js (black hole: black disc + doppler photon ring +
spiral infall points + 5 guttering dwarfs; DESIGN CALL: true screen-space lensing
skipped — the spiral infall + photon ring sell the hole without a postprocessing
pass; pointer smear/lean hooks already in shaders), 09-laststar.js (ember star,
candle flicker, scroll-driven extinction at t=0.96, reversible). Camera through 1.0.
Self-caught pre-verifier: giant swallowed captions (radius 26→17 + camera retreat),
long-night black disc silhouetted into neighbor epochs (group hidden when env≈0),
keyboard users got no ending light (fallback dot when body lacks .has-pointer).
- Cycle 1 FAIL: mobile credits wrapped into year readout + mobile fallback dot on
  caption text → credits nowrap/max-content + mobile bottom 56px/8px; dot to 30% height.
- Cycle 2 PASS. Full third act verified: flicker, extinction, relight on scroll-back,
  counter race to exactly 10¹⁰⁰, ending light on desktop-no-pointer/mobile/still.
  60fps everywhere incl. 8x CPU throttle (GPU-bound). Screenshots: verify/stage-5/.

### Stage 4 — The Web + Home ✅ PASS (2 cycles)
Built: 05-web.js (instanced galaxy impostors on filaments — same sine-filament family
as dark ages for continuity; supernova cross-flares scroll-fired + 11s time-clock
re-fires), 06-home.js (4-arm log-spiral galaxy 90k, Sun via shared makeStarRig,
8 planet points + additive orbit hairlines, pale-blue-dot glow ring normal-blended,
NOW hold). Camera: z=260 pull-back → galaxy approach → arm skim → ¾ arrival.
Self-caught: sun originally filled the frame (radius 5.5→3.0, camera pulled back+up);
orbit lines additive so they vanish over the bright disk.
- Cycle 1 FAIL: mobile arrival captions over the sun core → #epoch-home bottom-anchored
  on mobile (12vh padding). Also fixed from observations: desktop sun seated left of
  center (camera look nudge), parked nova re-fires, NOW window widened to 0.5985.
- Cycle 2 PASS: 0.00% bright pixels behind mobile captions, sun at 43.4% frame x,
  8 parked flashes in 14s (11.0s refire period confirmed), NOW at raw 0.6000,
  60fps T2 / 59 T1. Screenshots: verify/stage-4/.

### Stage 3 — Dark Ages + First Light ✅ PASS (2 cycles)
Built: js/epochs/03-darkages.js (filament field, cursor gravity-well uniform),
04-firstlight.js (hero star rig — exported makeStarRig for reuse by HOME/FADING;
ignition flash at t=0.35), camera through t=0.41. Self-caught pre-verifier: filaments
too faint (alpha 0.28→0.5, size up).
- Cycle 1 FAIL: mobile right-aligned captions collided with active index label →
  mobile now forces left alignment for ALL epoch text, padding-left clamp(110px,30vw,130px).
  Also fixed from observations: ignition epsilon (parked exactly at t=0.35 now reads lit),
  pre-ignition clump alpha reduced.
- Cycle 2 PASS. Overlap 0px², parked-at-0.35 luma 98.6 (lit), FPS 59-60 everywhere.
- Screenshots: verify/stage-3/.
- NOTE: subagent transcripts do NOT survive to be resumed later in this environment —
  spawn a fresh verifier agent per cycle with a self-contained prompt (include the
  GPU launch args, port rule, spring-settle wait, and ?debug reading instructions).

### Stage 2 — Prologue + Spark + Afterglow ✅ PASS (2 cycles)
Built: js/epochs/{manager,util,01-spark,02-afterglow}.js wired into main loop; camera
keyframes through t=0.21; scroll-velocity agitation; shared glow-sprite helper.
- Cycle 1 self-caught before verifier (smoke test): camera was inside the blast (moved
  keyframe z 70→95), fog fbm cheapened (4 octaves + vnoise warp), spark got core glow +
  density falloff, desktop epoch-text left padding now clamp(180px,15vw,260px) to clear
  the index, global text-shadow added.
- Verifier cycle 1 FAIL: mobile captions illegible over the blast → heavier mobile-only
  text-shadow + caption opacity 0.8. Cycle 2 PASS.
- FPS 60 @ T2 on real GPU (RTX 3060 via --use-angle=d3d11; SwiftShader gives ~20-34 and
  must NOT be used for FPS judgment). Boundary crossings verified as continuous.
- Screenshots: verify/stage-2/.
- Note for future stages: verifier must launch Chromium with
  ["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"].

## Stage log

### Stage 1 — scaffold ✅ PASS (3 cycles)
Built: index.html, css/main.css (full type/opacity/UI system), js/content.js (single
source of truth: epochs, ranges, copy, year mapping incl. NOW-hold and post-extinction
race), js/timeline.js (native scroll → spring-smoothed t, eased jumpTo cancellable by
user input), js/scene.js (renderer, tiered DPR, keyframed camera + pointer parallax,
20k-star aging skybox shader), js/ui.js (index, readout, captions, credits, cursor,
ending light), js/still-mode.js (reduced-motion / no-WebGL / ?still), js/main.js
(preloader, tier detect, governor downshift-only <48fps, ?debug overlay).
- Verifier verdict: **PASS** after 3 cycles. Cycle 1 FAIL: `.epoch-text` parent kept
  `opacity: 0` (children faded inside an invisible parent) → fixed. Cycle 2 FAIL:
  mobile h2 clipped at right edge + collided with active index label → fixed with
  mobile `clamp(1.5rem, 8vw, 2.4rem)` + padding `0 8vw 0 18vw`. Cycle 3 PASS.
- FPS 60.3–60.4 desktop T2 / 60.4 mobile T1 (SwiftShader). No console errors.
- Screenshots: verify/stage-1/ (01–08 originals, -fix2, -fix3).
- Open issues: none. Watch: mobile THE SPARK h2 bottom sits 2px above active label —
  fine now, re-check if copy changes. Verifier agent note: `.claude/agents/verifier.md`
  frontmatter was malformed (\--- escapes) — fixed, but agent registry only reloads at
  session start, so this session runs the verifier via a general-purpose agent carrying
  the same instructions (agent id af93c0a81a8383422 — reuse via SendMessage for
  re-verifies). Also: port 8123 is occupied by an unrelated local site — verifier must
  use a fresh port + check served <title>.

## Decisions made (not in CONCEPT.md)
- Cursor dot runs its own rAF (DOM-only); merge into main loop later if it ever shows
  in profiles.
- Still Mode uses instant epoch-index jumps (eased jump needs the rAF loop; instant is
  also the right reduced-motion behaviour).
- `?tier=N` URL param forces a quality tier (testing aid alongside `?debug`).
- Epoch text alternates left/right alignment by index parity for compositional variety.
- Credits: `MADE BY ZAYN · CODE · PORTFOLIO` — CODE/PORTFOLIO hrefs are placeholders
  (github.com / ../) until the user supplies real URLs.

## Deferred / later stages
- Epoch scene modules (stages 2–5): js/epochs/*.js not yet created; scene.js camera
  keyframes are placeholders to be replaced by per-epoch choreography.
- Audio (stage 7): sound toggle is present but a no-op until then.
- Per-epoch pointer signatures (stage 6).

## 2026-08-07 · Domain migration to Cloudflare Pages
- New URL: https://star.pagefront.co.uk (served at domain root, no project subpath).
- Hosting moved to Cloudflare Pages, auto-deploy on push to main.
- Added `canonical` and `og:url` to the head (the site had other og tags but neither of
  these); both point to the new subdomain, added in the existing head style.
- No `github.io` references, `<base>` tags or absolute `/cosmic-dawn/` asset paths
  existed, so no path fixes were needed; all references were already relative or CDN.
- No CNAME file present.
- No `?v=` cache-busting scheme exists in this repo (module imports + importmap, plain
  `css/main.css`); Cloudflare Pages handles caching, so no scheme to bump.
- `PORTFOLIO_URL` in js/content.js set from `null` to `https://pagefront.co.uk`; the
  PORTFOLIO credit link now resolves to it (rel="noopener", no target="_blank", matching
  the file's existing link convention in js/ui.js `_buildCredits`).
- Owner name removed from the credits: `MADE BY ZAYN` (href github.com/Arctxrus) became
  `MADE BY PAGEFRONT` (href PORTFOLIO_URL) so the owner's name no longer appears on the
  shipped site. Judgement call: relabelled to the Pagefront brand and repointed to the
  portfolio rather than dropping the entry. See report; orchestrator may prefer a
  different label.
- Flagged for orchestrator: the CODE credit still links to
  `github.com/Arctxrus/cosmic-dawn` (the real repo). The handle "Arctxrus" is a username,
  not the owner's given name, and the link is functional, so it was left as-is. If the
  repo moves to a Pagefront org or the handle must be hidden, update this link then.
- CODE credit removed entirely (orchestrator ruling): the repos are now private, so github.com/Arctxrus/cosmic-dawn was a dead link for visitors and carried the personal handle. Credits are now MADE BY PAGEFRONT and PORTFOLIO, both to pagefront.co.uk. No arctxrus/github reference remains in any shipped file.
- Added a `_redirects` file at the repo root forcing 404 on the non-site paths that Cloudflare Pages would otherwise serve by path: /CONCEPT.md, /PROGRESS.md, /README.md, /references/*, /verify/*. Site paths (index.html, css/, js/) stay reachable. Note: _redirects is a Cloudflare Pages runtime feature, so its 404 forcing cannot be exercised under `python -m http.server`; the file was validated as plain text, one rule per line, no source-path collisions.
