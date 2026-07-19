// Gargantua — the T2 black hole. One lensed system, computed per-pixel from
// the real camera: rays bend around the mass (single-deflection analytic
// approximation), and where the bent ray strikes the accretion-disc plane we
// sample a procedural disc. The far side of the disc therefore appears as
// arcs ABOVE and BELOW the shadow — not a second ring, the back of the same
// disc. Photon ring at the critical impact parameter; doppler beaming makes
// the approaching side bright and white, the receding side dim and warm.
// The scene behind (starfield) is sampled through the same deflection.
//
// Because everything derives from the camera, the pointer's parallax orbit
// (scene.js) makes the arcs and ring shift naturally. The mouse never moves
// the disc — it moves the viewpoint.

import * as THREE from 'three';
import { GLSL_NOISE } from './epochs/util.js';

export class LensPass {
  constructor(renderer) {
    this.renderer = renderer;
    // half-float: the scene lands here in linear light, and 8-bit storage
    // would crush the dark floor to quantization garbage (the magenta-boundary
    // bug). fp16 keeps the dark end intact for the OETF re-encode below.
    this.rt = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true, type: THREE.HalfFloatType });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // disc plane: near edge-on, slight roll — set once, world-fixed
    const n = new THREE.Vector3(0.1, 1.0, 0.03).normalize();
    const u = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 0, 1)).normalize();
    const v = new THREE.Vector3().crossVectors(n, u);
    this.uniforms = {
      tDiffuse: { value: null },
      uCamPos: { value: new THREE.Vector3() },
      uCamRight: { value: new THREE.Vector3() },
      uCamUp: { value: new THREE.Vector3() },
      uCamFwd: { value: new THREE.Vector3() },
      uTanHalf: { value: 0.5 },
      uAspect: { value: 1 },
      uHolePos: { value: new THREE.Vector3() },
      uRs: { value: 5.2 },       // visual Schwarzschild scale (world units)
      uDiscN: { value: n },
      uDiscU: { value: u },
      uDiscV: { value: v },
      uHoleUv: { value: new THREE.Vector2(0.5, 0.5) }, // projected centre (bg warp)
      uRadiusUv: { value: 0.05 },
      uStrength: { value: 0 },   // epoch envelope
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec3 uCamPos, uCamRight, uCamUp, uCamFwd, uHolePos, uDiscN, uDiscU, uDiscV;
        uniform vec2 uHoleUv;
        uniform float uTanHalf, uAspect, uRs, uRadiusUv, uStrength, uTime;
        varying vec2 vUv;
        ${GLSL_NOISE}

        // procedural accretion disc emission at a world hit point
        vec4 disc(vec3 hp, vec3 rd) {
          vec3 rel = hp - uHolePos;
          float r = length(rel);
          float inner = uRs * 2.1;
          float outer = uRs * 8.5;
          float u = (r - inner) / (outer - inner);
          if (u < 0.0 || u > 1.0) return vec4(0.0);
          vec3 radial = rel / r;
          float phi = atan(dot(rel, uDiscV), dot(rel, uDiscU));
          // orbital streaks, continuous in phi (noise fed by cos/sin, no seam)
          vec2 sw = vec2(cos(phi), sin(phi)) * (1.5 + r * 0.22);
          float n = fbm(sw + vec2(-uTime * 0.22, uTime * 0.11));
          // streaks run along the orbit, noise-broken, no concentric ringing
          float bands = 0.5 + 0.5 * sin(phi * 3.0 - r * 1.15 - uTime * 0.5 + n * 6.5);
          bands = pow(bands, 1.4);
          // hot inner edge cooling outward — bright, but never a white wall
          float bright = pow(1.0 - u, 1.6) * 1.55 + 0.1;
          vec3 hot = vec3(1.0, 0.97, 0.9);
          vec3 warm = vec3(0.98, 0.72, 0.4);
          vec3 emberc = vec3(0.75, 0.4, 0.18);
          vec3 c = mix(hot, mix(warm, emberc, smoothstep(0.35, 1.0, u)), smoothstep(0.0, 0.5, u));
          // doppler beaming: the approaching side burns bright and white
          vec3 vt = normalize(cross(uDiscN, radial));
          float dop = dot(vt, -rd);
          c *= 1.0 + 1.9 * max(dop, 0.0);
          c = mix(c, vec3(1.0, 0.99, 0.97), max(dop, 0.0) * 0.7);
          c *= 1.0 - 0.5 * max(-dop, 0.0);
          c = mix(c, vec3(0.85, 0.5, 0.24), max(-dop, 0.0) * 0.45);
          float edgeIn = smoothstep(0.0, 0.05, u);
          float edgeOut = 1.0 - smoothstep(0.55, 1.05, u);
          float a = clamp(bright * (0.45 + 0.55 * bands), 0.0, 1.4) * edgeIn * edgeOut;
          return vec4(c * bright * (0.5 + 0.5 * bands), clamp(a, 0.0, 1.0));
        }

        // intersect ray with the disc plane (offset h along the normal); t or -1
        float planeT(vec3 o, vec3 d, float h) {
          float dn = dot(d, uDiscN);
          if (abs(dn) < 1e-4) return -1.0;
          return dot(uHolePos + uDiscN * h - o, uDiscN) / dn;
        }

        // two thin sheets a hair apart: cheap thickness, kills grazing aliasing
        vec4 sampleDisc(vec3 o, vec3 d, float tMax) {
          vec4 acc = vec4(0.0);
          for (int i = 0; i < 2; i++) {
            float h = i == 0 ? -0.3 : 0.3;
            float tt = planeT(o, d, h);
            if (tt > 0.0 && (tMax < 0.0 || tt < tMax)) {
              vec4 s = disc(o + d * tt, d);
              acc.rgb += s.rgb * 0.5;
              acc.a = max(acc.a, s.a);
            }
          }
          return acc;
        }

        void main() {
          vec2 ndc = vUv * 2.0 - 1.0;
          vec3 rd = normalize(uCamFwd + uTanHalf * (ndc.x * uAspect * uCamRight + ndc.y * uCamUp));
          vec3 ro = uCamPos;

          // impact geometry
          vec3 oc = uHolePos - ro;
          float tc = max(dot(oc, rd), 0.0);
          vec3 pc = ro + rd * tc;
          vec3 bvec = pc - uHolePos;
          float b = length(bvec);
          float bCrit = uRs * 1.7;

          // deflection: bend the ray toward the mass at closest approach
          float defl = clamp(uRs * 2.6 / max(b, 0.6), 0.0, 3.0) * uStrength;
          vec3 rd2 = normalize(rd + normalize(-bvec + vec3(1e-5)) * defl);

          bool captured = b < bCrit * uStrength;

          // near-side disc: straight segment before closest approach
          vec4 dNear = sampleDisc(ro, rd, tc + uRs);
          // far-side disc: the bent segment beyond closest approach —
          // this is what folds the back of the disc over and under the shadow
          vec4 dFar = vec4(0.0);
          if (!captured) {
            vec4 s = sampleDisc(pc, rd2, -1.0);
            // only count far-side hits (behind the hole along the view)
            float t2 = planeT(pc, rd2, 0.0);
            if (t2 > 0.0 && dot((pc + rd2 * t2) - ro, rd) > tc * 0.6) dFar = s;
          }

          // background starfield through the same deflection (screen-space warp)
          vec2 d2 = vUv - uHoleUv;
          d2.x *= uAspect;
          float r2 = length(d2);
          vec2 dir2 = d2 / max(r2, 1e-4);
          float warp = uStrength * 0.0042 / (r2 + 0.018) * smoothstep(0.6, 0.1, r2);
          vec2 off = dir2 * warp;
          off.x /= uAspect;
          vec3 bg = texture2D(tDiffuse, vUv - off).rgb;
          // the render target skipped the renderer's sRGB output transform —
          // encode the BACKGROUND here so the path hand-off at the epoch
          // boundaries is seamless; disc/ring are authored in display space
          bg = clamp(bg, 0.0, 1.0);
          bg = mix(bg * 12.92, 1.055 * pow(bg, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, bg));
          bg *= captured ? 0.0 : 1.0;

          // composite: near disc over (far disc over background)
          vec3 col = mix(bg, dFar.rgb, dFar.a);
          col = mix(col, dNear.rgb, dNear.a);
          col += dNear.rgb * 0.14 + dFar.rgb * 0.1; // gentle glow lift

          // photon ring at the critical impact parameter, doppler-beamed
          float ang = atan(dot(bvec, uCamUp), dot(bvec, uCamRight));
          float beam = 0.6 + 0.4 * sin(ang + uTime * 0.1);
          float ring = exp(-pow((b - bCrit) / (uRs * 0.055), 2.0)) * beam;
          col += vec3(1.0, 0.9, 0.72) * ring * uStrength * 1.2;

          // the whole treatment fades with the epoch envelope; the plain path
          // gets the same background encode so mixing never shifts luma
          vec3 plain = texture2D(tDiffuse, vUv).rgb;
          plain = clamp(plain, 0.0, 1.0);
          plain = mix(plain * 12.92, 1.055 * pow(plain, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, plain));
          gl_FragColor = vec4(mix(plain, col, smoothstep(0.0, 0.35, uStrength)), 1.0);
        }
      `,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  setSize(w, h, dpr) {
    this.rt.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
  }

  render(rig, holeWorld, holeRadiusWorld, envelope, time) {
    const cam = rig.camera;
    cam.updateMatrixWorld();
    const u = this.uniforms;
    u.uCamPos.value.setFromMatrixPosition(cam.matrixWorld);
    u.uCamRight.value.setFromMatrixColumn(cam.matrixWorld, 0);
    u.uCamUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
    u.uCamFwd.value.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    u.uTanHalf.value = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
    u.uAspect.value = cam.aspect;
    u.uHolePos.value.copy(holeWorld);
    u.uRs.value = holeRadiusWorld;
    u.uStrength.value = envelope;
    u.uTime.value = time;
    // projected centre for the background warp
    const c = holeWorld.clone().project(cam);
    u.uHoleUv.value.set(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5);

    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(rig.scene, cam);
    this.renderer.setRenderTarget(null);
    u.tDiffuse.value = this.rt.texture;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.rt.dispose();
  }
}
