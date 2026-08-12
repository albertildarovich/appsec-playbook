"""RBAC policy — tool → roles matrix.

Status: skeleton (Phase 0). Enforced in Phase 4 in the agent loop, API and MCP server.
"""

from __future__ import annotations

from enum import StrEnum


class Role(StrEnum):
    VIEWER = "viewer"
    ANALYST = "analyst"
    SECURITY_ENGINEER = "security_engineer"
    ADMIN = "admin"


ROLES: tuple[Role, ...] = (
    Role.VIEWER,
    Role.ANALYST,
    Role.SECURITY_ENGINEER,
    Role.ADMIN,
)

# Tool → roles that may call it.
TOOL_PERMISSIONS: dict[str, set[Role]] = {
    "get_cve": {Role.VIEWER, Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "get_asset": {Role.VIEWER, Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "get_vulnerability": {Role.VIEWER, Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "search_knowledge": {Role.VIEWER, Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "calculate_risk": {Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "create_ticket": {Role.ANALYST, Role.SECURITY_ENGINEER, Role.ADMIN},
    "update_ticket": {Role.SECURITY_ENGINEER, Role.ADMIN},
    # Dangerous tools are NOT in the allowlist at all:
    # delete_asset, restart_production, execute_shell, rotate_credentials
}


def check_permission(role: str, tool_name: str) -> bool:
    """Return True if `role` may call `tool_name`. Default deny."""
    try:
        role_enum = Role(role)
    except ValueError:
        return False
    allowed = TOOL_PERMISSIONS.get(tool_name, set())
    return role_enum in allowed
