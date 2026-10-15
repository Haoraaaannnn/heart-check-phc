# Chapter 4 Simulation — Build Guide (Consultation-Only, Real PHC Data)

**Script to create:** `python_backend/chapter4_simulation.py`

> **Scope correction from earlier draft:**
> The simulation is scoped **exclusively to the Consultation service** — the only service for which
> PHC has real historical timestamp data in Supabase (imported from the consultation room Excel
> sheets, March 2024 to December 2025). The `db_seeder.py` is disregarded entirely.
> Other services (Warfarin, Benzathine, ECG, etc.) have no timestamped records and cannot
> be included in a data-grounded comparison.

---

## Table of Contents

1. [Why Consultation-Only is the Right Choice](#1-why-consultation-only-is-the-right-choice)
2. [What Real Data You Have](#2-what-real-data-you-have)
3. [What the Simulation Computes](#3-what-the-simulation-computes)
4. [What Existing Modules to Reuse](#4-what-existing-modules-to-reuse)
5. [How Scenario A (Manual) is Reconstructed](#5-how-scenario-a-manual-is-reconstructed)
6. [How Scenario B (Digital) is Derived](#6-how-scenario-b-digital-is-derived)
7. [Step-by-Step Implementation Plan](#7-step-by-step-implementation-plan)
   - [Step 1 — Fetch Real Data from Supabase](#step-1--fetch-real-data-from-supabase)
   - [Step 2 — Preprocess with Existing Pipeline](#step-2--preprocess-with-existing-pipeline)
   - [Step 3 — Extract Consultation Baseline Metrics](#step-3--extract-consultation-baseline-metrics)
   - [Step 4 — Model the Manual Scenario Overhead](#step-4--model-the-manual-scenario-overhead)
   - [Step 5 — Model the Digital Scenario Overhead](#step-5--model-the-digital-scenario-overhead)
   - [Step 6 — Run M/M/1 for Both Scenarios](#step-6--run-mm1-for-both-scenarios)
   - [Step 7 — Compute Compliance Rates](#step-7--compute-compliance-rates)
   - [Step 8 — Print and Export the Report](#step-8--print-and-export-the-report)
8. [Full Script Skeleton](#8-full-script-skeleton)
9. [How to Run](#9-how-to-run)
10. [Expected Output Structure](#10-expected-output-structure)
11. [How to Use in Chapter 4](#11-how-to-use-in-chapter-4)
12. [Common Errors and Fixes](#12-common-errors-and-fixes)

---

## 1. Why Consultation-Only is the Right Choice

| Reason | Explanation |
|---|---|
| **Only real data available** | The PHC historical Excel files cover the consultation room only: Queuing Time (reg_start), Initial Assessment (reg_end), Doctor Seen (consult_start), Doctor Completed (consult_end), Carry Out Completed (carryout_end). No timestamps exist for Warfarin, Benzathine, ECG, etc. |
| **More defensible academically** | A simulation grounded in ~21 months of real PHC data (Mar 2024 – Dec 2025) is far stronger evidence than a synthetic simulation using invented service durations. |
| **Consultation is the primary service** | ~45% of daily OPD patients go through consultation, making it the dominant flow and the most meaningful bottleneck to analyze. |
| **The registration bottleneck lives here** | The registration counter is only used by Consultation (and OPD Screening). The time savings this system delivers are most concentrated at this exact stage. |

---

## 2. What Real Data You Have

The Supabase `patients` table (where `is_historical = true`) contains records imported from PHC's
Excel sheets covering the consultation room. The following columns are populated for historical rows:

| Supabase Column | PHC Excel Source | What It Represents |
|---|---|---|
| `created_at` (→ `kiosk_time` / `reg_start` after import) | "Queuing Time" | Patient arrived and joined the queue at the registration desk |
| `reg_start` | "Queuing Time" (same as created_at) | Start of registration wait |
| `reg_end` | "Initial Assessment" | Completed registration / initial assessment |
| `consult_start` | "Doctor Seen" | Doctor began seeing the patient |
| `consult_end` | "Doctor Completed" | Doctor finished with the patient |
| `carryout_end` | "Carry Out Completed" | Patient completed any carry-out orders |
| `is_historical` | — | `true` for all imported rows |
| `service` | — | `'consultation'` or `'Consultation'` |

> **Key note on `kiosk_time` for historical rows:** Because PHC did not deploy kiosk ticketing
> historically, `kiosk_time` (`created_at`) was mapped directly from the Queuing Time column
> (same value as `reg_start`). This means `wait_registration` (kiosk_time → reg_start) is
> always 0 for historical rows — which is correct. Historical patients had no kiosk step;
> they queued at the registration desk directly. This difference is exactly what the simulation
> compares against.

**What this means for the simulation:**
- The historical data gives you **real service durations** (`service_registration`, `service_consultation`, `service_carryout`) and **real inter-arrival times**.
- The simulation **adds manual overhead on top** of those real durations for Scenario A, and **adds kiosk overhead on top** for Scenario B.
- The comparison shows how the administrative scaffolding around the same clinical visit differs.

---

## 3. What the Simulation Computes

For each patient record in the historical consultation data, the simulation reconstructs two scenarios:

**Scenario A — Manual (what PHC had before / the baseline captured in the data):**
```
reg_start
    + manual_stub_issuance_time (new overhead, added)
    + registration_queue_wait   (derived from M/M/1 Wq using real lambda/mu)
    + service_registration      (real: reg_end - reg_start)
    + wait_consultation         (real: consult_start - reg_end)
    + service_consultation      (real: consult_end - consult_start)
    + service_carryout          (real: carryout_end - consult_end, where available)
= total_opd_time_manual
```

**Scenario B — Digital (what Heart Check PHC adds):**
```
kiosk_checkin_time              (new overhead, added — replaces stub issuance)
    + digital_registration_wait (derived from M/M/1 Wq with reduced mu)
    + service_registration      (real: same clinical work, same duration)
    + wait_consultation         (real: unchanged — clinical flow, not admin)
    + service_consultation      (real: unchanged)
    + service_carryout          (real: unchanged)
= total_opd_time_digital
```

The **time saved per patient = total_opd_time_manual - total_opd_time_digital**, driven entirely
by the difference in stub issuance time and registration queue wait (the two stages the system
directly replaces).

---

## 4. What Existing Modules to Reuse

Do not rewrite any of these. Import and call them directly.

| File | Import | Purpose in Simulation |
|---|---|---|
| `main.py` | `fetch_supabase_table()`, `normalize_dataframe()` | Fetch and normalize the real historical data from Supabase |
| `analytics/preprocessing.py` | `preprocess_queue_data()` | Compute all derived duration columns (`service_registration`, `service_consultation`, `wait_registration`, etc.) |
| `analytics/helpers.py` | `mm1()`, `arrival_rate()`, `service_rate()` | Compute M/M/1 metrics for both scenarios |
| `analytics/constants.py` | `OPD_TARGET_MINUTES`, `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES`, `OVERWHELMED_MINUTES` | PHC compliance thresholds |

---

## 5. How Scenario A (Manual) is Reconstructed

The historical data already captures the real clinical durations (registration service, consultation, carryout). What it does **not** capture is the administrative overhead that the staff performed before the patient got to the counter — because in the manual process, those steps were invisible to the tracking sheet (the sheet only starts from Queuing Time, which is when the patient reached the desk).

For Scenario A, add the following overhead **per patient** on top of the real data:

| Overhead Component | Value | Basis |
|---|---|---|
| Manual stub issuance time | Normal(mean=3.5 min, sd=0.8) | MISD staff interview / observation |
| Queue announcement delay | 1.5 min (fixed + small jitter) | Observation: PA call lag before patient responds |
| **Total pre-desk overhead added** | **~5.0 min per patient (avg)** | |

These values are additive on top of the real timestamps. The real timestamps (reg_start onward) stay unchanged.

---

## 6. How Scenario B (Digital) is Derived

For Scenario B, replace the manual stub issuance with kiosk check-in time and eliminate the announcement overhead:

| Component | Value | Basis |
|---|---|---|
| Kiosk check-in time | Normal(mean=0.67 min, sd=0.15) | System walkthrough (~40 sec) |
| Announcement overhead | 0 min (eliminated) | Monitor display replaces verbal calls |
| Registration service time | **Reduced** — draw from Normal(mean=3.0 min, sd=0.7) | Kiosk pre-fills the record; staff only verifies appointment. The real `service_registration` mean from historical data is your Scenario A baseline; Scenario B reduces it by the data-entry portion |
| All subsequent stages | Unchanged from real data | Clinical time is identical in both scenarios |

> **How to derive the Scenario B registration reduction:**
> Compute `service_registration.mean()` from the real data. That is your Scenario A registration
> service duration. For Scenario B, subtract the time that kiosk pre-population saves (data entry
> + ledger lookup, estimated at ~2.0 min based on observation). The result is your Scenario B
> registration service mean. If the real mean is, for example, 6.2 min, Scenario B becomes ~4.2 min.
> Use the **real data mean as the anchor**, not a hardcoded value.

---

## 7. Step-by-Step Implementation Plan

### Step 1 — Fetch Real Data from Supabase

```python
"""
chapter4_simulation.py

Executable Chapter 4 comparative simulation for Heart Check PHC.
Scoped to the Consultation service only — the sole service with real PHC
historical timestamp data in Supabase (imported from PHC Excel sheets,
March 2024 to December 2025).

Reuses existing analytics modules. Does not use db_seeder.py.

Run from python_backend/:
    python chapter4_simulation.py

Requirements:
    - .env.local must be present at the repo root with NEXT_PUBLIC_SUPABASE_URL
      and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).
    - pip packages: pandas, numpy, httpx, python-dotenv (all in requirements.txt)
"""

import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from repo root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env.local"))

# Import existing project modules
from analytics.helpers import mm1, arrival_rate, service_rate
from analytics.preprocessing import preprocess_queue_data
from analytics.constants import (
    OPD_TARGET_MINUTES,
    PHC_EXCEL_WAITING_TIME_TARGET_MINUTES,
    OVERWHELMED_MINUTES,
)

# Reuse main.py's fetch logic by importing its helper directly
# (main.py is in the same directory; this avoids re-implementing pagination)
from main import fetch_supabase_table, normalize_dataframe


def fetch_consultation_data() -> pd.DataFrame:
    """
    Fetches all historical consultation patient records from Supabase.

    Filters to is_historical=true to get only PHC-imported records with
    real timestamps. Filters service to 'consultation' (case-insensitive).

    Returns:
        Preprocessed DataFrame ready for analytics, or empty DataFrame if
        no records are found.
    """
    print("Fetching historical consultation records from Supabase...")

    raw = fetch_supabase_table(
        "patients",
        select=(
            "id,created_at,patientNum,service,status,"
            "reg_start,reg_end,consult_start,consult_end,"
            "carryout_start,carryout_end,cubicleNum,is_historical"
        ),
    )

    if not raw:
        print("ERROR: No data returned from Supabase. Check credentials and network.")
        sys.exit(1)

    df = pd.DataFrame(raw)
    df = normalize_dataframe(df)

    # Filter to historical consultation records only
    df = df[df.get("is_historical", pd.Series(False, index=df.index)).fillna(False).astype(bool)]

    if "purpose" not in df.columns and "service" in df.columns:
        df["purpose"] = df["service"]
    if "purpose" in df.columns:
        df["purpose"] = df["purpose"].str.lower().str.strip()
        df = df[df["purpose"] == "consultation"]

    if df.empty:
        print("ERROR: No historical consultation records found after filtering.")
        sys.exit(1)

    print(f"  Loaded {len(df)} historical consultation records.")

    # Run through the full preprocessing pipeline to get all derived columns
    df = preprocess_queue_data(df)

    # Drop rows with no usable service_registration or service_consultation data
    df = df[df["service_consultation"].notna() & (df["service_consultation"] > 0)]
    print(f"  {len(df)} records with complete consultation data after cleaning.")

    return df
```

---

### Step 2 — Preprocess with Existing Pipeline

`preprocess_queue_data()` (called above in Step 1) already computes:

| Column | What It Contains |
|---|---|
| `wait_registration` | kiosk_time → reg_start (always 0 for historical rows — no kiosk existed) |
| `service_registration` | reg_start → reg_end (actual time at the registration desk) |
| `wait_consultation` | reg_end → consult_start (waiting to be seen by the doctor) |
| `service_consultation` | consult_start → consult_end (time with the doctor) |
| `service_carryout` | carryout_start → carryout_end (carry-out stage, where available) |
| `total_time` | reg_start → carryout_end (or consult_end if no carryout) |

No additional preprocessing is needed. These are the ground-truth durations for the clinical stages.

---

### Step 3 — Extract Consultation Baseline Metrics

```python
def extract_baseline_metrics(df: pd.DataFrame) -> dict:
    """
    Computes descriptive statistics from the real historical data.
    These are the anchor values used to calibrate both scenarios.

    Args:
        df: Preprocessed consultation DataFrame from preprocess_queue_data().

    Returns:
        Dictionary of mean, std, and count for each measured stage.
    """
    def safe_stats(series: pd.Series) -> dict:
        clean = series.dropna()
        clean = clean[clean > 0]
        return {
            "mean": round(float(clean.mean()), 2) if not clean.empty else 0.0,
            "std":  round(float(clean.std()),  2) if len(clean) > 1 else 0.0,
            "n":    len(clean),
        }

    metrics = {
        "service_registration": safe_stats(df["service_registration"]),
        "wait_consultation":    safe_stats(df["wait_consultation"]),
        "service_consultation": safe_stats(df["service_consultation"]),
        "total_time":           safe_stats(df["total_time"]),
    }

    if "service_carryout" in df.columns:
        metrics["service_carryout"] = safe_stats(df["service_carryout"])

    # Real arrival rate from kiosk_time timestamps
    lam = arrival_rate(df["kiosk_time"])
    metrics["arrival_rate_lambda"] = round(lam, 4)

    print("\n--- REAL PHC DATA BASELINE (Consultation) ---")
    for k, v in metrics.items():
        if isinstance(v, dict):
            print(f"  {k}: mean={v['mean']} min, std={v['std']} min, n={v['n']}")
        else:
            print(f"  {k}: {v}")

    return metrics
```

---

### Step 4 — Model the Manual Scenario Overhead

```python
# ── Manual scenario overhead constants ────────────────────────────────────────
# These represent the pre-desk administrative overhead in the manual process:
# the time before a patient's Queuing Time (reg_start) was recorded.
# Historical data does NOT capture this — it starts at reg_start.
# These are added to reconstruct the full manual experience.

MANUAL_STUB_MEAN_MIN  = 3.5   # Mean stub issuance time (min) — MISD interview / observation
MANUAL_STUB_STD_MIN   = 0.8   # Standard deviation
MANUAL_ANNOUNCE_MIN   = 1.5   # Announcement overhead per patient (fixed + jitter)
MANUAL_ANNOUNCE_STD   = 0.3   # Jitter on announcement

# Registration service time reduction due to kiosk pre-fill (Scenario B only)
# The kiosk eliminates the data-entry and appointment-lookup portion of registration.
# Estimated at ~2.0 min based on MISD interview. Applied as a reduction from the
# real service_registration mean observed in the data.
DIGITAL_REG_REDUCTION_MIN = 2.0

# Kiosk check-in constants (Scenario B)
KIOSK_CHECKIN_MEAN_MIN = 0.67   # ~40 seconds mean
KIOSK_CHECKIN_STD_MIN  = 0.15


def add_manual_overhead(df: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """
    Adds manual process overhead columns to each patient row for Scenario A.

    Adds stub_issuance_min and announcement_min as stochastic per-patient values.
    The real historical columns (service_registration, service_consultation, etc.)
    are kept unchanged — the overhead is additive.

    Args:
        df: Preprocessed consultation DataFrame.
        seed: Random seed for reproducibility.

    Returns:
        DataFrame with additional overhead columns for Scenario A.
    """
    rng = np.random.default_rng(seed)
    n = len(df)

    df = df.copy()
    df["stub_issuance_min"] = np.clip(
        rng.normal(MANUAL_STUB_MEAN_MIN, MANUAL_STUB_STD_MIN, n),
        0.5, None
    )
    df["announcement_min"] = np.clip(
        rng.normal(MANUAL_ANNOUNCE_MIN, MANUAL_ANNOUNCE_STD, n),
        0.0, None
    )
    return df


def add_digital_overhead(df: pd.DataFrame, baseline: dict, seed: int = 42) -> pd.DataFrame:
    """
    Adds digital process overhead columns to each patient row for Scenario B.

    Adds kiosk_checkin_min. Sets announcement_min to 0.
    Reduces service_registration by DIGITAL_REG_REDUCTION_MIN (kiosk pre-fill benefit).

    Args:
        df: Preprocessed consultation DataFrame (same as Scenario A base).
        baseline: Baseline metrics dict from extract_baseline_metrics().
        seed: Random seed for reproducibility.

    Returns:
        DataFrame with digital overhead columns for Scenario B.
    """
    rng = np.random.default_rng(seed)
    n = len(df)

    df = df.copy()
    df["stub_issuance_min"] = np.clip(
        rng.normal(KIOSK_CHECKIN_MEAN_MIN, KIOSK_CHECKIN_STD_MIN, n),
        0.1, None
    )
    df["announcement_min"] = 0.0

    # Reduce registration service time by the kiosk pre-fill benefit,
    # but floor at 1.0 min (some minimum clinical interaction always remains)
    df["service_registration_digital"] = np.clip(
        df["service_registration"].fillna(0) - DIGITAL_REG_REDUCTION_MIN,
        1.0, None
    )
    return df
```

---

### Step 5 — Compute Per-Patient Total OPD Time for Both Scenarios

```python
def compute_scenario_totals(df_a: pd.DataFrame, df_b: pd.DataFrame) -> tuple:
    """
    Computes total OPD stay per patient for both scenarios.

    Scenario A total = stub_issuance + announcement + service_registration
                       + wait_consultation + service_consultation
                       + service_carryout (if available)

    Scenario B total = kiosk_checkin + service_registration_digital
                       + wait_consultation + service_consultation
                       + service_carryout (if available)

    Note: wait_consultation and service_consultation are REAL data —
          identical for both scenarios (clinical time is unchanged).
    """
    carryout_col = "service_carryout" if "service_carryout" in df_a.columns else None

    def total(df, reg_col):
        base = (
            df["stub_issuance_min"].fillna(0) +
            df["announcement_min"].fillna(0) +
            df[reg_col].fillna(0) +
            df["wait_consultation"].fillna(0) +
            df["service_consultation"].fillna(0)
        )
        if carryout_col:
            base += df[carryout_col].fillna(0)
        return base

    df_a = df_a.copy()
    df_a["total_opd_sim"] = total(df_a, "service_registration")

    df_b = df_b.copy()
    df_b["total_opd_sim"] = total(df_b, "service_registration_digital")

    return df_a, df_b
```

---

### Step 6 — Run M/M/1 for Both Scenarios

```python
def compute_mm1_registration(df: pd.DataFrame, reg_service_mean_min: float) -> dict:
    """
    Computes M/M/1 metrics for the registration counter.

    Uses the real arrival rate derived from historical kiosk_time timestamps
    and the scenario-specific mean registration service time.

    Args:
        df: Historical consultation DataFrame.
        reg_service_mean_min: Mean registration service duration for this scenario.

    Returns:
        Dictionary with lambda, mu, and mm1() output.
    """
    lam = arrival_rate(df["kiosk_time"])
    mu  = 1.0 / reg_service_mean_min if reg_service_mean_min > 0 else 0.0
    return {
        "lambda_per_min": round(lam, 4),
        "mu_per_min":     round(mu, 4),
        "metrics":        mm1(lam, mu),
    }
```

The M/M/1 registration wait (Wq) is the **analytically derived** queue wait. For the per-patient
simulation, you can sample Wq-based waiting times from an exponential distribution (mean = Wq)
or simply report the theoretical Wq as the average — either is valid for a thesis.

---

### Step 7 — Compute Compliance Rates

```python
def compute_compliance(df: pd.DataFrame, total_col: str = "total_opd_sim") -> dict:
    """
    Computes PHC compliance rates against the 150-min and 180-min targets.

    Args:
        df: Scenario DataFrame with a total_opd_sim column.
        total_col: Column name for the per-patient total OPD time.

    Returns:
        Compliance statistics dictionary.
    """
    total = len(df)
    if total == 0:
        return {"error": "No data"}

    within_150 = (df[total_col] <= OPD_TARGET_MINUTES).sum()
    within_180 = (df[total_col] <= PHC_EXCEL_WAITING_TIME_TARGET_MINUTES).sum()

    # Peak arrival hour: 8:00 AM (hour == 8 in Manila time)
    peak = df[df["hour"] == 8] if "hour" in df.columns else pd.DataFrame()
    peak_n = len(peak)
    peak_within_150 = (peak[total_col] <= OPD_TARGET_MINUTES).sum() if peak_n > 0 else 0

    return {
        "total_patients":      total,
        "within_150_pct":      round(within_150 / total * 100, 1),
        "within_180_pct":      round(within_180 / total * 100, 1),
        "peak_n":              peak_n,
        "peak_within_150_pct": round(peak_within_150 / peak_n * 100, 1) if peak_n > 0 else 0.0,
    }
```

---

### Step 8 — Print and Export the Report

```python
def build_stage_comparison(df_a: pd.DataFrame, df_b: pd.DataFrame, baseline: dict) -> pd.DataFrame:
    """
    Builds the stage-by-stage comparison table.
    Real historical values are used for clinical stages (unchanged between scenarios).
    Only the administrative/overhead stages differ.
    """
    def mean(df, col, fallback=None):
        if col in df.columns:
            s = df[col].dropna()
            s = s[s > 0] if col not in ("announcement_min",) else s
            return round(float(s.mean()), 2) if not s.empty else 0.0
        return fallback or 0.0

    reg_mean_real = baseline["service_registration"]["mean"]
    reg_b_mean    = max(1.0, reg_mean_real - DIGITAL_REG_REDUCTION_MIN)

    rows = [
        {
            "Stage":                  "Ticket / check-in",
            "Manual (min)":           mean(df_a, "stub_issuance_min"),
            "Digital (min)":          mean(df_b, "stub_issuance_min"),
        },
        {
            "Stage":                  "Queue announcement overhead",
            "Manual (min)":           mean(df_a, "announcement_min"),
            "Digital (min)":          0.00,
        },
        {
            "Stage":                  "Registration service (real data anchor)",
            "Manual (min)":           reg_mean_real,
            "Digital (min)":          reg_b_mean,
        },
        {
            "Stage":                  "Wait for consultation (real)",
            "Manual (min)":           baseline["wait_consultation"]["mean"],
            "Digital (min)":          baseline["wait_consultation"]["mean"],
        },
        {
            "Stage":                  "Consultation service (real)",
            "Manual (min)":           baseline["service_consultation"]["mean"],
            "Digital (min)":          baseline["service_consultation"]["mean"],
        },
        {
            "Stage":                  "Carryout (real, where recorded)",
            "Manual (min)":           baseline.get("service_carryout", {}).get("mean", 0.0),
            "Digital (min)":          baseline.get("service_carryout", {}).get("mean", 0.0),
        },
        {
            "Stage":                  "TOTAL OPD STAY (simulated)",
            "Manual (min)":           round(float(df_a["total_opd_sim"].mean()), 2),
            "Digital (min)":          round(float(df_b["total_opd_sim"].mean()), 2),
        },
    ]

    result = pd.DataFrame(rows)
    result["Saved (min)"] = (result["Manual (min)"] - result["Digital (min)"]).round(2)
    result["Reduction (%)"] = result.apply(
        lambda r: round(r["Saved (min)"] / r["Manual (min)"] * 100, 1) if r["Manual (min)"] > 0 else 0.0,
        axis=1,
    )
    return result


def print_report(comparison, mm1_a, mm1_b, compliance_a, compliance_b, baseline):
    sep = "=" * 72
    print(f"\n{sep}")
    print("  HEART CHECK PHC — CHAPTER 4 SIMULATION REPORT")
    print("  Scope: Consultation Service | Source: Real PHC Historical Data")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(sep)

    print(f"\n  Real data anchor: {baseline['service_consultation']['n']} consultation")
    print(f"  records from PHC historical import (Mar 2024 – Dec 2025).\n")

    print("--- STAGE-BY-STAGE COMPARISON ---\n")
    print(comparison.to_string(index=False))

    print("\n--- M/M/1 REGISTRATION COUNTER ---\n")
    for label, data in [("Scenario A — Manual", mm1_a), ("Scenario B — Digital", mm1_b)]:
        m = data.get("metrics", {})
        print(f"  {label}")
        print(f"    lambda  : {data.get('lambda_per_min')} patients/min (from real arrival data)")
        print(f"    mu      : {data.get('mu_per_min')} patients/min")
        print(f"    rho     : {m.get('utilization_rho', 'N/A')}")
        print(f"    Lq      : {m.get('avg_in_queue_Lq', 'N/A')} patients")
        print(f"    Wq      : {m.get('avg_wait_queue_Wq_min', 'N/A')} min")
        print(f"    W       : {m.get('avg_time_system_W_min', 'N/A')} min")
        print()

    print("--- PHC COMPLIANCE RATES ---\n")
    for label, c in [("Scenario A — Manual", compliance_a), ("Scenario B — Digital", compliance_b)]:
        print(f"  {label}")
        print(f"    Patients            : {c['total_patients']}")
        print(f"    Within 150 min      : {c['within_150_pct']}%")
        print(f"    Within 180 min      : {c['within_180_pct']}%")
        print(f"    Peak hour (8-9 AM)  : {c['peak_within_150_pct']}% within 150 min  (n={c['peak_n']})")
        print()

    print(sep)
    print("  END OF REPORT")
    print(sep)
```

---

## 8. Full Script Skeleton

Wire all functions into a `main()` entrypoint:

```python
def main():
    # 1. Fetch real historical consultation data
    df = fetch_consultation_data()

    # 2. Extract baseline metrics from the real data
    baseline = extract_baseline_metrics(df)

    # 3. Build Scenario A: real data + manual overhead
    df_a = add_manual_overhead(df, seed=42)

    # 4. Build Scenario B: real data + digital overhead
    df_b = add_digital_overhead(df, baseline, seed=42)

    # 5. Compute per-patient total OPD times for both scenarios
    df_a, df_b = compute_scenario_totals(df_a, df_b)

    # 6. M/M/1 metrics — lambda from real data, mu from scenario config
    reg_service_mean_a = baseline["service_registration"]["mean"]
    reg_service_mean_b = max(1.0, reg_service_mean_a - DIGITAL_REG_REDUCTION_MIN)
    mm1_a = compute_mm1_registration(df, reg_service_mean_a)
    mm1_b = compute_mm1_registration(df, reg_service_mean_b)

    # 7. Compliance rates
    compliance_a = compute_compliance(df_a)
    compliance_b = compute_compliance(df_b)

    # 8. Build comparison table and print report
    comparison = build_stage_comparison(df_a, df_b, baseline)
    print_report(comparison, mm1_a, mm1_b, compliance_a, compliance_b, baseline)

    # 9. Export to CSV
    comparison.to_csv("chapter4_comparison_output.csv", index=False)
    df_a[["total_opd_sim"]].describe().round(2).to_csv("chapter4_scenario_a_stats.csv")
    df_b[["total_opd_sim"]].describe().round(2).to_csv("chapter4_scenario_b_stats.csv")
    print("\nExported: chapter4_comparison_output.csv")
    print("Exported: chapter4_scenario_a_stats.csv")
    print("Exported: chapter4_scenario_b_stats.csv")


if __name__ == "__main__":
    main()
```

---

## 9. How to Run

No new packages are needed. Everything is already in `requirements.txt`.

```bash
cd python_backend
source venv/bin/activate        # Windows: venv\Scripts\activate
python chapter4_simulation.py
```

The script reads from your live Supabase instance using the credentials in `.env.local`.

---

## 10. Expected Output Structure

Exact numbers depend on your real historical data. The structure will be:

```
========================================================================
  HEART CHECK PHC — CHAPTER 4 SIMULATION REPORT
  Scope: Consultation Service | Source: Real PHC Historical Data
  Generated: 2026-10-15 ...
========================================================================

  Real data anchor: XXXX consultation
  records from PHC historical import (Mar 2024 – Dec 2025).

--- STAGE-BY-STAGE COMPARISON ---

                            Stage  Manual (min)  Digital (min)  Saved (min)  Reduction (%)
                Ticket / check-in          3.5x          0.6x         2.8x          ~81.0
  Queue announcement overhead             1.5x          0.00         1.5x         100.0
  Registration service (real data)        X.XX          X.XX         X.XX           X.X
  Wait for consultation (real)            X.XX          X.XX         0.00           0.0
  Consultation service (real)             X.XX          X.XX         0.00           0.0
  Carryout (real, where recorded)         X.XX          X.XX         0.00           0.0
  TOTAL OPD STAY (simulated)             XX.XX         XX.XX         X.XX           X.X

--- M/M/1 REGISTRATION COUNTER ---

  Scenario A — Manual
    lambda  : X.XXXX patients/min (from real arrival data)
    mu      : X.XXXX patients/min
    rho     : X.XXXX
    Lq      : X.XXXX patients
    Wq      : XX.XX min
    W       : XX.XX min

  Scenario B — Digital
    lambda  : X.XXXX patients/min (from real arrival data)
    mu      : X.XXXX patients/min
    rho     : X.XXXX
    Lq      : X.XXXX patients
    Wq      : X.XX min
    W       : X.XX min

--- PHC COMPLIANCE RATES ---

  Scenario A — Manual
    Patients            : XXXX
    Within 150 min      : XX.X%
    Within 180 min      : XX.X%
    Peak hour (8-9 AM)  : XX.X% within 150 min  (n=XXX)

  Scenario B — Digital
    Patients            : XXXX
    Within 150 min      : XX.X%
    Within 180 min      : XX.X%
    Peak hour (8-9 AM)  : XX.X% within 150 min  (n=XXX)
```

---

## 11. How to Use in Chapter 4

1. **Run the script.** Capture terminal output.
2. **Replace the manually derived tables** in `docs/chapter4_simulation_comparison.md` (Sections 6, 7, 10) with the script's actual output. These numbers are now fully reproducible.
3. **Cite the data source** in the thesis body as:
   > "Stage durations for the consultation service are derived from XXX patient records imported from PHC's physical consultation room Excel tracking sheets (March 2024 to December 2025). Administrative overhead values for the manual scenario were obtained from structured observation and MISD staff interviews. The simulation was executed via `python_backend/chapter4_simulation.py`, applying M/M/1 closed-form formulas from `analytics/helpers.py` to the real historical arrival stream."
4. **For the manual scenario overhead**, cite the MISD interview and observation as the data source. The clinical stages are real data — only the pre-desk overhead is estimated.
5. **Export the CSVs** (`chapter4_comparison_output.csv`, `chapter4_scenario_a_stats.csv`, `chapter4_scenario_b_stats.csv`) and include them as appendices.

---

## 12. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `RuntimeError: Supabase URL/key are not configured` | `.env.local` not found or missing keys | Confirm `.env.local` is at the repo root and has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| `ModuleNotFoundError: No module named 'main'` | Script not run from inside `python_backend/` | `cd python_backend` first, then run |
| `ModuleNotFoundError: No module named 'analytics'` | Same cause | Run from `python_backend/` |
| `df is empty after filtering` | `is_historical` column not present or all rows are `false` | Confirm historical import was run. Check Supabase directly: `SELECT COUNT(*) FROM patients WHERE is_historical = true` |
| `service_registration all NaN` | Historical rows where `reg_start = reg_end = created_at` (import mapped Queuing Time to both) | Use `service_consultation` as the primary clinical metric; acknowledge this in the report |
| `mm1() returns {"status": "Unstable"}` | Real lambda exceeds mu for Scenario A | This is a valid and reportable finding — it means the manual process was operating at or above capacity. Report it as evidence of the bottleneck |

---

_This guide replaces the earlier draft that used `db_seeder.py` and synthetic service weights.
The simulation is now grounded entirely in real PHC historical data for the consultation service._
