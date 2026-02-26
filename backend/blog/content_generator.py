"""
Blog content generator — generates teasers and articles using AI.
"""
import logging
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ai_router import enhance_text
from models import BlogQueue

logger = logging.getLogger(__name__)


async def generate_blog_content(blog_id: UUID, db: AsyncSession):
    """Generate teasers and full article for a blog queue item."""
    result = await db.execute(select(BlogQueue).where(BlogQueue.id == blog_id))
    item = result.scalar_one_or_none()
    if not item:
        return

    title = item.title or "Untitled"

    # Generate SMS teaser
    try:
        sms_result = await enhance_text(
            f"Write a short SMS teaser about: {title}", "sms", "professional"
        )
        item.sms_teaser = sms_result["enhanced_text"]
    except Exception as e:
        logger.warning(f"SMS teaser generation failed: {e}")

    # Generate WhatsApp teaser
    try:
        wa_result = await enhance_text(
            f"Write a WhatsApp message teaser about: {title}", "whatsapp", "friendly"
        )
        item.wa_teaser = wa_result["enhanced_text"]
    except Exception as e:
        logger.warning(f"WA teaser generation failed: {e}")

    # Generate email subject
    try:
        subj_result = await enhance_text(
            f"Write an email subject line about: {title}", "email_subject", "professional"
        )
        item.email_subject = subj_result["enhanced_text"]
    except Exception as e:
        logger.warning(f"Email subject generation failed: {e}")

    # Generate email body
    try:
        body_result = await enhance_text(
            f"Write a detailed email newsletter about: {title}. "
            f"Include key insights, actionable tips, and a call to action.",
            "email", "professional"
        )
        item.email_body = body_result["enhanced_text"]
    except Exception as e:
        logger.warning(f"Email body generation failed: {e}")

    # Generate full article (simplified — ideally uses STORM MCP)
    try:
        article_result = await enhance_text(
            f"Write a comprehensive 600-800 word article about: {title}. "
            f"Target audience: digital marketing agencies. "
            f"Include: introduction, 3-4 key points with examples, conclusion with CTA.",
            "email", "professional"
        )
        item.full_article = article_result["enhanced_text"]
    except Exception as e:
        logger.warning(f"Article generation failed: {e}")

    item.status = "generated"
    await db.commit()
    logger.info(f"Generated content for blog: {title}")
