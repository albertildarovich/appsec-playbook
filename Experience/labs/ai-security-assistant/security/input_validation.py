"""Input validation — every boundary validates before processing.

Status: skeleton (Phase 0). Extended in Phase 4.
"""

from __future__ import annotations

import re

_CVE_PATTERN = re.compile(r"^CVE-\d{4}-\d{4,}$")


def is_valid_cve(cve_id: str) -> bool:
    """Validate a CVE identifier format."""
    return bool(_CVE_PATTERN.match(cve_id))


def sanitize_text(text: str, max_length: int = 100_000) -> str:
    """Cap untrusted input size to bound prompt/context usage."""
    return text[:max_length]
