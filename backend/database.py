# Database connection configuration

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env in root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "farmer_market")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in {"1", "true", "yes", "on"}

if not DB_PASSWORD and not DEMO_MODE:
    raise RuntimeError(
        "DB_PASSWORD is not configured. Create a .env file from .env.example and set the MySQL credentials before starting the backend."
    )

if DEMO_MODE:
    engine = create_engine(
        "sqlite:///./demo_mode.db",
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    from sqlalchemy.engine import URL

    url_object = URL.create(
        drivername="mysql+pymysql",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=int(DB_PORT),
        database=DB_NAME,
    )

    engine = create_engine(
        url_object,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI route endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
