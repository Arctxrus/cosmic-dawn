// The complete interface layer: epoch index, year readout, captions,
// title lockup, scroll whisper, cursor, credits, ending light.

import { EPOCHS, SITE, yearReadout, epochAt, EXTINCTION_T } from './content.js';

export class UI {
  constructor(timeline) {
    this.timeline = timeline;
    this.activeEpoch = null;
    this._lastReadout = '';

    this._buildIndex();
    this._buildEpochText();
    this._buildCredits();
    this._cursor();
    this._whisper();

    this.readoutEl = document.getElementById('year-readout');
    this.titleEl = document.getElementById('title-lockup');
    this.endingLight = document.getElementById('ending-light');
  }

  _buildIndex() {
    const nav = document.getElementById('epoch-index');
    this.indexButtons = new Map();
    for (const epoch of EPOCHS) {
      if (!epoch.label) continue;
      const b = document.createElement('button');
      b.textContent = epoch.label;
      b.setAttribute('aria-current', 'false');
      b.addEventListener('click', () => {
        // land one third into the epoch — past the transition, into the dwell
        const [t0, t1] = epoch.range;
        this.timeline.jumpTo(t0 + (t1 - t0) * 0.33);
      });
      nav.appendChild(b);
      this.indexButtons.set(epoch.id, b);
    }
  }

  _buildEpochText() {
    const main = document.getElementById('narrative');
    this.epochEls = new Map();
    EPOCHS.forEach((epoch, i) => {
      if (!epoch.headline) return;
      const sec = document.createElement('section');
      const right = epoch.align ? epoch.align === 'right' : i % 2 === 0;
      sec.className = 'epoch-text' + (right ? ' align-right' : '');
      sec.id = `epoch-${epoch.id}`;
      const h2 = document.createElement('h2');
      h2.textContent = epoch.headline;
      sec.appendChild(h2);
      for (const c of epoch.captions) {
        const p = document.createElement('p');
        p.className = 'caption';
        p.textContent = c;
        sec.appendChild(p);
      }
      main.appendChild(sec);
      this.epochEls.set(epoch.id, sec);
    });
  }

  _buildCredits() {
    const div = document.createElement('div');
    div.id = 'credits';
    for (const c of SITE.credits) {
      if (c.href) {
        const a = document.createElement('a');
        a.href = c.href;
        a.textContent = c.label;
        a.rel = 'noopener';
        div.appendChild(a);
      } else {
        const s = document.createElement('span');
        s.textContent = c.label;
        div.appendChild(s);
      }
    }
    document.body.appendChild(div);
    this.creditsEl = div;
  }

  _cursor() {
    const dot = document.getElementById('cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      window.addEventListener('pointermove', (e) => {
        tx = e.clientX; ty = e.clientY;
        document.body.classList.add('has-pointer');
        document.body.classList.remove('keyboard-nav');
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
    });
    // touch: remember last touch point for the ending light
    this.lastTouch = null;
    window.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (t) this.lastTouch = [t.clientX, t.clientY];
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) {
        this.lastTouch = [t.clientX, t.clientY];
        if (this._endingActive) this._moveEndingLight(t.clientX, t.clientY);
      }
    }, { passive: true });

    let lastFollowTick = performance.now();
    const follow = () => {
      lastFollowTick = performance.now();
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      requestAnimationFrame(follow);
    };
    if (fine) {
      requestAnimationFrame(follow);
      // cursor watchdog: hiding the native cursor is only legitimate while
      // the dot is actually being driven — if the loop stalls, give it back
      setInterval(() => {
        if (performance.now() - lastFollowTick > 2500) {
          document.body.classList.remove('has-pointer');
        }
      }, 1500);
    }
  }

  _whisper() {
    const w = document.getElementById('scroll-whisper');
    const gone = () => {
      w.classList.add('gone');
      window.removeEventListener('scroll', gone);
    };
    window.addEventListener('scroll', gone, { passive: true });
  }

  _moveEndingLight(px, py) {
    this.endingLight.style.left = px + 'px';
    this.endingLight.style.top = py + 'px';
  }

  // the cursor is the visitor's light: it cools and warms with the universe
  static CURSOR_TINTS = [
    ['prologue', '#E4B85C'], ['spark', '#C9C4FF'], ['afterglow', '#E8A05C'],
    ['dark-ages', '#8890B8'], ['first-light', '#F0A860'], ['web', '#BFD3F2'],
    ['home', '#FFD98C'], ['fading', '#D87850'], ['long-night', '#A04030'],
    ['last-star', '#E4B85C'],
  ];

  /** Called every frame with smoothed t. */
  update(t) {
    // title lockup: fades out across the prologue
    const titleAlpha = Math.max(0, 1 - t / 0.035);
    this.titleEl.style.opacity = titleAlpha.toFixed(3);
    this.titleEl.style.visibility = titleAlpha <= 0 ? 'hidden' : 'visible';

    // year readout
    const readout = yearReadout(t);
    if (readout !== this._lastReadout) {
      this._lastReadout = readout;
      this.readoutEl.textContent = readout;
    }

    // active epoch + index state
    const epoch = epochAt(t);
    if (epoch !== this.activeEpoch) {
      if (this.activeEpoch) {
        const prev = this.indexButtons.get(this.activeEpoch.id);
        if (prev) prev.setAttribute('aria-current', 'false');
      }
      const cur = this.indexButtons.get(epoch.id);
      if (cur) cur.setAttribute('aria-current', 'true');
      this.activeEpoch = epoch;
      const tint = UI.CURSOR_TINTS.find(([id]) => id === epoch.id);
      if (tint) document.getElementById('cursor').style.background = tint[1];
    }

    // epoch text visibility + staged caption reveals within the epoch
    for (const [id, el] of this.epochEls) {
      const e = EPOCHS.find((x) => x.id === id);
      const [t0, t1] = e.range;
      const span = t1 - t0;
      // text lives in the middle of the epoch: enters at 12%, leaves at 92%
      const inWindow = t >= t0 + span * 0.12 && t <= t0 + span * 0.92;
      el.classList.toggle('visible', inWindow);
      if (inWindow) {
        const local = (t - t0) / span;
        const captions = el.querySelectorAll('.caption');
        captions.forEach((c, i) => {
          const at = 0.2 + (i * 0.55) / Math.max(1, captions.length);
          c.classList.toggle('on', local >= at);
        });
      }
    }

    // ending: after extinction, credits + the last light for non-pointer users
    const ended = t >= EXTINCTION_T + 0.015;
    this.creditsEl.classList.toggle('visible', ended);
    document.body.classList.toggle('after-extinction', ended);
    // whose light survives: the cursor dot if a pointer has been seen,
    // otherwise the ending ember (touch: at the finger; keyboard: by the line)
    const pointerSeen = document.body.classList.contains('has-pointer');
    if (ended && !this._endingActive) {
      this._endingActive = true;
      if (!pointerSeen) {
        // fallback seat: beside the closing line on desktop, above it on mobile
        const fallbackY = innerWidth <= 768 ? innerHeight * 0.3 : innerHeight * 0.46;
        const [px, py] = this.lastTouch || [innerWidth * 0.5, fallbackY];
        this._moveEndingLight(px, py);
        this.endingLight.hidden = false;
      }
    } else if (!ended && this._endingActive) {
      this._endingActive = false;
      this.endingLight.hidden = true;
    }
  }
}
