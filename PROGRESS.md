# PROGRESS — Until the Last Star

Autonomous build protocol per CONCEPT.md §11. Resume point for any fresh session:
read CONCEPT.md (approved, includes Act III chronology fix + all-input-mode ending +
?debug), then this file, then continue from **Current stage** below. Verifier agent:
`.claude/agents/verifier.md` — invoke after each stage, max 3 fix cycles, commit
`stage N: <summary> [verified]` on PASS. Never delete anything under `verify/`.

## Current stage: 2 (Prologue + Spark + Afterglow) — building

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
