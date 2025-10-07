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

## Quick start (offline, mock provider)
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
hlsf run "Summarize the benefits of spaced repetition." --passes 3
```

The engine is provider-agnostic: any server exposing the OpenAI-compatible Chat Completions route will work by adjusting `LLM_BASE_URL` and `LLM_MODEL`.

## Outputs

- `out/space_field.json` — Space-Field Map JSON (tokens, expansions, triangles, edges, threads)
- `out/answer.txt` — Final answer text (LLM-refined if enabled)

## Tests
```bash
pytest -q
```

## Development

The repository ships with a small helper `Makefile` to streamline common
tasks while iterating locally:

```bash
make setup   # create a virtualenv and install editable deps + pytest
make run     # execute a demo prompt using the mock provider
make test    # run the pytest suite
```

Project sources live under `src/hlsf/` and the JSON schemas that
describe serialized artifacts are kept in `schema/`. Example runs and
fixtures can be found in `examples/` and `var/` respectively, which makes
it easy to inspect how the engine stitches together expansions, glyphs,
and the final answer text.

## Notes

- If `LLM_PROVIDER` is absent (or `--provider mock`), the pipeline uses the offline baseline for expansions & glyphs and the baseline composer.
- The LLM prompts request JSON-only for expansions/glyphs and final answer only for drafting/refinement (no chain-of-thought).
