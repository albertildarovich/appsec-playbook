"""Re-ranking — improve retrieval precision.

Status: skeleton (Phase 0). Optional component; implemented in Phase 2.
"""

from __future__ import annotations

from rag.retrieval.retriever import RetrievedChunk


def rerank(query: str, chunks: list[RetrievedChunk], top_k: int = 5) -> list[RetrievedChunk]:
    """Re-rank retrieved chunks for the query using a cross-encoder (optional)."""
    raise NotImplementedError("Phase 2 (optional)")
