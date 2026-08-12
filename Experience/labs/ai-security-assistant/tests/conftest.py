"""Shared pytest fixtures.

Status: skeleton (Phase 0). Fixtures are added as features land.
"""

from __future__ import annotations

import pytest


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
