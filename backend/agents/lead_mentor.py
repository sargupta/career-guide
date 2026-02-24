"""
Lead Mentor Agent — built with Google ADK (Agent Development Kit)
Acts as the Orchestrator. It can handle general career chats or delegate to Sub-Agents
(Opportunity Scout, Resume Optimizer, Skilling Coach) when the user needs specific help.
"""
from google.adk.agents.llm_agent import Agent
import os
import json
import logging

from core.config import settings
from services.persona_engine import get_profile, build_persona_context

# ADK requires GEMINI_API_KEY internally for its default client
if settings.GOOGLE_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GOOGLE_API_KEY

logger = logging.getLogger(__name__)

import asyncio
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# A global memory session service for all mock ADK runs
_session_service = InMemorySessionService()

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from google.adk.agents.llm_agent import Agent
from agents.sub_agents import (
    create_opportunity_scout, 
    create_skilling_coach, 
    create_academic_radar, 
    create_project_copilot, 
    create_live_web_scout,
    create_gov_exam_expert,
    create_scholarship_radar,
    create_simplification_expert,
    create_career_path_expert
)

def lookup_resources(q: str, domain_id: str = None) -> str:
    """
    Search the SARGVISION Resource Library for study materials.
    Returns a list of matching resources (videos, PDFs, courses).
    """
    import requests
    # In a real environment, we'd use the internal service or the API.
    # Since we're inside the backend, we can query Supabase directly using the service role or a client.
    from db.supabase_client import get_supabase
    supabase = get_supabase()
    
    try:
        query = supabase.table("resources").select("*").ilike("title", f"%{q}%").eq("is_active", True)
        if domain_id:
            query = query.eq("domain_id", domain_id)
            
        res = query.limit(5).execute()
        if not res.data:
            return f"No resources found for '{q}'."
            
        output = "Found matching resources in the SARGVISION Library:\n"
        for r in res.data:
            output += f"- [{r['type'].upper()}] {r['title']}: {r['url']}\n"
        return output
    except Exception as e:
        return f"Resource Library is currently offline ({str(e)}). I'll guide you based on general knowledge instead."

