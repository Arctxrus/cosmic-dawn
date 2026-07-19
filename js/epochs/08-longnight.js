// THE LONG NIGHT — t 0.79..0.90. Almost nothing. A handful of ember dwarfs
// gutter; a black hole bends the last starlight: black disc, thin photon
// ring, and a slow spiral of infalling light. Pointer (stage 6): the ring
// leans and the infall smears toward the cursor.

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope, makeCoreGlow } from './util.js';

const RANGE = [0.79, 0.90];
const INFALL = { 2: 24000, 1: 14000, 0: 8000 };
const HOLE_POS = new THREE.Vector3(0, 2, -40);

export function createLongNight() {
  let group = null, infallUniforms = null, ringMat = null, dwarfs = [];

  return {
    id: 'long-night',
    range: RANGE,

    init(rig) {
      group = new THREE.Group();

      // --- the hole: a disc of absolute black ---
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(5.2, 48),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      disc.position.copy(HOLE_POS);
      group.add(disc);

      // --- photon ring: thin, hot, slightly asymmetric ---
      ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uEnv: { value: 0 },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uPointerStrength: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv, uTime, uPointerStrength;
          uniform vec2 uPointer;
          varying vec2 vUv;
          void main() {
            vec2 c = vUv - 0.5;
            float r = length(c) * 2.0;
            // thin annulus just outside the horizon
            float ring = exp(-pow((r - 0.86) * 30.0, 2.0));
            float ang = atan(c.y, c.x);
            // doppler beaming: one side brighter, drifting slowly
            float beam = 0.65 + 0.35 * sin(ang - uTime * 0.15);
            // the ring leans toward the cursor
            vec2 pd = normalize(uPointer + vec2(0.0001));
            float lean = 1.0 + uPointerStrength * 0.5 * max(0.0, dot(normalize(c + vec2(0.0001)), pd));
            vec3 col = mix(vec3(1.0, 0.72, 0.4), vec3(1.0, 0.95, 0.85), beam - 0.6);
            gl_FragColor = vec4(col, ring * beam * lean * uEnv);
          }
        `,
      });
      const ring = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), ringMat);
      ring.position.copy(HOLE_POS);
      ring.position.z += 0.01;
      group.add(ring);

      // --- infalling light: a slow spiral being wound in ---
      const n = INFALL[rig.tier];
      const seed = new Float32Array(n);
      const pos = new Float32Array(n * 3); // unused beyond seed carrier
      for (let i = 0; i < n; i++) {
        seed[i] = Math.random();
        pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      infallUniforms = {
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector3() },
        uPointerStrength: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };
      const imat = new THREE.ShaderMaterial({
        uniforms: infallUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uEnv, uPixelRatio, uPointerStrength;
          uniform vec3 uPointer;
          varying float vAge, vSeed;
          void main() {
            vSeed = aSeed;
            // each mote spirals from far orbit down to the horizon, then respawns
            float cycle = 40.0 + aSeed * 30.0;
            float age = fract(uTime / cycle + aSeed * 13.7); // 0 far → 1 horizon
            vAge = age;
            float r = mix(46.0, 5.6, pow(age, 0.65));
            float ang = aSeed * 6.2831 + uTime * (0.05 + age * 0.55);
            float tilt = 0.5 + (fract(aSeed * 3.3) - 0.5) * 0.25;
            vec3 p = vec3(cos(ang) * r, sin(ang) * r * sin(tilt) * 0.35, sin(ang) * r * cos(tilt) * 0.2);
            // cursor drag: the stream smears gently toward your presence
            vec3 d = uPointer - p;
            p += d * uPointerStrength * exp(-dot(d, d) / 700.0) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.7 + fract(aSeed * 7.7) * 1.1) * (0.6 + age * 1.6) * uPixelRatio;
            gl_PointSize = size * (240.0 / -mv.z) * uEnv;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying float vAge, vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.0);
            // cold far out, heated white as it approaches the ring
            vec3 cold = vec3(0.45, 0.3, 0.28);
            vec3 hotc = vec3(1.0, 0.85, 0.65);
            vec3 col = mix(cold, hotc, pow(vAge, 2.0));
            gl_FragColor = vec4(col, glow * uEnv * (0.12 + vAge * 0.5));
          }
        `,
      });
      const infall = new THREE.Points(geo, imat);
      infall.frustumCulled = false;
      infall.position.copy(HOLE_POS);
      group.add(infall);

      // --- the last red dwarfs: scattered embers, guttering ---
      dwarfs = [];
      const DWARF_SPOTS = [
        [-38, 14, -70, 1.0], [30, -10, -85, 0.8], [-18, -16, -30, 0.65],
        [46, 18, -55, 0.5], [12, 26, -95, 0.4],
      ];
      for (const [x, y, z, life] of DWARF_SPOTS) {
        const g = makeCoreGlow(new THREE.Color('#8A2A1D'), 2.6);
        g.position.set(x, y, z);
        g.userData.life = life; // fraction of the epoch it survives
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
      // the disc is opaque black — it must never silhouette into other epochs
      group.visible = env > 0.004;
      if (!group.visible) return;
      ringMat.uniforms.uEnv.value = env;
      ringMat.uniforms.uTime.value = time;
      ringMat.uniforms.uPointer.value.set(rig.pointer.x, rig.pointer.y);
      ringMat.uniforms.uPointerStrength.value = rig.pointerActive ? 1 : 0;
      infallUniforms.uEnv.value = env;
      infallUniforms.uTime.value = time;
      infallUniforms.uPointer.value.set(rig.pointer.x * 30, rig.pointer.y * 20, 0);
      infallUniforms.uPointerStrength.value = rig.pointerActive ? 1 : 0;
      infallUniforms.uPixelRatio.value = rig.renderer.getPixelRatio();

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
        if (o.material) o.material.dispose();
      });
      group = null;
      dwarfs = [];
    },
  };
}
