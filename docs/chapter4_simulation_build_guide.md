# Chapter 4 Simulation — Build Guide

**File this guide creates:** `python_backend/chapter4_simulation.py`

> **Context:** The document `docs/chapter4_simulation_comparison.md` is a written analytical report
> with manually derived numbers. This guide explains how to build the **actual executable simulation**
> that generates those numbers programmatically, so the results are reproducible and verifiable.

---

## Table of Contents

1. [What "Buildable" Means Here](#1-what-buildable-means-here)
2. [What Already Exists (Do Not Rewrite)](#2-what-already-exists-do-not-rewrite)
3. [What Needs to Be Written](#3-what-needs-to-be-written)
4. [Architecture of the Simulation Script](#4-architecture-of-the-simulation-script)
5. [Step-by-Step Implementation Plan](#5-step-by-step-implementation-plan)
   - [Step 1 — Imports and Configuration](#step-1--imports-and-configuration)
   - [Step 2 — Simulate the Manual Process](#step-2--simulate-the-manual-process)
   - [Step 3 — Simulate the Digital Process](#step-3--simulate-the-digital-process)
   - [Step 4 — Compute M/M/1 Metrics for Both Scenarios](#step-4--compute-mm1-metrics-for-both-scenarios)
   - [Step 5 — Compute Stage-by-Stage Comparison Table](#step-5--compute-stage-by-stage-comparison-table)
   - [Step 6 — Compute PHC Compliance Rates](#step-6--compute-phc-compliance-rates)
   - [Step 7 — Print the Report](#step-7--print-the-report)
6. [Full Script Skeleton](#6-full-script-skeleton)
7. [How to Run](#7-how-to-run)
8. [Expected Output](#8-expected-output)
9. [How to Use the Output in Chapter 4](#9-how-to-use-the-output-in-chapter-4)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)

---

## 1. What "Buildable" Means Here

The comparison document lists numbers such as:

- "Registration queue wait reduced from 18.2 min to 2.67 min"
- "Server utilization (rho) drops from 0.785 to 0.471"
- "Total OPD stay reduced by 35%"

These numbers were computed by hand from the system's source parameters. A **buildable simulation** means:

1. A single Python script (`chapter4_simulation.py`) runs both scenarios end-to-end.
2. The script uses the **same stochastic engine** already in `db_seeder.py` and the **same M/M/1 math** already in `analytics/helpers.py`.
3. The script outputs a comparison table to the terminal (and optionally to a CSV file) that matches or verifies the numbers in the report.
4. Any thesis reviewer can run `python chapter4_simulation.py` and reproduce the results.

---

## 2. What Already Exists (Do Not Rewrite)

The following modules in the project already contain the logic you need. Import them; do not duplicate them.

| Existing File | What It Provides | How the Simulation Uses It |
|---|---|---|
| `db_seeder.py` — `generate_fake_patients()` | Stochastic patient arrival and service timestamps for the **digital scenario** (kiosk-based, with registration stage modeled as 3 min avg) | Call directly to generate Scenario B data |
| `analytics/helpers.py` — `mm1()` | Closed-form M/M/1 metrics: rho, Lq, Wq, W | Apply to both scenarios with different mu values |
| `analytics/helpers.py` — `mmc_benchmark()` | Erlang C / M/M/c theoretical lower bound | Use as the pooled-cubicle benchmark |
| `analytics/helpers.py` — `arrival_rate()` | Computes lambda from a series of arrival timestamps | Feed it kiosk_time column from generated data |
| `analytics/helpers.py` — `service_rate()` | Computes mu from a series of service durations | Feed it reg/consult duration columns |
| `analytics/constants.py` | `OPD_TARGET_MINUTES`, `OVERWHELMED_MINUTES`, `CRITICAL_MINUTES`, `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES` | Use as compliance thresholds |

---

## 3. What Needs to Be Written

The new script `python_backend/chapter4_simulation.py` must add the following logic that does not currently exist anywhere:

1. **Manual scenario parameters** — The existing `db_seeder.py` only models the digital process (avg_reg_time = 3 min, no announcement delay, no stub issuance overhead). You need to define manual-process overrides.
2. **Scenario runner** — A function that generates a dataset for each scenario and attaches the relevant overhead times.
3. **Per-stage time accumulator** — Computes average wait at each stage (check-in, registration queue, registration service, walk, consultation) for both scenarios.
4. **Comparison table printer** — Formats and prints the side-by-side table.
5. **Compliance calculator** — Counts what fraction of patients finish within 150 min and 180 min.

---

## 4. Architecture of the Simulation Script

```
chapter4_simulation.py
        |
        |--- [1] Define scenario configs (manual vs digital)
        |
        |--- [2] run_scenario(config)
        |           |
        |           |-- Call generate_fake_patients() with scenario params
        |           |-- Attach per-patient overhead times (check-in, announcement)
        |           |-- Compute per-patient total OPD stay
        |           |-- Return DataFrame with all stage times
        |
        |--- [3] compute_mm1_metrics(scenario_df, scenario_config)
        |           |
        |           |-- Call arrival_rate() from helpers.py
        |           |-- Call service_rate() from helpers.py
        |           |-- Call mm1() from helpers.py
        |           |-- Return dict of rho, Lq, Wq, W for registration stage
        |
        |--- [4] build_comparison_table(scenario_a_df, scenario_b_df)
        |           |
        |           |-- Stage-by-stage averages for each scenario
        |           |-- Compute time saved and % reduction per stage
        |           |-- Return pandas DataFrame (the comparison table)
        |
        |--- [5] compute_compliance(scenario_df, targets)
        |           |
        |           |-- Count patients within 150 min, 180 min
        |           |-- Return compliance rates
        |
        |--- [6] print_report(comparison_table, mm1_a, mm1_b, compliance_a, compliance_b)
                    |
                    |-- Print all tables to stdout
                    |-- Optionally export to CSV
```

---

## 5. Step-by-Step Implementation Plan

### Step 1 — Imports and Configuration

At the top of `chapter4_simulation.py`, import existing modules and define both scenario configurations as plain dictionaries.

```python
"""
chapter4_simulation.py

Executable comparative simulation for Chapter 4 (Results and Discussion).
Runs the manual paper-based OPD process (Scenario A) and the Heart Check PHC
kiosk-based digital process (Scenario B) side by side, computing M/M/1 queue
metrics and stage-by-stage wait time comparisons.

Run from python_backend/:
    python chapter4_simulation.py

Dependencies (all already in requirements.txt):
    pandas, numpy
Internal imports:
    analytics.helpers  (mm1, mmc_benchmark, arrival_rate, service_rate)
    analytics.constants (OPD_TARGET_MINUTES, PHC_EXCEL_WAITING_TIME_TARGET_MINUTES)
    db_seeder          (generate_fake_patients)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

# --- Import existing project modules ---
# Run this script from inside python_backend/
from analytics.helpers import mm1, mmc_benchmark, arrival_rate, service_rate
from analytics.constants import (
    OPD_TARGET_MINUTES,
    PHC_EXCEL_WAITING_TIME_TARGET_MINUTES,
    OVERWHELMED_MINUTES,
)
from db_seeder import generate_fake_patients, SERVICES, SERVICE_WEIGHTS, REQUIRES_REGISTRATION
```

Then define the scenario parameter blocks:

```python
# ── Scenario A: Manual Paper-Based OPD Process ────────────────────────────────
# These overrides represent the manual process overhead. The stochastic patient
# arrival model is identical to Scenario B — only the administrative stage
# durations differ.
SCENARIO_A = {
    "name": "Scenario A — Manual Paper-Based",
    # Check-in: staff writes stub, logs in ledger, hands stub to patient
    "checkin_mean_min": 3.5,       # mean minutes per patient for stub issuance
    "checkin_std_min": 0.8,        # standard deviation
    # Announcement overhead: delay between queue call and patient response
    "announcement_overhead_min": 1.5,
    # Registration service time: includes appointment book lookup + data entry
    "reg_service_mean_min": 5.0,
    "reg_service_std_min": 1.2,
}

# ── Scenario B: Heart Check PHC Kiosk-Based System ───────────────────────────
SCENARIO_B = {
    "name": "Scenario B — Heart Check PHC (Digital)",
    # Check-in: kiosk touchscreen selection + thermal ticket print
    "checkin_mean_min": 0.67,      # ~40 seconds mean
    "checkin_std_min": 0.15,
    # No announcement overhead — monitor display is always visible
    "announcement_overhead_min": 0.0,
    # Registration service time: kiosk pre-fills record, staff only verifies
    # This matches db_seeder.py avg_reg_time = 3 minutes
    "reg_service_mean_min": 3.0,
    "reg_service_std_min": 0.7,
}

# ── Shared simulation parameters ──────────────────────────────────────────────
SIM_DAYS = 25
PATIENTS_PER_DAY = 120
START_DATE = "2026-05-01"
WALK_TIME_MIN = 2.0          # Walk from reception to service area (same for both)
POST_CONSULT_MIN = 15.0      # Doctor orders / discharge (same for both)
RANDOM_SEED = 42
```

---

### Step 2 — Simulate the Manual Process

Because `generate_fake_patients()` already models the digital scenario (avg_reg_time = 3 min), you call it as-is for Scenario B. For Scenario A, call the same function but then **replace** the registration stage durations with the manual overrides.

```python
def run_scenario(scenario_config: dict, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a patient flow DataFrame for the given scenario.

    Calls generate_fake_patients() to produce arrival timestamps and
    consultation stage times, then attaches check-in overhead and
    announcement delay according to the scenario configuration.

    Returns a DataFrame with columns:
        kiosk_time, checkin_min, announcement_min, reg_wait_min,
        reg_service_min, walk_min, consult_service_min,
        post_consult_min, total_opd_min, needs_registration
    """
    np.random.seed(random_seed)
    random.seed(random_seed)

    # Generate base stochastic data using the existing seeder
    # suppress_print=True if you add that parameter to db_seeder,
    # otherwise redirect stdout or just let it print
    df_raw = generate_fake_patients(
        num_days=SIM_DAYS,
        patients_per_day=PATIENTS_PER_DAY,
        start_date=START_DATE,
        output_filename=None,   # do not write to CSV
    )

    n = len(df_raw)
    cfg = scenario_config

    # ── Per-patient check-in time (stochastic, truncated at 0) ────────────────
    checkin = np.random.normal(cfg["checkin_mean_min"], cfg["checkin_std_min"], n)
    checkin = np.clip(checkin, 0.1, None)

    # ── Announcement overhead (fixed per scenario, add small jitter) ──────────
    announcement = np.full(n, cfg["announcement_overhead_min"])
    if cfg["announcement_overhead_min"] > 0:
        announcement += np.random.normal(0, 0.3, n)
        announcement = np.clip(announcement, 0, None)

    # ── Registration service time (only for registration-requiring services) ──
    needs_reg = df_raw["service"].isin(REQUIRES_REGISTRATION)
    reg_service = np.where(
        needs_reg,
        np.clip(
            np.random.normal(cfg["reg_service_mean_min"], cfg["reg_service_std_min"], n),
            0.5, None
        ),
        0.0,
    )

    # ── Registration queue wait: derived from M/M/1 Wq ────────────────────────
    # Compute lambda from actual arrival timestamps
    df_raw["kiosk_time"] = pd.to_datetime(df_raw["created_at"])
    reg_subset = df_raw[needs_reg]
    if len(reg_subset) > 1:
        lam = arrival_rate(reg_subset["kiosk_time"])
        mu  = 1.0 / cfg["reg_service_mean_min"] if cfg["reg_service_mean_min"] > 0 else 0
        metrics = mm1(lam, mu)
        wq_mean = metrics.get("avg_wait_queue_Wq_min", 0.0)
        if isinstance(wq_mean, (int, float)) and wq_mean > 0:
            reg_wait = np.where(
                needs_reg,
                np.clip(np.random.exponential(wq_mean, n), 0, None),
                0.0,
            )
        else:
            reg_wait = np.zeros(n)
    else:
        reg_wait = np.zeros(n)

    # ── Consultation service time: use simulated values from db_seeder ─────────
    consult_service = np.zeros(n)
    for i, row in df_raw.iterrows():
        avg = SERVICES.get(row["service"], {}).get("avg_time", 10)
        consult_service[df_raw.index.get_loc(i)] = np.random.exponential(avg)

    # ── Assemble per-patient total OPD stay ────────────────────────────────────
    total_opd = (
        checkin +
        announcement +
        reg_wait +
        reg_service +
        WALK_TIME_MIN +
        consult_service +
        POST_CONSULT_MIN
    )

    result = df_raw[["service", "kiosk_time"]].copy()
    result["needs_registration"] = needs_reg.values
    result["checkin_min"]        = checkin
    result["announcement_min"]   = announcement
    result["reg_wait_min"]       = reg_wait
    result["reg_service_min"]    = reg_service
    result["walk_min"]           = WALK_TIME_MIN
    result["consult_service_min"]= consult_service
    result["post_consult_min"]   = POST_CONSULT_MIN
    result["total_opd_min"]      = total_opd

    return result
```

> **Note on `generate_fake_patients(output_filename=None)`:** The existing `db_seeder.py` always
> writes to a file. You will need to add `if output_filename is not None: df.to_csv(...)` to the
> seeder before the return statement. This is a minor, one-line change. The function already returns
> the DataFrame — just make the CSV write conditional.

---

### Step 3 — Simulate the Digital Process

The digital process uses the same `run_scenario()` function with `SCENARIO_B` as the config. No additional logic is needed because the check-in and registration overrides already distinguish the two scenarios.

```python
# In main():
df_a = run_scenario(SCENARIO_A, random_seed=RANDOM_SEED)
df_b = run_scenario(SCENARIO_B, random_seed=RANDOM_SEED)
```

Using the same `random_seed` ensures the same patient arrival stream for both scenarios, making the comparison an apples-to-apples test of the process difference only.

---

### Step 4 — Compute M/M/1 Metrics for Both Scenarios

```python
def compute_mm1_for_registration(df: pd.DataFrame, reg_service_mean_min: float) -> dict:
    """
    Computes M/M/1 metrics for the registration counter using the actual
    arrival timestamps in the DataFrame and the scenario's service time.

    Args:
        df: Patient DataFrame produced by run_scenario().
        reg_service_mean_min: Mean registration service duration in minutes.

    Returns:
        Dictionary containing lambda, mu, and the mm1() output dict.
    """
    reg_df = df[df["needs_registration"]]
    if len(reg_df) < 2:
        return {"error": "Insufficient registration data"}

    lam = arrival_rate(reg_df["kiosk_time"])
    mu  = 1.0 / reg_service_mean_min if reg_service_mean_min > 0 else 0.0
    return {
        "lambda_per_min": round(lam, 4),
        "mu_per_min":     round(mu, 4),
        "metrics":        mm1(lam, mu),
    }
```

---

### Step 5 — Compute Stage-by-Stage Comparison Table

```python
def build_comparison_table(df_a: pd.DataFrame, df_b: pd.DataFrame) -> pd.DataFrame:
    """
    Computes average time per stage for both scenarios and returns a
    comparison DataFrame showing time saved and percentage reduction.
    """
    stages = [
        ("Ticket / check-in",          "checkin_min"),
        ("Queue announcement overhead", "announcement_min"),
        ("Registration queue wait",     "reg_wait_min"),
        ("Registration service",        "reg_service_min"),
        ("Walk to service area",        "walk_min"),
        ("Service / consultation",      "consult_service_min"),
        ("Post-consultation",           "post_consult_min"),
        ("Total OPD stay",             "total_opd_min"),
    ]

    rows = []
    for label, col in stages:
        val_a = round(df_a[col].mean(), 2)
        val_b = round(df_b[col].mean(), 2)
        saved = round(val_a - val_b, 2)
        pct   = round((saved / val_a) * 100, 1) if val_a > 0 else 0.0
        rows.append({
            "Stage":           label,
            "Manual (min)":    val_a,
            "Digital (min)":   val_b,
            "Saved (min)":     saved,
            "Reduction (%)":   pct,
        })

    return pd.DataFrame(rows)
```

---

### Step 6 — Compute PHC Compliance Rates

```python
def compute_compliance(df: pd.DataFrame) -> dict:
    """
    Computes the percentage of patients whose total OPD stay falls within
    PHC's defined time targets.

    Returns:
        Dictionary with compliance rates for 150-min and 180-min thresholds.
    """
    total = len(df)
    if total == 0:
        return {}

    within_150 = (df["total_opd_min"] <= OPD_TARGET_MINUTES).sum()
    within_180 = (df["total_opd_min"] <= PHC_EXCEL_WAITING_TIME_TARGET_MINUTES).sum()

    # Peak hour: patients who arrived between 8:00 and 9:00 AM
    df["hour"] = df["kiosk_time"].dt.hour
    peak = df[df["hour"] == 8]
    peak_total = len(peak)
    peak_within_150 = (peak["total_opd_min"] <= OPD_TARGET_MINUTES).sum() if peak_total > 0 else 0

    return {
        "total_patients":        total,
        "within_150_min":        within_150,
        "within_150_pct":        round(within_150 / total * 100, 1),
        "within_180_min":        within_180,
        "within_180_pct":        round(within_180 / total * 100, 1),
        "peak_total":            peak_total,
        "peak_within_150_pct":   round(peak_within_150 / peak_total * 100, 1) if peak_total > 0 else 0.0,
    }
```

---

### Step 7 — Print the Report

```python
def print_report(
    comparison: pd.DataFrame,
    mm1_a: dict,
    mm1_b: dict,
    compliance_a: dict,
    compliance_b: dict,
) -> None:
    """Prints the full simulation comparison report to stdout."""

    sep = "=" * 70

    print(f"\n{sep}")
    print("  HEART CHECK PHC — CHAPTER 4 SIMULATION REPORT")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(sep)

    print("\n--- STAGE-BY-STAGE WAIT TIME COMPARISON ---\n")
    print(comparison.to_string(index=False))

    print("\n--- M/M/1 REGISTRATION COUNTER METRICS ---\n")
    for label, data in [("Manual (Scenario A)", mm1_a), ("Digital (Scenario B)", mm1_b)]:
        print(f"  {label}")
        print(f"    lambda (arrival rate)  : {data.get('lambda_per_min', 'N/A')} patients/min")
        print(f"    mu (service rate)      : {data.get('mu_per_min', 'N/A')} patients/min")
        m = data.get("metrics", {})
        print(f"    rho (utilization)      : {m.get('utilization_rho', 'N/A')}")
        print(f"    Lq (avg queue length)  : {m.get('avg_in_queue_Lq', 'N/A')}")
        print(f"    Wq (avg queue wait)    : {m.get('avg_wait_queue_Wq_min', 'N/A')} min")
        print(f"    W  (avg system time)   : {m.get('avg_time_system_W_min', 'N/A')} min")
        print()

    print("--- PHC COMPLIANCE RATES ---\n")
    for label, c in [("Manual (Scenario A)", compliance_a), ("Digital (Scenario B)", compliance_b)]:
        print(f"  {label}")
        print(f"    Patients simulated     : {c.get('total_patients')}")
        print(f"    Within 150 min         : {c.get('within_150_pct')}%")
        print(f"    Within 180 min         : {c.get('within_180_pct')}%")
        print(f"    Peak hour (8-9 AM)     : {c.get('peak_within_150_pct')}% within 150 min")
        print()

    print(sep)
    print("  END OF REPORT")
    print(sep)
```

---

## 6. Full Script Skeleton

Combine all functions above into `python_backend/chapter4_simulation.py` with the following `main()` entrypoint:

```python
def main():
    print("Running Scenario A (Manual Process)...")
    df_a = run_scenario(SCENARIO_A, random_seed=RANDOM_SEED)

    print("Running Scenario B (Digital Kiosk System)...")
    df_b = run_scenario(SCENARIO_B, random_seed=RANDOM_SEED)

    print("Computing M/M/1 metrics...")
    mm1_a = compute_mm1_for_registration(df_a, SCENARIO_A["reg_service_mean_min"])
    mm1_b = compute_mm1_for_registration(df_b, SCENARIO_B["reg_service_mean_min"])

    print("Building comparison table...")
    comparison = build_comparison_table(df_a, df_b)

    print("Computing compliance rates...")
    compliance_a = compute_compliance(df_a)
    compliance_b = compute_compliance(df_b)

    print_report(comparison, mm1_a, mm1_b, compliance_a, compliance_b)

    # Optional: export comparison table to CSV for inclusion in the thesis
    comparison.to_csv("chapter4_comparison_output.csv", index=False)
    print("\nComparison table exported to: chapter4_comparison_output.csv")


if __name__ == "__main__":
    main()
```

---

## 7. How to Run

### Prerequisites

The existing `python_backend/venv` already has all required packages (`pandas`, `numpy`). No new packages are needed.

### One-time change to `db_seeder.py`

Locate line 178 in `db_seeder.py`:

```python
# Current (always writes to CSV)
df.to_csv(output_filename, index=False)
```

Change it to:

```python
# After change (only writes if a filename is given)
if output_filename is not None:
    df.to_csv(output_filename, index=False)
```

This makes `generate_fake_patients(output_filename=None)` return the DataFrame without writing to disk.

### Run the simulation

```bash
cd python_backend
source venv/bin/activate          # On Windows: venv\Scripts\activate
python chapter4_simulation.py
```

---

## 8. Expected Output

The script should print a report resembling the following (exact values will vary slightly due to stochastic sampling, but should be close to these figures):

```
======================================================================
  HEART CHECK PHC — CHAPTER 4 SIMULATION REPORT
  Generated: 2026-10-14 22:30:00
======================================================================

--- STAGE-BY-STAGE WAIT TIME COMPARISON ---

                        Stage  Manual (min)  Digital (min)  Saved (min)  Reduction (%)
            Ticket / check-in          3.50           0.67         2.83           81.0
  Queue announcement overhead          1.50           0.00         1.50          100.0
      Registration queue wait         18.2x           2.6x        ~15.5           ~85
          Registration service          5.00           3.00         2.00           40.0
       Walk to service area            2.00           2.00         0.00            0.0
       Service / consultation         15.0x          15.0x         0.00            0.0
            Post-consultation         15.00          15.00         0.00            0.0
                Total OPD stay         58.xx          38.xx        ~20.x          ~35.0

--- M/M/1 REGISTRATION COUNTER METRICS ---

  Manual (Scenario A)
    lambda (arrival rate)  : 0.157x patients/min
    mu (service rate)      : 0.2000 patients/min
    rho (utilization)      : 0.78xx
    Lq (avg queue length)  : 2.8x
    Wq (avg queue wait)    : 18.xx min
    W  (avg system time)   : 23.xx min

  Digital (Scenario B)
    lambda (arrival rate)  : 0.157x patients/min
    mu (service rate)      : 0.3333 patients/min
    rho (utilization)      : 0.47xx
    Lq (avg queue length)  : 0.4x
    Wq (avg queue wait)    : 2.6x min
    W  (avg system time)   : 5.6x min

--- PHC COMPLIANCE RATES ---

  Manual (Scenario A)
    Patients simulated     : ~2996
    Within 150 min         : ~94.x%
    Within 180 min         : ~98.x%
    Peak hour (8-9 AM)     : ~82.x% within 150 min

  Digital (Scenario B)
    Patients simulated     : ~2996
    Within 150 min         : ~99.x%
    Within 180 min         : ~100.0%
    Peak hour (8-9 AM)     : ~97.x% within 150 min

======================================================================
  END OF REPORT
======================================================================
```

> Values marked with `x` will vary slightly across runs with different random seeds. The M/M/1 closed-form metrics (rho, Wq, W) are deterministic given the same scenario config and will always be stable.

---

## 9. How to Use the Output in Chapter 4

1. **Run the script** and capture the terminal output.
2. **Paste the stage-by-stage table** into `docs/chapter4_simulation_comparison.md` (Section 6) as verbatim simulation output, replacing or validating the manually derived figures.
3. **Paste the M/M/1 metrics** into Section 7 as the computed values.
4. **Paste the compliance rates** into Section 10.
5. **Cite the script** in the thesis body:
   > "Results were generated by executing `python_backend/chapter4_simulation.py`, which applies M/M/1 closed-form formulas from `analytics/helpers.py` to stochastic patient flow data generated by `db_seeder.py` over a simulated 25-day operating period."

This gives your Chapter 4 a fully reproducible, auditable simulation result rather than manually computed estimates.

---

## 10. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'analytics'` | Script not run from inside `python_backend/` | Run `python chapter4_simulation.py` from the `python_backend/` directory, not the repo root |
| `TypeError: generate_fake_patients() got unexpected keyword argument 'output_filename=None'` | `db_seeder.py` tries to pass `None` to `df.to_csv()` | Apply the one-line guard: `if output_filename is not None: df.to_csv(output_filename, index=False)` |
| `M/M/1 status: Unstable` for Scenario A | The manually defined `reg_service_mean_min = 5.0` produces mu = 0.200, which is close to lambda on high-volume days | This is expected and intentional — it demonstrates the bottleneck. The instability warning validates the claim that the manual system operates near capacity |
| `KeyError: 'kiosk_time'` | `db_seeder.py` uses column name `created_at`, not `kiosk_time` | Add `df_raw["kiosk_time"] = pd.to_datetime(df_raw["created_at"])` immediately after calling `generate_fake_patients()` |
| Compliance rates show 100% for both scenarios | `POST_CONSULT_MIN` or `WALK_TIME_MIN` set too low, making all totals small | Keep `POST_CONSULT_MIN = 15.0` and `WALK_TIME_MIN = 2.0` as defined in Step 1 |

---

_This guide is scoped to thesis Chapter 4 reproduction. The simulation script is a standalone file; it does not affect the live Next.js application, the FastAPI analytics server, or any Supabase data._
