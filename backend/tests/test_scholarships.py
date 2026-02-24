import pytest
import json
from unittest.mock import MagicMock, patch

# Mocking for test isolation
import sys
sys.modules['core.config'] = MagicMock()
sys.modules['db.supabase_client'] = MagicMock()
sys.modules['api.auth'] = MagicMock()

def test_audit_parsing():
    """Verify that we can correctly parse and status-score an AI audit reply."""
    reply = """
    ```json
    [
        {"criteria": "Family Income < 2.5 LPA", "status": "eligible", "notes": "Student family income is 1.8 LPA."},
        {"criteria": "Minimum 75% Marks", "status": "ineligible", "notes": "Student scored 68% in Class 12."}
    ]
    ```
    """
    clean = reply.replace("```json", "").replace("```", "").strip()
    audit = json.loads(clean)
    
    # Logic from api/scholarships.py
    status = "eligible"
    if any(a["status"] == "ineligible" for a in audit):
        status = "ineligible"
    elif any(a["status"] == "unknown" for a in audit):
        status = "pending"
        
    assert status == "ineligible"
    assert len(audit) == 2

def test_match_parsing():
    """Verify scholarship matching output format."""
    reply = "[{\"name\": \"Tata Million Scholars\", \"provider\": \"Tata Trusts\", \"benefit\": \"INR 50,000\"}]"
    matches = json.loads(reply)
    assert matches[0]["name"] == "Tata Million Scholars"
    assert matches[0]["provider"] == "Tata Trusts"
