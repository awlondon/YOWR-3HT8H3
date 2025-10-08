import { clamp } from './math.js';

export function quantizeTokens(tokens) {
  // Step 11: Measure global maximum weight to determine scaling.
  const maxWeight = tokens.reduce((m, t) => Math.max(m, t.weight), 0) || 1;
  // Step 12: Normalize weights into a 0..1 range for scoring.
  const normalized = tokens.map((token) => ({
    ...token,
    norm: clamp(token.weight / maxWeight)
  }));
  // Step 13: Compute energy scores representing conceptual activation.
  for (const item of normalized) {
    item.energy = Math.pow(item.norm, 0.75);
  }
  // Step 14: Assign quantized bins for discrete visualization radii.
  const bins = 5;
  for (const item of normalized) {
    item.bin = Math.max(1, Math.round(item.energy * bins));
  }
  // Step 15: Map quantized bins to node radius values in layout space.
  for (const item of normalized) {
    item.radius = 16 + item.bin * 6;
  }
  // Step 16: Produce quantized intensity values for color mapping.
  for (const item of normalized) {
    item.intensity = clamp(item.energy * 1.25, 0, 1);
  }
  // Step 17: Emit quantized tokens ready for glyph mapping.
  return normalized;
}
