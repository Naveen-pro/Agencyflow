"""
AgencyFlow FastAPI backend — all routes.
"""
import asyncio
import json
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

load_dotenv()

from database import get_db, check_db_health, async_session
from models import (
    Agency, UsageLimit, CSVUpload, Campaign, DeliveryLog,
    AIEnhancement, AIUsageLog, RSSFeed, BlogQueue, Payment,
)
from schemas import (
    AgencyCreate, AgencyUpdate, AgencyResponse,
    UsageLimitResponse, CSVUploadRequest, CSVUploadResponse, ContactItem,
    CampaignCreateSMS, CampaignCreateWhatsApp, CampaignCreateEmail,
    CampaignCreateVoice, CampaignResponse, CampaignLaunchResponse,
    DeliveryLogResponse, AIEnhanceRequest, AIEnhanceResponse,
    RSSFeedCreate, RSSFeedResponse, BlogQueueResponse,
    CreateSubscriptionRequest, CreateSubscriptionResponse,
    VerifyPaymentRequest, HealthResponse, MessageResponse,
)
from security import (
    verify_firebase_token, get_current_agency_id,
    verify_internal_key, verify_mcp_key,
    limiter, get_limits_for_plan,
)
from ai_router import enhance_text, get_provider_status

# ─── Logger ──────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Redis (optional) ────────────────────────────────────────
redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        try:
            import redis.asyncio as aioredis
            redis_client = aioredis.from_url(
                os.getenv("REDIS_URL", "redis://localhost:6379"),
                decode_responses=True,
            )
            await redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            redis_client = None
    return redis_client

# ─── App ─────────────────────────────────────────────────────

app = FastAPI(
    title="AgencyFlow API",
    description="Multi-channel marketing automation backend",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://agencyflow.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    db_ok = await check_db_health()
    providers = await get_provider_status()
    return HealthResponse(status="ok", db_connected=db_ok, providers=providers)


# ─── Agency / Settings ──────────────────────────────────────

@app.post("/api/v1/settings/agency", response_model=AgencyResponse)
async def create_or_update_agency(
    body: AgencyCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agency).where(Agency.firebase_uid == body.firebase_uid)
    )
    agency = result.scalar_one_or_none()

    if agency:
        agency.name = body.name or agency.name
        agency.email = body.email or agency.email
        agency.photo_url = body.photo_url or agency.photo_url
        agency.login_method = body.login_method or agency.login_method
        agency.updated_at = datetime.now(timezone.utc)
    else:
        agency = Agency(
            firebase_uid=body.firebase_uid,
            name=body.name,
            email=body.email,
            phone=body.phone,
            photo_url=body.photo_url,
            login_method=body.login_method,
            plan=body.plan,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14),
        )
        db.add(agency)
        await db.flush()

        # Create initial usage limits
        month_str = datetime.now(timezone.utc).strftime("%Y-%m")
        limits = get_limits_for_plan(body.plan)
        usage = UsageLimit(
            agency_id=agency.id,
            month=month_str,
            sms_limit=limits["sms"],
            wa_limit=limits["whatsapp"],
            email_limit=limits["email"],
            voice_limit=limits["voice"],
            ai_calls_limit=limits["ai_calls"],
        )
        db.add(usage)

    await db.commit()
    await db.refresh(agency)
    return agency


