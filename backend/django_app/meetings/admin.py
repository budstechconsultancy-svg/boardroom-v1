from django.contrib import admin
from .models import BoardMeeting, MeetingSession, AgentOpinion

@admin.register(BoardMeeting)
class BoardMeetingAdmin(admin.ModelAdmin):
    list_display = ['id', 'scheduled_time', 'timezone', 'is_active', 'last_run']
    list_filter = ['is_active']

@admin.register(MeetingSession)
class MeetingSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session_date', 'status', 'completed_at']
    list_filter = ['status', 'session_date']

@admin.register(AgentOpinion)
class AgentOpinionAdmin(admin.ModelAdmin):
    list_display = ['id', 'agent', 'proposal', 'recommendation', 'confidence_score', 'requires_human_attention']
    list_filter = ['recommendation', 'requires_human_attention', 'created_at']
