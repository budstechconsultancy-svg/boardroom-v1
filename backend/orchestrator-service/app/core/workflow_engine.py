"""
Workflow Engine for Board Deliberation.

Implements: propose → challenge → counterproposal → vote
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class DeliberationPhase(str, Enum):
    """Phases of deliberation."""
    
    PROPOSAL = "proposal"
    CHALLENGE = "challenge"
    COUNTERPROPOSAL = "counterproposal"
    VOTING = "voting"
    CEO_REVIEW = "ceo_review"
    COMPLETED = "completed"


class DeliberationStatus(str, Enum):
    """Status of deliberation."""
    
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_VOTE = "awaiting_vote"
    AWAITING_CEO = "awaiting_ceo"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


@dataclass
class RoundResult:
    """Result of a deliberation round."""
    
    round_number: int
    phase: DeliberationPhase
    contributions: List[Dict[str, Any]] = field(default_factory=list)
    challenges: List[Dict[str, Any]] = field(default_factory=list)
    votes: List[Dict[str, Any]] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class DeliberationContext:
    """Context for a deliberation session."""
    
    deliberation_id: str
    tenant_id: str
    proposal_id: str
    proposal: Dict[str, Any]
    current_phase: DeliberationPhase
    current_round: int
    max_rounds: int
    quorum_percentage: int
    ceo_mode: str  # ai, human, hybrid
    rounds: List[RoundResult] = field(default_factory=list)
    status: DeliberationStatus = DeliberationStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)


class WorkflowEngine:
    """
    Board Deliberation Workflow Engine.
    
    Orchestrates the multi-agent deliberation process:
    1. Collect agent contributions for current proposal
    2. Allow agents to raise challenges
    3. Allow counter-proposals
    4. Conduct voting with weighted scores
    5. CEO review (based on ceo_mode)
    """
    
    def __init__(
        self,
        agent_service_url: str = "http://localhost:8001",
        max_rounds: int = 3,
        round_timeout_seconds: int = 60,
        quorum_percentage: int = 60
    ):
        self.agent_service_url = agent_service_url
        self.max_rounds = max_rounds
        self.round_timeout = round_timeout_seconds
        self.quorum_percentage = quorum_percentage
        self._active_deliberations: Dict[str, DeliberationContext] = {}
    
    async def start_deliberation(
        self,
        tenant_id: str,
        proposal: Dict[str, Any],
        agents: List[str],
        ceo_mode: str = "hybrid"
    ) -> DeliberationContext:
        """
        Start a new deliberation session.
        
        Args:
            tenant_id: Tenant ID
            proposal: The proposal to deliberate
            agents: List of agent names to participate
            ceo_mode: ai | human | hybrid
            
        Returns:
            DeliberationContext for tracking
        """
        import uuid
        
        deliberation_id = str(uuid.uuid4())
        
        context = DeliberationContext(
            deliberation_id=deliberation_id,
            tenant_id=tenant_id,
            proposal_id=proposal.get("id", ""),
            proposal=proposal,
            current_phase=DeliberationPhase.PROPOSAL,
            current_round=1,
            max_rounds=self.max_rounds,
            quorum_percentage=self.quorum_percentage,
            ceo_mode=ceo_mode,
            status=DeliberationStatus.IN_PROGRESS
        )
        
        self._active_deliberations[deliberation_id] = context
        
        logger.info(f"Started deliberation {deliberation_id} for proposal {proposal.get('title')}")
        
        return context
    
    async def run_round(
        self,
        deliberation_id: str,
        participating_agents: List[str]
    ) -> RoundResult:
        """
        Run a single deliberation round.
        
        Each round goes through:
        1. Collect contributions from agents
        2. Collect challenges
        3. Collect counter-proposals (if any challenges)
        4. Voting if final round
        """
        context = self._active_deliberations.get(deliberation_id)
        if not context:
            raise ValueError(f"Deliberation not found: {deliberation_id}")
        
        round_result = RoundResult(
            round_number=context.current_round,
            phase=context.current_phase,
            started_at=datetime.utcnow()
        )
        
        # Phase 1: Collect contributions
        logger.info(f"Round {context.current_round}: Collecting contributions")
        contributions = await self._collect_contributions(
            context, participating_agents
        )
        round_result.contributions = contributions
        
        # Phase 2: Collect challenges
        context.current_phase = DeliberationPhase.CHALLENGE
        logger.info(f"Round {context.current_round}: Collecting challenges")
        challenges = await self._collect_challenges(
            context, participating_agents
        )
        round_result.challenges = challenges
        
        # Phase 3: Counter-proposals if challenges exist
        if challenges:
            context.current_phase = DeliberationPhase.COUNTERPROPOSAL
            # Allow proposer to respond
            logger.info(f"Round {context.current_round}: Counter-proposal phase")
        
        # Phase 4: Voting (if final round or max rounds reached)
        if context.current_round >= context.max_rounds or not challenges:
            context.current_phase = DeliberationPhase.VOTING
            logger.info(f"Round {context.current_round}: Voting phase")
            votes = await self._collect_votes(context, participating_agents)
            round_result.votes = votes
            
            # Tally votes
            decision = self._tally_votes(votes)
            
            # CEO review based on mode
            if context.ceo_mode == "ai":
                # AI CEO makes final decision
                final_decision = await self._ceo_ai_review(context, decision)
            elif context.ceo_mode == "human":
                # Queue for human CEO review
                context.status = DeliberationStatus.AWAITING_CEO
                final_decision = None
            else:  # hybrid
                # Based on risk tier
                risk_tier = context.proposal.get("risk_tier", "medium")
                if risk_tier == "low":
                    final_decision = await self._ceo_ai_review(context, decision)
                else:
                    context.status = DeliberationStatus.AWAITING_CEO
                    final_decision = None
            
            if final_decision:
                context.status = (
                    DeliberationStatus.APPROVED 
                    if final_decision == "approve" 
                    else DeliberationStatus.REJECTED
                )
                context.current_phase = DeliberationPhase.COMPLETED
        
        round_result.completed_at = datetime.utcnow()
        context.rounds.append(round_result)
        context.current_round += 1
        
        return round_result
    
    async def _collect_contributions(
        self,
        context: DeliberationContext,
        agents: List[str]
    ) -> List[Dict[str, Any]]:
        """Collect contributions from agents."""
        contributions = []
        
        # In production, call agent service for each agent
        # For now, return placeholder
        for agent in agents:
            contributions.append({
                "agent": agent,
                "content": f"Contribution from {agent}",
                "confidence": 0.8,
                "evidence_ids": []
            })
        
        return contributions
    
    async def _collect_challenges(
        self,
        context: DeliberationContext,
        agents: List[str]
    ) -> List[Dict[str, Any]]:
        """Collect challenges from agents."""
        challenges = []
        
        # In production, call agent service for each agent
        for agent in agents:
            # Agent may or may not raise a challenge
            pass
        
        return challenges
    
    async def _collect_votes(
        self,
        context: DeliberationContext,
        agents: List[str]
    ) -> List[Dict[str, Any]]:
        """Collect votes from agents."""
        votes = []
        
        for agent in agents:
            votes.append({
                "agent": agent,
                "vote": "approve",  # approve, reject, abstain
                "weight": 1.0,
                "rationale": f"Vote rationale from {agent}"
            })
        
        return votes
    
    def _tally_votes(self, votes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Tally weighted votes."""
        approve_weight = 0.0
        reject_weight = 0.0
        abstain_weight = 0.0
        
        for vote in votes:
            weight = vote.get("weight", 1.0)
            if vote["vote"] == "approve":
                approve_weight += weight
            elif vote["vote"] == "reject":
                reject_weight += weight
            else:
                abstain_weight += weight
        
        total_weight = approve_weight + reject_weight + abstain_weight
        
        return {
            "approve_percentage": (approve_weight / total_weight * 100) if total_weight > 0 else 0,
            "reject_percentage": (reject_weight / total_weight * 100) if total_weight > 0 else 0,
            "abstain_percentage": (abstain_weight / total_weight * 100) if total_weight > 0 else 0,
            "recommendation": "approve" if approve_weight > reject_weight else "reject"
        }
    
    async def _ceo_ai_review(
        self,
        context: DeliberationContext,
        vote_tally: Dict[str, Any]
    ) -> str:
        """AI CEO makes final decision."""
        # In production, call CEO agent
        if vote_tally["approve_percentage"] >= context.quorum_percentage:
            return "approve"
        return "reject"
    
    def get_deliberation(self, deliberation_id: str) -> Optional[DeliberationContext]:
        """Get deliberation context."""
        return self._active_deliberations.get(deliberation_id)
    
    def get_deliberation_summary(self, deliberation_id: str) -> Dict[str, Any]:
        """Get summary of deliberation."""
        context = self._active_deliberations.get(deliberation_id)
        if not context:
            return {}
        
        return {
            "id": context.deliberation_id,
            "proposal_id": context.proposal_id,
            "status": context.status.value,
            "current_phase": context.current_phase.value,
            "current_round": context.current_round,
            "max_rounds": context.max_rounds,
            "rounds_completed": len(context.rounds),
            "created_at": context.created_at.isoformat()
        }


# Global workflow engine instance
workflow_engine = WorkflowEngine()
