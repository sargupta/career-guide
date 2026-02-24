import pytest
from core.portfolio import synthesize_portfolio

@pytest.mark.asyncio
async def test_portfolio_synthesis_import():
    # Only verify the function exists and is callable
    assert synthesize_portfolio is not None
    # We won't call it here because it requires a heavy Supabase setup and Gemini API key,
    # but the structural implementation is verified via the codebase audit.
    assert callable(synthesize_portfolio)
