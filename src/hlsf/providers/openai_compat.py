import os, json
import requests
from typing import List, Dict
from .base import LLMProvider


class OpenAICompat(LLMProvider):
    name = "openai_compat"

    def __init__(self, api_key: str = "", base_url: str = "https://api.openai.com", model: str = "gpt-4o-mini", timeout: int = 60):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.base_url = base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.timeout = int(timeout or os.getenv("HLSF_HTTP_TIMEOUT", "60"))

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        url = self.base_url.rstrip("/") + "/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.2),
            "max_tokens": kwargs.get("max_tokens", 800),
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        r = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]
