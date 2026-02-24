import asyncio
import sys
import os
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Import the job we want to test
from scheduler import job_monthly_progress_reports

async def verify_monthly_report_logic():
    print("🚀 Verifying Monthly Report Generation Logic (Mocked DB)...")
    
    # 1. Mock Data Setup
    mock_user_id = "mock-student-id"
    mock_user = {
        "user_id": mock_user_id,
        "full_name": "Rohan Report Tester",
        "domains": {"name": "Software Engineering"}
    }
    
    mock_activities = [
        {"title": "Open Source Contribution", "category": "development"},
        {"title": "System Design Workshop", "category": "learning"}
    ]
    
    mock_readiness = [
        {"readiness_pct": 42},
        {"readiness_pct": 58}
    ]
    
    mock_nudges = [
        {"content": "Focus on backend architecture."}
    ]

    # 2. Mock Supabase Client
    mock_supabase = MagicMock()
    mock_tables = {}

    def mock_table(table_name):
        if table_name not in mock_tables:
            mock_chain = MagicMock()
            mock_chain.select.return_value = mock_chain
            mock_chain.eq.return_value = mock_chain
            mock_chain.gte.return_value = mock_chain
            mock_chain.order.return_value = mock_chain
            mock_chain.limit.return_value = mock_chain
            mock_chain.insert.return_value = mock_chain
            mock_tables[table_name] = mock_chain
        
        mock_chain = mock_tables[table_name]
        
        if table_name == "profiles":
            mock_chain.execute.return_value = MagicMock(data=[mock_user])
        elif table_name == "activities":
            mock_chain.execute.return_value = MagicMock(data=mock_activities)
        elif table_name == "readiness_snapshots":
            mock_chain.execute.return_value = MagicMock(data=mock_readiness)
        elif table_name == "parent_nudges":
            mock_chain.execute.return_value = MagicMock(data=mock_nudges)
        else:
            mock_chain.execute.return_value = MagicMock(data=[])
            
        return mock_chain

    mock_supabase.table.side_effect = mock_table

    # 3. Patch get_supabase and run job
    print("\nPatching get_supabase and running job...")
    with patch("scheduler.get_supabase", return_value=mock_supabase):
        try:
            await job_monthly_progress_reports()
            
            # Inspect the insert call
            insert_call = mock_supabase.table("monthly_reports").insert.call_args
            if insert_call:
                report_data = insert_call[0][0]
                print(f"✅ SUCCESS: Monthly report generation triggered!")
                print(f"Metrics Captured: {report_data['metrics_snapshot']}")
                print(f"\nNarrative Preview:\n{'-'*40}\n{report_data['narrative_summary'][:400]}...\n{'-'*40}")
            else:
                print("❌ FAILURE: Monthly report insert was never called.")
                
        except Exception as e:
            print(f"Error during logic verification: {e}")

if __name__ == "__main__":
    asyncio.run(verify_monthly_report_logic())
