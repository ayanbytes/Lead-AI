import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
  pass


def _get_database_url() -> str:
  url = os.getenv("DATABASE_URL")
  if url:
    return url
  host = os.getenv("DB_HOST", "127.0.0.1")
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


DATABASE_URL = _get_database_url()

# Pre-check/create database if using MySQL
if DATABASE_URL.startswith("mysql"):
    import pymysql
    from urllib.parse import urlparse, unquote
    
    parsed = urlparse(DATABASE_URL)
    db_name = parsed.path.lstrip('/')
    
    # Connect without database name
    # We must unquote the password because it was URL-encoded
    raw_password = unquote(parsed.password) if parsed.password else None
    
    connection = pymysql.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=raw_password,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    finally:
        connection.close()

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
