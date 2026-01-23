from __future__ import annotations
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool

from .config import settings
from .models.base import Base

# Create async engine for MySQL
ASYNC_DATABASE_URL = settings.database.url.replace(
    "mysql+pymysql",
    "mysql+aiomysql"
)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    echo=settings.database.echo,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create sync engine for migrations and scripts
sync_engine = create_engine(
    settings.database.url,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    echo=settings.database.echo,
    pool_pre_ping=True,
    pool_recycle=3600,
    poolclass=QueuePool,
)

# Session factories
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_session() -> Session:
    """Get sync database session for scripts and migrations."""
    session = SyncSessionLocal()
    try:
        return session
    except Exception:
        session.rollback()
        raise


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_database():
    """Initialize database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_database():
    """Close database connections."""
    await async_engine.dispose()


class TenantContext:
    """Thread-local storage for tenant context."""
    _tenant_id: str = None
    
    @classmethod
    def set_tenant(cls, tenant_id: str):
        cls._tenant_id = tenant_id
    
    @classmethod
    def get_tenant(cls) -> str:
        if cls._tenant_id is None:
            raise ValueError("Tenant context not set")
        return cls._tenant_id
    
    @classmethod
    def clear_tenant(cls):
        cls._tenant_id = None


@event.listens_for(Session, "do_orm_execute")
def _add_tenant_filter(orm_execute_state):
    if (
        orm_execute_state.is_select
        and not orm_execute_state.is_column_load
        and not orm_execute_state.is_relationship_load
    ):
        try:
            tenant_id = TenantContext.get_tenant()
            mapper = orm_execute_state.bind_mapper
            if mapper and hasattr(mapper.class_, "tenant_id"):
                orm_execute_state.statement = orm_execute_state.statement.filter_by(
                    tenant_id=tenant_id
                )
        except ValueError:
            pass
