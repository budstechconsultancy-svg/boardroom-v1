import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_app'))

django.setup()

from meetings.services import MeetingExecutor
from meetings.models import BoardMeeting

# Get the active board meeting
meeting = BoardMeeting.objects.filter(is_active=True).first()
if not meeting:
    print("ERROR: No active BoardMeeting found")
    sys.exit(1)

print(f"Found active BoardMeeting: {meeting.id}\n")

# Trigger 3 new meetings to show different proposals
for i in range(3):
    try:
        executor = MeetingExecutor(meeting)
        session = executor.execute()
        
        print(f"Meeting {i+1}:")
        print(f"  Proposal: {session.proposal.title}")
        print(f"  Rounds: {session.rounds.count()}")
        print()
        
    except Exception as e:
        print(f"ERROR: {e}")
