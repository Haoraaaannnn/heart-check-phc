#!/usr/bin/env python
"""Test script to diagnose analytics seeder issues"""
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

def fetch_supabase_table(table_name: str, select: str = "*") -> list[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL/key are not configured.")
    
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select={select}"
    
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
        )
        response.raise_for_status()
        return response.json()

print("🔍 Testing Supabase connection...")
try:
    # Test connection
    data = fetch_supabase_table(
        "patients",
        select="id,created_at,patientNum,service,status,reg_start,reg_end,consult_start,consult_end,cubicleNum"
    )
    print(f"✅ Connection successful! Found {len(data)} patient records")
    
    if data:
        print(f"\n📊 Sample data (first 3 records):")
        df = pd.DataFrame(data)
        print(df.head(3))
        print(f"\n📋 DataFrame shape: {df.shape}")
        print(f"📋 DataFrame columns: {list(df.columns)}")
        print(f"📋 DataFrame dtypes:\n{df.dtypes}")
        
        # Check for seeded data
        seeded_count = len(df[df['patientNum'].str.startswith('seed-', na=False)])
        print(f"\n🌱 Seeded records found: {seeded_count} out of {len(df)}")
    else:
        print("❌ No patient records found in Supabase!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
