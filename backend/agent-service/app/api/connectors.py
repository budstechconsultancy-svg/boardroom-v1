"""
Connectors API Router.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter()

class Connector(BaseModel):
    id: str
    name: str
    type: str
    status: str
    last_sync: str

@router.get("", response_model=List[Connector])
async def list_connectors(
    tenant_id: str = Query(..., description="Tenant ID")
):
    """List all connectors."""
    return [
        Connector(
            id="conn-001",
            name="Salesforce CRM",
            type="CRM",
            status="active",
            last_sync="2024-01-22T10:00:00Z"
        ),
        Connector(
            id="conn-002",
            name="AWS CloudWatch",
            type="Monitoring",
            status="active",
            last_sync="2024-01-22T10:05:00Z"
        ),
        Connector(
            id="conn-003",
            name="Jira",
            type="Project Management",
            status="inactive",
            last_sync="2024-01-21T15:30:00Z"
        )
    ]
