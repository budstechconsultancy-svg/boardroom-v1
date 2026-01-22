from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProposalViewSet, DeliberationMessageViewSet

router = DefaultRouter()
router.register(r'messages', DeliberationMessageViewSet)
router.register(r'', ProposalViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
