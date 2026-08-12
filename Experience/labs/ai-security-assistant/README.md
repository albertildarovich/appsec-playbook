# AI Security Assistant

> **Production-oriented AI agent for automating vulnerability management and security operations.**

The system combines **LLM, RAG, tool calling and MCP** to assist security engineers with
vulnerability triage, threat analysis and remediation workflows.

**Security is treated as a first-class architectural concern:**
least privilege, RBAC, human approval, prompt-injection protection, data-loss prevention
and comprehensive audit logging.

## Core Principle

> The LLM never gets direct, uncontrolled access to infrastructure.
> The agent works through a small set of typed tools with RBAC, parameter validation,
> audit logging and human approval for dangerous operations.

## Capabilities

| Capability | Description |
|---|---|
| Vulnerability Triage | CVE → enrichment → impact → risk → priority → remediation |
| RAG Knowledge Base | Grounded answers with source citations (CVE/CWE/OWASP/CIS/playbooks) |
| Security Agent | Controlled tool calling with typed schemas and RBAC |
| Jira Integration | Ticket lifecycle with human approval |
| MCP Server | Security tools exposed over the Model Context Protocol |
| Audit Logging | Every action logged as structured JSON |

## Security Controls

- **RBAC** — viewer / analyst / security_engineer / admin
- **Human approval** — for dangerous or irreversible actions
- **Prompt-injection defense** — untrusted-data framing + detection
- **Secret redaction** — deterministic DLP on outputs and logs
- **Tool allowlist** — no arbitrary code or HTTP execution
- **Audit logging** — full trail of user → tool → result

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

## Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Repo structure + docs skeleton | ✅ |
| 1 | LLM abstraction + triage API | 🔜 planned |
| 2 | RAG knowledge base | planned |
| 3 | Security agent + tools | planned |
| 4 | Security hardening | planned |
| 5 | MCP server | planned |
| 6 | Jira lifecycle + evaluation | planned |

## Getting Started

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the API server (app lives in backend/)
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000

# 4. Open Swagger UI
# http://127.0.0.1:8000/docs

# 5. Run the security-controls demo
PYTHONPATH=.:backend python scripts/demo_security.py

# 6. Run tests
pytest
```

### What's already runnable (Phase 0)

- `GET /health` — liveness probe.
- `GET /docs` — Swagger UI (auto-generated from FastAPI).
- `scripts/demo_security.py` — interactive demo of RBAC, secret redaction,
  prompt-injection detection, tool schema validation and the approval workflow.
- `pytest` — 48 passing tests covering the security controls and domain models.


## Docs

- [Architecture](architecture.md)
- [Implementation](implementation.md)
- [Attack Scenarios](attack-scenarios.md)
- [Lessons Learned](lessons-learned.md)
- [Theory & Threat Model](../../../Knowledge/ai-security/README.md)
