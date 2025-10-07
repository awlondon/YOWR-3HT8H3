import argparse
from .pipeline import run_hlsf
from .settings import Settings


def main():
    p = argparse.ArgumentParser(description="HLSF cognition engine (LLM-enabled)")
    sub = p.add_subparsers(dest="cmd")

    pr = sub.add_parser("run", help="Run HLSF on a prompt")
    pr.add_argument("prompt", type=str, help="User prompt text")
    pr.add_argument("--json-out", type=str, default="out/space_field.json")
    pr.add_argument("--text-out", type=str, default="out/answer.txt")
    pr.add_argument("--seed", type=int, default=777)
    pr.add_argument("--provider", type=str, default=None, help="LLM provider (openai_compat|mock)")
    pr.add_argument("--model", type=str, default=None, help="LLM model id")
    pr.add_argument("--base-url", type=str, default=None, help="LLM base URL")
    pr.add_argument("--passes", type=int, default=None, help="Refinement passes (>=1)")
    pr.add_argument("--no-llm", action="store_true", help="Disable LLM usage")

    args = p.parse_args()
    if args.cmd == "run":
        s = Settings()
        s.seed = args.seed
        if args.no-llm:
            s.use_llm = False
        if args.provider is not None:
            s.llm_provider = args.provider
        if args.model is not None:
            s.llm_model = args.model
        if args.base_url is not None:
            s.llm_base_url = args.base_url
        if args.passes is not None:
            s.refine_passes = max(1, int(args.passes))

        pkg, answer = run_hlsf(args.prompt, args.json_out, args.text_out, s)
        print(f"Wrote {args.json_out} and {args.text_out}")
    else:
        p.print_help()
