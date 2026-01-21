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
    conclusion_statement: Optional[str] = None


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
        max_rounds: int = 5,
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
        
        # Phase 4: Voting (only after minimum max_rounds (5) and conclusion)
        # Enforce minimum rounds of conversation before voting
        if context.current_round >= context.max_rounds or (context.current_round >= 3 and not challenges and context.current_round >= self.max_rounds):
            # Generate conclusion statement before voting
            if not hasattr(context, 'conclusion_statement') or not context.conclusion_statement:
                conclusion = await self._generate_conclusion(context)
                context.conclusion_statement = conclusion
                logger.info(f"Generated conclusion statement after {context.current_round} rounds")
            
            context.current_phase = DeliberationPhase.VOTING
            logger.info(f"Round {context.current_round}: Voting phase (rounds met)")
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
        else:
            # Continue deliberation - need more rounds
            logger.info(f"Round {context.current_round}: Continuing deliberation")
        
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
        import random
        
        # Generate round-specific conversation content
        round_num = context.current_round
        proposal_title = context.proposal.get("title", "this proposal")
        domain = context.proposal.get("domain", "general")
        
        # Evidence simulation
        possible_evidence = [
            "Quarterly Financial Report Q3 2025",
            "Employee Sentiment Survey Results",
            "Competitor Market Analysis 2026",
            "IT Security Compliance Audit",
            "Vendor Risk Assessment Report"
        ]
        
        # In production, call agent service for each agent
        # For now, generate contextual placeholder content
        for agent in agents:
            evidence = None
            if round_num == 1:
                # Round 1: Initial analysis
                content = f"I've analyzed {proposal_title} from the {agent.replace('Agent', '')} perspective. Based on our {domain} data, this proposal shows merit. I recommend we examine the implementation details and potential risks more closely."
            elif round_num == 2:
                # Round 2: Deeper discussion and challenges
                content = f"Building on Round 1 discussion, I've identified some concerns regarding {proposal_title}. Specifically, we need to address the impact on {agent.replace('Agent', '').lower()} operations. I'd like to hear other agents' perspectives on mitigation strategies."
                if random.random() > 0.6: # 40% chance of evidence
                    evidence = random.choice(possible_evidence)
            elif round_num == 3:
                # Round 3: Mitigation and refinement
                content = f"I've reviewed the proposed mitigation strategies. From a {agent.replace('Agent', '')} standpoint, these adjustments significantly reduce our risk exposure. I am attaching relevant compliance data to support this view."
                if random.random() > 0.5:
                    evidence = random.choice(possible_evidence)
            elif round_num == 4:
                # Round 4: Cross-functional alignment
                content = f"We are seeing strong alignment now. The financial and operational models for {proposal_title} are converging. We should double-check the long-term sustainability metrics before the final vote."
            else:
                # Round 5+: Synthesis and final thoughts
                content = f"After reviewing all 4 rounds of deliberation, I believe we have a solid plan for {proposal_title}. All major concerns have been addressed with evidence. I am prepared to cast my vote."
                if random.random() > 0.7:
                    evidence = "Final consolidated impact analysis"
            
            contributions.append({
                "agent": agent,
                "content": content,
                "confidence": 0.75 + (round_num * 0.05),  # Confidence increases with rounds
                "evidence_ids": [],
                "evidence": evidence, # Include evidence text
                "round_number": round_num
            })
        
        return contributions
    
    async def _collect_challenges(
        self,
        context: DeliberationContext,
        agents: List[str]
    ) -> List[Dict[str, Any]]:
        """Collect challenges from agents."""
        challenges = []
        
        # Generate challenges in round 2
        if context.current_round == 2 and len(agents) > 1:
            # One agent raises a challenge
            challenger = agents[1] if len(agents) > 1 else agents[0]
            challenges.append({
                "agent": challenger,
                "challenge_type": "risk",
                "content": f"{challenger} raised concerns about implementation timeline and resource allocation. These need to be addressed before proceeding.",
                "resolution": "Concerns were discussed and mitigation strategies were proposed by the team."
            })
        
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
    
    async def _generate_conclusion(
        self,
        context: DeliberationContext
    ) -> str:
        """
        Generate conclusion statement from deliberation rounds.
        
        Synthesizes all contributions, challenges, and discussions
        into a final summary statement.
        """
        conclusion_parts = [
            f"After {len(context.rounds)} rounds of deliberation on '{context.proposal.get('title', 'this proposal')}':",
            ""
        ]
        
        # Summarize each round
        for round_result in context.rounds:
            round_summary = []
            
            if round_result.contributions:
                agents = [c.get('agent', 'Agent') for c in round_result.contributions]
                round_summary.append(f"Round {round_result.round_number}: {', '.join(agents)} provided analysis")
            
            if round_result.challenges:
                challenge_count = len(round_result.challenges)
                round_summary.append(f"{challenge_count} concern(s) raised and addressed")
            
            if round_summary:
                conclusion_parts.append("- " + ", ".join(round_summary))
        
        conclusion_parts.append("")
        conclusion_parts.append("The agents have completed their multi-round analysis and are ready to vote.")
        
        return "\n".join(conclusion_parts)
    
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
