"""Tool: update_ticket — update an existing ticket.

Status: skeleton (Phase 0). Handler implemented in Phase 3/6.

Only security_engineer+ roles may update tickets.
"""

from agent.core.tool_registry import ToolDefinition

UPDATE_TICKET_TOOL = ToolDefinition(
    name="update_ticket",
    description="Update an existing remediation ticket (status, priority, notes).",
    parameters_schema={
        "type": "object",
        "properties": {
            "ticket_key": {"type": "string"},
            "status": {"type": "string", "enum": ["open", "in_progress", "in_review", "done", "closed", "rejected"]},
            "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
            "note": {"type": "string"},
        },
        "required": ["ticket_key"],
    },
    roles=["security_engineer", "admin"],
    requires_approval=True,
)
