from typing import Dict, Iterable

from .simple_graph import Graph


def random_walk_with_restart(G: Graph, seeds: Iterable[str], r: float = 0.15, tol: float = 1e-8, max_iter: int = 10000) -> Dict[str, float]:
    nodes = list(G.nodes())
    n = len(nodes)
    if n == 0:
        return {}
    idx = {node: i for i, node in enumerate(nodes)}
    transitions = {node: {} for node in nodes}
    for u in nodes:
        neighbors = G.adjacency.get(u, {})
        total = 0.0
        for v, attrs in neighbors.items():
            w = float(attrs.get("weight", 1.0))
            transitions[u][v] = w
            total += w
        if total > 0.0:
            for v in list(transitions[u].keys()):
                transitions[u][v] /= total

    p0 = [0.0] * n
    seed_ids = [idx[s] for s in seeds if s in idx]
    if seed_ids:
        for i in seed_ids:
            p0[i] = 1.0 / len(seed_ids)
    else:
        for i in range(n):
            p0[i] = 1.0 / n
    p = p0[:]
    for _ in range(max_iter):
        p_next = [r * val for val in p0]
        for u in nodes:
            for v, prob in transitions[u].items():
                p_next[idx[v]] += (1.0 - r) * prob * p[idx[u]]
        diff = sum(abs(a - b) for a, b in zip(p_next, p))
        p = p_next
        if diff < tol:
            break
    return {nodes[i]: float(p[i]) for i in range(n)}
