import sqlite3

def seed_db():
    conn = sqlite3.connect('test.db')
    c = conn.cursor()
    
    # Create tables mirroring Supabase for local MCP
    c.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            full_name TEXT,
            domain_id TEXT,
            onboarding_completed BOOLEAN
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS digital_twins (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            skills_json TEXT,
            competencies_json TEXT,
            readiness_scores_json TEXT
        )
    ''')
    
    # Insert a fake user
    c.execute("INSERT OR REPLACE INTO profiles (id, user_id, full_name, domain_id, onboarding_completed) VALUES ('prof_123', 'test_user123', 'Arjun', 'dom_1', 1)")
    c.execute("INSERT OR REPLACE INTO digital_twins (id, user_id, skills_json, competencies_json, readiness_scores_json) VALUES ('twin_123', 'test_user123', '[{\"name\": \"React\", \"level\": 3}, {\"name\": \"Node.js\", \"level\": 2}]', '{}', '{\"overall\": 72}')")
    
    conn.commit()
    conn.close()
    print("test.db seeded successfully with Digital Twin schema.")

if __name__ == '__main__':
    seed_db()
