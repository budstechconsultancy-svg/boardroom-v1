"""
BoardRoom Shared Models Package.

Contains all SQLAlchemy models for the application.
"""

from .base import Base, TimestampMixin, TenantMixin
from .tenant import Tenant, TenantPlan, TenantStatus
from .user import User, UserRole, UserStatus
from .agent import Agent, AgentType, AgentMemory, AgentConfig
from .proposal import (
    Proposal,
    ProposalStatus,
    Round,
    AgentContribution,
    Challenge,
    Vote,
    VoteValue,
)
from .evidence import EvidenceReference, EvidenceArtifact
from .execution import (
    ExecutionRecord,
    ExecutionStatus,
    ExecutionMode,
    RollbackRecord,
)
from .connector import (
    Connector,
    ConnectorType,
    ConnectorStatus,
    ConnectorSyncLog,
    ConnectorMapping,
)
from .audit import AuditLog, AuditEventType, AuditBundle

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    "TenantMixin",
    # Tenant
    "Tenant",
    "TenantPlan",
    "TenantStatus",
    # User
    "User",
    "UserRole",
    "UserStatus",
    # Agent
    "Agent",
    "AgentType",
    "AgentMemory",
    "AgentConfig",
    # Proposal
    "Proposal",
    "ProposalStatus",
    "Round",
    "AgentContribution",
    "Challenge",
    "Vote",
    "VoteValue",
    # Evidence
    "EvidenceReference",
    "EvidenceArtifact",
    # Execution
    "ExecutionRecord",
    "ExecutionStatus",
    "ExecutionMode",
    "RollbackRecord",
    # Connector
    "Connector",
    "ConnectorType",
    "ConnectorStatus",
    "ConnectorSyncLog",
    "ConnectorMapping",
    # Audit
    "AuditLog",
    "AuditEventType",
    "AuditBundle",
]
