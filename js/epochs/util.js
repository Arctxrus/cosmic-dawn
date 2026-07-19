// Shared shader chunks + helpers for epoch modules.

export const GLSL_NOISE = /* glsl */ `
  // hash + value noise + fbm (cheap, good enough for gas)
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(17.1, 9.3);
      a *= 0.55;
    }
    return v;
  }
  // 3D curl-ish swirl offset used by pointer interactions
  vec3 swirl(vec3 p, vec3 center, float radius, float strength) {
    vec3 d = p - center;
    float r = length(d);
    float f = exp(-r * r / (radius * radius)) * strength;
    return vec3(-d.y, d.x, 0.0) * f;
  }
`;

/** Fraction 0..1 of t within [t0,t1], clamped. */
export function localT(t, range) {
  return Math.min(1, Math.max(0, (t - range[0]) / (range[1] - range[0])));
}

/** Smooth fade in/out envelope across a range with given edge fractions. */
export function envelope(l, inEdge = 0.15, outEdge = 0.15) {
  const a = Math.min(1, l / inEdge);
  const b = Math.min(1, (1 - l) / outEdge);
  const s = (x) => x * x * (3 - 2 * x);
  return s(Math.max(0, Math.min(a, b)));
}

export function randDir() {
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  return [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)];
}