def get_orchestratorResponse(user_profile: dict, message: str, system_hint: str = None) -> str:
    """
    Initialize the ADK Agent lazily per request to inject user context into the instruction.
    Persona context is fetched from Supabase and injected into the system prompt.
    """
    name = (user_profile.get("full_name") or "there").split()[0]
    readiness_pct = user_profile.get("readiness_pct", 72)
    domain = user_profile.get("domain", "Software Engineering")
    user_id = user_profile.get("id", "default_user")

    # Pull memory context injected by mentor.py (from Mem0 search)
    memory_context: str = user_profile.get("_memory_context", "")

    # Pull persona context from Supabase (pre-fetched and injected by mentor.py)
    persona_profile: dict = user_profile.get("_persona_profile") or {}
    persona_context_block: str = build_persona_context(persona_profile)

    # Extract language preference, default to English
    preferred_language = user_profile.get("preferred_language", "English")

    instruction = (
        f"You are the Lead Career Mentor for an Indian student named {name}. "
        f"Their primary interest is {domain} and their current readiness score is {readiness_pct}%.\n\n"
        + (f"━━━ SITUATIONAL CONTEXT (URGENT) ━━━\n{system_hint}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" if system_hint else "")
        + f"CRITICAL LANGUAGE SETTING: You MUST reply to the user primarily in {preferred_language}. "
        f"If {preferred_language} is Hinglish, blend Hindi and English words naturally as Indian college students do, but use Latin script. "
        f"If {preferred_language} is a regional language (like Hindi or Bengali), prioritize responding in that native script, maintaining professional yet supportive mentor tone.\n\n"
        + persona_context_block  # ← Dynamic persona injection
            + (
            # Inject memory block if available
            "━━━ WHAT I ALREADY KNOW ABOUT THIS STUDENT (do NOT ask them to repeat this) ━━━\n"
            + memory_context
            + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            if memory_context else ""
        )
        + (
            # Inject Parent Nudges if available
            "━━━ GUIDANCE FROM STUDENT'S PARENT/GUARDIAN (weave this in naturally) ━━━\n"
            + user_profile.get("_parent_nudges", "")
            + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            if user_profile.get("_parent_nudges") else ""
        )
        + "CRITICAL: You are an Orchestrator. The user thinks you are a 'Board of Advisors'. "
        "When relevant, delegate to your sub-agents:\n"
        "- OpportunityScout: search the web for internships, jobs.\n"
        "- LiveWebScout: browse REAL career sites (Internshala, Naukri, Unstop) with a headless browser.\n"
        "- AcademicRadar: find live hackathons and industry news.\n"
        "- SkillingCoach: generate structured learning plans.\n"
        "- DeveloperCoPilot: review GitHub repos.\n"
        "- GovExamExpert: Provide structured coaching and timeline tracking for Indian government exams (UPSC, GATE, CAT, SSC).\n"
        "- ScholarshipRadar: Find active financial aid, fee-waivers, and scholarships for Indian students.\n"
        "- SimplificationExpert: Simplify complex textbooks, research papers, and concepts into easy-to-understand explanations (English/Hinglish).\n"
        "- CareerPathExpert: Map academic topics and textbook concepts to industry career paths, technical skills, and roles.\n\n"
        "You also have direct SQLite MCP access to the Digital Twin database, and the 'lookup_resources' tool to find study materials in our library."
    )


    # Initialize sub-agents
    scout_agent = create_opportunity_scout()
    coach_agent = create_skilling_coach()
    radar_agent = create_academic_radar()
    copilot_agent = create_project_copilot()
    web_scout_agent = create_live_web_scout()
    gov_agent = create_gov_exam_expert()
    schol_agent = create_scholarship_radar()
    simplify_agent = create_simplification_expert()
    career_agent = create_career_path_expert()

    from google.adk.tools.agent_tool import AgentTool

    tools = [
        AgentTool(scout_agent),
        AgentTool(coach_agent),
        AgentTool(radar_agent),
        AgentTool(copilot_agent),
        AgentTool(web_scout_agent),   # ← Playwright-powered browser agent
        AgentTool(gov_agent),
        AgentTool(schol_agent),
        AgentTool(simplify_agent),
        AgentTool(career_agent),
        lookup_resources, # ← Function tool for library lookup
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="mcp-server-sqlite",
                    args=["--db-path", "test.db"]
                )
            )
        )
    ]

    lead_mentor = Agent(
        model='gemini-2.5-flash',
        name='LeadMentor',
        description="Lead Career Advisor orchestrating sub-agents for specialized tasks.",
        instruction=instruction,
        tools=tools,
    )
    
    # Fast-lane sync execution of the ADK Runner
    if not os.environ.get("GEMINI_API_KEY"):
        return f"Hey {name}, I'm offline! Add the GEMINI_API_KEY to my systems so I can call my sub-agents."
    
    runner = Runner(
        app_name="SargvisionMentoring",
        agent=lead_mentor,
        session_service=_session_service,
        auto_create_session=True
    )
    
    try:
        # Run ADK agent natively using the latest run signature
        adk_message = types.Content(role="user", parts=[types.Part.from_text(text=message)])
        
        from core.metrics import AGENT_LATENCY
        import time
        start_time = time.time()
        
        events = runner.run(
            user_id=user_id,
            session_id=f"session_{user_id}",
            new_message=adk_message
        )
        
        duration = time.time() - start_time
        AGENT_LATENCY.labels(agent_name="LeadMentor_Orchestrator").observe(duration)
        
        reply_text = ""
        for event in events:
            # We don't need manual function extraction anymore, ADK handles the MCP execution!
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        reply_text += part.text
            elif hasattr(event, "model_response_message") and event.model_response_message:
                for part in event.model_response_message.content.parts:
                    if hasattr(part, "text") and part.text:
                        reply_text += part.text
            elif hasattr(event, "text") and event.text:
                reply_text += event.text
            elif isinstance(event, str):
                reply_text += event

        return reply_text if reply_text else "Hmm, I didn't get any text back from my agents."
    except Exception as e:
        logger.error(f"ADK LeadMentor Error: {e}")
        return "Looks like I hit a network glitch connecting to my sub-agents. Can you try asking that again?"
