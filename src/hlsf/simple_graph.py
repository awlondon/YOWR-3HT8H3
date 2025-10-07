from __future__ import annotations
from typing import Dict, Iterable, Iterator, List, Any, Set


class NodeView:
    def __init__(self, mapping: Dict[str, Dict[str, Any]]):
        self._mapping = mapping

    def __iter__(self) -> Iterator[str]:
        return iter(self._mapping)

    def __getitem__(self, item: str) -> Dict[str, Any]:
        return self._mapping[item]

    def items(self):
        return self._mapping.items()


class Graph:
    def __init__(self):
        self._nodes: Dict[str, Dict[str, Any]] = {}
        self._adj: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def add_node(self, node_id: str, **attrs: Any) -> None:
        data = self._nodes.get(node_id, {}).copy()
        data.update(attrs)
        self._nodes[node_id] = data
        self._adj.setdefault(node_id, {})

    def add_edge(self, u: str, v: str, **attrs: Any) -> None:
        self.add_node(u)
        self.add_node(v)
        data = attrs.copy()
        self._adj[u][v] = data
        self._adj[v][u] = data

    def nodes(self) -> Iterator[str]:
        return iter(self._nodes.keys())

    @property
    def nodes_view(self) -> NodeView:
        return NodeView(self._nodes)

    def edges(self, data: bool = False) -> Iterator[Tuple[str, str, Dict[str, Any]]]:
        seen: Set[Tuple[str, str]] = set()
        for u, nbrs in self._adj.items():
            for v, attrs in nbrs.items():
                key = (u, v) if u <= v else (v, u)
                if key in seen:
                    continue
                seen.add(key)
                if data:
                    yield (u, v, attrs.copy())
                else:
                    yield (u, v, {})

    def copy(self) -> "Graph":
        g = Graph()
        for node, attrs in self._nodes.items():
            g.add_node(node, **attrs)
        for u, v, attrs in self.edges(data=True):
            g.add_edge(u, v, **attrs)
        return g

    def remove_nodes_from(self, nodes: Iterable[str]) -> None:
        for n in list(nodes):
            if n in self._adj:
                for neigh in list(self._adj[n].keys()):
                    self._adj[neigh].pop(n, None)
                self._adj.pop(n, None)
            self._nodes.pop(n, None)

    def neighbors(self, node: str) -> Iterator[str]:
        return iter(self._adj.get(node, {}).keys())

    def get_node(self, node: str) -> Dict[str, Any]:
        return self._nodes.get(node, {})

    @property
    def adjacency(self) -> Dict[str, Dict[str, Dict[str, Any]]]:
        return self._adj

    def __contains__(self, node: str) -> bool:
        return node in self._nodes

    def __len__(self) -> int:
        return len(self._nodes)


def connected_components(graph: Graph) -> Iterator[List[str]]:
    seen: Set[str] = set()
    for node in graph.nodes():
        if node in seen:
            continue
        stack = [node]
        comp: List[str] = []
        while stack:
            cur = stack.pop()
            if cur in seen or cur not in graph:
                continue
            seen.add(cur)
            comp.append(cur)
            for nb in graph.neighbors(cur):
                if nb not in seen:
                    stack.append(nb)
        if comp:
            yield comp
