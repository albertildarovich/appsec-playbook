# AI Security

> **Applying AI/LLM to security engineering — and securing the AI systems themselves.**

This section documents how LLMs, RAG, AI agents and MCP can be applied to infrastructure
security: vulnerability triage, enrichment, risk assessment, remediation recommendations and
ticketing workflows.

The section is split into two complementary perspectives:

| Perspective | Focus |
|---|---|
| **Building with AI** | How to design LLM pipelines, RAG knowledge bases, agents and MCP servers for security tasks (`llm/`, `rag/`, `agents/`, `mcp/`) |
| **Securing AI** | How to protect the AI system itself: prompt injection, data leakage, excessive agency, RBAC, human approval (`security/`) |

## Why AI in Security?

- Vulnerability triage is high-volume, repetitive work that can be partially automated.
- LLMs can enrich CVEs with context (CWE, CVSS, exploitability) faster than manual analysis.
- RAG grounds model output in trusted security knowledge instead of relying on the model's memory.
- Agents with **controlled tool access** can create tickets, look up assets and propose remediation —
  as long as their permissions are tightly scoped and audited.

## The Core Design Principle

> **The LLM must never get uncontrolled access to infrastructure.**
> The agent operates through a small set of typed tools with RBAC, parameter validation,
> audit logging and human approval for dangerous operations.

This is the difference between an "AI assistant" and a secure "AI agent".

## Section Map

```
ai-security/
├── architecture/   High-level architecture, threat model, trust boundaries
├── llm/            LLM basics, prompting, structured output, tool calling
├── rag/            RAG architecture, ingestion, retrieval
├── agents/         Agent architecture, permissions, human approval
├── mcp/            MCP server architecture, tools, security model
├── security/       Prompt injection, data leakage, excessive agency, privilege escalation
└── project/        Hands-on project: AI Security Assistant (code + lessons learned)
```

## Hands-on Project

The theory in this section is backed by a working implementation:

**[`Experience/labs/ai-security-assistant/`](../../Experience/labs/ai-security-assistant/)**

A production-oriented AI agent for vulnerability management and security operations,
combining LLM, RAG, tool calling, MCP, RBAC, human approval and audit logging.
