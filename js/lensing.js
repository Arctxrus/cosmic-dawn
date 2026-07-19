// Screen-space gravitational lensing for THE LONG NIGHT — T2 only.
// The scene renders to a target; a fullscreen pass bends it around the hole:
// 1/r deflection (Einstein-ring style), an absolute shadow, a doppler-beamed
// photon ring, and cursor frame-dragging. T1/T0 keep the cheap fake; the
// governor drops this pass before it drops a tier.

import * as THREE from 'three';

export class LensPass {
  constructor(renderer) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.uniforms = {
      tDiffuse: { value: null },
      uHole: { value: new THREE.Vector2(0.5, 0.5) },  // hole centre, uv space
      uRadius: { value: 0.05 },                        // shadow radius, uv space
      uAspect: { value: 1 },
      uStrength: { value: 0 },                         // epoch envelope 0..1
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },    // ndc
      uPointerStrength: { value: 0 },
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
        uniform vec2 uHole, uPointer;
        uniform float uRadius, uAspect, uStrength, uTime, uPointerStrength;
        varying vec2 vUv;
        void main() {
          vec2 d = vUv - uHole;
          d.x *= uAspect;
          float r = length(d);
          vec2 dir = d / max(r, 1e-4);

          // gravitational deflection: light bends toward the mass, ~1/r,
          // windowed so the far field stays honest
          float defl = uStrength * 0.0042 / (r + 0.018);
          defl *= smoothstep(0.55, 0.12, r);

          // frame-dragging: your presence swirls the deflection field
          vec2 pd = uPointer * 0.5; // ndc → uv half-space
          float drag = uPointerStrength * exp(-dot(d - pd, d - pd) * 30.0) * 0.6;
          vec2 tang = vec2(-dir.y, dir.x);

          vec2 off = dir * defl + tang * defl * drag * 3.0;
          off.x /= uAspect;
          vec3 col = texture2D(tDiffuse, vUv - off).rgb;

          // the shadow: nothing escapes inside the horizon
          col *= smoothstep(uRadius * 0.82, uRadius, r);

          // photon ring: thin, hot, doppler-beamed, leaning with the drag
          float ang = atan(d.y, d.x);
          float beam = 0.62 + 0.38 * sin(ang - uTime * 0.15);
          float ring = exp(-pow((r - uRadius * 1.16) * 110.0, 2.0)) * beam;
          col += vec3(1.0, 0.76, 0.46) * ring * uStrength * (1.0 + drag);

          gl_FragColor = vec4(col, 1.0);
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

  /** Render `scene` through the lens. holeWorld is the hole's position. */
  render(rig, holeWorld, holeRadiusWorld, envelope, time) {
    const cam = rig.camera;
    // project the hole centre and a camera-right offset point → uv radius
    const c = holeWorld.clone().project(cam);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const edge = holeWorld.clone().addScaledVector(right, holeRadiusWorld).project(cam);
    const u = this.uniforms;
    u.uHole.value.set(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5);
    const dx = (edge.x - c.x) * 0.5 * cam.aspect;
    const dy = (edge.y - c.y) * 0.5;
    u.uRadius.value = Math.max(0.005, Math.hypot(dx, dy));
    u.uAspect.value = cam.aspect;
    u.uStrength.value = envelope;
    u.uTime.value = time;
    u.uPointer.value.copy(rig.pointer);
    u.uPointerStrength.value = rig.pointerStrength;

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
