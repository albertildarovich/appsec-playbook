"""Application configuration.

Loaded from environment variables (see .env.example).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the AI Security Assistant."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "AI Security Assistant"

    # --- Database (pgvector) ---
    database_url: str = "postgresql+psycopg://ai_security:ai_security_dev@localhost:5432/ai_security"

    # --- LLM providers ---
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    llm_provider: str = "openai"  # openai | anthropic | local
    llm_model: str = "gpt-4o-mini"

    # --- Jira integration ---
    jira_url: str | None = None
    jira_token: str | None = None

    # --- MCP server ---
    mcp_auth_token: str | None = None

    # --- Agent limits ---
    agent_max_turns: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
