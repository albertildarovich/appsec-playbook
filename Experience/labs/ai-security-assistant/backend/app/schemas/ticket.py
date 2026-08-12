"""Ticket API schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.ticket import Ticket, TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    """Payload for creating a ticket (always requires human approval in the agent)."""

    title: str = Field(min_length=1, max_length=500)
    description: str = ""
    priority: TicketPriority
    asset_id: str | None = None
    cve_id: str | None = None
    remediation: str | None = None


class TicketUpdate(BaseModel):
    """Fields that can be updated on an existing ticket."""

    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    description: str | None = None
    remediation: str | None = None


class TicketOut(BaseModel):
    """Ticket representation returned to clients."""

    model_config = {"from_attributes": True}

    key: str | None = None
    title: str
    description: str = ""
    priority: TicketPriority
    asset_id: str | None = None
    cve_id: str | None = None
    remediation: str | None = None
    status: TicketStatus
    due_at: object | None = None
    reporter: str | None = None

    @classmethod
    def from_model(cls, ticket: Ticket) -> "TicketOut":
        return cls(
            key=ticket.key,
            title=ticket.title,
            description=ticket.description,
            priority=ticket.priority,
            asset_id=ticket.asset_id,
            cve_id=ticket.cve_id,
            remediation=ticket.remediation,
            status=ticket.status,
            due_at=ticket.due_at.isoformat() if ticket.due_at else None,
            reporter=ticket.reporter,
        )
