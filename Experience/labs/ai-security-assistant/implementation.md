# Implementation

> Status: skeleton (Phase 0).

## Phases

| Phase | Scope | Status |
|---|---|---|
| 0 | Repo structure + docs skeleton | ✅ |
| 1 | LLM abstraction + structured triage | planned |
| 2 | RAG ingestion + retrieval | planned |
| 3 | Agent loop + tools | planned |
| 4 | Security controls + audit | planned |
| 5 | MCP server | planned |
| 6 | Jira + evaluation | planned |

## Conventions

- Python 3.11+, type hints everywhere.
- Pydantic v2 for every boundary.
- `structlog` JSON logging.
- `httpx` async client for external calls.
- `pytest` + `pytest-asyncio` for tests.

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI provider credential |
| `ANTHROPIC_API_KEY` | Anthropic provider credential |
| `DATABASE_URL` | PostgreSQL + pgvector connection |
| `JIRA_URL`, `JIRA_TOKEN` | Jira integration |
| `MCP_AUTH_TOKEN` | MCP server auth |

_(exact set will be finalized in Phase 1)_

## Related

- [Architecture](architecture.md)
- [ai-security: implementation notes](../../../Knowledge/ai-security/project/implementation.md)
