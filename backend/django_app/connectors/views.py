from rest_framework import viewsets
from .models import Connector
from .serializers import ConnectorSerializer

class ConnectorViewSet(viewsets.ModelViewSet):
    queryset = Connector.objects.all()
    serializer_class = ConnectorSerializer
