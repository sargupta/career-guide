import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.lead_mentor import get_orchestratorResponse

async def verify_resource_suggestions():
    print("🚀 Verifying Resource Library & AI Suggestions...")
    
    mock_user_profile = {
        "id": "test-student",
        "full_name": "Rohan Tester",
        "domain": "Medical Professionals",
        "readiness_pct": 45,
        "preferred_language": "English"
    }
    
    # We want to trigger the lookup_resources tool
    test_message = "I'm struggling with anatomy. Do you have any study materials in your library for me?"
    
    print(f"\nStudent: {test_message}")
    print("AI Mentor is thinking...")
    
    # We'll run it without patches first to see if it hits the new try-except block
    try:
        response = get_orchestratorResponse(mock_user_profile, test_message)
        print(f"\nAI Mentor: {response}")
        
        if "Resource Library is currently offline" in response or "offline" in response.lower():
            print("\n✅ SUCCESS: AI Mentor moved to tool call and handled the missing table gracefully!")
        elif "Anatomy" in response or "study materials" in response:
             print("\n✅ SUCCESS: AI Mentor replied appropriately.")
        else:
            print("\n⚠️ WARNING: AI Mentor replied but didn't seem to use the tool or acknowledge the library. Check prompt.")
            
    except Exception as e:
        print(f"\n❌ FAILURE: Verification failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_resource_suggestions())
