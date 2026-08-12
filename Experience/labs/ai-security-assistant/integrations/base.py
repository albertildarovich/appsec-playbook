"""Base classes for external integrations.

Status: skeleton (Phase 0). Implemented in Phase 6.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.ticket import Ticket, TicketStatus


class TicketProvider(ABC):
    """Ticketing system abstraction (Jira-like)."""

    @abstractmethod
    async def create_ticket(self, ticket: Ticket) -> Ticket:
        """Create a ticket; returns the ticket with the provider key set."""
        raise NotImplementedError

    @abstractmethod
    async def get_ticket(self, key: str) -> Ticket:
        raise NotImplementedError

    @abstractmethod
    async def update_ticket(self, key: str, status: TicketStatus, note: str | None = None) -> Ticket:
        raise NotImplementedError

    @abstractmethod
    async def search_tickets(self, query: str) -> list[Ticket]:
        raise NotImplementedError
