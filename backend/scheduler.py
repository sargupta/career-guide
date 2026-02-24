"""
APScheduler — background jobs for SARGVISION AI.

Jobs:
  Sun 19:00 IST  job_memory_insights()       ← Goal-Activity Gap → WhatsApp nudges
  Sun 20:00 IST  job_weekly_snapshots()      ← Career digest → WhatsApp
  Daily 00:05    job_deadline_alerts()       ← Opportunity deadlines → WhatsApp
  Weekly Mon     job_enrich_digital_twin()   ← Gemini memory summary → profiles
  Weekly Mon     job_prune_memories()        ← TTL + 150-fact cap cleanup
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from db.supabase_client import get_supabase
from services.whatsapp_service import send_weekly_snapshot, send_deadline_alert
from core.retention import check_user_retention

logger = logging.getLogger(__name__)
IST = timezone(timedelta(hours=5, minutes=30))


# ── 1. Memory Insights Job ────────────────────────────────────────────────────

async def job_memory_insights():
    """
    Runs Sunday 02:00 IST — prepares nudges for the entire day.

    For each WhatsApp-enabled user:
      1. Loads all career memories
      2. Identifies Goal-Activity Gaps (goals in memory not reflected in DB activities)
      3. Surfaces unresolved BLOCKERS older than 30 days
      4. Generates 1–3 personalised nudges via Gemini
      5. Stores nudges in `profiles.pending_nudges` for the hourly snapshot jobs to send
    """
    logger.info("[Scheduler] Starting job_memory_insights...")
    from memory import get_all_memories, enrich_twin_summary
    import google.generativeai as genai

    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("user_id, full_name, whatsapp_enabled, whatsapp_snapshots")
        .eq("whatsapp_enabled", True)
        .eq("whatsapp_snapshots", True)
        .execute()
    )
    users = result.data or []
    logger.info("[Scheduler] Generating memory insights for %d users", len(users))

    for user in users:
        user_id = user["user_id"]
        try:
            # 1. Load memories
            memories = await get_all_memories(user_id=user_id)
            if not memories:
                continue

            # 2. Fetch recent activities from DB to compare against goals
            activities_result = (
                supabase.table("activities")
                .select("title, type")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
            recent_activities = [a["title"] for a in activities_result.data or []]

            # 3. Process goals and blockers
            goal_facts = [
                m.get("memory", "") for m in memories
                if "GOALS:" in m.get("memory", "").upper()
            ]
            blocker_facts = [
                m.get("memory", "") for m in memories
                if "BLOCKERS:" in m.get("memory", "").upper()
            ]

            if not goal_facts and not blocker_facts:
                continue

            # 4. Generate nudges via Gemini
            facts_block = "\n".join(f"- {f}" for f in goal_facts[:3])
            act_block = "\n".join(f"- {a}" for a in recent_activities[:3])
            blocker_block = "\n".join(f"- {b}" for b in blocker_facts[:3])

            prompt = (
                f"You are generating a weekly career nudge for an Indian student.\n"
                f"GOALS (from memory):\n{facts_block}\n"
                f"RECENT ACTIVITIES (from DB):\n{act_block}\n"
                f" blockers:\n{blocker_block}\n\n"
                f"Task: Based on the GAP between goals and activities, OR any urgent blockers, "
                f"write ONE short (max 15 words) actionable, encouraging nudge. "
                f"Use Indian student context (exams, internships, projects). No generic fluff.\n\nNudge:"
            )
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            nudge = response.text.strip().replace('"', '')

            # 5. Store nudge in profile
            supabase.table("profiles").update(
                {"pending_nudges": nudge}
            ).eq("user_id", user_id).execute()

            logger.info("[Scheduler] Generated nudge for user %s…: %s", user_id[:8], nudge)

        except Exception:
            logger.exception("[Scheduler] Memory insights failed for user %s…", user_id[:8])

    logger.info("[Scheduler] job_memory_insights complete.")


# ── 2. Weekly Snapshots Job ───────────────────────────────────────────────────

async def job_weekly_snapshots():
    """
    Runs EVERY HOUR on Sunday.
    Sends WhatsApp-enabled users their career digest + pending nudges,
    ONLY if the current hour matches their persona's `nudge_hour_ist`.
    """
    logger.info("[Scheduler] Running weekly snapshot job...")
    supabase = get_supabase()

    current_hour = datetime.now(IST).hour

    # 1. Fetch all users opted-in to snapshots
    result = (
        supabase.table("profiles")
        .select("user_id, full_name, whatsapp_phone, whatsapp_snapshots, pending_nudges")
        .eq("whatsapp_enabled", True)
        .eq("whatsapp_snapshots", True)
        .execute()
    )
    users = result.data or []

    if not users:
        return

    # 2. Fetch their personas to check preferred nudge hours
    user_ids = [u["user_id"] for u in users]
    personas_res = (
        supabase.table("user_persona_profiles")
        .select("user_id, nudge_hour_ist")
        .in_("user_id", user_ids)
        .execute()
    )
    nudge_hours = {p["user_id"]: p.get("nudge_hour_ist", 19) for p in (personas_res.data or [])}

    # 3. Filter users who should receive it THIS hour
    due_users = [u for u in users if nudge_hours.get(u["user_id"], 19) == current_hour]
    
    logger.info("[Scheduler] Hour %d: Sending snapshots to %d users (out of %d total)", current_hour, len(due_users), len(users))

    for user in due_users:
        try:
            # Note: real readiness and opportunity queries would happen here
            # For now using defaults/placeholders as requested for Phase 10.3
            enriched = {
                **user,
                "readiness_pct": 72,
                "top_opportunity": "Google Summer of Code 2026",
                "top_match_pct": 84,
                "deadline_days": 5,
                "mentor_tip": user.get("pending_nudges"),
            }
            send_weekly_snapshot(enriched)

            # Clear pending nudges after sending
            supabase.table("profiles").update(
                {"pending_nudges": None}
            ).eq("user_id", user["user_id"]).execute()

        except Exception:
            logger.exception(
                "[Scheduler] Snapshot failed for user %s…", user["user_id"][:8]
            )

    logger.info("[Scheduler] Weekly snapshot job complete.")


# ── 3. Deadline Alerts Job ────────────────────────────────────────────────────

async def job_deadline_alerts():
    """
    Runs daily at 00:05 IST.
    Alerts matched users about opportunities closing in exactly 3 days.
    """
    logger.info("[Scheduler] Running deadline alerts job...")
    supabase = get_supabase()

    now = datetime.now(IST)
    target_date = (now + timedelta(days=3)).date().isoformat()

    opps_result = (
        supabase.table("opportunities")
        .select("id, title, org, deadline")
        .eq("deadline", target_date)
        .execute()
    )
    opportunities = opps_result.data or []
    if not opportunities:
        logger.info("[Scheduler] No opportunities closing in 3 days.")
        return

    users_result = (
        supabase.table("profiles")
        .select("user_id, full_name, whatsapp_phone")
        .eq("whatsapp_enabled", True)
        .eq("whatsapp_alerts", True)
        .execute()
    )
    users = users_result.data or []

    for opp in opportunities:
        for user in users:
            try:
                send_deadline_alert(user, {**opp, "match_pct": 84, "days_left": 3})
            except Exception:
                logger.exception(
                    "[Scheduler] Alert failed for user %s…", user["user_id"][:8]
                )

    logger.info(
        "[Scheduler] Sent alerts for %d opportunities to %d users.",
        len(opportunities), len(users),
    )


# ── 4. Digital Twin Enrichment Job ───────────────────────────────────────────

async def job_enrich_digital_twin():
    """
    Runs every Monday at 01:00 IST.
    Generates a Gemini narrative summary of each student's full memory store
    and writes it to profiles.memory_summary for fast context injection.
    """
    logger.info("[Scheduler] Starting job_enrich_digital_twin...")
    from memory import get_all_memories, enrich_twin_summary

    supabase = get_supabase()
    result = supabase.table("profiles").select("user_id").execute()
    users = result.data or []
    logger.info("[Scheduler] Enriching Digital Twin for %d users", len(users))

    for user in users:
        user_id = user["user_id"]
        try:
            memories = await get_all_memories(user_id=user_id)
            if not memories:
                continue
            summary = await enrich_twin_summary(user_id=user_id, memories=memories)
            if summary:
                supabase.table("profiles").update({
                    "memory_summary": summary,
                    "memory_enriched_at": datetime.now(timezone.utc).isoformat(),
                }).eq("user_id", user_id).execute()
        except Exception:
            logger.exception(
                "[Scheduler] Twin enrichment failed for user %s…", user_id[:8]
            )

    logger.info("[Scheduler] job_enrich_digital_twin complete.")


# ── 5. Memory Pruning Job ─────────────────────────────────────────────────────

async def job_prune_memories():
    """
    Runs every Monday at 02:00 IST (after enrichment).
    Deletes TTL-expired facts + enforces 150-fact cap per user.
    """
    logger.info("[Scheduler] Starting job_prune_memories...")
    from memory import prune_stale_memories

    supabase = get_supabase()
    result = supabase.table("profiles").select("user_id").execute()
    users = result.data or []

    total_pruned = 0
    for user in users:
        user_id = user["user_id"]
        pruned = await prune_stale_memories(user_id=user_id)
        total_pruned += pruned

    logger.info("[Scheduler] Pruned %d stale facts across %d users.", total_pruned, len(users) if users else 0)


# ── 6. Monthly Progress Reports Job ───────────────────────────────────────────

async def job_monthly_progress_reports():
    """
    Runs on the 1st of every month at 03:00 IST.
    Synthesizes the last 30 days of career activity into a narrative report.
    """
    logger.info("[Scheduler] Starting job_monthly_progress_reports...")
    import google.generativeai as genai
    from datetime import date

    supabase = get_supabase()
    report_month = (datetime.now(IST).replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    
    # 1. Fetch all users
    res = supabase.table("profiles").select("user_id, full_name, domain_id, domains(name)").execute()
    users = res.data or []
    
    logger.info("[Scheduler] Generating reports for %d users for %s", len(users), report_month)

    for user in users:
        user_id = user["user_id"]
        try:
            # 2. Aggregating Metrics (last 30 days)
            thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            
            # Activities
            act_res = supabase.table("activities").select("title, category").eq("user_id", user_id).gte("created_at", thirty_days_ago).execute()
            activities = act_res.data or []
            
            # Readiness Change
            readiness_res = supabase.table("readiness_snapshots").select("readiness_pct, created_at").eq("user_id", user_id).gte("created_at", thirty_days_ago).order("created_at").execute()
            readiness_data = readiness_res.data or []
            
            start_score = readiness_data[0]["readiness_pct"] if readiness_data else 0
            end_score = readiness_data[-1]["readiness_pct"] if readiness_data else 0
            readiness_gain = end_score - start_score

            # Parent Nudges (consumed)
            nudge_res = supabase.table("parent_nudges").select("content").eq("student_id", user_id).gte("created_at", thirty_days_ago).execute()
            nudges = [n["content"] for n in (nudge_res.data or [])]

            # 3. Generate Narrative via Gemini
            metrics_summary = (
                f"Full Name: {user['full_name']}\n"
                f"Domain: {user.get('domains', {}).get('name', 'Unspecified')}\n"
                f"Activities completed: {len(activities)}\n"
                f"Readiness Score: {end_score}% (Change: {readiness_gain:+d}%)\n"
                f"Parental Guidance provided: {len(nudges)} nudges\n"
            )

            prompt = (
                f"You are the Chief Mentor at SARGVISION AI. Write a 'Monthly Progress Narrative' for a student.\n"
                f"STUDENT DATA:\n{metrics_summary}\n\n"
                f"TASK: Write a 3-paragraph encouraging summary in a professional yet warm tone. "
                f"Paragraph 1: Celebrate their specific wins (even if few). "
                f"Paragraph 2: Interpret the readiness score change. "
                f"Paragraph 3: Give 2 clear 'Focus Areas' for next month based on their domain.\n"
                f"Style: Indian English context. No generic jargon.\n\nReport:"
            )

            model = genai.GenerativeModel("gemini-2.0-flash")
            narrative = model.generate_content(prompt).text.strip()

            # 4. Save Report
            supabase.table("monthly_reports").insert({
                "user_id": user_id,
                "report_month": report_month,
                "narrative_summary": narrative,
                "metrics_snapshot": {
                    "activities_count": len(activities),
                    "readiness_gain": readiness_gain,
                    "current_readiness": end_score,
                    "parent_nudge_count": len(nudges)
                }
            }).execute()

            logger.info("[Scheduler] Generated monthly report for %s", user_id[:8])

        except Exception as e:
            logger.exception("[Scheduler] Monthly report failed for user %s…", user_id[:8])

    logger.info("[Scheduler] job_monthly_progress_reports complete.")


# ── 7. Retention Nudges Job ───────────────────────────────────────────────────

async def job_check_retention():
    """
    Runs daily at 04:00 IST.
    Identifies disengaged users and triggers a personalized mentor nudge.
    """
    logger.info("[Scheduler] Starting job_check_retention...")
    await check_user_retention()
    logger.info("[Scheduler] job_check_retention complete.")


# ── Scheduler Setup ───────────────────────────────────────────────────────────

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    """Call during FastAPI startup lifespan."""
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    # Sunday 02:00 IST — bulk memory insights + nudge generation
    _scheduler.add_job(
        job_memory_insights,
        trigger=CronTrigger(day_of_week="sun", hour=2, minute=0, timezone="Asia/Kolkata"),
        id="memory_insights", replace_existing=True,
    )

    # Sunday Hourly (0-23) — send snapshots matching user's persona `nudge_hour_ist`
    _scheduler.add_job(
        job_weekly_snapshots,
        trigger=CronTrigger(day_of_week="sun", minute=0, timezone="Asia/Kolkata"),
        id="weekly_snapshots", replace_existing=True,
    )

    # Daily 00:05 IST — deadline alerts
    _scheduler.add_job(
        job_deadline_alerts,
        trigger=CronTrigger(hour=0, minute=5, timezone="Asia/Kolkata"),
        id="deadline_alerts", replace_existing=True,
    )

    # Monday 01:00 IST — Gemini summary enrichment
    _scheduler.add_job(
        job_enrich_digital_twin,
        trigger=CronTrigger(day_of_week="mon", hour=1, minute=0, timezone="Asia/Kolkata"),
        id="enrich_digital_twin", replace_existing=True,
    )

    # Monday 02:00 IST — TTL pruning (after enrichment)
    _scheduler.add_job(
        job_prune_memories,
        trigger=CronTrigger(day_of_week="mon", hour=2, minute=0, timezone="Asia/Kolkata"),
        id="prune_memories", replace_existing=True,
    )

    # 1st of every month 03:00 IST — Monthly Progress Reports
    _scheduler.add_job(
        job_monthly_progress_reports,
        trigger=CronTrigger(day=1, hour=3, minute=0, timezone="Asia/Kolkata"),
        id="monthly_reports", replace_existing=True,
    )

    # Daily 04:00 IST — retention nudges
    _scheduler.add_job(
        job_check_retention,
        trigger=CronTrigger(hour=4, minute=0, timezone="Asia/Kolkata"),
        id="check_retention", replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        "[Scheduler] Started — 6 jobs: memory_insights (Sun 02:00), "
        "weekly_snapshots (Sun hourly), deadline_alerts (daily 00:05), "
        "enrich_digital_twin (Mon 01:00), prune_memories (Mon 02:00), "
        "check_retention (daily 04:00)"
    )


def stop_scheduler() -> None:
    """Call during FastAPI shutdown lifespan."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        logger.info("[Scheduler] Stopped.")
