import json, re
from typing import Dict, List, Tuple
from .json_utils import try_parse_json_maybe_embedded
from .providers.base import LLMProvider


def _clamp01(x: float) -> float:
    x = float(x)
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def llm_adjacency_expansions(provider: LLMProvider, prompt: str, tokens: List[str]) -> Dict[str, List[Tuple[str,str,float]]]:
    """
    Ask the LLM for exactly two adjacency expansions per token: semantic + associative.
    Returns {token: [(text,type,weight), (text,type,weight)]}
    """
    # Filter tokens we actually want to expand (skip pure punctuation)
    tok_list = [t for t in tokens if re.search(r"[A-Za-z0-9]", t)]
    user = json.dumps({
        "task": "adjacency_expansions",
        "prompt": prompt,
        "tokens": tok_list,
        "k": 2,
        "instructions": "For each token, output 'semantic' and 'associative' expansions with weights in [0,1]. JSON only."
    })
    sys = "You are an assistant that returns STRICT JSON for programmatic use. Do not include chain-of-thought. No commentary."
    text = provider.chat([{"role":"system","content": sys}, {"role":"user","content": user}], temperature=0.1, max_tokens=1000)
    data = try_parse_json_maybe_embedded(text)
    out: Dict[str, List[Tuple[str,str,float]]] = {}
    for item in data.get("expansions", []):
        tok = item.get("token")
        sem = item.get("semantic", {})
        asc = item.get("associative", {})
        sem_t = str(sem.get("text","" )).strip() or f"{tok}_sem"
        asc_t = str(asc.get("text","" )).strip() or f"{tok}_assoc"
        sem_w = _clamp01(float(sem.get("weight", 0.8)))
        asc_w = _clamp01(float(asc.get("weight", 0.6)))
        out[tok] = [(sem_t, "semantic", sem_w), (asc_t, "associative", asc_w)]
    # Ensure every token has two items
    for t in tokens:
        if t not in out:
            out[t] = [(f"{t}_sem", "semantic", 0.8), (f"{t}_assoc", "associative", 0.6)]
    return out


def llm_select_glyph_indices(provider: LLMProvider, prompt: str, items: List[str], categories: List[Dict], bank_size: int) -> Dict[str, int]:
    """
    Ask LLM to pick a glyph index 0..bank_size-1 for each item, using category semantics.
    Returns {text: index}
    """
    # Only pass lightweight category metadata, not the actual glyph chars.
    cat_info = [{"name": c["name"], "semantics": c["semantics"], "start": c["start"], "end": c["end"]} for c in categories]
    user = json.dumps({
        "task": "glyph_selection",
        "prompt": prompt,
        "tokens": items,
        "categories": cat_info,
        "bank_size": bank_size,
        "instructions": "Pick an integer index for each token that best matches category semantics; JSON only."
    })
    sys = "Return STRICT JSON only. No explanations."
    text = provider.chat([{"role":"system","content": sys}, {"role":"user","content": user}], temperature=0.0, max_tokens=1000)
    data = try_parse_json_maybe_embedded(text)
    out: Dict[str, int] = {}
    for obj in data.get("glyph_indices", []):
        tok = obj.get("token")
        idx = int(obj.get("index", 0))
        if tok is None: continue
        if idx < 0: idx = 0
        if idx >= bank_size: idx = bank_size - 1
        out[tok] = idx
    # Default any missing ones deterministically
    for it in items:
        if it not in out:
            out[it] = abs(hash(it)) % max(1, bank_size)
    return out


def llm_recursive_refine_answer(provider: LLMProvider, prompt: str, expansions: Dict[str, List[Tuple[str,str,float]]], passes: int = 2) -> str:
    """
    Multi-pass refinement; each pass returns the FULL answer (no chain-of-thought).
    """
    exp_list = []
    for tok, pairs in expansions.items():
        exp_list.append({"token": tok, "semantic": pairs[0][0], "associative": pairs[1][0]})
    prev = ""
    for _ in range(max(1, int(passes))):
        user = json.dumps({
            "task": "refine_answer",
            "prompt": prompt,
            "previous_answer": prev,
            "expansions": exp_list,
            "instructions": "Return the FINAL answer only; incorporate expansions; keep it clear and useful."
        })
        sys = "You produce a crisp, user-facing answer. Do NOT reveal internal reasoning. Output is plain text, no JSON."
        prev = provider.chat([{"role":"system","content": sys}, {"role":"user","content": user}], temperature=0.2, max_tokens=800)
    return prev.strip()
