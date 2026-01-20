"""
Zoho Books Connector.

Connects to Zoho Books via REST API with OAuth2.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import hashlib
import uuid

from .base import BaseConnector, ConnectorStatus, SyncResult, ReadResult, WriteResult


class ZohoBooksConnector(BaseConnector):
    """
    Zoho Books Connector.
    
    Uses Zoho Books REST API with OAuth2 authentication.
    """
    
    @property
    def name(self) -> str:
        return "Zoho Books"
    
    @property
    def supported_tables(self) -> List[str]:
        return [
            "contacts",
            "invoices",
            "bills",
            "expenses",
            "items",
            "chartofaccounts",
            "journals",
            "payments",
            "creditnotes",
            "purchaseorders"
        ]
    
    def __init__(self, tenant_id: str, connector_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, connector_id, config)
        self.organization_id = config.get("organization_id", "")
        self.access_token = config.get("access_token", "")
        self.refresh_token = config.get("refresh_token", "")
        self.base_url = "https://books.zoho.in/api/v3"
    
    async def connect(self) -> bool:
        """Connect using OAuth2 tokens."""
        try:
            # Verify token is valid
            health = await self.health_check()
            if health.get("status") == "healthy":
                self.status = ConnectorStatus.CONNECTED
                return True
        except Exception:
            self.status = ConnectorStatus.ERROR
        return False
    
    async def disconnect(self) -> bool:
        self.status = ConnectorStatus.DISCONNECTED
        return True
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Zoho Books API health."""
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/organizations",
                    headers={"Authorization": f"Zoho-oauthtoken {self.access_token}"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"status": "healthy", "organization": self.organization_id}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
        return {"status": "unhealthy"}
    
    async def sync(
        self,
        tables: Optional[List[str]] = None,
        full_sync: bool = False
    ) -> SyncResult:
        """Sync data from Zoho Books."""
        started_at = datetime.utcnow()
        tables_to_sync = tables or self.supported_tables
        total_imported = 0
        errors = []
        
        for table in tables_to_sync:
            try:
                result = await self.read(table, limit=200)
                total_imported += len(result.rows)
            except Exception as e:
                errors.append(f"{table}: {str(e)}")
        
        snapshot_id = str(uuid.uuid4())
        
        return SyncResult(
            success=len(errors) == 0,
            rows_imported=total_imported,
            rows_updated=0,
            rows_deleted=0,
            snapshot_id=snapshot_id,
            snapshot_hash=hashlib.sha256(snapshot_id.encode()).hexdigest(),
            started_at=started_at,
            completed_at=datetime.utcnow(),
            errors=errors
        )
    
    async def read(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        offset: int = 0
    ) -> ReadResult:
        """Read data from Zoho Books API."""
        # In production, make actual API call
        # For demo, return sample data
        sample_rows = self._get_sample_data(table)
        
        return ReadResult(
            table_name=table,
            rows=sample_rows[:limit],
            total_count=len(sample_rows),
            snapshot_id=str(uuid.uuid4())
        )
    
    async def write(
        self,
        table: str,
        operation: str,
        data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> WriteResult:
        """Write data to Zoho Books."""
        pre_snapshot = await self.create_snapshot(table)
        
        # In production, make API call
        # POST/PUT/DELETE to Zoho Books API
        
        post_snapshot = await self.create_snapshot(table)
        
        return WriteResult(
            success=True,
            table_name=table,
            row_id=row_id or str(uuid.uuid4()),
            operation=operation,
            pre_snapshot_hash=pre_snapshot,
            post_snapshot_hash=post_snapshot
        )
    
    def _get_sample_data(self, table: str) -> List[Dict[str, Any]]:
        """Sample data for demo."""
        if table == "invoices":
            return [
                {"invoice_id": "INV-001", "customer": "ABC Corp", "total": 50000, "status": "paid"},
                {"invoice_id": "INV-002", "customer": "XYZ Ltd", "total": 75000, "status": "pending"},
            ]
        elif table == "contacts":
            return [
                {"contact_id": "C-001", "name": "ABC Corp", "type": "customer"},
                {"contact_id": "V-001", "name": "Supplier Inc", "type": "vendor"},
            ]
        return []
