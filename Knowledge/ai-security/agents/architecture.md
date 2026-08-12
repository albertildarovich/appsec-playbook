# Agent Architecture — Security Agent

> Status: skeleton (Phase 0). To be completed in later phases.

## Design Goal

Build a **security agent** that assists with vulnerability triage and remediation —
not a general-purpose chatbot. The agent's power comes from its tools, and its safety
comes from controlling those tools.

## Agent Loop

```
1. Receive request (CVE, scanner output, question)
2. LLM plans: direct answer or tool calls?
3. Tool registry validates each proposed call
4. RBAC checks the caller's role
5. High-risk tools → human approval
6. Execute, audit-log, feed result back to LLM
7. Repeat until task complete or budget exhausted
```

## Tool Inventory

| Tool | Purpose | Risk |
|---|---|---|
| `search_knowledge()` | Query the RAG knowledge base | Low |
| `get_cve()` | Fetch CVE enrichment from CVE API | Low |
| `get_asset()` | Look up asset metadata | Low |
| `get_vulnerability()` | Fetch vulnerability findings | Low |
| `calculate_risk()` | Compute risk score (CVE × asset criticality) | Medium |
| `create_ticket()` | Create a Jira ticket | Medium |
| `update_ticket()` | Update a Jira ticket | Medium-High |
| `request_approval()` | Ask a human to approve a risky action | Low (gate) |

## Security Properties

1. **No arbitrary code execution.** No `execute(command)`, no `http_request(url)`.
2. **Strict schemas.** Every tool takes typed, validated parameters.
3. **RBAC per tool.** Roles gate each tool.
4. **Human approval** for dangerous/irreversible actions.
5. **Max turns & budgets.** Prevent infinite loops and runaway tool chains.
6. **Full audit trail.** Every tool call is logged with user, arguments, outcome.

## Components

```
agent/
├── core/
│   ├── agent.py          # loop orchestration
│   ├── tool_registry.py  # tool definitions + schema validation
│   └── approval.py       # human-in-the-loop workflow
└── tools/
    ├── search_knowledge.py
    ├── get_cve.py
    ├── get_asset.py
    ├── get_vulnerability.py
    ├── calculate_risk.py
    ├── create_ticket.py
    ├── update_ticket.py
    └── request_approval.py
```

## Related

- [Permissions](permissions.md)
- [Human Approval](human-approval.md)
- [Excessive Agency](../security/excessive-agency.md)
