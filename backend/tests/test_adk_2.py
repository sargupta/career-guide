import os
import asyncio
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.llm_agent import Agent
from google.genai import types

_session_service = InMemorySessionService()

lead_mentor = Agent(
    model='gemini-2.5-flash',
    name='LeadMentor',
    description="Lead Career Advisor orchestrating sub-agents for specialized tasks.",
    instruction="Say hello.",
    tools=[],
)
runner = Runner(
    app_name="SargvisionMentoring",
    agent=lead_mentor,
    session_service=_session_service,
    auto_create_session=True
)

adk_message = types.Content(role="user", parts=[types.Part.from_text(text="Hi")])
events = runner.run(
    user_id="u123",
    session_id=f"session_u123",
    new_message=adk_message
)

for e in events:
    print("Event Type:", type(e))
    for k in dir(e):
        if not k.startswith("_"):
            print("  -", k, ":", getattr(e, k))
