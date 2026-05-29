import os
import sys
import pandas as pd
import httpx
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def fetch_all_patients():
    """Fetch ALL patients without pagination limits"""
    url = f"{SUPABASE_URL}/rest/v1/patients?select=id,created_at"
    
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Range": "0-10000"
            },
        )
        response.raise_for_status()
        return response.json()

data = fetch_all_patients()
df = pd.DataFrame(data)
df['created_at'] = pd.to_datetime(df['created_at'], utc=True)
df['date'] = df['created_at'].dt.date

print(f"Total records: {len(df)}")
print(f"Unique dates: {df['date'].nunique()}")
print(f"\nDaily patient counts:")
daily = df.groupby('date').size().sort_index()
print(daily)
