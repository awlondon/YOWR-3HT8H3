import json
import os
from typing import Dict, List

LM_PATH = os.path.join("var", "local_model.json")


def load_local_model() -> Dict:
    os.makedirs("var", exist_ok=True)
    if os.path.exists(LM_PATH):
        with open(LM_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"stats": {"runs": 0}, "cooc": {}}


def save_local_model(model: Dict) -> None:
    with open(LM_PATH, "w", encoding="utf-8") as f:
        json.dump(model, f, ensure_ascii=False, indent=2)


def update_model(model: Dict, tokens: List[str]) -> Dict:
    model["stats"]["runs"] = int(model["stats"].get("runs", 0)) + 1
    cooc = model.setdefault("cooc", {})
    for i, a in enumerate(tokens):
        for j, b in enumerate(tokens):
            if i == j: continue
            key = f"{a}|{b}"
            cooc[key] = int(cooc.get(key, 0)) + 1
    return model
