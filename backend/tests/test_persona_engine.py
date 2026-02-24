"""
SARGVISION AI — Persona Engine API Test Suite
Tests all 4 persona endpoints + classifier logic across key archetypes.

Usage:
    cd backend
    source venv/bin/activate
    python tests/test_persona_engine.py
"""
import os
import sys
import json
import uuid
import time
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# ── Load env ──────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path='../frontend/.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
API_BASE_URL = "http://localhost:8000"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Helpers ───────────────────────────────────────────────────────────────────
PASS = "✅"
FAIL = "❌"
SKIP = "⚠️"

def section(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")

def check(label: str, condition: bool, detail: str = ""):
    icon = PASS if condition else FAIL
    msg = f"{icon} {label}"
    if detail:
        msg += f"  → {detail}"
    print(msg)
    return condition

results = {"passed": 0, "failed": 0}

def record(ok: bool):
    if ok:
        results["passed"] += 1
    else:
        results["failed"] += 1
    return ok


# ── 1. Create Test User ───────────────────────────────────────────────────────
section("1. Creating Test User (Admin API)")
test_id = str(uuid.uuid4())[:8]
TEST_EMAIL = f"persona_test_{test_id}@example.com"
TEST_PASSWORD = "TestPassword123!"

try:
    admin_res = supabase.auth.admin.create_user({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "email_confirm": True,
        "user_metadata": {"full_name": "Persona Test User"},
    })
    auth_user_id = admin_res.user.id
    record(check("Test user created in Supabase Auth", True, f"ID: {auth_user_id[:8]}…"))
except Exception as e:
    record(check("Test user created in Supabase Auth", False, str(e)))
    sys.exit(1)

# Seed profile record
try:
    supabase.table("profiles").insert({
        "user_id": auth_user_id,
        "full_name": "Persona Test User",
    }).execute()
    record(check("public.profiles record seeded", True))
except Exception as e:
    record(check("public.profiles record seeded", False, str(e)))

# Sign in
sign_in_res = supabase.auth.sign_in_with_password({
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
})

if not sign_in_res.session:
    print("❌ Failed to acquire JWT token. Exiting.")
    sys.exit(1)

access_token = sign_in_res.session.access_token
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
}
record(check("JWT session token acquired", True, f"{access_token[:30]}…"))


# ── 2. Test GET /api/persona/me (Before Onboarding) ──────────────────────────
section("2. GET /api/persona/me — Before Onboarding (Expect: not onboarded)")
res = requests.get(f"{API_BASE_URL}/api/persona/me", headers=headers)
ok = res.status_code == 200
record(check("GET /api/persona/me returns 200", ok, f"Status: {res.status_code}"))
if ok:
    data = res.json()
    record(check("Response shows onboarded=False", data.get("onboarded") is False, json.dumps(data)))


# ── 3. Test POST /api/persona/onboard — MAANG Aspirant ───────────────────────
section("3. POST /api/persona/onboard — MAANG Aspirant signals")
maang_payload = {
    "primary_goal": "maang",
    "learning_style": "text",
    "biggest_worry": "competition",
    "device_quality": "high_end",
    "language_pref": "en",
}
res = requests.post(f"{API_BASE_URL}/api/persona/onboard", headers=headers, json=maang_payload)
ok = res.status_code == 200
record(check("POST /api/persona/onboard returns 200", ok, f"Status: {res.status_code}"))
if ok:
    data = res.json()
    record(check("Classified as MAANG_ASPIRANT", data.get("archetype") == "MAANG_ASPIRANT", f"Got: {data.get('archetype')}"))
    record(check("Segment is IT", data.get("segment") == "IT", f"Got: {data.get('segment')}"))
    record(check("Tone is executive", data.get("tone_preference") == "executive", f"Got: {data.get('tone_preference')}"))
    print(f"   → Confidence Score: {data.get('confidence_score')}")
    print(f"   → Message: {data.get('message')}")
else:
    print(f"   Response: {res.text}")


# ── 4. Test GET /api/persona/me — After Onboarding ───────────────────────────
section("4. GET /api/persona/me — After Onboarding (Expect: MAANG profile)")
res = requests.get(f"{API_BASE_URL}/api/persona/me", headers=headers)
ok = res.status_code == 200
record(check("GET /api/persona/me returns 200", ok, f"Status: {res.status_code}"))
if ok:
    data = res.json()
    record(check("Profile shows onboarded=True", data.get("onboarded") is True))
    record(check("Archetype is MAANG_ASPIRANT", data.get("archetype") == "MAANG_ASPIRANT", f"Got: {data.get('archetype')}"))
    record(check("nudge_hour_ist is 8 (8 AM)", data.get("nudge_hour_ist") == 8, f"Got: {data.get('nudge_hour_ist')}"))
    record(check("language_preference is en", data.get("language_preference") == "en"))
    record(check("device_tier is high", data.get("device_tier") == "high", f"Got: {data.get('device_tier')}"))
    record(check("Memory hint 1 is present", bool(data.get("memory_hint_1")), data.get("memory_hint_1")))


# ── 5. Test PATCH /api/persona/me — Update Preferences ───────────────────────
section("5. PATCH /api/persona/me — Override tone & language")
patch_payload = {
    "tone_preference": "peer",
    "language_preference": "hinglish",
    "nudge_hour_ist": 21,
}
res = requests.patch(f"{API_BASE_URL}/api/persona/me", headers=headers, json=patch_payload)
ok = res.status_code == 200
record(check("PATCH /api/persona/me returns 200", ok, f"Status: {res.status_code}"))
if ok:
    data = res.json()
    record(check("Updated fields confirmed", "tone_preference" in data.get("updated_fields", []), json.dumps(data.get("updated_fields"))))

