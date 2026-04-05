"""
analytics.py
Heart Check PHC — Queue Analytics & Forecasting Module
Philippine Heart Center OPD
"""

import math
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

# ══════════════════════════════════════════════════════════════
# 1. DATA PREPROCESSING
# ══════════════════════════════════════════════════════════════

def preprocess_queue_data(df: pd.DataFrame) -> pd.DataFrame:
    """Computes waiting times and service times from raw timestamps."""
    df['visit_date'] = pd.to_datetime(df['visit_date'])
    
    df['wait_registration'] = (df['reg_start'] - df['kiosk_time']).dt.total_seconds() / 60
    df['service_registration'] = (df['reg_end'] - df['reg_start']).dt.total_seconds() / 60
    df['wait_consultation'] = (df['consult_start'] - df['reg_end']).dt.total_seconds() / 60
    df['service_consultation'] = (df['consult_end'] - df['consult_start']).dt.total_seconds() / 60
    df['total_time'] = (df['consult_end'] - df['kiosk_time']).dt.total_seconds() / 60

    df['hour'] = df['kiosk_time'].dt.hour
    df['day_of_week'] = df['visit_date'].dt.day_name()
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
    avg_wait_reg = df['wait_registration'].mean()
    avg_wait_consult = df['wait_consultation'].mean()
    bottleneck = "Registration" if avg_wait_reg > avg_wait_consult else "Consultation"

    return {
        "bottleneck_stage": bottleneck,
        "avg_wait_registration_min": round(avg_wait_reg, 2),
        "avg_wait_consultation_min": round(avg_wait_consult, 2),
        "system_status": "Overwhelmed" if max(avg_wait_reg, avg_wait_consult) > 30 else "Normal"
    }

# ══════════════════════════════════════════════════════════════
# 3. MARKOVIAN QUEUE METRICS (M/M/1)
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
    last_term = (a**c / math.factorial(c)) * (c / (c - a))
    Pq = last_term / (sum_terms + last_term)

    Lq = Pq * rho / (1 - rho)
    Wq = Lq / lam

    return {
        "servers_c": c,
        "utilization_rho": round(rho, 4),
        "probability_of_wait": round(Pq, 4),
        "expected_wait_queue_min": round(Wq, 4)
    }

# ══════════════════════════════════════════════════════════════
# 4. ALGORITHMIC EVALUATION (COMPUTER SCIENCE CORE)
# ══════════════════════════════════════════════════════════════

def evaluate_forecasting_algorithms(df: pd.DataFrame, window_size: int = 7, alpha: float = 0.3) -> dict:
    daily_counts = df.groupby('visit_date')['patient_id'].count().reset_index()
    daily_counts = daily_counts.sort_values('visit_date')
    volumes = daily_counts['patient_id'].values

    if len(volumes) < window_size + 2:
        return {"status": "Insufficient data for algorithmic comparison."}

    actuals, sma_preds, wma_preds, ema_preds = [], [], [], []
    weights = np.arange(1, window_size + 1, dtype=float)
    current_ema = np.mean(volumes[:window_size])

    for i in range(window_size, len(volumes)):
        actual = volumes[i]
        window_data = volumes[i-window_size:i]

        sma = np.mean(window_data)
        wma = np.dot(window_data, weights) / weights.sum()
        ema = (alpha * volumes[i-1]) + ((1 - alpha) * current_ema)
        current_ema = ema

        actuals.append(actual)
        sma_preds.append(sma)
        wma_preds.append(wma)
        ema_preds.append(ema)

    algorithms = {"SMA": sma_preds, "WMA": wma_preds, "EMA": ema_preds}
    results = {}
    for algo_name, predictions in algorithms.items():
        mae = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        results[algo_name] = {"MAE": round(mae, 4), "RMSE": round(rmse, 4)}

    best_algo = min(results, key=lambda k: results[k]["MAE"])
    
    latest_window = volumes[-window_size:]
    if best_algo == "SMA":
        forecast = np.mean(latest_window)
    elif best_algo == "WMA":
        forecast = np.dot(latest_window, weights) / weights.sum()
    else:
        forecast = (alpha * volumes[-1]) + ((1 - alpha) * current_ema)
    
    return {
        "evaluation_metrics": results,
        "algorithmic_conclusion": f"Based on historical backtesting, {best_algo} yielded the lowest Mean Absolute Error.",
        "best_algorithm": best_algo,
        "next_day_forecast": round(forecast)
    }

# ══════════════════════════════════════════════════════════════
# 5. STAFFING RECOMMENDATION
# ══════════════════════════════════════════════════════════════

def recommend_staff(forecasted_patients: int, opd_hours: float, avg_service_time_min: float, target_utilization: float = 0.80) -> dict:
    if forecasted_patients <= 0: return {}
    lam = forecasted_patients / (opd_hours * 60)
    mu = 1 / avg_service_time_min
    c_min = math.ceil(lam / (mu * target_utilization))
    metrics = mmc_metrics(lam, mu, c_min)

    return {
        "forecasted_patients": forecasted_patients,
        "recommended_doctors": c_min,
        "expected_utilization": metrics.get("utilization_rho", 0)
    }

# ══════════════════════════════════════════════════════════════
# 6. MASTER REPORT GENERATOR
# ══════════════════════════════════════════════════════════════

def generate_report(df: pd.DataFrame, c_consultation: int = 1, opd_hours: float = 8.0) -> dict:
    df_clean = preprocess_queue_data(df)
    lam, mu = compute_rates(df_clean)
    avg_service_min = (1/mu) if mu > 0 else 15
    eval_data = evaluate_forecasting_algorithms(df_clean)
    predicted_vol = eval_data.get("next_day_forecast", 50)

    return {
        "daily_summary": daily_summary(df_clean).tail(5).to_dict(orient='records'),
        "hourly_pattern": hourly_pattern(df_clean).to_dict(orient='records'),
        "bottleneck_analysis": bottleneck_report(df_clean),
        "queue_theory": {
            "arrival_rate_lambda": lam,
            "service_rate_mu": mu,
            "current_metrics": mmc_metrics(lam, mu, c=c_consultation)
        },
        "computational_forecasting": eval_data,
        "decision_support": recommend_staff(predicted_vol, opd_hours, avg_service_min)
    }