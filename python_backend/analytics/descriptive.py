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
from .constants import (
    OVERWHELMED_MINUTES,
    CRITICAL_MINUTES,
    WAITING_TIME_TARGET_MINUTES,
    EVALUATE_TARGET_MINUTES,
    EXAMINE_TREAT_TARGET_MINUTES,
    CARRYOUT_TARGET_MINUTES,
)

# Calculate daily summaries such as patient counts and average wait times per day
def daily_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Daily aggregation — includes volumes, stage durations, and total times."""
    clean = df.copy()
    if 'total_time' in clean.columns:
        clean.loc[clean['total_time'] < 0, 'total_time'] = pd.NA

    agg_map = {
        'total_patients'           : ('patient_id',           'count'),
        'avg_wait_registration'    : ('wait_registration',    'mean'),
        'avg_service_registration' : ('service_registration', 'mean'),
        'avg_wait_consultation'    : ('wait_consultation',    'mean'),
        'avg_service_consultation' : ('service_consultation', 'mean'),
        'avg_service_carryout'     : ('service_carryout',     'mean'),
        'avg_total_time'           : ('total_time',           'mean'),
    }

    active_agg = {k: v for k, v in agg_map.items() if v[0] in clean.columns}
    res = clean.groupby('visit_date').agg(**active_agg).reset_index().round(2)

    for k in agg_map:
        if k not in res.columns:
            res[k] = None

    return res


# Shows which are the busiest hours of the day, and how wait times vary by hour,
# broken down per queue stage (kiosk check-in, registration duration,
# registration to consultation wait, with doctor consultation duration, carryout duration).
# This lets the dashboard show which stage is active and which stage is slow at which hour.
def hourly_pattern(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes hourly patient counts (intake volume and per-stage throughput)
    as well as per-stage average duration and wait times per hour of the day.
    Gracefully handles historical records where kiosk ticketing was not deployed.
    """
    if df.empty:
        return pd.DataFrame(columns=[
            'hour', 'time_label', 'avg_patients',
            'kiosk_patients', 'reg_patients', 'consult_patients', 'carryout_patients',
            'avg_wait_registration', 'avg_service_registration',
            'avg_wait_consultation', 'avg_service_consultation', 'avg_service_carryout'
        ])

    # Distinct calendar days to compute true daily averages for overall range benchmarks
    n_days = max(1, int(df['visit_date'].dropna().nunique())) if 'visit_date' in df.columns else 1

    # Check if real kiosk timestamps exist in this dataset
    has_kiosk_data = bool('kiosk_arrival_time' in df.columns and df['kiosk_arrival_time'].notna().any())

    # Standard clinic operating hours: 07:00 to 16:00, plus any extra hours in the data
    data_hours = set(df['hour'].dropna().astype(int).unique()) if 'hour' in df.columns else set()
    all_hours = sorted(set(range(7, 17)).union(data_hours))

    rows = []
    for h in all_hours:
        time_label = f"{h:02d}:00–{h+1:02d}:00"

        # Overall patient intake in this hour
        hour_intake_mask = df['hour'] == h if 'hour' in df.columns else pd.Series(False, index=df.index)
        intake_count = int(hour_intake_mask.sum())
        avg_patients = round(intake_count / n_days, 2) if n_days > 1 else intake_count

        # 1. Kiosk stage (Check-in volume and wait to registration)
        if has_kiosk_data:
            kiosk_mask = df['kiosk_hour'] == h if 'kiosk_hour' in df.columns else pd.Series(False, index=df.index)
            k_count = int(kiosk_mask.sum())
            kiosk_pts = round(k_count / n_days, 2) if n_days > 1 else k_count
            sub_kiosk_wait = df.loc[kiosk_mask, 'wait_registration'].dropna() if 'wait_registration' in df.columns else pd.Series()
            avg_wait_reg = round(float(sub_kiosk_wait.mean()), 2) if not sub_kiosk_wait.empty else None
        else:
            kiosk_pts = None
            avg_wait_reg = None

        # 2. Registration stage (intake at registration counter and service duration)
        reg_mask = df['reg_hour'] == h if 'reg_hour' in df.columns else pd.Series(False, index=df.index)
        r_count = int(reg_mask.sum())
        reg_pts = round(r_count / n_days, 2) if n_days > 1 else r_count
        sub_reg_serv = df.loc[reg_mask, 'service_registration'].dropna() if 'service_registration' in df.columns else pd.Series()
        avg_serv_reg = round(float(sub_reg_serv.mean()), 2) if not sub_reg_serv.empty else None

        # 3. With Doctor stage (patients entering consultation and consultation duration)
        consult_mask = df['consult_hour'] == h if 'consult_hour' in df.columns else pd.Series(False, index=df.index)
        c_count = int(consult_mask.sum())
        consult_pts = round(c_count / n_days, 2) if n_days > 1 else c_count
        sub_wait_con = df.loc[consult_mask, 'wait_consultation'].dropna() if 'wait_consultation' in df.columns else pd.Series()
        avg_wait_con = round(float(sub_wait_con.mean()), 2) if not sub_wait_con.empty else None
        sub_serv_con = df.loc[consult_mask, 'service_consultation'].dropna() if 'service_consultation' in df.columns else pd.Series()
        avg_serv_con = round(float(sub_serv_con.mean()), 2) if not sub_serv_con.empty else None

        # 4. Carryout stage (patients in carryout and service duration)
        carryout_mask = df['carryout_hour'] == h if 'carryout_hour' in df.columns else pd.Series(False, index=df.index)
        co_count = int(carryout_mask.sum())
        carryout_pts = round(co_count / n_days, 2) if n_days > 1 else co_count
        sub_serv_carry = df.loc[carryout_mask, 'service_carryout'].dropna() if 'service_carryout' in df.columns else pd.Series()
        avg_serv_carry = round(float(sub_serv_carry.mean()), 2) if not sub_serv_carry.empty else None

        rows.append({
            'hour'                     : h,
            'time_label'               : time_label,
            'avg_patients'             : avg_patients,
            'kiosk_patients'           : kiosk_pts,
            'reg_patients'             : reg_pts,
            'consult_patients'         : consult_pts,
            'carryout_patients'        : carryout_pts,
            'avg_wait_registration'    : avg_wait_reg,
            'avg_service_registration' : avg_serv_reg,
            'avg_wait_consultation'    : avg_wait_con,
            'avg_service_consultation' : avg_serv_con,
            'avg_service_carryout'     : avg_serv_carry,
        })

    return pd.DataFrame(rows)


