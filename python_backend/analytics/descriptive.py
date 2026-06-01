"""
descriptive.py
Daily summaries, hourly patterns, and bottleneck detection.
"""

# This files handle all the descriptive analytics functions, 
# #which are used to generate the data for the dashboard and reports. #
# This includes daily summaries, hourly patterns, and bottleneck detection.
# This file is basically the overview and data processing of the analytics module, 
# while the other files are more focused on specific types of \
# analysis (e.g. forecasting, queue metrics, staffing recommendations).

import pandas as pd
from .constants import OVERWHELMED_MINUTES

# Calculate daily summaries such as patient counts and average wait times per day
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

# Shows which are the busiest hours of the day, and how wait times vary by hour. 
# This can help identify peak times and potential staffing needs.
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

# Identifies whether registration or consultation is the bottleneck 
# stage based on average wait times, and flags if the system 
# is overwhelmed (if either stage exceeds the overwhelmed threshold).
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