"""Tool: create_ticket — create a remediation ticket (Jira).

Status: skeleton (Phase 0). Handler implemented in Phase 3/6.

Requires approval for critical priority tickets.
"""

from agent.core.tool_registry import ToolDefinition

CREATE_TICKET_TOOL = ToolDefinition(
    name="create_ticket",
    description="Create a remediation ticket in the ticketing system (Jira).",
    parameters_schema={
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
            "asset_id": {"type": "string"},
            "cve_id": {"type": "string"},
            "remediation": {"type": "string"},
        },
        "required": ["title", "priority"],
    },
    roles=["analyst", "security_engineer", "admin"],
    requires_approval=True,  # always goes through human approval
)