def _classify_level(avg_minutes: float) -> str:
    """3-level severity classification for a single stage's average wait/duration."""
    if avg_minutes > CRITICAL_MINUTES:
        return "Overwhelmed"
    elif avg_minutes > OVERWHELMED_MINUTES:
        return "Elevated"
    return "Normal"


def _stage_reason(stage_label: str, avg_minutes: float, level: str, patient_count: int) -> str:
    """Plain-language explanation of why a stage was classified at this level."""
    if level == "No Data":
        if "kiosk" in stage_label.lower():
            return "No kiosk ticketing records available (kiosk was not deployed for this dataset)."
        return f"No patients have reached {stage_label} yet in this range."

    if level == "Normal":
        return (
            f"{stage_label} is averaging {avg_minutes} min across {patient_count} patients — "
            f"within the {OVERWHELMED_MINUTES}-min target."
        )

    threshold = OVERWHELMED_MINUTES if level == "Elevated" else CRITICAL_MINUTES
    over_by   = round(avg_minutes - threshold, 2)
    multiple  = round(avg_minutes / OVERWHELMED_MINUTES, 1) if OVERWHELMED_MINUTES > 0 else 0

    return (
        f"{stage_label} is averaging {avg_minutes} min across {patient_count} patients — "
        f"{over_by} min over the {threshold}-min {level.lower()} threshold "
        f"({multiple}x the {OVERWHELMED_MINUTES}-min baseline)."
    )


