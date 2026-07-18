# Reference Screenshots — Design Language

Three screenshots (from a screen-recorded walkthrough of a reference scroll experience titled
"TEN BILLION YEARS"). The PNGs live in this folder; this document describes them precisely so
sessions without the images can work from text alone.

> Note: all three frames contain a webcam picture-in-picture overlay in the bottom-left corner
> and a tiny picture-in-picture icon top-center — these are video-recording artifacts, **not**
> part of the design. Ignore them.

The reference site tells *the life of one star* ("THE LIFE OF A STAR, COMPRESSED INTO ONE
SCROLL") — relevant because our story scope is still an open question.

---

## Image 3 — `landing.png` (the landing frame)

**Composition**
- Full-viewport deep-space background: very dark desaturated navy/indigo (≈ `#101226` center
  fading to near-black edges — a subtle radial vignette, slightly lighter behind the title).
  Sparse, faint pinprick stars and a hint of film grain/noise. No nebula, no imagery — the
  restraint is the point.
- Dominant element: the title "TEN BILLION YEARS" stacked on three lines, centered horizontally
  (optically slightly right of true center because of the left-edge index), occupying roughly
  the middle 60% of viewport height. Enormous — each line ~20–25vh tall.
- Bottom center, small: a one-line subtitle, "THE LIFE OF A STAR, COMPRESSED INTO ONE SCROLL".
- Left edge, vertically centered-low: the epoch index (see UI inventory below).
- Top-left corner: tiny wordmark "TEN BILLION YEARS".

**Typography**
- Title: high-contrast didone/editorial serif (Playfair Display / Canela / Ogg family feel).
  Thin hairline strokes against fat stems. All caps, white/warm-off-white (≈ `#EDEAE4`).
  Line 2 ("BILLION") is *italic* while lines 1 and 3 are roman — an elegant single twist that
  keeps the lockup from feeling static. Generous letterspacing on the caps. No weight mixing,
  no color accent — contrast comes from scale and the italic alone.
- Subtitle: tiny (~10–11px) uppercase, wide letterspacing (~0.2em+), monospaced or geometric
  sans, low-contrast grey (~40–50% opacity white). Reads as a whisper under the shout.
- Wordmark (top-left): same micro-uppercase-letterspaced treatment as the subtitle.

**UI density**: four elements total — wordmark, title, subtitle, epoch index. No nav, no
buttons, no scroll-down arrow, no social icons, no hamburger. Nothing else.

**Cursor**: a small solid yellow/chartreuse dot (~14px) — the only saturated color on the
page. Custom cursor is part of the design language.

**Mood**: a book cover / film title card. Silent, expensive, typographic. The dark blue (not
pure black) makes it feel like dusk rather than void.

---

## Image 1 — `epoch-first-light.png` (in-scene, "FIRST LIGHT" epoch)

**Composition**
- The entire viewport is one particle-rendered star/proto-star: a huge sphere of warm amber
  particles (≈ `#D98E5F` mid-tones) with a blown-out white-hot core (≈ `#FFF4E4`) and a
  grainy, dissolving rim where individual particles separate from the mass against near-black
  (`#0A0910`) space. The object fills ~80% of the frame height, centered.
- The particle density gradient does the work: solid/overexposed at the core → dense orange
  mid-shell → sparse individual grains at the edge. Reads simultaneously as a star being born
  and as pure pointillism. No texture-mapped surface — everything is particles + glow.
- Background: near-black with the faintest scattered stars; all attention on the object.

**UI**
- Top-left: the tiny wordmark "TEN BILLION YEARS".
- Left edge: the epoch index — a vertical list of tiny uppercase labels with a thin vertical
  hairline rule along its left side. Legible entries: THE CLOUD / COLLAPSE / **FIRST LIGHT**
  (active — full opacity, slightly bolder) / THE SWELLING / SUPERNOVA / THE REMNANT. Inactive
  entries sit at ~25–35% opacity. (Six epochs for one star's life: molecular cloud → collapse
  → ignition → red-giant swelling → supernova → remnant.)
- The yellow dot cursor floats over the scene.
- Absolutely nothing else. UI-to-scene ratio is maybe 2% of pixels.

**Mood**: awe with restraint. The scene is maximal (millions of particles, huge dynamic
range) while the interface is nearly invisible.

---

## Image 2 — `epoch-nova.png` (in-scene, wide starfield — likely the SUPERNOVA epoch, zoomed out)

**Composition**
- A wide starfield on near-black: dozens of small crisp stars in varied subtle colors
  (blue-white, warm white, faint red/orange/green pinpricks — chromatic sparkle, not
  monochrome dots), varied sizes, some with tiny cross-flare.
- Center: one large soft glowing star — a big gaussian bloom of warm white light (`#F5EFE6`
  core) with a wide falloff halo, no hard edge. Left of it, a smaller companion star with its
  own smaller bloom. The pair suggests a binary system or a nova brightening.
- Compared to Image 1 the camera has pulled way out: the epic close-up object has become one
  light among many. That zoom-scale contrast between epochs is core to the experience's
  rhythm.

**UI**: same system — epoch index barely visible at the left edge (a partial label "…NOVA"
readable), everything at whisper opacity. Yellow dot cursor present.

**Mood**: quiet, glittering, lonely. The "breath out" after Image 1's "breath in".

---

## Synthesis — the design language to honor

1. **One scene, no page.** Every frame is a full-bleed WebGL scene; the "site" is four tiny
   typographic elements floating over it. Never a section, card, or panel.
2. **Typography does all the UI work.** Two voices only: enormous editorial serif (moments,
   titles) and micro uppercase letterspaced mono/sans (labels, index, subtitles). Nothing in
   between.
3. **Palette discipline.** Near-black/deep-navy space; warm whites; one warm scene accent
   (amber/orange from the star itself); one saturated UI accent (the yellow cursor dot).
   Color comes from the physics of the scene, not from the UI.
4. **The epoch index is the entire navigation**: a fixed left-edge vertical list of tiny
   uppercase labels, active item at full opacity, inactive ~30%, with a hairline rule.
5. **Scale contrast as pacing**: alternate between engulfing close-ups (Image 1) and vast
   pull-backs (Image 2). The camera zoom *is* the storytelling.
6. **Particles + bloom over geometry.** Objects are rendered as particle masses with additive
   glow and blown-out cores — grain and light, never smooth meshes.
7. **A custom cursor** (small yellow dot) is the visitor's "presence" in the universe — ties
   directly to our deep mouse-interactivity requirement.
