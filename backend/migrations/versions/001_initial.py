"""Initial schema

Revision ID: 001
Create Date: 2026-02-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # agencies
    op.create_table(
        "agencies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("firebase_uid", sa.Text(), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("phone", sa.Text()),
        sa.Column("username", sa.Text(), unique=True),
        sa.Column("photo_url", sa.Text()),
        sa.Column("plan", sa.Text(), server_default="free_trial"),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True)),
        sa.Column("trial_used_sms", sa.Integer(), server_default="0"),
        sa.Column("trial_used_wa", sa.Integer(), server_default="0"),
        sa.Column("trial_used_email", sa.Integer(), server_default="0"),
        sa.Column("trial_used_voice", sa.Integer(), server_default="0"),
        sa.Column("subscription_id", sa.Text()),
        sa.Column("subscription_status", sa.Text(), server_default="inactive"),
        sa.Column("login_method", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # usage_limits
    op.create_table(
        "usage_limits",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.Text(), nullable=False),
        sa.Column("sms_used", sa.Integer(), server_default="0"),
        sa.Column("sms_limit", sa.Integer(), server_default="50"),
        sa.Column("wa_used", sa.Integer(), server_default="0"),
        sa.Column("wa_limit", sa.Integer(), server_default="20"),
        sa.Column("email_used", sa.Integer(), server_default="0"),
        sa.Column("email_limit", sa.Integer(), server_default="50"),
        sa.Column("voice_used", sa.Integer(), server_default="0"),
        sa.Column("voice_limit", sa.Integer(), server_default="10"),
        sa.Column("ai_calls_used", sa.Integer(), server_default="0"),
        sa.Column("ai_calls_limit", sa.Integer(), server_default="100"),
        sa.Column("reset_date", sa.Date()),
        sa.UniqueConstraint("agency_id", "month", name="uq_agency_month"),
    )

    # csv_uploads
    op.create_table(
        "csv_uploads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("filename", sa.Text()),
        sa.Column("total_contacts", sa.Integer(), server_default="0"),
        sa.Column("valid_contacts", sa.Integer(), server_default="0"),
        sa.Column("invalid_contacts", sa.Integer(), server_default="0"),
        sa.Column("contacts_data", JSONB()),
        sa.Column("status", sa.Text(), server_default="parsed"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # campaigns
    op.create_table(
        "campaigns",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("csv_upload_id", UUID(as_uuid=True), sa.ForeignKey("csv_uploads.id")),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("name", sa.Text()),
        sa.Column("message_content", sa.Text()),
        sa.Column("enhanced_content", sa.Text()),
        sa.Column("subject", sa.Text()),
        sa.Column("voice_script", sa.Text()),
        sa.Column("status", sa.Text(), server_default="queued"),
        sa.Column("total_contacts", sa.Integer(), server_default="0"),
        sa.Column("sent_count", sa.Integer(), server_default="0"),
        sa.Column("delivered_count", sa.Integer(), server_default="0"),
        sa.Column("failed_count", sa.Integer(), server_default="0"),
        sa.Column("cost_inr", sa.Numeric(10, 2), server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # delivery_logs
    op.create_table(
        "delivery_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("campaign_id", UUID(as_uuid=True), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contact_name", sa.Text()),
        sa.Column("contact_value", sa.Text()),
        sa.Column("status", sa.Text(), server_default="queued"),
        sa.Column("error_message", sa.Text()),
        sa.Column("provider_msg_id", sa.Text()),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("delivered_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_delivery_campaign_status", "delivery_logs", ["campaign_id", "status"])
    op.create_index("ix_delivery_campaign_sent", "delivery_logs", ["campaign_id", "sent_at"])

    # ai_enhancements
    op.create_table(
        "ai_enhancements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", sa.Text()),
        sa.Column("original_text", sa.Text(), nullable=False),
        sa.Column("enhanced_text", sa.Text(), nullable=False),
        sa.Column("ai_provider", sa.Text(), nullable=False),
        sa.Column("tone", sa.Text()),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ai_usage_logs
    op.create_table(
        "ai_usage_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("task_type", sa.Text()),
        sa.Column("request_count", sa.Integer(), server_default="1"),
        sa.Column("tokens_used", sa.Integer(), server_default="0"),
        sa.Column("success", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("logged_at", sa.Date(), server_default=sa.text("CURRENT_DATE")),
        sa.UniqueConstraint("provider", "logged_at", name="uq_provider_date"),
    )

    # rss_feeds
    op.create_table(
        "rss_feeds",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("name", sa.Text()),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("last_checked", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # blog_queue
    op.create_table(
        "blog_queue",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feed_id", UUID(as_uuid=True), sa.ForeignKey("rss_feeds.id", ondelete="CASCADE")),
        sa.Column("title", sa.Text()),
        sa.Column("source_url", sa.Text(), unique=True),
        sa.Column("status", sa.Text(), server_default="pending"),
        sa.Column("sms_teaser", sa.Text()),
        sa.Column("wa_teaser", sa.Text()),
        sa.Column("email_subject", sa.Text()),
        sa.Column("email_body", sa.Text()),
        sa.Column("full_article", sa.Text()),
        sa.Column("blasted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # payments
    op.create_table(
        "payments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agency_id", UUID(as_uuid=True), sa.ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("razorpay_payment_id", sa.Text()),
        sa.Column("plan", sa.Text()),
        sa.Column("amount_paise", sa.Integer()),
        sa.Column("status", sa.Text(), server_default="pending"),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade():
    op.drop_table("payments")
    op.drop_table("blog_queue")
    op.drop_table("rss_feeds")
    op.drop_table("ai_usage_logs")
    op.drop_table("ai_enhancements")
    op.drop_index("ix_delivery_campaign_sent", "delivery_logs")
    op.drop_index("ix_delivery_campaign_status", "delivery_logs")
    op.drop_table("delivery_logs")
    op.drop_table("campaigns")
    op.drop_table("csv_uploads")
    op.drop_table("usage_limits")
    op.drop_table("agencies")
