from django.core.management.base import BaseCommand
from django.utils import timezone
from meetings.models import BoardMeeting, MeetingSession, AgentOpinion
from agents.models import Agent
from proposals.models import Proposal
import json
from datetime import datetime

class Command(BaseCommand):
    help = 'Run a board meeting session'

    def add_arguments(self, parser):
        parser.add_argument(
            '--meeting-id',
            type=int,
            help='Specific meeting ID to run (optional)',
        )

    def handle(self, *args, **options):
        meeting_id = options.get('meeting_id')
        
        if meeting_id:
            try:
                meeting = BoardMeeting.objects.get(id=meeting_id, is_active=True)
                meetings = [meeting]
            except BoardMeeting.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Meeting {meeting_id} not found or inactive'))
                return
        else:
            meetings = BoardMeeting.objects.filter(is_active=True)
        
        if not meetings:
            self.stdout.write(self.style.WARNING('No active meetings configured'))
            return
        
        for meeting in meetings:
            self.stdout.write(f'Running board meeting {meeting.id}...')
            self.run_meeting(meeting)
    
    def run_meeting(self, meeting):
        """Execute a board meeting session"""
        # Create meeting session
        session = MeetingSession.objects.create(
            meeting=meeting,
            status='in_progress'
        )
        
        try:
            # Get all active proposals in VOTING or DELIBERATING status
            active_proposals = Proposal.objects.filter(
                status__in=['voting', 'deliberating']
            )
            
            if not active_proposals.exists():
                self.stdout.write(self.style.WARNING('No active proposals to review'))
                session.status = 'completed'
                session.completed_at = timezone.now()
                session.save()
                return
            
            # Get all active agents
            active_agents = Agent.objects.filter(is_active=True)
            
            if not active_agents.exists():
                self.stdout.write(self.style.ERROR('No active agents available'))
                session.status = 'failed'
                session.save()
                return
            
            proposal_ids = []
            opinions_created = 0
            attention_required = 0
            
            # Generate opinions for each agent-proposal combination
            for proposal in active_proposals:
                proposal_ids.append(proposal.id)
                
                for agent in active_agents:
                    self.stdout.write(f'  Generating opinion: {agent.name} on Proposal {proposal.id}')
                    
                    # Generate opinion
                    opinion_data = self.generate_opinion(agent, proposal, session)
                    
                    # Get previous opinion if exists
                    previous_opinion_obj = AgentOpinion.objects.filter(
                        agent=agent,
                        proposal=proposal
                    ).exclude(session=session).order_by('-created_at').first()
                    
                    previous_opinion = previous_opinion_obj.opinion if previous_opinion_obj else None
                    
                    # Create opinion record
                    agent_opinion = AgentOpinion.objects.create(
                        session=session,
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
            
            # Update session
            session.proposals_reviewed = proposal_ids
            session.summary = {
                'total_proposals': len(proposal_ids),
                'total_opinions': opinions_created,
                'attention_required': attention_required,
                'agents_participated': active_agents.count()
            }
            session.status = 'completed'
            session.completed_at = timezone.now()
            session.save()
            
            # Update meeting last_run
            meeting.last_run = timezone.now()
            meeting.save()
            
            self.stdout.write(self.style.SUCCESS(
                f'Meeting completed: {opinions_created} opinions generated, '
                f'{attention_required} require human attention'
            ))
            
            # TODO: Send notification to users
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Meeting failed: {str(e)}'))
            session.status = 'failed'
            session.save()
            raise
    
    def generate_opinion(self, agent, proposal, session):
        """Generate agent opinion for a proposal"""
        # This is a simplified version - in production, this would call an LLM
        # For now, we'll create a structured opinion based on agent domain
        
        domain = agent.name.lower().replace(' agent', '').replace(' ', '_')
        
        # Simulate domain-specific analysis
        analysis = {
            'summary': f'{agent.name} has reviewed {proposal.title} from a {domain} perspective.',
            'improvements': [
                f'Consider {domain}-specific optimization',
                'Enhance documentation for better clarity'
            ],
            'risks': [
                f'Potential {domain} compliance issues',
                'Resource allocation concerns'
            ],
            'opportunities': [
                f'Leverage this for {domain} efficiency gains',
                'Potential for process standardization'
            ],
            'policy_changes': []
        }
        
        # Determine recommendation based on proposal status and domain
        import random
        recommendations = ['APPROVE', 'APPROVE', 'REQUEST_INFO', 'REJECT']  # Weighted towards approval
        recommendation = random.choice(recommendations)
        
        # Calculate confidence score
        confidence_score = round(random.uniform(0.65, 0.95), 2)
        
        # Determine if human attention is required
        requires_human_attention = (
            recommendation == 'REJECT' or 
            confidence_score < 0.75 or
            proposal.status == 'voting'
        )
        
        opinion = {
            'agent_id': str(agent.id),
            'agent_domain': domain,
            'proposal_id': str(proposal.id),
            'analysis': analysis,
            'recommendation': recommendation,
            'confidence_score': confidence_score,
            'requires_human_attention': requires_human_attention,
            'timestamp': timezone.now().isoformat()
        }
        
        return {
            'opinion': opinion,
            'recommendation': recommendation,
            'confidence_score': confidence_score,
            'requires_human_attention': requires_human_attention
        }
