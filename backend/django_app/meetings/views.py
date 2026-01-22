from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import BoardMeeting, MeetingSession, AgentOpinion
from .serializers import BoardMeetingSerializer, MeetingSessionSerializer, AgentOpinionSerializer
from .services import MeetingExecutor

class BoardMeetingViewSet(viewsets.ModelViewSet):
    queryset = BoardMeeting.objects.all()
    serializer_class = BoardMeetingSerializer
    
    @action(detail=False, methods=['post'])
    def trigger(self, request):
        """Manually trigger a board meeting"""
        meeting_id = request.data.get('meeting_id')
        
        if meeting_id:
            try:
                meeting = BoardMeeting.objects.get(id=meeting_id, is_active=True)
            except BoardMeeting.DoesNotExist:
                return Response({
                    'error': 'Meeting not found or inactive'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # Get the first active meeting
            meeting = BoardMeeting.objects.filter(is_active=True).first()
            if not meeting:
                return Response({
                    'error': 'No active meetings configured'
                }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            executor = MeetingExecutor(meeting)
            session = executor.execute()
            
            return Response({
                'status': 'completed',
                'message': 'Board meeting executed successfully',
                'session_id': session.id,
                'summary': session.summary
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'failed',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeetingSessionViewSet(viewsets.ModelViewSet):
    queryset = MeetingSession.objects.all()
    serializer_class = MeetingSessionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range if provided
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(session_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(session_date__lte=date_to)
        
        return queryset


class AgentOpinionViewSet(viewsets.ModelViewSet):
    queryset = AgentOpinion.objects.all()
    serializer_class = AgentOpinionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by session
        session_id = self.request.query_params.get('session_id', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by proposal
        proposal_id = self.request.query_params.get('proposal_id', None)
        if proposal_id:
            queryset = queryset.filter(proposal_id=proposal_id)
        
        # Filter by agent
        agent_id = self.request.query_params.get('agent_id', None)
        if agent_id:
            queryset = queryset.filter(agent_id=agent_id)
        
        # Filter by requires_human_attention
        requires_attention = self.request.query_params.get('requires_attention', None)
        if requires_attention is not None:
            queryset = queryset.filter(requires_human_attention=requires_attention.lower() == 'true')
        
        return queryset
