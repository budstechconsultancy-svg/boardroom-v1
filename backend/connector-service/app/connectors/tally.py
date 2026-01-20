"""
Tally ERP Connector.

Connects to Tally Prime/ERP 9 via ODBC or XML API.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import hashlib
import uuid

from .base import BaseConnector, ConnectorStatus, SyncResult, ReadResult, WriteResult


class TallyConnector(BaseConnector):
    """
    Tally ERP Connector.
    
    Supports Tally Prime and Tally ERP 9.
    Connection via HTTP XML API or ODBC.
    """
    
    @property
    def name(self) -> str:
        return "Tally"
    
    @property
    def supported_tables(self) -> List[str]:
        return [
            "ledgers",
            "vouchers",
            "stock_items",
            "stock_groups",
            "cost_centres",
            "employees",
            "payroll",
            "sales_invoices",
            "purchase_invoices",
            "journal_entries"
        ]
    
    def __init__(self, tenant_id: str, connector_id: str, config: Dict[str, Any]):
        super().__init__(tenant_id, connector_id, config)
        self.server_url = config.get("server_url", "http://localhost:9000")
        self.company_name = config.get("company_name", "")
    
    async def connect(self) -> bool:
        """Connect to Tally server."""
        try:
            # Test connection with simple request
            import httpx
            async with httpx.AsyncClient() as client:
                # Tally responds to simple HTTP GET
                response = await client.get(
                    self.server_url,
                    timeout=10.0
                )
                if response.status_code == 200:
                    self.status = ConnectorStatus.CONNECTED
                    return True
        except Exception as e:
            self.status = ConnectorStatus.ERROR
            return False
        return False
    
    async def disconnect(self) -> bool:
        """Disconnect from Tally."""
        self.status = ConnectorStatus.DISCONNECTED
        return True
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Tally connection health."""
        is_connected = await self.connect()
        return {
            "status": "healthy" if is_connected else "unhealthy",
            "server_url": self.server_url,
            "company": self.company_name
        }
    
    async def sync(
        self,
        tables: Optional[List[str]] = None,
        full_sync: bool = False
    ) -> SyncResult:
        """Sync data from Tally."""
        started_at = datetime.utcnow()
        tables_to_sync = tables or self.supported_tables
        
        total_imported = 0
        errors = []
        
        for table in tables_to_sync:
            try:
                result = await self.read(table, limit=10000)
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
        """Read data from Tally using XML API."""
        # Build Tally XML request
        xml_request = self._build_xml_request(table, filters)
        
        # For demo, return sample data
        # In production, make actual HTTP request to Tally
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
        """Write data to Tally."""
        pre_snapshot = await self.create_snapshot(table)
        
        # Build Tally XML for write operation
        xml_data = self._build_write_xml(table, operation, data)
        
        # In production, send to Tally
        # For now, simulate success
        
        post_snapshot = await self.create_snapshot(table)
        
        return WriteResult(
            success=True,
            table_name=table,
            row_id=row_id or str(uuid.uuid4()),
            operation=operation,
            pre_snapshot_hash=pre_snapshot,
            post_snapshot_hash=post_snapshot
        )
    
    def _build_xml_request(self, table: str, filters: Optional[Dict[str, Any]]) -> str:
        """Build Tally XML request."""
        table_mapping = {
            "ledgers": "Ledger",
            "vouchers": "Voucher",
            "stock_items": "StockItem",
            "employees": "Employee"
        }
        
        tally_collection = table_mapping.get(table, table)
        
        return f"""
        <ENVELOPE>
            <HEADER>
                <TALLYREQUEST>Export Data</TALLYREQUEST>
            </HEADER>
            <BODY>
                <EXPORTDATA>
                    <REQUESTDESC>
                        <REPORTNAME>List of {tally_collection}</REPORTNAME>
                        <STATICVARIABLES>
                            <SVCURRENTCOMPANY>{self.company_name}</SVCURRENTCOMPANY>
                        </STATICVARIABLES>
                    </REQUESTDESC>
                </EXPORTDATA>
            </BODY>
        </ENVELOPE>
        """
    
    def _build_write_xml(self, table: str, operation: str, data: Dict[str, Any]) -> str:
        """Build Tally XML for write operation."""
        return f"<ENVELOPE><BODY><!-- {operation} {table} --></BODY></ENVELOPE>"
    
    def _get_sample_data(self, table: str) -> List[Dict[str, Any]]:
        """Return sample data for demo purposes."""
        if table == "ledgers":
            return [
                {"name": "Cash", "parent": "Current Assets", "balance": 50000},
                {"name": "Bank Account", "parent": "Bank Accounts", "balance": 250000},
                {"name": "Sales", "parent": "Revenue", "balance": 1000000},
            ]
        elif table == "employees":
            return [
                {"name": "John Doe", "department": "Engineering", "salary": 50000},
                {"name": "Jane Smith", "department": "Finance", "salary": 60000},
            ]
        return []
