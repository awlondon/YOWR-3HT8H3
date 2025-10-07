import json


def try_parse_json_maybe_embedded(text: str):
    """
    Try json.loads; if it fails, attempt to extract the first balanced {...} block.
    """
    try:
        return json.loads(text)
    except Exception:
        pass
    # Fallback: find first balanced JSON object
    start = None
    depth = 0
    for i, ch in enumerate(text):
        if ch == '{':
            if start is None:
                start = i
            depth += 1
        elif ch == '}' and start is not None:
            depth -= 1
            if depth == 0:
                snippet = text[start:i+1]
                try:
                    return json.loads(snippet)
                except Exception:
                    start = None
    raise ValueError("Failed to parse JSON from LLM response.")
