"""Anthropic LLM provider.

Status: skeleton (Phase 0). Implemented in Phase 1 using the `anthropic` SDK.
"""

from __future__ import annotations

from typing import Any

from llm.base import LLMMessage, LLMProvider, LLMResponse


class AnthropicProvider(LLMProvider):
    """Anthropic provider (messages API + tool use)."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514") -> None:
        self.api_key = api_key
        self.model = model

    async def complete(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        # Implemented in Phase 1.
        raise NotImplementedError("AnthropicProvider.complete — Phase 1")
