# Human Approval (Human-in-the-Loop)

> Status: skeleton (Phase 0). To be completed in later phases.

## Why Human Approval

The agent can *recommend*; a human must *authorize* irreversible or high-impact actions.
This is the difference between an assistant and a rogue automation.

Examples of actions requiring approval:

- creating a Jira ticket with critical priority
- updating/deleting assets
- executing remediation actions on infrastructure
- any action with an irreversible side effect

## Approval Flow

```text
Agent wants to call: create_ticket(priority=critical)
        │
        ▼
Policy: this tool requires approval for role X / severity Y
        │
        ▼
Agent proposes action → presented to the user:
        │
        ▼
User: approve / reject / modify
        │
        ▼
Only on "approve" → tool executes
```

## Design Requirements

1. **The proposal is explicit** — the user sees the exact tool and parameters,
   not just a natural-language summary.
2. **Approval is scoped** — approving one call approves exactly that call,
   not a permission upgrade for the whole conversation.
3. **Approval is logged** — who approved, when, what arguments, what result.
4. **Timeout** — if no one approves, the action is rejected.
5. **Rejection is a result** — the agent must handle "rejected" gracefully
   and never silently retry.

## Approval Events in Audit Log

```json
{
  "event": "approval_requested",
  "tool": "create_ticket",
  "arguments": {"title": "...", "priority": "critical"},
  "requested_by": "security-engineer-7",
  "status": "pending"
}
```

## TODO

- [ ] Implement approval service (Phase 4)
- [ ] Add approval UI / API endpoints
- [ ] Add timeout and expiry handling
- [ ] Test rejection paths (agent must not retry or escalate)
