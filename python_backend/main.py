"""
main.py
FastAPI Backend for Heart Check PHC
Connects to Supabase and serves the analytics payload to the frontend.
"""

import os
import time
import traceback
from datetime import date, datetime, timedelta
import pandas as pd
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from analytics.report import generate_report, convert_to_native
from analytics.preprocessing import preprocess_queue_data
from analytics.descriptive import monthly_breakdown, hourly_pattern, bottleneck_report

import calendar
from fastapi.responses import StreamingResponse
from analytics.export import build_phc_workbook, _to_manila

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "..", ".env.local")
load_dotenv(env_path)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Maps the frontend's range selector to a day count.
# "all" is handled separately below (skips filtering entirely).
RANGE_DAYS = {
    "90d":  90,
    "180d": 180,
    "365d": 365,
}
DEFAULT_RANGE = "90d"

# Shared client across all Supabase REST calls — avoids paying a fresh
# TCP/TLS handshake on every paginated page. Previously fetch_supabase_table
# opened a brand-new httpx.Client per 1000-row page, which meant ~26
# separate handshakes just to pull the full patients table.
_http_client = httpx.Client(timeout=30.0)

# Simple in-memory TTL cache for the per-year monthly breakdown and the
# available-years list. Historical years don't change once imported, so
# this mostly just avoids recomputing the same year repeatedly across
# page loads within the cache window. Not thread-safe / not persisted —
# fine for a single-process dev/thesis deployment.
CACHE_TTL_SECONDS = 300
_monthly_cache: dict[int, tuple[float, list[dict]]] = {}
_years_cache: tuple[float, list[int]] | None = None
_export_dates_cache: tuple[float, dict] | None = None
_daily_drilldown_cache: dict[str, tuple[float, dict]] = {}


def _supabase_headers() -> dict:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL/key are not configured.")
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }


