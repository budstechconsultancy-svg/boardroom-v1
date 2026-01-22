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
    """Individual meeting session instance - discusses 1 proposal across multiple rounds"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    meeting = models.ForeignKey(BoardMeeting, on_delete=models.CASCADE, related_name='sessions')
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, null=True, blank=True)
    session_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    total_rounds = models.IntegerField(default=0, help_text="Total discussion rounds (max 5)")
    summary = models.JSONField(default=dict, blank=True, help_text="Session summary with voting results")
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.id} - {self.session_date.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-session_date']


class DiscussionRound(models.Model):
    """A single round of discussion in a meeting session"""
    session = models.ForeignKey(MeetingSession, on_delete=models.CASCADE, related_name='rounds')
    round_number = models.IntegerField(help_text="Round number (1-5)")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE)
    
    # Discussion content
    statement = models.TextField(help_text="Agent's statement or proposal")
    evidence = models.JSONField(default=list, help_text="Supporting evidence and references")
    suggestions = models.JSONField(default=list, help_text="Suggestions for improvement")
    
    # Context
    responds_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Which round is this responding to")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Round {self.round_number} - {self.agent.name}"
    
    class Meta:
        ordering = ['round_number', 'created_at']
        unique_together = ['session', 'round_number', 'agent']


class AgentOpinion(models.Model):
    """Final opinion & vote after discussion rounds"""
    VOTE_CHOICES = [
        ('APPROVE', 'Approve'),
        ('DISAPPROVE', 'Disapprove'),
        ('ABSTAIN', 'Abstain'),
    ]
    

    session = models.ForeignKey(MeetingSession, on_delete=models.CASCADE, related_name='opinions')
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE)
    
    # Discussion & Analysis
    analysis = models.TextField(blank=True, help_text="Detailed analysis of the proposal")
    suggestions = models.JSONField(default=list, blank=True, help_text="List of suggestions for improvement")
    improvements = models.JSONField(default=dict, blank=True, help_text="Proposed improvements or changes")
    evidence = models.JSONField(default=list, blank=True, help_text="Supporting evidence and references")
    
    # Voting & Decision
    vote = models.CharField(max_length=20, choices=VOTE_CHOICES)
    confidence_score = models.FloatField(help_text="Confidence score (0.0 - 1.0)")
    
    # Flags
    requires_human_attention = models.BooleanField(default=False)
    
    # Previous comparison
    previous_opinion = models.JSONField(null=True, blank=True, help_text="Previous opinion for comparison")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.agent.name} - {self.vote} on Proposal {self.proposal.id}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['session', 'agent', 'proposal']
