from django.contrib import admin
from .models import BoardMeeting, MeetingSession, DiscussionRound, AgentOpinion

@admin.register(BoardMeeting)
class BoardMeetingAdmin(admin.ModelAdmin):
    list_display = ['id', 'scheduled_time', 'timezone', 'is_active', 'last_run']
    list_filter = ['is_active']

@admin.register(MeetingSession)
class MeetingSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'proposal', 'session_date', 'status', 'total_rounds', 'completed_at']
    list_filter = ['status', 'session_date']

@admin.register(DiscussionRound)
class DiscussionRoundAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'round_number', 'agent', 'created_at']
    list_filter = ['round_number', 'created_at']

@admin.register(AgentOpinion)
class AgentOpinionAdmin(admin.ModelAdmin):
    list_display = ['id', 'agent', 'session', 'vote', 'confidence_score', 'requires_human_attention']
    list_filter = ['vote', 'requires_human_attention', 'created_at']

