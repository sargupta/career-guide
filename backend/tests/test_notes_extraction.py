import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from fastapi.testclient import TestClient
from main import app
from api.auth import get_current_user

# Mock user
mock_user = {
    "user_id": "test-student-notes",
    "full_name": "Rohan Notes",
    "domain": "Biotechnology",
    "token": "mock-token"
}

def mock_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = mock_get_current_user
client = TestClient(app)

def verify_notes_extraction():
    print("🚀 Verifying Smart Notes Extraction API...")
    
    # Test text: Photosynthesis
    test_text = (
        "Photosynthesis is a process used by plants and other organisms to convert light energy "
        "into chemical energy that, through cellular respiration, can later be released to fuel "
        "the organism's activities. This chemical energy is stored in carbohydrate molecules, "
        "such as sugars, which are synthesized from carbon dioxide and water."
    )
    
    # Mock Gemini model response for structured notes
    mock_gemini_response = MagicMock()
    mock_gemini_response.text = (
        "### 🚀 Summary\n"
        "Photosynthesis is the process plants use to turn sunlight into food (energy). "
        "It takes water and CO2 and creates sugars like glucose.\n\n"
        "### 📖 Key Definitions\n"
        "- **Carbohydrates**: Sugar molecules that store energy.\n"
        "- **Synthesis**: Making something complex from simple parts.\n\n"
        "### 💡 Core Concepts\n"
        "- Sunlight is converted to chemical energy.\n"
        "- Water + CO2 -> Sugar + Oxygen (byproduct).\n\n"
        "### 🧠 Practice Questions\n"
        "1. What is the main source of energy for photosynthesis?\n"
        "2. What are the two main 'ingredients' plants need?\n\n"
        "### 🔗 Analogy\n"
        "Think of a plant like a solar-powered kitchen. Sunlight is the electricity, "
        "and water/CO2 are the raw ingredients to cook a meal (sugar)."
    )
    
    with patch("google.generativeai.GenerativeModel.generate_content", return_value=mock_gemini_response):
        print("\nRequesting notes for 'Photosynthesis'...")
        response = client.post(
            "/simplify/notes",
            json={"text": test_text, "level": "basic", "language": "English"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS: API returned 200 OK")
            print(f"Generated Notes:\n{data['notes']}")
            
            if "Summary" in data['notes'] and "Questions" in data['notes']:
                print("\n✅ SUCCESS: Response follows the structured notes format.")
            else:
                print("\n⚠️ WARNING: Response format might be missing required sections.")
        else:
            print(f"\n❌ FAILURE: API returned status {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    verify_notes_extraction()
