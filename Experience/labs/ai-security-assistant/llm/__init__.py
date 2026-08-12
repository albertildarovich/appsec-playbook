"""LLM provider abstraction layer.

Providers: OpenAI, Anthropic, local. The rest of the code depends only on
`LLMProvider` from `llm.base` — swap providers via `llm.factory.get_provider`.
"""

from llm.base import LLMMessage, LLMProvider, LLMResponse, MessageRole
from llm.factory import get_provider

__all__ = [
    "LLMMessage",
    "LLMProvider",
    "LLMResponse",
    "MessageRole",
    "get_provider",
]
