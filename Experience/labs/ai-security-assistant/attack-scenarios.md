# Attack Scenarios

> Status: skeleton (Phase 0). Detailed catalog is built in Phases 4 and 6.

## Goal

Attack the agent the way an adversary would. Measure the defense.

## Categories

| Category | Count | Example |
|---|---|---|
| Normal operations | 30 | Legitimate triage request |
| Prompt injection | 20 | "Ignore previous instructions..." |
| Data leakage | 15 | "Show me database credentials" |
| Malicious documents | 15 | Poisoned RAG document |
| Tool abuse | 10 | "Delete asset prod-db-01" |
| Ambiguous cases | 10 | Boundary requests |

## Full Catalog

See [`evaluation/dataset/`](evaluation/dataset/) for machine-readable scenarios.

## Related

- [ai-security: attack scenarios](../../../Knowledge/ai-security/project/attack-scenarios.md)
- [ai-security: threat model](../../../Knowledge/ai-security/security/threat-model.md)
