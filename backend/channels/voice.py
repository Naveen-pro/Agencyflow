"""
Voice channel — Twilio Programmable Voice.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


def _get_twilio_client():
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return None
    from twilio.rest import Client
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


async def make_call(phone: str, script: str, voice: str = "alice") -> dict:
    """
    Make a voice call with TTS via Twilio.
    Returns {success, call_sid, status, error}.
    """
    client = _get_twilio_client()
    if not client:
        return {"success": False, "call_sid": None, "status": "error", "error": "Twilio not configured"}

    # Map voice selector to Twilio voices
    voice_map = {
        "female-en": "alice",
        "male-en": "man",
        "female-hi": "Polly.Aditi",
        "male-hi": "Polly.Raveena",
    }
    tw_voice = voice_map.get(voice, "alice")

    twiml = f'<Response><Say voice="{tw_voice}">{script}</Say></Response>'

    try:
        call = client.calls.create(
            twiml=twiml,
            to=phone,
            from_=TWILIO_FROM_NUMBER,
        )
        return {
            "success": True,
            "call_sid": call.sid,
            "status": call.status,
            "error": None,
        }
    except Exception as e:
        logger.error(f"Twilio call failed: {e}")
        return {"success": False, "call_sid": None, "status": "error", "error": str(e)}


async def preview_voice(script: str, voice: str = "female-en", speed: str = "normal") -> dict:
    """Generate a TTS preview URL (simplified — returns Twilio TTS info)."""
    return {
        "script": script,
        "voice": voice,
        "speed": speed,
        "preview_available": bool(TWILIO_ACCOUNT_SID),
        "estimated_duration_seconds": len(script.split()) * 0.4,
    }
