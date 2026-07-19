# PROGRESS — Until the Last Star

Autonomous build protocol per CONCEPT.md §11. Resume point for any fresh session:
read CONCEPT.md (approved, includes Act III chronology fix + all-input-mode ending +
?debug), then this file, then continue from **Current stage** below. Verifier agent:
`.claude/agents/verifier.md` — invoke after each stage, max 3 fix cycles, commit
`stage N: <summary> [verified]` on PASS. Never delete anything under `verify/`.

## Current stage: 4 (The Web + Home) — building

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
