from fastapi import APIRouter
router = APIRouter()

@router.get("")
async def list_domains():
    """List all career domains."""
    from db.supabase_client import get_supabase
    res = get_supabase().table("domains").select("*").execute()
    return res.data

@router.get("/{domain_id}/career-paths")
async def get_career_paths(domain_id: str):
    from db.supabase_client import get_supabase
    res = get_supabase().table("career_paths").select("*").eq("domain_id", domain_id).execute()
    return res.data
