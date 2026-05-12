import os
import sys
import hashlib

# Add current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import hash_password, verify_password

def test_long_password():
    print("Testing long password...")
    # 100 character password
    long_password = "a" * 100
    try:
        hashed = hash_password(long_password)
        print(f"Hashed length: {len(hashed)}")
        
        is_valid = verify_password(long_password, hashed)
        print(f"Verification: {'Success' if is_valid else 'Failed'}")
    except Exception as e:
        print(f"Caught expected/unexpected error: {e}")

if __name__ == "__main__":
    test_long_password()
