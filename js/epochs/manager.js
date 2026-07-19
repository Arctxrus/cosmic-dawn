// Epoch lifecycle: lazy init when the timeline approaches, hide when outside,
// dispose GPU resources when far away. At most two epochs render (crossfades).

const APPROACH = 0.08; // init when within this distance of the epoch's range
const RELEASE = 0.2;   // dispose when farther than this

export class EpochManager {
  constructor(rig) {
    this.rig = rig;
    this.modules = [];
  }

  register(mod) {
    this.modules.push(mod);
    mod._ready = false;
  }

  _distance(t, [t0, t1]) {
    if (t < t0) return t0 - t;
    if (t > t1) return t - t1;
    return 0;
  }

  update(t, dt, time) {
    for (const m of this.modules) {
      const d = this._distance(t, m.range);
      if (!m._ready && d < APPROACH) {
        m.init(this.rig);
        m._ready = true;
      }
      if (m._ready && d > RELEASE && m.dispose) {
        m.dispose(this.rig);
        m._ready = false;
        continue;
      }
      if (m._ready) {
        const active = d < APPROACH * 0.75;
        if (m.setVisible) m.setVisible(active);
        if (active) m.update(t, dt, time, this.rig);
      }
    }
  }
}
