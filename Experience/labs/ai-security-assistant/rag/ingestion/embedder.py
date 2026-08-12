"""Embedding — text → vector.

Status: skeleton (Phase 0). Implemented in Phase 2.
"""

from __future__ import annotations


def embed_text(text: str) -> list[float]:
    """Return an embedding vector for the given text."""
    raise NotImplementedError("Phase 2")


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Return embeddings for a batch of texts."""
    raise NotImplementedError("Phase 2")
