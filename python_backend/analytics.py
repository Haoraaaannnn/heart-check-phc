"""
analytics.py
Heart Check PHC — Queue Analytics & Forecasting Module
Philippine Heart Center OPD

Consultation setup:
  - Adult Clinic: 4 rooms × 5 cubicles = 20 cubicles max
  - Pedia Clinic: 4 rooms × 5 cubicles = 20 cubicles max
  - Each active cubicle = independent M/M/1 queue
  - M/M/c used only as theoretical benchmark
"""

import math
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.linear_model import LinearRegression

# ── Constants reflecting actual PHC setup ────────────────────
MAX_ADULT_CUBICLES = 20   # 4 rooms × 5 cubicles
MAX_PEDIA_CUBICLES = 20   # 4 rooms × 5 cubicles

# Services that route to specialized single-station queues
SPECIALIZED_SERVICES = [
    'warfarin', 'benzathine', 'ecg',
    'opd_card', 'opd_screening',
    'refill_prescription', 'opd_reschedule'
]

# ══════════════════════════════════════════════════════════════
# 0. DATETIME UTILS
# ══════════════════════════════════════════════════════════════

def safe_to_datetime(series: pd.Series) -> pd.Series:
    series = pd.to_datetime(series, errors='coerce')
    if series.dt.tz is None:
        return series.dt.tz_localize('UTC')
    return series.dt.tz_convert('UTC')

# ══════════════════════════════════════════════════════════════
# 1. DATA PREPROCESSING
# ══════════════════════════════════════════════════════════════

