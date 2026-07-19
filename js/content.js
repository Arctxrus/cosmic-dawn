// Single source of truth: epochs, ranges, copy, time mapping, still-mode palettes.
// All timeline values t are 0..1 across the full scroll.

export const SITE = {
  title: 'UNTIL THE LAST STAR',
  titleLines: ['UNTIL', 'THE LAST', 'STAR'], // middle line set italic
  subtitle: 'THE WHOLE OF TIME, COMPRESSED INTO ONE SCROLL',
  credits: [
    { label: 'MADE BY ZAYN', href: null },
    { label: 'CODE', href: 'https://github.com/' },
    { label: 'PORTFOLIO', href: '../' },
  ],
};

export const EPOCHS = [
  {
    id: 'prologue',
    label: null, // not in the index
    range: [0.0, 0.04],
    headline: null,
    captions: [],
    // still-mode backdrop: [top, mid, bottom] gradient stops + star tint
    still: { grad: ['#10122A', '#0C0E20', '#08070F'], star: '#9BA4C8', density: 0.5 },
  },
  {
    id: 'spark',
    label: 'THE SPARK',
    range: [0.04, 0.12],
    time: 'T + 10⁻³² SECONDS',
    headline: 'Everything, at once',
    captions: [
      'In less than a billionth of a billionth of a second, space itself inflates.',
      'Every structure that will ever exist begins as a flicker in this light.',
    ],
    still: { grad: ['#2A2450', '#4A3C7A', '#0E0B1E'], star: '#C9C4FF', density: 1.0 },
  },
  {
    id: 'afterglow',
    label: 'THE AFTERGLOW',
    range: [0.12, 0.21],
    time: 'T + 380,000 YEARS',
    headline: 'The fog lifts',
    captions: [
      '380,000 years after the beginning, the plasma cools to 3,000 degrees.',
      'Light travels freely for the first time. Space becomes transparent.',
    ],
    still: { grad: ['#3A2110', '#7A4420', '#120A06'], star: '#E0A46A', density: 0.4 },
  },
  {
    id: 'dark-ages',
    label: 'THE DARK AGES',
    range: [0.21, 0.29],
    time: 'T + 100,000,000 YEARS',
    headline: 'A hundred million years of night',
    captions: [
      'No stars. No light but the fading afterglow.',
      'In the dark, gravity is patiently gathering hydrogen into clouds.',
    ],
    still: { grad: ['#0B0D1C', '#141731', '#07080F'], star: '#3A4066', density: 0.25 },
  },
  {
    id: 'first-light',
    label: 'FIRST LIGHT',
    range: [0.29, 0.41],
    time: 'T + 300,000,000 YEARS',
    headline: 'A star is lit',
    captions: [
      'A cloud collapses under its own weight until its core ignites.',
      'The first starlight in the history of the universe.',
      'It will not be alone for long.',
    ],
    still: { grad: ['#1C0F06', '#B06A30', '#0A0705'], star: '#F0A860', density: 0.7 },
  },
  {
    id: 'web',
    label: 'THE WEB',
    range: [0.41, 0.53],
    time: 'T + 1,000,000,000 YEARS',
    headline: 'Structure, everywhere',
    captions: [
      'Galaxies condense along filaments of dark matter, millions of light-years long.',
      'Dying stars detonate, seeding the web with carbon, oxygen, iron.',
      'The raw material of worlds — and of you.',
    ],
    still: { grad: ['#0D1226', '#26325C', '#080A14'], star: '#BFD3F2', density: 1.0 },
  },
  {
    id: 'home',
    label: 'HOME',
    range: [0.53, 0.68],
    time: 'NOW',
    headline: 'You are here',
    captions: [
      'One arm of one galaxy. One yellow star among four hundred billion.',
      'Third planet out: everyone you have ever known.',
      'You are here. Thirteen point eight billion years in.',
    ],
    still: { grad: ['#121A2E', '#3A4C74', '#0A0D16'], star: '#FFD98C', density: 1.0 },
  },
  {
    id: 'fading',
    label: 'THE FADING',
    range: [0.68, 0.79],
    time: 'T + 19,000,000,000 YEARS',
    headline: 'The lights go down slowly',
    captions: [
      'Five billion years from now, the Sun swells, reddens, and lets go.',
      'One by one, the galaxies stop making stars.',
      'Nothing you do can hold them.',
    ],
    still: { grad: ['#1E0B08', '#6E2418', '#0C0605'], star: '#C25538', density: 0.5 },
  },
  {
    id: 'long-night',
    label: 'THE LONG NIGHT',
    range: [0.79, 0.90],
    time: 'T + 10¹² YEARS',
    headline: 'Almost nothing',
    captions: [
      'A trillion years in, only the slowest-burning dwarf stars remain.',
      'A black hole bends the last starlight around itself.',
    ],
    still: { grad: ['#0A0608', '#1E0C0E', '#060406'], star: '#772019', density: 0.15 },
  },
  {
    id: 'last-star',
    label: 'THE LAST STAR',
    range: [0.90, 1.0],
    time: 'T + 10¹⁴ YEARS',
    headline: 'The last star',
    captions: [
      'It burned for longer than every star before it combined.',
      'The last light in the universe is yours.',
    ],
    still: { grad: ['#0A0505', '#120707', '#040303'], star: '#8A2A1D', density: 0.05 },
  },
];

