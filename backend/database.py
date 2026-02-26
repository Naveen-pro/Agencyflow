"""
Async database engine and session management for Neon PostgreSQL.
Uses psycopg (async) driver — Neon's recommended driver.
"""
import os
import logging
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Gracefully handle missing DATABASE_URL
engine = None
async_session = None

if DATABASE_URL:
    # Convert to psycopg async driver format
    async_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    async_url = async_url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)

    engine = create_async_engine(
        async_url,
        echo=os.getenv("ENV", "development") == "development",
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    logger.info("Database engine created (psycopg driver)")
else:
    logger.warning("DATABASE_URL not set — database features will be unavailable")


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency – yields an async DB session."""
    if async_session is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not configured")

    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> bool:
    """Ping the database to verify connectivity."""
    if engine is None:
        return False
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return False
