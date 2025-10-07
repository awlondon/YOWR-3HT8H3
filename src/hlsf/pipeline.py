from typing import Dict, List, Tuple
import json
import os

from .settings import Settings
from .tokenize import tokenize
from .glyphs import build_or_load_glyph_bank
from .embeddings import scalar_projection_along, vector_numbers
from .expand import expansions_for_token
from .geometry import pca_2d
from .graphing import build_graph
from .attention import random_walk_with_restart
from .threads import threads_from_attention
from .generation import compose_answer
from .local_model import load_local_model, save_local_model, update_model
from .providers import make_provider
from .llm_tasks import llm_adjacency_expansions, llm_select_glyph_indices, llm_recursive_refine_answer


def run_hlsf(prompt: str, json_out: str, text_out: str, settings: Settings = Settings()):
    # 1-2: tokenize
    toks = tokenize(prompt)
    if not toks:
        raise ValueError("Empty prompt.")

    # Provider (optional)
    provider = None
    if settings.use_llm and (settings.llm_provider or settings.llm_api_key):
        provider = make_provider(settings.llm_provider, settings.llm_api_key, settings.llm_base_url, settings.llm_model, settings.request_timeout)

    # 5-6: expansions (LLM or fallback)
    if provider:
        expansions_map = llm_adjacency_expansions(provider, prompt, toks)
    else:
        expansions_map = {t: expansions_for_token(t) for t in toks}

    # Build universe (tokens + expansions)
    universe: List[str] = []
    for t in toks:
        universe.append(t)
        e1, e2 = expansions_map[t][0][0], expansions_map[t][1][0]
        universe.extend([e1, e2])
    # Deduplicate preserving order
    seen = set(); uniq = []
    for s in universe:
        if s not in seen:
            uniq.append(s); seen.add(s)

    # 3: vector numbers for universe
    scores, embs = scalar_projection_along(uniq, settings.emb_dim, settings.seed)
    vnums = vector_numbers(scores)

    # 4: glyphs (LLM choose indices from glyph bank; else deterministic map)
    bank, categories = build_or_load_glyph_bank(settings.glyph_count, settings.seed)
    if provider:
        idx_map = llm_select_glyph_indices(provider, prompt, uniq, categories, len(bank))
        glyph_map = {s: bank[idx_map[s]] for s in uniq}
    else:
        glyph_map = {s: bank[abs(hash(s)) % len(bank)] for s in uniq}

    # 10-12: geometry
    positions = pca_2d(embs)

    # Build graph + triangles
    nodes, exps, tris, edges, G = build_graph(
        tokens=toks,
        glyphs_map=glyph_map,
        vnums=vnums,
        positions=positions,
        embs=embs,
        expansions=expansions_map,
        glyphs_for_str=glyph_map,
    )

    # Attention → threads
    seeds = [n.id for n in nodes]
    attention = random_walk_with_restart(G, seeds, r=settings.restart_prob)
    threads = threads_from_attention(G, attention)

    # 69: Final answer (LLM recursive refinement or baseline)
    if provider:
        answer = llm_recursive_refine_answer(provider, prompt, expansions_map, passes=settings.refine_passes)
    else:
        answer = compose_answer(prompt, threads, G)

    # Package JSON
    sf = {
        "tokens": [n.__dict__ for n in nodes],
        "expansions": [e.__dict__ for e in exps],
        "triangles": [d.__dict__ for d in tris],
        "edges": [{"a": a, "b": b, "k": w} for a, b, w in edges],
    }
    pkg = {
        "version": settings.version,
        "space_field": sf,
        "threads": threads,
        "trace_summary": "LLM-enabled HLSF; safe-to-share trace only.",
        "stats": {
            "tokens": len(nodes),
            "expansions": len(exps),
            "triangles": len(tris),
            "edges": len(edges),
        }
    }

    # Local learning
    lm = load_local_model()
    lm = update_model(lm, toks)
    save_local_model(lm)

    # Save outputs
    os.makedirs(os.path.dirname(json_out) or ".", exist_ok=True)
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(pkg, f, ensure_ascii=False, indent=2)
    with open(text_out, "w", encoding="utf-8") as f:
        f.write(answer)

    return pkg, answer
