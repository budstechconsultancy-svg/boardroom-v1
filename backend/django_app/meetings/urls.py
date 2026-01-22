from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardMeetingViewSet, MeetingSessionViewSet, AgentOpinionViewSet

router = DefaultRouter()
router.register(r'meetings', BoardMeetingViewSet)
router.register(r'sessions', MeetingSessionViewSet)
router.register(r'opinions', AgentOpinionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
