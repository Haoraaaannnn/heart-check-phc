"""
db_seeder.py
Stochastic Data Generator for Heart Check PHC
Generates realistic multi-server queue timestamps and exports to CSV.

Flow:
  CONSULTATION + OPD SCREENING:
    Kiosk → Registration (reg_start→reg_end) → Service (consult_start→consult_end)

  ALL OTHER SERVICES:
    Kiosk → Service directly (consult_start→consult_end)
    reg_start = NULL, reg_end = NULL
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


# ── Services that go through Registration first ───────────────
REQUIRES_REGISTRATION = ['Consultation', 'OPD Screening']

# ── All services with their resources and avg service times ───
SERVICES = {
    'Consultation'       : {'resource': 'Doctor',      'avg_time': 15},
    'OPD Screening'      : {'resource': 'Triage',      'avg_time': 8},
    'OPD Card'           : {'resource': 'Admin',       'avg_time': 5},
    'Warfarin'           : {'resource': 'Nurse',       'avg_time': 10},
    'Benzathine'         : {'resource': 'Nurse',       'avg_time': 12},
    'ECG'                : {'resource': 'Technician',  'avg_time': 20},
    'Refill Prescription': {'resource': 'Admin',       'avg_time': 5},
    'OPD Reschedule'     : {'resource': 'Admin',       'avg_time': 5},
}

# ── Service routing probabilities ─────────────────────────────
# Adjust these based on MISD interview estimates
SERVICE_WEIGHTS = {
    'Consultation'       : 0.45,
    'OPD Screening'      : 0.10,
    'OPD Card'           : 0.10,
    'Warfarin'           : 0.10,
    'Benzathine'         : 0.08,
    'ECG'                : 0.07,
    'Refill Prescription': 0.05,
    'OPD Reschedule'     : 0.05,
}

# ── Cubicle assignments per service ───────────────────────────
# Based on PHC setup: 4 rooms × 5 cubicles each
# Adult clinic: R1-R4, Pedia: R5-R8
# Each room has cubicles C1-C5
CUBICLE_MAP = {
    'Consultation'       : [
                            # Adult clinic cubicles
                            'R1 C1', 'R1 C2', 'R1 C3', 'R1 C4', 'R1 C5',
                            'R2 C1', 'R2 C2', 'R2 C3', 'R2 C4', 'R2 C5',
                            'R3 C1', 'R3 C2', 'R3 C3', 'R3 C4', 'R3 C5',
                            'R4 C1', 'R4 C2', 'R4 C3', 'R4 C4', 'R4 C5',
                           ],
    'OPD Screening'      : ['R1 C1', 'R1 C2', 'R1 C3'],
    'OPD Card'           : ['Admin C1'],
    'Warfarin'           : ['Warfarin C1'],
    'Benzathine'         : ['Benzathine C1'],
    'ECG'                : ['ECG R1'],
    'Refill Prescription': ['Refill C1'],
    'OPD Reschedule'     : ['Reschedule C1'],
}


def generate_fake_patients(
    num_days         : int = 30,
    patients_per_day : int = 80,
    start_date       : str = "2026-04-21",
    output_filename  : str = "simulated_patients.csv"
):
    avg_inter_arrival = 5   # minutes between arrivals
    avg_reg_time      = 3   # minutes for registration

    data      = []
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    print(f"Generating patients over {num_days} days...")

    for day in range(num_days):
        current_date = base_date + timedelta(days=day)

        # Skip Sundays
        if current_date.weekday() == 6:
            continue

        # OPD starts at 8:00 AM
        opd_start  = current_date.replace(hour=8, minute=0, second=0, microsecond=0)
        current_time = opd_start

        # ── Track when each resource becomes free ─────────────
        reg_free_time      = opd_start   # single registration clerk
        resource_free_times = {
            res['resource']: opd_start
            for res in SERVICES.values()
        }

        # ── Daily patient volume with normal variation ─────────
        daily_volume = max(10, int(np.random.normal(patients_per_day, scale=8)))

        for i in range(1, daily_volume + 1):

            # ── 1. Arrival at kiosk ───────────────────────────
            inter_arrival = np.random.exponential(avg_inter_arrival)
            current_time += timedelta(minutes=inter_arrival)
            kiosk_time    = current_time

            # ── 2. Select service ─────────────────────────────
            service_names   = list(SERVICE_WEIGHTS.keys())
            service_probs   = list(SERVICE_WEIGHTS.values())
            purpose         = random.choices(service_names, weights=service_probs, k=1)[0]
            req_resource    = SERVICES[purpose]['resource']
            avg_service_time= SERVICES[purpose]['avg_time']

            # ── 3. Assign cubicle ─────────────────────────────
            cubicle = random.choice(CUBICLE_MAP[purpose])

            # ── 4. Registration stage ─────────────────────────
            # ONLY for Consultation and OPD Screening
            if purpose in REQUIRES_REGISTRATION:
                reg_start    = max(kiosk_time, reg_free_time)
                reg_duration = np.random.exponential(avg_reg_time)
                reg_end      = reg_start + timedelta(minutes=reg_duration)
                reg_free_time = reg_end   # clerk is now free

                # Service starts after registration
                service_start = max(reg_end, resource_free_times[req_resource])

            else:
                # ── Direct to service — no registration ───────
                reg_start     = None   # NULL in database
                reg_end       = None   # NULL in database

                # Service starts shortly after kiosk
                # Small walk time to reach service area
                walk_time     = timedelta(minutes=random.uniform(1, 3))
                service_start = max(kiosk_time + walk_time,
                                    resource_free_times[req_resource])

            # ── 5. Service execution ──────────────────────────
            service_duration = np.random.exponential(avg_service_time)
            service_end      = service_start + timedelta(minutes=service_duration)

            # Update resource free time
            resource_free_times[req_resource] = service_end

            # ── 6. Format timestamps ──────────────────────────
            def fmt(dt):
                """Format datetime or return None for NULL."""
                if dt is None:
                    return None
                return dt.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")

            data.append({
                'id'           : f"{purpose[:3].upper()}-{i:03d}",
                'patientNum'   : f"{purpose[:3].upper()}-{i:03d}",
                'service'      : purpose,
                'cubicleNum'   : cubicle,
                'status'       : 'Done',
                'phoneNum'     : None,
                'created_at'   : fmt(kiosk_time),

                # NULL for non-registration services
                'reg_start'    : fmt(reg_start),
                'reg_end'      : fmt(reg_end),

                # Always filled for all services
                'consult_start': fmt(service_start),
                'consult_end'  : fmt(service_end),
            })

    df = pd.DataFrame(data)
    df.to_csv(output_filename, index=False)

    # ── Summary ───────────────────────────────────────────────
    reg_services     = df[df['service'].isin(REQUIRES_REGISTRATION)]
    non_reg_services = df[~df['service'].isin(REQUIRES_REGISTRATION)]

    print(f"\nGenerated {len(df)} patient records across "
          f"{df['created_at'].apply(lambda x: x[:10]).nunique()} days")
    print(f"\nService breakdown:")
    print(df['service'].value_counts().to_string())
    print(f"\nRegistration stage:")
    print(f"  With reg_start/reg_end    : {len(reg_services)} "
          f"({reg_services['service'].unique()})")
    print(f"  Without (NULL)            : {len(non_reg_services)} "
          f"(direct to service)")
    print(f"\nNULL check:")
    print(f"  reg_start is NULL         : {df['reg_start'].isna().sum()}")
    print(f"  reg_end is NULL           : {df['reg_end'].isna().sum()}")
    print(f"  consult_start is NULL     : {df['consult_start'].isna().sum()}")
    print(f"  consult_end is NULL       : {df['consult_end'].isna().sum()}")
    print(f"\nSaved to: {output_filename}")

    return df


if __name__ == "__main__":
    generate_fake_patients(
        num_days         = 30,
        patients_per_day = 120,
        start_date       = "2026-05-01",
        output_filename  = "simulated_patients.csv"
    )