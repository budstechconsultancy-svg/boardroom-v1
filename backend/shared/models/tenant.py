"""
Tenant model for multi-tenancy support.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, Integer, String, Text
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User
    from .connector import Connector


class TenantPlan(str, Enum):
    """Tenant subscription plans."""
    
    SMB = "smb"           # Shared infrastructure, fast onboarding
    GROWTH = "growth"     # Private tenant VPC option
    ENTERPRISE = "enterprise"  # Dedicated VPC/on-prem appliance


class TenantStatus(str, Enum):
    """Tenant provisioning status."""
    
    PENDING = "pending"
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class Tenant(BaseModel):
    """
    Tenant model for multi-tenant isolation.
    
    Each tenant represents an organization using BoardRoom.
    """
    
    __tablename__ = "tenants"
    
    # Basic info
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    domain = Column(String(255), nullable=True, unique=True)
    
    # Subscription
    plan = Column(
        SQLEnum(TenantPlan),
        default=TenantPlan.SMB,
        nullable=False
    )
    status = Column(
        SQLEnum(TenantStatus),
        default=TenantStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Branding
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#1890ff")  # Hex color
    
    # Configuration
    feature_flags = Column(JSON, default=dict)
    settings = Column(JSON, default=dict)
    
    # CEO Mode configuration
    ceo_mode = Column(String(20), default="hybrid")  # ai, human, hybrid
    
    # Quotas
    max_users = Column(Integer, default=10)
    max_connectors = Column(Integer, default=5)
    max_agents = Column(Integer, default=10)
    max_proposals_per_month = Column(Integer, default=100)
    
    # Retention policy
    audit_retention_days = Column(Integer, default=2555)  # 7 years
    
    # Billing
    billing_email = Column(String(255), nullable=True)
    billing_info = Column(JSON, default=dict)
    
    # SSO/OIDC
    sso_enabled = Column(Boolean, default=False)
    sso_provider = Column(String(50), nullable=True)
    sso_config = Column(JSON, default=dict)
    
    # Risk configuration
    risk_tier_config = Column(JSON, default=lambda: {
        "low": {
            "auto_execute": True,
            "confidence_threshold": 0.9
        },
        "medium": {
            "approvers_required": 1,
            "confidence_threshold": 0.8
        },
        "high": {
            "approvers_required": 2,
            "require_owner": True
        }
    })
    
    # Safe-list for auto-execution
    safe_list = Column(JSON, default=list)
    
    # Relationships
    # TODO: Fix foreign key configuration for these relationships
    # users = relationship("User", back_populates="tenant", lazy="dynamic", foreign_keys="User.tenant_id")
    # connectors = relationship("Connector", back_populates="tenant", lazy="dynamic", foreign_keys="Connector.tenant_id")
    
    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name={self.name}, plan={self.plan})>"
    
    @property
    def is_active(self) -> bool:
        return self.status == TenantStatus.ACTIVE
    
    def get_feature_flag(self, flag: str, default: bool = False) -> bool:
        """Get a feature flag value."""
        return self.feature_flags.get(flag, default)
    
    def set_feature_flag(self, flag: str, value: bool):
        """Set a feature flag value."""
        if self.feature_flags is None:
            self.feature_flags = {}
        self.feature_flags[flag] = value
