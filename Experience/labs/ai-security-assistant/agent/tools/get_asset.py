"""Tool: get_asset — look up asset metadata.

Status: skeleton (Phase 0). Handler implemented in Phase 3.
"""

from agent.core.tool_registry import ToolDefinition

GET_ASSET_TOOL = ToolDefinition(
    name="get_asset",
    description="Look up asset metadata by id: environment, criticality, owner team.",
    parameters_schema={
        "type": "object",
        "properties": {
            "asset_id": {"type": "string"},
        },
        "required": ["asset_id"],
    },
    roles=["viewer", "analyst", "security_engineer", "admin"],
    requires_approval=False,
)
