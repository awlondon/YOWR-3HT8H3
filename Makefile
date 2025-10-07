.PHONY: setup test run fmt

setup:
python -m venv .venv && . .venv/bin/activate && pip install -e . && pip install pytest

test:
pytest -q

run:
	hlsf gui --host 127.0.0.1 --port 8000

fmt:
python -m compileall src
