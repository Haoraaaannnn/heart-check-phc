"""
main.py
FastAPI Backend for Heart Check PHC
Connects to Supabase and serves the analytics payload to the frontend.
"""

import os
import pandas as pd
from supabase import create_client, Client
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import generate_report

app = FastAPI()

# Allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set your Supabase credentials here (or in a .env file)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "your_supabase_url_here")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your_supabase_anon_key_here")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/api/dashboard-data")
def get_dashboard_data():
    # 1. Fetch live queue logs from Supabase
    response = supabase.table('queue_log').select("*").execute()
    
    if not response.data:
        return {"error": "No data found in the database."}
        
    df = pd.DataFrame(response.data)
    
    # 2. Ensure timestamps are in standard datetime format
    timestamp_columns = ['kiosk_time', 'reg_start', 'reg_end', 'consult_start', 'consult_end']
    for col in timestamp_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col])
            
    if 'visit_date' in df.columns:
        df['visit_date'] = pd.to_datetime(df['visit_date'])

    # 3. Process the data using the analytics engine (c_consultation=1 for single room)
    report = generate_report(df, c_consultation=1)
    
    return report