# Knowledge Base

This directory holds the source documents used by the RAG pipeline.
Documents are organized by type — each type maps to a retrieval filter.

```
knowledge/
├── cve/          # CVE descriptions and enrichment data
├── cwe/          # CWE definitions and taxonomy
├── owasp/        # OWASP Top 10, ASVS, API Security guidance
├── cis/          # CIS Benchmarks summaries
├── internal/     # internal security policies and standards (trusted, permission-filtered)
└── playbooks/    # security playbooks and remediation guides
```

## Trust Levels

| Level | Source | Retrieval visibility |
|---|---|---|
| `external` | Public: CVE, CWE, OWASP, CIS, playbooks | All roles |
| `internal` | Internal policies | Analyst+ (permission filtered) |

## Status

Phase 0: structure only. Documents are seeded in Phase 2.
