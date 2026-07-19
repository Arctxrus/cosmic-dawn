// HOME — t 0.53..0.68. Dive into one spiral arm, to one yellow star, to a
// pale blue dot. The counter stops on NOW. Pointer: the Sun flares toward
// the cursor; orbits illuminate near it; the pale blue dot is ringed with
// attention when approached.

import * as THREE from 'three';
import { localT, envelope, makeCoreGlow } from './util.js';
import { makeStarRig } from './04-firstlight.js';

const RANGE = [0.53, 0.68];
const GALAXY = { 2: 90000, 1: 55000, 0: 30000 };
const SUN_COUNT = { 2: 60000, 1: 36000, 0: 20000 };

const SUN_POS = new THREE.Vector3(26, 3, -35);
// planets: [orbitRadius, size, speed, colorHex]; index 2 is the pale blue dot
const PLANETS = [
  [1.6, 0.045, 1.6, 0xC9B8A8],
  [2.3, 0.075, 1.17, 0xE8D5A8],
  [3.1, 0.08, 1.0, 0x8FB8D8], // Earth
  [4.0, 0.06, 0.8, 0xD88F6A],
  [5.6, 0.16, 0.44, 0xE8C89A],
  [7.0, 0.14, 0.32, 0xE0D0A0],
  [8.2, 0.1, 0.23, 0xA8C8D8],
  [9.2, 0.1, 0.18, 0x88A8D0],
];

