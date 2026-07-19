// THE FADING — t 0.68..0.79. The Sun swells red, lets go, collapses to a
// white dwarf. Star formation ends; the sky empties (the shared skybox
// handles the global dimming). Pointer (stage 6): rekindle — you cannot
// hold them.

import * as THREE from 'three';
import { localT, envelope } from './util.js';
import { makeStarRig } from './04-firstlight.js';

const RANGE = [0.68, 0.79];
const COUNT = { 2: 90000, 1: 55000, 0: 30000 };
const SUN_POS = new THREE.Vector3(26, 3, -35);

// phases within the epoch (local 0..1)
const SWELL_END = 0.42;    // 0 → swollen red giant
const COLLAPSE_END = 0.62; // giant → white dwarf
export const COLLAPSE_T = RANGE[0] + (RANGE[1] - RANGE[0]) * COLLAPSE_END;

export function createFading() {
  let star = null;

  return {
    id: 'fading',
    range: RANGE,

    init(rig) {
      star = makeStarRig(rig, COUNT[rig.tier]);
      star.group.position.copy(SUN_POS);
      star.uniforms.uIgnition.value = 1;
      rig.scene.add(star.group);
    },

    setVisible(v) { if (star) star.group.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const u = star.uniforms;
      u.uEnv.value = envelope(l, 0.06, 0.1);
      u.uTime.value = time;
      u.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
      u.uPixelRatio.value = rig.renderer.getPixelRatio();
      u.uPointer.value.set(SUN_POS.x + rig.pointer.x * 14, SUN_POS.y + rig.pointer.y * 9, SUN_POS.z);
      u.uPointerStrength.value = rig.pointerStrength * 0.5;

      const swell = THREE.MathUtils.smoothstep(l, 0, SWELL_END);
      const collapse = THREE.MathUtils.smoothstep(l, SWELL_END, COLLAPSE_END);

      // radius: 3 → 17 (giant) → 0.9 (dwarf); churn grows with the swelling
      u.uRadius.value = 3 + swell * 14 - collapse * (3 + swell * 14 - 0.9);
      u.uChurn.value = 0.7 + swell * 1.6 - collapse * 1.8;

      // colors: yellow-white → deep red giant → pale blue-white dwarf
      const hot = new THREE.Color('#FFF7E0').lerp(new THREE.Color('#FFD0A8'), swell);
      const mid = new THREE.Color('#FFD98C').lerp(new THREE.Color('#C25538'), swell);
      const rim = new THREE.Color('#E8A050').lerp(new THREE.Color('#7A2418'), swell);
      const dwarfTint = new THREE.Color('#DCE8FF');
      u.uColorHot.value.copy(hot).lerp(dwarfTint, collapse);
      u.uColorMid.value.copy(mid).lerp(dwarfTint, collapse * 0.9);
      u.uColorRim.value.copy(rim).lerp(new THREE.Color('#8898B8'), collapse * 0.8);

      // core: swells dull, then a brief planetary-nebula exhale at collapse,
      // then the tiny fierce dwarf point
      const exhale = Math.exp(-Math.pow((l - COLLAPSE_END) * 30, 2));
      star.core.material.opacity = u.uEnv.value * (0.35 - swell * 0.2 + exhale * 0.6 + collapse * 0.3);
      star.core.scale.setScalar(8 + swell * 26 - collapse * (8 + swell * 26 - 3) + exhale * 30);
    },

    dispose(rig) {
      if (!star) return;
      rig.scene.remove(star.group);
      star.dispose();
      star = null;
    },
  };
}
