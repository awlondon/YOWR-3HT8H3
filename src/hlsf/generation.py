from typing import Dict, List

from .simple_graph import Graph


def compose_answer(prompt: str, threads: List[Dict], G: Graph) -> str:
    """Offline fallback: compact, safe-to-share verbalization."""
    lines = []
    lines.append(f"Prompt: {prompt}")
    lines.append("")
    lines.append("Answer (HLSF baseline):")
    if not threads:
        lines.append("- No salient threads found; providing succinct summary of tokens.")
        return "\n".join(lines)
    for th in threads[:5]:
        lines.append(f"- Thread {th['id']} (salience {th['score']:.3f}):")
        token_texts = [G.get_node(n).get("text") for n in th["tokens"] if G.get_node(n).get("text")]
        exp_texts = [G.get_node(n).get("text") for n in th["expansions"] if G.get_node(n).get("text")]
        if token_texts:
            lines.append(f"  • Focus tokens: {', '.join(token_texts)}")
        if exp_texts:
            lines.append(f"  • Adjacencies: {', '.join(exp_texts[:6])}")
        lines.append("  • Synthesis: relates focus tokens via their adjacencies into a cohesive explanation.")
    lines.append("")
    lines.append("This is a baseline externalization; enable LLM for refined drafting.")
    return "\n".join(lines)
