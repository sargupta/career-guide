import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../frontend/.env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Missing Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

DEMO_EMAIL = "demo@sargvision.ai"
DEMO_PASSWORD = "DemoPassword123!"

print(f"--- Seeding Demo User: {DEMO_EMAIL} ---")

try:
    # 1. Create auth user with Admin API
    admin_res = supabase.auth.admin.create_user({
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Demo User"
        }
    })
    auth_user_id = admin_res.user.id
    print(f"✅ User created in Supabase Auth (ID: {auth_user_id})")
    
    # 2. Seed profile table
    supabase.table("profiles").insert({
        "user_id": auth_user_id,
        "full_name": "Demo User"
    }).execute()
    print(f"✅ public.profiles record seeded.")
    
    print("\nSUCCESS! You can now log into the frontend with:")
    print(f"Email: {DEMO_EMAIL}")
    print(f"Password: {DEMO_PASSWORD}")
    
except Exception as e:
    # If it fails, maybe it already exists. Let's try to fetch and update or just ignore.
    if "User already registered" in str(e) or "duplicate key" in str(e):
        print("\n✅ Demo user already exists!")
        print(f"Email: {DEMO_EMAIL}")
        print(f"Password: {DEMO_PASSWORD}")
    else:
        print(f"Failed to create demo user: {e}")
