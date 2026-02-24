import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.lead_mentor import get_orchestratorResponse

async def verify_parental_loop():
    print("🚀 Verifying Parental AI Logic Loop...")
    
    # 1. Mock Student Data
    student_name = "Rohan"
    domain = "Medical Science"
    nudge_content = "Please remind Rohan to look into Cardiology residency programs in Mumbai."
    
    # 2. Construct Mock User Profile (Simulating what mentor.py would produce)
    user_profile = {
        "id": "mock-student-id",
        "full_name": student_name,
        "domain": domain,
        "readiness_pct": 65,
        "_parent_nudges": f"- {nudge_content}"
    }
    
    # 3. Call AI Mentor
    print(f"\nStudent: '{student_name}'")
    print(f"Parent Nudge: '{nudge_content}'")
    
    message = "Hi, I'm thinking about my future after med school. Any advice?"
    print(f"User Message: '{message}'")
    
    print("\nRequesting response from AI Mentor (Gemini)...")
    
    try:
        # get_orchestratorResponse is sync
        response = get_orchestratorResponse(user_profile, message)
        
        print(f"\nAI Mentor Response:\n{'-'*40}\n{response}\n{'-'*40}")
        
        # Verify if AI mentioned Mumbai or Cardiology
        mentions_nudge = any(word.lower() in response.lower() for word in ["mumbai", "cardiology", "residency"])
        
        if mentions_nudge:
            print("\n✅ SUCCESS: AI Mentor successfully integrated the parent nudge into the conversation!")
        else:
            print("\n❌ FAILURE: AI Mentor did not mention the parental guidance.")
            
    except Exception as e:
        print(f"Error calling ADK: {e}")

if __name__ == "__main__":
    asyncio.run(verify_parental_loop())
