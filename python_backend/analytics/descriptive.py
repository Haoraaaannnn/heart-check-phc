"""
descriptive.py
Daily summaries, hourly patterns, and bottleneck detection.
"""

import pandas as pd
from .constants import OVERWHELMED_MINUTES


def daily_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Daily aggregation — last 5 days shown on dashboard."""
    return (
        df.groupby('visit_date').agg(
            total_patients        = ('patient_id',        'count'),
            avg_wait_registration = ('wait_registration', 'mean'),
            avg_wait_consultation = ('wait_consultation', 'mean'),
            avg_total_time        = ('total_time',        'mean'),
        )
        .reset_index()
        .round(2)
    )


def hourly_pattern(df: pd.DataFrame) -> pd.DataFrame:
    """Average patients and wait time per hour of day."""
    return (
        df.groupby('hour').agg(
            avg_patients          = ('patient_id',        'count'),
            avg_wait_consultation = ('wait_consultation', 'mean'),
        )
        .reset_index()
        .assign(time_label=lambda d: d['hour'].astype(int).apply(
            lambda h: f"{h:02d}:00–{h+1:02d}:00"
        ))
        .round(2)
    )

def bottleneck_report(df: pd.DataFrame) -> dict:
    # Only use registration wait for services that have it
    reg_df   = df[df['reg_start'].notna()]
    avg_wait_reg     = reg_df['wait_registration'].mean() if not reg_df.empty else 0.0
    avg_wait_consult = df['wait_consultation'].mean()

    bottleneck = "Registration" if avg_wait_reg > avg_wait_consult else "Consultation"

    return {
        "bottleneck_stage"          : bottleneck,
        "avg_wait_registration_min" : round(avg_wait_reg, 2),
        "avg_wait_consultation_min" : round(avg_wait_consult, 2),
        "system_status"             : (
            "Overwhelmed"
            if max(avg_wait_reg, avg_wait_consult) > OVERWHELMED_MINUTES
            else "Normal"
        ),
    }