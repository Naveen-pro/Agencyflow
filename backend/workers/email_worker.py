"""
Bulk email campaign worker.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from channels.email import send_email

logger = logging.getLogger(__name__)


async def email_campaign_worker(
    campaign_id: UUID,
    agency_id: UUID,
    db: AsyncSession,
    redis_client=None,
):
    from models import Campaign, CSVUpload, DeliveryLog, UsageLimit

    await db.execute(
        update(Campaign).where(Campaign.id == campaign_id)
        .values(status="running", started_at=datetime.now(timezone.utc))
    )
    await db.commit()

    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one()

    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == campaign.csv_upload_id))
    csv_upload = csv_result.scalar_one()

    contacts = csv_upload.contacts_data or []
    html_content = campaign.enhanced_content or campaign.message_content
    subject = campaign.subject or "Message from AgencyFlow"
    total_sent = 0
    total_failed = 0

    for contact in contacts:
        email_addr = contact.get("email", "")
        name = contact.get("name", "")

        if not email_addr or "@" not in email_addr:
            log = DeliveryLog(
                campaign_id=campaign_id, contact_name=name, contact_value=email_addr,
                status="failed", error_message="Invalid email address",
            )
            db.add(log)
            total_failed += 1
            continue

        personalized_html = html_content.replace("{name}", name).replace("{email}", email_addr)
        personalized_subject = subject.replace("{name}", name)

        result = await send_email(email_addr, personalized_subject, personalized_html)

        if result["success"]:
            log = DeliveryLog(
                campaign_id=campaign_id, contact_name=name, contact_value=email_addr,
                status="delivered", provider_msg_id=result.get("email_id"),
                sent_at=datetime.now(timezone.utc), delivered_at=datetime.now(timezone.utc),
            )
            total_sent += 1
        else:
            log = DeliveryLog(
                campaign_id=campaign_id, contact_name=name, contact_value=email_addr,
                status="failed", error_message=result.get("error"),
                sent_at=datetime.now(timezone.utc),
            )
            total_failed += 1

        db.add(log)
        await db.execute(
            update(Campaign).where(Campaign.id == campaign_id)
            .values(sent_count=total_sent, failed_count=total_failed)
        )
        await db.commit()

        if redis_client:
            event = json.dumps({
                "type": "delivery", "contact_name": name, "contact_value": email_addr,
                "status": "delivered" if result["success"] else "failed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            try:
                await redis_client.publish(f"campaign:{campaign_id}", event)
            except Exception:
                pass

        await asyncio.sleep(0.05)  # Rate limit

    await db.execute(
        update(Campaign).where(Campaign.id == campaign_id)
        .values(status="completed", completed_at=datetime.now(timezone.utc), delivered_count=total_sent)
    )

    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_result = await db.execute(
        select(UsageLimit).where(UsageLimit.agency_id == agency_id, UsageLimit.month == month_str)
    )
    usage = usage_result.scalar_one_or_none()
    if usage:
        await db.execute(
            update(UsageLimit).where(UsageLimit.id == usage.id)
            .values(email_used=UsageLimit.email_used + total_sent)
        )
    await db.commit()
