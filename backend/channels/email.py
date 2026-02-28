"""
AgencyFlow Email Channel
Calls YOUR OWN Gmail API server (no Resend, no third-party)
"""

import httpx
import os
import uuid
from typing import List, Dict

EMAIL_API_URL = os.getenv("EMAIL_API_URL", "http://localhost:7003")
EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "")

HEADERS = {
    "x-api-key":    EMAIL_API_KEY,
    "Content-Type": "application/json",
}

async def send_email(
    to: str,
    subject: str,
    html: str,
    from_name: str = "AgencyFlow",
    reply_to: str = None,
) -> dict:
    """Send a single email via your own Gmail API"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {
            "to":        to,
            "subject":   subject,
            "html":      html,
            "from_name": from_name,
        }
        if reply_to:
            payload["reply_to"] = reply_to

        resp = await client.post(
            f"{EMAIL_API_URL}/send",
            json=payload,
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()


async def send_test_email(to: str) -> dict:
    """Send test email to yourself"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{EMAIL_API_URL}/send-test",
            json={"to": to},
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()


async def start_bulk_campaign(
    campaign_id: str,
    contacts: List[Dict],
    subject: str,
    html: str,
    from_name: str = "AgencyFlow",
    reply_to: str = None,
) -> dict:
    """Start a bulk email campaign on your Gmail API server"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{EMAIL_API_URL}/send-bulk",
            json={
                "campaign_id": str(campaign_id),
                "contacts":    contacts,
                "subject":     subject,
                "html":        html,
                "from_name":   from_name,
                "reply_to":    reply_to,
                "delay_ms":    1200,
            },
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()


async def get_email_health() -> dict:
    """Check Gmail API server health"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{EMAIL_API_URL}/health")
        return resp.json()


async def get_account_stats() -> dict:
    """Get Gmail account usage stats"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{EMAIL_API_URL}/accounts",
            headers=HEADERS,
        )
        return resp.json()