# Verify persistence
res2 = requests.get(f"{API_BASE_URL}/api/persona/me", headers=headers)
if res2.status_code == 200:
    data2 = res2.json()
    record(check("Tone updated to 'peer'", data2.get("tone_preference") == "peer"))
    record(check("Language updated to 'hinglish'", data2.get("language_preference") == "hinglish"))
    record(check("Nudge hour updated to 21", data2.get("nudge_hour_ist") == 21))


# ── 6. Test Reclassify ────────────────────────────────────────────────────────
section("6. POST /api/persona/reclassify")
res = requests.post(f"{API_BASE_URL}/api/persona/reclassify", headers=headers)
ok = res.status_code == 200
record(check("POST /api/persona/reclassify returns 200", ok, f"Status: {res.status_code}"))
if ok:
    data = res.json()
    record(check("Re-classified archetype returned", "archetype" in data, json.dumps(data)))


# ── 7. Test Classifier Logic — Govt Aspirant ─────────────────────────────────
section("7. Classifier Logic Unit Test — Govt Aspirant (Om)")
# Create a second user to test a different archetype
test_id2 = str(uuid.uuid4())[:8]
TEST_EMAIL2 = f"persona_om_{test_id2}@example.com"
try:
    admin_res2 = supabase.auth.admin.create_user({
        "email": TEST_EMAIL2, "password": TEST_PASSWORD,
        "email_confirm": True, "user_metadata": {"full_name": "Om Test"},
    })
    supabase.table("profiles").insert({"user_id": admin_res2.user.id, "full_name": "Om Test"}).execute()
    sign_in2 = supabase.auth.sign_in_with_password({"email": TEST_EMAIL2, "password": TEST_PASSWORD})
    headers2 = {"Authorization": f"Bearer {sign_in2.session.access_token}", "Content-Type": "application/json"}

    govt_payload = {
        "primary_goal": "govt",
        "learning_style": "bullets",
        "biggest_worry": "exam_prep",
        "device_quality": "mid_range",
        "language_pref": "hi",
    }
    res_om = requests.post(f"{API_BASE_URL}/api/persona/onboard", headers=headers2, json=govt_payload)
    ok_om = res_om.status_code == 200
    record(check("Om onboarding returns 200", ok_om))
    if ok_om:
        om_data = res_om.json()
        record(check("Om classified as GOVT_ASPIRANT", om_data.get("archetype") == "GOVT_ASPIRANT", f"Got: {om_data.get('archetype')}"))
except Exception as e:
    record(check("Govt Aspirant test setup", False, str(e)))


# ── 8. Test Classifier Logic — Distracted Learner (Rohan) ────────────────────
section("8. Classifier Logic Unit Test — Distracted Learner (Rohan)")
test_id3 = str(uuid.uuid4())[:8]
TEST_EMAIL3 = f"persona_rohan_{test_id3}@example.com"
try:
    admin_res3 = supabase.auth.admin.create_user({
        "email": TEST_EMAIL3, "password": TEST_PASSWORD,
        "email_confirm": True, "user_metadata": {"full_name": "Rohan Test"},
    })
    supabase.table("profiles").insert({"user_id": admin_res3.user.id, "full_name": "Rohan Test"}).execute()
    sign_in3 = supabase.auth.sign_in_with_password({"email": TEST_EMAIL3, "password": TEST_PASSWORD})
    headers3 = {"Authorization": f"Bearer {sign_in3.session.access_token}", "Content-Type": "application/json"}

    rohan_payload = {
        "primary_goal": "explore",
        "learning_style": "visual",
        "biggest_worry": "lost",
        "device_quality": "basic_android",
        "language_pref": "hinglish",
    }
    res_r = requests.post(f"{API_BASE_URL}/api/persona/onboard", headers=headers3, json=rohan_payload)
    ok_r = res_r.status_code == 200
    record(check("Rohan onboarding returns 200", ok_r))
    if ok_r:
        r_data = res_r.json()
        record(check(
            "Rohan classified as DISTRACTED_LEARNER",
            r_data.get("archetype") == "DISTRACTED_LEARNER",
            f"Got: {r_data.get('archetype')}"
        ))
except Exception as e:
    record(check("Distracted Learner test setup", False, str(e)))


# ── 9. Cleanup ────────────────────────────────────────────────────────────────
section("9. Cleanup — Deleting Test Users")
for uid_label, uid in [
    ("MAANG user", auth_user_id),
    ("Om user", admin_res2.user.id if 'admin_res2' in dir() else None),
    ("Rohan user", admin_res3.user.id if 'admin_res3' in dir() else None),
]:
    if uid:
        try:
            supabase.auth.admin.delete_user(uid)
            record(check(f"Deleted {uid_label}", True))
        except Exception as e:
            record(check(f"Deleted {uid_label}", False, str(e)))


# ── Summary ───────────────────────────────────────────────────────────────────
section("RESULTS")
total = results["passed"] + results["failed"]
print(f"   {PASS} Passed: {results['passed']} / {total}")
if results["failed"] > 0:
    print(f"   {FAIL} Failed: {results['failed']} / {total}")
    sys.exit(1)
else:
    print(f"\n   🎉 All persona engine tests passed!")
