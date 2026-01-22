import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
django.setup()

with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE agents_agent ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role")
        print("Column is_active added successfully")
    except Exception as e:
        print(f"Error: {e}")
