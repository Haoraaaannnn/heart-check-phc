# Heart Check PHC -- Machine Learning & Data Pipeline Validation Report

**Date:** October 7, 2026  
**Scope:** Full audit of all ML computations, statistical models, and import/export data flow

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [ML Computation Validation](#3-ml-computation-validation)
   - 3.1 [Forecasting Algorithms (5 Models)](#31-forecasting-algorithms-5-models)
   - 3.2 [Queueing Theory (M/M/1 and M/M/c)](#32-queueing-theory-mm1-and-mmc)
   - 3.3 [Bottleneck Detection and Severity Classification](#33-bottleneck-detection-and-severity-classification)
   - 3.4 [Staffing Recommendation Engine](#34-staffing-recommendation-engine)
   - 3.5 [Little's Law Validation](#35-littles-law-validation)
4. [Import Data Pipeline Validation](#4-import-data-pipeline-validation)
   - 4.1 [PHC Excel Workbook Import](#41-phc-excel-workbook-import)
   - 4.2 [Tabular Dataset Import (CSV/XLSX)](#42-tabular-dataset-import-csvxlsx)
   - 4.3 [AM/PM Heuristic Correction](#43-ampm-heuristic-correction)
   - 4.4 [Timezone Handling on Import](#44-timezone-handling-on-import)
5. [Export Data Pipeline Validation](#5-export-data-pipeline-validation)
   - 5.1 [Excel Export Structure](#51-excel-export-structure)
   - 5.2 [Duration Computation Differences (Import vs Export)](#52-duration-computation-differences-import-vs-export)
   - 5.3 [Threshold Discrepancies](#53-threshold-discrepancies)
   - 5.4 [Row Filtering Differences](#54-row-filtering-differences)
6. [Import vs Export Data Discrepancy Analysis](#6-import-vs-export-data-discrepancy-analysis)
7. [Preprocessing Validation](#7-preprocessing-validation)
8. [Identified Issues and Findings](#8-identified-issues-and-findings)
9. [Summary of Validation Status](#9-summary-of-validation-status)

---

## 1. Executive Summary

This report validates every computational module in the Heart Check PHC analytics backend. The pipeline consists of:

- **5 forecasting algorithms** (SMA, WMA, EMA, Linear Regression, ARIMA) evaluated via walk-forward backtesting
- **M/M/1 and M/M/c queueing models** for registration, consultation, and specialized services
- **5-stage bottleneck detection** with 3-tier severity classification
- **Staffing recommendation engine** based on forecasted volume
- **Little's Law validation** (L = lambda x W)
- **PHC compliance summary** matching the manual paper tracking sheet

The import and export pipelines share the same Supabase data source but apply **different computation paths**, which is the root cause of discrepancies between imported data and exported data.

---

## 2. Architecture Overview

```
Source .xls/.xlsx/.csv files
        |
        v
+-------------------+       +------------------+
| importer.py       |       | import_phc_data  |
| (API endpoint)    |       | (standalone CLI)  |
+-------------------+       +------------------+
        |                            |
        v                            v
   Supabase 'patients' table (UTC timestamps)
        |
        +--------------------------------------+
        |                                      |
        v                                      v
  Analytics Pipeline                    Export Pipeline
  (preprocessing.py ->                  (export.py ->
   report.py ->                          build_phc_workbook)
   descriptive.py,
   forecasting.py,
   queue_metrics.py,
   staffing.py)
```

---

## 3. ML Computation Validation

### 3.1 Forecasting Algorithms (5 Models)

**File:** [forecasting.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py)

#### 3.1.1 Simple Moving Average (SMA)

| Aspect | Status | Details |
|--------|--------|---------|
| Formula | VALID | `np.mean(window)` -- standard arithmetic mean over sliding window |
| Window | VALID | Uses `WINDOW_SIZE = 2` from constants (minimum for moving averages) |
| Edge case | VALID | Falls back to overall average if `len(volumes) < window_size + 2` |

#### 3.1.2 Weighted Moving Average (WMA)

| Aspect | Status | Details |
|--------|--------|---------|
| Formula | VALID | `np.dot(w, weights) / weights.sum()` where weights = `[1, 2, ..., window_size]` |
| Weighting | VALID | Linear ascending weights -- most recent observation gets highest weight |
| Normalization | VALID | Divides by `weights.sum()` to ensure proper probability weighting |

#### 3.1.3 Exponential Moving Average (EMA)

| Aspect | Status | Details |
|--------|--------|---------|
| Formula | VALID | `alpha * volumes[i-1] + (1 - alpha) * current_ema` |
| Alpha | VALID | `EMA_ALPHA = 0.3` -- standard smoothing factor |
| Initialization | VALID | `current_ema = np.mean(volumes[:window_size])` -- initialized from first window mean |
| State tracking | VALID | `current_ema` updated on every iteration, maintaining state across the backtest |

#### 3.1.4 Linear Regression (LR)

| Aspect | Status | Details |
|--------|--------|---------|
| Implementation | VALID | `sklearn.linear_model.LinearRegression` |
| Feature | VALID | Single feature: day index `[0, 1, ..., window_size-1]` |
| Prediction | VALID | Predicts for index `window_size` (one step ahead) |
| Non-negativity | VALID | `max(0.0, prediction)` -- patient count cannot be negative |
| Chart data | VALID | R-squared computed manually: `1 - SS_res / SS_tot` with guard for `ss_tot > 0` |
| Trend | VALID | Derived from slope sign: positive = "increasing", negative = "decreasing", zero = "stable" |

#### 3.1.5 ARIMA

| Aspect | Status | Details |
|--------|--------|---------|
| Order | VALID | `(1, 1, 1)` -- standard starting point for seasonal OPD data |
| Backtest optimization | VALID | Refit every `ARIMA_REFIT_INTERVAL = 7` days instead of every iteration |
| Append strategy | VALID | Uses `result.append([history[-1]], refit=False)` between refits |
| Fallback | VALID | On exception, falls back to `np.mean(history)` and resets `result = None` |
| Non-negativity | VALID | `max(0.0, forecast)` applied to all ARIMA predictions |
| AIC | VALID | Reported from `result.aic` for model quality assessment |

#### 3.1.6 Model Selection

| Aspect | Status | Details |
|--------|--------|---------|
| Evaluation metric | VALID | MAE (Mean Absolute Error) -- appropriate for count data |
| RMSE | VALID | Also computed as secondary metric: `np.sqrt(MSE)` |
| Winner selection | VALID | `min(results, key=lambda k: results[k]["MAE"])` -- lowest MAE wins |
| Final forecast | VALID | Uses the winning algorithm's forecast from the latest window |

> [!NOTE]
> The `WINDOW_SIZE = 2` is very small for production forecasting. While it works for limited historical data, a larger window (5-7 days) would produce more stable forecasts once sufficient data is available. This is acceptable for the thesis deployment context.

---

### 3.2 Queueing Theory (M/M/1 and M/M/c)

**File:** [helpers.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py)

#### 3.2.1 Arrival Rate (lambda)

| Aspect | Status | Details |
|--------|--------|---------|
| Formula | VALID | `lambda = 1 / mean(inter_arrival_times)` |
| Inter-arrival filtering | VALID | Only positive inter-arrival times used (`inter > 0`) |
| Sort | VALID | Times sorted before differencing |
| Unit | VALID | Patients per minute |

#### 3.2.2 Service Rate (mu)

| Aspect | Status | Details |
|--------|--------|---------|
| Formula | VALID | `mu = 1 / mean(service_durations)` |
| Filtering | VALID | Only positive, non-null durations used |
| Unit | VALID | Patients per minute |

#### 3.2.3 M/M/1 Model

| Formula | Mathematical Standard | Implementation | Status |
|---------|----------------------|----------------|--------|
| rho = lambda / mu | Server utilization | `lam / mu` | VALID |
| Lq = rho^2 / (1 - rho) | Avg queue length | `rho**2 / (1 - rho)` | VALID |
| Wq = Lq / lambda | Avg wait in queue | `Lq / lam` | VALID |
| W = 1 / (mu - lambda) | Avg time in system | `1 / (mu - lam)` | VALID |
| Stability check | rho < 1 | Returns "Unstable" when `rho >= 1` | VALID |

#### 3.2.4 M/M/c Model (Erlang C)

| Formula | Mathematical Standard | Implementation | Status |
|---------|----------------------|----------------|--------|
| rho = lambda / (c * mu) | Per-server utilization | `lam / (c * mu)` | VALID |
| a = lambda / mu | Offered load | `lam / mu` | VALID |
| Sum terms | Sum(a^n/n!, n=0..c-1) | `sum(a**n / factorial(n) for n in range(c))` | VALID |
| Last term | (a^c/c!) * (c/(c-a)) | `(a**c / factorial(c)) * (c / (c - a))` | VALID |
| Pq (prob of wait) | Erlang C formula | `last_term / (sum_terms + last_term)` | VALID |
| Lq | Pq * rho / (1 - rho) | Correct | VALID |

> [!IMPORTANT]
> The `lam_mu_metrics` function in [helpers.py:L100-L113](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py#L100-L113) uses `service_consultation` for mu across ALL queue types (registration, cubicle, specialized). For the registration queue specifically, `service_registration` would be the more accurate service duration metric. This does not affect consultation cubicle metrics (which correctly use consultation duration) but means the registration M/M/1 metrics reflect consultation service rate rather than registration service rate.

---

### 3.3 Bottleneck Detection and Severity Classification

**File:** [descriptive.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/descriptive.py)

#### 3.3.1 Stage Pipeline (5 stages)

| Stage | Column Source | Computation | Status |
|-------|--------------|-------------|--------|
| Kiosk to Registration wait | `wait_registration` | `reg_start - kiosk_time` | VALID |
| Registration duration | `service_registration` | `reg_end - reg_start` | VALID |
| Registration to Consultation wait | `wait_consultation` | `consult_start - reg_end` | VALID |
| Consultation duration | `service_consultation` | `consult_end - consult_start` | VALID |
| Carryout duration | `service_carryout` | `carryout_end - carryout_start` | VALID |

#### 3.3.2 Severity Classification

| Level | Threshold | Status |
|-------|-----------|--------|
| Normal | avg <= 30 min | VALID |
| Elevated | 30 < avg <= 60 min | VALID |
| Overwhelmed | avg > 60 min | VALID |
| No Data | 0 qualifying patients | VALID |

#### 3.3.3 Primary Bottleneck Selection

| Aspect | Status | Details |
|--------|--------|---------|
| Ranking | VALID | Severity rank: Overwhelmed(3) > Elevated(2) > Normal(1) > No Data(0) |
| Tie-breaking | VALID | Higher `avg_minutes` breaks ties within same severity |
| No Data exclusion | VALID | Stages with "No Data" never selected as primary bottleneck |

---

### 3.4 Staffing Recommendation Engine

**File:** [staffing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/staffing.py)

| Aspect | Status | Details |
|--------|--------|---------|
| mu computation | VALID | `1 / avg_service_time_min` |
| lambda for consultation | VALID | `forecasted_patients * p_consultation / (opd_hours * 60)` |
| Minimum cubicles | VALID | `ceil(lambda / (mu * target_utilization))` |
| Capacity capping | VALID | `min(c, MAX_CUBICLES)` -- cannot exceed physical room capacity |
| Utilization | VALID | `lambda / (c_capped * mu)` |
| Warning generation | VALID | Warning issued when required cubicles exceed physical max |

---

### 3.5 Little's Law Validation

**File:** [queue_metrics.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py)

| Aspect | Status | Details |
|--------|--------|---------|
| L_observed | VALID | `lambda * W` (arrival rate times mean system time) |
| L_theoretical | **FINDING** | Uses `len(df)` (total patient count) rather than concurrent occupancy. See Finding F-01. |
| Match ratio | VALID | `L_observed / L_theoretical` |
| Tolerance | VALID | `abs(L_observed - L_theoretical) < 5` for "Validated" status |

> [!WARNING]
> **Finding F-01:** Little's Law states L = lambda * W where L is the average number of customers **in the system at any given time**, not the total count. Using `len(df)` (total records) as `L_theoretical` is a dimensional mismatch. `L_theoretical` should be the time-averaged concurrent occupancy. The match_ratio and status fields are therefore unreliable. The formula `lambda * W` for `L_observed` is itself correct, but the comparison target is wrong.

---

## 4. Import Data Pipeline Validation

### 4.1 PHC Excel Workbook Import

**Files:** [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py)

| Step | Implementation | Status |
|------|---------------|--------|
| Sheet date detection | Scans first 10 rows for "Date:" label, reads adjacent cell | VALID |
| Hospital column detection | Scans first 15 rows for "Hospital", prefers `col_idx >= 15` | VALID |
| Data extraction | Reads columns at offsets +1..+5 from Hospital column | VALID |
| Stop condition | Breaks at NaN, non-digit, or "0" hospital number | VALID |
| Validation | Requires non-null `reg_start, reg_end, consult_start, consult_end` | VALID |
| `carryout_end` | Optional -- not required for row validity | VALID |
| `carryout_start` derivation | Set to `consult_end` where `carryout_end` is present, else null | VALID |

> [!NOTE]
> The `importer.py` (API endpoint) and `import_phc_data.py` (standalone CLI) contain **duplicated extraction logic**. Both implement near-identical `extract_sheet_data` / `extract_phc_sheet_data` functions. The importer.py version additionally has a fallback check `if "extract_sheet_data" in globals()` at line 170, which is dead code since `extract_sheet_data` is not defined in that module's global scope -- it will always call `extract_phc_sheet_data`.

### 4.2 Tabular Dataset Import (CSV/XLSX)

**File:** [importer.py:L246-L372](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L246-L372)

| Aspect | Status | Details |
|--------|--------|---------|
| Column name normalization | VALID | Maps common aliases (e.g., "queuing_time" -> "reg_start") |
| patientNum fallback | VALID | Auto-generates `IMP-0001` series if no patient ID column exists |
| created_at fallback | VALID | Falls back to `reg_start`, then `datetime.utcnow()` |
| Timezone handling | **FINDING** | See Section 4.4 |

### 4.3 AM/PM Heuristic Correction

**File:** [importer.py:L42-L74](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L42-L74)

| Aspect | Status | Details |
|--------|--------|---------|
| Rule | VALID for PHC context | Hours 1-7 shifted to 13-19 (PM correction) |
| Rationale | DOCUMENTED | PHC afternoon clinic hours mean 1:00-7:00 AM values are actually PM |
| Risk | **FINDING** | See Finding F-02 |

> [!WARNING]
> **Finding F-02:** The AM/PM heuristic applies a blanket +12 hour shift to ALL timestamps with hours 1-7. This is correct for PHC's afternoon OPD clinic but would corrupt data from any morning clinic that genuinely records timestamps between 1:00-7:00 AM. If PHC ever expands to morning OPD shifts, this heuristic must be gated by a clinic-type flag.

### 4.4 Timezone Handling on Import

**Import path (PHC Excel):**
```
Raw Excel time (no TZ) 
  -> AM/PM heuristic applied
  -> Combined with sheet date
  -> tz_localize("Asia/Manila")
  -> tz_convert("UTC")
  -> Stored in Supabase as UTC
```

**Import path (Tabular CSV/XLSX):**
```
Raw timestamp
  -> pd.to_datetime(..., utc=True)
  -> Formatted as ISO 8601 with +0000
  -> Stored in Supabase as UTC
```

| Aspect | Status | Details |
|--------|--------|---------|
| PHC Excel: Manila -> UTC | VALID | Correctly localizes to Manila, then converts to UTC |
| Tabular: force UTC | **FINDING** | See Finding F-03 |

> [!WARNING]
> **Finding F-03:** The tabular import path (`process_tabular_dataset`) calls `pd.to_datetime(df[c], errors="coerce", utc=True)`. If the source CSV contains timestamps already in Asia/Manila local time (without timezone info), this forces them to be interpreted as UTC, creating an **8-hour offset**. The PHC Excel path correctly handles this by localizing to Manila first. Any CSV data originating from Manila-time sources will have all timestamps shifted 8 hours earlier than reality.

---

## 5. Export Data Pipeline Validation

### 5.1 Excel Export Structure

**File:** [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py)

| Aspect | Status | Details |
|--------|--------|---------|
| Sheet-per-day grouping | VALID | Groups by Manila-date derived from `reg_start` |
| Column layout | VALID | 10 columns (A-J): 5 timestamps + 5 durations |
| Header styling | VALID | Matches PHC's own Time and Motion Analysis format |
| Summary block | VALID | 4-row compliance summary at bottom of each sheet |
| Hospital Number exclusion | VALID | Intentionally omitted for security (documented in code) |

### 5.2 Duration Computation Differences (Import vs Export)

This is the **primary source of discrepancy** between imported data and exported data.

#### How analytics computes durations (via preprocessing.py):

```python
# In preprocessing.py -- used for dashboard analytics
wait_registration    = reg_start - kiosk_time          # kiosk -> registration
service_registration = reg_end - reg_start             # registration duration
wait_consultation    = consult_start - reg_end         # registration -> consultation
service_consultation = consult_end - consult_start     # consultation duration
service_carryout     = carryout_end - carryout_start   # carryout duration
total_time           = (consult_end - kiosk_time) + service_carryout.fillna(0)
```

#### How export computes durations (via export.py):

```python
# In export.py -- used for Excel export
g = reg_end - reg_start                # "Queuing Time to Initial Assessment"
h = consult_start - reg_end            # "Initial Assessment to Doctor Seen"
i = consult_end - consult_start        # "Doctor Seen to Completed"
j = carryout_end - consult_end         # "Doctor Completed to Carry Out Completed"
total = carryout_end - reg_start       # "Total Waiting Time"
```

| Duration | Analytics Formula | Export Formula | Match? |
|----------|------------------|----------------|--------|
| Registration duration | `reg_end - reg_start` | `reg_end - reg_start` (col F) | MATCH |
| Reg-to-Consult wait | `consult_start - reg_end` | `consult_start - reg_end` (col G) | MATCH |
| Consultation duration | `consult_end - consult_start` | `consult_end - consult_start` (col H) | MATCH |
| Carryout duration | `carryout_end - carryout_start` | `carryout_end - consult_end` (col I) | **MISMATCH** |
| Total time | `(consult_end - kiosk_time) + carryout.fillna(0)` | `carryout_end - reg_start` (col J) | **MISMATCH** |

> [!IMPORTANT]
> **Finding F-04 (Carryout Duration Mismatch):**
> - Analytics uses `carryout_end - carryout_start` where `carryout_start` was derived from `consult_end` during import
> - Export uses `carryout_end - consult_end` directly
> - **These are semantically equivalent** because `carryout_start = consult_end` by construction (set during import at [importer.py:L213](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L213)). However, for live (non-historical) patients, `carryout_start` could differ from `consult_end` if the system records them independently, creating a genuine discrepancy.

> [!IMPORTANT]
> **Finding F-05 (Total Time Mismatch -- Root Cause of Different Output):**
>
> | Path | Start Point | End Point | Carryout Handling |
> |------|-------------|-----------|-------------------|
> | Analytics | `kiosk_time` (created_at) | `consult_end` + carryout added | `service_carryout.fillna(0)` -- missing carryout treated as 0 |
> | Export | `reg_start` | `carryout_end` | If carryout_end is null, total is null (row shows blank) |
>
> **Discrepancy sources:**
> 1. **Different start timestamp:** Analytics starts from `kiosk_time` (when patient entered the kiosk). Export starts from `reg_start` (when queuing/registration began). The gap is `wait_registration` minutes.
> 2. **Different end handling:** Analytics ends at `consult_end` and adds carryout as an increment. Export requires `carryout_end` as the absolute endpoint -- if carryout_end is null, the total is blank. Analytics would still show a total_time (just without carryout).
> 3. **Null carryout handling:** Analytics uses `fillna(0)` so patients without carryout still get a total_time. Export shows blank for the total if carryout_end is missing.

### 5.3 Threshold Discrepancies

The analytics module and the export module use **different threshold representations** for the same PHC compliance buckets:

| Bucket | Analytics (constants.py) | Export (export.py) | Match? |
|--------|-------------------------|-------------------|--------|
| Waiting Time | 150 minutes | `timedelta(hours=2.5)` = 150 min | MATCH |
| Evaluate | 30 minutes | `timedelta(minutes=30)` = 30 min | MATCH |
| Examine & Treat | 105 minutes | `timedelta(hours=1)` = 60 min | **MISMATCH** |
| Carry Out | 15 minutes | `timedelta(minutes=15)` = 15 min | MATCH |

> [!IMPORTANT]
> **Finding F-06 (Examine & Treat Threshold Mismatch):**
> - `analytics/constants.py` defines `EXAMINE_TREAT_TARGET_MINUTES = 105` (1 hour 45 minutes)
> - `analytics/export.py` defines `EXAMINE_TREAT_THRESHOLD = timedelta(hours=1)` (60 minutes)
> - These are applied to the same concept ("Examine & treat Pts.") but use different thresholds
> - The analytics dashboard will classify patients differently than the Excel export's summary block
> - The export's 1-hour threshold matches the original PHC paper form label ("Examine & treat Pts. <= 1hr")
> - The analytics' 105-minute value appears to be a custom/adjusted target

### 5.4 Row Filtering Differences

| Filter | Analytics Path | Export Path | Impact |
|--------|---------------|-------------|--------|
| Day assignment | `kiosk_time` converted to Manila date | `reg_start` converted to Manila date | Patients who arrived at kiosk before midnight but started registration after midnight could appear on different dates |
| Null filtering | Keeps all rows; NaT durations become NaN averages | Drops rows where `reg_start` is null entirely | Export shows fewer rows than analytics for same date range |
| Carryout filtering | Includes patients without carryout data | Only shows carryout duration/total where both timestamps exist | Export total column has more blanks than analytics |

---

## 6. Import vs Export Data Discrepancy Analysis

### Complete Trace: One Patient's Journey Through Both Pipelines

**Example: Historical patient imported from PHC Excel**

#### Step 1: Import (importer.py)
```
Excel sheet values:
  Date: 2024-03-21
  Hospital Number: 01234567
  Queuing Time (reg_start):    07:30 (raw)  -> heuristic -> 07:30 (no change, hour=7 gets +12 -> 19:30? NO)
```

> [!WARNING]
> **Finding F-07 (AM/PM boundary ambiguity at hour=7):**
> The heuristic applies `if 1 <= hour <= 7: hour += 12`. This means hour=7 becomes 19 (7 PM).
> But PHC's OPD clinic hours typically start around 7:00-8:00 AM. A genuine 7:00 AM registration
> timestamp would be incorrectly shifted to 7:00 PM. The boundary condition at exactly hour=7
> is ambiguous -- it could be either 7 AM (early morning registration) or 7 PM (late afternoon).

#### Step 2: Stored in Supabase (UTC)
```
All timestamps stored as UTC after Manila -> UTC conversion (-8 hours)
e.g., 19:30 Manila = 11:30 UTC
```

#### Step 3: Analytics reads from Supabase
```
preprocessing.py:
  - Parses to UTC datetime
  - Derives: kiosk_time = created_at (which = reg_start from import)
  - Computes: total_time = (consult_end - kiosk_time) + carryout.fillna(0)
```

#### Step 4: Export reads from Supabase
```
export.py:
  - Converts timestamps back to Manila time for display
  - Computes: total = carryout_end - reg_start (as timedelta, displayed as H:MM:SS)
```

**Result:** The same patient can show different total times:
- Analytics: `(consult_end - created_at) + carryout_duration` -- starts from kiosk arrival
- Export: `carryout_end - reg_start` -- starts from registration start, requires carryout_end

---

## 7. Preprocessing Validation

**File:** [preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py)

### 7.1 Chronological Ordering (_chron_max)

| Aspect | Status | Details |
|--------|--------|---------|
| NaT preservation | VALID | Uses `skipna=False` to prevent NaT from being silently replaced |
| Chain enforcement | VALID | `kiosk_time <= reg_start <= reg_end <= consult_start <= consult_end` |
| Purpose | VALID | Prevents out-of-order timestamps from producing negative durations |

### 7.2 Live vs Historical Patient Handling

| Aspect | Status | Details |
|--------|--------|---------|
| Historical row protection | VALID | Historical rows never get `now()` fill -- NaT stays NaT |
| Today-only live fill | VALID | Only non-historical + today's-date rows get `now()` fill |
| Stale row protection | VALID | Live rows from previous days treated same as historical (no fill) |

### 7.3 Duration Gating

| Duration Column | Gating Condition | Status |
|----------------|------------------|--------|
| `wait_registration` | Always computed (kiosk_time -> reg_start) | VALID |
| `service_registration` | Only valid where `reg_end` was actually recorded | VALID |
| `wait_consultation` | Only valid where `reg_end` was actually recorded | VALID |
| `service_consultation` | Only valid where `consult_end` was actually recorded | VALID |
| `service_carryout` | Only valid where both `carryout_start` and `carryout_end` present | VALID |
| `total_time` | `(consult_end - kiosk_time) + service_carryout.fillna(0)` | VALID |

### 7.4 Clinic Type Classification

| Aspect | Status | Details |
|--------|--------|---------|
| Convention | VALID | cubicleNum starting with 'P' = pedia, else adult |
| Null handling | VALID | Null cubicleNum defaults to 'adult' |

---

## 8. Identified Issues and Findings

### Critical Findings

| ID | Severity | Module | Description |
|----|----------|--------|-------------|
| F-05 | **HIGH** | export.py vs preprocessing.py | Total time computation uses different start points (`kiosk_time` vs `reg_start`) and different end handling (additive carryout vs absolute endpoint). This is the primary cause of different numbers between the analytics dashboard and exported Excel files. |
| F-06 | **HIGH** | constants.py vs export.py | Examine & Treat threshold: 105 min in analytics vs 60 min in export. Same metric classified differently in dashboard versus exported summary. |
| F-03 | **HIGH** | importer.py | Tabular CSV import forces UTC interpretation on timezone-naive timestamps. Manila-time CSV data would be shifted by -8 hours. |

### Moderate Findings

| ID | Severity | Module | Description |
|----|----------|--------|-------------|
| F-01 | **MEDIUM** | queue_metrics.py | Little's Law `L_theoretical` uses total record count instead of time-averaged concurrent occupancy. Validation status unreliable. |
| F-02 | **MEDIUM** | importer.py | AM/PM heuristic would corrupt morning clinic data if PHC adds morning OPD shifts. |
| F-07 | **MEDIUM** | importer.py | Boundary condition: hour=7 is ambiguous between 7 AM (early registration) and 7 PM (late afternoon). |

### Low Findings

| ID | Severity | Module | Description |
|----|----------|--------|-------------|
| F-04 | **LOW** | export.py vs preprocessing.py | Carryout duration computed from different column pairs but semantically equivalent for historical data. Could diverge for live data. |
| -- | **LOW** | helpers.py | `lam_mu_metrics` uses `service_consultation` for mu even in registration context. Registration M/M/1 reflects consultation service rate. |
| -- | **LOW** | importer.py | Dead code at line 170: `if "extract_sheet_data" in globals()` always evaluates False in the importer module. |

---

## 9. Summary of Validation Status

### ML Computations

| Module | Validation Status |
|--------|------------------|
| SMA Forecasting | PASS |
| WMA Forecasting | PASS |
| EMA Forecasting | PASS |
| Linear Regression Forecasting | PASS |
| ARIMA Forecasting | PASS |
| Model Selection (MAE-based) | PASS |
| M/M/1 Queue Model | PASS |
| M/M/c (Erlang C) Benchmark | PASS |
| Bottleneck Detection (5-stage) | PASS |
| Severity Classification (3-tier) | PASS |
| Staffing Recommendation | PASS |
| Little's Law Validation | PASS (formula) / FAIL (comparison target) |
| PHC Compliance Summary | PASS |

### Data Pipeline

| Pipeline | Validation Status |
|----------|------------------|
| PHC Excel Import | PASS (with AM/PM heuristic caveat) |
| Tabular CSV/XLSX Import | CONDITIONAL PASS (UTC assumption for naive timestamps) |
| Preprocessing (duration computation) | PASS |
| Excel Export (structure & formatting) | PASS |
| Import-to-Export Round-Trip Consistency | **FAIL** -- see Findings F-05, F-06 |

### Root Cause of Import vs Export Difference

The exported data differs from imported/analytics data due to **three independent factors**:

1. **Total Time Start Point Mismatch (F-05):** Analytics measures from `kiosk_time`, export measures from `reg_start`. The difference equals the `wait_registration` stage duration.

2. **Carryout Null Handling (F-05):** Analytics uses `fillna(0)` to include patients without carryout in totals. Export shows blank, causing those patients to not contribute to the exported sheet's average.

3. **Examine & Treat Threshold (F-06):** The compliance summary bucket counts differ: analytics uses 105 min, export uses 60 min. A patient with 90 minutes of examine/treat time would be classified as "within threshold" by analytics but "exceeding threshold" by the export.

---

*End of validation report.*
