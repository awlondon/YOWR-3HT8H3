from typing import Optional
from .base import LLMProvider
from .mock import MockProvider


def _try_import_openai():
    try:
        from .openai_compat import OpenAICompat  # type: ignore
        return OpenAICompat
    except ModuleNotFoundError:
        return None


def make_provider(provider_name: str, api_key: str, base_url: str, model: str, timeout: int) -> Optional[LLMProvider]:
    name = (provider_name or "").lower()
    if name in ("mock",):
        return MockProvider()
    if name in ("openai_compat", "openai-compatible", "openai"):
        cls = _try_import_openai()
        if cls is None:
            raise RuntimeError("openai_compat provider requires the 'requests' package; install dependencies to enable it.")
        return cls(api_key=api_key, base_url=base_url, model=model, timeout=timeout)
    return None
