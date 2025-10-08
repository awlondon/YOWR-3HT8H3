export function buildGraph(layout) {
  // Step 56: Create graph nodes from tokens and expansions.
  const nodes = [...layout.tokens, ...layout.expansions].map((item) => ({ id: item.id, pos: item.pos }));
  // Step 57: Encode edges as adjacency pairs with weights.
  const edges = layout.edges.map((edge) => ({ id: `${edge.a}->${edge.b}`, a: edge.a, b: edge.b, k: edge.k }));
  // Step 58: Provide lookup tables for nodes and edges.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  // Step 59: Compute edge lengths for quality inspection.
  const lengths = edges.map((edge) => {
    const a = nodeById.get(edge.a)?.pos ?? [0, 0];
    const b = nodeById.get(edge.b)?.pos ?? [0, 0];
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.hypot(dx, dy);
  });
  // Step 60: Return graph structure with derived metrics.
  return { nodes, edges, nodeById, edgeById, lengths };
}
