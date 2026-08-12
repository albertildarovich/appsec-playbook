"""Tool registry tests — validation, RBAC, execution."""

from __future__ import annotations

import pytest

from agent.core.tool_registry import ToolDefinition, ToolRegistry


def make_registry() -> ToolRegistry:
    registry = ToolRegistry()

    async def get_cve_handler(cve_id: str) -> dict:
        return {"cve_id": cve_id, "title": "test"}

    registry.register(
        ToolDefinition(
            name="get_cve",
            description="fetch cve",
            parameters_schema={
                "type": "object",
                "properties": {"cve_id": {"type": "string"}},
                "required": ["cve_id"],
            },
            roles=["viewer", "analyst"],
        ),
        get_cve_handler,
    )
    return registry


def test_register_and_lookup() -> None:
    registry = make_registry()
    definition = registry.get("get_cve")
    assert definition is not None
    assert definition.name == "get_cve"


def test_unknown_tool_is_none() -> None:
    assert make_registry().get("execute_shell") is None


def test_can_call_respects_roles() -> None:
    registry = make_registry()
    assert registry.can_call("get_cve", "viewer") is True
    assert registry.can_call("get_cve", "security_engineer") is False
    assert registry.can_call("not_a_tool", "admin") is False


def test_validate_parameters_rejects_bad_types() -> None:
    registry = make_registry()
    with pytest.raises(Exception):
        registry.validate_parameters("get_cve", {"cve_id": 12345})


def test_validate_parameters_accepts_valid() -> None:
    registry = make_registry()
    validated = registry.validate_parameters("get_cve", {"cve_id": "CVE-2024-1234"})
    assert validated == {"cve_id": "CVE-2024-1234"}


@pytest.mark.asyncio
async def test_execute_calls_handler() -> None:
    registry = make_registry()
    result = await registry.execute("get_cve", {"cve_id": "CVE-2024-1234"})
    assert result["cve_id"] == "CVE-2024-1234"


@pytest.mark.asyncio
async def test_execute_unknown_tool_raises() -> None:
    registry = make_registry()
    with pytest.raises(KeyError):
        await registry.execute("delete_asset", {})
