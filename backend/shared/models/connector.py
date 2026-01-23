"""
Connector models for ERP integrations.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel


class ConnectorType(str, Enum):
    """Types of ERP connectors."""
    
    TALLY = "tally"
    ZOHO_BOOKS = "zoho_books"
    SAP_BUSINESS_ONE = "sap_business_one"
    NETSUITE = "netsuite"
    ORACLE_ERP = "oracle_erp"
    MICROSOFT_DYNAMICS = "microsoft_dynamics"
    QUICKBOOKS = "quickbooks"
    CUSTOM = "custom"


class ConnectorStatus(str, Enum):
    """Connector status."""
    
    PENDING = "pending"
    CONFIGURING = "configuring"
    CONNECTED = "connected"
    SYNCING = "syncing"
    ERROR = "error"
    DISCONNECTED = "disconnected"


class Connector(TenantBaseModel):
    """
    ERP connector configuration.
    
    Connects BoardRoom to external ERP systems for data sync.
    """
    
    __tablename__ = "connectors"
    
    # Tenant relationship
    # TODO: Fix foreign key configuration
    # tenant = relationship("Tenant", back_populates="connectors")
    
    # Connector identity
    name = Column(String(100), nullable=False)
    connector_type = Column(SQLEnum(ConnectorType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Status
    status = Column(
        SQLEnum(ConnectorStatus),
        default=ConnectorStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Connection config (encrypted)
    connection_config = Column(LONGTEXT, nullable=True)  # Encrypted JSON
    
    # Authentication
    auth_type = Column(String(50), default="api_key")  # api_key, oauth2, basic
    auth_config = Column(LONGTEXT, nullable=True)  # Encrypted
    
    # Sync configuration
    sync_enabled = Column(Boolean, default=True)
    sync_interval_minutes = Column(Integer, default=60)
    last_sync_at = Column(String(50), nullable=True)
    next_sync_at = Column(String(50), nullable=True)
    
    # Data mappings
    mappings = Column(JSON, default=dict)
    
    # Capabilities
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    
    # Health
    last_health_check = Column(String(50), nullable=True)
    health_status = Column(String(20), default="unknown")  # healthy, degraded, unhealthy
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    
    # Relationships
    sync_logs = relationship("ConnectorSyncLog", back_populates="connector", lazy="dynamic")
    mappings_records = relationship("ConnectorMapping", back_populates="connector", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Connector(id={self.id}, type={self.connector_type}, name={self.name})>"


class ConnectorSyncLog(TenantBaseModel):
    """
    Log of connector sync operations.
    """
    
    __tablename__ = "connector_sync_logs"
    
    # Parent connector
    connector_id = Column(CHAR(36), ForeignKey("connectors.id"), nullable=False, index=True)
    connector = relationship("Connector", back_populates="sync_logs")
    
    # Sync type
    sync_type = Column(String(50), default="incremental")  # full, incremental, delta
    
    # Timing
    started_at = Column(String(50), nullable=False)
    completed_at = Column(String(50), nullable=True)
    
    # Results
    status = Column(String(20), default="in_progress")  # in_progress, completed, failed
    rows_imported = Column(Integer, default=0)
    rows_updated = Column(Integer, default=0)
    rows_deleted = Column(Integer, default=0)
    
    # Snapshot
    snapshot_id = Column(CHAR(36), nullable=True)
    snapshot_hash = Column(String(64), nullable=True)
    
    # Errors
    errors = Column(JSON, default=list)
    error_count = Column(Integer, default=0)
    
    # Delta tracking
    delta_token = Column(String(255), nullable=True)
    
    def __repr__(self) -> str:
        return f"<ConnectorSyncLog(connector_id={self.connector_id}, status={self.status})>"


class ConnectorMapping(TenantBaseModel):
    """
    Field mapping configuration for a connector.
    """
    
    __tablename__ = "connector_mappings"
    
    # Parent connector
    connector_id = Column(CHAR(36), ForeignKey("connectors.id"), nullable=False, index=True)
    connector = relationship("Connector", back_populates="mappings_records")
    
    # Mapping identity
    name = Column(String(100), nullable=False)
    mapping_type = Column(String(50), nullable=False)  # payroll, invoices, inventory, gl
    
    # Source configuration
    source_table = Column(String(255), nullable=False)
    source_fields = Column(JSON, nullable=False)  # List of field mappings
    
    # Target configuration
    target_domain = Column(String(50), nullable=False)  # hr, finance, ops
    target_schema = Column(JSON, nullable=False)
    
    # Transformation
    transformations = Column(JSON, default=list)
    
    # Active
    is_active = Column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<ConnectorMapping(id={self.id}, type={self.mapping_type})>"
