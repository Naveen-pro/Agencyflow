"""
AgencyFlow WhatsApp Channel
Calls YOUR OWN WhatsApp API (no WAHA, no Twilio — 100% free)
"""

import httpx
import os
from typing import List, Dict

WA_API_URL = os.getenv("WA_API_URL", "http://localhost:7002")
WA_API_KEY = os.getenv("WA_API_KEY", "")

HEADERS = {
    "x-api-key":    WA_API_KEY,
    "Content-Type": "application/json",
}

async def get_status() -> dict:
    """Check WhatsApp connection status"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{WA_API_URL}/status")
        return resp.json()

async def get_qr_code() -> dict:
    """Get QR code for WhatsApp login"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{WA_API_URL}/qr")
        return resp.json()

async def send_whatsapp(phone: str, message: str, campaign_id: str = None) -> dict:
    """Send single WhatsApp message"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{WA_API_URL}/send",
            json={"phone": phone, "message": message, "campaign_id": campaign_id},
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()

async def send_whatsapp_image(phone: str, image_url: str, caption: str = "") -> dict:
    """Send WhatsApp message with image"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{WA_API_URL}/send-image",
            json={"phone": phone, "image_url": image_url, "caption": caption},
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()

async def start_bulk_campaign(
    campaign_id: str,
    contacts: List[Dict],
    message: str,
    delay_ms: int = 3000,
) -> dict:
    """Start bulk WhatsApp campaign"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{WA_API_URL}/send-bulk",
            json={
                "campaign_id": str(campaign_id),
                "contacts":    contacts,
                "message":     message,
                "delay_ms":    delay_ms,
            },
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()
