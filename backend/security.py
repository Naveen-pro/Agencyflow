"""
Security: Firebase JWT verification + rate limiting.
"""
import os
import json
import logging
from typing import Optional

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ─── Firebase Admin SDK init ─────────────────────────────────

_firebase_app = None

def _init_firebase():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    import firebase_admin
    from firebase_admin import credentials

    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if creds_json:
        try:
            cred_data = json.loads(creds_json)
            cred = credentials.Certificate(cred_data)
        except Exception:
            cred = credentials.ApplicationDefault()
    else:
        cred = credentials.ApplicationDefault()

    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


# ─── JWT verification ─────────────────────────────────────────

security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    request: Request = None,
) -> dict:
    """
    Verify Firebase JWT token from Authorization header.
    Returns the decoded token payload with uid, email, etc.
    """
    token = None

    # Check Authorization header first
    if credentials:
        token = credentials.credentials

    # Fall back to query param (needed for SSE EventSource)
    if not token and request:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="No authentication token provided")

    try:
        _init_firebase()
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_agency_id(token: dict = Depends(verify_firebase_token)) -> str:
    """Extract Firebase UID from verified token."""
    return token.get("uid", "")


# ─── Internal API key check (for MCP / webhooks) ──────────────

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key")
MCP_SECRET_KEY = os.getenv("MCP_SECRET_KEY", "dev-mcp-key")


async def verify_internal_key(request: Request):
    """Verify internal API key for server-to-server calls."""
    key = request.headers.get("X-Internal-Key")
    if key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")
    return True


async def verify_mcp_key(request: Request):
    """Verify MCP secret key."""
    key = request.headers.get("X-MCP-Key")
    if key != MCP_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid MCP key")
    return True


# ─── Rate limiter ─────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


# ─── Plan limits map ─────────────────────────────────────────

PLAN_LIMITS = {
    "free_trial": {
        "sms": 50,
        "whatsapp": 20,
        "email": 50,
        "voice": 10,
        "ai_calls": 20,
        "campaigns": 5,
    },
    "pro": {
        "sms": 5000,
        "whatsapp": 2000,
        "email": 10000,
        "voice": 500,
        "ai_calls": 999999,  # unlimited
        "campaigns": 999999,
    },
    "agency": {
        "sms": 999999,
        "whatsapp": 999999,
        "email": 999999,
        "voice": 999999,
        "ai_calls": 999999,
        "campaigns": 999999,
    },
}


def get_limits_for_plan(plan: str) -> dict:
    """Return usage limit config for a plan."""
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free_trial"])
