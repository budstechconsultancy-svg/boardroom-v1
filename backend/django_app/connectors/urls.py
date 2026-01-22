from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConnectorViewSet

router = DefaultRouter()
router.register(r'', ConnectorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
