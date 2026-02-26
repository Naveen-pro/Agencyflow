"""
Pydantic v2 request/response schemas for AgencyFlow API.
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ─── Agency ───────────────────────────────────────────────────

class AgencyCreate(BaseModel):
    firebase_uid: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    login_method: Optional[str] = None
    plan: str = "free_trial"


class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None


class AgencyResponse(BaseModel):
    id: UUID
    firebase_uid: str
    name: str
    email: str
    phone: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    plan: str
    trial_ends_at: Optional[datetime] = None
    subscription_id: Optional[str] = None
    subscription_status: str
    login_method: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Usage Limits ─────────────────────────────────────────────

class UsageLimitResponse(BaseModel):
    id: UUID
    agency_id: UUID
    month: str
    sms_used: int
    sms_limit: int
    wa_used: int
    wa_limit: int
    email_used: int
    email_limit: int
    voice_used: int
    voice_limit: int
    ai_calls_used: int
    ai_calls_limit: int
    reset_date: Optional[date] = None

    model_config = {"from_attributes": True}


# ─── CSV Upload ───────────────────────────────────────────────

class ContactItem(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    extra: Optional[dict] = None


class CSVUploadRequest(BaseModel):
    channel: str
    contacts: List[ContactItem]
    filename: Optional[str] = None


class CSVUploadResponse(BaseModel):
    upload_id: UUID
    valid_count: int
    invalid_count: int
    total_count: int
    preview: List[ContactItem]
    status: str = "parsed"

    model_config = {"from_attributes": True}


# ─── Campaigns ────────────────────────────────────────────────

class CampaignCreateSMS(BaseModel):
    upload_id: UUID
    message: str
    name: Optional[str] = None


class CampaignCreateWhatsApp(BaseModel):
    upload_id: UUID
    message: str
    media_url: Optional[str] = None
    name: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class CampaignCreateEmail(BaseModel):
    upload_id: UUID
    subject: str
    body: str
    from_name: Optional[str] = None
    name: Optional[str] = None


class CampaignCreateVoice(BaseModel):
    upload_id: UUID
    script: str
    voice: str = "female-en"
    speed: str = "normal"
    name: Optional[str] = None


class CampaignResponse(BaseModel):
    id: UUID
    agency_id: UUID
    channel: str
    name: Optional[str] = None
    status: str
    total_contacts: int
    sent_count: int
    delivered_count: int
    failed_count: int
    cost_inr: Decimal
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignLaunchResponse(BaseModel):
    campaign_id: UUID
    status: str
    contact_count: int


# ─── Delivery Logs ────────────────────────────────────────────

class DeliveryLogResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    contact_name: Optional[str] = None
    contact_value: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    provider_msg_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── AI Enhancement ──────────────────────────────────────────

class AIEnhanceRequest(BaseModel):
    text: str
    channel: str
    tone: str = "professional"


class AIEnhanceResponse(BaseModel):
    enhanced_text: str
    provider: str
    duration_ms: int
    original_text: str


# ─── Blog / RSS ──────────────────────────────────────────────

class RSSFeedCreate(BaseModel):
    url: str
    name: Optional[str] = None


class RSSFeedResponse(BaseModel):
    id: UUID
    url: str
    name: Optional[str] = None
    is_active: bool
    last_checked: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogQueueResponse(BaseModel):
    id: UUID
    title: Optional[str] = None
    source_url: Optional[str] = None
    status: str
    sms_teaser: Optional[str] = None
    wa_teaser: Optional[str] = None
    email_subject: Optional[str] = None
    full_article: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Payments ─────────────────────────────────────────────────

class CreateSubscriptionRequest(BaseModel):
    plan: str  # "pro" or "agency"


class CreateSubscriptionResponse(BaseModel):
    subscription_id: str
    short_url: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


# ─── Health ───────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    providers: dict


# ─── Generic ──────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    success: bool = True


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
