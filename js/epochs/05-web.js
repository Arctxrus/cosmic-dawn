// THE WEB — t 0.41..0.53. Massive pull-back: galaxies strung along cosmic-web
// filaments; supernovae spark and seed the elements. Pointer: galaxies near
// the cursor twinkle and shear (a hand passed over the web).

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope } from './util.js';

const RANGE = [0.41, 0.53];
const COUNT = { 2: 2600, 1: 1600, 0: 900 };
const NOVAE = { 2: 14, 1: 10, 0: 6 };

let _galaxyTex = null;
function galaxyTexture() {
  if (_galaxyTex) return _galaxyTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  // soft elliptical blob with a brighter nucleus and a hint of arm asymmetry
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,244,230,0.95)');
  g.addColorStop(0.18, 'rgba(255,230,205,0.5)');
  g.addColorStop(0.5, 'rgba(200,215,255,0.16)');
  g.addColorStop(1, 'rgba(180,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalAlpha = 0.35;
  ctx.translate(32, 32);
  ctx.rotate(0.8);
  ctx.scale(1, 0.45);
  const g2 = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
  g2.addColorStop(0, 'rgba(220,230,255,0.5)');
  g2.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  _galaxyTex = new THREE.CanvasTexture(c);
  return _galaxyTex;
}

/** Filament-biased positions in a wide slab (shared shape with dark ages, scaled up). */
function filamentPositions(n, spread) {
  const pos = new Float32Array(n * 3);
  let i = 0;
  while (i < n) {
    const x = (Math.random() - 0.5) * spread[0];
    const y = (Math.random() - 0.5) * spread[1];
    const z = (Math.random() - 0.5) * spread[2];
    const s =
      Math.sin(x * 0.016 + Math.sin(z * 0.011) * 2.1) +
      Math.sin(y * 0.022 + Math.sin(x * 0.008) * 1.7);
    if (Math.abs(s) < 0.38 || Math.random() < 0.05) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      i++;
    }
  }
  return pos;
}

// two-level LOD: how many near-corridor impostors resolve into particle spirals
const RESOLVE = { 2: 6, 1: 4, 0: 3 };
const SPIRAL_PTS = 5500;
// the dive corridor the camera follows toward HOME's galaxy
const CORRIDOR = new THREE.Vector3(6, 9, 80);
const RESOLVE_FAR = 85, RESOLVE_NEAR = 45; // camera-distance morph window

