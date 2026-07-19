// THE LONG NIGHT — t 0.79..0.90. Almost nothing. A handful of ember dwarfs
// gutter; a black hole bends the last starlight around itself.
//
// At T2 the hole is drawn entirely by the screen-space lens pass
// (js/lensing.js): shadow, photon ring, lensed disc with over/under arcs.
// At T1/T0 (or if the lens is unavailable/dropped) a pre-composed lensed
// sprite (js/gargantua-sprite.js) stands in — same composition, static.
//
// The pointer never moves the hole or the disc: the camera's parallax orbit
// (scene.js) is the interaction, and the lensing answers the viewpoint.

import * as THREE from 'three';
import { localT, envelope, makeCoreGlow } from './util.js';
import { gargantuaCanvas } from '../gargantua-sprite.js';

export const RANGE = [0.79, 0.90];
export const HOLE_POS = new THREE.Vector3(0, 2, -40);
export const HOLE_RADIUS = 5.2;

export function createLongNight() {
  let group = null, sprite = null, dwarfs = [];

  return {
    id: 'long-night',
    range: RANGE,

    init(rig) {
      group = new THREE.Group();

      // --- the cheap Gargantua: pre-composed lensed sprite (T1/T0 / fallback) ---
      const tex = new THREE.CanvasTexture(gargantuaCanvas(1536, 640));
      const smat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0, // tilt is baked into the painting itself
      });
      sprite = new THREE.Sprite(smat);
      sprite.position.copy(HOLE_POS);
      // sized so the disc band runs past the frame edges, like the reference
      // (scale aspect matches the 1536x640 canvas)
      sprite.scale.set(HOLE_RADIUS * 24, HOLE_RADIUS * 10, 1);
      group.add(sprite);

      // --- the last red dwarfs: scattered embers, guttering ---
      dwarfs = [];
      const DWARF_SPOTS = [
        [-38, 14, -70, 1.0], [30, -10, -85, 0.8], [-18, -16, -30, 0.65],
        [46, 18, -55, 0.5], [12, 26, -95, 0.4],
      ];
      for (const [x, y, z, life] of DWARF_SPOTS) {
        const g = makeCoreGlow(new THREE.Color('#8A2A1D'), 2.6);
        g.position.set(x, y, z);
        g.userData.life = life;
        g.userData.phase = Math.random() * 10;
        group.add(g);
        dwarfs.push(g);
      }

      rig.scene.add(group);
    },

    setVisible(v) { if (group) group.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const env = envelope(l, 0.12, 0.1);
      // the sprite carries opaque black — never silhouette into other epochs
      group.visible = env > 0.004;
      if (!group.visible) return;
      // when the real lens draws the hole, the sprite stands down
      sprite.visible = !rig.lensActive;
      sprite.material.opacity = env;

      // dwarfs gutter out one by one across the epoch
      for (const g of dwarfs) {
        const alive = l < g.userData.life;
        const dyingEdge = Math.max(0, 1 - Math.max(0, l - (g.userData.life - 0.08)) / 0.08);
        const flicker = 0.75 + 0.25 * Math.sin(time * 2.1 + g.userData.phase) * Math.sin(time * 3.7 + g.userData.phase * 2.0);
        g.material.opacity = env * (alive ? 0.5 * flicker * dyingEdge : 0);
      }
    },

    dispose(rig) {
      if (!group) return;
      rig.scene.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      group = null;
      sprite = null;
      dwarfs = [];
    },
  };
}
