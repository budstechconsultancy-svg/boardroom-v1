"""
Base Connector Interface.

Abstract base class for all ERP connectors.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ConnectorStatus(str, Enum):
    DISCONNECTED = "disconnected"
    CONNECTED = "connected"
    SYNCING = "syncing"
    ERROR = "error"


@dataclass
class SyncResult:
    """Result of a sync operation."""
    
    success: bool
    rows_imported: int
    rows_updated: int
    rows_deleted: int
    snapshot_id: str
    snapshot_hash: str
    started_at: datetime
    completed_at: datetime
    errors: List[str]


@dataclass
class ReadResult:
    """Result of a read operation."""
    
    table_name: str
    rows: List[Dict[str, Any]]
    total_count: int
    snapshot_id: str


@dataclass
class WriteResult:
    """Result of a write operation."""
    
    success: bool
    table_name: str
    row_id: str
    operation: str  # create, update, delete
    pre_snapshot_hash: str
    post_snapshot_hash: str
    error: Optional[str] = None


class BaseConnector(ABC):
    """
    Abstract base class for ERP connectors.
    
    Implement this interface to create new ERP connectors.
    """
    
    def __init__(
        self,
        tenant_id: str,
        connector_id: str,
        config: Dict[str, Any]
    ):
        self.tenant_id = tenant_id
        self.connector_id = connector_id
        self.config = config
        self.status = ConnectorStatus.DISCONNECTED
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Connector name."""
        pass
    
    @property
    @abstractmethod
    def supported_tables(self) -> List[str]:
        """List of supported tables/entities."""
        pass
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to ERP."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close connection."""
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check connector health."""
        pass
    
    @abstractmethod
    async def sync(
        self,
        tables: Optional[List[str]] = None,
        full_sync: bool = False
    ) -> SyncResult:
        """
        Sync data from ERP.
        
        Args:
            tables: Specific tables to sync (None = all)
            full_sync: If True, do full sync; else delta
            
        Returns:
            SyncResult with import statistics
        """
        pass
    
    @abstractmethod
    async def read(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        offset: int = 0
    ) -> ReadResult:
        """
        Read data from ERP.
        
        Args:
            table: Table/entity name
            filters: Query filters
            limit: Max rows
            offset: Pagination offset
            
        Returns:
            ReadResult with rows
        """
        pass
    
    @abstractmethod
    async def write(
        self,
        table: str,
        operation: str,
        data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> WriteResult:
        """
        Write data to ERP (if supported).
        
        Args:
            table: Table/entity name
            operation: create, update, delete
            data: Data to write
            row_id: For update/delete
            
        Returns:
            WriteResult with status
        """
        pass
    
    async def create_snapshot(self, table: str) -> str:
        """Create a snapshot before write operations."""
        import hashlib
        import uuid
        
        snapshot_id = str(uuid.uuid4())
        # Read current state and create hash
        result = await self.read(table, limit=10000)
        data_str = str(result.rows)
        snapshot_hash = hashlib.sha256(data_str.encode()).hexdigest()
        
        return snapshot_id
