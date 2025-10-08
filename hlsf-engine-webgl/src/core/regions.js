export function deriveRegions(layout) {
  // Step 47: Group tokens into conceptual regions based on radius tiers.
  const groups = new Map();
  for (const token of layout.tokens) {
    const key = `tier-${token.bin}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(token);
  }
  // Step 48: Compute region centroids for annotation anchors.
  const regions = [...groups.entries()].map(([key, members], index) => {
    const cx = members.reduce((acc, m) => acc + m.pos[0], 0) / Math.max(1, members.length);
    const cy = members.reduce((acc, m) => acc + m.pos[1], 0) / Math.max(1, members.length);
    return { id: `reg-${index}`, key, members: members.map((m) => m.id), center: [cx, cy] };
  });
  // Step 49: Attach region metadata back to tokens for inspector view.
  const tokenRegions = new Map();
  for (const region of regions) {
    for (const member of region.members) {
      tokenRegions.set(member, region.id);
    }
  }
  // Step 50: Return annotated layout bundle.
  return { ...layout, regions, tokenRegions };
}
