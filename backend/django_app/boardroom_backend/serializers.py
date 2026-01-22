from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'status']

    def get_role(self, obj):
        if obj.is_superuser:
            return 'Owner'
        return 'CXO'

    def get_status(self, obj):
        return 'active' if obj.is_active else 'inactive'
