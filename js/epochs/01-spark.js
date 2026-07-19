// THE SPARK — t 0.04..0.12. A point detonates into an expanding particle field.
// Pointer: curl swirl stirred into the burst (you seed the fluctuations).

import * as THREE from 'three';
import { GLSL_NOISE, localT, envelope, randDir, makeCoreGlow } from './util.js';

const COUNT = { 2: 60000, 1: 38000, 0: 22000 };
const RANGE = [0.04, 0.12];

export function createSpark() {
  let points = null, uniforms = null, core = null;

  return {
    id: 'spark',
    range: RANGE,

    init(rig) {
      const n = COUNT[rig.tier];
      const dir = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const d = randDir();
        // slight anisotropy so the burst is not a perfect ball
        dir[i * 3] = d[0] * (1 + Math.random() * 0.15);
        dir[i * 3 + 1] = d[1];
        dir[i * 3 + 2] = d[2] * (1 + Math.random() * 0.15);
        seed[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      // position attribute required; direction carried there
      geo.setAttribute('position', new THREE.BufferAttribute(dir, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

      uniforms = {
        uProgress: { value: 0 },   // epoch-local 0..1
        uEnv: { value: 0 },        // fade envelope
        uTime: { value: 0 },
        uAgitation: { value: 0 },  // scroll-velocity turbulence
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
          varying float vSeed, vHeat;
          ${GLSL_NOISE}
          void main() {
            vSeed = aSeed;
            // each particle rides the blast at its own speed
            float speed = 0.35 + 0.65 * fract(aSeed * 7.13);
            float r = pow(uProgress, 0.6) * 72.0 * speed + 0.4;
            vec3 p = normalize(position) * r;
            // slow tumble + scroll agitation
            float wob = vnoise(vec2(aSeed * 91.0, uTime * 0.25)) - 0.5;
            p += normalize(position).yzx * wob * (1.5 + uAgitation * 14.0);
            // pointer swirl: you stir the anisotropies
            p += swirl(p, uPointer, 26.0, uPointerStrength * 9.0);
            vHeat = 1.0 - smoothstep(0.0, 1.0, uProgress) * speed;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            // slow (core) particles render larger and hotter
            float size = (0.8 + fract(aSeed * 3.7) * 1.6) * (0.75 + (1.0 - speed) * 1.1) * uPixelRatio;
            gl_PointSize = size * (190.0 / -mv.z) * uEnv;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uEnv;
          varying float vSeed, vHeat;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 1.9);
            vec3 violet = vec3(0.79, 0.77, 1.0);
            vec3 white  = vec3(1.0, 0.98, 0.93);
            vec3 amber  = vec3(0.88, 0.55, 0.30);
            float heat = clamp(vHeat, 0.0, 1.0);
            vec3 col = mix(mix(amber, violet, heat), white, pow(heat, 3.0));
            // density falloff: the shell dims, the core stays blinding
            gl_FragColor = vec4(col, glow * uEnv * (0.1 + 0.9 * pow(heat, 1.5)));
          }
        `,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      rig.scene.add(points);

      // the singularity itself: a blinding core that the blast leaves behind
      core = makeCoreGlow(new THREE.Color('#E8E4FF'), 60);
      rig.scene.add(core);
    },

    setVisible(v) {
      if (points) points.visible = v;
      if (core) core.visible = v;
    },

    update(t, dt, time, rig) {
      const l = localT(t, RANGE);
      uniforms.uProgress.value = l;
      uniforms.uEnv.value = envelope(l, 0.06, 0.22);
      uniforms.uTime.value = time;
      uniforms.uAgitation.value = Math.min(1, Math.abs(rig.scrollVelocity || 0) * 8);
      uniforms.uPixelRatio.value = rig.renderer.getPixelRatio();
      // pointer in world space near the burst plane
      uniforms.uPointer.value.set(rig.pointer.x * 45, rig.pointer.y * 28, 0);
      uniforms.uPointerStrength.value = rig.pointerStrength;
      // core: blinding at detonation, cooling and shrinking as the blast expands
      const flash = Math.pow(Math.max(0, 1 - l * 1.35), 1.6);
      core.material.opacity = envelope(l, 0.02, 0.3) * (0.25 + 0.75 * flash);
      core.scale.setScalar(24 + flash * 70 + l * 10);
      core.material.color.setRGB(
        0.91 + flash * 0.09,
        0.89 - l * 0.25,
        1.0 - l * 0.55
      );
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
