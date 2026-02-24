import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Missing Supabase credentials. Ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

# Valid UUIDs for domains
ID_TECH = "11111111-1111-4111-b111-111111111111"
ID_MED = "22222222-2222-4222-b222-222222222222"
ID_COMM = "33333333-3333-4333-b333-333333333333"
ID_ART = "44444444-4444-4444-b444-444444444444"

DOMAINS = [
    {"id": ID_TECH, "name": "Engineering & Tech", "description": "Software, Hardware, Civil, Mechanical"},
    {"id": ID_MED, "name": "Medicine & Health", "description": "MBBS, Nursing, Pharmacy"},
    {"id": ID_COMM, "name": "Commerce & Business", "description": "Finance, MBA, CA"},
    {"id": ID_ART, "name": "Arts & Humanities", "description": "Literature, Design, Social Sciences"}
]

CAREER_PATHS = [
    {"id": "c1111111-1111-4111-b111-111111111111", "domain_id": ID_TECH, "name": "Software Engineer", "description": "Builds applications and systems.", "required_skills_json": ["Python", "JS", "SQL"], "expected_activities_json": {"internships": 2, "projects": 3}},
    {"id": "c2222222-2222-4222-b222-222222222222", "domain_id": ID_TECH, "name": "Product Manager", "description": "Leads product strategy.", "required_skills_json": ["Agile", "UX", "Data"], "expected_activities_json": {"internships": 1, "projects": 5}},
    {"id": "c3333333-3333-4333-b333-333333333333", "domain_id": ID_TECH, "name": "Data Scientist", "description": "Analyzes complex data.", "required_skills_json": ["Python", "ML", "Stats"], "expected_activities_json": {"internships": 1, "projects": 4}}
]

def seed_db():
    print("Seeding Domains...")
    for d in DOMAINS:
        supabase.table("domains").upsert(d).execute()
        print(f"Upserted domain: {d['name']}")

    print("\nSeeding Career Paths...")
    for cp in CAREER_PATHS:
        supabase.table("career_paths").upsert(cp).execute()
        print(f"Upserted career path: {cp['name']}")

    print("\nDatabase seeded successfully!")

if __name__ == "__main__":
    seed_db()
