# RAG Ingestion

> Status: skeleton (Phase 0). To be completed in later phases.

## Goal

Turn raw security documents into indexed, searchable chunks in a vector database —
with provenance so every retrieved chunk can be cited.

## Ingestion Pipeline

```
source document → normalize → chunk → embed → store (with metadata)
```

## Steps

### 1. Loading
Support for the formats in the knowledge base:

| Format | Loader |
|---|---|
| Markdown (`.md`) | Markdown loader, structure-aware |
| JSON (CVE data, scanner output) | JSON loader |
| Plain text / YAML (playbooks) | Text loader |

### 2. Chunking

| Parameter | Typical value | Rationale |
|---|---|---|
| Chunk size | 500–800 tokens | Fits context, good retrieval precision |
| Overlap | 50–100 tokens | Preserves boundary context |
| Strategy | Structure-aware | Split on headings, keep sections coherent |

### 3. Embedding
- Embedding model with fixed dimensionality (e.g. 1536 or 768).
- Content + metadata (source file, section, doc type) stored together.

### 4. Vector Storage (pgvector)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
    id          BIGSERIAL PRIMARY KEY,
    doc_type    TEXT NOT NULL,          -- 'cve' | 'cwe' | 'owasp' | 'cis' | 'internal' | 'playbook'
    source      TEXT NOT NULL,          -- original file path / URL
    title       TEXT,
    content     TEXT NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}',
    embedding   vector(1536) NOT NULL
);
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
```

### 5. Provenance & Trust

Every chunk carries:
- `source` — where the text came from (URL / file)
- `ingested_at` — versioning
- `trust_level` — e.g. internal policy (trusted) vs external blog (untrusted)
- `content_hash` — for poisoning detection / tampering

## Security Considerations

- **RAG poisoning:** external sources must be reviewed before ingestion.
- **Untrusted docs:** all retrieved content is treated as data, not instructions.
- **Sensitive content:** internal docs may contain non-public info; retrieval results
  must be permission-filtered before going to the LLM.

## TODO

- [ ] Implement loader/chunker/embedder (Phase 2)
- [ ] Seed knowledge base with CVE/CWE/OWASP/playbook samples
- [ ] Add idempotent re-ingestion (upsert by content_hash)
