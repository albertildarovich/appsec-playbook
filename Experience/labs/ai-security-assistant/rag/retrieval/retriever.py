"""Retriever — vector similarity + metadata filtering (pgvector).

Status: skeleton (Phase 0). Implemented in Phase 2.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RetrievedChunk:
    """A chunk returned by retrieval."""

    content: str
    source: str
    doc_type: str
    title: str
    score: float


def search(query: str, doc_types: list[str] | None = None, top_k: int = 5, min_trust: str = "external") -> list[RetrievedChunk]:
    """Search the knowledge base and return top-k chunks.

    `min_trust` filters out chunks below a trust level (permission filtering).
    """
    raise NotImplementedError("Phase 2")