@app.get("/api/v1/settings/{agency_id}", response_model=AgencyResponse)
async def get_agency(
    agency_id: UUID,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@app.patch("/api/v1/settings/{agency_id}", response_model=AgencyResponse)
async def update_agency(
    agency_id: UUID,
    body: AgencyUpdate,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(agency, field, value)
    agency.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(agency)
    return agency


# ─── Usage ───────────────────────────────────────────────────

@app.get("/api/v1/usage/{agency_id}", response_model=UsageLimitResponse)
async def get_usage(
    agency_id: UUID,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    result = await db.execute(
        select(UsageLimit)
        .where(UsageLimit.agency_id == agency_id, UsageLimit.month == month_str)
    )
    usage = result.scalar_one_or_none()
    if not usage:
        raise HTTPException(status_code=404, detail="Usage data not found")
    return usage


# ─── CSV Upload ──────────────────────────────────────────────

@app.post("/api/v1/csv/upload", response_model=CSVUploadResponse)
@limiter.limit("20/minute")
async def upload_csv(
    request: Request,
    body: CSVUploadRequest,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Validate contacts
    valid = []
    invalid_count = 0
    for contact in body.contacts:
        if body.channel in ("sms", "whatsapp", "voice"):
            phone = contact.phone or ""
            digits = "".join(c for c in phone if c.isdigit())
            if len(digits) >= 10:
                valid.append(contact.model_dump())
            else:
                invalid_count += 1
        elif body.channel == "email":
            email = contact.email or ""
            if "@" in email and "." in email:
                valid.append(contact.model_dump())
            else:
                invalid_count += 1
        else:
            valid.append(contact.model_dump())

    csv_upload = CSVUpload(
        agency_id=agency.id,
        channel=body.channel,
        filename=body.filename,
        total_contacts=len(body.contacts),
        valid_contacts=len(valid),
        invalid_contacts=invalid_count,
        contacts_data=valid,
        status="parsed",
    )
    db.add(csv_upload)
    await db.commit()
    await db.refresh(csv_upload)

    preview = [ContactItem(**c) for c in valid[:5]]
    return CSVUploadResponse(
        upload_id=csv_upload.id,
        valid_count=len(valid),
        invalid_count=invalid_count,
        total_count=len(body.contacts),
        preview=preview,
    )


@app.get("/api/v1/csv/{upload_id}")
async def get_csv(
    upload_id: UUID,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CSVUpload).where(CSVUpload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload


# ─── AI Enhancement ──────────────────────────────────────────

@app.post("/api/v1/ai/enhance", response_model=AIEnhanceResponse)
@limiter.limit("20/minute")
async def ai_enhance(
    request: Request,
    body: AIEnhanceRequest,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check AI usage limit
    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_result = await db.execute(
        select(UsageLimit)
        .where(UsageLimit.agency_id == agency.id, UsageLimit.month == month_str)
    )
    usage = usage_result.scalar_one_or_none()
    if usage and usage.ai_calls_used >= usage.ai_calls_limit:
        raise HTTPException(status_code=429, detail="AI enhancement limit reached. Upgrade your plan.")

    try:
        result = await enhance_text(body.text, body.channel, body.tone)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Log enhancement
    enhancement = AIEnhancement(
        agency_id=agency.id,
        channel=body.channel,
        original_text=body.text,
        enhanced_text=result["enhanced_text"],
        ai_provider=result["provider"],
        tone=body.tone,
        duration_ms=result["duration_ms"],
    )
    db.add(enhancement)

    # Increment usage
    if usage:
        await db.execute(
            update(UsageLimit)
            .where(UsageLimit.id == usage.id)
            .values(ai_calls_used=UsageLimit.ai_calls_used + 1)
        )

    await db.commit()

    return AIEnhanceResponse(
        enhanced_text=result["enhanced_text"],
        provider=result["provider"],
        duration_ms=result["duration_ms"],
        original_text=body.text,
    )


@app.get("/api/v1/ai/provider-status")
async def ai_provider_status(token: dict = Depends(verify_firebase_token)):
    return await get_provider_status()


# ─── Helper: check usage before campaign ─────────────────────

async def _check_usage(agency_id: UUID, channel: str, contact_count: int, db: AsyncSession):
    """Check if agency has enough usage credits. Raises 429 if exceeded."""
    month_str = datetime.now(timezone.utc).strftime("%Y-%m")
    result = await db.execute(
        select(UsageLimit)
        .where(UsageLimit.agency_id == agency_id, UsageLimit.month == month_str)
    )
    usage = result.scalar_one_or_none()
    if not usage:
        return  # No usage tracking yet

    channel_map = {
        "sms": ("sms_used", "sms_limit"),
        "whatsapp": ("wa_used", "wa_limit"),
        "email": ("email_used", "email_limit"),
        "voice": ("voice_used", "voice_limit"),
    }

    if channel in channel_map:
        used_field, limit_field = channel_map[channel]
        used = getattr(usage, used_field, 0)
        limit = getattr(usage, limit_field, 0)
        if used + contact_count > limit:
            raise HTTPException(
                status_code=429,
                detail=f"{channel.upper()} limit exceeded. Used {used}/{limit}. "
                       f"Need {contact_count} more. Upgrade your plan.",
            )


# ─── SMS Campaign ────────────────────────────────────────────

@app.post("/api/v1/campaigns/sms", response_model=CampaignLaunchResponse)
async def create_sms_campaign(
    body: CampaignCreateSMS,
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Get CSV upload
    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == body.upload_id))
    csv_upload = csv_result.scalar_one_or_none()
    if not csv_upload:
        raise HTTPException(status_code=404, detail="CSV upload not found")

    await _check_usage(agency.id, "sms", csv_upload.valid_contacts, db)

    campaign = Campaign(
        agency_id=agency.id,
        csv_upload_id=body.upload_id,
        channel="sms",
        name=body.name or f"SMS Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        message_content=body.message,
        total_contacts=csv_upload.valid_contacts,
        status="queued",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    # Launch background worker
    from workers.sms_worker import sms_campaign_worker
    redis = await get_redis()

    async def run_worker():
        async with async_session() as session:
            await sms_campaign_worker(campaign.id, agency.id, session, redis)

    background_tasks.add_task(run_worker)

    return CampaignLaunchResponse(
        campaign_id=campaign.id,
        status="queued",
        contact_count=csv_upload.valid_contacts,
    )


# ─── WhatsApp Campaign ──────────────────────────────────────

@app.post("/api/v1/campaigns/whatsapp", response_model=CampaignLaunchResponse)
async def create_whatsapp_campaign(
    body: CampaignCreateWhatsApp,
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == body.upload_id))
    csv_upload = csv_result.scalar_one_or_none()
    if not csv_upload:
        raise HTTPException(status_code=404, detail="CSV upload not found")

    await _check_usage(agency.id, "whatsapp", csv_upload.valid_contacts, db)

    campaign = Campaign(
        agency_id=agency.id,
        csv_upload_id=body.upload_id,
        channel="whatsapp",
        name=body.name or f"WhatsApp Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        message_content=body.message,
        total_contacts=csv_upload.valid_contacts,
        status="queued",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    from workers.whatsapp_worker import whatsapp_campaign_worker
    redis = await get_redis()

    async def run_worker():
        async with async_session() as session:
            await whatsapp_campaign_worker(campaign.id, agency.id, session, redis)

    background_tasks.add_task(run_worker)

    return CampaignLaunchResponse(
        campaign_id=campaign.id, status="queued", contact_count=csv_upload.valid_contacts,
    )


@app.get("/api/v1/whatsapp/status")
async def whatsapp_status(token: dict = Depends(verify_firebase_token)):
    from channels.whatsapp import get_status
    return await get_status()


# ─── Email Campaign ──────────────────────────────────────────

@app.post("/api/v1/campaigns/email", response_model=CampaignLaunchResponse)
async def create_email_campaign(
    body: CampaignCreateEmail,
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == body.upload_id))
    csv_upload = csv_result.scalar_one_or_none()
    if not csv_upload:
        raise HTTPException(status_code=404, detail="CSV upload not found")

    await _check_usage(agency.id, "email", csv_upload.valid_contacts, db)

    campaign = Campaign(
        agency_id=agency.id,
        csv_upload_id=body.upload_id,
        channel="email",
        name=body.name or f"Email Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        message_content=body.body,
        subject=body.subject,
        total_contacts=csv_upload.valid_contacts,
        status="queued",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    from workers.email_worker import email_campaign_worker
    redis = await get_redis()

    async def run_worker():
        async with async_session() as session:
            await email_campaign_worker(campaign.id, agency.id, session, redis)

    background_tasks.add_task(run_worker)

    return CampaignLaunchResponse(
        campaign_id=campaign.id, status="queued", contact_count=csv_upload.valid_contacts,
    )


@app.post("/api/v1/email/test", response_model=MessageResponse)
async def send_test_email(
    token: dict = Depends(verify_firebase_token),
):
    email = token.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="No email in token")
    from channels.email import send_email
    result = await send_email(email, "AgencyFlow Test Email", "<h1>Test email works!</h1>")
    return MessageResponse(message="Test email sent", success=result["success"])


# ─── Voice Campaign ──────────────────────────────────────────

@app.post("/api/v1/campaigns/voice", response_model=CampaignLaunchResponse)
async def create_voice_campaign(
    body: CampaignCreateVoice,
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    csv_result = await db.execute(select(CSVUpload).where(CSVUpload.id == body.upload_id))
    csv_upload = csv_result.scalar_one_or_none()
    if not csv_upload:
        raise HTTPException(status_code=404, detail="CSV upload not found")

    await _check_usage(agency.id, "voice", csv_upload.valid_contacts, db)

    campaign = Campaign(
        agency_id=agency.id,
        csv_upload_id=body.upload_id,
        channel="voice",
        name=body.name or f"Voice Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        voice_script=body.script,
        total_contacts=csv_upload.valid_contacts,
        status="queued",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    from workers.voice_worker import voice_campaign_worker
    redis = await get_redis()

    async def run_worker():
        async with async_session() as session:
            await voice_campaign_worker(campaign.id, agency.id, session, redis)

    background_tasks.add_task(run_worker)

    return CampaignLaunchResponse(
        campaign_id=campaign.id, status="queued", contact_count=csv_upload.valid_contacts,
    )


@app.get("/api/v1/voice/preview")
async def voice_preview(
    script: str = Query(...),
    voice: str = Query("female-en"),
    speed: str = Query("normal"),
    token: dict = Depends(verify_firebase_token),
):
    from channels.voice import preview_voice
    return await preview_voice(script, voice, speed)


# ─── SSE Streaming ───────────────────────────────────────────

@app.get("/api/v1/campaigns/{campaign_id}/stream")
async def campaign_stream(
    campaign_id: UUID,
    token: str = Query(None),
):
    if not token:
        raise HTTPException(status_code=401, detail="Token required for SSE")

    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=503, detail="Redis not available for streaming")

    async def event_generator():
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"campaign:{campaign_id}")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
                    data = json.loads(message["data"])
                    if data.get("type") == "complete":
                        break
        finally:
            await pubsub.unsubscribe(f"campaign:{campaign_id}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ─── Campaigns (unified) ────────────────────────────────────

@app.get("/api/v1/campaigns/{agency_id}/all")
async def list_all_campaigns(
    agency_id: UUID,
    channel: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    query = select(Campaign).where(Campaign.agency_id == agency_id)
    if channel:
        query = query.where(Campaign.channel == channel)
    query = query.order_by(Campaign.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    campaigns = result.scalars().all()

    count_query = select(func.count(Campaign.id)).where(Campaign.agency_id == agency_id)
    if channel:
        count_query = count_query.where(Campaign.channel == channel)
    total = (await db.execute(count_query)).scalar()

    return {
        "items": campaigns,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@app.get("/api/v1/campaigns/{campaign_id}/stats", response_model=CampaignResponse)
async def campaign_stats(
    campaign_id: UUID,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@app.get("/api/v1/campaigns/{campaign_id}/logs")
async def campaign_logs(
    campaign_id: UUID,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DeliveryLog)
        .where(DeliveryLog.campaign_id == campaign_id)
        .order_by(DeliveryLog.sent_at.desc())
        .limit(500)
    )
    return result.scalars().all()


# ─── Per-channel campaign lists ──────────────────────────────

@app.get("/api/v1/campaigns/sms/{agency_id}")
async def list_sms_campaigns(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Campaign).where(Campaign.agency_id == agency_id, Campaign.channel == "sms")
        .order_by(Campaign.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@app.get("/api/v1/campaigns/whatsapp/{agency_id}")
async def list_wa_campaigns(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Campaign).where(Campaign.agency_id == agency_id, Campaign.channel == "whatsapp")
        .order_by(Campaign.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@app.get("/api/v1/campaigns/email/{agency_id}")
async def list_email_campaigns(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Campaign).where(Campaign.agency_id == agency_id, Campaign.channel == "email")
        .order_by(Campaign.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@app.get("/api/v1/campaigns/voice/{agency_id}")
async def list_voice_campaigns(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Campaign).where(Campaign.agency_id == agency_id, Campaign.channel == "voice")
        .order_by(Campaign.created_at.desc()).limit(50)
    )
    return result.scalars().all()


# ─── Blog / RSS ──────────────────────────────────────────────

@app.post("/api/v1/blog/feeds", response_model=RSSFeedResponse)
async def add_rss_feed(
    body: RSSFeedCreate,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token.get("uid")
    agency_result = await db.execute(select(Agency).where(Agency.firebase_uid == uid))
    agency = agency_result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    feed = RSSFeed(agency_id=agency.id, url=body.url, name=body.name)
    db.add(feed)
    await db.commit()
    await db.refresh(feed)
    return feed


@app.get("/api/v1/blog/feeds/{agency_id}")
async def list_feeds(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RSSFeed).where(RSSFeed.agency_id == agency_id, RSSFeed.is_active == True)
    )
    return result.scalars().all()


@app.get("/api/v1/blog/queue/{agency_id}")
async def list_blog_queue(agency_id: UUID, token: dict = Depends(verify_firebase_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BlogQueue).where(BlogQueue.agency_id == agency_id).order_by(BlogQueue.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@app.post("/api/v1/blog/scan", response_model=MessageResponse)
async def trigger_rss_scan(
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    background_tasks.add_task(_scan_rss_feeds)
    return MessageResponse(message="RSS scan triggered")


async def _scan_rss_feeds():
    """Background: scan all active RSS feeds."""
    try:
        from blog.rss_scanner import scan_all_feeds
        async with async_session() as session:
            await scan_all_feeds(session)
    except Exception as e:
        logger.error(f"RSS scan failed: {e}")


# ─── Billing / Payments ─────────────────────────────────────

@app.post("/api/v1/payment/create-subscription", response_model=CreateSubscriptionResponse)
async def create_subscription(
    body: CreateSubscriptionRequest,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    import razorpay

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(status_code=503, detail="Payment not configured")

    plan_ids = {
        "pro": os.getenv("RAZORPAY_PLAN_ID_PRO"),
        "agency": os.getenv("RAZORPAY_PLAN_ID_AGENCY"),
    }
    plan_id = plan_ids.get(body.plan)
    if not plan_id:
        raise HTTPException(status_code=400, detail="Invalid plan")

    client = razorpay.Client(auth=(key_id, key_secret))
    subscription = client.subscription.create({
        "plan_id": plan_id,
        "total_count": 12,
        "quantity": 1,
    })

    return CreateSubscriptionResponse(
        subscription_id=subscription["id"],
        short_url=subscription.get("short_url"),
    )


@app.post("/api/v1/payment/verify", response_model=MessageResponse)
async def verify_payment(
    body: VerifyPaymentRequest,
    token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
):
    import razorpay

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    client = razorpay.Client(auth=(key_id, key_secret))

    try:
        client.utility.verify_payment_signature({
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_subscription_id": body.razorpay_subscription_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid payment signature")

    return MessageResponse(message="Payment verified successfully")


@app.post("/api/v1/payment/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    import hmac
    import hashlib

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    expected = hmac.new(
        webhook_secret.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(body)
    event = payload.get("event", "")

    if event == "subscription.activated":
        sub_id = payload.get("payload", {}).get("subscription", {}).get("entity", {}).get("id")
        if sub_id:
            await db.execute(
                update(Agency)
                .where(Agency.subscription_id == sub_id)
                .values(subscription_status="active")
            )
            await db.commit()

    elif event == "subscription.cancelled":
        sub_id = payload.get("payload", {}).get("subscription", {}).get("entity", {}).get("id")
        if sub_id:
            await db.execute(
                update(Agency)
                .where(Agency.subscription_id == sub_id)
                .values(subscription_status="cancelled", plan="free_trial")
            )
            await db.commit()

    return {"status": "ok"}


# ─── MCP endpoint ────────────────────────────────────────────

@app.post("/mcp")
async def mcp_endpoint(
    request: Request,
    _: bool = Depends(verify_mcp_key),
):
    body = await request.json()
    return {
        "jsonrpc": "2.0",
        "id": body.get("id"),
        "result": {"message": "MCP endpoint active", "tools_available": 12},
    }


@app.get("/mcp/health")
async def mcp_health():
    return {"status": "ok", "tools": 12}


# ─── Run ─────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
