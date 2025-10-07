import json, re
from typing import List, Dict
from .base import LLMProvider


class MockProvider(LLMProvider):
    """
    Deterministic offline provider used by tests.
    It looks at the 'task' field in the user message JSON and returns a predictable output.
    """
    name = "mock"

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        user = messages[-1]["content"]
        try:
            req = json.loads(user)
        except Exception:
            # If it's not pure JSON, try to find a JSON object
            m = re.search(r"\{.*\}", user, re.S)
            req = json.loads(m.group(0)) if m else {}

        task = req.get("task", "")
        if task == "adjacency_expansions":
            toks = [t for t in req.get("tokens", []) if re.match(r"[A-Za-z]", t)]
            out = {"expansions": []}
            for t in toks:
                base = t.lower()
                e1 = base if len(base) > 2 else f"{base}_sem"
                e2 = f"{base}_assoc"
                out["expansions"].append({
                    "token": t, 
                    "semantic": {"text": e1, "weight": 0.86},
                    "associative": {"text": e2, "weight": 0.66}
                })
            return json.dumps(out)
        elif task == "glyph_selection":
            toks = req.get("tokens", [])
            bank_size = int(req.get("bank_size", 1000))
            out = {"glyph_indices": []}
            for t in toks:
                idx = abs(hash(t)) % max(1, bank_size)
                out["glyph_indices"].append({"token": t, "index": idx})
            return json.dumps(out)
        elif task == "refine_answer":
            prompt = req.get("prompt", "")
            prev = req.get("previous_answer", "")
            # Very simple "refinement"
            ans = prev.strip() if prev else f"{prompt.strip()} — concise answer (mock)."
            return ans
        else:
            return "OK"
