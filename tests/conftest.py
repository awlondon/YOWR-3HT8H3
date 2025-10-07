import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / "src"
if src.exists():
    sys.path.insert(0, str(src))
