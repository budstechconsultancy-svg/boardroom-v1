import sys
import os
print(f"Current CWD: {os.getcwd()}")
print(f"File: {__file__}")
parent = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
print(f"Adding to path: {parent}")
sys.path.append(parent)

try:
    import shared
    print(f"Shared imported: {shared}")
    from shared.config import settings
    print("Settings imported")
except ImportError as e:
    print(f"Import Error: {e}")
except Exception as e:
    print(f"Other Error: {e}")
