import socket
import sys

def check_port(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((host, port))
        print(f"Port {port} is OPEN")
        s.close()
    except Exception as e:
        print(f"Port {port} is CLOSED or Not Reachable: {e}")

print("Checking ports...")
check_port("localhost", 3306)
check_port("localhost", 3307)
