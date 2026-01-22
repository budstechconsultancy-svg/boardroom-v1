from rest_framework import serializers
from .models import BoardMeeting, MeetingSession, AgentOpinion

class BoardMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardMeeting
        fields = ['id', 'scheduled_time', 'timezone', 'is_active', 'last_run', 'created_at', 'updated_at']


class AgentOpinionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    agent_domain = serializers.SerializerMethodField()
    proposal_title = serializers.CharField(source='proposal.title', read_only=True)
    
    class Meta:
        model = AgentOpinion
        fields = [
            'id', 'session', 'agent', 'agent_name', 'agent_domain', 
            'proposal', 'proposal_title', 'opinion', 'previous_opinion',
            'recommendation', 'confidence_score', 'requires_human_attention',
            'created_at'
        ]
    
    def get_agent_domain(self, obj):
        # Extract domain from agent name (e.g., "Finance Agent" -> "finance")
        return obj.agent.name.lower().replace(' agent', '').replace(' ', '_')


class MeetingSessionSerializer(serializers.ModelSerializer):
    opinions = AgentOpinionSerializer(many=True, read_only=True)
    opinions_count = serializers.SerializerMethodField()
    attention_required_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MeetingSession
        fields = [
            'id', 'meeting', 'session_date', 'status', 
            'proposals_reviewed', 'summary', 'completed_at',
            'opinions', 'opinions_count', 'attention_required_count'
        ]
    
    def get_opinions_count(self, obj):
        return obj.opinions.count()
    
    def get_attention_required_count(self, obj):
        return obj.opinions.filter(requires_human_attention=True).count()
