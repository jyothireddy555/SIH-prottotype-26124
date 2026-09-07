from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Enable SQLite Write-Ahead Logging (WAL) for high concurrency
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    from . import models
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate SQLite schema for new columns
    with engine.connect() as conn:
        cursor = conn.connection.cursor()
        cursor.execute("PRAGMA table_info(alerts)")
        existing_cols = [row[1] for row in cursor.fetchall()]
        
        if "sighting_count" not in existing_cols:
            cursor.execute("ALTER TABLE alerts ADD COLUMN sighting_count INTEGER DEFAULT 1")
        if "first_detected_at" not in existing_cols:
            cursor.execute("ALTER TABLE alerts ADD COLUMN first_detected_at DATETIME")
        if "last_seen_at" not in existing_cols:
            cursor.execute("ALTER TABLE alerts ADD COLUMN last_seen_at DATETIME")
        if "confirming_buses" not in existing_cols:
            cursor.execute("ALTER TABLE alerts ADD COLUMN confirming_buses VARCHAR(255) DEFAULT 'BUS-104'")
        
        conn.connection.commit()
        cursor.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
