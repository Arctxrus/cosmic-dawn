// Procedural sound: the universe as a slowly-descending chord.
// Zero samples, zero licensing — everything is synthesized.
//
// Three layers:
//   1. the drone      — two detuned sines + a triangle an octave down;
//                       pitch glides down almost an octave across all of time
//   2. radiation      — looped brown noise through a lowpass whose cutoff
//                       tracks the universe's temperature
//   3. events         — struck-glass partial stacks (ignition, collapse,
//                       supernovae), one low bell for the last star,
//                       then true silence
// Scroll velocity adds a faint shimmer to the noise send.

import { EXTINCTION_T } from './content.js';

const EVENTS = [
  { at: 0.35, kind: 'glass', freq: 1180 },   // first light ignites
  { at: 0.7484, kind: 'glass', freq: 880 },  // the Sun lets go (fading collapse)
  { at: EXTINCTION_T, kind: 'bell', freq: 98 }, // the last star dies
];

export class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.on = false;
    this._lastT = 0;
    this._novaClock = 0;
  }

  _build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.ratio.value = 12;
    this.master.connect(limiter).connect(ctx.destination);

    // --- layer 1: the drone ---
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.16;
    this.droneGain.connect(this.master);
    this.drones = [
      { osc: ctx.createOscillator(), base: 110, type: 'sine', gain: 0.5 },
      { osc: ctx.createOscillator(), base: 111.2, type: 'sine', gain: 0.4 },
      { osc: ctx.createOscillator(), base: 55, type: 'triangle', gain: 0.35 },
    ].map((d) => {
      d.osc.type = d.type;
      d.osc.frequency.value = d.base;
      const g = ctx.createGain();
      g.gain.value = d.gain;
      d.osc.connect(g).connect(this.droneGain);
      d.osc.start();
      return d;
    });

    // --- layer 2: radiation (brown noise → lowpass) ---
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.value = 400;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.12;
    noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
    noise.start();

    // shimmer send: same noise, highpassed, velocity-driven
    this.shimmerFilter = ctx.createBiquadFilter();
    this.shimmerFilter.type = 'highpass';
    this.shimmerFilter.frequency.value = 2400;
    this.shimmerGain = ctx.createGain();
    this.shimmerGain.gain.value = 0;
    noise.connect(this.shimmerFilter).connect(this.shimmerGain).connect(this.master);
  }

  async toggle() {
    if (!this.ctx) this._build();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.on ? 0.9 : 0, t, this.on ? 1.2 : 0.4);
    return this.on;
  }

  /** A short stack of inharmonic partials — struck glass, or a low bell. */
  _strike(freq, kind) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const partials = kind === 'bell'
      ? [[1, 0.5, 7], [2.4, 0.2, 5], [4.1, 0.08, 3.4]]
      : [[1, 0.3, 2.2], [2.76, 0.14, 1.6], [5.4, 0.05, 1.0]];
    for (const [ratio, amp, dur] of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  /** Called every frame with smoothed t, dt, and scroll velocity. */
  update(t, dt, velocity) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') { this._lastT = t; return; }
    const now = this.ctx.currentTime;

    // the chord of the universe descends as it ages and silences at the end
    const silence = t >= EXTINCTION_T ? Math.min(1, (t - EXTINCTION_T) / 0.01) : 0;
    const pitch = Math.pow(0.55, t); // ~an octave down across all time
    for (const d of this.drones) {
      d.osc.frequency.setTargetAtTime(d.base * pitch, now, 0.4);
    }
    this.droneGain.gain.setTargetAtTime(0.16 * (1 - silence), now, 0.8);

    // radiation cools: bright hiss at the spark → nearly closed at the end
    const temp = t < 0.12 ? 1 : t < 0.53 ? 0.55 - t * 0.4 : Math.max(0.04, 0.35 - (t - 0.53) * 0.6);
    this.noiseFilter.frequency.setTargetAtTime(120 + temp * 3800, now, 0.5);
    this.noiseGain.gain.setTargetAtTime(0.12 * (1 - silence), now, 0.8);

    // scroll shimmer
    const shimmer = Math.min(0.08, Math.abs(velocity) * 0.9);
    this.shimmerGain.gain.setTargetAtTime(shimmer * (1 - silence), now, 0.15);

    // scripted events: fire on forward crossings
    for (const e of EVENTS) {
      if (this._lastT < e.at && t >= e.at) this._strike(e.freq, e.kind);
    }
    // occasional supernova pings while inside THE WEB
    if (t > 0.42 && t < 0.53) {
      this._novaClock -= dt;
      if (this._novaClock <= 0) {
        this._novaClock = 5 + Math.random() * 7;
        this._strike(1600 + Math.random() * 900, 'glass');
      }
    }
    this._lastT = t;
  }
}
