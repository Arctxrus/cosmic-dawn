# Until the Last Star

**The whole of time, compressed into one scroll.**

A scroll-driven WebGL experience: the biography of the universe from the first
instant to the death of the last star, told in nine epochs. Scrolling is the
timeline; the cursor is a small warm light that travels through all of time —
and in the final frame, it is the only light left.

Vanilla HTML/CSS/JS + Three.js via CDN import map. No build step.

## Run locally

```
python -m http.server 8080
# open http://localhost:8080
```

Any static file server works (the site is plain static files — it deploys to
GitHub Pages as-is).

## Flags

- `?debug` — FPS / quality tier / timeline overlay
- `?tier=0|1|2` — force a quality tier
- `?still` — force Still Mode (the reduced-motion / no-WebGL / weak-hardware
  presentation: static epoch frames, same story)

## Structure

- `js/content.js` — the single source of truth: epochs, copy, time mapping
- `js/timeline.js` — native scroll → spring-smoothed timeline
- `js/scene.js` — renderer, camera choreography, aging skybox
- `js/epochs/*.js` — one module per epoch (lazy init/dispose)
- `js/audio.js` — fully procedural WebAudio score (no samples)
- `js/still-mode.js` — the stepped fallback experience
- `CONCEPT.md` — the approved design document
- `PROGRESS.md` — build log and verification verdicts
- `verify/` — per-stage verification screenshots (review trail)
