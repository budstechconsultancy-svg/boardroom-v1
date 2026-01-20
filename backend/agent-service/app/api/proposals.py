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
