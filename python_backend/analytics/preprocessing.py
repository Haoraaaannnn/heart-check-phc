"""
preprocessing.py
Converts raw Supabase dataframe into analytics-ready columns.
"""

import pandas as pd
from .helpers import to_utc


def _chron_max(a: pd.Series, b: pd.Series) -> pd.Series:
    """
    Elementwise max of two timestamp series that PRESERVES NaT.

    pd.DataFrame([...]).max(axis=1) drops NaNs by default (skipna=True),
    so max(real_timestamp, NaT) silently returns real_timestamp instead
    of NaT. That's fine when NaT just means "not filled in yet, so fill
    it in" — but it's wrong once we start deliberately leaving NaT on
    rows that never reached a stage (historical rows, stale/orphaned live
    rows). Using skipna=False keeps NaT as NaT unless BOTH sides are
    real, so "hasn't reached this stage" stays "hasn't reached this
    stage" all the way through the ordering step.
    """
    return pd.concat([a, b], axis=1).max(axis=1, skipna=False)


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

    # Capture which stage-boundary timestamps were ACTUALLY recorded,
    # before anything gets filled with `now()` below. Without this, a
    # patient who hasn't reached a stage yet gets that stage's timestamp
    # filled to `now()` and silently treated as if they just arrived
    # there — which is exactly what was inflating Registration→Consult
    # wait into the thousands of minutes for patients who were never
    # actually called for consultation.
    reg_end_reached     = df['reg_end'].notna()     if 'reg_end'     in df.columns else pd.Series(False, index=df.index)
    consult_end_reached = df['consult_end'].notna() if 'consult_end' in df.columns else pd.Series(False, index=df.index)

    # ── Who is allowed to be treated as "still live, still waiting"? ──
    #
    # 1. Historical rows (imported from PHC's Excel exports) have no
    #    relationship to "right now" — an imported row from months ago
    #    can't be "still waiting as of this moment."
    #
    # 2. Live rows whose kiosk_time isn't from TODAY are just as bad.
    #    PHC's OPD queue is same-day (fixed daily appointment caps, no-
    #    shows rescheduled) — so a "live" row from a previous day that
    #    never got a consult_start is an orphaned/incomplete record, not
    #    a patient who's genuinely still in line. Filling its missing
    #    timestamps with `now()` makes its wait grow by another day every
    #    day it sits there, which is exactly the "2985 min" symptom and
    #    exactly why the stage's patient count never goes down — the row
    #    never resolves, it just keeps re-counting itself forever.
    #
    # Only rows that are BOTH non-historical AND from today get the
    # `now()` fill. Everything else keeps genuine NaT for any stage it
    # hasn't reached, so that stage correctly reports "no data" for that
    # row instead of a bogus, ever-growing wait.
    is_historical = (
        df['is_historical'].fillna(False).astype(bool)
        if 'is_historical' in df.columns
        else pd.Series(False, index=df.index)
    )

    today_manila       = pd.Timestamp.now(tz='Asia/Manila').normalize()
    kiosk_date_manila  = df['kiosk_time'].dt.tz_convert('Asia/Manila').dt.normalize()
    is_from_today      = kiosk_date_manila == today_manila

    fill_as_live = (~is_historical) & is_from_today

    # Fill NULLs with now() — only for rows we've confirmed are today's
    # genuinely live, in-progress patients.
    now = pd.Timestamp.now(tz='UTC')
    for col in ['reg_start', 'reg_end', 'consult_start', 'consult_end']:
        if col in df.columns:
            df.loc[fill_as_live, col] = df.loc[fill_as_live, col].fillna(now)

    # Enforce chronological order (NaT-preserving — see _chron_max above,
    # this is what stops a stale row's NaT from getting silently
    # resurrected from the previous stage's real timestamp)
    df['reg_start']     = _chron_max(df['kiosk_time'],    df['reg_start'])
    df['reg_end']       = _chron_max(df['reg_start'],     df['reg_end'])
    df['consult_start'] = _chron_max(df['reg_end'],       df['consult_start'])
    df['consult_end']   = _chron_max(df['consult_start'], df['consult_end'])

    # Derived durations (minutes)
    # wait_registration is kept as-is even for ongoing patients: kiosk_time
    # is always real, and reg_start-filled-to-now (for today's live rows
    # only, per fill_as_live above) correctly represents "how long they've
    # been waiting so far" — a genuinely meaningful live signal.
    # Historical data did not deploy physical kiosk ticketing (kiosk_time was
    # assigned from reg_start on import). Gating wait_registration ensures
    # historical rows report genuine NA instead of false 0.0-minute waits.
    df['wait_registration']    = (df['reg_start']      - df['kiosk_time']).dt.total_seconds() / 60
    df.loc[is_historical, 'wait_registration'] = pd.NA

    # Genuine kiosk arrival timestamp (NaT for historical rows)
    df['kiosk_arrival_time']   = df['kiosk_time'].where(~is_historical, pd.NaT)

    # These three are only meaningful once their END boundary actually
    # happened — otherwise they're measuring the gap between two
    # now()-filled (or two NaT) timestamps.
    df['service_registration'] = (df['reg_end']        - df['reg_start']).dt.total_seconds() / 60
    df.loc[~reg_end_reached, 'service_registration'] = pd.NA

    df['wait_consultation']    = (df['consult_start']  - df['reg_end']).dt.total_seconds() / 60
    df.loc[~reg_end_reached, 'wait_consultation'] = pd.NA

    df['service_consultation'] = (df['consult_end']    - df['consult_start']).dt.total_seconds() / 60
    df.loc[~consult_end_reached, 'service_consultation'] = pd.NA

    # NOTE: total_time is intentionally NOT computed here anymore.
    # It's computed further down, after the carryout block, so it can
    # include service_carryout when that data is available. See the
    # "Total time (moved below carryout)" section below.

    # Carryout stage — carryout_start/carryout_end were added to the schema
    # alongside is_historical. Only computed if the raw query actually
    # included these columns (guards against older FastAPI select() calls
    # that don't request them yet).
    #
    # Deliberately NOT filled with `now` like the other stages above:
    # carryout is optional per visit (not every patient goes through it,
    # and many "in progress" patients simply haven't reached it yet), so
    # a missing value should stay a genuine NULL rather than get treated
    # as "started right now" and pollute the stage average with a fake
    # near-zero duration.
    if 'carryout_start' in df.columns and 'carryout_end' in df.columns:
        df['carryout_start'] = to_utc(df['carryout_start'])
        df['carryout_end']   = to_utc(df['carryout_end'])

        has_both = df['carryout_start'].notna() & df['carryout_end'].notna()
        df.loc[has_both, 'carryout_end'] = df.loc[
            has_both, ['carryout_start', 'carryout_end']
        ].max(axis=1)

        df['service_carryout'] = (
            df['carryout_end'] - df['carryout_start']
        ).dt.total_seconds() / 60

    # ── Total time (moved below carryout) ──────────────────────────────
    # PHC's paper form defines "Total Waiting Time" as reg_start -> carryout_end.
    # For patients without carryout, fall back to reg_start -> consult_end.
    # Starting from reg_start preserves wait_registration as an independent
    # metric (kiosk_time -> reg_start) and unifies the analytics pipeline with
    # the authoritative PHC Excel export definition.
    if 'carryout_end' in df.columns:
        end_ts = df['carryout_end'].fillna(df['consult_end'])
    else:
        end_ts = df['consult_end']

    df['total_time'] = (end_ts - df['reg_start']).dt.total_seconds() / 60

    # Time grouping — computed in Asia/Manila local time, not UTC.
    # For historical rows without kiosk ticketing, patient intake occurs at the registration desk (reg_start).
    # For live rows, patient intake begins when the queue ticket is generated at the kiosk (kiosk_time).
    intake_time        = df['kiosk_time'].where(~is_historical, df['reg_start']).fillna(df['kiosk_time'])
    manila_time        = intake_time.dt.tz_convert('Asia/Manila')
    df['visit_date']   = manila_time.dt.date
    df['hour']         = manila_time.dt.hour
    df['day_of_week']  = manila_time.dt.day_name()

    # Per-stage arrival and execution hours in Asia/Manila local time
    if 'reg_start' in df.columns:
        df['reg_hour'] = df['reg_start'].dt.tz_convert('Asia/Manila').dt.hour
    else:
        df['reg_hour'] = pd.Series(pd.NA, index=df.index)

    if 'consult_start' in df.columns:
        df['consult_hour'] = df['consult_start'].dt.tz_convert('Asia/Manila').dt.hour
    else:
        df['consult_hour'] = pd.Series(pd.NA, index=df.index)

    if 'carryout_start' in df.columns and 'carryout_end' in df.columns:
        c_ts = df['carryout_start'].fillna(df['carryout_end'])
        df['carryout_hour'] = c_ts.dt.tz_convert('Asia/Manila').dt.hour
    elif 'carryout_end' in df.columns:
        df['carryout_hour'] = df['carryout_end'].dt.tz_convert('Asia/Manila').dt.hour
    else:
        df['carryout_hour'] = pd.Series(pd.NA, index=df.index)

    df['kiosk_hour']   = df['kiosk_arrival_time'].dt.tz_convert('Asia/Manila').dt.hour

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