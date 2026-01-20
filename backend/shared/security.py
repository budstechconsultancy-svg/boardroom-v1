"""
BoardRoom Security Module.

Handles authentication, authorization, encryption, and security utilities.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from .config import settings


# =============================================================================
# PASSWORD HASHING
# =============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# JWT TOKENS
# =============================================================================

class TokenData(BaseModel):
    """JWT token payload data."""
    
    sub: str  # User ID
    tenant_id: str
    roles: list[str]
    permissions: list[str]
    exp: datetime
    iat: datetime
    jti: str  # Token ID for revocation


def create_access_token(
    user_id: str,
    tenant_id: str,
    roles: list[str],
    permissions: list[str],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.auth.jwt_expiry_minutes))
    
    token_data = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "roles": roles,
        "permissions": permissions,
        "exp": expire,
        "iat": now,
        "jti": secrets.token_urlsafe(16),
    }
    
    return jwt.encode(
        token_data,
        settings.auth.secret_key,
        algorithm=settings.auth.jwt_algorithm
    )


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.auth.secret_key,
            algorithms=[settings.auth.jwt_algorithm]
        )
        return TokenData(**payload)
    except JWTError:
        return None


# =============================================================================
# RBAC - ROLES AND PERMISSIONS
# =============================================================================

class Role(str, Enum):
    """System roles with hierarchical permissions."""
    
    OWNER = "owner"           # Full control, tenant owner
    CXO = "cxo"               # Executive, can approve high-risk
    APPROVER = "approver"     # Can approve medium-risk
    AUDITOR = "auditor"       # Read-only with audit access
    INTEGRATOR = "integrator" # Connector management
    ADMIN = "admin"           # Tenant administration
    VIEWER = "viewer"         # Read-only access


class Permission(str, Enum):
    """Granular permissions."""
    
    # Proposals
    PROPOSAL_CREATE = "proposal:create"
    PROPOSAL_READ = "proposal:read"
    PROPOSAL_UPDATE = "proposal:update"
    PROPOSAL_DELETE = "proposal:delete"
    PROPOSAL_VOTE = "proposal:vote"
    PROPOSAL_CHALLENGE = "proposal:challenge"
    
    # Execution
    EXECUTION_LOW = "execution:low"
    EXECUTION_MEDIUM = "execution:medium"
    EXECUTION_HIGH = "execution:high"
    EXECUTION_ROLLBACK = "execution:rollback"
    
    # Connectors
    CONNECTOR_READ = "connector:read"
    CONNECTOR_MANAGE = "connector:manage"
    CONNECTOR_SYNC = "connector:sync"
    
    # Audit
    AUDIT_READ = "audit:read"
    AUDIT_EXPORT = "audit:export"
    AUDIT_RAW_PROMPTS = "audit:raw_prompts"
    
    # Admin
    ADMIN_USERS = "admin:users"
    ADMIN_ROLES = "admin:roles"
    ADMIN_SETTINGS = "admin:settings"
    ADMIN_BILLING = "admin:billing"
    
    # Tenant
    TENANT_READ = "tenant:read"
    TENANT_MANAGE = "tenant:manage"


# Role to permissions mapping
ROLE_PERMISSIONS: dict[Role, list[Permission]] = {
    Role.OWNER: list(Permission),  # All permissions
    
    Role.CXO: [
        Permission.PROPOSAL_CREATE,
        Permission.PROPOSAL_READ,
        Permission.PROPOSAL_UPDATE,
        Permission.PROPOSAL_VOTE,
        Permission.PROPOSAL_CHALLENGE,
        Permission.EXECUTION_LOW,
        Permission.EXECUTION_MEDIUM,
        Permission.EXECUTION_HIGH,
        Permission.EXECUTION_ROLLBACK,
        Permission.CONNECTOR_READ,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
    ],
    
    Role.APPROVER: [
        Permission.PROPOSAL_READ,
        Permission.PROPOSAL_VOTE,
        Permission.EXECUTION_LOW,
        Permission.EXECUTION_MEDIUM,
        Permission.CONNECTOR_READ,
        Permission.AUDIT_READ,
    ],
    
    Role.AUDITOR: [
        Permission.PROPOSAL_READ,
        Permission.CONNECTOR_READ,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
        Permission.AUDIT_RAW_PROMPTS,
    ],
    
    Role.INTEGRATOR: [
        Permission.PROPOSAL_READ,
        Permission.CONNECTOR_READ,
        Permission.CONNECTOR_MANAGE,
        Permission.CONNECTOR_SYNC,
    ],
    
    Role.ADMIN: [
        Permission.PROPOSAL_READ,
        Permission.CONNECTOR_READ,
        Permission.AUDIT_READ,
        Permission.ADMIN_USERS,
        Permission.ADMIN_ROLES,
        Permission.ADMIN_SETTINGS,
        Permission.TENANT_READ,
    ],
    
    Role.VIEWER: [
        Permission.PROPOSAL_READ,
        Permission.CONNECTOR_READ,
        Permission.AUDIT_READ,
    ],
}


def get_permissions_for_roles(roles: list[str]) -> list[str]:
    """Get all permissions for a list of roles."""
    permissions = set()
    for role_str in roles:
        try:
            role = Role(role_str)
            permissions.update(p.value for p in ROLE_PERMISSIONS.get(role, []))
        except ValueError:
            continue
    return list(permissions)


def has_permission(user_permissions: list[str], required_permission: Permission) -> bool:
    """Check if user has a specific permission."""
    return required_permission.value in user_permissions


# =============================================================================
# FIELD-LEVEL ENCRYPTION
# =============================================================================

class FieldEncryption:
    """Handles field-level encryption for PII data."""
    
    def __init__(self, key: Optional[bytes] = None):
        """Initialize with encryption key."""
        if key is None:
            # Generate from secret key
            key = hashlib.sha256(
                settings.auth.secret_key.encode()
            ).digest()[:32]
            key = Fernet.generate_key()
        self._fernet = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string value."""
        return self._fernet.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a string value."""
        return self._fernet.decrypt(ciphertext.encode()).decode()


# Global encryption instance
field_encryption = FieldEncryption()


# =============================================================================
# DATA HASHING FOR AUDIT
# =============================================================================

def compute_hash(data: Any, algorithm: str = "sha256") -> str:
    """Compute cryptographic hash of data."""
    if isinstance(data, str):
        data_bytes = data.encode()
    elif isinstance(data, bytes):
        data_bytes = data
    else:
        import json
        data_bytes = json.dumps(data, sort_keys=True, default=str).encode()
    
    hasher = hashlib.new(algorithm)
    hasher.update(data_bytes)
    return hasher.hexdigest()


def generate_document_hash(content: bytes, metadata: dict) -> str:
    """Generate hash for document integrity verification."""
    combined = content + compute_hash(metadata).encode()
    return compute_hash(combined)


# =============================================================================
# PII MASKING
# =============================================================================

class PIIMasker:
    """Masks PII data for display."""
    
    @staticmethod
    def mask_email(email: str) -> str:
        """Mask email address."""
        if "@" not in email:
            return "***"
        local, domain = email.split("@", 1)
        if len(local) <= 2:
            masked_local = "*" * len(local)
        else:
            masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"
    
    @staticmethod
    def mask_phone(phone: str) -> str:
        """Mask phone number."""
        digits = "".join(c for c in phone if c.isdigit())
        if len(digits) <= 4:
            return "*" * len(digits)
        return "*" * (len(digits) - 4) + digits[-4:]
    
    @staticmethod
    def mask_name(name: str) -> str:
        """Mask name."""
        parts = name.split()
        masked_parts = []
        for part in parts:
            if len(part) <= 1:
                masked_parts.append("*")
            else:
                masked_parts.append(part[0] + "*" * (len(part) - 1))
        return " ".join(masked_parts)
    
    @staticmethod
    def mask_account_number(account: str) -> str:
        """Mask account/card number."""
        if len(account) <= 4:
            return "*" * len(account)
        return "*" * (len(account) - 4) + account[-4:]


pii_masker = PIIMasker()
