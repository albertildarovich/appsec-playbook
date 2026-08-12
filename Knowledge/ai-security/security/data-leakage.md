# Data Leakage Prevention

> Status: skeleton (Phase 0). To be completed in later phases.

## Problem

The agent handles sensitive data: credentials in scanner output, internal infrastructure
metadata, PII. The model might echo this data back — especially if a prompt injection
asks it to. The system must prevent leakage **regardless of what the model does**.

## What Must Be Protected

| Data class | Examples |
|---|---|
| Secrets | API keys, tokens, passwords, private keys |
| PII | Emails, names, phone numbers |
| Internal metadata | Hostnames, IPs, asset inventory details (per policy) |
| Credentials in context | `AWS_SECRET_KEY=...`, JWT tokens in logs |

## Controls

### 1. Secret Redaction (deterministic, applied to outputs)

```text
API_KEY=sk-xxxxxxxxxxxxx
        ↓
API_KEY=[REDACTED]
```

Applied at:
- LLM output (before returning to the user)
- Audit logs (never write secrets)
- Tool results injected back into the prompt

### 2. Detection Patterns
- Regex for common secret formats (API keys, JWTs, AWS keys, connection strings).
- Entropy-based detection for high-entropy strings.
- Deny-lists for known internal domains / hostnames.

### 3. Output Validation
- Structured output schemas don't allow arbitrary secret fields.
- A post-processing layer rejects outputs that match secret patterns.

### 4. Retrieval Filtering
- RAG chunks are permission-filtered before entering the prompt.
- Internal docs are only retrievable by authorized roles.

## Design Rule

> Redaction must be **deterministic and independent of the LLM**.
> The model can be tricked; regex and filters cannot.

## TODO

- [ ] Implement `secret_redaction.py` (Phase 4)
- [ ] Build a secret corpus for testing
- [ ] Add tests: model output containing secrets → redacted
- [ ] Verify audit logs contain no secrets
