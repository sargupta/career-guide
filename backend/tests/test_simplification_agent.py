import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.lead_mentor import get_orchestratorResponse

async def verify_simplification_agent():
    print("🚀 Verifying Concept Simplification Agent...")
    
    mock_user_profile = {
        "id": "test-student",
        "full_name": "Rohan Tester",
        "domain": "Computer Science",
        "readiness_pct": 60,
        "preferred_language": "English"
    }
    
    # Complex academic text to simplify (Quantum Computing)
    complex_text = (
        "Quantum superposition is a fundamental principle of quantum mechanics that states "
        "that a physical system—such as an electron—exists partly in all its theoretically "
        "possible states simultaneously; but, when measured, it gives a result corresponding "
        "to only one of the possible configurations."
    )
    
    print(f"\nText to Simplify: {complex_text}")
    
    # Test 1: Basic Simplification (English)
    print("\n--- Test 1: Basic Simplification (English) ---")
    prompt_1 = f"Simplify this for a beginner in English: {complex_text}"
    try:
        response_1 = get_orchestratorResponse(mock_user_profile, prompt_1)
        print(f"AI Response:\n{response_1}")
        
        if "analogy" in response_1.lower() or "like" in response_1.lower():
            print("\n✅ SUCCESS: Agent provided an intuitive analogy.")
        else:
            print("\n⚠️ WARNING: Agent response didn't explicitly use an analogy. Check logic.")
            
    except Exception as e:
        print(f"\n❌ FAILURE: Test 1 failed with error: {e}")

    # Test 2: Hinglish Simplification
    print("\n--- Test 2: Hinglish Simplification ---")
    prompt_2 = f"Simplify this in Hinglish: {complex_text}"
    try:
        response_2 = get_orchestratorResponse(mock_user_profile, prompt_2)
        print(f"AI Response:\n{response_2}")
        
        # Check for common Hinglish markers or simplified tone
        if any(word in response_2.lower() for word in ["hai", "bas", "matlab", "simple"]):
             print("\n✅ SUCCESS: Agent provided output in Hinglish/Simplified tone.")
        else:
            print("\n⚠️ WARNING: Hinglish markers not detected. Check system instructions.")

    except Exception as e:
        print(f"\n❌ FAILURE: Test 2 failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_simplification_agent())
