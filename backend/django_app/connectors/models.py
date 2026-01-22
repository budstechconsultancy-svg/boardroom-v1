from django.db import models

class Connector(models.Model):
    TYPE_CHOICES = [
        ('MYSQL', 'MySQL'),
        ('POSTGRES', 'PostgreSQL'),
        ('REDIS', 'Redis'),
        ('KAFKA', 'Kafka'),
        ('MILVUS', 'Milvus'),
        ('S3', 'S3/Minio'),
    ]

    name = models.CharField(max_length=100)
    connector_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    config = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.connector_type})"
