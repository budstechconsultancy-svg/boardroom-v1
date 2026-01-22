"""
Proposals API Router.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter()


class CreateProposalRequest(BaseModel):
    """Request to create a proposal."""
    
    title: str
    description: str
    domain: str
    proposer_agent: str
    query: Optional[str] = None


class ProposalDetailResponse(BaseModel):
    """Detailed proposal response."""
    
    id: str
    title: str
    description: str
    domain: str
    status: str
    risk_tier: str
    confidence_score: float
    current_round: int
    max_rounds: int


@router.post("", response_model=ProposalDetailResponse)
async def create_proposal(
    request: CreateProposalRequest,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Create a new proposal."""
    # TODO: Implement full proposal creation
    return ProposalDetailResponse(
        id="proposal-123",
        title=request.title,
        description=request.description,
        domain=request.domain,
        status="draft",
        risk_tier="medium",
        confidence_score=0.0,
        current_round=0,
        max_rounds=3
    )


@router.get("", response_model=List[ProposalDetailResponse])
async def list_proposals(
    tenant_id: str = Query(..., description="Tenant ID"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """List all proposals."""
    proposals = [
        ProposalDetailResponse(
            id="P-0118",
            title="Test Proposal for Count Verification",
            description="Comprehensive testing framework for financial reporting accuracy",
            domain="Finance",
            status="voting",
            risk_tier="medium",
            confidence_score=0.75,
            current_round=2,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0117",
            title="New patent",
            description="File patent for new AI-driven customer engagement system",
            domain="Legal",
            status="voting",
            risk_tier="medium",
            confidence_score=0.75,
            current_round=2,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0116",
            title="Security Patch Update",
            description="Deploy critical security patches across all production systems",
            domain="IT Security",
            status="deliberating",
            risk_tier="high",
            confidence_score=0.95,
            current_round=1,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0115",
            title="Customer Feedback Loop",
            description="Implement automated customer feedback collection and analysis",
            domain="Sales",
            status="deliberating",
            risk_tier="low",
            confidence_score=0.88,
            current_round=1,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0114",
            title="Legal Risk Assessment",
            description="Conduct comprehensive legal risk assessment for new market entry",
            domain="Legal",
            status="deliberating",
            risk_tier="medium",
            confidence_score=0.85,
            current_round=1,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0113",
            title="HR Policy Update",
            description="Update remote work policies to align with hybrid work model",
            domain="HR",
            status="deliberating",
            risk_tier="low",
            confidence_score=0.90,
            current_round=1,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0112",
            title="Marketing Campaign",
            description="Launch Q1 digital marketing campaign for new product line",
            domain="Sales",
            status="deliberating",
            risk_tier="medium",
            confidence_score=0.60,
            current_round=1,
            max_rounds=3
        ),
        ProposalDetailResponse(
            id="P-0111",
            title="New ERP Implementation",
            description="Migrate to cloud-based ERP system for improved scalability",
            domain="Product",
            status="voting",
            risk_tier="high",
            confidence_score=0.65,
            current_round=2,
            max_rounds=3
        ),
    ]
    
    if status:
        proposals = [p for p in proposals if p.status.lower() == status.lower()]
    
    return proposals


@router.get("/{proposal_id}", response_model=ProposalDetailResponse)
async def get_proposal(
    proposal_id: str,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Get proposal details."""
    # TODO: Implement DB lookup
    return ProposalDetailResponse(
        id=proposal_id,
        title="Sample Proposal",
        description="Description",
        domain="finance",
        status="deliberating",
        risk_tier="medium",
        confidence_score=0.75,
        current_round=1,
        max_rounds=3
    )
