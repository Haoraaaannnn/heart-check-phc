"""
main.py
FastAPI Backend for Heart Check PHC
Connects to Supabase and serves the analytics payload to the frontend.
"""

import os
import json
import pandas as pd
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import generate_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)
app = FastAPI()

# Allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set your Supabase credentials here (or in a .env file)
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")


def fetch_supabase_table(table_name: str, select: str = "*") -> list[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL/key are not configured.")

    # Fetch all records with pagination (1000 at a time)
    all_data = []
    page = 0
    page_size = 1000
    
    while True:
        start = page * page_size
        end = start + page_size - 1
        
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?select={select}&order=created_at.asc"
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                url,
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Range": f"{start}-{end}"
                },
            )
            
            if response.status_code == 416:  # Range Not Satisfiable - we've fetched everything
                break
                
            response.raise_for_status()
            data = response.json()
            
            if not data:  # Empty page
                break
                
            all_data.extend(data)
            
            if len(data) < page_size:  # Last partial page
                break
                
            page += 1
    
    return all_data


def safe_to_datetime(series: pd.Series) -> pd.Series:
    """Convert values to UTC-aware datetime while handling both naive and timezone-aware inputs."""
    series = pd.to_datetime(series, errors="coerce")
    if series.dt.tz is None:
        return series.dt.tz_localize('UTC')
    return series.dt.tz_convert('UTC')


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if "patientNum" in df.columns and "patient_id" not in df.columns:
        df = df.rename(columns={"patientNum": "patient_id"})
    elif "id" in df.columns and "patient_id" not in df.columns:
        df["patient_id"] = df["id"]
        df = df.drop(columns=["id"])

    if "kiosk_time" not in df.columns and "created_at" in df.columns:
        df["kiosk_time"] = df["created_at"]
        df = df.drop(columns=["created_at"])

    for col in ["kiosk_time", "reg_start", "reg_end", "consult_start", "consult_end", "updated_at"]:
        if col in df.columns:
            df[col] = safe_to_datetime(df[col])

    if "visit_date" not in df.columns and "kiosk_time" in df.columns:
        df["visit_date"] = df["kiosk_time"].dt.date

    return df

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Analytics backend is running"}

@app.get("/api/dashboard-data")
def get_dashboard_data():
    # Fetch directly from patients table - this is where kiosk inserts patient records
    # Only select columns that actually exist in the database
    try:
        data = fetch_supabase_table(
            "patients",
            select="id,created_at,patientNum,service,status,reg_start,reg_end,consult_start,consult_end,cubicleNum"
        )
    except Exception as patients_error:
        data = []
        print(f"patients fetch error: {patients_error}")

    if not data:
        return get_empty_data()

    df = pd.DataFrame(data)
    df = normalize_dataframe(df)

    if df.empty:
        return get_empty_data()

    try:
        report = generate_report(df)
        return report
    except Exception as report_error:
        print(f"analytics report error: {report_error}")
        return get_empty_data()

def get_empty_data():
    """Return empty state data when database has no patient records"""
    return {
        "daily_summary": [],
        "hourly_pattern": [],
        "bottleneck_analysis": {
            "bottleneck_stage": None,
            "avg_wait_registration_min": 0,
            "avg_wait_consultation_min": 0,
            "system_status": "No Data"
        },
        "queue_theory": {
            "arrival_rate_lambda": 0,
            "service_rate_mu": 0,
            "current_metrics": {
                "servers_c": 0,
                "utilization_rho": 0,
                "probability_of_wait": 0,
                "expected_wait_queue_min": 0
            }
        },
        "computational_forecasting": {
            "next_day_forecast": 0,
            "best_algorithm": "N/A",
            "algorithmic_conclusion": "Insufficient data for forecast.",
            "evaluation_metrics": {}
        },
        "lr_chart_data": {
            "labels": [],
            "actual": [],
            "lr_line": [],
            "forecast_date": "",
            "forecast_value": 0,
            "slope": 0,
            "trend": "stable",
            "r2": 0
        },
        "arima_chart_data": {
            "labels": [],
            "actual": [],
            "fitted": [],
            "forecast_date": "",
            "forecast_value": 0,
            "aic": None,
            "status": "No data"
        },
        "decision_support": {
            "forecasted_patients": 0,
            "recommended_doctors": 1,
            "expected_utilization": 0
        }
    }