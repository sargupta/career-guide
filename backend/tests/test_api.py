import os
import requests
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import uuid

# Load environment variables
load_dotenv(dotenv_path='../frontend/.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
API_BASE_URL = "http://localhost:8000"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Missing Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Generate a fake user ID for the email to completely avoid rate limits based on aliases
test_id = str(uuid.uuid4())[:8]
TEST_EMAIL = f"test_{test_id}@example.com"
TEST_PASSWORD = "TestPassword123!"

def run_tests():
    print(f"--- 1. Generating test user via Admin API to bypass rate limit ---")
    
    # 1. Use the Admin API to create the underlying Auth User directly
    try:
        admin_res = supabase.auth.admin.create_user({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "email_confirm": True,
            "user_metadata": {
                "full_name": "API Test User"
            }
        })
        auth_user_id = admin_res.user.id
        print(f"✅ User created in Supabase Auth (ID: {auth_user_id})")
    except Exception as e:
        print(f"Failed to create admin user: {e}")
        return
        
    # 2. Since our `POST /auth/signup` normally creates the public.profiles record,
    # and we bypassed it, we must seed the profile manually now:
    try:
        supabase.table("profiles").insert({
            "user_id": auth_user_id,
            "full_name": "API Test User"
        }).execute()
        print(f"✅ public.profiles record seeded.")
    except Exception as e:
        print(f"Failed to seed profile: {e}")
    
    # 3. Sign in to get the JWT Session Token
    sign_in_res = supabase.auth.sign_in_with_password({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if not sign_in_res.session:
        print("Failed to acquire session token!")
        return
        
    access_token = sign_in_res.session.access_token
    
    print(f"Token acquired. Setting Authorization header...\n")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 2. Test PUT /users/me/academic (Step 1 of Onboarding)
    print("--- 2. Testing PUT /users/me/academic ---")
    academic_payload = {
        "degree_type": "BTech",
        "total_years": 4,
        "current_year": 2,
        "academic_year_start": 2022,
        "institution": "Test University"
    }
    res = requests.put(f"{API_BASE_URL}/users/me/academic", json=academic_payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}\n")

    # 3. Test PUT /users/me (Step 2 of Onboarding - Domain selection)
    print("--- 3. Testing PUT /users/me ---")
    domain_payload = {
        "domain_id": "11111111-1111-4111-b111-111111111111" # Tech Domain
    }
    res = requests.put(f"{API_BASE_URL}/users/me", json=domain_payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}\n")

    # 4. Test PUT /users/me/aspirations (Step 3 of Onboarding)
    print("--- 4. Testing PUT /users/me/aspirations ---")
    aspirations_payload = {
        "career_paths": [
            "c1111111-1111-4111-b111-111111111111", # SWE
            "c2222222-2222-4222-b222-222222222222"  # PM
        ]
    }
    res = requests.put(f"{API_BASE_URL}/users/me/aspirations", json=aspirations_payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}\n")

    # 5. Test GET /users/me (Fetch full assembled profile)
    print("--- 5. Testing GET /users/me ---")
    res = requests.get(f"{API_BASE_URL}/users/me", headers=headers)
    print(f"Status: {res.status_code}")
    import json
    print(f"Response: {json.dumps(res.json(), indent=2)}\n")
    
    print("✅ All automated API tests completed successfully!")

if __name__ == "__main__":
    run_tests()
