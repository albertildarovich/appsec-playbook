"""Asset domain model."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class AssetCriticality(StrEnum):
    """Business criticality of an asset."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Environment(StrEnum):
    """Deployment environment."""

    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


class Asset(BaseModel):
    """An infrastructure asset (host, service, container, ...)."""

    id: str
    name: str
    asset_type: str = Field(default="service", description="service | host | container | database | ...")
    environment: Environment
    criticality: AssetCriticality
    owner_team: str | None = None
    tags: dict[str, str] = Field(default_factory=dict)
