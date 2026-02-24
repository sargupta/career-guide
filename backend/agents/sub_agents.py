import os
import logging
from google.adk.agents.llm_agent import Agent
from google.adk.agents.parallel_agent import ParallelAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from google.adk.tools import google_search
from mcp import StdioServerParameters

logger = logging.getLogger(__name__)


# Base path for skills folder
SKILLS_DIR = os.path.join(os.path.dirname(__file__), "..", "skills")


def load_skill_instructions(skill_name: str) -> str:
    """Load the instruction text from a SKILL.md file."""
    skill_path = os.path.join(SKILLS_DIR, skill_name, "SKILL.md")
    if not os.path.exists(skill_path):
        logger.warning(f"Skill not found: {skill_path}")
        return f"You are the {skill_name} agent."
    with open(skill_path, "r") as f:
        content = f.read()
    # Strip YAML frontmatter (--- ... ---)
    parts = content.split("---")
    return parts[-1].strip() if len(parts) > 2 else content


def _web_search_tools() -> list:
    """Google Search grounding — no API key required, uses GOOGLE_API_KEY."""
    return [google_search]


# ── The Sub-Agents ────────────────────────────────────────────────────────────

def create_opportunity_scout() -> Agent:
    """Opportunity Scout: finds internships & scholarships via Google Search grounding."""
    return Agent(
        model='gemini-2.5-flash',
        name='OpportunityScout',
        description="Finds internships, jobs, and scholarships by searching the live internet.",
        instruction=load_skill_instructions("opportunity_scout"),
        tools=_web_search_tools()
    )


def create_skilling_coach() -> Agent:
    """Skilling Coach: generates structured learning plans for specific skills."""
    return Agent(
        model='gemini-2.5-flash',
        name='SkillingCoach',
        description="Generates detailed 4-week learning paths for specific skills.",
        instruction=load_skill_instructions("skilling_coach"),
        tools=_web_search_tools()  # can search for latest courses/tutorials
    )


def create_hackathon_scout() -> Agent:
    """Hackathon Scout: finds upcoming hackathons & competitions."""
    return Agent(
        model='gemini-2.5-flash',
        name='HackathonScout',
        description="Finds technical hackathons and events using live web search.",
        instruction=load_skill_instructions("hackathon_scout"),
        tools=_web_search_tools()
    )


def create_gov_exam_expert() -> Agent:
    """Government Exam Expert: Provides coaching and tracking for UPSC, GATE, CAT, SSC, etc."""
    return Agent(
        model='gemini-2.5-flash',
        name='GovExamExpert',
        description="Expert career coach for Indian Government and Competitive Exams. Can generate structured syllabus JSON.",
        instruction=load_skill_instructions("gov_exam_expert") + "\n\nCRITICAL: When asked for a 'structured breakdown' or 'JSON syllabus', you MUST return ONLY a raw JSON array of objects with keys: 'subject', 'topics' (list), and 'weightage' (high/medium/low). No extra text.",
        tools=_web_search_tools()
    )


def create_scholarship_radar() -> Agent:
    """Scholarship Radar: Finds live financial aid and CSR grants."""
    return Agent(
        model='gemini-2.5-flash',
        name='ScholarshipRadar',
        description="Financial aid expert dedicated to finding scholarships, fee-waivers, and CSR grants for Indian students.",
        instruction=load_skill_instructions("scholarship_radar"),
        tools=_web_search_tools()
    )


def create_news_scout() -> Agent:
    """News Scout: fetches recent industry news and hiring trends."""
    return Agent(
        model='gemini-2.5-flash',
        name='NewsScout',
        description="Finds recent industry news and hiring trends.",
        instruction=load_skill_instructions("news_scout"),
        tools=_web_search_tools()
    )


