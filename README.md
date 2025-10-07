# HLSF Engine (LLM-enabled)

A working implementation of the **High-Level Space Field (HLSF) cognition engine** that can:
- Call an LLM for **adjacency expansions** (2 per token)
- Call an LLM for **symbolic glyph selection** from a deterministic 1,000-glyph bank
- Use the LLM for **recursive refinement** of the final answer (multi-pass)

It also runs fully offline using a **mock provider**, so tests don't require network access.

## Install
```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
```

## Main pipeline: Localhost HTML GUI

The engine's primary workflow is the interactive browser experience served from your
machine. Running `hlsf` (with no subcommands) launches a FastAPI + Uvicorn server and
opens `http://127.0.0.1:8000` in your default browser where the bundled `index.html`
is hosted.

```bash
# Launch the GUI at http://127.0.0.1:8000
hlsf

# Advanced: customise host/port or skip auto-opening a browser window
hlsf gui --host 0.0.0.0 --port 9000 --no-browser
```

From the GUI you can submit prompts, toggle LLM usage, and inspect the generated
space field graph, FFT analytics, and glyph stream in real time. Provide LLM
credentials via environment variables before launching the app if you want to use a
live provider.

## CLI quick start (offline, mock provider)
```bash
hlsf run "Explain quantum tunneling to a 12-year-old." --provider mock --passes 2
cat out/answer.txt
```

## Using an OpenAI-compatible endpoint

Set environment variables (examples below) and omit `--provider mock`. The code uses a standard `/v1/chat/completions` interface.

```bash
export LLM_PROVIDER=openai_compat
export LLM_API_KEY="sk-...your key..."
export LLM_BASE_URL="https://api.openai.com"
export LLM_MODEL="gpt-4o-mini"    # or any compatible chat model id
hlsf
# or: hlsf run "Summarize the benefits of spaced repetition." --passes 3
```

The engine is provider-agnostic: any server exposing the OpenAI-compatible Chat Completions route will work by adjusting `LLM_BASE_URL` and `LLM_MODEL`.

## Outputs

- GUI mode renders the `index.html` dashboard at `http://127.0.0.1:8000` and returns
  analytics directly to the browser without touching disk.
- CLI mode writes `out/space_field.json` (space-field map) and `out/answer.txt`
  (final answer text, LLM-refined if enabled).

## Tests
```bash
pytest -q
```

## Notes

- If `LLM_PROVIDER` is absent (or `--provider mock`), the pipeline uses the offline baseline for expansions & glyphs and the baseline composer.
- The LLM prompts request JSON-only for expansions/glyphs and final answer only for drafting/refinement (no chain-of-thought).
