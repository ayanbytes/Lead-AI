import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

from jose import jwt
import bcrypt

def _prep_password_bytes(password: str) -> bytes:
    """Truncate password to 72 bytes to prevent bcrypt ValueError for long passwords."""
    return password.encode("utf-8")[:72]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_prep_password_bytes(password), salt)
    return hashed.decode("ascii")

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_prep_password_bytes(password), password_hash.encode("ascii"))
    except Exception as e:
        print(f"[AUTH ERROR] bcrypt.checkpw failed: {str(e)}")
        return False



def _get_secret_key() -> str:
  secret = os.getenv("JWT_SECRET", "change-me-to-a-long-random-string-leadai-2026")
  return secret.strip("\"' \t\r\n")



def create_access_token(*, subject: str, expires_in_minutes: int) -> str:
  now = datetime.now(timezone.utc)
  payload = {
    "sub": subject,
    "iat": int(now.timestamp()),
    "exp": int((now + timedelta(minutes=expires_in_minutes)).timestamp()),
  }
  secret = _get_secret_key()
  encoded = jwt.encode(payload, secret, algorithm="HS256")
  print(f"[AUTH DEBUG] Created token for sub {subject} with secret len {len(secret)} prefix {secret[:5]}... token prefix {encoded[:15]}...")
  return encoded
