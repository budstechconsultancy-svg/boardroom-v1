from rest_framework import viewsets
from .models import Agent
from .serializers import AgentSerializer

from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import Agent
from .serializers import AgentSerializer

class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

    def perform_create(self, serializer):
        agent = serializer.save()
        # Automatically create a user profile for the new agent
        username = agent.name.lower().replace(' ', '_')
        email = f"{username}@boardroom.ai"
        
        if not User.objects.filter(username=username).exists():
            User.objects.create_user(
                username=username,
                email=email,
                first_name=agent.name,
                password='password123' # Default password
            )
