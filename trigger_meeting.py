import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_app'))

django.setup()

from meetings.services import MeetingExecutor
from meetings.models import BoardMeeting, MeetingSession
from proposals.models import Proposal

# Get the active board meeting
meeting = BoardMeeting.objects.filter(is_active=True).first()
if not meeting:
    print("ERROR: No active BoardMeeting found")
    sys.exit(1)

print(f"Found active BoardMeeting: {meeting.id}")

# Execute the meeting
try:
    executor = MeetingExecutor(meeting)
    session = executor.execute()
    print(f"\nNEW Meeting Session Created!")
    print(f"  Session ID: {session.id}")
    print(f"  Proposal: {session.proposal_id}")
    print(f"  Status: {session.status}")
    print(f"  Discussion Rounds: {session.rounds.count()}")
    
    # Show details
    print("\nDiscussion Rounds:")
    for round in session.rounds.all():
        print(f"  Round {round.round_number}: {round.agent.name} - {round.statement[:50]}...")
    
    print("\nVotes:")
    for opinion in session.opinions.all():
        print(f"  {opinion.agent.name}: {opinion.vote}")
        
    print("\nVote Summary:")
    print(f"  {session.summary}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
