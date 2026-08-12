"""Tool: request_approval — ask a human to approve a risky action.

Status: skeleton (Phase 0). Handler implemented in Phase 4.

This tool is how the agent surfaces proposals: it presents the exact tool call
and waits for a human decision (approve / reject).
"""

from agent.core.tool_registry import ToolDefinition

REQUEST_APPROVAL_TOOL = ToolDefinition(
    name="request_approval",
    description="Present a proposed tool call to a human for approval.",
    parameters_schema={
        "type": "object",
        "properties": {
            "tool_name": {"type": "string"},
            "arguments": {"type": "object"},
            "reason": {"type": "string"},
        },
        "required": ["tool_name", "arguments", "reason"],
    },
    roles=["viewer", "analyst", "security_engineer", "admin"],
    requires_approval=False,  # this tool IS the approval gate
)
