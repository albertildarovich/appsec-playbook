# Security Controls

> Deterministic (non-LLM) controls enforced at every boundary of the system.

| Module | Control | Enforced at |
|---|---|---|
| `rbac.py` | Tool → role matrix, default deny | Agent loop, API, MCP server |
| `secret_redaction.py` | DLP: masks API keys, passwords, tokens | LLM output, audit logs |
| `prompt_injection_detector.py` | Heuristic detection of injection patterns | Input, retrieved context |
| `input_validation.py` | CVE format, input size caps | API boundary |
| `output_validation.py` | Rejects outputs containing protected data | Before returning to user |

## Design Principle

> **Redaction and permission checks must never depend on the LLM.**
> The model can be tricked; deterministic controls cannot.

Related: [theory](../../../../Knowledge/ai-security/security/prompt-injection.md)
