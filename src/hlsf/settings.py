from dataclasses import dataclass
import os


@dataclass
class Settings:
    # Core
    seed: int = 777
    glyph_count: int = 1000
    emb_dim: int = 64
    restart_prob: float = 0.15
    version: str = "0.0.0.0"

    # LLM
    use_llm: bool = True
    llm_provider: str = os.getenv("LLM_PROVIDER", "openai_compat")  # "openai_compat" | "mock"
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "https://api.openai.com")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    refine_passes: int = int(os.getenv("HLSF_PASSES", "2"))
    request_timeout: int = int(os.getenv("HLSF_HTTP_TIMEOUT", "60"))