def create_academic_radar() -> ParallelAgent:
    """Parallel workflow: HackathonScout + NewsScout run concurrently."""
    return ParallelAgent(
        name='AcademicRadar',
        description="Concurrently searches for live hackathons and industry news.",
        sub_agents=[create_hackathon_scout(), create_news_scout()]
    )


def _get_github_mcp_toolset() -> list[McpToolset]:
    """Returns an initialized ADK McpToolset connecting to the official GitHub MCP server.
    
    Note: A valid GITHUB_PERSONAL_ACCESS_TOKEN must be present in the environment
    for this MCP to successfully authenticate and return repository data.
    """
    import os
    github_token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
    
    if not github_token:
        # In a real environment, we would log a strong warning here.
        pass
        
    return [
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@modelcontextprotocol/server-github"],
                    env={"GITHUB_PERSONAL_ACCESS_TOKEN": github_token, "PATH": os.environ.get("PATH", "")}
                )
            )
        )
    ]

def create_project_copilot() -> Agent:
    """Developer Co-Pilot: audits GitHub repos via GitHub MCP."""
    return Agent(
        model='gemini-2.5-flash',
        name='DeveloperCoPilot',
        description="Analyzes GitHub repositories to assess code quality and provide actionable review feedback.",
        instruction=load_skill_instructions("project_copilot"),
        tools=_get_github_mcp_toolset()
    )


def _get_playwright_mcp_toolset() -> list:
    """
    Returns a Playwright MCP toolset for headless browser automation.
    Runs: npx @playwright/mcp@latest --headless
    
    Tools provided:
      browser_navigate, browser_snapshot, browser_click,
      browser_type, browser_wait_for, browser_close, etc.
    """
    return [
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=[
                        "-y",
                        "@playwright/mcp@latest",
                        "--headless",          # No visible browser window
                        "--browser", "chromium",
                    ],
                    env={"PATH": os.environ.get("PATH", "")}
                )
            )
        )
    ]


def create_live_web_scout() -> Agent:
    """
    Live Web Scout: Uses a real Playwright-controlled Chromium browser to navigate
    Indian career sites (Internshala, Unstop, Naukri, AngelList) and extract
    live, current opportunities with actual deadlines and stipends.

    This agent is far more powerful than search-only agents because it can:
    - Navigate paginated listings
    - Wait for JavaScript-rendered content
    - Extract structured data from the live DOM (accessibility tree)
    - Follow links to individual job pages to get full details
    """
    return Agent(
        model='gemini-2.5-flash',
        name='LiveWebScout',
        description=(
            "Navigates real Indian career sites (Internshala, Unstop, Naukri) via a "
            "Playwright headless browser to extract live opportunities with real deadlines."
        ),
        instruction=load_skill_instructions("live_web_scout"),
        tools=_get_playwright_mcp_toolset(),
    )
def create_simplification_expert() -> Agent:
    """Simplification Expert: simplifies complex academic concepts into easy-to-understand explanations."""
    return Agent(
        model='gemini-2.0-flash',
        name='SimplificationExpert',
        description="Simplifies complex academic concepts, papers, and textbooks into intuitive explanations.",
        instruction=load_skill_instructions("simplification_expert"),
        tools=_web_search_tools() # can search for real-world examples/analogies
    )

def create_career_path_expert() -> Agent:
    """Career Path Expert: Maps academic topics to industry careers."""
    return Agent(
        model='gemini-2.0-flash',
        name='CareerPathExpert',
        description="Maps academic topics and textbook concepts to industry career paths and skills.",
        instruction=load_skill_instructions("career_path_expert"),
        tools=_web_search_tools()
    )


def create_classroom_expert() -> Agent:
    """Classroom Expert: Pedagogical expert for Indian teachers. Generates quizzes and lesson plans."""
    return Agent(
        model='gemini-2.0-flash',
        name='ClassroomExpert',
        description="Expert in Indian pedagogy, assessment creation, and lesson planning.",
        instruction=load_skill_instructions("classroom_expert"),
        tools=_web_search_tools()
    )