def fetch_supabase_table(
    table_name: str,
    select: str = "*",
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL/key are not configured.")

    date_filter = ""
    if start_date:
        date_filter += f"&created_at=gte.{start_date}"
    if end_date:
        date_filter += f"&created_at=lt.{end_date}"

    all_data = []
    page = 0
    page_size = 1000

    while True:
        start = page * page_size
        end = start + page_size - 1

        url = (
            f"{SUPABASE_URL}/rest/v1/{table_name}"
            f"?select={select}{date_filter}&order=created_at.asc"
        )

        response = _http_client.get(
            url,
            headers={**_supabase_headers(), "Range": f"{start}-{end}"},
        )

        if response.status_code == 416:
            break

        response.raise_for_status()
        data = response.json()

        if not data:
            break

        all_data.extend(data)

        if len(data) < page_size:
            break

        page += 1

    return all_data


def fetch_supabase_edge(
    table_name: str,
    column: str,
    ascending: bool,
) -> dict | None:
    """
    Fetches a single row — either the earliest or latest by `column` —
    without pulling the rest of the table. Used to derive the available
    year range cheaply (2 tiny requests) instead of scanning all rows.
    """
    direction = "asc" if ascending else "desc"
    url = (
        f"{SUPABASE_URL}/rest/v1/{table_name}"
        f"?select={column}&order={column}.{direction}&limit=1"
    )
    response = _http_client.get(url, headers=_supabase_headers())
    response.raise_for_status()
    data = response.json()
    return data[0] if data else None


def safe_to_datetime(series: pd.Series) -> pd.Series:
    series = pd.to_datetime(series, errors="coerce")
    if series.dt.tz is None:
        return series.dt.tz_localize('UTC')
    return series.dt.tz_convert('UTC')


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if "id" in df.columns and "patient_id" not in df.columns:
        df["patient_id"] = df["id"]
        df = df.drop(columns=["id"])
    elif "patientNum" in df.columns and "patient_id" not in df.columns:
        df = df.rename(columns={"patientNum": "patient_id"})

    if "kiosk_time" not in df.columns and "created_at" in df.columns:
        df["kiosk_time"] = df["created_at"]
        df = df.drop(columns=["created_at"])

    for col in ["kiosk_time", "reg_start", "reg_end", "consult_start", "consult_end",
                "carryout_start", "carryout_end", "updated_at"]:
        if col in df.columns:
            df[col] = safe_to_datetime(df[col])

    if "visit_date" not in df.columns and "kiosk_time" in df.columns:
        df["visit_date"] = df["kiosk_time"].dt.date

    return df


def resolve_date_range(range_param: str) -> tuple[str | None, str | None]:
    """
    Converts the frontend's `range` selector into concrete start/end
    ISO date strings used to filter the Supabase query.
    "all" returns (None, None), which skips filtering entirely.
    """
    if range_param == "all":
        return None, None

    days = RANGE_DAYS.get(range_param, RANGE_DAYS[DEFAULT_RANGE])
    end_exclusive = date.today() + timedelta(days=1)  # include all of today
    start = date.today() - timedelta(days=days)
    return start.isoformat(), end_exclusive.isoformat()


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Analytics backend is running"}


@app.get("/api/dashboard-data")
def get_dashboard_data(range: str = DEFAULT_RANGE):
    start_date, end_date = resolve_date_range(range)

    try:
        data = fetch_supabase_table(
            "patients",
            select=(
                "id,created_at,patientNum,service,status,"
                "reg_start,reg_end,consult_start,consult_end,"
                "carryout_start,carryout_end,cubicleNum,is_historical"
            ),
            start_date=start_date,
            end_date=end_date,
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
    except Exception:
        print("=" * 60)
        print("ANALYTICS REPORT ERROR - FULL TRACEBACK:")
        traceback.print_exc()
        print("=" * 60)
        fallback = get_empty_data()
        fallback["bottleneck_analysis"]["system_status"] = "Error"
        fallback["_debug_error"] = True  # remove before thesis defense / production
        return fallback


@app.get("/api/daily-drilldown")
def get_daily_drilldown(date_param: str = Query(..., alias="date")):
    """
    Returns granular hourly distribution, bottleneck breakdown,
    stage dwell times, and operational metrics for a specific calendar date (Asia/Manila).
    """
    cleaned_date = date_param.strip()
    try:
        target_date = datetime.strptime(cleaned_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Expected YYYY-MM-DD.",
        )

    now = time.time()
    cached = _daily_drilldown_cache.get(cleaned_date)
    if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
        return cached[1]

    # Query with 1-day padding to safely cover UTC-to-Manila (UTC+8) offset
    start_date = (target_date - timedelta(days=1)).isoformat()
    end_date = (target_date + timedelta(days=2)).isoformat()

    try:
        data = fetch_supabase_table(
            "patients",
            select=(
                "id,created_at,patientNum,service,status,"
                "reg_start,reg_end,consult_start,consult_end,"
                "carryout_start,carryout_end,cubicleNum,is_historical"
            ),
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as e:
        print(f"daily-drilldown fetch error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch patient data from database.")

    empty_res = {
        "date": cleaned_date,
        "total_patients": 0,
        "hourly_pattern": [],
        "bottleneck_analysis": {
            "stages": [],
            "bottleneck_stage": "None",
            "system_status": "No Data",
            "system_reason": f"No patient records recorded on {cleaned_date}.",
        },
        "summary": {
            "total_patients": 0,
            "avg_total_time": None,
            "avg_wait_registration": None,
            "avg_wait_consultation": None,
            "system_status": "No Data",
            "bottleneck_stage": "None",
            "system_reason": f"No patient records recorded on {cleaned_date}.",
            "peak_hour": None,
        },
    }

    if not data:
        return empty_res

    df = pd.DataFrame(data)
    df = normalize_dataframe(df)

    date_col = "kiosk_time" if "kiosk_time" in df.columns else "created_at"
    if date_col in df.columns:
        df["_manila_date"] = df[date_col].apply(
            lambda t: _to_manila(t).date() if pd.notna(t) else None
        )
        df = df[df["_manila_date"] == target_date]
    else:
        return empty_res

    if df.empty:
        return empty_res

    df_clean = preprocess_queue_data(df)
    hourly = hourly_pattern(df_clean).to_dict(orient="records")
    bottlenecks = bottleneck_report(df_clean)

    avg_tot = (
        round(float(df_clean["total_time"].dropna().mean()), 2)
        if "total_time" in df_clean.columns and not df_clean["total_time"].dropna().empty
        else None
    )
    avg_reg = (
        round(float(df_clean["wait_registration"].dropna().mean()), 2)
        if "wait_registration" in df_clean.columns and not df_clean["wait_registration"].dropna().empty
        else None
    )
    avg_con = (
        round(float(df_clean["wait_consultation"].dropna().mean()), 2)
        if "wait_consultation" in df_clean.columns and not df_clean["wait_consultation"].dropna().empty
        else None
    )

    peak_hour = None
    if hourly:
        sorted_hours = sorted(hourly, key=lambda x: x.get("avg_patients", 0), reverse=True)
        if sorted_hours and sorted_hours[0].get("avg_patients", 0) > 0:
            peak_hour = sorted_hours[0].get("time_label")

    payload = {
        "date": cleaned_date,
        "total_patients": len(df_clean),
        "hourly_pattern": hourly,
        "bottleneck_analysis": bottlenecks,
        "summary": {
            "total_patients": len(df_clean),
            "avg_total_time": avg_tot,
            "avg_wait_registration": avg_reg,
            "avg_wait_consultation": avg_con,
            "system_status": bottlenecks.get("system_status", "Normal"),
            "bottleneck_stage": bottlenecks.get("bottleneck_stage", "None"),
            "system_reason": bottlenecks.get("system_reason", ""),
            "peak_hour": peak_hour,
        },
    }

    sanitized = convert_to_native(payload)
    _daily_drilldown_cache[cleaned_date] = (now, sanitized)
    return sanitized


@app.get("/api/available-years")
def get_available_years():
    """
    Returns the list of years present in the patients table, derived from
    just the earliest and latest created_at rows (2 lightweight requests)
    rather than pulling and scanning the full table.

    Cached for CACHE_TTL_SECONDS since the year range only grows when new
    historical data is imported.
    """
    global _years_cache

    now = time.time()
    if _years_cache and (now - _years_cache[0]) < CACHE_TTL_SECONDS:
        return {"years": _years_cache[1]}

    try:
        earliest = fetch_supabase_edge("patients", "created_at", ascending=True)
        latest = fetch_supabase_edge("patients", "created_at", ascending=False)
    except Exception as e:
        print(f"available-years fetch error: {e}")
        return {"years": []}

    if not earliest or not latest:
        return {"years": []}

    start_year = pd.to_datetime(earliest["created_at"]).year
    end_year = pd.to_datetime(latest["created_at"]).year

    years = list(range(start_year, end_year + 1))
    _years_cache = (now, years)
    return {"years": years}


@app.get("/api/available-export-dates")
def get_available_export_dates(refresh: bool = False):
    """
    Returns the distinct years and calendar months that contain usable patient
    queue records (reg_start) for PHC Time and Motion Analysis Excel export.

    Cached for CACHE_TTL_SECONDS to avoid repeated table scans.
    Pass ?refresh=true to invalidate and recompute the cache.
    """
    global _export_dates_cache

    now = time.time()
    if _export_dates_cache and not refresh and (now - _export_dates_cache[0]) < CACHE_TTL_SECONDS:
        return _export_dates_cache[1]

    try:
        data = fetch_supabase_table(
            "patients",
            select="reg_start,created_at",
        )
    except Exception as e:
        print(f"available-export-dates fetch error: {e}")
        return {"years": [], "dates": {}}

    if not data:
        return {"years": [], "dates": {}}

    dates_map: dict[int, set[int]] = {}
    available_days_set: set[str] = set()

    for row in data:
        # PHC Time and Motion Analysis export sheets require reg_start
        ts = row.get("reg_start")
        if not ts:
            continue
        try:
            m_dt = _to_manila(ts)
            y = m_dt.year
            m = m_dt.month
            if y not in dates_map:
                dates_map[y] = set()
            dates_map[y].add(m)
            available_days_set.add(m_dt.date().isoformat())
        except Exception:
            continue

    sorted_years = sorted(list(dates_map.keys()), reverse=True)
    formatted_dates = {
        str(y): sorted(list(months))
        for y, months in dates_map.items()
    }
    sorted_days = sorted(list(available_days_set), reverse=True)

    result = {
        "years": sorted_years,
        "dates": formatted_dates,
        "days": sorted_days,
    }

    _export_dates_cache = (now, result)
    return result


@app.get("/api/monthly-breakdown/{year}")
def get_monthly_breakdown_for_year(year: int, refresh: bool = False):
    """
    Returns the month-by-month bottleneck + avg total time breakdown for
    a single year only — fetches just that year's rows instead of the
    full historical table, and caches the computed result for
    CACHE_TTL_SECONDS. Pass ?refresh=true to bypass the cache (e.g. right
    after a data re-import).
    """
    now = time.time()
    cached = _monthly_cache.get(year)
    if cached and not refresh and (now - cached[0]) < CACHE_TTL_SECONDS:
        return {"year": year, "months": cached[1]}

    start = f"{year}-01-01"
    end = f"{year + 1}-01-01"

    try:
        data = fetch_supabase_table(
            "patients",
            select=(
                "id,created_at,patientNum,service,status,"
                "reg_start,reg_end,consult_start,consult_end,"
                "carryout_start,carryout_end,cubicleNum,is_historical"
            ),
            start_date=start,
            end_date=end,
        )
    except Exception as e:
        print(f"monthly-breakdown fetch error ({year}): {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch data for that year.")

    if not data:
        _monthly_cache[year] = (now, [])
        return {"year": year, "months": []}

    df = pd.DataFrame(data)
    df = normalize_dataframe(df)

    if df.empty:
        _monthly_cache[year] = (now, [])
        return {"year": year, "months": []}

    try:
        df_clean = preprocess_queue_data(df)
        breakdown = monthly_breakdown(df_clean)
        months = breakdown.get(str(year), [])
    except Exception:
        print("=" * 60)
        print(f"MONTHLY BREAKDOWN ERROR ({year}) - FULL TRACEBACK:")
        traceback.print_exc()
        print("=" * 60)
        raise HTTPException(status_code=500, detail="Failed to compute breakdown for that year.")

    _monthly_cache[year] = (now, months)
    return {"year": year, "months": months}


def get_empty_data():
    """Return empty state data when database has no patient records"""
    return {
        "daily_summary": [],
        "hourly_pattern": [],
        "service_distribution": [],
        "bottleneck_analysis": {
            "stages": [],
            "primary_bottleneck": None,
            "system_status": "No Data",
            "bottleneck_stage": None,
            "avg_wait_registration_min": 0,
            "avg_wait_consultation_min": 0,
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
            "expected_utilization": 0,
            "adult_clinic": {
                "recommended_doctors": 1,
                "max_cubicles": 5,
                "capacity_sufficient": True,
                "expected_utilization": 0,
                "warning": None,
            },
            "pedia_clinic": {
                "recommended_doctors": 1,
                "max_cubicles": 5,
                "capacity_sufficient": True,
                "expected_utilization": 0,
                "warning": None,
            }
        }
    }
    
@app.get("/api/export-excel")
def export_excel(
    range: str | None = None,
    month: str | None = None,
    date_param: str | None = Query(None, alias="date"),
    service: str | None = None,
):
    """
    Raw patient rows in PHC's own Time and Motion Analysis format —
    one sheet per day, matching the source .xls structure.

    Supports date filtering by:
    1. date="YYYY-MM-DD" (e.g. "2025-11-04") to export a single specific day.
    2. month="YYYY-MM" (e.g. "2025-11") to export all days in that specific month.
    3. range="90d" | "180d" | "365d" | "all" for rolling range or all-dates exports.
    """
    target_year: int | None = None
    target_month: int | None = None
    specific_date: date | None = None

    if date_param:
        try:
            specific_date = datetime.strptime(date_param.strip(), "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    if not specific_date and month:
        parts = month.strip().split("-")
        try:
            if len(parts) == 2:
                target_year = int(parts[0])
                target_month = int(parts[1])
            elif len(parts) == 1:
                target_month = int(parts[0])
                target_year = date.today().year
            else:
                raise ValueError("Invalid format")
            if not (1 <= target_month <= 12):
                raise ValueError("Invalid month value")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM.")

    if specific_date:
        start_date = (specific_date - timedelta(days=1)).isoformat()
        end_date = (specific_date + timedelta(days=2)).isoformat()
    elif target_year and target_month:
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        # Generous date boundaries to ensure UTC / Manila (+8) boundary cases are captured
        start_date = (date(target_year, target_month, 1) - timedelta(days=1)).isoformat()
        end_date = (date(target_year, target_month, days_in_month) + timedelta(days=2)).isoformat()
    else:
        start_date, end_date = resolve_date_range(range or DEFAULT_RANGE)

    try:
        data = fetch_supabase_table(
            "patients",
            select=(
                "id,created_at,patientNum,service,status,"
                "reg_start,reg_end,consult_start,consult_end,"
                "carryout_start,carryout_end,cubicleNum,is_historical"
            ),
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as e:
        print(f"export-excel fetch error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch patient data.")

    if not data:
        if specific_date:
            date_label = specific_date.strftime("%B %d, %Y")
            raise HTTPException(status_code=404, detail=f"No patient records found for {date_label}.")
        if target_year and target_month:
            month_label = f"{calendar.month_name[target_month]} {target_year}"
            raise HTTPException(status_code=404, detail=f"No patient records found for {month_label}.")
        raise HTTPException(status_code=404, detail="No patient records found for this range.")

    df = pd.DataFrame(data)
    df = normalize_dataframe(df)

    if service and service.strip().lower() not in ("all", ""):
        df = df[df["service"] == service]

    if specific_date:
        df["_manila_date"] = df["reg_start"].apply(
            lambda t: _to_manila(t).date() if pd.notna(t) else None
        )
        df = df[df["_manila_date"].notna()]
        df = df[df["_manila_date"] == specific_date]
    elif target_year and target_month:
        df["_manila_date"] = df["reg_start"].apply(
            lambda t: _to_manila(t).date() if pd.notna(t) else None
        )
        df = df[df["_manila_date"].notna()]
        df = df[df["_manila_date"].apply(lambda d: d.year == target_year and d.month == target_month)]

    if df.empty:
        if specific_date:
            date_label = specific_date.strftime("%B %d, %Y")
            raise HTTPException(status_code=404, detail=f"No patient records found for {date_label}.")
        if target_year and target_month:
            month_label = f"{calendar.month_name[target_month]} {target_year}"
            raise HTTPException(status_code=404, detail=f"No patient records found for {month_label}.")
        raise HTTPException(status_code=404, detail="No patient records found for this range.")

    clinic_label = service if (service and service.strip().lower() not in ("all", "")) else "OPD"
    try:
        buffer = build_phc_workbook(df, clinic_label=clinic_label)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        print("=" * 60)
        print("EXPORT-EXCEL BUILD ERROR - FULL TRACEBACK:")
        traceback.print_exc()
        print("=" * 60)
        raise HTTPException(status_code=500, detail="Failed to build the export.")

    if specific_date:
        filename = f"phc_time_motion_export_{specific_date.isoformat()}.xlsx"
    elif target_year and target_month:
        filename = f"phc_time_motion_export_{target_year}_{target_month:02d}.xlsx"
    elif range == "all":
        filename = "phc_time_motion_export_all_dates.xlsx"
    else:
        filename = f"phc_time_motion_export_{range or 'custom'}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )