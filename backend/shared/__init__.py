"""
BoardRoom Shared Package.

Contains shared utilities, models, and configuration used across all microservices.
"""

from .config import settings, get_settings
from .database import (
    Base,
    async_engine,
    sync_engine,
    AsyncSessionLocal,
    SyncSessionLocal,
    get_async_session,
    get_sync_session,
    init_database,
    close_database,
    TenantContext,
)
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    Role,
    Permission,
    get_permissions_for_roles,
    has_permission,
    field_encryption,
    compute_hash,
    pii_masker,
)

__all__ = [
    # Config
    "settings",
    "get_settings",
    # Database
    "Base",
    "async_engine",
    "sync_engine",
    "AsyncSessionLocal",
    "SyncSessionLocal",
    "get_async_session",
    "get_sync_session",
    "init_database",
    "close_database",
    "TenantContext",
    # Security
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_token",
    "Role",
    "Permission",
    "get_permissions_for_roles",
    "has_permission",
    "field_encryption",
    "compute_hash",
    "pii_masker",
]
