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
    "user_id": "test-student-roadmap",
    "full_name": "Rohan Roadmap",
    "domain": "Computer Science",
    "token": "mock-token"
}

def mock_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = mock_get_current_user
client = TestClient(app)

def verify_career_roadmap():
    print("🚀 Verifying Career Roadmap Visualization API...")
    
    # Test topic: React Hooks
    test_topic = "React Hooks and State Management"
    
    # Mock Gemini model response for Career Roadmap
    mock_gemini_response = MagicMock()
    mock_gemini_response.text = (
        "### 🛠️ Industry Skills\n"
        "- Frontend Development (React.js)\n"
        "- State Orchestration (Redux, Recoil)\n"
        "- Performance Optimization\n\n"
        "### 🌱 Entry Level Roles\n"
        "- Junior Frontend Developer\n"
        "- UI/UX Engineer (Technical focus)\n\n"
        "### 🚀 Growth Trajectory\n"
        "1. **Frontend Developer** (Mastering Hooks & Components)\n"
        "2. **Lead Frontend Architect** (System Design & State Flow)\n"
        "3. **CTO / Technical Visionary** (Strategic Engineering Leadership)\n\n"
        "### 💰 Market Value\n"
        "In India, React expertise is in critical demand across GCCs and high-growth fintech startups like Razorpay or Zerodha. Salaries range from 8LPA to 35LPA+ for specialists.\n\n"
        "### 🎯 Projects to Build\n"
        "- A complex dashboard with real-time data filtering using custom hooks.\n"
        "- A performance-tuned e-commerce checkout flow."
    )
    
    with patch("google.generativeai.GenerativeModel.generate_content", return_value=mock_gemini_response):
        print(f"\nRequesting roadmap for '{test_topic}'...")
        response = client.post(
            "/simplify/roadmap",
            json={"text": test_topic, "level": "basic", "language": "English"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS: API returned 200 OK")
            print(f"Generated Roadmap:\n{data['roadmap']}")
            
            if "Industry Skills" in data['roadmap'] and "Growth Trajectory" in data['roadmap']:
                print("\n✅ SUCCESS: Response follows the Career Roadmap structure.")
            else:
                print("\n⚠️ WARNING: Response format might be missing required sections.")
        else:
            print(f"\n❌ FAILURE: API returned status {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    verify_career_roadmap()
