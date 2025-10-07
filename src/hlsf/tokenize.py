import re
from typing import List

TOKEN_RE = re.compile(r"\w+|[^\w\s]", re.UNICODE)

def tokenize(text: str) -> List[str]:
    """Simple, deterministic tokenizer: words and punctuation."""
    return TOKEN_RE.findall(text)
