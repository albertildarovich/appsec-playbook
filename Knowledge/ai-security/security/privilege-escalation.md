# Privilege Escalation via Tool Abuse

> Status: skeleton (Phase 0). To be completed in later phases.

## Problem

An attacker who can influence the agent (directly or via injection) will try to escalate:
perform actions beyond what the original user role allows.

## Escalation Paths

| Path | Example | Defense |
|---|---|---|
| Tool call forgery | Model emits a call to a tool the user cannot use | RBAC check on every call, keyed to the **user**, not the model |
| Parameter escalation | `update_ticket` with admin-only fields | Schema validation on fields, not just tool name |
| Approval bypass | Model claims "already approved" | Approval state is tracked server-side, not in the prompt |
| Indirect escalation via prompt | Injection asks model to use user's privileges | Untrusted-data framing + detection |
| Role confusion | One session, multiple user identities | Session bound to one role; impersonation is rejected |

## Key Rule

> **The model has no authority. The user has authority.**
> Every tool call is executed with the *caller's* role, checked server-side.
> The LLM cannot grant itself permissions, because permissions are not a language feature.

## Defense-in-Depth

```
Tool call (proposed by LLM)
   │
   ▼
1. Schema validation  — parameters match the typed contract
   │
   ▼
2. RBAC check        — is the USER allowed to call this tool?
   │
   ▼
3. Approval check    — does this call need human approval?
   │
   ▼
4. Execution         — with least-privilege credentials
   │
   ▼
5. Audit log         — user, role, tool, args, result
```

## Red-Team Scenarios

- Analyst asks agent to delete an asset → must be denied (not in role).
- Injection in a CVE description asks the agent to update a critical ticket → blocked.
- Model emits a call to `execute_action` → tool doesn't exist in the allowlist.

## Related

- [Permissions](../agents/permissions.md)
- [Threat Model](threat-model.md)
- [Prompt Injection](prompt-injection.md)
