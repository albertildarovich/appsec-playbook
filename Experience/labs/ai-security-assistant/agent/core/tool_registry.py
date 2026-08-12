"""Tool registry — the only way the agent can touch the world.

Status: skeleton (Phase 0). Implemented in Phase 3.

Security properties:
- Default deny: an unknown tool is rejected before anything executes.
- Every tool has a strict Pydantic schema (no free-form parameters).
- RBAC checks are evaluated per call, keyed to the *user* role.
"""

from __future__ import annotations

from typing import Any, Awaitable, Callable

from pydantic import BaseModel, ValidationError


class ToolDefinition(BaseModel):
    """Metadata + schema for a registered tool."""

    name: str
    description: str
    parameters_schema: dict[str, Any]
    roles: list[str]
    requires_approval: bool = False


ToolHandler = Callable[..., Awaitable[Any]]


class ToolRegistry:
    """Registry of available agent tools with schema + RBAC metadata."""

    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}
        self._handlers: dict[str, ToolHandler] = {}

    def register(
        self,
        definition: ToolDefinition,
        handler: ToolHandler,
    ) -> None:
        self._tools[definition.name] = definition
        self._handlers[definition.name] = handler

    def get(self, name: str) -> ToolDefinition | None:
        """Look up a tool. Unknown tools return None (default deny)."""
        return self._tools.get(name)

    def tool_names(self) -> list[str]:
        return sorted(self._tools)

    def can_call(self, tool_name: str, role: str) -> bool:
        definition = self.get(tool_name)
        if definition is None:
            return False
        return role in definition.roles

    def validate_parameters(self, tool_name: str, parameters: dict[str, Any]) -> dict[str, Any]:
        """Validate parameters against the tool schema; raises ValidationError."""
        definition = self.get(tool_name)
        if definition is None:
            raise KeyError(f"Unknown tool: {tool_name}")
        return _validate_against_schema(definition.parameters_schema, parameters)

    async def execute(self, tool_name: str, parameters: dict[str, Any]) -> Any:
        """Execute a registered tool with validated parameters."""
        definition = self.get(tool_name)
        if definition is None:
            raise KeyError(f"Unknown tool: {tool_name}")
        handler = self._handlers[tool_name]
        return await handler(**parameters)


def _validate_against_schema(schema: dict[str, Any], parameters: dict[str, Any]) -> dict[str, Any]:
    """Validate parameters using a dynamically-built Pydantic model."""

    required = set(schema.get("required", []))
    annotations: dict[str, type] = {}
    for name, prop in schema.get("properties", {}).items():
        py_type = _json_type_to_python(prop["type"])
        annotations[name] = py_type if name in required else type(py_type) | None  # type: ignore[assignment]

    model = type(
        "ToolParameters",
        (BaseModel,),
        {
            "__annotations__": annotations,
            "model_config": {"extra": "forbid"},  # reject unknown fields
        },
    )
    try:
        validated = model.model_validate(parameters)
        return validated.model_dump(exclude_unset=True)
    except ValidationError as exc:
        raise ValidationError.from_exception_data(
            "ToolParameters", [e for e in exc.errors()]
        ) from exc


def _json_type_to_python(json_type: str) -> type:
    mapping = {
        "string": str,
        "integer": int,
        "number": float,
        "boolean": bool,
    }
    if json_type not in mapping:
        raise ValueError(f"Unsupported JSON schema type: {json_type}")
    return mapping[json_type]
