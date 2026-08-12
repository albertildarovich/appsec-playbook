# Agent Permissions (RBAC)

> Status: skeleton (Phase 0). To be completed in later phases.

## Principle

> **Least privilege.** The LLM is not granted permissions. The *user* is, and the agent
> executes tools under the user's identity. The model can never act on its own authority.

## Roles

| Role | Description |
|---|---|
| `viewer` | Read-only: assets, vulnerabilities, knowledge |
| `analyst` | Viewer + risk calculation + ticket creation |
| `security_engineer` | Analyst + ticket updates + approvals |
| `admin` | Everything + destructive actions |

## Tool Permission Matrix

| Tool | viewer | analyst | security_engineer | admin |
|---|---:|---:|---:|---:|
| `get_cve` | ✅ | ✅ | ✅ | ✅ |
| `get_asset` | ✅ | ✅ | ✅ | ✅ |
| `get_vulnerability` | ✅ | ✅ | ✅ | ✅ |
| `search_knowledge` | ✅ | ✅ | ✅ | ✅ |
| `calculate_risk` | ❌ | ✅ | ✅ | ✅ |
| `create_ticket` | ❌ | ✅ | ✅ | ✅ |
| `update_ticket` | ❌ | ❌ | ✅ | ✅ |
| `delete_asset` | ❌ | ❌ | ❌ | ✅ (approval) |
| `execute_action` | ❌ | ❌ | approval | approval |

## Enforcement Points

Permission checks happen in **three layers** — never trust the LLM to self-regulate:

```
1. API layer     — user role from session/token
2. Tool registry — tool → required roles mapping
3. Agent loop    — re-check before every execution
```

## Implementation Sketch

```python
TOOL_PERMISSIONS = {
    "get_asset":      {"viewer", "analyst", "security_engineer", "admin"},
    "create_ticket":  {"analyst", "security_engineer", "admin"},
    "update_ticket":  {"security_engineer", "admin"},
    "delete_asset":   {"admin"},   # + human approval
}

def check_permission(user_role: str, tool_name: str) -> bool:
    return user_role in TOOL_PERMISSIONS[tool_name]
```

## Notes

- RBAC gates *who can trigger* a tool. Human approval gates *whether* a high-risk
  tool actually executes (defense in depth).
- Default deny: an unknown tool or unknown role is rejected.
- Audit logs record the role at the time of the call, so permission changes
  are traceable historically.

## Related

- [Excessive Agency](../security/excessive-agency.md)
- [Privilege Escalation](../security/privilege-escalation.md)
- [Human Approval](human-approval.md)
