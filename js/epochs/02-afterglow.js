// THE AFTERGLOW — t 0.12..0.21. Plasma fog everywhere; it cools and thins
// until space is transparent. Pointer: clears the fog locally.

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope } from './util.js';

const RANGE = [0.12, 0.21];
const SPARKS = { 2: 40000, 1: 24000, 0: 14000 };
const FOG_LAYERS = { 2: 3, 1: 2, 0: 1 };

export function createAfterglow() {
  let group = null;
  let fogUniforms = [], sparkUniforms = null;

  return {
    id: 'afterglow',
    range: RANGE,

    init(rig) {
      group = new THREE.Group();

      // --- fog: big noise planes across the camera path ---
      const layers = FOG_LAYERS[rig.tier];
      for (let i = 0; i < layers; i++) {
        const u = {
          uProgress: { value: 0 },
          uEnv: { value: 0 },
          uTime: { value: 0 },
          uLayer: { value: i },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uPointerStrength: { value: 0 },
        };
        fogUniforms.push(u);
        const mat = new THREE.ShaderMaterial({
          uniforms: u,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform float uProgress, uEnv, uTime, uLayer, uPointerStrength;
            uniform vec2 uPointer;
            varying vec2 vUv;
            ${GLSL_NOISE}
            void main() {
              vec2 p = vUv * (3.0 + uLayer) + vec2(uTime * 0.015 * (uLayer + 1.0), uLayer * 7.0);
              float n = fbm(p + vnoise(p * 0.6) * 0.9);
              // recombination: fog thins as progress rises
              float density = smoothstep(0.25, 0.85, n) * (1.0 - smoothstep(0.35, 0.95, uProgress));
              // pointer clears the fog locally — wiping the newborn universe
              float hole = exp(-dot(vUv - 0.5 - uPointer * 0.5, vUv - 0.5 - uPointer * 0.5) * 30.0);
              density *= 1.0 - hole * uPointerStrength * 0.85;
              // cooling: 3000K amber → deep red → gone
              vec3 hot = vec3(0.88, 0.54, 0.30);
              vec3 cool = vec3(0.45, 0.18, 0.10);
              vec3 col = mix(hot, cool, uProgress);
              float edge = smoothstep(0.5, 0.35, distance(vUv, vec2(0.5)));
              gl_FragColor = vec4(col, density * uEnv * edge * 0.55);
            }
          `,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(340, 220), mat);
        plane.position.set(0, 0, 30 - i * 45);
        group.add(plane);
      }

      // --- plasma sparks drifting in the fog ---
      const n = SPARKS[rig.tier];
      const pos = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 300;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 180;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
        seed[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      sparkUniforms = {
        uProgress: { value: 0 },
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uAgitation: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: sparkUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uProgress, uTime, uAgitation, uEnv, uPixelRatio;
          varying float vSeed;
          ${GLSL_NOISE}
          void main() {
            vSeed = aSeed;
            vec3 p = position;
            p.x += sin(uTime * (0.1 + aSeed * 0.3) + aSeed * 40.0) * (3.0 + uAgitation * 10.0);
            p.y += cos(uTime * (0.12 + aSeed * 0.2) + aSeed * 21.0) * 2.0;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.8 + fract(aSeed * 5.1) * 1.6) * uPixelRatio;
            // sparks die out as the plasma recombines
            float alive = step(fract(aSeed * 3.77), 1.0 - uProgress * 0.85);
            gl_PointSize = size * (240.0 / -mv.z) * uEnv * alive;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv, uProgress;
          varying float vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.0);
            vec3 col = mix(vec3(1.0, 0.72, 0.42), vec3(0.75, 0.3, 0.16), uProgress);
            gl_FragColor = vec4(col, glow * uEnv * 0.8);
          }
        `,
      });
      const sparks = new THREE.Points(geo, mat);
      sparks.frustumCulled = false;
      group.add(sparks);

      rig.scene.add(group);
    },

    setVisible(v) { if (group) group.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const env = envelope(l, 0.12, 0.15);
      for (const u of fogUniforms) {
        u.uProgress.value = l;
        u.uEnv.value = env;
        u.uTime.value = time;
        u.uPointer.value.set(rig.pointer.x, rig.pointer.y);
        u.uPointerStrength.value = rig.pointerActive ? 1 : 0;
      }
      sparkUniforms.uProgress.value = l;
      sparkUniforms.uEnv.value = env;
      sparkUniforms.uTime.value = time;
      sparkUniforms.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
    },

    dispose(rig) {
      if (!group) return;
      rig.scene.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      group = null;
      fogUniforms = [];
    },
  };
}
