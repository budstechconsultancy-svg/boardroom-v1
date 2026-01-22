from django.db import models

class Agent(models.Model):
    name = models.CharField(max_length=100)
    role = models.TextField()
    is_active = models.BooleanField(default=True)
    vote_weight = models.FloatField(default=1.0)
    can_execute = models.BooleanField(default=False)
    configuration = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.role})"
