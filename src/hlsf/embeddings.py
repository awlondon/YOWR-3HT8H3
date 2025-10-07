import hashlib
import math
from typing import Dict, Iterable, List


def _hash_to_unit_vec(text: str, dim: int) -> List[float]:
    data = hashlib.sha256(text.encode("utf-8")).digest()
    ints: List[int] = []
    for i in range(0, len(data), 4):
        chunk = data[i:i+4]
        if len(chunk) < 4:
            chunk = chunk + b"\x00" * (4 - len(chunk))
        val = int.from_bytes(chunk, "big")
        ints.append(val % 2001)
    while len(ints) < dim:
        ints.extend(ints)
    ints = ints[:dim]
    vec = [(v / 1000.0) - 1.0 for v in ints]
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0.0:
        return [0.0 for _ in range(dim)]
    return [x / norm for x in vec]


def embeddings_for_tokens(tokens: Iterable[str], dim: int) -> Dict[str, List[float]]:
    return {t: _hash_to_unit_vec(t, dim) for t in tokens}


def vector_numbers(values: Dict[str, float]) -> Dict[str, float]:
    if not values:
        return {}
    xs = list(values.values())
    lo = min(xs)
    hi = max(xs)
    if abs(hi - lo) < 1e-9:
        return {k: 50.0 for k in values}
    span = hi - lo
    scaled = {k: ((v - lo) / span) * 99.9 for k, v in values.items()}
    return {k: round(v * 10) / 10.0 for k, v in scaled.items()}


def _dot(a: List[float], b: List[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def scalar_projection_along(tokens: Iterable[str], dim: int, seed: int):
    dir_vec = _hash_to_unit_vec(f"SEED::{seed}::HLSF", dim)
    embs = embeddings_for_tokens(tokens, dim)
    scores = {t: float(_dot(vec, dir_vec)) for t, vec in embs.items()}
    return scores, embs
