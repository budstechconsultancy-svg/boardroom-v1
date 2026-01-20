"""
BoardRoom Shared Configuration Module.

Handles all environment-based configuration using Pydantic Settings.
"""

from functools import lru_cache
from typing import Literal, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database configuration."""
    
    url: str = Field(
        default="mysql+pymysql://boardroom:boardroom@localhost:3306/boardroom",
        alias="DATABASE_URL"
    )
    pool_size: int = Field(default=20, alias="DATABASE_POOL_SIZE")
    max_overflow: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")
    echo: bool = Field(default=False, alias="DATABASE_ECHO")


class RedisSettings(BaseSettings):
    """Redis configuration."""
    
    url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")


class MilvusSettings(BaseSettings):
    """Milvus vector database configuration."""
    
    host: str = Field(default="localhost", alias="MILVUS_HOST")
    port: int = Field(default=19530, alias="MILVUS_PORT")


class S3Settings(BaseSettings):
    """S3-compatible storage configuration."""
    
    endpoint: str = Field(default="http://localhost:9000", alias="S3_ENDPOINT")
    access_key: str = Field(default="minioadmin", alias="S3_ACCESS_KEY")
    secret_key: str = Field(default="minioadmin", alias="S3_SECRET_KEY")
    bucket_snapshots: str = Field(default="boardroom-snapshots", alias="S3_BUCKET_SNAPSHOTS")
    bucket_artifacts: str = Field(default="boardroom-artifacts", alias="S3_BUCKET_ARTIFACTS")


class KafkaSettings(BaseSettings):
    """Kafka message queue configuration."""
    
    bootstrap_servers: str = Field(
        default="localhost:9092",
        alias="KAFKA_BOOTSTRAP_SERVERS"
    )


class LLMSettings(BaseSettings):
    """LLM provider configuration."""
    
    provider: Literal["openai", "azure", "anthropic", "local"] = Field(
        default="openai",
        alias="LLM_PROVIDER"
    )
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4-turbo", alias="OPENAI_MODEL")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        alias="OPENAI_EMBEDDING_MODEL"
    )
    azure_endpoint: Optional[str] = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_api_key: Optional[str] = Field(default=None, alias="AZURE_OPENAI_API_KEY")
    azure_deployment: Optional[str] = Field(default=None, alias="AZURE_OPENAI_DEPLOYMENT")


class AuthSettings(BaseSettings):
    """Authentication configuration."""
    
    oidc_issuer_url: str = Field(
        default="https://your-identity-provider.com",
        alias="OIDC_ISSUER_URL"
    )
    oidc_client_id: str = Field(default="boardroom-client", alias="OIDC_CLIENT_ID")
    oidc_client_secret: str = Field(default="", alias="OIDC_CLIENT_SECRET")
    jwt_algorithm: str = Field(default="RS256", alias="JWT_ALGORITHM")
    jwt_expiry_minutes: int = Field(default=60, alias="JWT_EXPIRY_MINUTES")
    secret_key: str = Field(default="change-me-in-production", alias="SECRET_KEY")


class TenantSettings(BaseSettings):
    """Multi-tenancy configuration."""
    
    default_plan: Literal["smb", "growth", "enterprise"] = Field(
        default="smb",
        alias="DEFAULT_TENANT_PLAN"
    )
    isolation_level: Literal["database", "schema", "row"] = Field(
        default="row",
        alias="TENANT_ISOLATION_LEVEL"
    )


class AgentSettings(BaseSettings):
    """Agent runtime configuration."""
    
    max_rounds: int = Field(default=3, alias="AGENT_MAX_ROUNDS")
    round_timeout_seconds: int = Field(default=60, alias="AGENT_ROUND_TIMEOUT_SECONDS")
    quorum_percentage: int = Field(default=60, alias="AGENT_QUORUM_PERCENTAGE")
    ceo_mode: Literal["ai", "human", "hybrid"] = Field(default="hybrid", alias="CEO_MODE")


class ExecutionSettings(BaseSettings):
    """Execution policy configuration."""
    
    default_mode: Literal["read_only", "low_auto", "full_auto"] = Field(
        default="read_only",
        alias="DEFAULT_EXECUTION_MODE"
    )
    low_risk_auto_execute: bool = Field(default=True, alias="LOW_RISK_AUTO_EXECUTE")
    rollback_window_minutes: int = Field(default=60, alias="ROLLBACK_WINDOW_MINUTES")


class AuditSettings(BaseSettings):
    """Audit and compliance configuration."""
    
    retention_days: int = Field(default=2555, alias="AUDIT_RETENTION_DAYS")  # 7 years
    hash_algorithm: str = Field(default="sha256", alias="AUDIT_HASH_ALGORITHM")
    pdf_signing_enabled: bool = Field(default=True, alias="PDF_SIGNING_ENABLED")
    pdf_signing_certificate_path: Optional[str] = Field(
        default=None,
        alias="PDF_SIGNING_CERTIFICATE_PATH"
    )


class ObservabilitySettings(BaseSettings):
    """Observability configuration."""
    
    prometheus_enabled: bool = Field(default=True, alias="PROMETHEUS_ENABLED")
    prometheus_port: int = Field(default=9090, alias="PROMETHEUS_PORT")
    otlp_endpoint: Optional[str] = Field(default=None, alias="OTLP_ENDPOINT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: Literal["json", "text"] = Field(default="json", alias="LOG_FORMAT")


class Settings(BaseSettings):
    """Main application settings aggregating all configuration."""
    
    # Application
    app_name: str = Field(default="BoardRoom", alias="APP_NAME")
    app_env: Literal["development", "staging", "production"] = Field(
        default="development",
        alias="APP_ENV"
    )
    debug: bool = Field(default=True, alias="DEBUG")
    
    # Sub-configurations
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    milvus: MilvusSettings = Field(default_factory=MilvusSettings)
    s3: S3Settings = Field(default_factory=S3Settings)
    kafka: KafkaSettings = Field(default_factory=KafkaSettings)
    llm: LLMSettings = Field(default_factory=LLMSettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)
    tenant: TenantSettings = Field(default_factory=TenantSettings)
    agent: AgentSettings = Field(default_factory=AgentSettings)
    execution: ExecutionSettings = Field(default_factory=ExecutionSettings)
    audit: AuditSettings = Field(default_factory=AuditSettings)
    observability: ObservabilitySettings = Field(default_factory=ObservabilitySettings)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience function for accessing settings
settings = get_settings()
