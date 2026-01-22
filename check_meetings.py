import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_app'))

django.setup()

from meetings.models import BoardMeeting, MeetingSession
from proposals.models import Proposal

print("=== BoardMeetings ===")
active = BoardMeeting.objects.filter(is_active=True).count()
print(f"Active BoardMeetings: {active}")

total = BoardMeeting.objects.count()
print(f"Total BoardMeetings: {total}")

for m in BoardMeeting.objects.all()[:5]:
    print(f"  ID: {m.id}, Active: {m.is_active}")

print("\n=== Proposals ===")
proposals = Proposal.objects.all()[:5]
for p in proposals:
    print(f"  ID: {p.id}, Status: {p.status}, Title: {p.title}")

print("\n=== MeetingSessions ===")
sessions = MeetingSession.objects.all().order_by('-session_date')[:3]
for s in sessions:
    rounds = s.rounds.count()
    print(f"  ID: {s.id}, Proposal: {s.proposal_id}, Rounds: {rounds}, Status: {s.status}")
