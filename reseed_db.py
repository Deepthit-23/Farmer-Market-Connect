# Helper script to re-seed local MySQL database with Indian crop names and pricing
import os
import pymysql
from dotenv import load_dotenv

# Load database credentials from root .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "farmer_market")

print("="*60)
print("   AgriFlow Direct - Database Re-seeding Utility")
print("="*60)
print(f"Connecting to MySQL database '{DB_NAME}' on {DB_HOST}:{DB_PORT} as user '{DB_USER}'...")

try:
    # Connect to the database
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True
    )
    
    cursor = conn.cursor()
    print("Database connection successfully established!")
    
    # Path to seed data file
    seed_file_path = os.path.join(os.path.dirname(__file__), 'database', 'seed_data.sql')
    if not os.path.exists(seed_file_path):
        raise FileNotFoundError(f"Could not locate seed_data.sql at: {seed_file_path}")
        
    print(f"Reading seed statements from: {seed_file_path}...")
    with open(seed_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
        
    # Split queries by semicolon (ignoring comments)
    raw_statements = sql_content.split(';')
    executed_count = 0
    
    print("Executing database reset and seeding queries...")
    for statement in raw_statements:
        # Strip lines starting with comments to prevent skipping full statements
        lines = []
        for line in statement.splitlines():
            line_stripped = line.strip()
            if line_stripped.startswith('--'):
                continue
            lines.append(line)
        clean_statement = "\n".join(lines).strip()
        
        if not clean_statement:
            continue
            
        try:
            print("Executing: " + clean_statement[:80].replace('\n', ' ') + "...")
            cursor.execute(clean_statement)
            executed_count += 1
        except Exception as query_err:
            print("Warning: Statement execution flagged: " + str(query_err) + " for query: " + clean_statement[:150].replace('\n', ' ') + "...")
            
    print("-"*60)
    print(f"Success! Executed {executed_count} queries successfully.")
    print("Database has been updated with Indian crop names and pricing!")
    print("Please reload your React browser tab now to see the live updates!")
    print("="*60)
    
    cursor.close()
    conn.close()

except Exception as err:
    print("\n[ERROR] Database re-seeding failed!")
    print(f"Details: {err}")
    print("\nPlease verify that:")
    print("1. Your local MySQL Server is currently running.")
    print("2. The database 'farmer_market' exists (run database/schema.sql first).")
    print(f"3. Your credentials in '.env' are correct (Password: {DB_PASSWORD}).")
    print("="*60)
