import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

# Fix for bcrypt 4.0.0+ compatibility with passlib
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

import hashlib

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prepare_password(password: str) -> str:
    """
    Bcrypt has a 72-byte limit. 
    We hash with SHA256 first if it's long, or just always for consistency,
    to ensure we never hit that limit.
    """
    prepared = hashlib.sha256(password.encode("utf-8")).hexdigest()
    print(f"DEBUG AUTH: Original password length: {len(password)}")
    print(f"DEBUG AUTH: Prepared password length: {len(prepared)}")
    return prepared

def hash_password(password: str) -> str:
    prepared = _prepare_password(password)
    return _pwd_context.hash(prepared)

def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(_prepare_password(password), password_hash)



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

