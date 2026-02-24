import pytest
import os
import asyncio
from dotenv import load_dotenv

# Ensure environment vars are loaded before importing agents
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', '.env.local'))
os.environ['GEMINI_API_KEY'] = os.environ.get('NEXT_PUBLIC_GEMINI_API_KEY', '') or os.environ.get('GOOGLE_API_KEY', '')

from agents.sub_agents import (
    create_opportunity_scout,
    create_skilling_coach,
    create_hackathon_scout,
    create_gov_exam_expert,
    create_scholarship_radar,
    create_news_scout,
    create_academic_radar,
    create_project_copilot,
    create_live_web_scout,
    create_simplification_expert,
    create_career_path_expert
)
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

_session_service = InMemorySessionService()

async def run_agent(agent_factory, message: str) -> str:
    """Helper to execute an ADK agent synchronously for testing natively."""
    agent = agent_factory()
    runner = Runner(
        app_name="TestRunner",
        agent=agent,
        session_service=_session_service,
        auto_create_session=True
    )
    
    adk_message = types.Content(role="user", parts=[types.Part.from_text(text=message)])
    events = runner.run(
        user_id="test_user",
        session_id="test_session",
        new_message=adk_message
    )
    
    reply_text = ""
    for event in events:
        if hasattr(event, "content") and event.content:
            if event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        reply_text += part.text
        elif hasattr(event, "model_response_message") and event.model_response_message:
            if event.model_response_message.content and event.model_response_message.content.parts:
                for part in event.model_response_message.content.parts:
                    if hasattr(part, "text") and part.text:
                        reply_text += part.text
        elif hasattr(event, "text") and event.text:
            reply_text += event.text
        elif isinstance(event, str):
            reply_text += event
            
    return reply_text


@pytest.mark.asyncio
async def test_gov_exam_expert_syllabus_breakdown():
    """Verify GovExamExpert provides structured syllabus breakdown."""
    reply = await run_agent(create_gov_exam_expert, "What is the general syllabus for UPSC CSE Prelims? Give me a short summary.")
    assert reply is not None
    assert len(reply) > 50
    # Should mention key UPSC preliminary topics
    text_lower = reply.lower()
    assert "history" in text_lower or "polity" in text_lower or "current affairs" in text_lower
    assert "gs" in text_lower or "general studies" in text_lower


@pytest.mark.asyncio
async def test_scholarship_radar_extraction():
    """Verify ScholarshipRadar returns properly formatted financial aid data."""
    reply = await run_agent(create_scholarship_radar, "Find me a live scholarship for engineering students in India.")
    assert reply is not None
    text_lower = reply.lower()
    # Ensure it follows formatting constraints
    assert "eligibility" in text_lower
    assert "deadline" in text_lower


@pytest.mark.asyncio
async def test_skilling_coach_learning_plan():
    """Verify SkillingCoach generates a structured 4-week learning path."""
    reply = await run_agent(create_skilling_coach, "I want to learn FastAPI. Give me a 4-week plan.")
    assert reply is not None
    text_lower = reply.lower()
    # It must chunk into weeks
    assert "week 1" in text_lower
    assert "week 2" in text_lower
    assert "week 3" in text_lower
    assert "week 4" in text_lower
    assert "fastapi" in text_lower


@pytest.mark.asyncio
async def test_news_scout_current_events():
    """Verify NewsScout uses its grounding to fetch relatively recent AI news."""
    reply = await run_agent(create_news_scout, "What are the latest developments in AI for February 2026? Be brief.")
    assert reply is not None
    assert len(reply) > 20
    text_lower = reply.lower()
    # Should know what AI means
    assert "ai" in text_lower or "artificial intelligence" in text_lower


@pytest.mark.asyncio
async def test_opportunity_scout_search():
    """Verify OpportunityScout can search for internships."""
    reply = await run_agent(create_opportunity_scout, "Search for Python internships in Pune.")
    assert reply is not None
    assert "internship" in reply.lower() or "python" in reply.lower()


@pytest.mark.asyncio
async def test_hackathon_scout():
    """Verify HackathonScout finds technical events."""
    reply = await run_agent(create_hackathon_scout, "Find upcoming AI hackathons in 2026.")
    assert reply is not None
    assert "hackathon" in reply.lower() or "ai" in reply.lower()


@pytest.mark.asyncio
async def test_academic_radar_parallel():
    """Verify AcademicRadar (ParallelAgent) executes successfully."""
    # This might take longer as it runs NewsScout + HackathonScout
    reply = await run_agent(create_academic_radar, "Give me current AI news and one upcoming hackathon.")
    assert reply is not None
    assert len(reply) > 50


@pytest.mark.asyncio
async def test_simplification_expert():
    """Verify SimplificationExpert simplifies jargon."""
    reply = await run_agent(create_simplification_expert, "Explain 'backpropagation' in simple terms.")
    assert reply is not None
    assert "backpropagation" in reply.lower() or "neural" in reply.lower()


@pytest.mark.asyncio
async def test_career_path_expert():
    """Verify CareerPathExpert maps topics to roles."""
    reply = await run_agent(create_career_path_expert, "I enjoy Distributed Systems. What are some career paths?")
    assert reply is not None
    assert "engineer" in reply.lower() or "architect" in reply.lower()


@pytest.mark.asyncio
async def test_mcp_agents_instantiation():
    """Verify that MCP agents can be instantiated (checking toolset config)."""
    # We do not run these in unit tests to avoid starting npx servers and requiring tokens
    copilot = create_project_copilot()
    assert copilot.name == "DeveloperCoPilot"
    assert len(copilot.tools) > 0
    
    web_scout = create_live_web_scout()
    assert web_scout.name == "LiveWebScout"
    assert len(web_scout.tools) > 0
