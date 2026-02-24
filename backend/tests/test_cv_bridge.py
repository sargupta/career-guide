import pytest
from core.cv_bridge import synthesize_resume_json, generate_resume_pdf

@pytest.mark.asyncio
async def test_cv_bridge_imports():
    # Only verify everything imports and is callable
    assert synthesize_resume_json is not None
    assert generate_resume_pdf is not None
    assert callable(synthesize_resume_json)
    assert callable(generate_resume_pdf)

def test_generate_pdf_structure():
    # Verify PDF generation with mock data doesn't crash
    mock_data = {
        "basics": {"name": "Test User", "label": "Developer", "summary": "Test Summary"},
        "work": [{"company": "Test Co", "position": "Dev", "startDate": "2020", "endDate": "2021", "summary": "Did stuff", "highlights": ["Bullet 1"]}],
        "education": [{"institution": "Test Uni", "area": "CS", "studyType": "BS"}],
        "skills": [{"name": "Tech", "keywords": ["Python", "JavaScript"]}]
    }
    pdf_bytes = generate_resume_pdf(mock_data)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF")
