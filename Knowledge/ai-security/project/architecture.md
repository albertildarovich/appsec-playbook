# Project Architecture — AI Security Assistant

> Status: skeleton (Phase 0). Full details as each phase lands.

## System Overview

```
 User ──▶ FastAPI ──▶ Security Agent ──▶ Tools ──▶ Integrations
                     │                     │
                     ├── RAG (pgvector)    ├── CVE API
                     ├── LLM (provider)    ├── Assets
                     ├── Policy (RBAC)     └── Jira
                     └── Audit Log
```

## Repository Layout

```
backend/       FastAPI application (API, models, schemas, core)
llm/           LLM provider abstraction (OpenAI / Anthropic / local)
agent/         Agent loop, tool registry, approval workflow
rag/           Ingestion + retrieval + knowledge base
mcp-server/    MCP server exposing security tools
integrations/  Jira / external integrations
security/      Security controls (redaction, validation, RBAC, injection detection)
evaluation/    Evaluation dataset + metrics
tests/         Test suite
```

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| FastAPI + Pydantic | Typed validation at every boundary |
| LLM provider abstraction | Not locked to one vendor |
| Own agent loop (no LangChain first) | Understand the architecture, add frameworks later |
| PostgreSQL + pgvector | Fewer moving parts for MVP, SQL filtering |
| Security as a module, not an afterthought | RBAC/redaction/audit are first-class |
| Single tool implementation for API + MCP | Consistent behavior across surfaces |

## Component Responsibilities

### backend/
- Authentication, sessions, RBAC at the API layer
- Input validation before anything touches the agent
- Serve triage, tickets, knowledge endpoints

### agent/
- Orchestrates the LLM + tools loop
- Tool registry with strict schemas
- Approval workflow for high-risk tools

### rag/
- Loads knowledge docs → chunks → embeds → stores in pgvector
- Retrieves + permission-filters context for the LLM

### security/
- Secret redaction, prompt-injection detection, output validation
- Policy definitions (tool → roles) shared with agent and MCP

### mcp-server/
- Exposes the same tools via the MCP protocol

## Related

- [ai-security architecture](../../ai-security/architecture/architecture.md)
- [Threat Model](../../ai-security/architecture/threat-model.md)
- [Implementation](implementation.md)
