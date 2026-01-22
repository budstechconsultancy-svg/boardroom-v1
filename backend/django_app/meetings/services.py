"""
Meeting execution service for scheduled board meetings
"""
import logging
from django.utils import timezone
from .models import BoardMeeting, MeetingSession, AgentOpinion
from agents.models import Agent
from proposals.models import Proposal

logger = logging.getLogger(__name__)

class MeetingExecutor:
    """Service to execute board meetings"""
    
    def __init__(self, meeting):
        self.meeting = meeting
        self.session = None
    
    def execute(self):
        """Execute the meeting and return the session"""
        logger.info(f'Starting board meeting {self.meeting.id}')
        
        # Create session
        self.session = MeetingSession.objects.create(
            meeting=self.meeting,
            status='in_progress'
        )
        
        try:
            # Get active proposals
            active_proposals = Proposal.objects.filter(
                status__in=['voting', 'deliberating']
            )
            
            if not active_proposals.exists():
                logger.warning('No active proposals to review')
                self._complete_session(success=True)
                return self.session
            
            # Get active agents
            active_agents = Agent.objects.filter(is_active=True)
            
            if not active_agents.exists():
                logger.error('No active agents available')
                self._fail_session('No active agents')
                return self.session
            
            # Generate opinions
            stats = self._generate_opinions(active_proposals, active_agents)
            
            # Complete session
            self._complete_session(success=True, stats=stats)
            
            # Update meeting last_run
            self.meeting.last_run = timezone.now()
            self.meeting.save()
            
            logger.info(f'Meeting completed successfully: {stats}')
            return self.session
            
        except Exception as e:
            logger.error(f'Meeting execution failed: {str(e)}', exc_info=True)
            self._fail_session(str(e))
            raise
    
    def _generate_opinions(self, proposals, agents):
        """Generate opinions for all agent-proposal combinations"""
        proposal_ids = []
        opinions_created = 0
        attention_required = 0
        
        for proposal in proposals:
            proposal_ids.append(proposal.id)
            
            for agent in agents:
                logger.debug(f'Generating opinion: {agent.name} on Proposal {proposal.id}')
                
                # Get previous opinion
                previous_opinion_obj = AgentOpinion.objects.filter(
                    agent=agent,
                    proposal=proposal
                ).exclude(session=self.session).order_by('-created_at').first()
                
                previous_opinion = previous_opinion_obj.opinion if previous_opinion_obj else None
                
                # Generate new opinion
                opinion_data = self._create_opinion_data(agent, proposal, previous_opinion)
                
                # Save opinion
                agent_opinion = AgentOpinion.objects.create(
                    session=self.session,
                    agent=agent,
                    proposal=proposal,
                    opinion=opinion_data['opinion'],
                    previous_opinion=previous_opinion,
                    recommendation=opinion_data['recommendation'],
                    confidence_score=opinion_data['confidence_score'],
                    requires_human_attention=opinion_data['requires_human_attention']
                )
                
                opinions_created += 1
                if agent_opinion.requires_human_attention:
                    attention_required += 1
        
        return {
            'total_proposals': len(proposal_ids),
            'total_opinions': opinions_created,
            'attention_required': attention_required,
            'agents_participated': agents.count(),
            'proposal_ids': proposal_ids
        }
    
    def _create_opinion_data(self, agent, proposal, previous_opinion):
        """Create opinion data structure"""
        # This is a placeholder - in production, this would call an LLM service
        import random
        
        domain = agent.name.lower().replace(' agent', '').replace(' ', '_')
        
        analysis = {
            'summary': f'{agent.name} has reviewed "{proposal.title}" from a {domain} perspective.',
            'improvements': [
                f'Optimize {domain}-specific processes',
                'Enhance documentation and compliance tracking'
            ],
            'risks': [
                f'Potential {domain} compliance challenges',
                'Resource allocation and timeline concerns'
            ],
            'opportunities': [
                f'Leverage for {domain} efficiency improvements',
                'Standardize processes across organization'
            ],
            'policy_changes': []
        }
        
        # Weighted recommendation
        recommendations = ['APPROVE', 'APPROVE', 'APPROVE', 'REQUEST_INFO', 'REJECT']
        recommendation = random.choice(recommendations)
        
        # Confidence score
        confidence_score = round(random.uniform(0.65, 0.95), 2)
        
        # Human attention flag
        requires_human_attention = (
            recommendation == 'REJECT' or 
            confidence_score < 0.75 or
            proposal.status == 'voting'
        )
        
        # Check for changes from previous opinion
        changes_from_previous = {
            'has_changes': False,
            'previous_recommendation': None,
            'reason_for_change': None
        }
        
        if previous_opinion:
            prev_rec = previous_opinion.get('recommendation')
            if prev_rec and prev_rec != recommendation:
                changes_from_previous = {
                    'has_changes': True,
                    'previous_recommendation': prev_rec,
                    'reason_for_change': 'Updated analysis based on new information'
                }
        
        opinion = {
            'agent_id': str(agent.id),
            'agent_domain': domain,
            'proposal_id': str(proposal.id),
            'analysis': analysis,
            'recommendation': recommendation,
            'confidence_score': confidence_score,
            'requires_human_attention': requires_human_attention,
            'changes_from_previous': changes_from_previous,
            'timestamp': timezone.now().isoformat()
        }
        
        return {
            'opinion': opinion,
            'recommendation': recommendation,
            'confidence_score': confidence_score,
            'requires_human_attention': requires_human_attention
        }
    
    def _complete_session(self, success=True, stats=None):
        """Mark session as completed"""
        if stats:
            self.session.proposals_reviewed = stats.get('proposal_ids', [])
            self.session.summary = stats
        
        self.session.status = 'completed'
        self.session.completed_at = timezone.now()
        self.session.save()
    
    def _fail_session(self, error_message):
        """Mark session as failed"""
        self.session.status = 'failed'
        self.session.summary = {'error': error_message}
        self.session.save()
