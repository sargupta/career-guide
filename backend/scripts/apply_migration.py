import os
import psycopg2
from dotenv import load_dotenv

# Load env from root or backend
load_dotenv('.env')

db_url = os.environ.get("SUPABASE_DB_URL")

if not db_url:
    print("Missing SUPABASE_DB_URL in .env")
    exit(1)

def apply_migration(file_path):
    print(f"Applying migration: {file_path}")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        sql = f.read()

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.close()
        print("✅ Migration applied successfully!")
    except Exception as e:
        print(f"❌ Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration('backend/db/migrations/010_resource_library.sql')
