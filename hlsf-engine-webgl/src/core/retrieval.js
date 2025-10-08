export function buildRetrieval(layout) {
  // Step 51: Index tokens by glyph for quick inspector lookup.
  const glyphIndex = new Map();
  for (const token of layout.tokens) {
    glyphIndex.set(token.glyph, token.id);
  }
  // Step 52: Create adjacency lists based on edge relationships.
  const adjacency = new Map();
  for (const edge of layout.edges) {
    if (!adjacency.has(edge.a)) adjacency.set(edge.a, new Set());
    adjacency.get(edge.a).add(edge.b);
  }
  // Step 53: Establish retrieval ranking using expansion weights.
  const ranking = layout.expansions
    .slice()
    .sort((a, b) => b.v - a.v)
    .map((exp) => ({ token: exp.of, expansion: exp.id, value: exp.v }));
  // Step 54: Build retrieval summary.
  const summary = ranking.slice(0, 5).map((r) => `${r.expansion}:${r.value.toFixed(2)}`);
  // Step 55: Return retrieval payload.
  return { glyphIndex, adjacency, ranking, summary };
}
