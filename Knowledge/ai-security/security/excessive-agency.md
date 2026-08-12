# Excessive Agency — Mitigation

> Status: skeleton (Phase 0). To be completed in later phases.

## Problem

**Excessive agency** is the system taking actions the user did not intend or authorize.
With tools, an LLM can do far more damage than a chatbot that only produces text.

## Forbidden Autonomous Actions

The agent must never self-initiate:

```text
delete_asset()
restart_production()
execute_shell()
rotate_credentials()
```

and it must never treat these as available tools at all — the allowlist simply does not
contain them.

## Causes of Excessive Agency

1. Too many tools exposed (including dangerous ones).
2. No human approval gates.
3. The model misinterprets intent ("fix everything").
4. Injection overrides the plan.

## Controls

| Control | Description |
|---|---|
| Tool allowlist | Only the defined tools exist; everything else is unreachable |
| RBAC | Users can only trigger tools their role allows |
| Human approval | High-risk tools block until a human approves |
| Max turns / budget | The agent cannot loop forever or spend unbounded resources |
| Action plan visibility | The agent states its plan; the user can reject |
| Scope framing | System prompt defines what the agent may and may not do |

## Design Rule

> **The agent proposes; the system disposes.**
> Proposals are cheap, actions are gated.

## Red-Team Scenario

```
User: "Find critical vulnerabilities and fix them."
Agent: identifies issues, creates a plan
      ↓
      create_ticket → approval required → user approves the specific ticket
      execute_action → NOT IN ALLOWLIST → impossible
```

## TODO

- [ ] Add max-turns and tool-call caps to the agent loop
- [ ] Add approval requirement tests for high-risk tools
- [ ] Test "user asks to fix everything" scenario
