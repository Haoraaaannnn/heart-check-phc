"""
report.py
Master report generator — assembles all analytics modules
into the single payload served to the admin dashboard.
"""

import pandas as pd
from .preprocessing  import preprocess_queue_data
from .descriptive    import daily_summary, hourly_pattern, bottleneck_report
from .queue_metrics  import (
    registration_metrics,
    per_cubicle_metrics,
    specialized_metrics,
    system_time_report,
)
from .forecasting    import evaluate_forecasting_algorithms, get_lr_chart_data
from .staffing       import recommend_staff


def generate_report(
    df         : pd.DataFrame,
    opd_hours  : float = 8.0,
    p_adult    : float = 0.50,
    p_pedia    : float = 0.50,
    p_consult  : float = 0.65,
) -> dict:
    """
    Entry point called by the FastAPI backend.

    Args:
        df        : raw dataframe pulled from Supabase
        opd_hours : operating hours per day
        p_adult   : proportion of consultation patients → adult clinic
        p_pedia   : proportion of consultation patients → pedia clinic
        p_consult : proportion of total patients routed to consultation
    """
    df_clean = preprocess_queue_data(df)

    svc             = df_clean['service_consultation']
    avg_service_min = round(float(svc[svc > 0].mean()), 2) if not svc[svc > 0].empty else 15.0

    eval_data       = evaluate_forecasting_algorithms(df_clean)
    predicted_vol   = eval_data.get("next_day_forecast", 50)

    return {
        # ── Descriptive ───────────────────────────────────
        "daily_summary"   : daily_summary(df_clean).tail(5).to_dict(orient='records'),
        "hourly_pattern"  : hourly_pattern(df_clean).to_dict(orient='records'),

        # ── Bottleneck ────────────────────────────────────
        "bottleneck_analysis" : bottleneck_report(df_clean),

        # ── Queue metrics ─────────────────────────────────
        "registration"    : registration_metrics(df_clean),
        "consultation"    : {
            "adult": per_cubicle_metrics(df_clean, clinic='adult'),
            "pedia": per_cubicle_metrics(df_clean, clinic='pedia'),
        },
        "specialized_services" : specialized_metrics(df_clean),

        # ── System time & Little's Law ────────────────────
        "system_time"     : system_time_report(df_clean),

        # ── Forecasting ───────────────────────────────────
        "computational_forecasting" : eval_data,
        "lr_chart_data"             : get_lr_chart_data(df_clean),

        # ── Staffing recommendation ───────────────────────
        "decision_support" : recommend_staff(
            forecasted_patients  = predicted_vol,
            opd_hours            = opd_hours,
            avg_service_time_min = avg_service_min,
            p_adult              = p_adult,
            p_pedia              = p_pedia,
            p_consultation       = p_consult,
        ),
    }