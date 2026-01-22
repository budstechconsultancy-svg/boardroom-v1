from django.db import models
from agents.models import Agent
from proposals.models import Proposal

class BoardMeeting(models.Model):
    """Configuration for scheduled board meetings"""
    scheduled_time = models.TimeField(help_text="Daily execution time (HH:MM)")
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Board Meeting at {self.scheduled_time} ({self.timezone})"

    class Meta:
        ordering = ['-created_at']


class MeetingSession(models.Model):
    """Individual meeting session instance"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    meeting = models.ForeignKey(BoardMeeting, on_delete=models.CASCADE, related_name='sessions')
    session_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    proposals_reviewed = models.JSONField(default=list, help_text="List of proposal IDs reviewed")
    summary = models.JSONField(default=dict, blank=True, help_text="Session summary statistics")
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.id} - {self.session_date.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-session_date']


class AgentOpinion(models.Model):
    """Agent's opinion on a proposal during a meeting"""
    RECOMMENDATION_CHOICES = [
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('REQUEST_INFO', 'Request More Information'),
    ]
    
    session = models.ForeignKey(MeetingSession, on_delete=models.CASCADE, related_name='opinions')
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE)
    
    # Opinion data
    opinion = models.JSONField(help_text="Structured opinion data with analysis")
    previous_opinion = models.JSONField(null=True, blank=True, help_text="Previous opinion for comparison")
    
    # Decision metrics
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES)
    confidence_score = models.FloatField(help_text="Confidence score (0.0 - 1.0)")
    requires_human_attention = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.agent.name} on Proposal {self.proposal.id}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['session', 'agent', 'proposal']
