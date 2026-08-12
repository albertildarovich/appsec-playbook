# Implementation Notes

> Status: skeleton (Phase 0). Filled in as phases 1–6 land.

## Phase Tracker

| Phase | Scope | Key files | Status |
|---|---|---|---|
| 1 | LLM abstraction, structured triage output | `llm/*.py`, `backend/app/api/routes/triage.py` | planned |
| 2 | RAG ingestion + retrieval, knowledge seed | `rag/*.py` | planned |
| 3 | Agent loop, tools, tool registry | `agent/*.py` | planned |
| 4 | Security controls + audit | `security/*.py`, `backend/app/core/*` | planned |
| 5 | MCP server | `mcp-server/*.py` | planned |
| 6 | Jira integration + evaluation | `integrations/*.py`, `evaluation/*.py` | planned |

## Conventions

- Python 3.11+, strict type hints.
- Pydantic v2 models for all boundaries (API, tools, agent loop).
- Structured JSON logging via `structlog`.
- Every external call goes through `httpx` async client.
- Tests: `pytest` + `pytest-asyncio`; security tests in `tests/test_security/`.

## What "Done" Means Per Phase

- Phase 1: `POST /triage` returns schema-validated JSON for a real CVE.
- Phase 2: query against seeded knowledge base returns chunks with sources.
- Phase 3: end-to-end CVE → enrichment → risk → ticket proposal flow.
- Phase 4: red-team tests pass (injection, leakage, escalation).
- Phase 5: MCP client (MCP Inspector) can call security tools.
- Phase 6: evaluation report with detection rates.

## Known Constraints / Assumptions

- LLM API keys are provided via environment variables (never committed).
- Jira integration targets a Jira-like API (mockable for tests).
- pgvector runs in Docker Compose for local development.
- The project targets demonstration + evaluation, not production workload scale.

## Related

- [Architecture](architecture.md)
- [Attack Scenarios](attack-scenarios.md)
