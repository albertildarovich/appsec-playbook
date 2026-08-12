"""Structured audit logging (structlog → JSON).

Status: skeleton (Phase 0). Every agent action is logged here in later phases.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings


def setup_logging() -> None:
    """Configure structlog with JSON rendering for audit events."""
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    )


def audit_logger() -> structlog.stdlib.BoundLogger:
    """Return a structlog logger bound with the service name."""
    return structlog.get_logger(service=settings.app_name)
