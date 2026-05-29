#!/usr/bin/env python
"""Debug analytics pipeline"""
import os
import sys
import pandas as pd
import httpx
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

from analytics import generate_report
from analytics.preprocessing import preprocess_queue_data

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

print("🔍 Testing analytics pipeline...\n")

# Step 1: Fetch data
try:
    data = fetch_supabase_table(
        "patients",
        select="id,created_at,patientNum,service,status,reg_start,reg_end,consult_start,consult_end,cubicleNum"
    )
    df = pd.DataFrame(data)
    print(f"✅ Step 1: Fetched {len(df)} records from Supabase")
except Exception as e:
    print(f"❌ Step 1 failed: {e}")
    sys.exit(1)

# Step 2: Normalize columns
try:
    # Mimic main.py's normalize_dataframe logic
    if "patientNum" in df.columns and "patient_id" not in df.columns:
        df = df.rename(columns={"patientNum": "patient_id"})
    
    if "kiosk_time" not in df.columns and "created_at" in df.columns:
        df["kiosk_time"] = df["created_at"]
    
    print(f"✅ Step 2: Normalized columns. Shape: {df.shape}")
    print(f"   Columns: {list(df.columns)}")
except Exception as e:
    print(f"❌ Step 2 failed: {e}")
    sys.exit(1)

# Step 3: Preprocess
try:
    df_clean = preprocess_queue_data(df)
    print(f"✅ Step 3: Preprocessed. Shape: {df_clean.shape}")
    print(f"   Missing timestamps: reg_start={df_clean['reg_start'].isna().sum()}, "
          f"reg_end={df_clean['reg_end'].isna().sum()}, "
          f"consult_start={df_clean['consult_start'].isna().sum()}, "
          f"consult_end={df_clean['consult_end'].isna().sum()}")
except Exception as e:
    print(f"❌ Step 3 failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Generate report
try:
    report = generate_report(df_clean)
    print(f"✅ Step 4: Report generated!")
    
    # Check if report has data
    if report.get("daily_summary"):
        print(f"   Daily summary records: {len(report['daily_summary'])}")
        print(f"   Sample: {report['daily_summary'][0] if report['daily_summary'] else 'None'}")
    else:
        print(f"   ⚠️ Daily summary is empty!")
        
    if report.get("hourly_pattern"):
        print(f"   Hourly pattern records: {len(report['hourly_pattern'])}")
    else:
        print(f"   ⚠️ Hourly pattern is empty!")
        
except Exception as e:
    print(f"❌ Step 4 failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All steps completed successfully!")
