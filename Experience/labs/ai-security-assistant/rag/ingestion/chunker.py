"""Structure-aware chunking.

Status: skeleton (Phase 0). Implemented in Phase 2.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Chunk:
    """A searchable text chunk with provenance."""

    doc_type: str
    source: str
    title: str
    content: str
    chunk_index: int = 0
    trust_level: str = "external"
    metadata: dict = None  # type: ignore[assignment]


def chunk_document(document, chunk_size: int = 800, overlap: int = 100) -> list[Chunk]:
    """Split a document into overlapping chunks (structure-aware)."""
    raise NotImplementedError("Phase 2")
