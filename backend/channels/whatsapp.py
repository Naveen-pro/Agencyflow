"""
WhatsApp channel — WAHA (self-hosted WhatsApp Web API).
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

WAHA_URL = os.getenv("WAHA_URL", "http://localhost:3001")


async def send_whatsapp(phone: str, message: str, media_url: str = None) -> dict:
    """
    Send WhatsApp message via WAHA.
    Returns {success, message_id, error}.
    """
    chat_id = f"{phone.replace('+', '')}@c.us"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if media_url:
                resp = await client.post(
                    f"{WAHA_URL}/api/sendImage",
                    json={
                        "chatId": chat_id,
                        "caption": message,
                        "file": {"url": media_url},
                        "session": "default",
                    },
                )
            else:
                resp = await client.post(
                    f"{WAHA_URL}/api/sendText",
                    json={
                        "chatId": chat_id,
                        "text": message,
                        "session": "default",
                    },
                )

            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "message_id": data.get("id", ""),
                "error": None,
            }
    except Exception as e:
        logger.error(f"WhatsApp send failed: {e}")
        return {"success": False, "message_id": None, "error": str(e)}


async def get_status() -> dict:
    """Check WAHA connection status."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{WAHA_URL}/api/sessions/default")
            resp.raise_for_status()
            data = resp.json()
            return {
                "connected": data.get("status") == "WORKING",
                "phone": data.get("me", {}).get("id", ""),
                "qr_code": None,
            }
    except Exception:
        return {"connected": False, "phone": None, "qr_code": None}
