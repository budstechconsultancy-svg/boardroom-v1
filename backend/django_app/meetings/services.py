"""
Meeting execution service with multi-round discussion simulation
"""
import logging
import random
from django.utils import timezone
from .models import BoardMeeting, MeetingSession, DiscussionRound, AgentOpinion
from agents.models import Agent
from proposals.models import Proposal

logger = logging.getLogger(__name__)


class MeetingExecutor:
    """Execute board meetings with multi-round discussion (max 5 rounds)"""
    
    MAX_ROUNDS = 5
    
    def __init__(self, meeting):
        self.meeting = meeting
        self.session = None
        self.agents = []
    
    def execute(self):
        """Execute meeting with multi-round discussion"""
        logger.info(f'Starting board meeting {self.meeting.id}')
        
        # Get the next proposal
        proposal = Proposal.objects.filter(
            status__in=['deliberating', 'voting']
        ).order_by('created_at').first()
        
        if not proposal:
            logger.warning('No active proposals to review')
            return None
        
        # Create session for this proposal
        self.session = MeetingSession.objects.create(
            meeting=self.meeting,
            proposal=proposal,
            status='in_progress'
        )
        
        # Get active agents
        self.agents = list(Agent.objects.filter(is_active=True).order_by('?'))
        
        if not self.agents:
            logger.error('No active agents available')
            self._fail_session('No active agents')
            return self.session
        
        try:
            # Run multi-round discussion
            self._run_discussion_rounds(proposal)
            
            # Collect final votes
            self._collect_final_votes()
            
            # Complete session
            self._complete_session()
            
            # Update meeting last_run
            self.meeting.last_run = timezone.now()
            self.meeting.save()
            
            logger.info(f'Meeting completed for proposal {proposal.id}')
            return self.session
            
        except Exception as e:
            logger.error(f'Meeting execution failed: {str(e)}', exc_info=True)
            self._fail_session(str(e))
            raise
    
    def _run_discussion_rounds(self, proposal):
        """Simulate multi-round discussion on the proposal"""
        discussion_history = []
        agent_index = 0
        
        for round_num in range(1, self.MAX_ROUNDS + 1):
            logger.info(f'Starting discussion round {round_num}')
            
            # Get agent for this round
            agent = self.agents[agent_index % len(self.agents)]
            agent_index += 1
            
            # Determine what agent is responding to
            responds_to = None
            if round_num > 1 and discussion_history:
                responds_to = discussion_history[-1]
            
            # Generate discussion point
            discussion = self._generate_discussion_point(
                agent, proposal, round_num, discussion_history
            )
            
            # Create discussion round in database
            round_obj = DiscussionRound.objects.create(
                session=self.session,
                round_number=round_num,
                agent=agent,
                statement=discussion['statement'],
                evidence=discussion['evidence'],
                suggestions=discussion['suggestions'],
                responds_to=responds_to
            )
            
            discussion_history.append(round_obj)
            logger.debug(f'Round {round_num}: {agent.name} - {discussion["statement"][:80]}...')
            
            # Decide if discussion should continue (up to 5 rounds)
            if round_num < self.MAX_ROUNDS:
                # 60% chance to continue, 40% to wrap up
                should_continue = random.random() < 0.6
                if not should_continue:
                    logger.info(f'Discussion wrapped up after {round_num} rounds')
                    break
        
        self.session.total_rounds = len(discussion_history)
        self.session.save()
    
    def _generate_discussion_point(self, agent, proposal, round_num, history):
        """Generate a discussion point with evidence and suggestions"""
        domain = agent.name.lower().replace(' agent', '').replace(' ', '_')
        
        if round_num == 1:
            # First round - agent presents proposal and initial stance
            statement = (
                f"{agent.name} initiates discussion on '{proposal.title}'. "
                f"From a {domain} perspective, this proposal presents both opportunities and challenges. "
                f"Let me outline my analysis and recommendations."
            )
        else:
            # Subsequent rounds - respond to previous points
            if history:
                last_agent = history[-1].agent.name
                statement = (
                    f"{agent.name} responds to {last_agent}'s points. "
                    f"While I appreciate the {domain} perspective raised, "
                    f"I believe there are additional factors we should consider from the {domain} angle."
                )
            else:
                statement = f"{agent.name} provides input on '{proposal.title}'"
        
        evidence = [
            {
                "type": "regulatory",
                "description": f"Complies with {domain} standards and regulations",
                "reference": f"{domain.upper()}-2024-001"
            },
            {
                "type": "risk_assessment",
                "description": f"Risk level: {'Low' if round_num % 2 == 0 else 'Medium'} from {domain} perspective",
                "reference": "Internal Risk Assessment"
            },
            {
                "type": "benchmark",
                "description": f"Exceeds {domain} industry benchmarks",
                "reference": "2024 Industry Report"
            }
        ]
        
        suggestions = [
            f"Strengthen {domain} controls",
            f"Enhance {domain} governance framework",
            "Add more detailed audit trails",
            f"Implement automated {domain} monitoring"
        ]
        
        return {
            'statement': statement,
            'evidence': evidence,
            'suggestions': suggestions[:2]  # Only 2 suggestions per round
        }
    
    def _collect_final_votes(self):
        """Collect final votes from all agents after discussion"""
        vote_counts = {'APPROVE': 0, 'DISAPPROVE': 0, 'ABSTAIN': 0}
        
        for agent in self.agents:
            # Determine vote based on discussion rounds
            # Agents who spoke earlier tend to have stronger opinions
            agent_spoke = DiscussionRound.objects.filter(
                session=self.session,
                agent=agent
            ).exists()
            
            if agent_spoke:
                # Spoke agents lean approve (70% approve, 20% disapprove, 10% abstain)
                votes = ['APPROVE'] * 7 + ['DISAPPROVE'] * 2 + ['ABSTAIN'] * 1
                vote = random.choice(votes)
                confidence = round(random.uniform(0.75, 0.95), 2)
            else:
                # Silent agents more conservative (50% approve, 20% disapprove, 30% abstain)
                votes = ['APPROVE'] * 5 + ['DISAPPROVE'] * 2 + ['ABSTAIN'] * 3
                vote = random.choice(votes)
                confidence = round(random.uniform(0.60, 0.80), 2)
            
            # Create opinion record
            AgentOpinion.objects.create(
                session=self.session,
                agent=agent,
                proposal=self.session.proposal,
                vote=vote,
                confidence_score=confidence,
                requires_human_attention=(vote == 'DISAPPROVE' or confidence < 0.65)
            )
            
            vote_counts[vote] += 1
        
        return vote_counts
    
    def _complete_session(self):
        """Complete the session with summary"""
        # Get vote summary
        opinions = AgentOpinion.objects.filter(session=self.session)
        vote_counts = {
            'APPROVE': opinions.filter(vote='APPROVE').count(),
            'DISAPPROVE': opinions.filter(vote='DISAPPROVE').count(),
            'ABSTAIN': opinions.filter(vote='ABSTAIN').count()
        }
        
        # Determine overall recommendation
        if vote_counts['APPROVE'] > vote_counts['DISAPPROVE']:
            overall = 'APPROVE'
        elif vote_counts['DISAPPROVE'] > vote_counts['APPROVE']:
            overall = 'DISAPPROVE'
        else:
            overall = 'SPLIT'
        
        self.session.status = 'completed'
        self.session.completed_at = timezone.now()
        self.session.summary = {
            'proposal_title': self.session.proposal.title,
            'total_rounds': self.session.total_rounds,
            'agent_count': len(self.agents),
            'vote_counts': vote_counts,
            'overall_recommendation': overall,
            'opinions_count': opinions.count()
        }
        self.session.save()
    
    def _fail_session(self, error_message):
        """Mark session as failed"""
        self.session.status = 'failed'
        self.session.summary = {'error': error_message}
        self.session.save()
