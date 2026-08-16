#!/usr/bin/env python
"""Test ARIMA forecasting module"""
import os
import sys
import warnings
import pandas as pd
import numpy as np
import httpx
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

from analytics.preprocessing import preprocess_queue_data
from analytics.forecasting import evaluate_forecasting_algorithms

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

print("🔍 Testing ARIMA forecasting module...")
print("=" * 60)

try:
    # Fetch data
    print("\n📥 Fetching patient data from Supabase...")
    data = fetch_supabase_table(
        "patients",
        select="id,created_at,service,status,reg_start,reg_end,consult_start,consult_end,patientNum"
    )
    print(f"✅ Fetched {len(data)} patient records")
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Rename columns to match preprocessing expectations
    df = df.rename(columns={k: v for k, v in {
        'id': 'patient_id',
        'created_at': 'kiosk_time',
        'service': 'purpose',
        'patientNum': 'queue_number',
    }.items() if k in df.columns and v not in df.columns})
    
    print(f"✅ DataFrame created with {df.shape[0]} rows and {df.shape[1]} columns")
    
    # Preprocess data
    print("\n🔧 Preprocessing data...")
    df_processed = preprocess_queue_data(df)
    print(f"✅ Preprocessing complete")
    print(f"   - Total time range: {df_processed['kiosk_time'].min()} to {df_processed['kiosk_time'].max()}")
    print(f"   - Unique days: {df_processed['visit_date'].nunique()}")
    
    # Test forecasting algorithms
    print("\n📊 Testing forecasting algorithms (including ARIMA)...")
    print("-" * 60)
    
    result = evaluate_forecasting_algorithms(df_processed)
    
    print(f"\n✅ Forecasting completed successfully!")
    print(f"\n📈 Results:")
    print(f"   Status: {result['status']}")
    print(f"   Best Algorithm: {result['best_algorithm']}")
    print(f"   Next Day Forecast: {result['next_day_forecast']} patients")
    
    print(f"\n📊 Evaluation Metrics:")
    for algo, metrics in result['evaluation_metrics'].items():
        print(f"   {algo:20} - MAE: {metrics['MAE']:8.4f}  RMSE: {metrics['RMSE']:8.4f}")
    
    print(f"\n📝 Algorithmic Conclusion:")
    print(f"   {result['algorithmic_conclusion']}")
    
    print("\n" + "=" * 60)
    print("✅ ARIMA test PASSED - All forecasting algorithms working!")
    
except Exception as e:
    print(f"\n❌ ARIMA test FAILED!")
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
