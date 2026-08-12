"""Output validation — reject dangerous or leaking model output.

Status: skeleton (Phase 0). Extended in Phase 4.

Runs AFTER redaction and BEFORE returning output to the user:
- no secret patterns
- no forbidden content (hostnames/IPs per policy)
- structured schemas already constrain shape (see schemas/)
"""

from __future__ import annotations

from security.secret_redaction import contains_secret


class OutputValidationError(Exception):
    """Raised when model output fails validation."""


def validate_output(text: str) -> str:
    """Validate model output; raise if it contains protected data."""
    if contains_secret(text):
        raise OutputValidationError("output contains protected data")
    return text
