from rest_framework import viewsets
from .models import Proposal, DeliberationMessage
from .serializers import ProposalSerializer, DeliberationMessageSerializer

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all().order_by('-created_at')
    serializer_class = ProposalSerializer

class DeliberationMessageViewSet(viewsets.ModelViewSet):
    queryset = DeliberationMessage.objects.all().order_by('timestamp')
    serializer_class = DeliberationMessageSerializer
