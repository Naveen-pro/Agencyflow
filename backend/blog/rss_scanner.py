"""
RSS feed scanner — fetches and parses RSS feeds.
"""
import logging
from datetime import datetime, timezone

import feedparser
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models import RSSFeed, BlogQueue

logger = logging.getLogger(__name__)


async def scan_all_feeds(db: AsyncSession):
    """Scan all active RSS feeds and add new items to blog queue."""
    result = await db.execute(select(RSSFeed).where(RSSFeed.is_active == True))
    feeds = result.scalars().all()

    for feed in feeds:
        try:
            await _scan_feed(feed, db)
        except Exception as e:
            logger.error(f"Failed to scan feed {feed.url}: {e}")


async def _scan_feed(feed: RSSFeed, db: AsyncSession):
    """Scan a single RSS feed."""
    parsed = feedparser.parse(feed.url)

    for entry in parsed.entries[:10]:
        title = entry.get("title", "")
        link = entry.get("link", "")

        if not link:
            continue

        # Check if already in queue
        existing = await db.execute(
            select(BlogQueue).where(BlogQueue.source_url == link)
        )
        if existing.scalar_one_or_none():
            continue

        item = BlogQueue(
            agency_id=feed.agency_id,
            feed_id=feed.id,
            title=title,
            source_url=link,
            status="pending",
        )
        db.add(item)

    # Update last_checked
    await db.execute(
        update(RSSFeed)
        .where(RSSFeed.id == feed.id)
        .values(last_checked=datetime.now(timezone.utc))
    )
    await db.commit()
    logger.info(f"Scanned feed: {feed.url}")
