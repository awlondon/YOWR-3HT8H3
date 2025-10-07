from abc import ABC, abstractmethod
from typing import List, Dict, Any


class LLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Return assistant message content (str)."""
        raise NotImplementedError
