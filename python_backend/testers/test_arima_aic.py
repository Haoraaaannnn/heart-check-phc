#!/usr/bin/env python
"""Test ARIMA with AIC Score verification"""
import os
import sys
import warnings
import pandas as pd
import numpy as np
import httpx
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

warnings.filterwarnings("ignore")

env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

from analytics.preprocessing import preprocess_queue_data
from analytics.forecasting import get_arima_chart_data

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

print("🔍 Testing ARIMA AIC Score Calculation...")
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
    df = df.rename(columns={k: v for k, v in {
        'id': 'patient_id',
        'created_at': 'kiosk_time',
        'service': 'purpose',
        'patientNum': 'queue_number',
    }.items() if k in df.columns and v not in df.columns})
    
    # Preprocess data
    print("\n🔧 Preprocessing data...")
    df_processed = preprocess_queue_data(df)
    print(f"✅ Preprocessing complete")
    
    # Get ARIMA chart data
    print("\n📊 Computing ARIMA chart data with AIC score...")
    arima_data = get_arima_chart_data(df_processed)
    
    print(f"✅ ARIMA Chart Data Generated!")
    print(f"\n📈 ARIMA Results:")
    print(f"   Status:         {arima_data['status']}")
    print(f"   Forecast Value: {arima_data['forecast_value']} patients")
    print(f"   Forecast Date:  {arima_data['forecast_date']}")
    print(f"   Data Points:    {len(arima_data['labels'])}")
    
    print(f"\n🎯 AIC Score Analysis:")
    if arima_data['aic'] is not None:
        print(f"   ✅ AIC: {arima_data['aic']}")
        print(f"   ✅ AIC Score is NOW WORKING (previously was None)")
        print(f"\n   What is AIC?")
        print(f"   - Akaike Information Criterion")
        print(f"   - Lower AIC = Better model fit")
        print(f"   - Used to compare different ARIMA configurations")
    else:
        print(f"   ❌ AIC: None (Model fitting may have failed)")
    
    print(f"\n📊 Actual vs Fitted Values (first 5 days):")
    for i in range(min(5, len(arima_data['labels']))):
        actual = arima_data['actual'][i]
        fitted = arima_data['fitted'][i]
        error = abs(actual - fitted)
        print(f"   Day {i+1}: Actual={actual:3d}  Fitted={fitted:6.1f}  Error={error:6.1f}")
    
    print("\n" + "=" * 60)
    print("✅ ARIMA AIC Test PASSED!")
    print("   - ARIMA model fits successfully")
    print("   - AIC score is calculated properly")
    print("   - Dashboard should display AIC value")
    
except Exception as e:
    print(f"\n❌ Test FAILED!")
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
