import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

_pwd_context = CryptContext(
  # Avoid bcrypt's 72-byte password limit and bcrypt backend issues on some
  # platforms/runtimes by using a KDF with no such limit.
  schemes=["pbkdf2_sha256"],
  deprecated="auto",
)

def hash_password(password: str) -> str:
    return _pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(password, password_hash)



def _get_secret_key() -> str:
  secret = os.getenv("JWT_SECRET")
  if not secret:
    raise RuntimeError("JWT_SECRET is not set")
  return secret


def create_access_token(*, subject: str, expires_in_minutes: int) -> str:
  now = datetime.now(timezone.utc)
  payload = {
    "sub": subject,
    "iat": int(now.timestamp()),
    "exp": int((now + timedelta(minutes=expires_in_minutes)).timestamp()),
  }
  return jwt.encode(payload, _get_secret_key(), algorithm="HS256")
