// Scroll → timeline. Native scroll only; we read it, never intercept it.
// Raw position is spring-smoothed each frame; consumers read t, rawT, velocity.

export class Timeline {
  constructor() {
    this.rawT = 0;
    this.t = 0;
    this.velocity = 0; // smoothed dT/dt (per second)
    this._springVel = 0;
    this._jump = null; // active programmatic scroll {from,to,start,dur}
    this._onScroll = this._readRaw.bind(this);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
    // any manual input cancels a programmatic jump
    const cancel = () => { this._jump = null; };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    this._readRaw();
    this.t = this.rawT;
  }

  _readRaw() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.rawT = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  /** Eased scroll to timeline position (epoch index clicks). */
  jumpTo(target, dur = 1600) {
    this._jump = { from: window.scrollY, to: this._tToScrollY(target), start: performance.now(), dur };
  }

  _tToScrollY(t) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return t * max;
  }

  update(dt) {
    if (this._jump) {
      const { from, to, start, dur } = this._jump;
      const p = Math.min(1, (performance.now() - start) / dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // easeInOutCubic
      window.scrollTo(0, from + (to - from) * e);
      if (p >= 1) this._jump = null;
      this._readRaw();
    }
    // critically-damped spring toward rawT
    const omega = 4.2; // response speed
    const x = this.t - this.rawT;
    const temp = (this._springVel + omega * x) * dt;
    this._springVel = (this._springVel - omega * temp) * Math.exp(-omega * dt);
    const prev = this.t;
    this.t = this.rawT + (x + temp) * Math.exp(-omega * dt);
    this.velocity = dt > 0 ? (this.t - prev) / dt : 0;
  }

  dispose() {
    window.removeEventListener('scroll', this._onScroll);
  }
}
