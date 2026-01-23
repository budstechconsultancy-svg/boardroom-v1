from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from shared.database import get_async_session
from shared.models.proposal import Proposal as ProposalModel, ProposalStatus, Round as RoundModel, AgentContribution as ContributionModel, Vote as VoteModel, VoteValue
from shared.models.agent import Agent as AgentModel

router = APIRouter()


class CreateProposalRequest(BaseModel):
    """Request to create a proposal."""
    
    title: str
    description: str
    domain: str
    proposer: Optional[str] = None # Frontend sends 'proposer'
    proposer_agent: Optional[str] = None # Keeping for backward compatibility if any
    query: Optional[str] = None
    status: Optional[str] = None
    risk_tier: Optional[str] = None
    confidence: Optional[float] = None


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
    messages: List[Message] = []


class Message(BaseModel):
    """A message in the deliberation."""
    id: str
    agent_name: str
    agent_domain: str
    message: str
    timestamp: str
    round_number: int
    is_conclusion: bool = False
    vote: Optional[str] = None
    vote_rationale: Optional[str] = None
    metadata: Optional[dict] = {}


@router.post("/trigger-meeting", response_model=ProposalDetailResponse)
async def trigger_meeting(
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Trigger a board meeting with mandatory 5-round analysis and voting from all agents."""
    import random
    import uuid
    
    # 1. Fetch available agents
    agent_query = select(AgentModel).filter(AgentModel.tenant_id == tenant_id)
    agent_res = await session.execute(agent_query)
    all_agents = agent_res.scalars().all()
    
    if not all_agents:
        raise HTTPException(status_code=400, detail="No agents found to trigger meeting")
        
    proposer = random.choice(all_agents)
    
    # 2. Create Proposal
    proposal_id = f"P-{uuid.uuid4().hex[:4].upper()}"
    topics = {
        "finance": "Accelerated Depreciation for Cloud Infrastructure",
        "hr": "Employee Upskilling Program for Generative AI",
        "ops": "Predictive Maintenance for Logistics Fleet",
        "legal": "Drafting Multi-Jurisdictional Privacy Framework",
        "sales": "CRM Integration with Real-Time Market Intelligence",
        "it_security": "Zero-Trust Protocol Implementation for Edge Devices",
        "custom": "Q3 Strategic Pivot towards Sustainable Energy"
    }
    
    title = topics.get(proposer.agent_type.value, f"Board Strategy: {proposer.name}")
    
    new_p = ProposalModel(
        id=proposal_id,
        title=title,
        description=f"Strategic board initiative initiated by {proposer.name}.",
        domain=proposer.agent_type.value,
        proposer_agent_id=proposer.id,
        status=ProposalStatus.DELIBERATING,
        risk_tier="medium",
        confidence_score=0.5,
        current_round=0,
        max_rounds=5,
        payload={"type": "strategic_review"},
        tenant_id=tenant_id
    )
    session.add(new_p)
    await session.flush()
    
    # Analysis generation logic based on domain
    def generate_analysis(agent_type: str, round_num: int):
        themes = {
            "finance": ["ROI projections", "Budgetary alignment", "Capital expenditure vs Operational efficiency"],
            "hr": ["Resource allocation", "Talent bridge", "Cultural impact and upskilling"],
            "ops": ["Workflow optimization", "Logistics scalability", "Infrastructure readiness"],
            "legal": ["Compliance check", "Risk mitigation", "Regulatory adherence"],
            "it_security": ["Data integrity", "Privacy protocols", "Threat landscape"],
            "sales": ["Revenue growth", "Market positioning", "Customer retention"]
        }
        theme = random.choice(themes.get(agent_type.lower(), ["Strategic alignment"]))
        past_ref = f"Compared to previous decisions in {2024-round_num} Q{random.randint(1,4)}, this looks "
        if round_num == 1:
            return f"{theme.capitalize()} analysis shows positive initial markers. {past_ref} highly consistent."
        if round_num < 4:
            return f"Deep dive into {theme}. Validation of risks indicates manageable impact. {past_ref} favorable."
        return f"Final validation of {theme} completed. Strategy is robust and optimized. {past_ref} a logical progression."

    # 3. Process 5 mandatory rounds
    for r_num in range(1, 6):
        rnd = RoundModel(
            proposal_id=new_p.id, 
            round_number=r_num, 
            round_type="deliberation" if r_num < 5 else "voting",
            tenant_id=tenant_id
        )
        session.add(rnd)
        await session.flush()
        
        for agent in all_agents:
            vote_choices = [VoteValue.APPROVE, VoteValue.APPROVE, VoteValue.ABSTAIN]
            if r_num < 3: vote_choices.append(VoteValue.ABSTAIN)
            
            current_vote = random.choice(vote_choices)
            abstain_reason = "Awaiting deeper domain risk analysis" if current_vote == VoteValue.ABSTAIN else None
            
            contribution = ContributionModel(
                round_id=rnd.id,
                agent_id=agent.id,
                content=generate_analysis(agent.agent_type.value, r_num),
                tenant_id=tenant_id
            )
            session.add(contribution)
            
            v_record = VoteModel(
                round_id=rnd.id,
                voter_agent_id=agent.id,
                vote=current_vote,
                rationale=abstain_reason or "Analysis supports current trajectory.",
                tenant_id=tenant_id
            )
            session.add(v_record)
            
        new_p.current_round = r_num
        await session.flush()

    new_p.status = ProposalStatus.APPROVED
    new_p.confidence_score = 0.92
    
    await session.commit()
    return await get_proposal(proposal_id=new_p.id, tenant_id=tenant_id, session=session)


@router.get("/{proposal_id}", response_model=ProposalDetailResponse)
async def get_proposal(
    proposal_id: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Get proposal details with conversation from rounds, including votes."""
    query = select(ProposalModel).filter(
        ProposalModel.id == proposal_id,
        ProposalModel.tenant_id == tenant_id
    ).options(
        selectinload(ProposalModel.rounds).selectinload(RoundModel.contributions),
        selectinload(ProposalModel.rounds).selectinload(RoundModel.votes)
    )
    result = await session.execute(query)
    p = result.scalars().first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")

    agents_query = select(AgentModel).filter(AgentModel.tenant_id == tenant_id)
    agents_res = await session.execute(agents_query)
    agent_lookup = {a.id: a for a in agents_res.scalars().all()}

    messages = []
    sorted_rounds = sorted(p.rounds, key=lambda r: r.round_number)
    
    for r in sorted_rounds:
        vote_lookup = {v.voter_agent_id: v for v in r.votes if v.voter_agent_id}
        for c in r.contributions:
            agent = agent_lookup.get(c.agent_id)
            vote_data = vote_lookup.get(c.agent_id)
            
            messages.append(Message(
                id=c.id,
                agent_name=agent.name if agent else "Unknown Agent",
                agent_domain=agent.agent_type.value if agent else "unknown",
                message=c.content,
                timestamp=c.created_at.isoformat() if hasattr(c, 'created_at') else "",
                round_number=r.round_number,
                vote=vote_data.vote.value if vote_data and hasattr(vote_data.vote, 'value') else None,
                vote_rationale=vote_data.rationale if vote_data else None
            ))
        
        # Add synthetic message for Query rounds if no contributions
        if r.round_type == "query" and not r.contributions:
            messages.append(Message(
                id=f"query-{r.id}",
                agent_name="User",
                agent_domain="Query",
                message=r.summary or "User Query",
                timestamp="", # Could use r.created_at if available
                round_number=r.round_number,
                is_conclusion=False
            ))

    return ProposalDetailResponse(
        id=p.id,
        title=p.title,
        description=p.description or "",
        domain=p.domain,
        status=p.status.value if hasattr(p.status, 'value') else p.status,
        risk_tier=p.risk_tier,
        confidence_score=p.confidence_score,
        current_round=p.current_round,
        max_rounds=p.max_rounds,
        messages=messages
    )


@router.post("", response_model=ProposalDetailResponse)
async def create_proposal(
    request: CreateProposalRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Create a new proposal."""
    import uuid
    
    # Verify proposer agent exists (optional, or just use string)
    # We'll just create the proposal
    
    new_id = f"P-{uuid.uuid4().hex[:4].upper()}"
    
    # Try to find a matching agent for the proposer
    proposer_name = request.proposer or request.proposer_agent
    proposer_id = None
    if proposer_name:
        # Simple lookup by name or domain
        query = select(AgentModel).filter(
            AgentModel.tenant_id == tenant_id, 
            AgentModel.name.ilike(f"%{proposer_name}%")
        )
        res = await session.execute(query)
        agent = res.scalars().first()
        if agent:
            proposer_id = agent.id
            
    # Default values for fields not in request
    # Frontend sends status, risk_tier etc but schema missed them.
    # We will accept them if we update schema, or just default them here.
    # Let's trust the frontend defaults logic or setting them here.
    
    # Create Proposal record
    new_p = ProposalModel(
        id=new_id,
        title=request.title,
        description=request.description,
        domain=request.domain,
        proposer_agent_id=proposer_id,
        payload={"query": request.query} if request.query else {},
        tenant_id=tenant_id,
        status=ProposalStatus.DELIBERATING,
        current_round=0, # Will be updated by deliberation
        max_rounds=5
    )
    
    session.add(new_p)
    await session.flush()
    
    # Run initial 5-round deliberation
    await run_deliberation_cycle(session, new_p, tenant_id, initial=True)
    
    await session.commit()
    await session.refresh(new_p)
    
    return await get_proposal_response(session, new_p, tenant_id)

async def get_proposal_response(session, p, tenant_id):
    # Helper to build response
    # We need to re-fetch to get relationships populated if they weren't
    # But new_p might not have everything loaded. 
    # Let's simple construct response or re-query.
    # Re-querying is safer for relationships.
    query = select(ProposalModel).filter(
        ProposalModel.id == p.id,
        ProposalModel.tenant_id == tenant_id
    ).options(
        selectinload(ProposalModel.rounds).selectinload(RoundModel.contributions),
        selectinload(ProposalModel.rounds).selectinload(RoundModel.votes)
    )
    result = await session.execute(query)
    full_p = result.scalars().first()
    
    if not full_p: return None # Should not happen

    messages = []
    sorted_rounds = sorted(full_p.rounds, key=lambda r: r.round_number)
    
    # Need agent map
    agents_res = await session.execute(select(AgentModel).filter(AgentModel.tenant_id == tenant_id))
    agent_lookup = {a.id: a for a in agents_res.scalars().all()}
    
    for r in sorted_rounds:
        vote_lookup = {v.voter_agent_id: v for v in r.votes if v.voter_agent_id}
        for c in r.contributions:
            agent = agent_lookup.get(c.agent_id)
            vote_data = vote_lookup.get(c.agent_id)
            messages.append(Message(
                id=c.id,
                agent_name=agent.name if agent else "Unknown Agent",
                agent_domain=agent.agent_type.value if agent else "unknown",
                message=c.content,
                timestamp=c.created_at.isoformat() if hasattr(c, 'created_at') else "",
                round_number=r.round_number,
                vote=vote_data.vote.value if vote_data and hasattr(vote_data.vote, 'value') else None,
                vote_rationale=vote_data.rationale if vote_data else None
            ))
            
    return ProposalDetailResponse(
        id=full_p.id,
        title=full_p.title,
        description=full_p.description or "",
        domain=full_p.domain,
        status=full_p.status.value if hasattr(full_p.status, 'value') else full_p.status,
        risk_tier=full_p.risk_tier,
        confidence_score=full_p.confidence_score,
        current_round=full_p.current_round,
        max_rounds=full_p.max_rounds,
        messages=messages
    )


async def run_deliberation_cycle(session, proposal, tenant_id, initial=False, start_round=1):
    import random
    
    # 1. Fetch Agents
    agents_res = await session.execute(select(AgentModel).filter(AgentModel.tenant_id == tenant_id))
    all_agents = agents_res.scalars().all()
    if not all_agents: return

    # 2. Fetch Past Relatable Proposal (RAG-Lite)
    # Simple logic: find one random APPROVED proposal
    past_query = select(ProposalModel).filter(
        ProposalModel.tenant_id == tenant_id,
        ProposalModel.status == ProposalStatus.APPROVED,
        ProposalModel.id != proposal.id
    ).limit(1)
    past_res = await session.execute(past_query)
    past_proposal = past_res.scalars().first()
    
    relatable_text = ""
    if past_proposal:
        relatable_text = f"Considering our past success with '{past_proposal.title}', "

    # 3. Deliberation Loop (5 Rounds)
    # If initial, rounds 1-5. If query (not initial), rounds start_round to start_round+4
    end_round = start_round + 5
    
    for r_num in range(start_round, end_round):
        rnd = RoundModel(
            proposal_id=proposal.id, 
            round_number=r_num, 
            round_type="deliberation" if r_num < end_round - 1 else "voting",
            tenant_id=tenant_id
        )
        session.add(rnd)
        await session.flush()
        
        # Contribution Logic
        for agent in all_agents:
            # Skip proposer in first round? No, let them speak.
            
            # Simple template logic
            content = generate_agent_thought(agent, r_num - start_round + 1, request_type="initial" if initial else "query", context=relatable_text)
            
            contrib = ContributionModel(
                round_id=rnd.id,
                agent_id=agent.id,
                content=content,
                tenant_id=tenant_id
            )
            session.add(contrib)
            
            # Add Vote in final round
            if r_num == end_round - 1:
                vote_val = VoteValue.APPROVE # Default to approve for demo
                if random.random() < 0.1: vote_val = VoteValue.ABSTAIN
                
                vote = VoteModel(
                    round_id=rnd.id,
                    voter_agent_id=agent.id,
                    vote=vote_val,
                    rationale="Aligned with strategic goals.",
                    tenant_id=tenant_id
                )
                session.add(vote)
        
        proposal.current_round = r_num
        await session.flush()
        
    # Update Status
    if initial:
        proposal.status = ProposalStatus.VOTING
        proposal.confidence_score = 0.88

def generate_agent_thought(agent, step_in_cycle, request_type, context=""):
    import random
    domain = agent.agent_type.value
    
    templates = {
        1: [
            f"Analyzing impact on {domain}. {context}Initial indicators match our growth targets.",
            f"From a {domain} perspective, this is viable. {context}Risk profile is within limits.",
            f"{domain.capitalize()} assessment: Positive. We should proceed with caution."
        ],
        2: [
            f"Deep diving into {domain} specifics. No major blockers found.",
            f"Reviewing cross-functional dependencies for {domain}. Looks clear.",
            f"Validating {domain} resource requirements. We are covered."
        ],
        3: [ # Challenge / Validation
            f"Challenging the timeline assumptions from {domain} view. But mitigation seems possible.",
            f"One risk in {domain} is scalability, but the proposal addresses it.",
            f"Verifying compliance metrics for {domain}. All checks pass."
        ],
        4: [ # Convergence
            f"Addressing all {domain} concerns. I am becoming confident.",
            f"{domain} strategy alignment confirmed. Ready for final decision.",
            f"Consensus building in {domain}. We support this direction."
        ],
        5: [ # Conclusion
            f"Final {domain} approval. This is a solid win.",
            f"Voting to APPROVE. {domain} is ready to execute.",
            f"Fully supportive from {domain} standpoint. Let's move forward."
        ]
    }
    
    if request_type == "query":
        # Adjust slightly for query response
        return f"[Query Response] {random.choice(templates.get(step_in_cycle))}"
        
    return random.choice(templates.get(step_in_cycle, ["Analyzing..."]))

class QueryProposalRequest(BaseModel):
    query: str

@router.post("/{proposal_id}/query")
async def query_proposal(
    proposal_id: str,
    request: QueryProposalRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Submit a query to the council, triggering a new deliberation cycle."""
    # Fetch proposal
    query = select(ProposalModel).filter(ProposalModel.id == proposal_id, ProposalModel.tenant_id == tenant_id)
    res = await session.execute(query)
    p = res.scalars().first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    # Add User Query as a "Challenge" or Message in a new round
    start_round = p.current_round + 1
    
    # We can insert a special "User" round or just start the cycle
    # Let's create a round for the Query itself
    query_round = RoundModel(
        proposal_id=p.id,
        round_number=start_round,
        round_type="query",
        tenant_id=tenant_id,
        summary=f"User Query: {request.query}"
    )
    session.add(query_round)
    await session.flush()
    
    # We need to record the user query. Since we don't have a 'user contribution' easily mapable unless we have a user agent?
    # Let's use a system agent or just store it in summary. 
    # Or creating a Contribution with no agent_id (if nullable) or a System Agent.
    # For now, let's just proceed to deliberation. The agents will "respond".
    
    # Run 5 rounds of deliberation responding to query
    p.status = ProposalStatus.DELIBERATING
    p.max_rounds = start_round + 5 # Update max rounds (Query + 5 new)
    await run_deliberation_cycle(session, p, tenant_id, initial=False, start_round=start_round + 1)
    
    p.status = ProposalStatus.VOTING
    await session.commit()
    
    return {"status": "success", "message": "Council is deliberating on your query", "next_round": p.current_round}

class UpdateProposalRequest(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None

@router.patch("/{proposal_id}")
async def update_proposal(
    proposal_id: str,
    request: UpdateProposalRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Update proposal status or details."""
    query = select(ProposalModel).filter(
        ProposalModel.id == proposal_id,
        ProposalModel.tenant_id == tenant_id
    )
    result = await session.execute(query)
    p = result.scalars().first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if request.status:
        # Map string to enum
        try:
            p.status = ProposalStatus(request.status)
        except ValueError:
            # Fallback if not exact match (e.g. frontend sends lowercase)
            pass
            
    if request.title:
        p.title = request.title
        
    await session.commit()
    await session.refresh(p)
    
    return {"status": "success", "id": p.id}

class ProposalMessageRequest(BaseModel):
    proposal: str
    agent_name: str
    agent_domain: str
    message: str
    round_number: int
    is_conclusion: bool = False
    metadata: Optional[dict] = {}

@router.post("/messages/")
async def add_proposal_message(
    request: ProposalMessageRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Add a message (contribution) to a proposal round."""
    # 1. Get Proposal
    query = select(ProposalModel).filter(
        ProposalModel.id == request.proposal,
        ProposalModel.tenant_id == tenant_id
    )
    result = await session.execute(query)
    p = result.scalars().first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    # 2. Get or Create Round
    # We need to find the round
    round_query = select(RoundModel).filter(
        RoundModel.proposal_id == p.id,
        RoundModel.round_number == request.round_number,
        RoundModel.tenant_id == tenant_id
    )
    round_res = await session.execute(round_query)
    rnd = round_res.scalars().first()
    
    if not rnd:
        rnd = RoundModel(
            proposal_id=p.id,
            round_number=request.round_number,
            tenant_id=tenant_id
        )
        session.add(rnd)
        await session.flush() # get ID
        
    # 3. Find Agent ID (if possible)
    agent_query = select(AgentModel).filter(
        AgentModel.tenant_id == tenant_id,
        AgentModel.name == request.agent_name
    )
    # Try name match first, else maybe by domain
    agent_res = await session.execute(agent_query)
    agent = agent_res.scalars().first()
    
    agent_id = agent.id if agent else None
    
    if not agent_id:
        # Fallback: Find any agent of this domain, or system agent?
        # If user/admin, maybe no agent_id? 
        # But ContributionModel REQUIREs agent_id.
        # We need a fallback agent or modify model to allow nullable agent_id (it is nullable in Code? No, nullable=False in Step 471)
        # We must assign an agent.
        # Let's find agent by domain.
        
        domain_query = select(AgentModel).filter(
            AgentModel.tenant_id == tenant_id,
            AgentModel.agent_type == request.agent_domain
        )
        d_res = await session.execute(domain_query)
        d_agent = d_res.scalars().first()
        if d_agent:
            agent_id = d_agent.id
        else:
            # If still no agent (e.g. "User (Admin)" or "system"), pick ANY agent or specific one?
            # Let's pick the first agent as fallback to avoid crash
            f_res = await session.execute(select(AgentModel).filter(AgentModel.tenant_id == tenant_id))
            f_agent = f_res.scalars().first()
            if f_agent:
                agent_id = f_agent.id
            else:
                 raise HTTPException(status_code=500, detail="No agents available to attribute message")
                 
    # 4. Create Contribution
    contrib = ContributionModel(
         round_id=rnd.id,
         agent_id=agent_id,
         content=request.message,
         tenant_id=tenant_id,
         # If it's a conclusion, maybe mark it differently? 
         # The model has rationale_bullets etc.
    )
    session.add(contrib)
    
    # Update proposal round if needed
    if request.round_number > p.current_round:
        p.current_round = request.round_number
        
    await session.commit()
    return {"status": "success", "id": contrib.id}

@router.get("", response_model=List[ProposalDetailResponse])
async def list_proposals(
    tenant_id: str = Query(..., description="Tenant ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    session: AsyncSession = Depends(get_async_session)
):
    """List all proposals from DB."""
    query = select(ProposalModel).filter(ProposalModel.tenant_id == tenant_id).order_by(desc(ProposalModel.created_at))
    if status:
        query = query.filter(ProposalModel.status == status.lower())
    
    result = await session.execute(query)
    db_proposals = result.scalars().all()
    
    return [
        ProposalDetailResponse(
            id=p.id,
            title=p.title,
            description=p.description or "",
            domain=p.domain,
            status=p.status.value if hasattr(p.status, 'value') else p.status,
            risk_tier=p.risk_tier,
            confidence_score=p.confidence_score,
            current_round=p.current_round,
            max_rounds=p.max_rounds
        )
        for p in db_proposals
    ]