// The moment within last-star at which the star dies (timeline t).
export const EXTINCTION_T = 0.96;
// HOME dwell window where the counter reads NOW.
export const NOW_WINDOW = [0.60, 0.68];

// ---------------------------------------------------------------------------
// Year readout mapping: piecewise anchors, interpolated in log space.
// Each anchor: [t, value, unit] — unit 'sec' | 'yr'. Between anchors we
// interpolate the exponent, then format. Special zones: NOW hold, post-
// extinction race (the numbers outliving the light).
// ---------------------------------------------------------------------------
const ANCHORS = [
  [0.04, 1e-32, 'sec'],
  [0.08, 1e-6, 'sec'],
  [0.12, 3.8e5, 'yr'],
  [0.21, 1e8, 'yr'],
  [0.29, 3e8, 'yr'],
  [0.41, 1e9, 'yr'],
  [0.53, 9.2e9, 'yr'],
  [0.60, 1.38e10, 'yr'], // NOW
  [0.68, 1.38e10, 'yr'], // NOW hold
  [0.74, 1.9e10, 'yr'],
  [0.79, 1e12, 'yr'],
  [0.90, 5e13, 'yr'],
  [EXTINCTION_T, 1e14, 'yr'],
  [0.975, 1e18, 'yr'],
  [0.99, 1e40, 'yr'],
  [1.0, 1e100, 'yr'],
];

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function superscript(n) {
  return String(n).split('').map((c) => SUP[c] || c).join('');
}

function formatValue(v, unit) {
  const u = unit === 'sec' ? 'SECONDS' : 'YEARS';
  if (v < 1e-3 || v >= 1e12) {
    const exp = Math.round(Math.log10(v));
    return `T + 10${superscript(exp)} ${u}`;
  }
  if (v >= 1e9) {
    // keep billions readable with full digits — the length is the point
    const rounded = Math.round(v / 1e8) * 1e8;
    return `T + ${rounded.toLocaleString('en-US')} ${u}`;
  }
  const rounded = v >= 1e6 ? Math.round(v / 1e6) * 1e6 : Math.round(v);
  return `T + ${rounded.toLocaleString('en-US')} ${u}`;
}

export function yearReadout(t) {
  if (t < ANCHORS[0][0]) return 'T = 0';
  if (t >= NOW_WINDOW[0] && t <= NOW_WINDOW[1]) return 'NOW';
  const last = ANCHORS[ANCHORS.length - 1];
  if (t >= last[0]) return `T + 10${superscript(100)} YEARS`;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [t0, v0, u0] = ANCHORS[i];
    const [t1, v1, u1] = ANCHORS[i + 1];
    if (t >= t0 && t < t1) {
      const f = (t - t0) / (t1 - t0);
      // interpolate exponent in log space; if units differ, convert sec→yr boundary crudely
      const a = Math.log10(v0) + (Math.log10(u0 === u1 ? v1 : v1 * 3.15e7) - Math.log10(v0)) * f;
      const v = Math.pow(10, a);
      return formatValue(u0 === 'sec' && v >= 3.15e7 ? v / 3.15e7 : v, u0 === 'sec' && v >= 3.15e7 ? 'yr' : u0);
    }
  }
  return 'NOW';
}

export function epochAt(t) {
  for (let i = EPOCHS.length - 1; i >= 0; i--) {
    if (t >= EPOCHS[i].range[0]) return EPOCHS[i];
  }
  return EPOCHS[0];
}
