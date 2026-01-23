import sys
import os
import asyncio
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import app.agents # Force agent import
    from shared.database import init_database
    print("Imports successful")
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def main():
    print("Attempting to initialize database...")
    try:
        await init_database()
        print("Database initialized successfully!")
    except Exception as e:
        print(f"\n\nCRITICAL ERROR DURING STARTUP:\n{e}\n\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
