// THE DARK AGES — t 0.21..0.29. Near-black; hydrogen filaments drift and
// slowly clump. Pointer: a gravity well — you play gravity in a universe
// that has nothing else.

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope } from './util.js';

const RANGE = [0.21, 0.29];
const COUNT = { 2: 60000, 1: 36000, 0: 20000 };

export function createDarkAges() {
  let points = null, uniforms = null;

  return {
    id: 'dark-ages',
    range: RANGE,

    init(rig) {
      const n = COUNT[rig.tier];
      const pos = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      // filaments: sample points, then pull them toward noise-defined strands
      let i = 0;
      while (i < n) {
        const x = (Math.random() - 0.5) * 260;
        const y = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 140;
        // filament likelihood from layered sines (cheap web-like structure)
        const s =
          Math.sin(x * 0.045 + Math.sin(z * 0.03) * 2.1) +
          Math.sin(y * 0.06 + Math.sin(x * 0.021) * 1.7);
        if (Math.abs(s) < 0.42 || Math.random() < 0.06) {
          pos[i * 3] = x;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = z;
          seed[i] = Math.random();
          i++;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

      uniforms = {
        uProgress: { value: 0 },
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uAgitation: { value: 0 },
        uPointer: { value: new THREE.Vector3(0, 0, 0) },
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
          uniform float uProgress, uTime, uAgitation, uEnv, uPixelRatio, uPointerStrength;
          uniform vec3 uPointer;
          varying float vSeed, vPull;
          ${GLSL_NOISE}
          void main() {
            vSeed = aSeed;
            vec3 p = position;
            // slow gravitational drift: filaments tighten over the epoch
            p *= 1.0 - uProgress * 0.14;
            float wob = vnoise(vec2(aSeed * 53.0, uTime * 0.1)) - 0.5;
            p += vec3(wob, -wob * 0.6, wob * 0.4) * (2.0 + uAgitation * 8.0);
            // pointer gravity well: matter accelerates toward a held cursor
            vec3 d = uPointer - p;
            float r = length(d);
            float pull = uPointerStrength * exp(-r * r / 900.0);
            p += normalize(d + 0.0001) * pull * 14.0;
            vPull = pull;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.8 + fract(aSeed * 5.3) * 1.4) * uPixelRatio;
            gl_PointSize = size * (230.0 / -mv.z) * uEnv;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv, uProgress;
          varying float vSeed, vPull;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.9) + smoothstep(0.2, 0.06, d) * 0.4;
            // cold indigo hydrogen; clumped matter glows faintly warm
            vec3 cold = vec3(0.24, 0.28, 0.5);
            vec3 warm = vec3(0.55, 0.42, 0.30);
            vec3 col = mix(cold, warm, min(1.0, vPull * 2.2 + uProgress * 0.15));
            float a = glow * uEnv * (0.5 + vPull * 0.6);
            gl_FragColor = vec4(col, a);
          }
        `,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      rig.scene.add(points);
    },

    setVisible(v) { if (points) points.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      uniforms.uProgress.value = l;
      uniforms.uEnv.value = envelope(l, 0.14, 0.14);
      uniforms.uTime.value = time;
      uniforms.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
      uniforms.uPointer.value.set(rig.pointer.x * 60, rig.pointer.y * 38, 0);
      uniforms.uPointerStrength.value = rig.pointerStrength;
      uniforms.uPixelRatio.value = rig.renderer.getPixelRatio();
    },

    dispose(rig) {
      if (!points) return;
      rig.scene.remove(points);
      points.geometry.dispose();
      points.material.dispose();
      points = null;
    },
  };
}
