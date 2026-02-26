"""
Bulk SMS campaign worker — processes contacts and sends via Textbee.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession

from channels.sms import send_sms, validate_phone

logger = logging.getLogger(__name__)


async def sms_campaign_worker(
    campaign_id: UUID,
    agency_id: UUID,
    db: AsyncSession,
    redis_client=None,
):
    """
    Background task: sends SMS to each contact in the campaign.
    Publishes delivery events to Redis for SSE streaming.
    """
    from models import Campaign, CSVUpload, DeliveryLog, UsageLimit

    # 1. Mark campaign as running
    await db.execute(
        update(Campaign)
        .where(Campaign.id == campaign_id)
        .values(status="running", started_at=datetime.now(timezone.utc))
    )
    await db.commit()

    # 2. Fetch campaign + contacts
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one()

    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == campaign.csv_upload_id))
    csv_upload = csv_result.scalar_one()

    contacts = csv_upload.contacts_data or []
    message_template = campaign.enhanced_content or campaign.message_content
    total_sent = 0
    total_failed = 0

    # 3. Send to each contact
    for contact in contacts:
        phone = contact.get("phone", "")
        name = contact.get("name", "")

        try:
            phone = validate_phone(phone)
        except ValueError:
            # Log failed
            log = DeliveryLog(
                campaign_id=campaign_id,
                contact_name=name,
                contact_value=phone,
                status="failed",
                error_message="Invalid phone number",
            )
            db.add(log)
            total_failed += 1
            _publish_event(redis_client, campaign_id, name, phone, "failed", "Invalid phone number")
            continue

        # Personalize message
        personalized = message_template.replace("{name}", name).replace("{phone}", phone)

        # Send SMS
        result = await send_sms(phone, personalized)

        if result["success"]:
            log = DeliveryLog(
                campaign_id=campaign_id,
                contact_name=name,
                contact_value=phone,
                status="delivered",
                provider_msg_id=result.get("delivery_id"),
                sent_at=datetime.now(timezone.utc),
                delivered_at=datetime.now(timezone.utc),
            )
            total_sent += 1
            _publish_event(redis_client, campaign_id, name, phone, "delivered")
        else:
            log = DeliveryLog(
                campaign_id=campaign_id,
                contact_name=name,
                contact_value=phone,
                status="failed",
                error_message=result.get("error", "Unknown error"),
                sent_at=datetime.now(timezone.utc),
            )
            total_failed += 1
            _publish_event(redis_client, campaign_id, name, phone, "failed", result.get("error"))

        db.add(log)

        # Update running counts
        await db.execute(
            update(Campaign)
            .where(Campaign.id == campaign_id)
            .values(sent_count=total_sent, failed_count=total_failed)
        )
        await db.commit()

        # Rate limiting: 10 SMS/sec
        await asyncio.sleep(0.1)

    # 4. Mark campaign completed
    await db.execute(
        update(Campaign)
        .where(Campaign.id == campaign_id)
        .values(
            status="completed",
            completed_at=datetime.now(timezone.utc),
            delivered_count=total_sent,
        )
    )

    # 5. Update usage limits
    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_result = await db.execute(
        select(UsageLimit)
        .where(UsageLimit.agency_id == agency_id, UsageLimit.month == month_str)
    )
    usage = usage_result.scalar_one_or_none()
    if usage:
        await db.execute(
            update(UsageLimit)
            .where(UsageLimit.id == usage.id)
            .values(sms_used=UsageLimit.sms_used + total_sent)
        )
    await db.commit()

    # 6. Publish completion event
    if redis_client:
        event = json.dumps({"type": "complete", "stats": {
            "sent": total_sent, "failed": total_failed, "total": len(contacts)
        }})
        try:
            await redis_client.publish(f"campaign:{campaign_id}", event)
        except Exception:
            pass

    logger.info(f"SMS campaign {campaign_id} completed: {total_sent} sent, {total_failed} failed")


def _publish_event(redis_client, campaign_id, name, phone, status, error=None):
    """Publish delivery event to Redis for SSE streaming."""
    if not redis_client:
        return
    event = json.dumps({
        "type": "delivery",
        "contact_name": name,
        "contact_value": phone,
        "status": status,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    try:
        asyncio.create_task(redis_client.publish(f"campaign:{campaign_id}", event))
    except Exception:
        pass
