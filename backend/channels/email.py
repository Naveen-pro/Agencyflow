"""
Email channel — Resend API.
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_BASE_URL = "https://api.resend.com"


async def send_email(to: str, subject: str, html: str, from_name: str = "AgencyFlow") -> dict:
    """
    Send email via Resend API.
    Returns {success, email_id, error}.
    """
    if not RESEND_API_KEY:
        return {"success": False, "email_id": None, "error": "Resend not configured"}

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "from": f"{from_name} <noreply@agencyflow.in>",
        "to": [to],
        "subject": subject,
        "html": html,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(f"{RESEND_BASE_URL}/emails", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "email_id": data.get("id", ""),
                "error": None,
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"Resend HTTP error: {e.response.status_code} - {e.response.text}")
        return {"success": False, "email_id": None, "error": str(e)}
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return {"success": False, "email_id": None, "error": str(e)}
