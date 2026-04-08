"""
analytics.py
Heart Check PHC — Queue Analytics & Forecasting Module
Philippine Heart Center OPD
"""

import math
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.linear_model import LinearRegression

# ══════════════════════════════════════════════════════════════
# 0. DATETIME UTILS
# ══════════════════════════════════════════════════════════════

def safe_to_datetime(series: pd.Series) -> pd.Series:
    """Convert values to UTC-aware datetime without triggering Pandas duplicate-key errors."""
    series = pd.to_datetime(series, errors='coerce')
    if series.dt.tz is None:
        return series.dt.tz_localize('UTC')
    return series.dt.tz_convert('UTC')

# ══════════════════════════════════════════════════════════════
# 1. DATA PREPROCESSING
# ══════════════════════════════════════════════════════

def preprocess_queue_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adapts your Supabase schema to analytics-ready columns and 
    safely handles incomplete (ongoing) visits without crashing.
    """
    # 1. Rename columns to match what analytics expects
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

    # 2. Convert timestamps to Pandas Datetime
    timestamp_cols = ['kiosk_time', 'reg_start', 'reg_end', 'consult_start', 'consult_end']
    for col in timestamp_cols:
        if col in df.columns:
            df[col] = safe_to_datetime(df[col])

    # 3. THE BULLETPROOF FIX: Handle NULLs (Ongoing visits)
    # Instead of dropping them, we fill missing times with the CURRENT time.
    # This prevents crashes and allows "Live" wait time calculations.
    now = pd.Timestamp.now(tz='UTC')
    if 'reg_start' in df.columns:     df['reg_start']     = df['reg_start'].fillna(now)
    if 'reg_end' in df.columns:       df['reg_end']       = df['reg_end'].fillna(now)
    if 'consult_start' in df.columns: df['consult_start'] = df['consult_start'].fillna(now)
    if 'consult_end' in df.columns:   df['consult_end']   = df['consult_end'].fillna(now)

    # 4. Enforce chronological logic (prevents negative times if data is weird)
    df['reg_start']     = df[['kiosk_time', 'reg_start']].max(axis=1)
    df['reg_end']       = df[['reg_start', 'reg_end']].max(axis=1)
    df['consult_start'] = df[['reg_end', 'consult_start']].max(axis=1)
    df['consult_end']   = df[['consult_start', 'consult_end']].max(axis=1)

    # 5. Calculate durations (in minutes)
    df['wait_registration']    = (df['reg_start']     - df['kiosk_time']).dt.total_seconds() / 60
    df['service_registration'] = (df['reg_end']       - df['reg_start']).dt.total_seconds() / 60
    df['wait_consultation']    = (df['consult_start'] - df['reg_end']).dt.total_seconds() / 60
    df['service_consultation'] = (df['consult_end']   - df['consult_start']).dt.total_seconds() / 60
    df['total_time']           = (df['consult_end']   - df['kiosk_time']).dt.total_seconds() / 60

    # 6. Extract Date and Time for grouping
    df['visit_date']  = df['kiosk_time'].dt.date
    df['hour']        = df['kiosk_time'].dt.hour
    df['day_of_week'] = df['kiosk_time'].dt.day_name()

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
    hourly['time_label'] = hourly['hour'].apply(lambda h: f"{h:02d}:00–{h+1:02d}:00")
    return hourly.round(2)

def bottleneck_report(df: pd.DataFrame) -> dict:
    avg_wait_reg     = df['wait_registration'].mean()
    avg_wait_consult = df['wait_consultation'].mean()
    bottleneck = "Registration" if avg_wait_reg > avg_wait_consult else "Consultation"

    return {
        "bottleneck_stage"          : bottleneck,
        "avg_wait_registration_min" : round(avg_wait_reg, 2),
        "avg_wait_consultation_min" : round(avg_wait_consult, 2),
        "system_status"             : "Overwhelmed" if max(avg_wait_reg, avg_wait_consult) > 30 else "Normal"
    }

# ══════════════════════════════════════════════════════════════
# 3. MARKOVIAN QUEUE METRICS (M/M/c)
# ══════════════════════════════════════════════════════════════

def compute_rates(df: pd.DataFrame):
    arrivals = df['kiosk_time'].sort_values()
    inter_arrivals = arrivals.diff().dt.total_seconds().dropna() / 60
    inter_arrivals = inter_arrivals[inter_arrivals > 0]
    lam = round(1 / inter_arrivals.mean(), 4) if not inter_arrivals.empty else 0.0

    service_times = df['service_consultation'].dropna()
    service_times = service_times[service_times > 0]
    mu_con = round(1 / service_times.mean(), 4) if not service_times.empty else 0.0

    return lam, mu_con

def mmc_metrics(lam: float, mu: float, c: int) -> dict:
    if lam <= 0 or mu <= 0 or c < 1:
        return {"error": "Invalid parameters"}
    rho = lam / (c * mu)
    if rho >= 1:
        return {"status": "Unstable", "utilization_rho": round(rho, 4)}

    a = lam / mu
    sum_terms = sum(a**n / math.factorial(n) for n in range(c))
    last_term  = (a**c / math.factorial(c)) * (c / (c - a))
    Pq = last_term / (sum_terms + last_term)

    Lq = Pq * rho / (1 - rho)
    Wq = Lq / lam

    return {
        "servers_c"              : c,
        "utilization_rho"        : round(rho, 4),
        "probability_of_wait"    : round(Pq, 4),
        "expected_wait_queue_min": round(Wq, 4)
    }

# ══════════════════════════════════════════════════════════════
# 4. ALGORITHMIC EVALUATION
# ══════════════════════════════════════════════════════════════

def evaluate_forecasting_algorithms(
    df: pd.DataFrame,
    window_size: int = 7,
    alpha: float = 0.3
) -> dict:

    daily_counts = df.groupby('visit_date')['patient_id'].count().reset_index()
    daily_counts = daily_counts.sort_values('visit_date')
    volumes = daily_counts['patient_id'].values

    if len(volumes) < window_size + 2:
        return {"status": "Insufficient data for algorithmic comparison."}

    actuals    = []
    sma_preds  = []
    wma_preds  = []
    ema_preds  = []
    lr_preds   = []

    weights     = np.arange(1, window_size + 1, dtype=float)
    current_ema = np.mean(volumes[:window_size])

    for i in range(window_size, len(volumes)):
        actual      = volumes[i]
        window_data = volumes[i - window_size:i]

        # --- SMA ---
        sma = np.mean(window_data)

        # --- WMA ---
        wma = np.dot(window_data, weights) / weights.sum()

        # --- EMA ---
        ema = (alpha * volumes[i - 1]) + ((1 - alpha) * current_ema)
        current_ema = ema

        # --- Linear Regression ---
        X_train = np.arange(window_size).reshape(-1, 1)
        y_train = window_data
        X_next  = np.array([[window_size]])

        lr_model    = LinearRegression()
        lr_model.fit(X_train, y_train)
        lr = float(lr_model.predict(X_next)[0])
        lr = max(0, lr)

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
    for algo_name, predictions in algorithms.items():
        mae  = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        results[algo_name] = {"MAE": round(mae, 4), "RMSE": round(rmse, 4)}

    best_algo     = min(results, key=lambda k: results[k]["MAE"])
    latest_window = volumes[-window_size:]
    X_train_final = np.arange(window_size).reshape(-1, 1)

    if best_algo == "SMA":
        forecast = np.mean(latest_window)
    elif best_algo == "WMA":
        forecast = np.dot(latest_window, weights) / weights.sum()
    elif best_algo == "EMA":
        forecast = (alpha * volumes[-1]) + ((1 - alpha) * current_ema)
    else:
        lr_final = LinearRegression()
        lr_final.fit(X_train_final, latest_window)
        forecast = float(lr_final.predict(np.array([[window_size]]))[0])
        forecast = max(0, forecast)

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
# 5. STAFFING RECOMMENDATION
# ══════════════════════════════════════════════════════════════

def recommend_staff(
    forecasted_patients: int,
    opd_hours: float,
    avg_service_time_min: float,
    target_utilization: float = 0.80
) -> dict:
    if forecasted_patients <= 0:
        return {}
    lam     = forecasted_patients / (opd_hours * 60)
    mu      = 1 / avg_service_time_min
    c_min   = math.ceil(lam / (mu * target_utilization))
    metrics = mmc_metrics(lam, mu, c_min)

    return {
        "forecasted_patients"  : forecasted_patients,
        "recommended_doctors"  : c_min,
        "expected_utilization" : metrics.get("utilization_rho", 0)
    }

# ══════════════════════════════════════════════════════════════
# 6. MASTER REPORT GENERATOR
# ══════════════════════════════════════════════════════════════

def generate_report(
    df: pd.DataFrame,
    c_consultation: int = 1,
    opd_hours: float = 8.0
) -> dict:
    df_clean        = preprocess_queue_data(df)
    lam, mu         = compute_rates(df_clean)
    avg_service_min = (1 / mu) if mu > 0 else 15
    eval_data       = evaluate_forecasting_algorithms(df_clean)
    predicted_vol   = eval_data.get("next_day_forecast", 50)

    return {
        "daily_summary"            : daily_summary(df_clean).tail(5).to_dict(orient='records'),
        "hourly_pattern"           : hourly_pattern(df_clean).to_dict(orient='records'),
        "bottleneck_analysis"      : bottleneck_report(df_clean),
        "queue_theory"             : {
            "arrival_rate_lambda"  : lam,
            "service_rate_mu"      : mu,
            "current_metrics"      : mmc_metrics(lam, mu, c=c_consultation)
        },
        "computational_forecasting": eval_data,
        "decision_support"         : recommend_staff(predicted_vol, opd_hours, avg_service_min)
    }