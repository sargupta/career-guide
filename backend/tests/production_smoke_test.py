import os
import requests
import json
import logging

# ═══════════════════════════════════════════════════════════════════
# SARGVISION AI — Production Smoke Test
# Usage:
#   export API_URL=https://api.sargvision.ai
#   export ADMIN_KEY=your-secure-admin-key (if Kong Key Auth enabled)
#   python production_smoke_test.py
# ═══════════════════════════════════════════════════════════════════

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SmokeTest")

API_URL = os.getenv("API_URL", "http://localhost:8000")
ADMIN_KEY = os.getenv("ADMIN_KEY", "")

def check_health():
    url = f"{API_URL}/health"
    headers = {"apikey": ADMIN_KEY} if ADMIN_KEY else {}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        logger.info(f"✅ Health Check Passed: {resp.json()}")
        return True
    except Exception as e:
        logger.error(f"❌ Health Check Failed: {e}")
        return False

def check_auth_bootstrap():
    """Verify that the auth routes are reachable."""
    url = f"{API_URL}/auth/login"
    headers = {"apikey": ADMIN_KEY} if ADMIN_KEY else {}
    try:
        # Just check if it's reachable (expecting 405 or 422, but not 404 or 503)
        resp = requests.post(url, headers=headers, json={}, timeout=10)
        if resp.status_code in [400, 422, 405]:
            logger.info("✅ Auth API Reachable")
            return True
        logger.warning(f"⚠️ Auth API returned unexpected status: {resp.status_code}")
        return False
    except Exception as e:
        logger.error(f"❌ Auth API Unreachable: {e}")
        return False

def check_whatsapp_bootstrap():
    """Verify that WhatsApp test endpoint responds."""
    url = f"{API_URL}/whatsapp/test"
    headers = {"apikey": ADMIN_KEY} if ADMIN_KEY else {}
    try:
        # Expecting 422 if body empty, or auth error
        resp = requests.post(url, headers=headers, json={}, timeout=10)
        if resp.status_code in [200, 400, 422]:
            logger.info("✅ WhatsApp Service Reachable")
            return True
        logger.warning(f"⚠️ WhatsApp API returned unexpected status: {resp.status_code}")
        return False
    except Exception as e:
        logger.error(f"❌ WhatsApp Service Unreachable: {e}")
        return False

if __name__ == "__main__":
    logger.info(f"🔍 Starting Production Smoke Test for {API_URL}...")
    
    results = [
        check_health(),
        check_auth_bootstrap(),
        check_whatsapp_bootstrap()
    ]
    
    if all(results):
        logger.info("🚀 ALL PRODUCTION SMOKE TESTS PASSED!")
    else:
        logger.error("🛑 SOME TESTS FAILED. Check connectivity and environment variables.")
        exit(1)
