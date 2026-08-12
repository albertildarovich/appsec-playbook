# Threat Model — AI-Specific Threats

> Status: skeleton (Phase 0). To be completed in later phases.

## Why a Separate Threat Model

General threat modeling covers the platform (API, DB, network). AI systems add a new
threat surface: the **model itself** becomes an attack vector and an unwitting executor.

## AI-Specific Threat Taxonomy

| # | Threat | Category | Example |
|---|---|---|---|
| A1 | Direct prompt injection | Manipulation | User injects instructions into a query |
| A2 | Indirect prompt injection | Manipulation | Malicious RAG document controls the agent |
| A3 | Jailbreaking | Manipulation | Model refuses less → attacker bypasses |
| A4 | Data exfiltration via output | Leakage | Model returns secrets found in context |
| A5 | Tool abuse | Escalation | Injection triggers dangerous tool calls |
| A6 | Agent loop abuse | DoS/cost | Infinite tool loop burns budget |
| A7 | Model hallucination in security advice | Integrity | Wrong remediation recommendation |
| A8 | Training/supply-chain compromise | Integrity | Compromised model or dependency |
| A9 | RAG poisoning | Integrity | Malicious docs ingested into the KB |
| A10 | Prompt-side authorization bypass | Escalation | "You are admin now" instructions |

## Control Mapping

| Threat | Primary control |
|---|---|
| A1, A2 | Untrusted-data framing, injection detection, tool allowlist |
| A3 | Defense-in-depth, output validation, red teaming |
| A4 | Secret redaction, output validation, retrieval filtering |
| A5 | RBAC, human approval, allowlist |
| A6 | Max turns, budget caps |
| A7 | RAG grounding, source citation, confidence scores |
| A8 | Dependency pinning, SBOM, model provenance |
| A9 | Ingestion review, content hashing, trust levels |
| A10 | Server-side RBAC (permissions are not prompt-controllable) |

## Methodology

1. Enumerate attack surfaces (input, retrieved context, tool results, integrations).
2. Map MITRE ATLAS techniques where applicable.
3. Design red-team test scenarios (Phase 4).
4. Measure detection rates (Phase 6 evaluation).

## TODO

- [ ] Expand with MITRE ATLAS mappings
- [ ] Add per-attack-surface abuse cases
- [ ] Link to evaluation dataset scenarios
