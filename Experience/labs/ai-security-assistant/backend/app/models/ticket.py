"""Ticket domain model (Jira-like)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import StrEnum

from pydantic import BaseModel, Field


class TicketPriority(StrEnum):
    """Ticket priority."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketStatus(StrEnum):
    """Ticket lifecycle status."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    CLOSED = "closed"
    REJECTED = "rejected"


class Ticket(BaseModel):
    """A remediation ticket."""

    id: str | None = None
    key: str | None = None  # e.g. "SEC-123"
    title: str
    description: str = ""
    priority: TicketPriority
    asset_id: str | None = None
    cve_id: str | None = None
    remediation: str | None = None
    status: TicketStatus = TicketStatus.OPEN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    due_at: datetime | None = None
    reporter: str | None = None

    @classmethod
    def with_deadline(cls, priority: TicketPriority, **kwargs: object) -> "Ticket":
        """Create a ticket with a remediation deadline derived from priority.

        P1/critical → 24h, high → 72h, medium → 7d, low → 30d.
        """
        hours_by_priority = {
            TicketPriority.CRITICAL: 24,
            TicketPriority.HIGH: 72,
            TicketPriority.MEDIUM: 24 * 7,
            TicketPriority.LOW: 24 * 30,
        }
        ticket = cls(priority=priority, **kwargs)
        ticket.due_at = datetime.now(timezone.utc) + timedelta(hours=hours_by_priority[priority])
        return ticket
