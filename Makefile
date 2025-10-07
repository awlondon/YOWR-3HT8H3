.PHONY: setup test run fmt

setup:
python -m venv .venv && . .venv/bin/activate && pip install -e . && pip install pytest

test:
pytest -q

run:
hlsf run "demo prompt" --json-out out/space_field.json --text-out out/answer.txt --provider mock --passes 2

fmt:
python -m compileall src