export function createHome() {
  let group = null, galaxyUniforms = null, sun = null;
  let planetPts = null, orbitLines = null, earthRing = null;

  return {
    id: 'home',
    range: RANGE,

    init(rig) {
      group = new THREE.Group();

      // --- the galaxy: log-spiral particle disk ---
      const n = GALAXY[rig.tier];
      const pos = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      const ARMS = 4;
      for (let i = 0; i < n; i++) {
        const arm = i % ARMS;
        const rr = Math.pow(Math.random(), 0.55); // denser core
        const r = rr * 85;
        const spiral = Math.log(1 + rr * 6) * 2.2;
        const th = (arm / ARMS) * Math.PI * 2 + spiral + (Math.random() - 0.5) * (0.5 - rr * 0.25);
        const zJitter = (Math.random() - 0.5) * (1 - rr * 0.8) * 7;
        pos[i * 3] = Math.cos(th) * r;
        pos[i * 3 + 1] = zJitter;
        pos[i * 3 + 2] = Math.sin(th) * r;
        seed[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      galaxyUniforms = {
        uEnv: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: rig.renderer.getPixelRatio() },
      };
      const gmat = new THREE.ShaderMaterial({
        uniforms: galaxyUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uEnv, uPixelRatio;
          varying float vSeed, vCore;
          void main() {
            vSeed = aSeed;
            vec3 p = position;
            float r = length(p.xz);
            vCore = 1.0 - smoothstep(0.0, 80.0, r);
            // differential rotation, slow and stately
            float w = 0.02 / (0.3 + r * 0.02);
            float a = w * uTime;
            float ca = cos(a), sa = sin(a);
            p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float size = (0.7 + fract(aSeed * 6.1) * 1.5) * (0.8 + vCore * 1.4) * uPixelRatio;
            gl_PointSize = size * (240.0 / -mv.z) * uEnv;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying float vSeed, vCore;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.1);
            vec3 core = vec3(1.0, 0.88, 0.68);
            vec3 arms = vec3(0.7, 0.8, 1.0);
            vec3 col = mix(arms, core, vCore + fract(vSeed * 4.7) * 0.25);
            gl_FragColor = vec4(col, glow * uEnv * (0.22 + vCore * 0.5));
          }
        `,
      });
      const galaxy = new THREE.Points(geo, gmat);
      galaxy.frustumCulled = false;
      galaxy.position.set(0, -6, -60);
      galaxy.rotation.x = 0.42;
      group.add(galaxy);

      // --- the Sun: reuse the hero star rig, small and yellow-white ---
      sun = makeStarRig(rig, SUN_COUNT[rig.tier]);
      sun.group.position.copy(SUN_POS);
      sun.uniforms.uColorHot.value.set('#FFF7E0');
      sun.uniforms.uColorMid.value.set('#FFD98C');
      sun.uniforms.uColorRim.value.set('#E8A050');
      sun.uniforms.uIgnition.value = 1;
      sun.uniforms.uChurn.value = 0.7;
      group.add(sun.group);

      // --- planets as luminous points + hairline orbits ---
      const ppos = new Float32Array(PLANETS.length * 3);
      const pcol = new Float32Array(PLANETS.length * 3);
      const psize = new Float32Array(PLANETS.length);
      PLANETS.forEach((pl, i) => {
        const col = new THREE.Color(pl[3]);
        pcol[i * 3] = col.r; pcol[i * 3 + 1] = col.g; pcol[i * 3 + 2] = col.b;
        psize[i] = pl[1];
      });
      const pgeo = new THREE.BufferGeometry();
      pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
      pgeo.setAttribute('aColor', new THREE.BufferAttribute(pcol, 3));
      pgeo.setAttribute('aSize', new THREE.BufferAttribute(psize, 1));
      const pmat = new THREE.ShaderMaterial({
        uniforms: { uEnv: { value: 0 }, uPixelRatio: { value: rig.renderer.getPixelRatio() } },
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          attribute vec3 aColor;
          attribute float aSize;
          uniform float uEnv, uPixelRatio;
          varying vec3 vCol;
          void main() {
            vCol = aColor;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = max(2.0, aSize * 40.0 * uPixelRatio * (30.0 / -mv.z)) * uEnv;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying vec3 vCol;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            gl_FragColor = vec4(vCol, pow(1.0 - d * 2.0, 1.4) * uEnv);
          }
        `,
      });
      planetPts = new THREE.Points(pgeo, pmat);
      planetPts.frustumCulled = false;
      group.add(planetPts);

      // orbits: thin line loops at 12% opacity
      orbitLines = new THREE.Group();
      for (const pl of PLANETS) {
        const segs = 96;
        const opos = new Float32Array(segs * 3);
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          opos[s * 3] = Math.cos(a) * pl[0];
          opos[s * 3 + 1] = 0;
          opos[s * 3 + 2] = Math.sin(a) * pl[0];
        }
        const og = new THREE.BufferGeometry();
        og.setAttribute('position', new THREE.BufferAttribute(opos, 3));
        const om = new THREE.LineBasicMaterial({
          color: 0xEDE9E0,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        orbitLines.add(new THREE.LineLoop(og, om));
      }
      orbitLines.position.copy(SUN_POS);
      orbitLines.rotation.x = 0.3;
      group.add(orbitLines);

      // the ring of attention around the pale blue dot — normal blending so it
      // still reads when Earth transits the blown-out sun disk
      earthRing = makeCoreGlow(new THREE.Color('#8FB8D8'), 1.6);
      earthRing.material.blending = THREE.NormalBlending;
      earthRing.material.opacity = 0;
      group.add(earthRing);

      rig.scene.add(group);
      this._galaxy = galaxy;
    },

    setVisible(v) { if (group) group.visible = v; },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      const env = envelope(l, 0.1, 0.12);

      // three movements: approach (galaxy) → dive (arm) → arrival (system)
      const dive = THREE.MathUtils.smoothstep(l, 0.25, 0.6); // 0 galaxy → 1 system
      galaxyUniforms.uEnv.value = env * (1 - dive * 0.55);
      galaxyUniforms.uTime.value = time;
      galaxyUniforms.uPixelRatio.value = rig.renderer.getPixelRatio();

      const su = sun.uniforms;
      su.uEnv.value = env * dive;
      su.uTime.value = time;
      su.uRadius.value = 3.0;
      su.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
      su.uPixelRatio.value = rig.renderer.getPixelRatio();
      // the Sun flares gently toward the cursor
      su.uPointer.value.set(SUN_POS.x + rig.pointer.x * 10, SUN_POS.y + rig.pointer.y * 7, SUN_POS.z);
      su.uPointerStrength.value = rig.pointerStrength * 0.6;
      sun.core.material.opacity = env * dive * 0.5;
      sun.core.scale.setScalar(8);

      // planets orbit slowly; positions on tilted plane
      const p = planetPts.geometry.attributes.position.array;
      PLANETS.forEach((pl, i) => {
        const a = time * 0.05 * pl[2] + i * 1.7;
        const x = Math.cos(a) * pl[0], z = Math.sin(a) * pl[0];
        // same tilt as orbitLines (rotation.x = 0.3)
        const y = -z * Math.sin(0.3);
        const zz = z * Math.cos(0.3);
        p[i * 3] = SUN_POS.x + x;
        p[i * 3 + 1] = SUN_POS.y + y;
        p[i * 3 + 2] = SUN_POS.z + zz;
        if (i === 2) {
          earthRing.position.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
        }
      });
      planetPts.geometry.attributes.position.needsUpdate = true;
      planetPts.material.uniforms.uEnv.value = env * dive;
      planetPts.material.uniforms.uPixelRatio.value = rig.renderer.getPixelRatio();

      // orbits fade in on arrival; the system lights its paths for your presence
      const arrive = THREE.MathUtils.smoothstep(l, 0.5, 0.75);
      const noticed = 1 + rig.pointerStrength * 0.9;
      orbitLines.children.forEach((line) => {
        line.material.opacity = env * arrive * 0.1 * noticed;
      });

      // the pale blue dot beat: ring of attention during the NOW hold
      const nowBeat = THREE.MathUtils.smoothstep(l, 0.62, 0.8);
      earthRing.material.opacity = env * nowBeat * (0.35 + Math.sin(time * 1.4) * 0.1);
      earthRing.scale.setScalar(1.2 + Math.sin(time * 1.4) * 0.15);
    },

    dispose(rig) {
      if (!group) return;
      rig.scene.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      sun.dispose();
      group = null;
      sun = null;
    },
  };
}
