from rest_framework import serializers
from .models import Proposal, DeliberationMessage

class DeliberationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliberationMessage
        fields = '__all__'

class ProposalSerializer(serializers.ModelSerializer):
    messages = DeliberationMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = '__all__'
