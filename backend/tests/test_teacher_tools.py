import pytest
import json
from unittest.mock import MagicMock, patch

# Mocking for test isolation
import sys
sys.modules['core.config'] = MagicMock()
sys.modules['db.supabase_client'] = MagicMock()
sys.modules['api.auth'] = MagicMock()

def test_quiz_json_parsing():
    """Verify that we can correctly parse an AI generated quiz reply."""
    reply = """
    ```json
    [
        {
            "question": "What is the capital of India?",
            "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            "answer": "New Delhi",
            "level": "Remembering",
            "explanation": "New Delhi is the official capital of India."
        }
    ]
    ```
    """
    clean = reply.replace("```json", "").replace("```", "").strip()
    quiz = json.loads(clean)
    
    assert len(quiz) == 1
    assert quiz[0]["answer"] == "New Delhi"
    assert "level" in quiz[0]

def test_lesson_plan_json_parsing():
    """Verify that we can correctly parse an AI generated lesson plan."""
    reply = """
    {
        "title": "Introduction to Algebra",
        "objectives": ["Identify variables", "Solve basic equations"],
        "duration": "45 mins",
        "sections": [
            {"phase": "Engage", "activity": "Word problem", "duration": "5 mins"}
        ]
    }
    """
    lesson = json.loads(reply)
    assert lesson["title"] == "Introduction to Algebra"
    assert len(lesson["sections"]) == 1
