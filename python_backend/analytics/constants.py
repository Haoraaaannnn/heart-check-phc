"""
constants.py
All PHC-specific fixed values in one place.
Change these here and every module picks them up automatically.

 Threshold source legend used in inline comments below:
   [PHC-POLICY]    Confirmed value from the official PHC paper tracking
                   form or a verified PHC MIS communication.
   [INTERNAL]      Internal operational benchmark, NOT a confirmed PHC
                   policy limit. Used when the official limit is unknown.
                   Label as "internal benchmark" in all UI and report output.
"""

# This file stores the fixed values used across the analytics module,
# such as thresholds, capacity limits, and service categories.

# --- Physical capacity limits -------------------------------------------
# [PHC-POLICY] Fixed by room allocation: 1 room x 5 cubicles per clinic.
MAX_ADULT_CUBICLES  = 5
MAX_PEDIA_CUBICLES  = 5

# --- OPD total stay target -----------------------------------------------
# [PHC-POLICY] From the official PHC paper tracking sheet label
# "Waiting Time <= 2.5 hrs."
OPD_TARGET_MINUTES  = 150   # 2 hrs 30 min

# --- Bottleneck severity tiers -------------------------------------------
# [INTERNAL] Per-stage average wait thresholds used by bottleneck_report.
# These are operational benchmarks derived from the 30-min registration
# service mean. They are NOT confirmed PHC per-stage policy limits.
# Request remaining per-stage limits from PHC MIS before UAT.
#
# Normal:      avg <= OVERWHELMED_MINUTES
# Elevated:    OVERWHELMED_MINUTES < avg <= CRITICAL_MINUTES
# Overwhelmed: avg > CRITICAL_MINUTES
OVERWHELMED_MINUTES = 30    # [INTERNAL] Normal -> Elevated threshold
CRITICAL_MINUTES    = 60    # [INTERNAL] Elevated -> Overwhelmed threshold (2x baseline)

# --- PHC paper tracking-sheet compliance thresholds ----------------------
# These mirror the four bucket rows on the physical PHC OPD daily form
# (Waiting Time / Evaluate / Examine & Treat / Carry Out Dr's Orders).
#
# [PHC-POLICY] carry-out confirmed at 15 minutes.
# [PHC-POLICY] waiting time (2.5 hrs) and examine & treat (1 hr 45 min)
#              are from the official PHC paper form column definitions.
# [INTERNAL]  evaluate threshold (30 min) re-uses OVERWHELMED_MINUTES
#              because no separate confirmed PHC limit is known yet.
EVALUATE_TARGET_MINUTES       = OVERWHELMED_MINUTES  # [INTERNAL] 30 min — pending PHC MIS confirmation
EXAMINE_TREAT_TARGET_MINUTES  = 105                  # [PHC-POLICY] 1 hr 45 min — "Examine & treat Pts"
CARRYOUT_TARGET_MINUTES       = 15                   # [PHC-POLICY] 15 min — "Carry out Dr's Orders"
WAITING_TIME_TARGET_MINUTES   = OPD_TARGET_MINUTES   # [PHC-POLICY] 150 min (2.5 hrs) — "Waiting Time"

# In the official PHC Excel workbook template, the formula for Waiting
# Time evaluates <= 03:00:00 (180 min) despite the label reading
# "Waiting Time <= 2.5 hrs.". Defined here to match the authentic
# spreadsheet template calculation.
PHC_EXCEL_WAITING_TIME_TARGET_MINUTES = 180  # [PHC-POLICY] 3 hrs — formula in PHC Excel template

# Standard daily consultation shift divisor from the PHC formula:
# Patients Seen / Doctors on Duty / 7
PHC_CONSULTATION_SHIFT_HOURS = 7  # [PHC-POLICY]


# --- Forecasting defaults ------------------------------------------------
# EMA smoothing parameter: 30% weight to current day, 70% to history.
EMA_ALPHA = 0.3

# Sliding window for SMA, WMA, LR, and EMA back-testing.
# Set to 5 (one PHC business week) so the three smoothers use a
# meaningful window and produce distinguishable predictions.
# WINDOW_SIZE = 2 collapsed SMA, WMA, and LR into near-identical outputs.
WINDOW_SIZE = 5  # days (one business week)

# How often ARIMA re-estimates its parameters during walk-forward
# back-testing, vs. reusing the existing fit with new data appended.
ARIMA_REFIT_INTERVAL = 7  # days


# --- Service categories --------------------------------------------------
CONSULTATION_SERVICE = 'consultation'

SPECIALIZED_SERVICES = [
    'warfarin',
    'benzathine',
    'ecg',
    'opd_card',
    'opd_screening',
    'refill_prescription',
    'opd_reschedule',
]