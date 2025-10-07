import unicodedata
import random
import json
import os
from typing import List, Dict, Tuple

SAFE_CATS = {"So", "Sm", "Sc", "Sk"}  # symbols only
BANK_PATH = os.path.join("var", "glyph_bank.json")

CATEGORY_SPEC = [
    # (name, semantics, codepoint ranges [(start, end, step)], target_count)
    ("arrows", "causality, mapping, motion", [(0x2190,0x21FF,1),(0x27F0,0x27FF,1),(0x2900,0x297F,1)], 220),
    ("geometric_shapes", "structure, container, partition", [(0x25A0,0x25FF,1)], 180),
    ("math_symbols", "relations, operators, sets", [(0x2200,0x22FF,1)], 170),
    ("stars_emphasis", "rating, attention, emphasis", [(0x2600,0x26FF,1)], 130),
    ("misc_symbols", "decorative or generic markers", [(0x2300,0x23FF,1)], 120),
    ("dingbats_misc", "assorted symbols", [(0x2700,0x27BF,1)], 100),
    ("supplemental_symbols", "pictographs; cycles; flows", [(0x1F300,0x1F5FF,17)], 180),
]

def _collect_from_ranges(ranges):
    out = []
    for start, end, step in ranges:
        for cp in range(start, end + 1, step):
            ch = chr(cp)
            cat = unicodedata.category(ch)
            if cat in SAFE_CATS and not ch.isspace():
                out.append(ch)
    return out

def build_or_load_glyph_bank(n: int, seed: int) -> Tuple[List[str], List[Dict]]:
    if os.path.exists(BANK_PATH):
        with open(BANK_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            bank = data["bank"]
            cats = data["categories"]
            if len(bank) == n:
                return bank, cats

    rng = random.Random(seed)
    bank: List[str] = []
    categories: List[Dict] = []
    remaining = n
    # Normalize target counts to sum to n
    total_target = sum(t for _,_,_,t in CATEGORY_SPEC)
    spec_scaled = [(name,sem,ranges, max(1, round(n * t / total_target))) for (name,sem,ranges,t) in CATEGORY_SPEC]
    # Adjust to exact n
    diff = n - sum(t for _,_,_,t in spec_scaled)
    if diff != 0:
        name, sem, ranges, t = spec_scaled[0]
        spec_scaled[0] = (name, sem, ranges, t + diff)

    for name, sem, ranges, tcount in spec_scaled:
        cands = _collect_from_ranges(ranges)
        rng.shuffle(cands)
        chosen = (cands[:tcount] if len(cands) >= tcount else (cands * ((tcount // max(1,len(cands)))+1))[:tcount])
        start = len(bank)
        bank.extend(chosen)
        end = len(bank) - 1
        categories.append({"name": name, "semantics": sem, "start": start, "end": end})
    # Truncate/pad to exactly n
    bank = bank[:n]
    if len(bank) < n:
        bank = (bank * ((n // max(1,len(bank))) + 1))[:n]

    os.makedirs("var", exist_ok=True)
    with open(BANK_PATH, "w", encoding="utf-8") as f:
        json.dump({"bank": bank, "categories": categories}, f, ensure_ascii=False, indent=2)
    return bank, categories
