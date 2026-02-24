from fastapi import APIRouter, Depends, HTTPException, Response
from api.auth import get_current_user
from core.cv_bridge import synthesize_resume_json, generate_resume_pdf
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/preview")
async def get_resume_preview(user: dict = Depends(get_current_user)):
    """Fetches the AI-synthesized JSON resume for preview."""
    user_id = user["user_id"]
    resume_data = await synthesize_resume_json(user_id)
    if not resume_data:
        raise HTTPException(status_code=500, detail="Failed to synthesize resume")
    return resume_data

@router.get("/download")
async def download_resume_pdf(user: dict = Depends(get_current_user)):
    """Generates and returns the PDF resume file."""
    user_id = user["user_id"]
    resume_data = await synthesize_resume_json(user_id)
    if not resume_data:
        raise HTTPException(status_code=500, detail="Failed to synthesize resume data")
    
    try:
        pdf_bytes = generate_resume_pdf(resume_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=SARGVISION_Resume_{user_id[:8]}.pdf"
            }
        )
    except Exception as e:
        logger.exception(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")
