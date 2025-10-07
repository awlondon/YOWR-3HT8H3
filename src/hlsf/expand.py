from typing import List, Tuple
import re

_ASSOC = {
    "ai": ["model", "learning"],
    "engine": ["pipeline", "runtime"],
    "space": ["field", "vector"],
    "field": ["potential", "charge"],
    "vector": ["magnitude", "direction"],
    "token": ["glyph", "embedding"],
    "prompt": ["intent", "context"],
}


def _stem_like(t: str) -> str:
    if len(t) <= 3: return t
    for suf in ("ing", "ed", "es", "s"):
        if t.endswith(suf) and len(t) - len(suf) >= 3:
            return t[: -len(suf)]
    return t


def expansions_for_token(tok: str) -> List[Tuple[str, str, float]]:
    """
    Offline fallback: return two expansions (text, type, weight).
    """
    base = _stem_like(tok.lower()) if re.match(r"^[A-Za-z]+$", tok) else tok
    e1 = base if base != tok else f"{tok}_sem"
    assoc = _ASSOC.get(base, None)
    e2 = assoc[0] if assoc else f"{base}_assoc"
    return [(e1, "semantic", 0.85), (e2, "associative", 0.65)]
