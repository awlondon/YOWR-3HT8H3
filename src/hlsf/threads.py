from typing import Dict, List

from .simple_graph import Graph, connected_components


def threads_from_attention(G: Graph, attention: Dict[str, float], min_weight: float = 1e-6) -> List[Dict]:
    H = G.copy()
    drop = [n for n, a in attention.items() if a < min_weight]
    H.remove_nodes_from(drop)
    threads = []
    for c, comp in enumerate(connected_components(H)):
        nodes = list(comp)
        score = float(sum(attention.get(n, 0.0) for n in nodes))
        tokens = [n for n in nodes if H.get_node(n).get("kind") == "token"]
        exps = [n for n in nodes if H.get_node(n).get("kind") == "exp"]
        threads.append({"id": f"th{c}", "score": score, "tokens": tokens, "expansions": exps})
    threads.sort(key=lambda t: t["score"], reverse=True)
    return threads
