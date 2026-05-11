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

    # Use urlsplit to get the basic parts
    parts = urlsplit(raw)
    
    # Manually parse netloc to avoid parts.port casting error
    netloc = parts.netloc or ""
    auth = ""
    host_port = netloc

    if "@" in netloc:
        auth, host_port = netloc.rsplit("@", 1)
        auth = auth + "@"

    # Now handle host and port manually
    if host_port.startswith("["):
        # IPv6
        end = host_port.find("]")
        host = host_port[:end+1]
        port_part = host_port[end+1:]
    else:
        if ":" in host_port:
            host, port_num = host_port.rsplit(":", 1)
            port_part = f":{port_num}"  # preserve the colon separator
        else:
            host = host_port
            port_part = ""

    # Ensure the scheme is correct
    scheme = parts.scheme
    if scheme == "postgresql":
        scheme = "postgresql+psycopg2"
    elif not scheme.startswith("postgresql+"):
        # Default to psycopg2 for any other postgres scheme
        if "postgres" in scheme:
            scheme = "postgresql+psycopg2"

    # Reconstruct the URL: host + ":port" + /dbname
    raw = f"{scheme}://{auth}{host}{port_part}{parts.path}"
    if parts.query:
        raw += f"?{parts.query}"
    if parts.fragment:
        raw += f"#{parts.fragment}"

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
        
        # Safe port parsing for MySQL too
        port_val = 3306
        if parsed.netloc and ":" in parsed.netloc:
            try:
                port_str = parsed.netloc.rsplit(":", 1)[1]
                port_val = int(port_str)
            except (ValueError, IndexError):
                pass

        connection = pymysql.connect(
            host=parsed.hostname,
            port=port_val,
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
    # SSL is often required for cloud databases (Render/Supabase)
    connect_args={"sslmode": "require"} if "postgresql" in DATABASE_URL and "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL else {}
)

# Basic startup diagnostics for deployed environments (safe; no password logging).
try:
    _url_for_log = engine.url
    _host = getattr(_url_for_log, "host", None) or getattr(_url_for_log, "hostname", None)
    _user = getattr(_url_for_log, "username", None)
    _driver = _url_for_log.drivername
    
    if _host:
        if "@" in str(_host):
            print(f"CRITICAL ERROR: Parsed DB host contains '@'. This means the password wasn't escaped correctly. host={_host}")
        else:
            print(f"DATABASE: Detected dialect/driver: {_driver}")
            print(f"DATABASE: Connected to host: {_host}")
            print(f"DATABASE: Authenticated as user: {_user}")
            
    # Test connection immediately
    with engine.connect() as conn:
        print("DATABASE: Connection test successful.")
except Exception as _e:
    print(f"DATABASE ERROR: Startup connection test failed: {str(_e)}")


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()
