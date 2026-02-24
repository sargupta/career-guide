import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from frontend (usual pattern in this repo)
load_dotenv(dotenv_path='../frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Missing Supabase credentials. Ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

# Constants for Domain IDs
ID_ART = "44444444-4444-4444-b444-444444444444"
ID_FARM = "55555555-5555-4555-b555-555555555555"
ID_HOSP = "66666666-6666-4666-b666-666666666666"
ID_COMM = "33333333-3333-4333-b333-333333333333"
ID_LAW = "77777777-7777-4777-b777-777777777777"

NON_TECH_DOMAINS = [
    {"id": ID_FARM, "name": "Farming & Agriculture", "description": "Precision farming, organic agriculture, and agri-business management.", "icon": "🚜"},
    {"id": ID_HOSP, "name": "Hospitality & Tourism", "description": "Hotel management, culinary arts, and tourism operations.", "icon": "🏨"},
    {"id": ID_LAW, "name": "Law & Justice", "description": "Corporate law, litigation, legal tech, and public interest law.", "icon": "⚖️"}
]

NON_TECH_CAREER_PATHS = [
    # Arts (BA)
    {"domain_id": ID_ART, "name": "Graphic Designer", "description": "Visual communication using typography, photography, and illustration.", "required_skills_json": ["Adobe Suite", "Typography", "Branding"], "expected_activities_json": {"portfolio_pieces": 5, "freelance_projects": 2}},
    {"domain_id": ID_ART, "name": "Content Strategist", "description": "Creating and managing engaging specialized content for digital platforms.", "required_skills_json": ["SEO", "Storytelling", "Research", "Copywriting"], "expected_activities_json": {"published_articles": 10, "blog_posts": 20}},
    {"domain_id": ID_ART, "name": "UPSC Civil Servant", "description": "Serving the nation through various administrative roles in the government.", "required_skills_json": ["General Studies", "Ethics", "Public Administration", "Analytical Writing"], "expected_activities_json": {"mock_tests": 50, "essay_writing": 20}},
    {"domain_id": ID_ART, "name": "Corporate Psychologist", "description": "Improving organizational productivity and employee well-being.", "required_skills_json": ["Behavioral Analysis", "Conflict Resolution", "Research Methods"], "expected_activities_json": {"case_studies": 5, "internships": 1}},
    
    # Commerce (BCom)
    {"domain_id": ID_COMM, "name": "Chartered Accountant (CA)", "description": "Specializing in auditing, taxation, and financial management.", "required_skills_json": ["Financial Accounting", "Direct Taxation", "Auditing", "Corporate Laws"], "expected_activities_json": {"articleship_years": 3, "exam_cleared": "Final"}},
    {"domain_id": ID_COMM, "name": "Investment Banker", "description": "Advising corporations on capital raising and M&A activities.", "required_skills_json": ["Financial Modeling", "Valuation", "Excel", "Pitching"], "expected_activities_json": {"internships": 2, "deal_simulations": 5}},
    {"domain_id": ID_COMM, "name": "Fintech Analyst", "description": "Analyzing data and trends at the intersection of finance and technology.", "required_skills_json": ["Data Analysis", "Python", "Payments Systems", "Blockchain Basics"], "expected_activities_json": {"project_reports": 3, "industry_certs": 2}},

    # Farming
    {"domain_id": ID_FARM, "name": "Precision Agriculturist", "description": "Using IoT and data to optimize crop yields and soil health.", "required_skills_json": ["IoT", "Data Analysis", "Agronomy"], "expected_activities_json": {"field_trials": 3, "tech_implementations": 2}},
    {"domain_id": ID_FARM, "name": "Organic Farm Manager", "description": "Managing soil fertility and biodiversity per organic standards.", "required_skills_json": ["Organic Chemistry", "Pest Management", "Composting"], "expected_activities_json": {"certification_process": 1, "farm_size_managed": "5+ acres"}},
    
    # Hospitality
    {"domain_id": ID_HOSP, "name": "Chef de Cuisine", "description": "Mastering culinary techniques and managing commercial kitchens.", "required_skills_json": ["Menu Planning", "Food Safety", "Cost Control"], "expected_activities_json": {"cuisine_specialties": 3, "service_hours": 2000}},
    {"domain_id": ID_HOSP, "name": "Hotel Manager", "description": "Overseeing daily operations and guest experiences at a property.", "required_skills_json": ["Revenue Management", "Customer Service", "HR"], "expected_activities_json": {"internships": 2, "leadership_roles": 1}},

    # Law (LLB)
    {"domain_id": ID_LAW, "name": "Corporate Counsel", "description": "Advising businesses on legal obligations and corporate transactions.", "required_skills_json": ["Contract Drafting", "Company Law", "Securities Law", "M&A"], "expected_activities_json": {"internships": 3, "moot_courts": 2}},
    {"domain_id": ID_LAW, "name": "Cyber Law Specialist", "description": "Handling cases related to cybercrime and digital information security.", "required_skills_json": ["IT Act", "Data Privacy", "Digital Evidence", "IPR"], "expected_activities_json": {"certifications": 2, "case_analyses": 10}},
    {"domain_id": ID_LAW, "name": "Public Interest Litigator", "description": "Representing the public interest in matters like human rights and environment.", "required_skills_json": ["Constitutional Law", "Oral Advocacy", "Legal Research", "Social Justice"], "expected_activities_json": {"PIL_drafts": 2, "volunteer_hours": 500}}
]

def seed_non_tech():
    print("Seeding Non-Tech Domains...")
    for d in NON_TECH_DOMAINS:
        supabase.table("domains").upsert(d).execute()
        print(f"Upserted domain: {d['name']}")

    print("\nSeeding Non-Tech Career Paths...")
    for cp in NON_TECH_CAREER_PATHS:
        # Use a stable name-based UUID for idempotency or just let Supabase generate if not specified
        # Here we upsert by name + domain_id match logic or just insert.
        # To be safe and clean, let's just insert these as new records.
        supabase.table("career_paths").insert(cp).execute()
        print(f"Inserted career path: {cp['name']}")

    print("\nNon-Tech Paths seeded successfully!")

if __name__ == "__main__":
    seed_non_tech()
