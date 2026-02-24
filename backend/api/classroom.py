from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import string
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon

router = APIRouter()

def generate_join_code():
    """Generates a unique 6-digit alphanumeric join code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class ClassroomCreate(BaseModel):
    name: str
    grade_level: str
    subject: str

class JoinRequest(BaseModel):
    join_code: str

class AssignmentRequest(BaseModel):
    asset_id: str
    deadline: Optional[str] = None

# ── 1. Teacher Endpoints ──────────────────────────────────────────────────────

@router.post("/teacher/create")
async def create_classroom(req: ClassroomCreate, user: dict = Depends(get_current_user)):
    """Creates a new classroom batch for a teacher."""
    db = get_supabase_anon(user["token"])
    
    # Retry a few times if code collision (rare for 6-char but safe)
    for _ in range(5):
        code = generate_join_code()
        try:
            res = db.table("classrooms").insert({
                "teacher_id": user["user_id"],
                "name": req.name,
                "grade_level": req.grade_level,
                "subject": req.subject,
                "join_code": code
            }).execute()
            return res.data[0]
        except Exception:
            continue
    raise HTTPException(status_code=500, detail="Failed to generate unique join code")

@router.get("/teacher/list")
async def list_teacher_classrooms(user: dict = Depends(get_current_user)):
    """Lists all classrooms managed by the teacher."""
    db = get_supabase_anon(user["token"])
    res = db.table("classrooms").select("*, classroom_enrollments(count)").eq("teacher_id", user["user_id"]).execute()
    return {"classrooms": res.data or []}

@router.post("/teacher/{classroom_id}/assign")
async def create_assignment(classroom_id: str, req: AssignmentRequest, user: dict = Depends(get_current_user)):
    """Teacher assigns an AI asset to a classroom batch."""
    db = get_supabase_anon(user["token"])
    
    # Ownership check
    classroom = db.table("classrooms").select("*").eq("id", classroom_id).eq("teacher_id", user["user_id"]).single().execute()
    if not classroom.data:
        raise HTTPException(status_code=403, detail="Classroom not found or unauthorized")
        
    res = db.table("classroom_assignments").insert({
        "classroom_id": classroom_id,
        "asset_id": req.asset_id,
        "deadline": req.deadline
    }).execute()
    
    return {"message": "Task assigned to batch.", "data": res.data}

@router.get("/teacher/{classroom_id}/students")
async def list_classroom_students(classroom_id: str, user: dict = Depends(get_current_user)):
    """Lists students enrolled in a classroom."""
    db = get_supabase_anon(user["token"])
    # Verification
    classroom = db.table("classrooms").select("*").eq("id", classroom_id).eq("teacher_id", user["user_id"]).single().execute()
    if not classroom.data:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    res = db.table("classroom_enrollments").select("*, profiles!student_id(full_name, email)").eq("classroom_id", classroom_id).execute()
    return {"students": res.data or []}

# ── 2. Student Endpoints ──────────────────────────────────────────────────────

@router.post("/student/join")
async def join_classroom(req: JoinRequest, user: dict = Depends(get_current_user)):
    """Student joins a classroom using a join code."""
    db = get_supabase_anon(user["token"])
    
    classroom = db.table("classrooms").select("*").eq("join_code", req.join_code.upper()).single().execute()
    if not classroom.data:
        raise HTTPException(status_code=404, detail="Invalid join code")
        
    try:
        res = db.table("classroom_enrollments").insert({
            "classroom_id": classroom.data["id"],
            "student_id": user["user_id"]
        }).execute()
        return {"message": f"Joined classroom: {classroom.data['name']}", "classroom": classroom.data}
    except Exception:
        return {"message": "You are already enrolled in this classroom."}

@router.get("/student/assignments")
async def get_student_assignments(user: dict = Depends(get_current_user)):
    """Lists all assignments for the student across all shared classrooms."""
    db = get_supabase_anon(user["token"])
    
    # Get all classrooms student is in
    enrollments = db.table("classroom_enrollments").select("classroom_id").eq("student_id", user["user_id"]).execute()
    classroom_ids = [e["classroom_id"] for e in (enrollments.data or [])]
    
    if not classroom_ids:
        return {"assignments": []}
        
    # Get assignments for these classrooms
    res = db.table("classroom_assignments").select("*, classrooms(name, teacher_id), teacher_assets(*)").in_("classroom_id", classroom_ids).order("assigned_at", desc=True).execute()
    return {"assignments": res.data or []}

class SubmissionRequest(BaseModel):
    answers_json: dict

@router.post("/student/assignments/{assignment_id}/submit")
async def submit_assignment(assignment_id: str, req: SubmissionRequest, user: dict = Depends(get_current_user)):
    """Student submits their answers for an assignment."""
    db = get_supabase_anon(user["token"])
    
    # 1. Verify enrollment
    assignment = db.table("classroom_assignments").select("classroom_id").eq("id", assignment_id).single().execute()
    if not assignment.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    enrollment = db.table("classroom_enrollments").select("*").eq("classroom_id", assignment.data["classroom_id"]).eq("student_id", user["user_id"]).single().execute()
    if not enrollment.data:
        raise HTTPException(status_code=403, detail="Not enrolled in this classroom")
        
    # 2. Upsert submission
    res = db.table("classroom_submissions").upsert({
        "assignment_id": assignment_id,
        "student_id": user["user_id"],
        "answers_json": req.answers_json,
        "status": "submitted"
    }, on_conflict="assignment_id,student_id").execute()
    
    return {"message": "Assignment submitted successfully.", "data": res.data}
