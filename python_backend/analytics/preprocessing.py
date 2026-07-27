"""
preprocessing.py
Converts raw Supabase dataframe into analytics-ready columns.
"""

import pandas as pd
from .helpers import to_utc


def preprocess_queue_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Renames Supabase columns, parses timestamps to UTC,
    fills NULL timestamps for live/ongoing patients,
    enforces chronological order, and computes all
    derived duration columns used by every other module.
    """
    # Rename Supabase columns to internal names
    df = df.rename(columns={k: v for k, v in {
        'id'        : 'patient_id',
        'created_at': 'kiosk_time',
        'service'   : 'purpose',
        'patientNum': 'queue_number',
    }.items() if k in df.columns and v not in df.columns})

    # Parse timestamps to UTC
    for col in ['kiosk_time', 'reg_start', 'reg_end', 'consult_start', 'consult_end']:
        if col in df.columns:
            df[col] = to_utc(df[col])

    # Fill NULLs with now (ongoing/live patients)
    now = pd.Timestamp.now(tz='UTC')
    for col in ['reg_start', 'reg_end', 'consult_start', 'consult_end']:
        if col in df.columns:
            df[col] = df[col].fillna(now)

    # Enforce chronological order
    df['reg_start']     = df[['kiosk_time',   'reg_start']].max(axis=1)
    df['reg_end']       = df[['reg_start',    'reg_end']].max(axis=1)
    df['consult_start'] = df[['reg_end',      'consult_start']].max(axis=1)
    df['consult_end']   = df[['consult_start','consult_end']].max(axis=1)

    # Derived durations (minutes) 
    df['wait_registration']    = (df['reg_start']      - df['kiosk_time']).dt.total_seconds() / 60
    df['service_registration'] = (df['reg_end']        - df['reg_start']).dt.total_seconds() / 60
    df['wait_consultation']    = (df['consult_start']  - df['reg_end']).dt.total_seconds() / 60
    df['service_consultation'] = (df['consult_end']    - df['consult_start']).dt.total_seconds() / 60
    
    df['total_time']           = (df['consult_end']    - df['kiosk_time']).dt.total_seconds() / 60

    # Time grouping — computed in Asia/Manila local time, not UTC.
    # kiosk_time is stored in UTC (correct for duration math above),
    # but hour-of-day / calendar-date / day-of-week are meant to
    # describe the actual PHC business day as staff experience it.
    # Grouping by raw UTC hour here previously shifted every local
    # timestamp back 8 hours, making afternoon patients look like
    # early-morning ones and clipping the Hourly Wait Time chart
    # around local noon.
    manila_time        = df['kiosk_time'].dt.tz_convert('Asia/Manila')
    df['visit_date']   = manila_time.dt.date
    df['hour']         = manila_time.dt.hour
    df['day_of_week']  = manila_time.dt.day_name()

    # Normalize purpose to lowercase
    if 'purpose' in df.columns:
        df['purpose'] = df['purpose'].str.lower().str.strip()

    # Classify clinic type from cubicleNum prefix
    # Convention: cubicleNum starting with 'P' = pedia, else adult
    df['clinic_type'] = (
        df['cubicleNum'].apply(
            lambda x: 'pedia' if str(x).lower().startswith('p') else 'adult'
        ) if 'cubicleNum' in df.columns
        else 'adult'
    )

    return df