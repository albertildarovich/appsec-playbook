"""MCP Security Server entry point.

Status: skeleton (Phase 0). Implemented in Phase 5 using the `mcp` SDK.

Exposes:
- Resources: vulnerabilities, assets, security policies, playbooks
- Tools: get_vulnerability, search_assets, calculate_risk, create_ticket

Security: server-side RBAC, strict input validation, audit logging, no code execution.
"""

from __future__ import annotations


def create_server():
    """Build the MCP server (Phase 5)."""
    raise NotImplementedError("mcp-server — Phase 5")
