"""Tool: calculate_risk — compute risk for a vulnerability on an asset.

Status: skeleton (Phase 0). Handler implemented in Phase 3.

Risk combines CVE severity/CVSS with asset criticality and exploitability.
"""

from agent.core.tool_registry import ToolDefinition

CALCULATE_RISK_TOOL = ToolDefinition(
    name="calculate_risk",
    description="Compute the risk score for a vulnerability on an asset.",
    parameters_schema={
        "type": "object",
        "properties": {
            "cve_id": {"type": "string", "pattern": "^CVE-\\d{4}-\\d{4,}$"},
            "asset_id": {"type": "string"},
        },
        "required": ["cve_id", "asset_id"],
    },
    roles=["analyst", "security_engineer", "admin"],
    requires_approval=False,
)
