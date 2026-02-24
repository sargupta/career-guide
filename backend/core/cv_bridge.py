import logging
import json
import google.generativeai as genai
from fpdf import FPDF
from db.supabase_client import get_supabase
from datetime import datetime

logger = logging.getLogger(__name__)

async def synthesize_resume_json(user_id: str):
    """
    Synthesizes a structured JSON resume from user achievements, activities, and profile.
    """
    supabase = get_supabase()
    
    # 1. Fetch Profile
    prof_res = supabase.table("profiles").select("*, domains(name)").eq("user_id", user_id).single().execute()
    profile = prof_res.data or {}
    
    # 2. Fetch Achievements
    ach_res = supabase.table("achievements").select("*").eq("user_id", user_id).execute()
    achievements = ach_res.data or []
    
    # 3. Fetch Activities
    act_res = supabase.table("activities").select("*").eq("user_id", user_id).limit(20).execute()
    activities = act_res.data or []
    
    # 4. Prompt Gemini to structure the data
    prompt = f"""
    Transform the following student data into a professional JSON Resume format.
    Focus on creating high-impact, 'Action-Result' bullet points for achievements.
    
    STUDENT PROFILE:
    Name: {profile.get('full_name')}
    Domain: {profile.get('domains', {}).get('name')}
    Bio: {profile.get('bio', '')}
    
    ACHIEVEMENTS:
    {json.dumps(achievements, indent=2)}
    
    RECENT ACTIVITIES:
    {json.dumps(activities, indent=2)}
    
    OUTPUT SCHEMA:
    {{
      "basics": {{ "name": "...", "label": "...", "summary": "...", "email": "...", "phone": "..." }},
      "work": [ {{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "summary": "...", "highlights": ["..."] }} ],
      "education": [ {{ "institution": "...", "area": "...", "studyType": "..." }} ],
      "skills": [ {{ "name": "...", "keywords": ["..."] }} ]
    }}
    
    Translate "Achievements" into "Work" or "Projects" appropriately. 
    Translate "Activities" into "Skills" or supporting details.
    Be concise and professional.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash", generation_config={{"response_mime_type": "application/json"}})
        response = model.generate_content(prompt)
        return json.loads(response.text.strip())
    except Exception as e:
        logger.exception(f"Resume synthesis failed: {e}")
        return None

class ResumePDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 16)
        # Name is handled in generate_resume_pdf
        pass
        
    def section_title(self, title):
        self.set_font("helvetica", "B", 12)
        self.set_fill_color(240, 240, 240)
        self.cell(0, 8, title, ln=True, fill=True)
        self.ln(2)

def generate_resume_pdf(data: dict):
    """
    Generates a PDF byte stream from JSON resume data.
    """
    pdf = ResumePDF()
    pdf.add_page()
    
    # Header
    basics = data.get("basics", {})
    pdf.set_font("helvetica", "B", 20)
    pdf.cell(0, 10, basics.get("name", "Name Unknown"), ln=True, align="C")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, f"{basics.get('label', '')}", ln=True, align="C")
    pdf.ln(5)
    
    # Summary
    if basics.get("summary"):
        pdf.section_title("PROFESSIONAL SUMMARY")
        pdf.set_font("helvetica", "", 10)
        pdf.multi_cell(0, 5, basics.get("summary"))
        pdf.ln(5)
        
    # Work / Projects
    work = data.get("work", [])
    if work:
        pdf.section_title("EXPERIENCE & PROJECTS")
        for item in work:
            pdf.set_font("helvetica", "B", 10)
            pdf.cell(0, 6, f"{item.get('company')} | {item.get('position')}", ln=True)
            pdf.set_font("helvetica", "I", 9)
            pdf.cell(0, 4, f"{item.get('startDate')} - {item.get('endDate', 'Present')}", ln=True)
            pdf.ln(2)
            pdf.set_font("helvetica", "", 10)
            pdf.multi_cell(0, 5, item.get("summary", ""))
            for h in item.get("highlights", []):
                pdf.cell(5)
                pdf.cell(0, 5, f"- {h}", ln=True)
            pdf.ln(4)
            
    # Skills
    skills = data.get("skills", [])
    if skills:
        pdf.section_title("SKILLS & INTERESTS")
        for s in skills:
            pdf.set_font("helvetica", "B", 10)
            pdf.cell(30, 6, f"{s.get('name')}:", ln=False)
            pdf.set_font("helvetica", "", 10)
            pdf.cell(0, 6, ", ".join(s.get("keywords", [])), ln=True)
            
    return pdf.output()
