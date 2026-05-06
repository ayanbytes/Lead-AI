import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
  pass


def _get_database_url() -> str:
  # Render, Railway and other providers often use MYSQL_URL or DATABASE_URL
  url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")
  if url:
    # If the URL is for mysql://, replace with mysql+pymysql:// for SQLAlchemy
    if url.startswith("mysql://"):
      url = url.replace("mysql://", "mysql+pymysql://", 1)
    return url
  
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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()
