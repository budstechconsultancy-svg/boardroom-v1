from django.core.management.base import BaseCommand
from meetings.models import BoardMeeting


class Command(BaseCommand):
    help = 'Initialize active board meetings'

    def handle(self, *args, **options):
        # Check if any active meetings exist
        active_count = BoardMeeting.objects.filter(is_active=True).count()
        
        if active_count == 0:
            # Create a default active meeting
            meeting = BoardMeeting.objects.create(
                scheduled_time='09:00',
                timezone='Asia/Kolkata',
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Created active board meeting: {meeting}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {active_count} active board meeting(s) already exist'
                )
            )
