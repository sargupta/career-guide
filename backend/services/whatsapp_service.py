"""
WhatsApp Service — wraps Twilio API for sending WhatsApp messages.
Usage:
    from services.whatsapp_service import send_message, send_weekly_snapshot, send_deadline_alert
"""
import logging
from typing import Optional
from datetime import datetime

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from core.config import settings
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def _get_twilio_client() -> Client:
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_message(to_phone: str, body: str, user_id: Optional[str] = None, message_type: str = "mentor") -> Optional[str]:
    """
    Send a WhatsApp message via Twilio.
    Returns the Twilio SID on success, None on failure.
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured — skipping WhatsApp send.")
        return None

    # Normalize phone number to WhatsApp format
    to_wa = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
    from_wa = settings.TWILIO_WHATSAPP_NUMBER

    try:
        client = _get_twilio_client()
        message = client.messages.create(body=body, from_=from_wa, to=to_wa)
        logger.info(f"WhatsApp sent to {to_phone}: SID {message.sid}")

        # Log to DB
        if user_id:
            supabase = get_supabase()
            supabase.table("whatsapp_messages").insert({
                "user_id": user_id,
                "phone": to_phone,
                "message_type": message_type,
                "body": body,
                "twilio_sid": message.sid,
            }).execute()

        return message.sid

    except TwilioRestException as e:
        logger.error(f"Twilio error sending to {to_phone}: {e}")
        return None


def format_weekly_snapshot(user: dict) -> str:
    """
    Formats a personalized weekly career snapshot message.
    user: dict with keys full_name, readiness_pct, top_opportunity, deadline_days, mentor_tip
    """
    name = user.get("full_name", "there").split()[0]
    readiness = user.get("readiness_pct", 72)
    top_opp = user.get("top_opportunity", "Google Summer of Code 2026")
    top_match = user.get("top_match_pct", 84)
    deadline_days = user.get("deadline_days", 5)
    
    # Nudges are AI-generated based on career memory (Phase 10.2)
    nudge = user.get("mentor_tip") or "Log your recent projects to boost your readiness score! 🚀"

    return f"""🎯 *SARGVISION Weekly Digest*

Hi {name}! 👋 Here's your career progress:

📈 Readiness Score: *{readiness}%*
🏆 Match of the Week: *{top_opp}* ({top_match}% fit)
⏰ Next Deadline: {deadline_days} days to go!

💡 *Mentor Insights:*
_{nudge}_

Check your full dashboard here:
👉 http://localhost:3000/dashboard

_Reply *help* to chat with your AI Mentor._"""


def format_deadline_alert(user: dict, opportunity: dict) -> str:
    """
    Formats a high-urgency deadline alert for a matched opportunity.
    """
    name = user.get("full_name", "there").split()[0]
    title = opportunity.get("title", "Opportunity")
    org = opportunity.get("organization", opportunity.get("org", ""))
    match_pct = opportunity.get("match_pct", 75)
    days_left = opportunity.get("days_left", 3)

    return f"""⚡ *URGENT: {days_left} Days Left!* ⚡

Hi {name}, the deadline for *{title}* at *{org}* is almost here!

🎯 Your Match: *{match_pct}%*
📅 Hurry, applications close in {days_left} days.

This is a top match for your current goals and skills. Don't miss out! 🚀

Learn more & apply:
👉 http://localhost:3000/opportunities"""


def send_weekly_snapshot(user: dict) -> Optional[str]:
    """Send a weekly career snapshot to a user."""
    phone = user.get("whatsapp_phone")
    if not phone or not user.get("whatsapp_enabled"):
        return None
    body = format_weekly_snapshot(user)
    return send_message(phone, body, user_id=user.get("user_id"), message_type="snapshot")


def send_deadline_alert(user: dict, opportunity: dict) -> Optional[str]:
    """Send a deadline alert to a user for a matched opportunity."""
    phone = user.get("whatsapp_phone")
    if not phone or not user.get("whatsapp_enabled"):
        return None
    body = format_deadline_alert(user, opportunity)
    return send_message(phone, body, user_id=user.get("user_id"), message_type="alert")
