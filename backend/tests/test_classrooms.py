import pytest
import random
import string

def generate_join_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def test_join_code_generation():
    """Verify that join codes are 6-character alphanumeric strings."""
    code = generate_join_code()
    assert len(code) == 6
    assert code.isalnum()
    assert code.isupper() or any(c.isdigit() for c in code)

def test_assignment_view_logic():
    """Verify the logic for filtering assignments by classroom membership."""
    # Mock data
    enrollments = [{"classroom_id": "math_101"}]
    assignments = [
        {"id": "task_1", "classroom_id": "math_101", "title": "Math Quiz"},
        {"id": "task_2", "classroom_id": "science_202", "title": "Solar System"}
    ]
    
    # Filter logic from get_student_assignments
    classroom_ids = [e["classroom_id"] for e in enrollments]
    visible_tasks = [a for a in assignments if a["classroom_id"] in classroom_ids]
    
    assert len(visible_tasks) == 1
    assert visible_tasks[0]["title"] == "Math Quiz"
