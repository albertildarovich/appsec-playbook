# Architecture — AI Security System

> Status: skeleton (Phase 0). To be completed in later phases.

## Goal

Design an AI-powered system that assists security engineers with vulnerability triage,
enrichment, risk assessment and remediation workflows — without giving the LLM
uncontrolled access to infrastructure.

## Reference Architecture

```
                         User
                           │
                           ▼
                    ┌─────────────┐
                    │   Web/API   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ AI Security │
                    │    Agent    │
                    └──────┬──────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          RAG         Tool Layer       Policy
             │             │             │
             ▼             │             ▼
       Vector DB            │        RBAC / Approval
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
        CVE API          Assets             Jira
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                           ▼
                     Audit Logging
```

## Key Components

### 1. Web/API layer
FastAPI backend exposing endpoints for triage, tickets and knowledge search.
Validates input, authenticates users, applies RBAC.

### 2. AI Security Agent
The orchestration core. Loop:

```
LLM → tool_choice → validation → execution → result → LLM
```

The agent never executes arbitrary code or arbitrary HTTP requests.
It can only call a fixed set of typed, validated tools.

### 3. RAG (Retrieval-Augmented Generation)
Grounds the LLM in the security knowledge base (CVE, CWE, OWASP, CIS, playbooks).
Every recommendation must reference its sources.

### 4. Tool Layer
Typed tools with strict Pydantic schemas:

```python
get_asset(asset_id: str)
create_ticket(title: str, priority: str, ...)
```

NOT:

```python
execute(command: str)
```

### 5. Policy Layer
- RBAC (viewer / analyst / security_engineer / admin)
- Human approval for dangerous operations
- Rate limiting, input/output validation

### 6. Integrations
- CVE API (enrichment)
- Asset inventory
- Jira (ticket lifecycle)

### 7. Audit Logging
Every agent action is logged as structured JSON.

## Design Decisions / Trade-offs

| Decision | Rationale |
|---|---|
| No arbitrary code execution | Prevents prompt-injection → RCE escalation |
| Typed tools + Pydantic validation | Catches malformed/forged tool calls before execution |
| Human approval for high-risk tools | Adds a human gate to irreversible actions |
| RBAC on tools | Least privilege per role |
| RAG sources shown in output | Traceability and trust |

## Related

- [Threat Model](threat-model.md)
- [Trust Boundaries](trust-boundaries.md)
- [Agent Architecture](../agents/architecture.md)
- [RAG Architecture](../rag/architecture.md)
