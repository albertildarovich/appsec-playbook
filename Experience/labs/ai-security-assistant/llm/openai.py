"""OpenAI LLM provider.

Status: skeleton (Phase 0). Implemented in Phase 1 using the `openai` SDK.
"""

from __future__ import annotations

from typing import Any

from llm.base import LLMMessage, LLMProvider, LLMResponse


class OpenAIProvider(LLMProvider):
    """OpenAI-compatible provider (chat completions + tool calling)."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
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
        raise NotImplementedError("OpenAIProvider.complete — Phase 1")
