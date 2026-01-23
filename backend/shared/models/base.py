"""
Base model classes and mixins for all SQLAlchemy models.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, String, Text, event
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase


# Base class for all models using modern DeclarativeBase
class Base(DeclarativeBase):
    """Modern SQLAlchemy 2.0 base class."""
    __allow_unmapped__ = True


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


class TimestampMixin:
    """Mixin for adding created_at and updated_at timestamps."""
    
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class TenantMixin:
    """Mixin for multi-tenant models."""
    __allow_unmapped__ = True
    
    @declared_attr
    def tenant_id(cls):
        return Column(
            CHAR(36),
            nullable=False,
            index=True,
            comment="Tenant identifier for data isolation"
        )


class SoftDeleteMixin:
    """Mixin for soft delete support."""
    
    deleted_at = Column(
        DateTime,
        nullable=True,
        default=None,
        index=True
    )
    
    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Mark record as deleted."""
        self.deleted_at = datetime.utcnow()


class AuditMixin:
    """Mixin for audit fields."""
    
    created_by = Column(CHAR(36), nullable=True)
    updated_by = Column(CHAR(36), nullable=True)


# Base model with common fields
class BaseModel(Base, TimestampMixin):
    """Abstract base model with common fields."""
    
    __abstract__ = True
    __allow_unmapped__ = True
    
    id = Column(
        CHAR(36),
        primary_key=True,
        default=generate_uuid,
        comment="Unique identifier"
    )
    
    def to_dict(self) -> dict[str, Any]:
        """Convert model to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"


class TenantBaseModel(BaseModel, TenantMixin):
    """Base model with tenant isolation."""
    
    __abstract__ = True


# Event listeners for automatic timestamp updates
@event.listens_for(Base, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    """Update updated_at timestamp before update."""
    if hasattr(target, "updated_at"):
        target.updated_at = datetime.utcnow()
