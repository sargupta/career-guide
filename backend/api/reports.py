from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/monthly")
async def get_monthly_reports(user: dict = Depends(get_current_user)):
    """Fetch history of monthly reports for the student user."""
    supabase = get_supabase_anon(user["token"])
    res = supabase.table("monthly_reports").select("*").eq("user_id", user["user_id"]).order("report_month", desc=True).execute()
    return {"reports": res.data}

@router.get("/monthly/student/{student_id}")
async def get_student_monthly_reports(student_id: str, user: dict = Depends(get_current_user)):
    """Fetch monthly reports of a student (parent access check via RLS)."""
    supabase = get_supabase_anon(user["token"])
    # RLS policy on monthly_reports ensures only linked parents can see this data
    res = supabase.table("monthly_reports").select("*").eq("user_id", student_id).order("report_month", desc=True).execute()
    return {"reports": res.data}
