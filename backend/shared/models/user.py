"""
User model for authentication and authorization.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import Boolean, Column, Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON
from sqlalchemy.orm import relationship

from .base import TenantBaseModel

if TYPE_CHECKING:
    from .tenant import Tenant


class UserStatus(str, Enum):
    """User account status."""
    
    PENDING = "pending"       # Invited, not yet accepted
    ACTIVE = "active"         # Active user
    SUSPENDED = "suspended"   # Temporarily suspended
    DEACTIVATED = "deactivated"  # Permanently deactivated


class UserRole(str, Enum):
    """User roles in the system."""
    
    OWNER = "owner"           # Full control, tenant owner
    CXO = "cxo"               # Executive, can approve high-risk
    APPROVER = "approver"     # Can approve medium-risk
    AUDITOR = "auditor"       # Read-only with audit access
    INTEGRATOR = "integrator" # Connector management
    ADMIN = "admin"           # Tenant administration
    VIEWER = "viewer"         # Read-only access


class User(TenantBaseModel):
    """
    User model for authentication and authorization.
    
    Users belong to a tenant and have roles that determine their permissions.
    """
    
    __tablename__ = "users"
    
    # Tenant relationship
    tenant = relationship("Tenant", back_populates="users")
    
    # Authentication
    email = Column(String(255), nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)  # Null for SSO users
    
    # Profile
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    display_name = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Status
    status = Column(
        SQLEnum(UserStatus),
        default=UserStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Roles (stored as JSON array)
    roles = Column(JSON, default=lambda: [UserRole.VIEWER.value])
    
    # Custom permissions (override role-based)
    custom_permissions = Column(JSON, default=list)
    
    # SSO
    sso_provider = Column(String(50), nullable=True)
    sso_subject = Column(String(255), nullable=True)  # External user ID
    
    # Preferences
    preferences = Column(JSON, default=dict)
    timezone = Column(String(50), default="UTC")
    locale = Column(String(10), default="en")
    
    # Security
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255), nullable=True)  # Encrypted
    last_login_at = Column(String(50), nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    
    # Notification preferences
    notification_settings = Column(JSON, default=lambda: {
        "email_proposals": True,
        "email_approvals": True,
        "email_executions": True,
        "push_enabled": False
    })
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.display_name or self.email.split("@")[0]
    
    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE
    
    def has_role(self, role: UserRole) -> bool:
        """Check if user has a specific role."""
        return role.value in (self.roles or [])
    
    def add_role(self, role: UserRole):
        """Add a role to the user."""
        if self.roles is None:
            self.roles = []
        if role.value not in self.roles:
            self.roles.append(role.value)
    
    def remove_role(self, role: UserRole):
        """Remove a role from the user."""
        if self.roles and role.value in self.roles:
            self.roles.remove(role.value)
    
    def get_all_permissions(self) -> List[str]:
        """Get all permissions from roles and custom permissions."""
        from ..security import get_permissions_for_roles
        
        role_permissions = get_permissions_for_roles(self.roles or [])
        custom = self.custom_permissions or []
        return list(set(role_permissions + custom))


# Create unique constraint on tenant_id + email
from sqlalchemy import UniqueConstraint
User.__table_args__ = (
    UniqueConstraint("tenant_id", "email", name="uq_user_tenant_email"),
)