def preprocess_queue_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adapts Supabase schema to analytics-ready columns.
    Handles ongoing visits (NULL timestamps) gracefully.
    """
    rename_map = {}
    if 'id' in df.columns and 'patient_id' not in df.columns:
        rename_map['id'] = 'patient_id'
    if 'created_at' in df.columns and 'kiosk_time' not in df.columns:
        rename_map['created_at'] = 'kiosk_time'
    if 'service' in df.columns and 'purpose' not in df.columns:
        rename_map['service'] = 'purpose'
    if 'patientNum' in df.columns and 'queue_number' not in df.columns:
        rename_map['patientNum'] = 'queue_number'
    if rename_map:
        df = df.rename(columns=rename_map)

    # Parse timestamps
    for col in ['kiosk_time', 'reg_start', 'reg_end', 'consult_start', 'consult_end']:
        if col in df.columns:
            df[col] = safe_to_datetime(df[col])

    # Fill NULL timestamps with current time for live patients
    now = pd.Timestamp.now(tz='UTC')
    for col in ['reg_start', 'reg_end', 'consult_start', 'consult_end']:
        if col in df.columns:
            df[col] = df[col].fillna(now)

    # Enforce chronological order (prevents negative durations)
    df['reg_start']     = df[['kiosk_time', 'reg_start']].max(axis=1)
    df['reg_end']       = df[['reg_start', 'reg_end']].max(axis=1)
    df['consult_start'] = df[['reg_end', 'consult_start']].max(axis=1)
    df['consult_end']   = df[['consult_start', 'consult_end']].max(axis=1)

    # Derived time columns (in minutes)
    df['wait_registration']    = (df['reg_start']     - df['kiosk_time']).dt.total_seconds() / 60
    df['service_registration'] = (df['reg_end']       - df['reg_start']).dt.total_seconds() / 60
    df['wait_consultation']    = (df['consult_start'] - df['reg_end']).dt.total_seconds() / 60
    df['service_consultation'] = (df['consult_end']   - df['consult_start']).dt.total_seconds() / 60
    df['total_time']           = (df['consult_end']   - df['kiosk_time']).dt.total_seconds() / 60

    df['visit_date']  = df['kiosk_time'].dt.date
    df['hour']        = df['kiosk_time'].dt.hour
    df['day_of_week'] = df['kiosk_time'].dt.day_name()

    # Normalize purpose values to lowercase for consistent filtering
    if 'purpose' in df.columns:
        df['purpose'] = df['purpose'].str.lower().str.strip()

    # Classify clinic type based on purpose or cubicleNum prefix
    # Adjust this logic to match how your system distinguishes adult vs pedia
    if 'cubicleNum' in df.columns:
        df['clinic_type'] = df['cubicleNum'].apply(
            lambda x: 'pedia' if str(x).lower().startswith('p') else 'adult'
        )
    else:
        df['clinic_type'] = 'adult'  # default if not yet assigned

    return df

# ══════════════════════════════════════════════════════════════
# 2. DESCRIPTIVE ANALYTICS & PATTERNS
# ══════════════════════════════════════════════════════════════

def daily_summary(df: pd.DataFrame) -> pd.DataFrame:
    summary = df.groupby('visit_date').agg(
        total_patients        = ('patient_id', 'count'),
        avg_wait_registration = ('wait_registration', 'mean'),
        avg_wait_consultation = ('wait_consultation', 'mean'),
        avg_total_time        = ('total_time', 'mean'),
    ).reset_index()
    return summary.round(2)

def hourly_pattern(df: pd.DataFrame) -> pd.DataFrame:
    hourly = df.groupby('hour').agg(
        avg_patients          = ('patient_id', 'count'),
        avg_wait_consultation = ('wait_consultation', 'mean'),
    ).reset_index()
    hourly['time_label'] = hourly['hour'].apply(
        lambda h: f"{h:02d}:00–{h+1:02d}:00"
    )
    return hourly.round(2)

def bottleneck_report(df: pd.DataFrame) -> dict:
    """
    Identifies which stage has the highest average wait time.
    Also checks per-cubicle for load imbalance in consultation.
    """
    avg_wait_reg     = df['wait_registration'].mean()
    avg_wait_consult = df['wait_consultation'].mean()
    bottleneck       = "Registration" if avg_wait_reg > avg_wait_consult else "Consultation"

    return {
        "bottleneck_stage"          : bottleneck,
        "avg_wait_registration_min" : round(avg_wait_reg, 2),
        "avg_wait_consultation_min" : round(avg_wait_consult, 2),
        "system_status"             : (
            "Overwhelmed" if max(avg_wait_reg, avg_wait_consult) > 30
            else "Normal"
        )
    }

# ══════════════════════════════════════════════════════════════
# 3. CORE QUEUE METRIC FUNCTIONS
# ══════════════════════════════════════════════════════════════

def mm1_metrics(lam: float, mu: float) -> dict:
    """
    M/M/1 queue metrics for a single-server station.
    Used for: Registration, each consultation cubicle,
              and all specialized services (warfarin, ECG, etc.)
    """
    if lam <= 0 or mu <= 0:
        return {"error": "Invalid parameters"}
    rho = lam / mu
    if rho >= 1:
        return {
            "status"         : "Unstable",
            "utilization_rho": round(rho, 4),
            "note"           : "Arrival rate exceeds service rate. Queue grows without bound."
        }
    Lq = rho**2 / (1 - rho)
    Wq = Lq / lam
    W  = 1 / (mu - lam)
    L  = lam * W

    return {
        "model"                  : "M/M/1",
        "utilization_rho"        : round(rho, 4),
        "avg_in_queue_Lq"        : round(Lq, 4),
        "avg_in_system_L"        : round(L, 4),
        "avg_wait_queue_Wq_min"  : round(Wq, 4),
        "avg_time_system_W_min"  : round(W, 4),
    }

def mmc_metrics(lam: float, mu: float, c: int) -> dict:
    """
    M/M/c queue metrics using Erlang C formula.
    Used ONLY as a theoretical benchmark for consultation
    (assumes perfect load sharing — never true at PHC
     since patients are pre-assigned to specific doctors).
    """
    if lam <= 0 or mu <= 0 or c < 1:
        return {"error": "Invalid parameters"}
    rho = lam / (c * mu)
    if rho >= 1:
        return {
            "status"         : "Unstable",
            "utilization_rho": round(rho, 4),
        }

    a         = lam / mu
    sum_terms = sum(a**n / math.factorial(n) for n in range(c))
    last_term = (a**c / math.factorial(c)) * (c / (c - a))
    Pq        = last_term / (sum_terms + last_term)
    Lq        = Pq * rho / (1 - rho)
    Wq        = Lq / lam
    W         = Wq + 1 / mu
    L         = lam * W

    return {
        "model"                  : f"M/M/{c} (benchmark)",
        "servers_c"              : c,
        "utilization_rho"        : round(rho, 4),
        "probability_of_wait"    : round(Pq, 4),
        "avg_in_queue_Lq"        : round(Lq, 4),
        "avg_in_system_L"        : round(L, 4),
        "avg_wait_queue_Wq_min"  : round(Wq, 4),
        "avg_time_system_W_min"  : round(W, 4),
        "note"                   : "Theoretical minimum — assumes perfect load balancing across all cubicles."
    }

# ══════════════════════════════════════════════════════════════
# 4. REGISTRATION METRICS  (M/M/1)
# ══════════════════════════════════════════════════════════════

def compute_registration_metrics(df: pd.DataFrame) -> dict:
    """
    All patients pass through Registration — M/M/1 model.
    λ = from all kiosk arrival times
    μ = from registration service durations
    """
    # Arrival rate from all patients
    arrivals      = df['kiosk_time'].sort_values()
    inter         = arrivals.diff().dt.total_seconds().dropna() / 60
    inter         = inter[inter > 0]
    lam           = round(1 / inter.mean(), 4) if not inter.empty else 0.0

    # Service rate from completed registrations
    svc           = df['service_registration'].dropna()
    svc           = svc[svc > 0]
    mu_reg        = round(1 / svc.mean(), 4) if not svc.empty else 0.0

    return {
        "arrival_rate_lambda" : lam,
        "service_rate_mu"     : mu_reg,
        "metrics"             : mm1_metrics(lam, mu_reg)
    }

# ══════════════════════════════════════════════════════════════
# 5. PER-CUBICLE CONSULTATION METRICS  (M/M/1 per cubicle)
# ══════════════════════════════════════════════════════════════

def compute_per_cubicle_metrics(df: pd.DataFrame, clinic: str = 'adult') -> dict:
    """
    Each cubicle is an independent M/M/1 queue because
    patients are pre-assigned to a specific doctor.

    clinic: 'adult' or 'pedia'

    Returns per-cubicle metrics + M/M/c benchmark.
    """
    # Filter by clinic type and consultation purpose
    consult_df = df[
        (df['purpose'] == 'consultation') &
        (df['clinic_type'] == clinic)
    ].copy()

    if consult_df.empty or 'cubicleNum' not in consult_df.columns:
        return {"error": f"No {clinic} consultation data available."}

    cubicles        = consult_df['cubicleNum'].dropna().unique()
    per_cubicle     = {}
    all_lam         = []
    all_mu          = []

    for cubicle in sorted(cubicles, key=str):
        subset = consult_df[consult_df['cubicleNum'] == cubicle].copy()

        if len(subset) < 3:
            # Not enough data for this cubicle
            continue

        # λ_k — arrival rate for this cubicle
        arrivals  = subset['kiosk_time'].sort_values()
        inter     = arrivals.diff().dt.total_seconds().dropna() / 60
        inter     = inter[inter > 0]
        lam_k     = round(1 / inter.mean(), 4) if not inter.empty else 0.0

        # μ_k — service rate for this cubicle's doctor
        svc       = subset['service_consultation'].dropna()
        svc       = svc[svc > 0]
        mu_k      = round(1 / svc.mean(), 4) if not svc.empty else 0.0

        metrics_k = mm1_metrics(lam_k, mu_k)

        per_cubicle[str(cubicle)] = {
            "cubicle"             : str(cubicle),
            "clinic"              : clinic,
            "patients_served"     : len(subset),
            "arrival_rate_lambda" : lam_k,
            "service_rate_mu"     : mu_k,
            "metrics"             : metrics_k,
            "overloaded"          : metrics_k.get("utilization_rho", 0) > 0.80
        }

        if lam_k > 0: all_lam.append(lam_k)
        if mu_k > 0:  all_mu.append(mu_k)

    # M/M/c benchmark — treats all active cubicles as shared pool
    c_active   = len(per_cubicle)
    lam_total  = sum(all_lam)
    mu_avg     = round(float(np.mean(all_mu)), 4) if all_mu else 0.0
    mmc_bench  = mmc_metrics(lam_total, mu_avg, c_active) if c_active > 0 else {}

    # Load imbalance check
    rho_values = [
        v['metrics'].get('utilization_rho', 0)
        for v in per_cubicle.values()
        if 'metrics' in v
    ]
    load_imbalance = (
        round(max(rho_values) - min(rho_values), 4)
        if len(rho_values) > 1 else 0.0
    )

    return {
        "clinic"                : clinic,
        "active_cubicles"       : c_active,
        "max_cubicles"          : MAX_ADULT_CUBICLES if clinic == 'adult' else MAX_PEDIA_CUBICLES,
        "per_cubicle"           : per_cubicle,
        "mmc_benchmark"         : mmc_bench,
        "load_imbalance_delta"  : load_imbalance,
        "load_balance_status"   : (
            "Imbalanced" if load_imbalance > 0.20
            else "Balanced"
        )
    }

# ══════════════════════════════════════════════════════════════
# 6. SPECIALIZED SERVICE METRICS  (M/M/1 per service)
# ══════════════════════════════════════════════════════════════

def compute_specialized_metrics(df: pd.DataFrame) -> dict:
    """
    Warfarin, Benzathine, ECG, OPD Card, OPD Screening,
    Refill Prescription, OPD Reschedule.
    Each is a single-server M/M/1 queue.
    """
    results = {}

    for service in SPECIALIZED_SERVICES:
        subset = df[df['purpose'] == service].copy()

        if len(subset) < 3:
            results[service] = {"status": "Insufficient data"}
            continue

        # λ_s
        arrivals = subset['kiosk_time'].sort_values()
        inter    = arrivals.diff().dt.total_seconds().dropna() / 60
        inter    = inter[inter > 0]
        lam_s    = round(1 / inter.mean(), 4) if not inter.empty else 0.0

        # μ_s
        svc      = subset['service_consultation'].dropna()
        svc      = svc[svc > 0]
        mu_s     = round(1 / svc.mean(), 4) if not svc.empty else 0.0

        results[service] = {
            "service"             : service,
            "patients_served"     : len(subset),
            "arrival_rate_lambda" : lam_s,
            "service_rate_mu"     : mu_s,
            "metrics"             : mm1_metrics(lam_s, mu_s)
        }

    return results

# ══════════════════════════════════════════════════════════════
# 7. TOTAL SYSTEM TIME & LITTLE'S LAW VALIDATION
# ══════════════════════════════════════════════════════════════

def compute_system_time(df: pd.DataFrame) -> dict:
    """
    W_total = mean(consult_end - kiosk_time)
    Validates against the 150-minute (2.5 hour) target from scope.
    Also checks Little's Law: L ≈ λ × W
    """
    completed = df[df['total_time'] > 0]['total_time']

    if completed.empty:
        return {"error": "No completed visits available."}

    W_total     = round(completed.mean(), 2)
    W_target    = 150.0   # 2 hours 30 minutes from scope of study

    # Arrival rate from all patients
    arrivals    = df['kiosk_time'].sort_values()
    inter       = arrivals.diff().dt.total_seconds().dropna() / 60
    inter       = inter[inter > 0]
    lam         = round(1 / inter.mean(), 4) if not inter.empty else 0.0

    # Little's Law: L = λ × W
    L_littles   = round(lam * W_total, 4)

    return {
        "avg_total_time_min"     : W_total,
        "target_min"             : W_target,
        "within_target"          : W_total <= W_target,
        "excess_min"             : round(max(0, W_total - W_target), 2),
        "littles_law_L"          : L_littles,
        "arrival_rate_lambda"    : lam,
        "note"                   : (
            f"Average patient stay is {W_total} min. "
            f"{'Within' if W_total <= W_target else 'Exceeds'} "
            f"the {W_target}-min target."
        )
    }

# ══════════════════════════════════════════════════════════════
# 8. ALGORITHMIC EVALUATION (Forecasting)
# ══════════════════════════════════════════════════════════════

def evaluate_forecasting_algorithms(
    df: pd.DataFrame,
    window_size: int = 7,
    alpha: float = 0.3
) -> dict:

    daily_counts = df.groupby('visit_date')['patient_id'].count().reset_index()
    daily_counts = daily_counts.sort_values('visit_date')
    volumes      = daily_counts['patient_id'].values

    if len(volumes) < window_size + 2:
        return {"status": "Insufficient data for algorithmic comparison."}

    actuals   = []
    sma_preds = []
    wma_preds = []
    ema_preds = []
    lr_preds  = []

    weights     = np.arange(1, window_size + 1, dtype=float)
    current_ema = np.mean(volumes[:window_size])

    for i in range(window_size, len(volumes)):
        actual      = volumes[i]
        window_data = volumes[i - window_size:i]

        sma = np.mean(window_data)
        wma = np.dot(window_data, weights) / weights.sum()
        ema = (alpha * volumes[i - 1]) + ((1 - alpha) * current_ema)
        current_ema = ema

        X_train  = np.arange(window_size).reshape(-1, 1)
        lr_model = LinearRegression().fit(X_train, window_data)
        lr       = max(0, float(lr_model.predict([[window_size]])[0]))

        actuals.append(actual)
        sma_preds.append(sma)
        wma_preds.append(wma)
        ema_preds.append(ema)
        lr_preds.append(lr)

    algorithms = {
        "SMA"               : sma_preds,
        "WMA"               : wma_preds,
        "EMA"               : ema_preds,
        "Linear Regression" : lr_preds,
    }

    results = {}
    for name, preds in algorithms.items():
        mae  = mean_absolute_error(actuals, preds)
        rmse = np.sqrt(mean_squared_error(actuals, preds))
        results[name] = {"MAE": round(mae, 4), "RMSE": round(rmse, 4)}

    best_algo     = min(results, key=lambda k: results[k]["MAE"])
    latest_window = volumes[-window_size:]

    if best_algo == "SMA":
        forecast = np.mean(latest_window)
    elif best_algo == "WMA":
        forecast = np.dot(latest_window, weights) / weights.sum()
    elif best_algo == "EMA":
        forecast = (alpha * volumes[-1]) + ((1 - alpha) * current_ema)
    else:
        lr_f     = LinearRegression().fit(
            np.arange(window_size).reshape(-1, 1), latest_window
        )
        forecast = max(0, float(lr_f.predict([[window_size]])[0]))

    return {
        "evaluation_metrics"    : results,
        "algorithmic_conclusion": (
            f"Based on historical backtesting, {best_algo} yielded "
            f"the lowest Mean Absolute Error."
        ),
        "best_algorithm"        : best_algo,
        "next_day_forecast"     : round(forecast)
    }

# ══════════════════════════════════════════════════════════════
# 9. LINEAR REGRESSION CHART DATA
# ══════════════════════════════════════════════════════════════

def get_lr_chart_data(df: pd.DataFrame, window_size: int = 7) -> dict:
    daily_counts = df.groupby('visit_date')['patient_id'].count().reset_index()
    daily_counts = daily_counts.sort_values('visit_date').reset_index(drop=True)

    if len(daily_counts) < 2:
        today         = pd.Timestamp.now(tz='UTC').date()
        dates         = [(today - pd.Timedelta(days=i)).strftime('%Y-%m-%d')
                         for i in range(4, -1, -1)]
        forecast_date = (today + pd.Timedelta(days=1)).strftime('%Y-%m-%d')
        return {
            "labels": dates, "actual": [0]*5, "lr_line": [0]*5,
            "forecast_date": forecast_date, "forecast_value": 0,
            "slope": 0.0, "trend": "stable", "r2": 0.0
        }

    dates   = [str(d) for d in daily_counts['visit_date']]
    volumes = daily_counts['patient_id'].values.astype(float)
    n       = len(volumes)

    X_all   = np.arange(n).reshape(-1, 1)
    lr_all  = LinearRegression().fit(X_all, volumes)
    lr_line = [round(max(0, float(v)), 1) for v in lr_all.predict(X_all)]
    slope   = round(float(lr_all.coef_[0]), 4)

    # R² score
    ss_res  = sum((volumes[i] - lr_line[i])**2 for i in range(n))
    ss_tot  = sum((volumes[i] - np.mean(volumes))**2 for i in range(n))
    r2      = round(1 - ss_res / ss_tot, 4) if ss_tot > 0 else 0.0

    # Forecast using latest window
    latest_window = volumes[-window_size:]
    X_win   = np.arange(window_size).reshape(-1, 1)
    lr_win  = LinearRegression().fit(X_win, latest_window)
    forecast_val  = round(max(0, float(lr_win.predict([[window_size]])[0])))

    last_date     = pd.to_datetime(daily_counts['visit_date'].iloc[-1])
    forecast_date = str((last_date + pd.Timedelta(days=1)).date())

    return {
        "labels"         : dates,
        "actual"         : [int(v) for v in volumes],
        "lr_line"        : lr_line,
        "forecast_date"  : forecast_date,
        "forecast_value" : forecast_val,
        "slope"          : slope,
        "trend"          : "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
        "r2"             : r2
    }

# ══════════════════════════════════════════════════════════════
# 10. STAFFING RECOMMENDATION
#     Split by Adult and Pedia clinics
# ══════════════════════════════════════════════════════════════

def recommend_staff(
    forecasted_patients : int,
    opd_hours           : float,
    avg_service_time_min: float,
    p_adult             : float = 0.50,   # proportion routed to adult clinic
    p_pedia             : float = 0.50,   # proportion routed to pedia clinic
    p_consultation      : float = 0.65,   # proportion of total going to consultation
    target_utilization  : float = 0.80,
    max_adult_cubicles  : int   = MAX_ADULT_CUBICLES,
    max_pedia_cubicles  : int   = MAX_PEDIA_CUBICLES,
) -> dict:
    if forecasted_patients <= 0:
        return {}

    mu   = 1 / avg_service_time_min if avg_service_time_min > 0 else 1

    # Total consultation arrival rate
    lam_con   = forecasted_patients * p_consultation / (opd_hours * 60)

    # Split by clinic
    lam_adult = lam_con * p_adult
    lam_pedia = lam_con * p_pedia

    def min_servers(lam, mu, target, cap):
        if lam <= 0:
            return 1
        c     = math.ceil(lam / (mu * target))
        c_cap = min(c, cap)
        return c_cap, c <= cap   # (recommended, is_feasible)

    c_adult, feasible_adult = min_servers(lam_adult, mu, target_utilization, max_adult_cubicles)
    c_pedia, feasible_pedia = min_servers(lam_pedia, mu, target_utilization, max_pedia_cubicles)

    return {
        "forecasted_patients"     : forecasted_patients,
        "consultation_proportion" : p_consultation,

        "adult_clinic": {
            "recommended_doctors" : c_adult,
            "max_cubicles"        : max_adult_cubicles,
            "capacity_sufficient" : feasible_adult,
            "expected_utilization": round(lam_adult / (c_adult * mu), 4) if c_adult > 0 else 0,
            "warning"             : None if feasible_adult else (
                f"Adult clinic load requires more than {max_adult_cubicles} cubicles. "
                "Consider extending OPD hours."
            )
        },

        "pedia_clinic": {
            "recommended_doctors" : c_pedia,
            "max_cubicles"        : max_pedia_cubicles,
            "capacity_sufficient" : feasible_pedia,
            "expected_utilization": round(lam_pedia / (c_pedia * mu), 4) if c_pedia > 0 else 0,
            "warning"             : None if feasible_pedia else (
                f"Pedia clinic load requires more than {max_pedia_cubicles} cubicles. "
                "Consider extending OPD hours."
            )
        }
    }

# ══════════════════════════════════════════════════════════════
# 11. MASTER REPORT GENERATOR
# ══════════════════════════════════════════════════════════════

def generate_report(
    df          : pd.DataFrame,
    opd_hours   : float = 8.0,
    p_adult     : float = 0.50,
    p_pedia     : float = 0.50,
    p_consult   : float = 0.65,
) -> dict:
    """
    Master function — returns the complete analytics payload
    for the administrator dashboard.

    Args:
        df          : raw dataframe from Supabase
        opd_hours   : operating hours per day (default 8)
        p_adult     : proportion of consultation patients in adult clinic
        p_pedia     : proportion of consultation patients in pedia clinic
        p_consult   : proportion of total patients going to consultation
    """
    df_clean = preprocess_queue_data(df)

    # Rates for staffing recommendation
    svc_times       = df_clean['service_consultation'].dropna()
    svc_times       = svc_times[svc_times > 0]
    avg_service_min = round(svc_times.mean(), 2) if not svc_times.empty else 15.0

    # Forecasting
    eval_data     = evaluate_forecasting_algorithms(df_clean)
    predicted_vol = eval_data.get("next_day_forecast", 50)

    return {
        # ── Descriptive analytics ──────────────────────────
        "daily_summary"   : daily_summary(df_clean).tail(5).to_dict(orient='records'),
        "hourly_pattern"  : hourly_pattern(df_clean).to_dict(orient='records'),

        # ── Bottleneck ─────────────────────────────────────
        "bottleneck_analysis" : bottleneck_report(df_clean),

        # ── Registration (M/M/1) ───────────────────────────
        "registration"    : compute_registration_metrics(df_clean),

        # ── Consultation — per cubicle M/M/1 ──────────────
        "consultation": {
            "adult": compute_per_cubicle_metrics(df_clean, clinic='adult'),
            "pedia": compute_per_cubicle_metrics(df_clean, clinic='pedia'),
        },

        # ── Specialized services (M/M/1 each) ─────────────
        "specialized_services" : compute_specialized_metrics(df_clean),

        # ── Total system time & Little's Law ───────────────
        "system_time"     : compute_system_time(df_clean),

        # ── Forecasting ────────────────────────────────────
        "computational_forecasting" : eval_data,
        "lr_chart_data"             : get_lr_chart_data(df_clean),

        # ── Staffing recommendation (adult + pedia split) ──
        "decision_support" : recommend_staff(
            forecasted_patients  = predicted_vol,
            opd_hours            = opd_hours,
            avg_service_time_min = avg_service_min,
            p_adult              = p_adult,
            p_pedia              = p_pedia,
            p_consultation       = p_consult,
        )
    }