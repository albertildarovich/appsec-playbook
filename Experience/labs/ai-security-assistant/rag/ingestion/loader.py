"""Document loaders for the knowledge base.

Status: skeleton (Phase 0). Implemented in Phase 2.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class RawDocument:
    """A document before chunking."""

    source: str
    doc_type: str  # cve | cwe | owasp | cis | internal | playbook
    title: str
    content: str
    trust_level: str = "external"  # internal | external
    metadata: dict = field(default_factory=dict)


def load_markdown(path: str, doc_type: str) -> RawDocument:
    """Load a markdown file from the knowledge base."""
    raise NotImplementedError("Phase 2")


def load_json_cve(data: dict) -> RawDocument:
    """Build a document from CVE JSON data."""
    raise NotImplementedError("Phase 2")
