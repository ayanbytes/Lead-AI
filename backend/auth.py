import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

from jose import jwt
from passlib.context import CryptContext

_pwd_context = CryptContext(
  schemes=["bcrypt", "pbkdf2_sha256"],
  default="bcrypt",
  deprecated="auto",
)

def _prep_password(password: str) -> str:
    """Truncate password to 72 bytes to prevent passlib/bcrypt ValueError for long passwords."""
    return password.encode("utf-8")[:72].decode("utf-8", "ignore")

def hash_password(password: str) -> str:
    return _pwd_context.hash(_prep_password(password))

def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(_prep_password(password), password_hash)



def _get_secret_key() -> str:
  secret = os.getenv("JWT_SECRET", "change-me-to-a-long-random-string-leadai-2026")
  return secret


def create_access_token(*, subject: str, expires_in_minutes: int) -> str:
  now = datetime.now(timezone.utc)
  payload = {
    "sub": subject,
    "iat": int(now.timestamp()),
    "exp": int((now + timedelta(minutes=expires_in_minutes)).timestamp()),
  }
  return jwt.encode(payload, _get_secret_key(), algorithm="HS256")
