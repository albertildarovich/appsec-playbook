"""LLM provider factory.

Selects a provider based on configuration. The rest of the system only ever
uses the `LLMProvider` interface.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from llm.base import LLMProvider


@lru_cache
def get_provider() -> LLMProvider:
    """Build the configured provider (openai | anthropic | local)."""
    provider_name = settings.llm_provider.lower()

    if provider_name == "openai":
        from llm.openai import OpenAIProvider

        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")
        return OpenAIProvider(api_key=settings.openai_api_key, model=settings.llm_model)

    if provider_name == "anthropic":
        from llm.anthropic import AnthropicProvider

        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured")
        return AnthropicProvider(api_key=settings.anthropic_api_key, model=settings.llm_model)

    raise ValueError(f"Unknown LLM provider: {provider_name!r}")
