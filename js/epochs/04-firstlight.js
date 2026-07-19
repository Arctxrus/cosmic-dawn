// FIRST LIGHT — t 0.29..0.41. The hero object: a huge amber particle star
// with a blown-white core, igniting mid-epoch. Pointer: proximity flares —
// embers ignite and scatter near the cursor (stirring the stellar nursery).
//
// This rig is exported for reuse: HOME's sun and THE FADING's red giant are
// the same particle sphere with different uniforms.

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope, randDir, makeCoreGlow } from './util.js';

const RANGE = [0.29, 0.41];
const COUNT = { 2: 120000, 1: 70000, 0: 40000 };
export const IGNITION = 0.35; // timeline t of the ignition flash

/** Shared particle-star rig. radius/color/behaviour via uniforms. */
export function makeStarRig(rig, count) {
  const n = count;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const d = randDir();
    // density falloff: bias radius toward the core (r^2 keeps shell sparse)
    const r = Math.pow(Math.random(), 1.8);
    pos[i * 3] = d[0] * r;
    pos[i * 3 + 1] = d[1] * r;
    pos[i * 3 + 2] = d[2] * r;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uRadius: { value: 30 },
    uEnv: { value: 0 },
    uTime: { value: 0 },
    uAgitation: { value: 0 },
    uIgnition: { value: 0 },   // 0 dark clump → 1 burning star
    uColorHot: { value: new THREE.Color('#FFF4E2') },
    uColorMid: { value: new THREE.Color('#F0A860') },
    uColorRim: { value: new THREE.Color('#C25538') },
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
    uPointerStrength: { value: 0 },
    uChurn: { value: 1 },      // surface turbulence amount
    uPixelRatio: { value: rig.renderer.getPixelRatio() },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uRadius, uTime, uAgitation, uEnv, uIgnition, uChurn, uPixelRatio, uPointerStrength;
      uniform vec3 uPointer;
      varying float vSeed, vDepth, vFlare;
      ${GLSL_NOISE}
      void main() {
        vSeed = aSeed;
        vec3 dir = normalize(position + 0.0001);
        float rf = length(position); // 0..1 density-biased
        // convection churn: surface breathes, inner mass steadier
        float churn = vnoise(vec2(aSeed * 77.0, uTime * (0.15 + 0.2 * uIgnition))) - 0.5;
        float r = rf * uRadius * (1.0 + churn * 0.16 * uChurn * rf);
        vec3 p = dir * r;
        p += dir.yzx * (vnoise(vec2(aSeed * 31.0, uTime * 0.1)) - 0.5) * uAgitation * 9.0;
        // pointer flare: embers near the cursor lift and scatter
        vec3 d = uPointer - p;
        float pr = length(d);
        float flare = uPointerStrength * exp(-pr * pr / 380.0) * uIgnition;
        p += dir * flare * 7.0;
        vFlare = flare;
        vDepth = 1.0 - rf; // 1 at core → 0 at rim
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = (0.9 + fract(aSeed * 4.3) * 1.7) * (0.7 + vDepth * 1.3) * uPixelRatio;
        gl_PointSize = size * (230.0 / -mv.z) * uEnv;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uEnv, uIgnition;
      uniform vec3 uColorHot, uColorMid, uColorRim;
      varying float vSeed, vDepth, vFlare;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.0);
        // dark clump: cold dust. burning: rim→mid→blown core
        vec3 dust = vec3(0.2, 0.16, 0.18);
        vec3 lit = mix(uColorRim, mix(uColorMid, uColorHot, pow(vDepth, 2.2)), vDepth);
        vec3 col = mix(dust, lit, uIgnition);
        float a = glow * uEnv * (0.1 + 0.9 * pow(vDepth, 1.5)) * (0.12 + 0.88 * uIgnition);
        a += vFlare * glow * 0.6;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const core = makeCoreGlow(new THREE.Color('#FFF4E2'), 40);
  core.material.opacity = 0;

  const group = new THREE.Group();
  group.add(points, core);
  return { group, uniforms, core, dispose() {
    geo.dispose();
    mat.dispose();
    core.material.dispose();
  } };
}

export function createFirstLight() {
  let star = null;

  return {
    id: 'first-light',
    range: RANGE,

    init(rig) {
      star = makeStarRig(rig, COUNT[rig.tier]);
      star.group.position.set(0, 0, -10);
      rig.scene.add(star.group);
    },

    setVisible(v) { if (star) star.group.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const u = star.uniforms;
      u.uEnv.value = envelope(l, 0.1, 0.12);
      u.uTime.value = time;
      u.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
      u.uPixelRatio.value = rig.renderer.getPixelRatio();
      u.uRadius.value = 34 - l * 6; // the cloud tightens as it collapses

      // ignition: dark clump → sudden flash at IGNITION → settled burning.
      // epsilon so parking exactly on the threshold still reads as lit
      // (the spring approaches rawT from below and never quite crosses it)
      const lit = t >= IGNITION - 0.0005;
      const ig = (t - RANGE[0]) / (IGNITION - RANGE[0]);
      const preIgnite = Math.min(1, Math.max(0, ig));
      const flash = Math.exp(-Math.pow((t - IGNITION) * 260, 2)) * 1.6; // sharp bloom at the moment
      u.uIgnition.value = Math.pow(preIgnite, 3) * (lit ? 1 : 0.25);
      star.core.material.opacity =
        u.uEnv.value * (lit ? 0.55 + Math.min(1, flash) : preIgnite * 0.06);
      star.core.scale.setScalar(26 + (lit ? 16 : 0) + flash * 60);

      // pointer in world space near the star
      u.uPointer.value.set(rig.pointer.x * 40, rig.pointer.y * 26, -10);
      u.uPointerStrength.value = rig.pointerActive ? 1 : 0;
    },

    dispose(rig) {
      if (!star) return;
      rig.scene.remove(star.group);
      star.dispose();
      star = null;
    },
  };
}
