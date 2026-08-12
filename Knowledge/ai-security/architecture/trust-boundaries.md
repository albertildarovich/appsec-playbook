# Trust Boundaries — AI Security System

> Status: skeleton (Phase 0). To be completed in later phases.

## What Is a Trust Boundary?

A trust boundary is the point where data crosses from one trust domain into another.
Every crossing requires explicit security controls. In an AI security system there are
several critical boundaries that a naive chatbot implementation would ignore.

## Boundaries in This System

```
┌──────────────┐   B1   ┌──────────────┐   B2   ┌──────────────┐
│  User (UI)   │───────▶│  API Layer   │───────▶│   Agent      │
└──────────────┘        └──────────────┘        └──────┬───────┘
                    B3 untrusted data                  │ B4 tool
                       ◀───────────────────────────────┤ calls
                    ┌──────────────┐        ┌──────────▼────────┐
                    │ RAG docs     │        │ Tool layer /      │
                    │ (untrusted)  │        │ integrations      │
                    └──────────────┘        └───────────────────┘
```

### B1 — User → API
- **Trust:** user identity must be verified.
- **Controls:** authentication (API key / JWT), RBAC, rate limiting, input validation.

### B2 — API → Agent
- **Trust:** parameters must match strict schemas.
- **Controls:** Pydantic validation, allowlisted tool names, per-user permission checks.

### B3 — RAG context → LLM (indirect injection)
- **Trust:** retrieved documents are **untrusted data**, not instructions.
- **Controls:** document provenance tags, prompt framing ("the following is untrusted data"),
  injection detection on retrieved content, source citation.

### B4 — Agent → Tool Layer
- **Trust:** the LLM is **not trusted** to decide tool parameters freely.
- **Controls:** typed tool schemas, parameter validation, RBAC, human approval for
  high-risk tools, audit logging of every call.

### B5 — Tool Layer → External integrations (CVE API, Jira, assets)
- **Trust:** integration credentials are high-value assets.
- **Controls:** scoped credentials, allowlist of endpoints, response validation,
  egress allowlisting.

## Rules of Thumb

1. Data entering a boundary must be validated *inside* that boundary.
2. The LLM sits in the middle and is never given the keys to the kingdom.
3. Anything the LLM retrieves (RAG) is treated as untrusted input.
4. Tool calls are data — the agent loop must validate them as strictly as user input.
5. Every crossing is logged for audit.

## Related

- [Threat Model](threat-model.md)
- [Prompt Injection](../security/prompt-injection.md)
- [Excessive Agency](../security/excessive-agency.md)
