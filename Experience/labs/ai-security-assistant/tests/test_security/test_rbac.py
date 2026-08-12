"""RBAC policy tests."""

from __future__ import annotations

import pytest

from security.rbac import check_permission


@pytest.mark.parametrize(
    ("role", "tool", "expected"),
    [
        # Read-only tools: everyone
        ("viewer", "get_asset", True),
        ("viewer", "get_cve", True),
        ("viewer", "get_vulnerability", True),
        ("viewer", "search_knowledge", True),
        # Risk calculation and ticket creation: analyst+
        ("viewer", "calculate_risk", False),
        ("analyst", "calculate_risk", True),
        ("analyst", "create_ticket", True),
        # Ticket updates: engineer+
        ("analyst", "update_ticket", False),
        ("security_engineer", "update_ticket", True),
        ("admin", "update_ticket", True),
        # Dangerous tools must not exist in the allowlist at all
        ("admin", "delete_asset", False),
        ("admin", "execute_shell", False),
        ("admin", "rotate_credentials", False),
        ("admin", "restart_production", False),
    ],
)
def test_check_permission(role: str, tool: str, expected: bool) -> None:
    assert check_permission(role, tool) is expected


def test_unknown_role_is_denied() -> None:
    assert check_permission("root", "get_asset") is False


def test_unknown_tool_is_denied() -> None:
    assert check_permission("admin", "not_a_real_tool") is False
