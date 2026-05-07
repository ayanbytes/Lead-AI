import os
from urllib.parse import quote_plus
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
  pass


def _normalize_database_url(url: str) -> str:
  """
  Normalize provider DATABASE_URL values so SQLAlchemy can reliably connect.

  In particular, ensure:
  - postgres schemes use the psycopg2 driver
  - username/password are URL-encoded (handles special chars like '@')

  Render/Supabase URLs are commonly in the form:
    postgresql://user:password@host:port/dbname
  If password contains '@' and is not encoded, the host will be parsed incorrectly.
  """
  raw = (url or "").strip()
  if not raw:
    return raw

  if raw.startswith("postgres://"):
    raw = raw.replace("postgres://", "postgresql://", 1)

  postgres_prefixes = (
    "postgresql://",
    "postgresql+psycopg2://",
    "postgresql+psycopg://",
  )

  postgres_prefix = next((p for p in postgres_prefixes if raw.startswith(p)), None)
  if postgres_prefix:
    # If credentials contain an unescaped '@', urlsplit mis-parses the host.
    # Fix by splitting at the LAST '@' which is the host separator.
    rest = raw[len(postgres_prefix):]
    if rest.count("@") > 1:
      creds, host_and_path = rest.rsplit("@", 1)
      if ":" in creds:
        user, password = creds.split(":", 1)
      else:
        user, password = creds, ""
      safe_user = quote_plus(user)
      safe_password = quote_plus(password)
      raw = f"{postgres_prefix}{safe_user}:{safe_password}@{host_and_path}"

    parts = urlsplit(raw)
    safe_user = quote_plus(parts.username or "")
    safe_password = quote_plus(parts.password or "")

    # Avoid using parts.port because it casts to int and will raise if the port
    # is a placeholder like ":PORT" (common in some deploy configs).
    netloc_no_auth = (parts.netloc or "").rsplit("@", 1)[-1]
    host = netloc_no_auth
    port_text = ""

    if netloc_no_auth.startswith("["):
      # IPv6 literal, e.g. "[::1]:5432"
      end = netloc_no_auth.find("]")
      if end != -1:
        host = netloc_no_auth[: end + 1]
        rest = netloc_no_auth[end + 1 :]
        if rest.startswith(":"):
          port_text = rest[1:]
    else:
      if ":" in netloc_no_auth:
        host, port_text = netloc_no_auth.rsplit(":", 1)

    port = f":{port_text}" if port_text else ""

    netloc = host + port
    if safe_user or safe_password:
      netloc = f"{safe_user}:{safe_password}@{netloc}"

    raw = urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))

    # SQLAlchemy 2.x prefers explicit driver for psycopg2; enforce it.
    if raw.startswith("postgresql://"):
      raw = raw.replace("postgresql://", "postgresql+psycopg2://", 1)

  return raw


def _get_database_url() -> str:
  # Render, Railway and other providers often use MYSQL_URL or DATABASE_URL
  url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")
  if url:
    # If the URL is for mysql://, replace with mysql+pymysql:// for SQLAlchemy
    if url.startswith("mysql://"):
      url = url.replace("mysql://", "mysql+pymysql://", 1)
    return _normalize_database_url(url)
  
  # Check if we have MySQL credentials
  host = os.getenv("DB_HOST")
  if host:
    port = os.getenv("DB_PORT", "3306")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "Ayaan@2002")
    name = os.getenv("DB_NAME", "leadAI")
    safe_user = quote_plus(user)
    safe_password = quote_plus(password)
    safe_host = host.strip()
    safe_port = str(port).strip()
    safe_name = name.strip()
    return f"mysql+pymysql://{safe_user}:{safe_password}@{safe_host}:{safe_port}/{safe_name}"
  
  # Fallback to SQLite if no MySQL config is provided (good for Render/Testing)
  return "sqlite:///./backend.db"


DATABASE_URL = _get_database_url()

# Pre-check/create database if using MySQL (only if not on a managed provider like Railway)
if DATABASE_URL.startswith("mysql") and not os.getenv("RAILWAY_ENVIRONMENT"):
    import pymysql
    from urllib.parse import urlparse, unquote
    
    try:
        parsed = urlparse(DATABASE_URL)
        db_name = parsed.path.lstrip('/')
        
        # Connect without database name
        raw_password = unquote(parsed.password) if parsed.password else None
        
        connection = pymysql.connect(
            host=parsed.hostname,
            port=parsed.port or 3306,
            user=parsed.username,
            password=raw_password,
            connect_timeout=5
        )
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        finally:
            connection.close()
    except Exception as e:
        print(f"Warning: Could not ensure database exists: {e}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# Basic startup diagnostics for deployed environments (safe; no password logging).
try:
    _url_for_log = engine.url
    _host = getattr(_url_for_log, "host", None) or getattr(_url_for_log, "hostname", None)
    _user = getattr(_url_for_log, "username", None)
    if _host:
        if "@" in str(_host):
            print(f"ERROR: Parsed DB host contains '@' (likely unescaped password). host={_host}")
        else:
            print(f"DB configured. dialect={_url_for_log.drivername} host={_host} user={_user}")
except Exception as _e:
    print(f"DB config log skipped: {_e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()
