"""Tool: search_knowledge — query the RAG knowledge base.

Status: skeleton (Phase 0). Handler implemented in Phase 2/3.
"""

from agent.core.tool_registry import ToolDefinition

SEARCH_KNOWLEDGE_TOOL = ToolDefinition(
    name="search_knowledge",
    description=(
        "Search the security knowledge base (CVE, CWE, OWASP, CIS, playbooks). "
        "Returns document chunks with source references."
    ),
    parameters_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "doc_types": {
                "type": "array",
                "items": {"type": "string", "enum": ["cve", "cwe", "owasp", "cis", "internal", "playbook"]},
            },
            "top_k": {"type": "integer", "minimum": 1, "maximum": 10},
        },
        "required": ["query"],
    },
    roles=["viewer", "analyst", "security_engineer", "admin"],
    requires_approval=False,
)
