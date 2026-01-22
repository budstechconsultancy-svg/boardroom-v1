from django.db import models

class Proposal(models.Model):
    STATUS_CHOICES = [
        ('deliberating', 'Deliberating'),
        ('voting', 'Voting'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending_ceo', 'Pending CEO'),
        ('executed', 'Executed'),
    ]

    RISK_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=255)
    domain = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='deliberating')
    risk_tier = models.CharField(max_length=20, choices=RISK_CHOICES, default='medium')
    confidence = models.FloatField(default=0.0)
    content = models.JSONField(default=dict)
    proposer = models.CharField(max_length=100, blank=True, null=True)
    impact_summary = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class DeliberationMessage(models.Model):
    proposal = models.ForeignKey(Proposal, related_name='messages', on_delete=models.CASCADE)
    agent_name = models.CharField(max_length=100, default='')
    agent_domain = models.CharField(max_length=100, default='')
    message = models.TextField()
    round_number = models.IntegerField(default=1)
    is_conclusion = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.agent_name} on {self.proposal.title}"