export function createWeb() {
  let mesh = null, novae = null, uniforms = null, novaUniforms = null;
  let spirals = null, spiralUniforms = null;

  return {
    id: 'web',
    range: RANGE,

    init(rig) {
      const n = COUNT[rig.tier];
      const pos = filamentPositions(n, [560, 320, 420]);

      // choose the impostors nearest the dive corridor: they will resolve
      const byDist = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
        const da = (pos[a * 3] - CORRIDOR.x) ** 2 + (pos[a * 3 + 1] - CORRIDOR.y) ** 2 + (pos[a * 3 + 2] - CORRIDOR.z) ** 2;
        const db = (pos[b * 3] - CORRIDOR.x) ** 2 + (pos[b * 3 + 1] - CORRIDOR.y) ** 2 + (pos[b * 3 + 2] - CORRIDOR.z) ** 2;
        return da - db;
      });
      const chosen = byDist.slice(0, RESOLVE[rig.tier]);
      const resolve = new Float32Array(n);
      for (const i of chosen) resolve[i] = 1;

      const geo = new THREE.InstancedBufferGeometry();
      const quad = new THREE.PlaneGeometry(1, 1);
      geo.index = quad.index;
      geo.attributes.position = quad.attributes.position;
      geo.attributes.uv = quad.attributes.uv;
      geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(pos, 3));
      const seed = new Float32Array(n);
      for (let i = 0; i < n; i++) seed[i] = Math.random();
      geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
      geo.setAttribute('aResolve', new THREE.InstancedBufferAttribute(resolve, 1));
      geo.instanceCount = n;

      uniforms = {
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMap: { value: galaxyTexture() },
        uPointer: { value: new THREE.Vector3() },
        uPointerStrength: { value: 0 },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute vec3 aOffset;
          attribute float aSeed, aResolve;
          uniform float uTime, uEnv, uProgress, uPointerStrength;
          uniform vec3 uPointer;
          varying vec2 vUv;
          varying float vSeed, vNear, vFade;
          ${GLSL_NOISE}
          void main() {
            vUv = uv;
            vSeed = aSeed;
            vec3 p = aOffset;
            // near-corridor impostors hand over to their resolved spirals
            float cd = distance(cameraPosition, p);
            vFade = 1.0 - aResolve * smoothstep(${RESOLVE_FAR}.0, ${RESOLVE_NEAR}.0, cd);
            // structure keeps condensing across the epoch
            p *= 1.0 - uProgress * 0.06;
            // pointer shear: the web slides gently around the cursor ray
            vec3 d = p - uPointer;
            float r = length(d.xy);
            float near = exp(-r * r / 5200.0) * uPointerStrength;
            p.xy += vec2(-d.y, d.x) * near * 0.06;
            vNear = near;
            // galaxies grow in across the epoch, staggered by seed
            float grown = smoothstep(aSeed * 0.5, aSeed * 0.5 + 0.35, uProgress);
            float scale = (4.0 + fract(aSeed * 9.7) * 9.0) * grown;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            mv.xy += position.xy * scale; // billboard
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uEnv, uTime;
          varying vec2 vUv;
          varying float vSeed, vNear, vFade;
          void main() {
            vec4 tex = texture2D(uMap, vUv);
            // temperature scatter: some warm ellipticals, some blue spirals
            vec3 warm = vec3(1.0, 0.86, 0.68);
            vec3 cool = vec3(0.72, 0.82, 1.0);
            vec3 col = mix(cool, warm, fract(vSeed * 5.3));
            float tw = 0.8 + 0.2 * sin(uTime * (0.3 + vSeed) + vSeed * 50.0);
            float a = tex.a * uEnv * (0.5 + fract(vSeed * 3.1) * 0.5) * tw;
            a *= 1.0 + vNear * 1.6; // acknowledged by your presence
            a *= vFade;             // resolved galaxies retire their impostor
            gl_FragColor = vec4(col * tex.rgb, a);
          }
        `,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      rig.scene.add(mesh);

      // --- supernovae: rare blinding points that flash and die ---
      const nn = NOVAE[rig.tier];
      const npos = filamentPositions(nn, [500, 280, 380]);
      const nseed = new Float32Array(nn);
      for (let i = 0; i < nn; i++) nseed[i] = Math.random();
      const ngeo = new THREE.BufferGeometry();
      ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
      ngeo.setAttribute('aSeed', new THREE.BufferAttribute(nseed, 1));
      novaUniforms = {
        uEnv: { value: 0 },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };
      const nmat = new THREE.ShaderMaterial({
        uniforms: novaUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uProgress, uEnv, uPixelRatio, uTime;
          varying float vFlash;
          void main() {
            // each nova fires once at its own moment in the epoch...
            float fireAt = 0.15 + aSeed * 0.7;
            float dt = uProgress - fireAt;
            float scrollFlash = dt < 0.0 ? 0.0 : exp(-dt * 26.0);
            // ...and keeps flickering on a slow staggered clock while you linger
            float phase = fract(uTime / 11.0 + aSeed * 7.31);
            float timeFlash = exp(-phase * 16.0) * step(0.02, uProgress) * (1.0 - step(0.98, uProgress));
            vFlash = max(scrollFlash, timeFlash * 0.85);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (18.0 + vFlash * 26.0) * uPixelRatio * uEnv * step(0.001, vFlash) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying float vFlash;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float core = pow(1.0 - d * 2.0, 3.0);
            // cross flare
            float rays = pow(max(0.0, 1.0 - abs(c.x) * 6.0), 2.0) + pow(max(0.0, 1.0 - abs(c.y) * 6.0), 2.0);
            vec3 col = mix(vec3(1.0, 0.85, 0.7), vec3(1.0), vFlash);
            gl_FragColor = vec4(col, (core + rays * 0.4 * (1.0 - d * 2.0)) * vFlash * uEnv);
          }
        `,
      });
      novae = new THREE.Points(ngeo, nmat);
      novae.frustumCulled = false;
      rig.scene.add(novae);

      // --- the resolve layer: near-corridor galaxies as real particle spirals ---
      const K = chosen.length;
      const total = K * SPIRAL_PTS;
      const spos = new Float32Array(total * 3);
      const scen = new Float32Array(total * 3);
      const ssed = new Float32Array(total);
      const ARMS = 3;
      for (let g = 0; g < K; g++) {
        const gi = chosen[g];
        const cx = pos[gi * 3], cy = pos[gi * 3 + 1], cz = pos[gi * 3 + 2];
        const R = 5 + (g % 3) * 1.8;
        // random-ish fixed tilt per galaxy
        const tx = ((g * 0.37) % 1) * 1.1 - 0.4;
        const tz = ((g * 0.73) % 1) * 1.2 - 0.6;
        const cosx = Math.cos(tx), sinx = Math.sin(tx);
        const cosz = Math.cos(tz), sinz = Math.sin(tz);
        for (let i = 0; i < SPIRAL_PTS; i++) {
          const k = g * SPIRAL_PTS + i;
          const arm = i % ARMS;
          const rr = Math.pow(Math.random(), 0.6);
          const th = (arm / ARMS) * Math.PI * 2 + Math.log(1 + rr * 5) * 2.4 + (Math.random() - 0.5) * (0.6 - rr * 0.3);
          let lx = Math.cos(th) * rr * R;
          let ly = (Math.random() - 0.5) * (1 - rr * 0.8) * R * 0.14;
          let lz = Math.sin(th) * rr * R;
          // tilt: rotate about x then z
          let y1 = ly * cosx - lz * sinx, z1 = ly * sinx + lz * cosx;
          let x2 = lx * cosz - y1 * sinz, y2 = lx * sinz + y1 * cosz;
          spos[k * 3] = cx + x2;
          spos[k * 3 + 1] = cy + y2;
          spos[k * 3 + 2] = cz + z1;
          scen[k * 3] = cx; scen[k * 3 + 1] = cy; scen[k * 3 + 2] = cz;
          ssed[k] = Math.random();
        }
      }
      const sgeo = new THREE.BufferGeometry();
      sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
      sgeo.setAttribute('aCenter', new THREE.BufferAttribute(scen, 3));
      sgeo.setAttribute('aSeed', new THREE.BufferAttribute(ssed, 1));
      spiralUniforms = {
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };
      const smat = new THREE.ShaderMaterial({
        uniforms: spiralUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute vec3 aCenter;
          attribute float aSeed;
          uniform float uTime, uEnv, uPixelRatio;
          varying float vSeed, vCore, vRes;
          void main() {
            vSeed = aSeed;
            vec3 rel = position - aCenter;
            vCore = 1.0 - smoothstep(0.0, 7.0, length(rel));
            // slow rotation about the galaxy's local vertical
            float a = uTime * 0.06;
            float ca = cos(a), sa = sin(a);
            vec3 rot = vec3(rel.x * ca - rel.z * sa, rel.y, rel.x * sa + rel.z * ca);
            vec3 p = aCenter + rot;
            // the spiral only exists while the camera is close (the impostor's inverse)
            float cd = distance(cameraPosition, aCenter);
            vRes = smoothstep(${RESOLVE_FAR}.0, ${RESOLVE_NEAR}.0, cd);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.6 + fract(aSeed * 6.7) * 1.2) * (0.8 + vCore * 1.2) * uPixelRatio;
            gl_PointSize = size * (240.0 / -mv.z) * uEnv * vRes;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying float vSeed, vCore, vRes;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 3.0) + smoothstep(0.2, 0.06, d) * 0.5;
            vec3 core = vec3(1.0, 0.88, 0.68);
            vec3 arms = vec3(0.72, 0.82, 1.0);
            vec3 col = mix(arms, core, vCore + fract(vSeed * 4.7) * 0.25);
            gl_FragColor = vec4(col, glow * uEnv * vRes * (0.25 + vCore * 0.5));
          }
        `,
      });
      spirals = new THREE.Points(sgeo, smat);
      spirals.frustumCulled = false;
      rig.scene.add(spirals);
    },

    setVisible(v) {
      if (mesh) mesh.visible = v;
      if (novae) novae.visible = v;
      if (spirals) spirals.visible = v;
    },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const env = envelope(l, 0.12, 0.14);
      // the spirals persist into the dive (HOME's approach) so the hand-over
      // reads as falling into structure, not a crossfade
      const spiralEnv = envelope(
        Math.min(1, Math.max(0, (t - 0.44) / (0.585 - 0.44))), 0.25, 0.1
      );
      spiralUniforms.uEnv.value = spiralEnv;
      spiralUniforms.uTime.value = time;
      spiralUniforms.uPixelRatio.value = rig.renderer.getPixelRatio();
      uniforms.uEnv.value = env;
      uniforms.uTime.value = time;
      uniforms.uProgress.value = l;
      uniforms.uPointer.value.set(rig.pointer.x * 130, rig.pointer.y * 80, 0);
      uniforms.uPointerStrength.value = rig.pointerStrength;
      novaUniforms.uEnv.value = env;
      novaUniforms.uProgress.value = l;
      novaUniforms.uTime.value = time;
      novaUniforms.uPixelRatio.value = rig.renderer.getPixelRatio();
    },

    dispose(rig) {
      if (!mesh) return;
      rig.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
      rig.scene.remove(novae);
      novae.geometry.dispose();
      novae.material.dispose();
      novae = null;
      rig.scene.remove(spirals);
      spirals.geometry.dispose();
      spirals.material.dispose();
      spirals = null;
    },
  };
}
