// Step 100: Provide deterministic mathematical helpers for the cognition pipeline.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

export function vec2(x = 0, y = 0) {
  return { x, y };
}

export function length(v) {
  return Math.hypot(v.x, v.y);
}

export function normalize(v) {
  const len = length(v) || 1;
  return vec2(v.x / len, v.y / len);
}

export function hsvToRgb([h, s, v]) {
  const f = (n) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  return [f(5), f(3), f(1)];
}
