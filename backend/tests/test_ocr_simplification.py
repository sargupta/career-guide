import asyncio
import sys
import os
import io
from unittest.mock import MagicMock, patch

# Add current directory to path so we can import 'main'
sys.path.append(os.getcwd())
# Also add app directory if needed for sub-modules
sys.path.append(os.path.join(os.getcwd(), '..'))

# We'll test the API logic directly by mocking the Gemini model response
from fastapi.testclient import TestClient
from main import app
from api.auth import get_current_user

# Mock user
mock_user = {
    "user_id": "test-student-ocr",
    "full_name": "Rohan OCR",
    "domain": "Medical Professionals",
    "token": "mock-token"
}

def mock_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = mock_get_current_user
client = TestClient(app)

def verify_ocr_simplification():
    print("🚀 Verifying OCR & Document Simplification API...")
    
    # Create a mock image file
    file_content = b"fake image content"
    file = ("textbook.png", file_content, "image/png")
    
    # Mock Gemini model response
    mock_gemini_response = MagicMock()
    mock_gemini_response.text = (
        "## OCR Extraction\n"
        "The extracted text discusses the human circulatory system focusing on the heart's four chambers.\n\n"
        "## Simplified Insight\n"
        "Think of your heart like a 4-room house with one-way doors (valves) that keep the traffic (blood) moving correctly.\n\n"
        "## Key Concepts\n"
        "- Atria & Ventricles\n- Valves\n- Pulmonary vs Systemic circulation"
    )
    
    with patch("google.generativeai.GenerativeModel.generate_content", return_value=mock_gemini_response):
        print("\nSending mock textbook scan to /simplify/upload...")
        response = client.post(
            "/simplify/upload",
            files={"file": file},
            data={"level": "basic", "language": "English"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS: API returned 200 OK")
            print(f"Simplified Response:\n{data['simplified']}")
            
            if "house" in data['simplified'].lower() or "chambers" in data['simplified'].lower():
                print("\n✅ SUCCESS: Response contains expected simplification elements.")
            else:
                print("\n⚠️ WARNING: Response format looks unexpected.")
        else:
            print(f"\n❌ FAILURE: API returned status {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    verify_ocr_simplification()
