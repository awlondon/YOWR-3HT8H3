from typing import Dict, Tuple, List


def pca_2d(embs: Dict[str, List[float]]) -> Dict[str, Tuple[float, float]]:
    coords: Dict[str, Tuple[float, float]] = {}
    for key, vec in embs.items():
        x = float(vec[0]) if vec else 0.0
        y = float(vec[1]) if len(vec) > 1 else (float(vec[0]) * 0.5 if vec else 0.0)
        # Clamp to [-1, 1] for stability
        x = max(-1.0, min(1.0, x))
        y = max(-1.0, min(1.0, y))
        coords[key] = (x, y)
    return coords
