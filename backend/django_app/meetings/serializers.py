from rest_framework import serializers
from .models import BoardMeeting, MeetingSession, DiscussionRound, AgentOpinion

class BoardMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardMeeting
        fields = ['id', 'scheduled_time', 'timezone', 'is_active', 'last_run', 'created_at', 'updated_at']


class DiscussionRoundSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    agent_domain = serializers.SerializerMethodField()
    
    class Meta:
        model = DiscussionRound
        fields = [
            'id', 'round_number', 'agent', 'agent_name', 'agent_domain',
            'statement', 'evidence', 'suggestions', 'responds_to', 'created_at'
        ]
    
    def get_agent_domain(self, obj):
        return obj.agent.name.lower().replace(' agent', '').replace(' ', '_')


class AgentOpinionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    agent_domain = serializers.SerializerMethodField()
    
    class Meta:
        model = AgentOpinion
        fields = [
            'id', 'session', 'agent', 'agent_name', 'agent_domain',
            'vote', 'confidence_score', 'requires_human_attention', 'created_at'
        ]
    
    def get_agent_domain(self, obj):
        return obj.agent.name.lower().replace(' agent', '').replace(' ', '_')


class MeetingSessionSerializer(serializers.ModelSerializer):
    rounds = DiscussionRoundSerializer(many=True, read_only=True)
    opinions = AgentOpinionSerializer(many=True, read_only=True)
    proposal_title = serializers.CharField(source='proposal.title', read_only=True)
    
    class Meta:
        model = MeetingSession
        fields = [
            'id', 'meeting', 'proposal', 'proposal_title', 'session_date', 'status',
            'total_rounds', 'summary', 'completed_at', 'rounds', 'opinions'
        ]

