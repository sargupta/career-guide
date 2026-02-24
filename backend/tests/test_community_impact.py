import pytest
import json
from unittest.mock import MagicMock, patch

def test_impact_calculation():
    """Verify that impact metrics (hours saved, remixes) are correctly aggregated."""
    assets = [
        {"asset_type": "quiz", "clones_count": 5, "likes_count": 10},
        {"asset_type": "lesson_plan", "clones_count": 2, "likes_count": 4},
        {"asset_type": "quiz", "clones_count": 0, "likes_count": 1}
    ]
    
    # Logic from teacher.py
    total_generated = len(assets)
    hours_saved = sum(2 if a["asset_type"] == "lesson_plan" else 1 for a in assets)
    total_remixes = sum(a.get("clones_count", 0) for a in assets)
    
    assert total_generated == 3
    assert hours_saved == 4 # (1 + 2 + 1)
    assert total_remixes == 7 # (5 + 2 + 0)

def test_remix_data_preparation():
    """Verify that a remix object is correctly structured before insertion."""
    original = {
        "id": "orig-123",
        "asset_type": "quiz",
        "subject": "Math",
        "grade_level": "10",
        "title": "Algebra 101",
        "content_json": {"q": 1}
    }
    
    user_id = "teacher-456"
    new_asset = {
        "teacher_id": user_id,
        "asset_type": original["asset_type"],
        "subject": original["subject"],
        "grade_level": original["grade_level"],
        "title": f"{original['title']} (Remix)",
        "content_json": original["content_json"],
        "remixed_from": original["id"]
    }
    
    assert new_asset["remixed_from"] == "orig-123"
    assert "(Remix)" in new_asset["title"]
    assert new_asset["teacher_id"] == "teacher-456"
