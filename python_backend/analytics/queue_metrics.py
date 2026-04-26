"""
queue_metrics.py
Markovian queue computations for all PHC service stages:
  - Registration      → M/M/1
  - Consultation      → per-cubicle M/M/1 + M/M/c benchmark
  - Specialized svcs  → M/M/1 per service
  - System time       → W_total + Little's Law validation
"""

import numpy as np
import pandas as pd
from .constants import (
    MAX_ADULT_CUBICLES, MAX_PEDIA_CUBICLES,
    OPD_TARGET_MINUTES, SPECIALIZED_SERVICES,
    CONSULTATION_SERVICE,
)
from .helpers import arrival_rate, lam_mu_metrics, mmc_benchmark


def registration_metrics(df: pd.DataFrame) -> dict:
    """
    M/M/1 — all patients pass through Registration
    regardless of their service category.
    """
    return lam_mu_metrics(df)


def per_cubicle_metrics(df: pd.DataFrame, clinic: str = 'adult') -> dict:
    """
    Each consultation cubicle is an independent M/M/1 queue
    because patients are pre-assigned to a specific doctor.

    M/M/c is included only as a theoretical lower-bound benchmark
    showing what waiting times would be if PHC used a shared queue.

    clinic: 'adult' | 'pedia'
    """
    subset = df[
        (df['purpose'] == CONSULTATION_SERVICE) &
        (df['clinic_type'] == clinic)
    ]

    if subset.empty or 'cubicleNum' not in df.columns:
        return {"error": f"No {clinic} consultation data available."}

    per_cubicle       = {}
    lam_list, mu_list = [], []

    for cub in sorted(subset['cubicleNum'].dropna().unique(), key=str):
        cub_data = subset[subset['cubicleNum'] == cub]
        if len(cub_data) < 3:
            continue

        result              = lam_mu_metrics(cub_data)
        result["cubicle"]   = str(cub)
        result["clinic"]    = clinic
        result["overloaded"]= result["metrics"].get("utilization_rho", 0) > 0.80

        per_cubicle[str(cub)] = result

        if result["arrival_rate_lambda"] > 0:
            lam_list.append(result["arrival_rate_lambda"])
        if result["service_rate_mu"] > 0:
            mu_list.append(result["service_rate_mu"])

    c       = len(per_cubicle)
    lam_tot = sum(lam_list)
    mu_avg  = round(float(np.mean(mu_list)), 4) if mu_list else 0.0

    rho_vals = [
        v["metrics"].get("utilization_rho", 0)
        for v in per_cubicle.values()
        if isinstance(v.get("metrics"), dict)
    ]
    imbalance = round(max(rho_vals) - min(rho_vals), 4) if len(rho_vals) > 1 else 0.0

    return {
        "clinic"               : clinic,
        "active_cubicles"      : c,
        "max_cubicles"         : MAX_ADULT_CUBICLES if clinic == 'adult' else MAX_PEDIA_CUBICLES,
        "per_cubicle"          : per_cubicle,
        "mmc_benchmark"        : mmc_benchmark(lam_tot, mu_avg, c) if c > 0 else {},
        "load_imbalance_delta" : imbalance,
        "load_balance_status"  : "Imbalanced" if imbalance > 0.20 else "Balanced",
    }


def specialized_metrics(df: pd.DataFrame) -> dict:
    """
    M/M/1 per specialized single-server service station.
    (Warfarin, Benzathine, ECG, OPD Card, etc.)
    """
    return {
        svc: (
            lam_mu_metrics(df[df['purpose'] == svc])
            if len(df[df['purpose'] == svc]) >= 3
            else {"status": "Insufficient data"}
        )
        for svc in SPECIALIZED_SERVICES
    }


def system_time_report(df: pd.DataFrame) -> dict:
    """
    W_total = mean(consult_end − kiosk_time)

    Validates against the 150-min OPD target from scope of study.
    Also validates Little's Law: L = λ × W
    """
    completed = df[df['total_time'] > 0]['total_time']
    if completed.empty:
        return {"error": "No completed visits available."}

    W   = round(float(completed.mean()), 2)
    lam = arrival_rate(df['kiosk_time'])

    return {
        "avg_total_time_min" : W,
        "target_min"         : OPD_TARGET_MINUTES,
        "within_target"      : W <= OPD_TARGET_MINUTES,
        "excess_min"         : round(max(0.0, W - OPD_TARGET_MINUTES), 2),
        "littles_law_L"      : round(lam * W, 4),
        "arrival_rate_lambda": lam,
        "note": (
            f"Average stay is {W} min — "
            f"{'within' if W <= OPD_TARGET_MINUTES else 'exceeds'} "
            f"the {OPD_TARGET_MINUTES}-min target."
        ),
    }