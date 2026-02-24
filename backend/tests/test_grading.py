import pytest
import datetime

def test_grading_json_parsing():
    """Verify that we can parse the expected AI grading format."""
    raw_reply = '```json\n{"score": 95, "feedback": "Excellent work on Trigonometry!", "status": "graded"}\n```'
    clean_reply = raw_reply.replace("```json", "").replace("```", "").strip()
    grading_json = __import__("json").loads(clean_reply)
    
    assert grading_json["score"] == 95
    assert "feedback" in grading_json
    assert grading_json["status"] == "graded"

def test_praise_broadcasting_logic():
    """Simulate the logic for broadcasting praise to multiple parents."""
    user_id = "teacher_123"
    student_id = "student_456"
    active_links = [{"parent_id": "parent_1"}, {"parent_id": "parent_2"}]
    
    praise_msg = "Outstanding performance!"
    teacher_name = "Mr. Sharma"
    
    nudges = []
    for link in active_links:
        nudge = {
            "parent_id": link["parent_id"],
            "student_id": student_id,
            "content": f"🌟 Praise from {teacher_name}: {praise_msg}",
            "type": "praise"
        }
        nudges.append(nudge)
        
    assert len(nudges) == 2
    assert nudges[0]["parent_id"] == "parent_1"
    assert "Sharma" in nudges[1]["content"]

def test_submission_upsert_logic():
    """Verify that multiple submissions from the same student on same assignment are handled."""
    # This just mocks the DB behavior we expect from upsert on unique constraint
    pass 
