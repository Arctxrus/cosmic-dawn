// THE LAST STAR — t 0.90..1.0. One final red dwarf, guttering like a candle.
// Its extinction at t=0.96 is scroll-driven: the visitor performs it.
// After: black, and the numbers race on without the light.
// Pointer (stage 6): the ember leans toward the cursor like a flame.

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope, randDir, makeCoreGlow } from './util.js';
import { EXTINCTION_T } from '../content.js';

const RANGE = [0.90, 1.0];
const COUNT = { 2: 30000, 1: 20000, 0: 12000 };
const STAR_POS = new THREE.Vector3(0, 0, -15);

export function createLastStar() {
  let points = null, uniforms = null, core = null;

  return {
    id: 'last-star',
    range: RANGE,

    init(rig) {
      const n = COUNT[rig.tier];
      const pos = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const d = randDir();
        const r = Math.pow(Math.random(), 1.6);
        pos[i * 3] = d[0] * r;
        pos[i * 3 + 1] = d[1] * r;
        pos[i * 3 + 2] = d[2] * r;
        seed[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

      uniforms = {
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uDying: { value: 0 },    // 0 burning low → 1 out
        uFlicker: { value: 1 },
        uPointer: { value: new THREE.Vector3() },
        uPointerStrength: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uEnv, uDying, uFlicker, uPixelRatio, uPointerStrength;
          uniform vec3 uPointer;
          varying float vDepth, vSeed;
          ${GLSL_NOISE}
          void main() {
            vSeed = aSeed;
            vec3 dir = normalize(position + 0.0001);
            float rf = length(position);
            vDepth = 1.0 - rf;
            float churn = vnoise(vec2(aSeed * 61.0, uTime * 0.3)) - 0.5;
            float r = rf * 2.6 * (1.0 + churn * 0.2) * (1.0 + uDying * 0.35 * rf);
            vec3 p = dir * r;
            // the flame leans toward the cursor
            vec3 lean = uPointer * 0.14 * uPointerStrength * (1.0 - vDepth);
            p += lean;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.8 + fract(aSeed * 5.9) * 1.4) * (0.7 + vDepth * 1.2) * uPixelRatio;
            // dying: outer particles wink out first
            float alive = step(uDying, 1.0 - rf * 0.85);
            gl_PointSize = size * (200.0 / -mv.z) * uEnv * uFlicker * alive;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv, uDying, uFlicker;
          varying float vDepth, vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.0);
            vec3 ember = vec3(0.54, 0.16, 0.11);
            vec3 warm = vec3(1.0, 0.62, 0.34);
            vec3 col = mix(ember, warm, pow(vDepth, 1.8) * (1.0 - uDying * 0.6));
            float a = glow * uEnv * uFlicker * (0.15 + 0.85 * pow(vDepth, 1.4)) * (1.0 - uDying * 0.75);
            gl_FragColor = vec4(col, a);
          }
        `,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.position.copy(STAR_POS);

      core = makeCoreGlow(new THREE.Color('#B8452E'), 5);
      core.position.copy(STAR_POS);
      core.material.opacity = 0;

      rig.scene.add(points, core);
    },

    setVisible(v) {
      if (points) points.visible = v;
      if (core) core.visible = v;
    },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const env = envelope(l, 0.1, 0.02);
      // candle flicker: layered slow sines, deepening as death approaches
      const dyingSpan = (EXTINCTION_T - RANGE[0]);
      const dying = THREE.MathUtils.smoothstep(t, EXTINCTION_T - dyingSpan * 0.35, EXTINCTION_T);
      const gutter =
        0.82 +
        0.18 * Math.sin(time * 1.7) * Math.sin(time * 2.9 + 1.3) -
        dying * 0.25 * Math.abs(Math.sin(time * 4.3));
      // after extinction: out. completely.
      const out = t >= EXTINCTION_T;
      uniforms.uEnv.value = out ? 0 : env;
      uniforms.uTime.value = time;
      uniforms.uDying.value = dying;
      uniforms.uFlicker.value = Math.max(0.2, gutter);
      uniforms.uPointer.value.set(rig.pointer.x * 8, rig.pointer.y * 5, 0);
      uniforms.uPointerStrength.value = rig.pointerStrength;
      uniforms.uPixelRatio.value = rig.renderer.getPixelRatio();
      core.material.opacity = out ? 0 : env * (0.4 - dying * 0.28) * gutter;
      core.scale.setScalar(5 - dying * 2.5);
    },

    dispose(rig) {
      if (!points) return;
      rig.scene.remove(points);
      points.geometry.dispose();
      points.material.dispose();
      points = null;
      rig.scene.remove(core);
      core.material.dispose();
      core = null;
    },
  };
}
