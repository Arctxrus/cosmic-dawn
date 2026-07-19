// Renderer, camera rig, shared skybox starfield, pointer ray.
// The skybox is the continuous thread: its density/temperature age with the timeline.

import * as THREE from 'three';

const STAR_COUNT = { 2: 20000, 1: 12000, 0: 7000 };

export class SceneRig {
  constructor(canvas, tier) {
    this.tier = tier;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(new THREE.Color('#10122A'), 1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 4000);

    // pointer state (normalized -1..1; smoothed for parallax)
    this.pointer = new THREE.Vector2(0, 0);
    this._pointerTarget = new THREE.Vector2(0, 0);
    this.pointerActive = false;

    // camera path: placeholder dolly for stage 1; epochs refine keyframes later
    // refined per stage as epochs are built
    this._camKeyframes = [
      { t: 0.0, pos: [0, 0, 150], look: [0, 0, 0] },   // prologue: quiet dark
      { t: 0.04, pos: [0, 0, 115], look: [0, 0, 0] },  // drawn toward the point
      { t: 0.075, pos: [0, 2, 95], look: [0, 0, 0] },  // at the shell of the detonation
      { t: 0.12, pos: [0, 6, 155], look: [0, 0, 0] },  // pushed back by the blast
      { t: 0.21, pos: [0, 0, 85], look: [0, 0, -20] }, // drifting through thinning fog
      { t: 0.25, pos: [14, 6, 95], look: [0, 0, 0] },  // slow lateral drift in the dark
      { t: 0.29, pos: [8, 2, 88], look: [0, 0, -10] }, // a clump catches the eye
      { t: 0.345, pos: [0, 0, 72], look: [0, 0, -10] },// drawn in toward the ignition
      { t: 0.41, pos: [-10, 4, 96], look: [0, 0, -10] },// slow retreat from the burning star
      { t: 0.46, pos: [0, 20, 260], look: [0, 0, 0] },  // the vast pull-back: the web
      { t: 0.53, pos: [10, 12, 150], look: [0, -6, -60] },// one filament catches the eye
      { t: 0.575, pos: [6, 10, 30], look: [0, -6, -60] }, // approaching the galaxy disk
      { t: 0.615, pos: [16, 12, -2], look: [26, 3, -35] }, // skimming the arm toward the Sun
      { t: 0.65, pos: [34, 10, -13], look: [29, 2, -33] }, // arrival: sun seated left of frame
      { t: 0.68, pos: [33, 9.5, -14.5], look: [29, 2, -33] },// NOW hold, barely breathing
      { t: 0.715, pos: [46, 9, 5], look: [21, 3, -35] },   // retreating as the Sun swells right of frame
      { t: 0.75, pos: [33, 6, -18], look: [26, 3, -35] },  // drawn back in for the collapse
      { t: 0.79, pos: [14, 10, 42], look: [2, 2, -38] },   // the long pull-back into an empty sky
      { t: 0.845, pos: [4, 4, -8], look: [5, 2, -40] },    // face to face with the hole, seated left
      { t: 0.9, pos: [-4, 2, 8], look: [0, 0, -15] },      // turning to the last ember
      { t: 0.96, pos: [0, 0, -4], look: [0, 0, -15] },     // close enough to warm your hands
      { t: 1.0, pos: [0, 0, -4.5], look: [0, 0, -15] },    // stillness, and the dark
    ];
    this.scrollVelocity = 0;

    this._buildSkybox(tier);
    this.applyTier(tier);
    this.resize();

    window.addEventListener('pointermove', (e) => {
      this._pointerTarget.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.pointerActive = true;
    });
    window.addEventListener('resize', () => this.resize());
  }

