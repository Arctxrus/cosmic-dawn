# Inspiration Mining — 21st.dev + Awwwards (browsed 2026-07)

Patterns worth translating to vanilla JS/Three.js for the scroll-driven universe piece.
None of these are to be copied as components — they're React/Tailwind. They're catalogued
here as *interaction vocabulary*.

## 21st.dev — Scroll Areas (relevant patterns)

- **Scroll Progress** — thin fixed progress bar tied to scroll fraction. For us: the epoch
  index itself should double as the progress indicator (active label + a hairline fill),
  not a separate bar.
- **Container Scroll Animation / Zoom Parallax** (both hugely popular, 7.5k & 3.9k saves) —
  scroll drives a scale/zoom transform rather than translation. Confirms the core move:
  our camera dolly through epochs *is* this pattern done properly in 3D.
- **Sticky Scroll Reveal / Text Gradient Scroll / Reading Text Reveal** — copy stays fixed
  while scroll progresses a reveal (opacity/gradient sweeping through text word-by-word or
  line-by-line). Excellent low-cost technique for our epoch captions: DOM text whose
  reveal fraction is driven by the same eased timeline value as the WebGL scene — keeps
  text crisp (no SDF text needed) and perfectly synchronized.
- **Scroll Based Velocity** — effects modulated by scroll *speed*, not just position. For
  us: scroll velocity can feed particle turbulence/motion-blur so fast scrolling feels
  like rushing through time. Cheap and very "alive".
- **Scroll Image Tunnel** — scroll moves you down a tunnel of content — a 2.5D fake of the
  camera-through-space idea; validates that the real-3D version reads as premium.
- **Scroll Linked spring animation** — spring-smoothed scroll value (position lerp + spring)
  rather than raw scrollY. Confirms our smoothed-timeline approach.

## 21st.dev — Backgrounds (relevant patterns)

- Space/particle family: **Stars Background, Shooting Stars, Sparkles, Particles, Meteors,
  Parallax Cosmic Background, Celestial Sphere, Particle Wave, Entropy, Vortex** — the
  aesthetic is commodity now in 2D canvas form. Bar-raiser: ours must be one continuous
  3D scene with depth, parallax and physics, not a looping backdrop.
- **Cursor Dither Trail / Pixel Trail / Gooey Filter** — pointer-following trail effects;
  validates cursor-as-presence. Ours should react in *scene space* (raycast into the 3D
  world) rather than screen space.
- **Canvas Reveal Effect** — radial reveal from a point; a candidate for epoch transitions
  (e.g. supernova shockwave wipe emanating from the star).
- **Aurora / Silk / Etheral Shadow / Noisy Gradient** — soft simplex-noise-driven color
  fields; good vocabulary for nebula gas backdrops (a fullscreen noise shader is far
  cheaper than volumetrics).

## 21st.dev — Text effects (relevant patterns)

- **Text Scramble / Matrix Text / Hyper Text** — glyph-scramble on enter. Could suit the
  micro-mono labels (epoch names decode as they activate) — fits the "instrument readout"
  voice; use sparingly.
- **Vertical Cut Reveal / Word Pull Up / Blur Fade / Word Fade In / Stagger text** —
  masked line/word reveals with stagger; the right entrance for the big serif moments
  (title, epoch headlines). Do with CSS clip-path + transform, staggered by the timeline.
- **Variable Font Hover By Random Letter** — per-letter variable-font weight response to
  pointer proximity; a tasteful candidate for the landing title's pointer reaction.
- **Morphing Text / Gooey Text Morphing** — SVG-filter morphs; likely too gimmicky for
  our editorial voice. Noted, probably rejected.

## Awwwards — scrolling collection observations

Current honorees in the collection (for later reference-diving): zeroz-brand-site,
oji-global-brand-book, izanami, nominal, tile-a-porto-based-studio, obscura,
cinetica-studio, ducati-superleggera-v4, alethia, the-state-of-the-gallery, radian.

Conventions the best scroll-story sites share (synthesized):

1. **Pacing**: long "dwell" zones (a scene holds while small text beats advance) separated
   by short, dramatic transition zones (fast camera moves). Roughly 70/30. Constant-speed
   scenery the whole way reads as a screensaver; all-transition reads as a music video.
   Scroll distance per chapter is generous — typically 2–4 viewport-heights per beat, and
   flagship pieces run 15–30 viewport-heights total (1–3 minutes of unhurried scrolling).
2. **Progress indication**: never a naked scrollbar. A chapter index (dots/labels/thin
   rule) that doubles as navigation, plus occasional diegetic progress (a date, a
   counter, a timeline year ticking over — perfect for us: the cosmic year/era readout
   IS the progress indicator).
3. **An instruction whisper**: a single "scroll" hint on the landing frame, tiny, often
   animated once, disappearing after first scroll. Nobody explains more than that.
4. **Entrance ritual**: a designed preloader (percentage counter or wordmark) that ends in
   a choreographed reveal — the loader is act zero of the story, same typography.
5. **Mobile**: the best either restage the piece (same story, simplified staging, reduced
   particle budget, portrait-safe composition, UI moved to bottom edge for thumbs) or
   gracefully degrade to a "lite" version — but they never ship the desktop piece
   verbatim. Touch scroll must stay native (momentum intact).
6. **Scroll ownership**: award juries now punish scroll-hijacking; the winners map native
   scroll → timeline with easing (exactly our brief) rather than intercepting the wheel.
7. **Ending**: story lands on a quiet full-stop frame — then, only after the narrative
   closes, a small credit/colophon beat. Credits never interrupt the fiction.
