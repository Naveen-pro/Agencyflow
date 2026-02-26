"""
Database seed script — creates test data.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from database import engine, async_session, Base
from models import Agency, UsageLimit


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if test agency exists
        from sqlalchemy import select
        result = await session.execute(
            select(Agency).where(Agency.email == "test@agencyflow.in")
        )
        if result.scalar_one_or_none():
            print("Test agency already exists. Skipping seed.")
            return

        # Create test agency
        agency = Agency(
            id=uuid.uuid4(),
            firebase_uid="test-firebase-uid-12345",
            name="Test Marketing Agency",
            email="test@agencyflow.in",
            phone="+919876543210",
            plan="free_trial",
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14),
            login_method="email",
        )
        session.add(agency)
        await session.flush()

        # Create usage limits for current month
        month_str = datetime.now(timezone.utc).strftime("%Y-%m")
        usage = UsageLimit(
            agency_id=agency.id,
            month=month_str,
            sms_limit=50,
            wa_limit=20,
            email_limit=50,
            voice_limit=10,
            ai_calls_limit=20,
        )
        session.add(usage)

        await session.commit()
        print(f"Seeded test agency: {agency.id}")
        print(f"  Email: test@agencyflow.in")
        print(f"  Plan: free_trial")
        print(f"  Trial ends: {agency.trial_ends_at}")


if __name__ == "__main__":
    asyncio.run(seed())
