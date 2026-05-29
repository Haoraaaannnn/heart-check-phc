"""
helpers.py
Pure utility functions — no side effects, no imports from other
analytics modules. Safe to import anywhere.
"""

import math
import numpy as np
import pandas as pd


def to_utc(series: pd.Series) -> pd.Series:
    """Parse a Series to UTC-aware datetime."""
    s = pd.to_datetime(series, errors='coerce')
    return s.dt.tz_localize('UTC') if s.dt.tz is None else s.dt.tz_convert('UTC')


def arrival_rate(times: pd.Series) -> float:
    """
    λ = 1 / mean inter-arrival time (patients / min).
    Returns 0.0 if not enough data.
    """
    inter = times.sort_values().diff().dt.total_seconds().dropna() / 60
    inter = inter[inter > 0]
    return round(1 / inter.mean(), 4) if not inter.empty else 0.0


def service_rate(durations: pd.Series) -> float:
    """
    μ = 1 / mean service duration (patients / min).
    Returns 0.0 if not enough data.
    """
    d = durations.dropna()
    d = d[d > 0]
    return round(1 / d.mean(), 4) if not d.empty else 0.0


def mm1(lam: float, mu: float) -> dict:
    """
    Closed-form M/M/1 queue metrics.

    Used for:
      - Registration counter (single clerk)
      - Each consultation cubicle (pre-assigned doctor)
      - All specialized single-server stations
        (warfarin, benzathine, ECG, etc.)
    """
    if lam <= 0 or mu <= 0:
        return {"error": "Invalid parameters"}
    rho = lam / mu
    if rho >= 1:
        return {
            "status"         : "Unstable",
            "utilization_rho": round(rho, 4),
            "note"           : "Arrival rate exceeds service rate."
        }
    Lq = rho**2 / (1 - rho)
    Wq = Lq / lam
    W  = 1 / (mu - lam)
    return {
        "model"                 : "M/M/1",
        "utilization_rho"       : round(rho, 4),
        "avg_in_queue_Lq"       : round(Lq, 4),
        "avg_wait_queue_Wq_min" : round(Wq, 4),
        "avg_time_system_W_min" : round(W, 4),
    }


def mmc_benchmark(lam: float, mu: float, c: int) -> dict:
    """
    Erlang C / M/M/c metrics.

    Used ONLY as a theoretical lower-bound benchmark for
    the consultation stage. Assumes perfect load sharing
    across all cubicles — this is never true at PHC since
    patients are pre-assigned to specific doctors.
    """
    if lam <= 0 or mu <= 0 or c < 1:
        return {"error": "Invalid parameters"}
    rho = lam / (c * mu)
    if rho >= 1:
        return {"status": "Unstable", "utilization_rho": round(rho, 4)}
    a         = lam / mu
    sum_terms = sum(a**n / math.factorial(n) for n in range(c))
    last_term = (a**c / math.factorial(c)) * (c / (c - a))
    Pq        = last_term / (sum_terms + last_term)
    Lq        = Pq * rho / (1 - rho)
    Wq        = Lq / lam
    return {
        "model"                 : f"M/M/{c} benchmark",
        "servers_c"             : c,
        "utilization_rho"       : round(rho, 4),
        "probability_of_wait"   : round(Pq, 4),
        "avg_in_queue_Lq"       : round(Lq, 4),
        "avg_wait_queue_Wq_min" : round(Wq, 4),
        "note"                  : "Theoretical minimum — assumes perfect load balancing.",
    }


def lam_mu_metrics(subset: pd.DataFrame) -> dict:
    """
    Compute λ, μ, and M/M/1 metrics from a patient subset.
    Single reusable block called by registration, cubicle,
    and specialized service computations.
    """
    lam = arrival_rate(subset['kiosk_time'])
    mu  = service_rate(subset['service_consultation'])
    return {
        "patients_served"     : len(subset),
        "arrival_rate_lambda" : lam,
        "service_rate_mu"     : mu,
        "metrics"             : mm1(lam, mu),
    }