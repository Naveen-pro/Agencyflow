"""
SMS channel — Textbee (Android device gateway).
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

TEXTBEE_API_KEY = os.getenv("TEXTBEE_API_KEY", "")
TEXTBEE_DEVICE_ID = os.getenv("TEXTBEE_DEVICE_ID", "")
TEXTBEE_BASE_URL = "https://api.textbee.dev/api/v1"


async def send_sms(phone: str, message: str) -> dict:
    """
    Send a single SMS via Textbee Android gateway.
    Returns {success, delivery_id, error}.
    """
    if not TEXTBEE_API_KEY or not TEXTBEE_DEVICE_ID:
        return {"success": False, "delivery_id": None, "error": "Textbee not configured"}

    url = f"{TEXTBEE_BASE_URL}/gateway/devices/{TEXTBEE_DEVICE_ID}/sendSMS"
    headers = {"x-api-key": TEXTBEE_API_KEY, "Content-Type": "application/json"}
    payload = {"receivers": [phone], "message": message}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "delivery_id": data.get("data", {}).get("messageId", ""),
                "error": None,
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"Textbee HTTP error: {e.response.status_code} - {e.response.text}")
        return {"success": False, "delivery_id": None, "error": str(e)}
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return {"success": False, "delivery_id": None, "error": str(e)}


def validate_phone(phone: str) -> str:
    """
    Validate and normalize phone number.
    Strips non-digits, adds +91 for Indian numbers.
    """
    digits = "".join(c for c in phone if c.isdigit())

    if len(digits) < 10:
        raise ValueError(f"Phone number too short: {phone}")

    # Indian number: 10 digits starting with 6-9
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91{digits}"

    # Already has country code
    if len(digits) >= 11:
        return f"+{digits}"

    return f"+{digits}"
