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
        .assign(time_label=lambda d: d['hour'].apply(
            lambda h: f"{h:02d}:00–{h+1:02d}:00"
        ))
        .round(2)
    )


def bottleneck_report(df: pd.DataFrame) -> dict:
    """
    Identifies which stage has the highest average wait time.
    Flags system as Overwhelmed if any stage exceeds
    OVERWHELMED_MINUTES threshold.
    """
    wr = df['wait_registration'].mean()
    wc = df['wait_consultation'].mean()
    return {
        "bottleneck_stage"          : "Registration" if wr > wc else "Consultation",
        "avg_wait_registration_min" : round(wr, 2),
        "avg_wait_consultation_min" : round(wc, 2),
        "system_status"             : (
            "Overwhelmed" if max(wr, wc) > OVERWHELMED_MINUTES
            else "Normal"
        ),
    }