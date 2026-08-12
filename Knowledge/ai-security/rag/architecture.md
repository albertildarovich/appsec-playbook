# RAG Architecture for Security Knowledge

> Status: skeleton (Phase 0). To be completed in later phases.

## What Is RAG?

Retrieval-Augmented Generation grounds the LLM in external documents instead of relying
on its training data:

```text
Question
   ↓
Retriever
   ↓
Relevant security documents
   ↓
LLM
   ↓
Answer + Sources
```

## Why RAG for Security

- The model's training data is stale and incomplete for CVEs, CIS benchmarks, playbooks.
- Security answers must be **traceable to sources** (compliance, audit, trust).
- The knowledge base is owned and versioned by the team.
- RAG reduces hallucinations for high-stakes recommendations.

## Knowledge Base Structure

```
knowledge/
├── cve/          # CVE descriptions, enrichment
├── cwe/          # CWE definitions, taxonomy
├── owasp/        # OWASP Top 10, ASVS, API Security
├── cis/          # CIS Benchmarks
├── internal/     # internal policies, standards
└── playbooks/    # security playbooks, remediation guides
```

## Pipeline

```
Raw documents → loader → chunker → embedder → vector DB
                                                ↑
        User query → embed → similarity search → re-rank → prompt context
```

## Components

### Ingestion
- Loaders per format (markdown, json, pdf)
- Chunking strategy (size, overlap, structure-aware)
- Embedding model + vector DB (PostgreSQL + pgvector)

### Retrieval
- Embedding similarity search
- Optional: hybrid (keyword + vector), re-ranking
- Metadata filtering (by source type, domain)

### Prompting
- Retrieved chunks are injected as **untrusted data** with source citations

## Why PostgreSQL + pgvector for MVP

- One less system to operate (reuse existing Postgres).
- SQL metadata filtering out of the box.
- Good enough retrieval quality for a knowledge base of this size.
- Can move to a dedicated vector DB (Qdrant, Milvus) later without changing the interface.

## Related

- [Ingestion](ingestion.md)
- [Retrieval](retrieval.md)
- [Trust Boundaries](../architecture/trust-boundaries.md)
