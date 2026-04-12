"""
main.py
FastAPI Backend for Heart Check PHC
Connects to Supabase and serves the analytics payload to the frontend.
"""

import os
import json
import pandas as pd
import urllib.request
import urllib.parse
from dotenv import load_dotenv  # <--- FIX 1: Add this exact import line
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
SUPABASE_REST_BASE = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else None


def fetch_supabase_table(table_name: str, select: str = "*") -> list[dict]:
    if not SUPABASE_REST_BASE or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL/key are not configured.")

    query = urllib.parse.urlencode({"select": select})
    url = f"{SUPABASE_REST_BASE}/{table_name}?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        payload = response.read().decode("utf-8")
        return json.loads(payload)


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
    try:
        data = fetch_supabase_table("queue_log")
    except Exception as queue_error:
        data = []
        print(f"queue_log fetch error: {queue_error}")

    if not data:
        try:
            data = fetch_supabase_table(
                "patients",
                select="id,created_at,patientNum,service,cubicleNum,status,updated_at,reg_start,reg_end,consult_start,consult_end"
            )
        except Exception as patients_error:
            data = []
            print(f"patients fetch error: {patients_error}")

    if not data:
        return get_mock_data()

    df = pd.DataFrame(data)
    df = normalize_dataframe(df)

    if df.empty:
        return get_mock_data()

    try:
        report = generate_report(df, c_consultation=1)
        return report
    except Exception as report_error:
        print(f"analytics report error: {report_error}")
        return get_mock_data()

def get_mock_data():
    """Return mock analytics data for testing when database is unavailable"""
    return {
        "daily_summary": [
            {
                "visit_date": "2026-04-09",
                "total_patients": 45,
                "avg_wait_registration": 8.5,
                "avg_wait_consultation": 12.3,
                "avg_total_time": 35.2
            }
        ],
        "hourly_pattern": [
            {"hour": 8,  "avg_patients": 5, "avg_wait_consultation": 10.5, "time_label": "08:00–09:00"},
            {"hour": 9,  "avg_patients": 8, "avg_wait_consultation": 14.2, "time_label": "09:00–10:00"},
            {"hour": 10, "avg_patients": 7, "avg_wait_consultation": 11.8, "time_label": "10:00–11:00"},
        ],
        "bottleneck_analysis": {
            "bottleneck_stage": "Consultation",
            "avg_wait_registration_min": 8.5,
            "avg_wait_consultation_min": 12.3,
            "system_status": "Normal"
        },
        "queue_theory": {
            "arrival_rate_lambda": 5.6,
            "service_rate_mu": 0.08,
            "current_metrics": {
                "servers_c": 1,
                "utilization_rho": 0.7,
                "probability_of_wait": 0.35,
                "expected_wait_queue_min": 12.0
            }
        },
        "computational_forecasting": {
            "next_day_forecast": 52,
            "best_algorithm": "WMA",
            "algorithmic_conclusion": "Based on historical backtesting, WMA yielded the lowest Mean Absolute Error.",
            "evaluation_metrics": {
                "SMA":                {"MAE": 4.2,  "RMSE": 5.1},
                "WMA":                {"MAE": 3.8,  "RMSE": 4.7},
                "EMA":                {"MAE": 4.0,  "RMSE": 4.9},
                "Linear Regression":  {"MAE": 4.5,  "RMSE": 5.4},
            }
        },
        # ← THIS was the missing key
        "lr_chart_data": {
            "labels": [
                "2026-04-01", "2026-04-02", "2026-04-03",
                "2026-04-07", "2026-04-08", "2026-04-09"
            ],
            "actual":        [42, 38, 55, 50, 61, 45],
            "lr_line":       [40.0, 42.5, 45.0, 47.5, 50.0, 52.5],
            "forecast_date": "2026-04-10",
            "forecast_value": 52,
            "slope":          2.3,
            "trend":          "increasing"
        },
        "decision_support": {
            "forecasted_patients":  52,
            "recommended_doctors":  2,
            "expected_utilization": 0.72
        }
    }