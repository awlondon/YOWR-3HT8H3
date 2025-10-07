from dataclasses import dataclass
from typing import Dict, List, Tuple
import math

from .simple_graph import Graph


@dataclass
class NodeInfo:
    id: str
    text: str
    glyph: str
    v: float
    pos: Tuple[float, float]
    charge: float


@dataclass
class ExpansionInfo:
    id: str
    of: str
    type: str
    text: str
    glyph: str
    v: float
    pos: Tuple[float, float]
    weight: float


@dataclass
class TriangleInfo:
    id: str
    nodes: Tuple[str, str, str]
    hsv: Tuple[float, float, float]
    alpha: float


def cosine(a: List[float], b: List[float]) -> float:
    if not a or not b:
        return 0.0
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)


def build_graph(
    tokens: List[str],
    glyphs_map: Dict[str, str],
    vnums: Dict[str, float],
    positions: Dict[str, Tuple[float, float]],
    embs: Dict[str, List[float]],
    expansions: Dict[str, List[Tuple[str, str, float]]],
    glyphs_for_str: Dict[str, str],
):
    G = Graph()
    nodes: List[NodeInfo] = []
    exps: List[ExpansionInfo] = []
    tris: List[TriangleInfo] = []
    edges: List[Tuple[str, str, float]] = []

    for i, t in enumerate(tokens):
        tid = f"t{i}"
        v = vnums[t]
        charge = (v - 50.0) / 50.0
        node = NodeInfo(id=tid, text=t, glyph=glyphs_map[t], v=v, pos=positions[t], charge=charge)
        nodes.append(node)
        G.add_node(tid, charge=charge, pos=node.pos, v=v, kind="token", text=t)

    for i, t in enumerate(tokens):
        tid = f"t{i}"
        E = expansions.get(t, [])
        if len(E) < 2:
            continue
        (e1_text, e1_type, w1), (e2_text, e2_type, w2) = E[:2]
        e1_id = f"{tid}_e1"; e2_id = f"{tid}_e2"
        for eid, etxt, etype, w in [(e1_id, e1_text, e1_type, w1), (e2_id, e2_text, e2_type, w2)]:
            if etxt not in positions:
                px, py = positions[t]
                positions[etxt] = (px + 0.05, py - 0.05)
            v = vnums.get(etxt, vnums[t])
            exp = ExpansionInfo(
                id=eid, of=tid, type=etype, text=etxt,
                glyph=glyphs_for_str.get(etxt, glyphs_map[t]), v=v,
                pos=positions[etxt], weight=w,
            )
            exps.append(exp)
            G.add_node(eid, charge=(v-50)/50, pos=exp.pos, v=v, kind="exp", text=etxt, weight=w)
            sim = cosine(embs.get(t, []), embs.get(etxt, embs.get(t, [])))
            dx = positions[t][0] - exp.pos[0]; dy = positions[t][1] - exp.pos[1]
            dist = math.sqrt(dx*dx + dy*dy)
            k = sim / (1.0 + dist)
            edges.append((tid, eid, k))
            G.add_edge(tid, eid, weight=k)

        h = 360.0 * (vnums[t] / 99.9)
        s = vnums.get(e1_text, vnums[t]) / 99.9
        v = vnums.get(e2_text, vnums[t]) / 99.9
        alpha = 0.01 + 0.99 * ((w1 + w2) / 2.0)
        tris.append(TriangleInfo(id=f"d{i}", nodes=(tid, e1_id, e2_id), hsv=(h, s, v), alpha=alpha))

    return nodes, exps, tris, edges, G
