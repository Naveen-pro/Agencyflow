"""
SQLAlchemy 2.0 ORM models for AgencyFlow.
All data lives in Neon PostgreSQL.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, Date,
    ForeignKey, Numeric, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return uuid.uuid4()


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    firebase_uid = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    phone = Column(Text)
    username = Column(Text, unique=True)
    photo_url = Column(Text)
    plan = Column(Text, default="free_trial")
    trial_ends_at = Column(DateTime(timezone=True))
    trial_used_sms = Column(Integer, default=0)
    trial_used_wa = Column(Integer, default=0)
    trial_used_email = Column(Integer, default=0)
    trial_used_voice = Column(Integer, default=0)
    subscription_id = Column(Text)
    subscription_status = Column(Text, default="inactive")
    login_method = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    usage_limits = relationship("UsageLimit", back_populates="agency", cascade="all, delete-orphan")
    csv_uploads = relationship("CSVUpload", back_populates="agency", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="agency", cascade="all, delete-orphan")
    ai_enhancements = relationship("AIEnhancement", back_populates="agency", cascade="all, delete-orphan")
    rss_feeds = relationship("RSSFeed", back_populates="agency", cascade="all, delete-orphan")
    blog_queue = relationship("BlogQueue", back_populates="agency", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="agency", cascade="all, delete-orphan")


class UsageLimit(Base):
    __tablename__ = "usage_limits"
    __table_args__ = (
        UniqueConstraint("agency_id", "month", name="uq_agency_month"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    month = Column(Text, nullable=False)
    sms_used = Column(Integer, default=0)
    sms_limit = Column(Integer, default=50)
    wa_used = Column(Integer, default=0)
    wa_limit = Column(Integer, default=20)
    email_used = Column(Integer, default=0)
    email_limit = Column(Integer, default=50)
    voice_used = Column(Integer, default=0)
    voice_limit = Column(Integer, default=10)
    ai_calls_used = Column(Integer, default=0)
    ai_calls_limit = Column(Integer, default=100)
    reset_date = Column(Date)

    agency = relationship("Agency", back_populates="usage_limits")


class CSVUpload(Base):
    __tablename__ = "csv_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Text, nullable=False)
    filename = Column(Text)
    total_contacts = Column(Integer, default=0)
    valid_contacts = Column(Integer, default=0)
    invalid_contacts = Column(Integer, default=0)
    contacts_data = Column(JSONB)
    status = Column(Text, default="parsed")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="csv_uploads")
    campaigns = relationship("Campaign", back_populates="csv_upload")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    csv_upload_id = Column(UUID(as_uuid=True), ForeignKey("csv_uploads.id"), nullable=True)
    channel = Column(Text, nullable=False)
    name = Column(Text)
    message_content = Column(Text)
    enhanced_content = Column(Text)
    subject = Column(Text)
    voice_script = Column(Text)
    status = Column(Text, default="queued")
    total_contacts = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    cost_inr = Column(Numeric(10, 2), default=Decimal("0.00"))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="campaigns")
    csv_upload = relationship("CSVUpload", back_populates="campaigns")
    delivery_logs = relationship("DeliveryLog", back_populates="campaign", cascade="all, delete-orphan")


class DeliveryLog(Base):
    __tablename__ = "delivery_logs"
    __table_args__ = (
        Index("ix_delivery_campaign_status", "campaign_id", "status"),
        Index("ix_delivery_campaign_sent", "campaign_id", "sent_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    contact_name = Column(Text)
    contact_value = Column(Text)
    status = Column(Text, default="queued")
    error_message = Column(Text)
    provider_msg_id = Column(Text)
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))

    campaign = relationship("Campaign", back_populates="delivery_logs")


class AIEnhancement(Base):
    __tablename__ = "ai_enhancements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Text)
    original_text = Column(Text, nullable=False)
    enhanced_text = Column(Text, nullable=False)
    ai_provider = Column(Text, nullable=False)
    tone = Column(Text)
    duration_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="ai_enhancements")


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"
    __table_args__ = (
        UniqueConstraint("provider", "logged_at", name="uq_provider_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    provider = Column(Text, nullable=False)
    task_type = Column(Text)
    request_count = Column(Integer, default=1)
    tokens_used = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    logged_at = Column(Date, default=lambda: datetime.now(timezone.utc).date())


class RSSFeed(Base):
    __tablename__ = "rss_feeds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    name = Column(Text)
    is_active = Column(Boolean, default=True)
    last_checked = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="rss_feeds")
    blog_items = relationship("BlogQueue", back_populates="feed", cascade="all, delete-orphan")


class BlogQueue(Base):
    __tablename__ = "blog_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    feed_id = Column(UUID(as_uuid=True), ForeignKey("rss_feeds.id", ondelete="CASCADE"))
    title = Column(Text)
    source_url = Column(Text, unique=True)
    status = Column(Text, default="pending")
    sms_teaser = Column(Text)
    wa_teaser = Column(Text)
    email_subject = Column(Text)
    email_body = Column(Text)
    full_article = Column(Text)
    blasted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="blog_queue")
    feed = relationship("RSSFeed", back_populates="blog_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    razorpay_payment_id = Column(Text)
    plan = Column(Text)
    amount_paise = Column(Integer)
    status = Column(Text, default="pending")
    paid_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    agency = relationship("Agency", back_populates="payments")
