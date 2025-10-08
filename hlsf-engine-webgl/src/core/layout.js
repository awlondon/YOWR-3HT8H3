import { vec2, normalize, lerp } from './math.js';

export function layoutNodes(tokens, expansions) {
  // Step 38: Initialize layout anchors on a golden-angle spiral.
  const positions = tokens.map((token, index) => {
    const angle = index * 2.39996323;
    const radius = 40 + Math.sqrt(index) * 28;
    return { token, pos: vec2(Math.cos(angle) * radius, Math.sin(angle) * radius) };
  });
  // Step 39: Stabilize anchors by applying centroid damping.
  const centroid = positions.reduce((acc, p) => vec2(acc.x + p.pos.x, acc.y + p.pos.y), vec2());
  centroid.x /= Math.max(1, positions.length);
  centroid.y /= Math.max(1, positions.length);
  for (const entry of positions) {
    entry.pos.x -= centroid.x;
    entry.pos.y -= centroid.y;
  }
  // Step 40: Attach layout coordinates to tokens.
  const tokenLayouts = positions.map(({ token, pos }) => ({ ...token, pos: [pos.x, pos.y] }));
  // Step 41: Scatter expansions around their parent nodes.
  const expansionLayouts = expansions.map((exp, index) => {
    const parent = tokenLayouts.find((t) => t.id === exp.of) ?? tokenLayouts[index % tokenLayouts.length];
    const direction = normalize(vec2(Math.sin(index), Math.cos(index)));
    const distance = (parent?.radius ?? 24) * 1.8;
    const pos = vec2(parent.pos[0] + direction.x * distance, parent.pos[1] + direction.y * distance);
    return { ...exp, pos: [pos.x, pos.y] };
  });
  // Step 42: Generate edge list from expansions to parents.
  const edges = expansionLayouts.map((exp) => ({ a: exp.of, b: exp.id, k: exp.v }));
  // Step 43: Compose triangles referencing positioned nodes.
  const triangles = [];
  for (let i = 0; i < expansionLayouts.length; i += 3) {
    const chunk = expansionLayouts.slice(i, i + 3);
    if (chunk.length === 3) {
      triangles.push({ id: `tri-${i / 3}`, nodes: chunk.map((c) => c.of) });
    }
  }
  // Step 44: Relax layout with a single iteration spring towards centroid.
  const relax = (items, strength = 0.05) => {
    for (const item of items) {
      item.pos = [lerp(item.pos[0], 0, strength), lerp(item.pos[1], 0, strength)];
    }
  };
  relax(tokenLayouts, 0.03);
  relax(expansionLayouts, 0.06);
  // Step 45: Compute layout bounds for camera fitting.
  const bounds = tokenLayouts.reduce((acc, t) => ({
    minX: Math.min(acc.minX, t.pos[0] - t.radius),
    maxX: Math.max(acc.maxX, t.pos[0] + t.radius),
    minY: Math.min(acc.minY, t.pos[1] - t.radius),
    maxY: Math.max(acc.maxY, t.pos[1] + t.radius)
  }), { minX: 0, maxX: 0, minY: 0, maxY: 0 });
  // Step 46: Return full layout set for region processing.
  return { tokens: tokenLayouts, expansions: expansionLayouts, edges, triangles, bounds };
}
