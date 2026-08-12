"""Security Agent — orchestrates the LLM + tool loop.

Status: skeleton (Phase 0). Implemented in Phase 3.

The loop is deliberately simple and controlled:

```
LLM → tool_choice → schema validation → RBAC → (approval?) → execute → log → LLM
```

The agent never executes arbitrary code or arbitrary HTTP requests.
It can only call tools registered in the ToolRegistry.
"""

from __future__ import annotations

from typing import Any

from app.core.config import settings
from agent.core.tool_registry import ToolRegistry
from llm.base import LLMProvider


class SecurityAgent:
    """Main agent entry point."""

    def __init__(
        self,
        llm: LLMProvider,
        tools: ToolRegistry | None = None,
        max_turns: int | None = None,
    ) -> None:
        self.llm = llm
        self.tools = tools or ToolRegistry()
        self.max_turns = max_turns or settings.agent_max_turns

    async def run(self, request: str, user_role: str = "viewer") -> dict[str, Any]:
        """Run the agent on a user request under a given role.

        Implemented in Phase 3. Returns a structured result (with sources).
        """
        raise NotImplementedError("SecurityAgent.run — Phase 3")
