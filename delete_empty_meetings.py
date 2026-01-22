import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_app'))

django.setup()

from meetings.models import MeetingSession

# Delete the empty session (0 rounds)
empty_sessions = MeetingSession.objects.filter(rounds__isnull=True)
count = empty_sessions.count()
print(f"Found {count} empty sessions (no rounds)")

# Also check sessions with 0 rounds
zero_rounds = MeetingSession.objects.all()
for s in zero_rounds:
    if s.rounds.count() == 0:
        print(f"Session {s.id}: {s.proposal_id if s.proposal else 'No proposal'} - 0 rounds")
        s.delete()
        print(f"  Deleted!")
