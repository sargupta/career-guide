from pydantic import BaseModel
from typing import List, Optional

class AcademicEnrollmentUpdate(BaseModel):
    degree_type: str
    current_year: int
    total_years: Optional[int] = 4
    academic_year_start: Optional[int] = 2024
    institution: Optional[str] = None

class ProfileUpdate(BaseModel):
    domain_id: str

class AspirationsUpdate(BaseModel):
    career_paths: List[str]  # Max 3
