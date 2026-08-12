"""Tool: get_cve — fetch CVE enrichment.

Status: skeleton (Phase 0). Handler implemented in Phase 3.
"""

from agent.core.tool_registry import ToolDefinition

GET_CVE_TOOL = ToolDefinition(
    name="get_cve",
    description="Fetch CVE metadata: description, CVSS, CWE, affected software, references.",
    parameters_schema={
        "type": "object",
        "properties": {
            "cve_id": {"type": "string", "pattern": "^CVE-\\d{4}-\\d{4,}$"},
        },
        "required": ["cve_id"],
    },
    roles=["viewer", "analyst", "security_engineer", "admin"],
    requires_approval=False,
)