  _buildSkybox(tier) {
    const n = STAR_COUNT[tier];
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // stars on a thick shell so camera motion produces parallax
      const r = 600 + Math.random() * 1800;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.skyUniforms = {
      uTime: { value: 0 },
      uT: { value: 0 },        // timeline 0..1
      uDensity: { value: 0.5 }, // fraction of stars visible
      uTempMix: { value: 0.5 }, // 0 = cool blue, 1 = ember red
      uPixelRatio: { value: this.renderer.getPixelRatio() },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uDensity, uPixelRatio;
        varying float vSeed, vTwinkle;
        void main() {
          vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float visible = step(aSeed, uDensity);
          vTwinkle = 0.75 + 0.25 * sin(uTime * (0.4 + aSeed * 1.6) + aSeed * 40.0);
          float size = (1.0 + pow(fract(aSeed * 7.31), 3.0) * 2.6) * uPixelRatio;
          gl_PointSize = size * visible * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTempMix;
        varying float vSeed, vTwinkle;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float glow = pow(1.0 - d * 2.0, 2.2);
          // per-star temperature scatter around the era's global temperature
          vec3 cool = vec3(0.75, 0.83, 1.0);
          vec3 warm = vec3(1.0, 0.85, 0.62);
          vec3 red  = vec3(0.55, 0.18, 0.12);
          float t = clamp(uTempMix + (fract(vSeed * 13.7) - 0.5) * 0.4, 0.0, 1.0);
          vec3 col = t < 0.5 ? mix(cool, warm, t * 2.0) : mix(warm, red, (t - 0.5) * 2.0);
          gl_FragColor = vec4(col, glow * vTwinkle);
        }
      `,
    });

    this.skybox = new THREE.Points(geo, mat);
    this.skybox.frustumCulled = false;
    this.scene.add(this.skybox);
  }

  /** Global aging of the sky, driven each frame from the timeline. */
  _ageSky(t, time) {
    const u = this.skyUniforms;
    u.uTime.value = time;
    u.uT.value = t;
    // density: dim prologue → none in dark ages → peak at HOME → collapse to none
    let density;
    if (t < 0.12) density = 0.35;
    else if (t < 0.21) density = 0.1;
    else if (t < 0.29) density = 0.05;
    else if (t < 0.41) density = 0.3 + ((t - 0.29) / 0.12) * 0.3;
    else if (t < 0.68) density = 0.6 + ((t - 0.41) / 0.27) * 0.4;
    else if (t < 0.79) density = 1.0 - ((t - 0.68) / 0.11) * 0.75;
    else if (t < 0.9) density = 0.25 - ((t - 0.79) / 0.11) * 0.2;
    else density = Math.max(0, 0.05 - ((t - 0.9) / 0.06) * 0.05);
    u.uDensity.value = density;
    // temperature: blue-violet young → warm middle → ember end
    u.uTempMix.value = t < 0.53 ? 0.15 + t * 0.5 : 0.41 + ((t - 0.53) / 0.47) * 0.59;
  }

  _camAt(t, out) {
    const k = this._camKeyframes;
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1].t) i++;
    const a = k[i], b = k[i + 1];
    const f = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    const e = f * f * (3 - 2 * f); // smoothstep per segment
    for (let j = 0; j < 3; j++) {
      out.pos[j] = a.pos[j] + (b.pos[j] - a.pos[j]) * e;
      out.look[j] = a.look[j] + (b.look[j] - a.look[j]) * e;
    }
  }

  update(t, dt, time) {
    // smoothed pointer for parallax
    this.pointer.lerp(this._pointerTarget, Math.min(1, dt * 3.5));
    const cam = { pos: [0, 0, 0], look: [0, 0, 0] };
    this._camAt(t, cam);
    // parallax layer: ±2.5 units, applied on top of the path
    const px = this.pointer.x * 2.5;
    const py = this.pointer.y * 1.6;
    this.camera.position.set(cam.pos[0] + px, cam.pos[1] + py, cam.pos[2]);
    this.camera.lookAt(cam.look[0] + px * 0.35, cam.look[1] + py * 0.35, cam.look[2]);
    this._ageSky(t, time);
    // background deepens from dusk navy → void black across all time
    const bg = new THREE.Color('#10122A').lerp(new THREE.Color('#08070F'), Math.min(1, t * 1.6));
    this.renderer.setClearColor(bg, 1);
  }

  applyTier(tier) {
    this.tier = tier;
    const dprCap = window.innerWidth <= 768 ? [1.5, 1.25, 1][2 - tier] : [2, 1.5, 1][2 - tier];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    if (this.skyUniforms) this.skyUniforms.uPixelRatio.value = this.renderer.getPixelRatio();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
