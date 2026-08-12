# Structured Output

> Status: skeleton (Phase 0). To be completed in later phases.

## Why Structured Output

Security workflows need machine-usable results: the triage result feeds a risk engine,
a ticket title feeds a Jira API. Free-text output must be re-parsed, which is fragile
and hard to validate. Structured output changes this:

```text
LLM
 ↓
JSON (validated against a Pydantic schema)
 ↓
typed object
```

## Example — Vulnerability Triage

```json
{
  "cve_id": "CVE-2021-44228",
  "severity": "critical",
  "cwe": "CWE-502",
  "cvss_score": 10.0,
  "vulnerability_type": "unauthenticated_remote_code_execution",
  "affected_assets": ["prod-log4j-app-01"],
  "impact": "Remote code execution without authentication",
  "recommended_priority": "P1",
  "remediation": "Upgrade log4j to 2.17.1 or later",
  "confidence": 0.95
}
```

## Implementation Approaches

| Approach | Description | Pros / Cons |
|---|---|---|
| Prompt-only JSON | Ask the model to emit JSON | Fragile, no guarantees |
| JSON schema / constrained decoding | Model constrained to schema | Strong guarantees, provider-specific |
| Tool-calling trick | Ask the model to "call" a tool that returns the object | Reuses robust tool-calling path |
| Validation layer | Parse + validate with Pydantic, re-ask on failure | Always needed as a safety net |

## Security Benefit

Structured output is not just a convenience — it is a **security control**:

- Validates types and enums (e.g. `priority` must be `P1`..`P4`).
- Rejects unexpected fields (blocks smuggled instructions).
- Makes output filtering (secret redaction, deny-lists) deterministic.
- Enables audit logging of structured decisions.

## TODO

- [ ] Implement schema-validated triage output (Phase 1)
- [ ] Add retry/refusal handling when the model produces invalid output
- [ ] Document provider-specific structured output APIs