# Identifies which specific stage of the kiosk-to-carryout flow is the
# bottleneck, classifies each stage independently into 3 severity levels
# (Normal / Elevated / Overwhelmed) plus a 4th "No Data" state for stages
# nobody has reached yet, and explains why in plain language.
#
# This replaces the old 2-stage version, which only ever compared
# registration vs. consultation and returned a single system-wide
# Normal/Overwhelmed flag with no explanation of which stage caused it.
def bottleneck_report(df: pd.DataFrame) -> dict:
    """
    Stage definitions (see preprocessing.py for column derivation):
      Kiosk → Registration wait   : wait_registration     (kiosk_time     → reg_start)
      Registration duration       : service_registration  (reg_start      → reg_end)
      Registration → Consult wait : wait_consultation      (reg_end        → consult_start)
      Consultation duration       : service_consultation   (consult_start  → consult_end)
      Carryout duration           : service_carryout       (carryout_start → carryout_end)

    All 5 stages are always returned, even with 0 qualifying patients —
    "No Data" is a distinct level from "Normal" (0 patients isn't the same
    claim as "0 patients and everything's fine"), so the dashboard table
    always shows the full framework rather than stages silently vanishing
    when live data is thin.
    """
    stage_defs = [
        ("kiosk_to_registration_wait",    "Kiosk → Registration wait",         'wait_registration'),
        ("registration_duration",         "Registration duration",             'service_registration'),
        ("registration_to_consult_wait",  "Registration → Consultation wait",  'wait_consultation'),
        ("consultation_duration",         "Consultation duration",             'service_consultation'),
        ("carryout_duration",             "Carryout duration",                 'service_carryout'),
    ]

    # These three stages only apply to patients who actually went through
    # registration — some services skip straight to a specialized station.
    registration_gated = {'wait_registration', 'service_registration', 'wait_consultation'}

    stages = []
    for key, label, col in stage_defs:
        if col not in df.columns:
            # Column not in df at all (e.g. carryout not selected upstream yet) —
            # still show the row so the table's shape stays consistent.
            stages.append({
                "stage_key"     : key,
                "stage_label"   : label,
                "avg_minutes"   : 0.0,
                "patient_count" : 0,
                "level"         : "No Data",
                "reason"        : _stage_reason(label, 0.0, "No Data", 0),
            })
            continue

        subset = df[df['reg_start'].notna()] if col in registration_gated else df

        values = subset[col].dropna()
        values = values[values >= 0]  # guard against any negative-duration edge cases

        if values.empty:
            stages.append({
                "stage_key"     : key,
                "stage_label"   : label,
                "avg_minutes"   : 0.0,
                "patient_count" : 0,
                "level"         : "No Data",
                "reason"        : _stage_reason(label, 0.0, "No Data", 0),
            })
            continue

        avg_minutes   = round(float(values.mean()), 2)
        patient_count = int(values.count())
        level         = _classify_level(avg_minutes)
        reason        = _stage_reason(label, avg_minutes, level, patient_count)

        stages.append({
            "stage_key"     : key,
            "stage_label"   : label,
            "avg_minutes"   : avg_minutes,
            "patient_count" : patient_count,
            "level"         : level,
            "reason"        : reason,
        })

    # Rank severity for picking the primary bottleneck: Overwhelmed > Elevated
    # > Normal > No Data. "No Data" ranks lowest on purpose — a stage nobody
    # has reached yet should never be reported as "the" bottleneck.
    severity_rank = {"Overwhelmed": 3, "Elevated": 2, "Normal": 1, "No Data": 0}
    stages_with_data = [s for s in stages if s["level"] != "No Data"]

    if not stages_with_data:
        return {
            "stages"                    : stages,
            "primary_bottleneck"        : None,
            "system_status"             : "No Data",
            "bottleneck_stage"          : "N/A",
            "avg_wait_registration_min" : 0.0,
            "avg_wait_consultation_min" : 0.0,
        }

    primary = max(stages_with_data, key=lambda s: (severity_rank[s["level"]], s["avg_minutes"]))

    return {
        # Full per-stage breakdown for the dashboard table — always 5 rows.
        "stages" : stages,

        "primary_bottleneck" : {
            "stage_key"   : primary["stage_key"],
            "stage_label" : primary["stage_label"],
            "avg_minutes" : primary["avg_minutes"],
            "level"       : primary["level"],
            "reason"      : primary["reason"],
        },

        # Overall system status reflects the worst stage that actually has data.
        "system_status" : primary["level"],

        # Legacy keys kept so any existing frontend code reading the old
        # 2-stage shape directly doesn't break during the transition.
        "bottleneck_stage"          : primary["stage_label"],
        "avg_wait_registration_min" : next(
            (s["avg_minutes"] for s in stages if s["stage_key"] == "kiosk_to_registration_wait"), 0.0
        ),
        "avg_wait_consultation_min" : next(
            (s["avg_minutes"] for s in stages if s["stage_key"] == "registration_to_consult_wait"), 0.0
        ),
    }

    
# Aggregates patient volume by service type across the full dataset —
# used as the historical baseline for the Service Distribution chart
# when there's no live "today" data to show.
def service_distribution(df: pd.DataFrame) -> pd.DataFrame:
    """Total patient count per service, across the full date range in df."""
    return (
        df.groupby('purpose').agg(
            total_patients = ('patient_id', 'count'),
        )
        .reset_index()
        .rename(columns={'purpose': 'service'})
        .sort_values('total_patients', ascending=False)
        .round(2)
    )


