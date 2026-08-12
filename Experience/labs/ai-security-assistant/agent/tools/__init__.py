"""Agent tools — the allowlisted set of capabilities.

Each tool defines:
- a strict parameters schema (OpenAI-style JSON Schema)
- allowed roles (RBAC)
- whether it requires human approval

Handlers are registered into the ToolRegistry in Phase 3.
"""

from agent.tools.calculate_risk import CALCULATE_RISK_TOOL
from agent.tools.create_ticket import CREATE_TICKET_TOOL
from agent.tools.get_asset import GET_ASSET_TOOL
from agent.tools.get_cve import GET_CVE_TOOL
from agent.tools.get_vulnerability import GET_VULNERABILITY_TOOL
from agent.tools.request_approval import REQUEST_APPROVAL_TOOL
from agent.tools.search_knowledge import SEARCH_KNOWLEDGE_TOOL
from agent.tools.update_ticket import UPDATE_TICKET_TOOL

ALL_TOOL_DEFINITIONS = [
    GET_CVE_TOOL,
    GET_ASSET_TOOL,
    GET_VULNERABILITY_TOOL,
    SEARCH_KNOWLEDGE_TOOL,
    CALCULATE_RISK_TOOL,
    CREATE_TICKET_TOOL,
    UPDATE_TICKET_TOOL,
    REQUEST_APPROVAL_TOOL,
]

__all__ = ["ALL_TOOL_DEFINITIONS"]
