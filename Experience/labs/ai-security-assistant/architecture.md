# Architecture — AI Security Assistant

> Status: skeleton (Phase 0).

## High-Level View

```
                         User
                           │
                           ▼
                    ┌─────────────┐
                    │   Web/API   │  FastAPI + Pydantic
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ AI Security │  agent loop
                    │    Agent    │
                    └──────┬──────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          RAG         Tool Layer       Policy
             │             │             │
             ▼             │             ▼
       pgvector            │        RBAC / Approval
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

## Runtime Components

| Component | Responsibility |
|---|---|
| `backend/` | HTTP API, auth, RBAC, request validation, triage endpoints |
| `llm/` | Provider abstraction — OpenAI / Anthropic / local |
| `agent/` | Orchestrates LLM + tools, validates calls, manages approval |
| `rag/` | Knowledge ingestion, retrieval, permission filtering |
| `security/` | Redaction, injection detection, output validation, policy |
| `integrations/` | CVE API, assets, Jira |
| `mcp-server/` | Exposes tools via MCP protocol |

## Data Flow — Triage Example

```
1. POST /triage {cve_id, asset_id, scanner_output}
2. API validates input, resolves user role
3. Agent enriches: get_cve → RAG search → calculate_risk
4. Agent proposes: priority, remediation (with sources)
5. If ticket creation requested → human approval
6. create_ticket → Jira
7. Audit log written for every step
```

## Security Architecture

See the [security controls](security/README.md) — RBAC, approval, redaction,
injection defense, audit logging are enforced at every boundary.

## Related

- [Theory: architecture](../../../Knowledge/ai-security/architecture/architecture.md)
- [Theory: threat model](../../../Knowledge/ai-security/architecture/threat-model.md)
- [Theory: trust boundaries](../../../Knowledge/ai-security/architecture/trust-boundaries.md)
