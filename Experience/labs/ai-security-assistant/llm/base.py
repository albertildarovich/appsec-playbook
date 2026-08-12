"""LLM provider abstraction.

Status: skeleton (Phase 0). Concrete providers (OpenAI/Anthropic) are added in Phase 1.
The interface stays vendor-neutral so the agent never touches provider SDKs directly.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class MessageRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class LLMMessage(BaseModel):
    """A single message in a conversation."""

    role: MessageRole
    content: str
    extra: dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    """A model reply — either text or a requested tool call."""

    content: str = ""
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)


class LLMProvider(ABC):
    """Vendor-neutral LLM interface."""

    @abstractmethod
    async def complete(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """Run a completion. `tools` uses the OpenAI tool-calling JSON schema."""
        raise NotImplementedError
