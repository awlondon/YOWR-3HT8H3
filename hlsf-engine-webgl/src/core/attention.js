export function computeAttention(graph) {
  // Step 61: Initialize attention map for each node.
  const attention = new Map(graph.nodes.map((node) => [node.id, 0]));
  // Step 62: Increase attention for nodes with short edges (high cohesion).
  graph.edges.forEach((edge, index) => {
    const length = graph.lengths[index] || 1;
    const contribution = 1 / (1 + length / 120);
    attention.set(edge.a, (attention.get(edge.a) || 0) + contribution);
    attention.set(edge.b, (attention.get(edge.b) || 0) + contribution);
  });
  // Step 63: Normalize attention scores.
  const max = Math.max(...attention.values(), 1);
  for (const [key, value] of attention) {
    attention.set(key, value / max);
  }
  // Step 64: Extract focus list sorted by attention value.
  const focus = [...attention.entries()].sort((a, b) => b[1] - a[1]);
  // Step 65: Return attention payload.
  return { attention, focus };
}
