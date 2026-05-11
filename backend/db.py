import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
  pass


def _get_database_url() -> str:
  # Check for DATABASE_URL first (often used in cloud environments)
  url = os.getenv("DATABASE_URL")
  if url:
    if url.startswith("postgres://"):
      url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://"):
      url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif url.startswith("mysql://"):
      url = url.replace("mysql://", "mysql+pymysql://", 1)
    return url
  
  # Check if we have MySQL credentials for local development
  host = os.getenv("DB_HOST")
  if host:
    port = os.getenv("DB_PORT", "3306")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    name = os.getenv("DB_NAME", "leadAI")
    
    # URL-encode credentials to handle special characters
    safe_user = quote_plus(user)
    safe_password = quote_plus(password)
    
    return f"mysql+pymysql://{safe_user}:{safe_password}@{host}:{port}/{name}"
  
  # Fallback to SQLite if no config is provided
  return "sqlite:///./backend.db"


DATABASE_URL = _get_database_url()

# Pre-check/create database if using MySQL
if DATABASE_URL.startswith("mysql"):
    import pymysql
    from urllib.parse import urlparse, unquote
    
    try:
        parsed = urlparse(DATABASE_URL)
        db_name = parsed.path.lstrip('/')
        
        # Connect without database name to ensure it exists
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

# Create engine
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
