import { hsvToRgb } from './math.js';

export function assignColors(tokens, expansions) {
  // Step 31: Determine global hue offsets from token ordering.
  const baseHue = (tokens.length % 12) / 12;
  // Step 32: Map tokens to HSV colors using energy modulation.
  const coloredTokens = tokens.map((token, index) => {
    const hue = (baseHue + index / Math.max(1, tokens.length)) % 1;
    const hsv = [hue, 0.6 + token.intensity * 0.3, 0.75 + token.intensity * 0.25];
    const rgb = hsvToRgb(hsv);
    return { ...token, hsv, rgb, alpha: 0.9 };
  });
  // Step 33: Map expansions to derived colors that echo their parents.
  const tokenMap = new Map(coloredTokens.map((t) => [t.id, t]));
  const coloredExpansions = expansions.map((exp, index) => {
    const parent = tokenMap.get(exp.of);
    const hue = (parent?.hsv?.[0] ?? baseHue + index * 0.01) % 1;
    const saturation = 0.45 + (parent?.intensity ?? 0.5) * 0.4;
    const value = 0.6 + (parent?.intensity ?? 0.5) * 0.3;
    const hsv = [hue, saturation, value];
    const rgb = hsvToRgb(hsv);
    return { ...exp, hsv, rgb, alpha: 0.75 };
  });
  // Step 34: Create triangle color descriptors from top expansions.
  const triangles = [];
  for (let i = 0; i < coloredExpansions.length; i += 3) {
    const slice = coloredExpansions.slice(i, i + 3);
    if (slice.length === 3) {
      const id = `tri-${i / 3}`;
      // Step 35: Average HSV values to produce region-level hues.
      const avgHue = slice.reduce((acc, s) => acc + s.hsv[0], 0) / 3;
      const avgSat = slice.reduce((acc, s) => acc + s.hsv[1], 0) / 3;
      const avgVal = slice.reduce((acc, s) => acc + s.hsv[2], 0) / 3;
      const hsv = [avgHue, avgSat, avgVal];
      const rgb = hsvToRgb(hsv);
      triangles.push({ id, nodes: slice.map((s) => s.of), hsv, rgb, alpha: 0.35 });
    }
  }
  // Step 36: Blend base color statistics for telemetry use.
  const colorStats = {
    meanHue: coloredTokens.reduce((acc, t) => acc + t.hsv[0], 0) / Math.max(1, coloredTokens.length),
    meanValue: coloredTokens.reduce((acc, t) => acc + t.hsv[2], 0) / Math.max(1, coloredTokens.length)
  };
  // Step 37: Return color enhanced datasets for downstream layout.
  return { tokens: coloredTokens, expansions: coloredExpansions, triangles, colorStats };
}
