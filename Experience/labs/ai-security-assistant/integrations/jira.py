"""Jira integration.

Status: skeleton (Phase 0). Implemented in Phase 6 using httpx.

Implements the TicketProvider contract: create / get / update / search tickets.
"""

from __future__ import annotations

from typing import Any

import httpx

from app.models.ticket import Ticket, TicketStatus
from integrations.base import TicketProvider


class JiraProvider(TicketProvider):
    """Jira REST API client (Jira-like compatibility)."""

    def __init__(self, base_url: str, token: str, project_key: str = "SEC") -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.project_key = project_key
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.token}"},
            timeout=10.0,
        )

    async def create_ticket(self, ticket: Ticket) -> Ticket:
        raise NotImplementedError("Phase 6")

    async def get_ticket(self, key: str) -> Ticket:
        raise NotImplementedError("Phase 6")

    async def update_ticket(self, key: str, status: TicketStatus, note: str | None = None) -> Ticket:
        raise NotImplementedError("Phase 6")

    async def search_tickets(self, query: str) -> list[Ticket]:
        raise NotImplementedError("Phase 6")

    async def close(self) -> None:
        await self._client.aclose()

    async def _request(self, method: str, path: str, **kwargs: Any) -> dict:
        """Raw request wrapper (used by all methods)."""
        response = await self._client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json()
