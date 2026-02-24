"""
WhatsApp Webhook + Opt-in API
Routes:
  POST /whatsapp/webhook    — Twilio calls this when a user texts the bot
  PUT  /whatsapp/settings   — user saves phone number + preferences
  POST /whatsapp/test       — dev-only: send a test message
"""
import logging
from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional

from twilio.twiml.messaging_response import MessagingResponse

from api.auth import get_current_user
from core.config import settings
from agents.lead_mentor import get_orchestratorResponse
from services.gamification import add_xp_and_update_streak
import json
import asyncio
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Incoming webhook from Twilio ──────────────────────────────────────────────

@router.post("/webhook", response_class=PlainTextResponse)
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
):
    """
    Twilio calls this endpoint when a user sends a WhatsApp message to the bot.
    We look up the user by phone number, get their profile, and reply via Gemini.
    """
    phone = From.replace("whatsapp:", "").strip()
    message_text = Body.strip()

    logger.info(f"WhatsApp inbound from {phone}: {message_text}")

    # Look up user by phone
    supabase = get_supabase()
    result = supabase.table("profiles") \
        .select("user_id, full_name, whatsapp_mentor") \
        .eq("whatsapp_phone", phone) \
        .single() \
        .execute()

    twiml = MessagingResponse()

    if not result.data:
        twiml.message(
            "👋 Welcome to *SARGVISION AI*!\n\n"
            "It looks like your phone number isn't linked to an account yet. "
            "Please open the app and connect your WhatsApp in Settings.\n"
            "👉 http://localhost:3000/settings"
        )
        return str(twiml)

    user = result.data
    if not user.get("whatsapp_mentor"):
        twiml.message("WhatsApp Mentor is disabled for your account. Enable it in Settings.")
        return str(twiml)

    # Generate AI reply
    reply = await _get_ai_reply(user, message_text)
    twiml.message(reply)
    return str(twiml)


async def _get_ai_reply(user: dict, message: str) -> str:
    """
    Generates a context-aware reply using Gemini (with graceful fallback).
    """
    name = (user.get("full_name") or "there").split()[0]

    # Try Gemini if key is configured
    if not settings.GOOGLE_API_KEY:
        return f"Hey {name}! I can't process your request right now (AI disabled). 🎯"

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # 1. Intent Classification
        classifier_prompt = (
            f"You are a routing agent for a career app.\n"
            f"User message: '{message}'\n\n"
            f"Classify the intent into one of two categories:\n"
            f"1. LOG_ACTIVITY (User is telling you about something they completed, achieved, or a new skill/project/internship they did)\n"
            f"2. CHAT (User is asking a question, seeking advice, or just chatting)\n\n"
            f"Respond ONLY with a JSON object: {{\"intent\": \"LOG_ACTIVITY\" | \"CHAT\"}}"
        )
        
        classification = model.generate_content(classifier_prompt).text.strip()
        if classification.startswith("```json"):
            classification = classification[7:-3]
            
        try:
            intent_data = json.loads(classification)
            intent = intent_data.get("intent", "CHAT")
        except:
            intent = "CHAT"

        logger.info(f"[WhatsApp] Intent classified as: {intent}")

        # 2. Route based on intent
        if intent == "LOG_ACTIVITY":
            # Extract details
            extractor_prompt = (
                f"Extract the activity details from this message: '{message}'\n"
                f"Return JSON: {{\"title\": \"Short title\", \"type\": \"project|internship|certification|competition\", \"details\": \"Summary\"}}"
            )
            extracted = json.loads(model.generate_content(extractor_prompt).text.strip().replace('```json\n','').replace('\n```',''))
            
            # Log to DB
            supabase = get_supabase()
            supabase.table("activities").insert({
                "user_id": user["user_id"],
                "title": extracted.get("title", "New Activity"),
                "type": extracted.get("type", "project"),
                "details_json": {"detail": extracted.get("details", "")},
                "academic_year": 1 # default
            }).execute()
            
            # Grant XP
            xp_res = {}
            try:
                xp_res = add_xp_and_update_streak(supabase, user["user_id"], "activity_logged")
            except Exception as e:
                logger.error(f"XP error: {e}")

            xp_earned = xp_res.get("xp_added", 0)
            return f"✅ Awesome! I've logged '{extracted.get('title')}' to your Digital Twin. " \
                   f"You earned +{xp_earned} XP! 🎯 Keep it up."

        else:
            # Route to Lead Mentor Chat context
            user_profile = user.copy()
            # In a full flow we'd fetch the user's memory summary here, but 
            # for now we'll route directly to the agent.
            
            # ADK LeadMentor expects sync execution but since we are in an async route,
            # we wrap it in a thread.
            reply = await asyncio.to_thread(get_orchestratorResponse, user_profile, message)
            
            # Keep it concise for WhatsApp
            concise_prompt = f"Condense this AI reply for WhatsApp: '{reply}'. Make it punchy, use *bold*, and be encouraging."
            final_reply = model.generate_content(concise_prompt).text
            
            return final_reply

    except Exception as e:
        logger.error(f"Gemini/Routing error: {e}")
        return f"Hey {name}! Great to hear from you. Ask me about internships, skills, or career paths — I'm here to help! 🎯"



# ── User WhatsApp Settings ────────────────────────────────────────────────────

class WhatsAppSettings(BaseModel):
    whatsapp_phone: str
    whatsapp_enabled: bool = True
    whatsapp_snapshots: bool = True
    whatsapp_alerts: bool = True
    whatsapp_mentor: bool = True
    preferred_language: str = "English"


@router.put("/settings")
async def update_whatsapp_settings(
    body: WhatsAppSettings,
    user_info: dict = Depends(get_current_user),
):
    """Save a user's WhatsApp phone number and notification preferences."""
    user_id = user_info["user_id"]
    token = user_info["token"]

    supabase = get_supabase_anon(token)
    supabase.table("profiles").update({
        "whatsapp_phone": body.whatsapp_phone,
        "whatsapp_enabled": body.whatsapp_enabled,
        "whatsapp_snapshots": body.whatsapp_snapshots,
        "whatsapp_alerts": body.whatsapp_alerts,
        "whatsapp_mentor": body.whatsapp_mentor,
        "preferred_language": body.preferred_language
    }).eq("user_id", user_id).execute()

    return {"message": "WhatsApp settings updated successfully."}


# ── Dev: Send a test message ──────────────────────────────────────────────────

class TestMessageBody(BaseModel):
    phone: str
    message: Optional[str] = "🎉 Test from SARGVISION AI! Your WhatsApp integration is working."


@router.post("/test")
async def send_test_message(body: TestMessageBody):
    """Dev-only endpoint to test sending a WhatsApp message."""
    sid = send_message(body.phone, body.message)
    if sid:
        return {"success": True, "sid": sid}
    return {"success": False, "error": "Failed to send — check Twilio credentials in .env.local"}
