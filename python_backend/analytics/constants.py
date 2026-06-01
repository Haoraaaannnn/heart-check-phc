"""
constants.py
All PHC-specific fixed values in one place.
Change these here and every module picks them up automatically.
"""

# This file stores the fixed values used across the analytics module, such as thresholds, limits, and service categories.

# PHC-specific constants
MAX_ADULT_CUBICLES  = 20    # 4 rooms × 5 cubicles
MAX_PEDIA_CUBICLES  = 20    # 4 rooms × 5 cubicles

# OPD time targets (from scope of study)
OPD_TARGET_MINUTES  = 150   # 2 hrs 30 min total stay target
OVERWHELMED_MINUTES = 30    # per-stage alert threshold

# Forecasting defaults
EMA_ALPHA    = 0.3
WINDOW_SIZE  = 2  # Minimum 2 days for moving averages

# Service categories
CONSULTATION_SERVICE   = 'consultation'

SPECIALIZED_SERVICES = [
    'warfarin',
    'benzathine',
    'ecg',
    'opd_card',
    'opd_screening',
    'refill_prescription',
    'opd_reschedule',
]