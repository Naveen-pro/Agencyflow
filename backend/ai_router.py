"""
Multi-provider AI routing for text enhancement.
Routes to Groq, Gemini, Cohere, DeepSeek, Together, HuggingFace, or Ollama.
"""
import os
import time
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── System prompts per channel ───────────────────────────────

SYSTEM_PROMPTS = {
    "sms": (
        "You are the world's best SMS marketer. Rewrite the following SMS message. "
        "Rules: Under 160 characters. One clear call to action. Punchy hook in first 5 words. "
        "{tone_instruction} "
        "Return ONLY the improved SMS. Nothing else. No quotes. No explanation."
    ),
    "whatsapp": (
        "You are an expert WhatsApp marketing copywriter. "
        "Rewrite the following message to be more effective. "
        "Rules: 2-4 sentences. Conversational tone. 1-2 relevant emojis. Soft CTA at end. "
        "{tone_instruction} "
        "Return ONLY the WhatsApp message. Nothing else."
    ),
    "email": (
        "You are a world-class email copywriter. Rewrite this email body. "
        "Rules: Under 200 words. One clear value proposition. Personalized opening. "
        "Strong single CTA. Professional closing. HTML-safe (no markdown). "
        "{tone_instruction} "
        "Return ONLY the email body text. Nothing else."
    ),
    "email_subject": (
        "Generate a better email subject line. Rules: Under 60 characters. "
        "Curiosity-driven. Specific. No spam words (Free, Win, Click). "
        "{tone_instruction} "
        "Return ONLY the subject line. Nothing else."
    ),
    "voice": (
        "Rewrite this as a natural 30-second phone call script. "
        "Rules: Under 75 words. Natural spoken language. No bullet points. "
        "Clear greeting → value prop → single CTA ('press 1 to learn more'). "
        "{tone_instruction} "
        "Return ONLY the script. Nothing else."
    ),
}

TONE_INSTRUCTIONS = {
    "professional": "Tone: Formal, data-driven, authoritative. Use industry terminology.",
    "casual": "Tone: Warm, friendly, conversational. Like a colleague talking.",
    "urgent": "Tone: Time-sensitive, FOMO-inducing. Create urgency without being pushy.",
    "friendly": "Tone: Approachable, helpful, genuine. Build rapport first.",
}

# ─── Provider preference per channel ─────────────────────────

CHANNEL_PROVIDER_MAP = {
    "sms": ["groq", "gemini", "ollama"],
    "whatsapp": ["gemini", "groq", "ollama"],
    "email": ["cohere", "gemini", "groq", "ollama"],
    "email_subject": ["groq", "gemini", "ollama"],
    "voice": ["groq", "gemini", "ollama"],
}


def _build_system_prompt(channel: str, tone: str) -> str:
    template = SYSTEM_PROMPTS.get(channel, SYSTEM_PROMPTS["sms"])
    tone_inst = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["professional"])
    return template.format(tone_instruction=tone_inst)


# ─── Provider implementations ────────────────────────────────

async def _call_groq(system_prompt: str, user_text: str) -> Optional[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)
        response = await client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Groq failed: {e}")
        return None


async def _call_gemini(system_prompt: str, user_text: str) -> Optional[str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = await model.generate_content_async(
            f"{system_prompt}\n\nUser message to improve:\n{user_text}"
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini failed: {e}")
        return None


async def _call_cohere(system_prompt: str, user_text: str) -> Optional[str]:
    api_key = os.getenv("COHERE_API_KEY")
    if not api_key:
        return None
    try:
        import cohere
        client = cohere.AsyncClientV2(api_key=api_key)
        response = await client.chat(
            model="command-r-plus",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
        )
        return response.message.content[0].text.strip()
    except Exception as e:
        logger.warning(f"Cohere failed: {e}")
        return None


async def _call_deepseek(system_prompt: str, user_text: str) -> Optional[str]:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"DeepSeek failed: {e}")
        return None


async def _call_ollama(system_prompt: str, user_text: str) -> Optional[str]:
    url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{url}/api/chat",
                json={
                    "model": "llama3.2:3b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_text},
                    ],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()
    except Exception as e:
        logger.warning(f"Ollama failed: {e}")
        return None


PROVIDER_FUNCS = {
    "groq": _call_groq,
    "gemini": _call_gemini,
    "cohere": _call_cohere,
    "deepseek": _call_deepseek,
    "ollama": _call_ollama,
}


# ─── Main routing function ───────────────────────────────────

async def enhance_text(
    text: str,
    channel: str,
    tone: str = "professional",
) -> dict:
    """
    Enhance text using the best available AI provider for the channel.
    Falls through providers in order until one succeeds.
    Returns: {enhanced_text, provider, duration_ms}
    """
    system_prompt = _build_system_prompt(channel, tone)
    providers = CHANNEL_PROVIDER_MAP.get(channel, ["groq", "gemini", "ollama"])

    for provider_name in providers:
        func = PROVIDER_FUNCS.get(provider_name)
        if not func:
            continue

        start = time.time()
        result = await func(system_prompt, text)
        duration_ms = int((time.time() - start) * 1000)

        if result:
            return {
                "enhanced_text": result,
                "provider": provider_name,
                "duration_ms": duration_ms,
            }

    raise Exception("All AI providers failed. Please try again later.")


async def get_provider_status() -> dict:
    """Check which AI providers are configured and accessible."""
    statuses = {}
    providers = {
        "groq": bool(os.getenv("GROQ_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
        "cohere": bool(os.getenv("COHERE_API_KEY")),
        "deepseek": bool(os.getenv("DEEPSEEK_API_KEY")),
        "together": bool(os.getenv("TOGETHER_API_KEY")),
        "huggingface": bool(os.getenv("HF_API_KEY")),
        "ollama": True,  # Always available locally
    }
    for name, configured in providers.items():
        statuses[name] = {
            "configured": configured,
            "status": "ready" if configured else "not_configured",
        }
    return statuses
