import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {db_url.split('@')[-1]}") # Redact password

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Success! Connection established.")
except Exception as e:
    print(f"Connection failed: {e}")
