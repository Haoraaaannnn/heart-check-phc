"""
staffing.py
Staffing recommendation for Adult and Pedia clinics.

Uses next-day forecast + M/M/1 to compute the minimum
number of active cubicles (doctors) needed to keep
server utilization below the 80% target.
"""

import math
from .constants import MAX_ADULT_CUBICLES, MAX_PEDIA_CUBICLES


def recommend_staff(
    forecasted_patients : int,
    opd_hours           : float,
    avg_service_time_min: float,
    p_adult             : float = 0.50,
    p_pedia             : float = 0.50,
    p_consultation      : float = 0.65,
    target_utilization  : float = 0.80,
) -> dict:
    """
    Args:
        forecasted_patients   : predicted patient count for next day
        opd_hours             : operating hours (default 8)
        avg_service_time_min  : mean consultation duration in minutes
        p_adult               : proportion of consultation to adult clinic
        p_pedia               : proportion of consultation to pedia clinic
        p_consultation        : proportion of total patients going to consultation
        target_utilization    : max acceptable ρ (default 0.80)
    """
    if forecasted_patients <= 0:
        return {}

    mu      = 1 / avg_service_time_min if avg_service_time_min > 0 else 1
    lam_con = forecasted_patients * p_consultation / (opd_hours * 60)

    def _clinic_recommendation(lam: float, cap: int) -> dict:
        c        = max(1, math.ceil(lam / (mu * target_utilization))) if lam > 0 else 1
        c_capped = min(c, cap)
        feasible = c <= cap
        return {
            "recommended_doctors" : c_capped,
            "max_cubicles"        : cap,
            "capacity_sufficient" : feasible,
            "expected_utilization": round(lam / (c_capped * mu), 4) if c_capped > 0 else 0,
            "warning"             : None if feasible else (
                f"Forecasted load requires {c} cubicles "
                f"but maximum available is {cap}. "
                "Consider extending OPD hours or redirecting patients."
            ),
        }

    return {
        "forecasted_patients"    : forecasted_patients,
        "consultation_proportion": p_consultation,
        "adult_clinic"           : _clinic_recommendation(lam_con * p_adult, MAX_ADULT_CUBICLES),
        "pedia_clinic"           : _clinic_recommendation(lam_con * p_pedia, MAX_PEDIA_CUBICLES),
    }