def monthly_breakdown(df: pd.DataFrame) -> dict:
    """
    Groups the full dataset by year and month, and computes a typical
    bottleneck stage + average total patient time for each month.

    Powers the Overview banner's year dropdown / monthly breakdown table —
    lets the person see how the bottleneck and average time shifted
    month-to-month across all historical years, rather than one number
    smeared across the entire date range.

    Returns a dict keyed by year as a string (e.g. "2024"), each holding
    a chronological list of month entries. Only months with at least one
    patient record are included — no empty filler months.
    """
    if df.empty or 'visit_date' not in df.columns:
        return {}

    dates = pd.to_datetime(df['visit_date'])
    years = sorted(dates.dt.year.unique().tolist())

    result = {}
    for year in years:
        year_mask = dates.dt.year == year
        year_df   = df[year_mask]
        year_dates = dates[year_mask]

        months = sorted(year_dates.dt.month.unique().tolist())
        month_entries = []

        for month in months:
            month_mask = year_dates.dt.month == month
            month_df   = year_df[month_mask]

            if month_df.empty:
                continue

            b = bottleneck_report(month_df)

            if 'total_time' in month_df.columns:
                completed = month_df['total_time']
                completed = completed[completed > 0].dropna()
                avg_total_time = round(float(completed.mean()), 2) if not completed.empty else 0.0
            else:
                avg_total_time = 0.0

            month_entries.append({
                "month"              : month,
                "month_label"        : pd.Timestamp(year=int(year), month=int(month), day=1).strftime("%B"),
                "patient_count"      : int(len(month_df)),
                "bottleneck_stage"   : b.get("bottleneck_stage", "N/A"),
                "system_status"      : b.get("system_status", "No Data"),
                "avg_total_time_min" : avg_total_time,
            })

        result[str(year)] = month_entries

    return result


# Mirrors PHC's existing manual paper tracking sheet so the dashboard's
# figures can be directly cross-checked against what OPD staff already
# tally by hand each day: four "≤ threshold / > threshold" patient
# buckets (Waiting Time, Evaluate patients, Examine & treat Pts, Carry
# out Dr's Orders), plus the four summary stats (Avg Total Waiting Time,
# Patients Seen, Doctors on Duty, Patient-to-Doctor Ratio Per Hour).
#
# "Doctors on Duty" is intentionally NOT computed here — the current
# schema has no reliable per-day doctor-duty record to query, so that
# number is entered manually on the frontend and the ratio is derived
# client-side from patients_seen + opd_hours returned below. This keeps
# the backend from fabricating a number it can't actually verify.
def phc_compliance_summary(df: pd.DataFrame, opd_hours: float = 8.0) -> dict:
    """
    All four buckets are computed over the same patient set — those with
    a completed total_time — so the ≤/> pairs sum to patients_seen, same
    as the paper form (e.g. 101 + 30 = 131 patients seen).
    """
    has_total_time = 'total_time' in df.columns
    completed = df[df['total_time'].notna() & (df['total_time'] >= 0)] if has_total_time else df.iloc[0:0]
    patients_seen = int(len(completed))

    def _bucket(col: str, threshold: float) -> tuple[int, int]:
        if col not in completed.columns:
            return 0, 0
        vals = completed[col].dropna()
        vals = vals[vals >= 0]
        le = int((vals <= threshold).sum())
        gt = int((vals > threshold).sum())
        return le, gt

    # In official PHC Excel template, "Examine & treat Pts." evaluates Column AA:
    # Initial Assessment to Doctor Seen (wait_consultation).
    if 'wait_consultation' in completed.columns:
        exam_col = 'wait_consultation'
    else:
        exam_col = 'service_consultation'


    waiting_le, waiting_gt = _bucket('total_time',           WAITING_TIME_TARGET_MINUTES)
    eval_le,    eval_gt    = _bucket('service_registration', EVALUATE_TARGET_MINUTES)
    exam_le,    exam_gt    = _bucket(exam_col,               EXAMINE_TREAT_TARGET_MINUTES)
    carry_le,   carry_gt   = _bucket('service_carryout',     CARRYOUT_TARGET_MINUTES)

    avg_total_waiting = (
        round(float(completed['total_time'].mean()), 2)
        if patients_seen > 0 and has_total_time else 0.0
    )

    return {
        "waiting_time_le"   : waiting_le,
        "waiting_time_gt"   : waiting_gt,
        "evaluate_le"       : eval_le,
        "evaluate_gt"       : eval_gt,
        "examine_treat_le"  : exam_le,
        "examine_treat_gt"  : exam_gt,
        "carryout_le"       : carry_le,
        "carryout_gt"       : carry_gt,

        "avg_total_waiting_time_min" : avg_total_waiting,
        "patients_seen"              : patients_seen,
        "opd_hours"                  : opd_hours,

        "thresholds_min" : {
            "waiting_time"  : WAITING_TIME_TARGET_MINUTES,
            "evaluate"      : EVALUATE_TARGET_MINUTES,
            "examine_treat" : EXAMINE_TREAT_TARGET_MINUTES,
            "carryout"      : CARRYOUT_TARGET_MINUTES,
        },
    }