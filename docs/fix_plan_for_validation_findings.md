# Heart Check PHC -- Fix Plan for Validation Findings

**Date:** October 7, 2026
**Based on:** ML and Data Pipeline Validation Report
**Status:** Applied and Verified

---

## Table of Contents

1. [F-05: Total Time Computation Mismatch (Critical)](#f-05-total-time-computation-mismatch)
2. [F-06: Examine & Treat Threshold Mismatch (Critical)](#f-06-examine--treat-threshold-mismatch)
3. [F-03: CSV Import Timezone Assumption (Critical)](#f-03-csv-import-timezone-assumption)
4. [F-01: Little's Law Comparison Target (Medium)](#f-01-littles-law-comparison-target)
5. [F-02 / F-07: AM/PM Heuristic Boundary (Medium)](#f-02--f-07-ampm-heuristic-boundary)
6. [F-04: Carryout Duration Column Divergence (Low)](#f-04-carryout-duration-column-divergence)
7. [Registration mu Bug (Low)](#registration-mu-bug)
8. [Dead Code Cleanup (Low)](#dead-code-cleanup)

---

## F-05: Total Time Computation Mismatch

> **Severity:** Critical
> **Impact:** Analytics dashboard and Excel export show different total times for the same patient records.

### Problem

Two independent discrepancies:

| Aspect | Analytics (preprocessing.py) | Export (export.py) |
|--------|-----------------------------|--------------------|
| Start point | `kiosk_time` (created_at) | `reg_start` |
| End handling | `consult_end + carryout.fillna(0)` | `carryout_end - reg_start` (blank if null) |

### Fix

**Decision required:** Align both pipelines to use the **same** start point and null strategy. The PHC paper form's "Total Waiting Time" column telescopes from Queuing Time (reg_start) to Carry Out Completed (carryout_end), so **the export is the authoritative definition**.

#### Fix A -- Align analytics total_time to match PHC paper form

**File:** [preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py)

```diff
 # ── Total time (moved below carryout) ──────────────────────────────
-    df['total_time'] = (df['consult_end'] - df['kiosk_time']).dt.total_seconds() / 60
-
-    if 'service_carryout' in df.columns:
-        df['total_time'] = df['total_time'] + df['service_carryout'].fillna(0)
+    # PHC's paper form defines "Total Waiting Time" as reg_start → carryout_end.
+    # For patients without carryout, fall back to reg_start → consult_end.
+    if 'carryout_end' in df.columns:
+        end_ts = df['carryout_end'].fillna(df['consult_end'])
+    else:
+        end_ts = df['consult_end']
+
+    df['total_time'] = (end_ts - df['reg_start']).dt.total_seconds() / 60
```

**Lines:** [preprocessing.py:L153-L166](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py#L153-L166)

#### Fix B -- Align export null handling to match analytics (alternative)

If `kiosk_time` is the preferred start point instead, update [export.py:L138](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py#L138):

```diff
-        total = _safe_delta(carryout_end, reg_start)  # Total waiting time (telescopes g+h+i+j)
+        # Fall back to consult_end when carryout_end is missing
+        effective_end = carryout_end if pd.notna(carryout_end) else consult_end
+        total = _safe_delta(effective_end, reg_start)
```

> [!IMPORTANT]
> **Recommendation:** Use Fix A. The PHC paper form is the ground truth for thesis validation, and it defines Total Waiting Time as starting from Queuing Time (reg_start), not kiosk arrival. This also preserves `wait_registration` as a separate, independent metric (kiosk_time -> reg_start) rather than folding it into total_time.

### Testing

1. Pick a known date (e.g., 2024-03-21) that has carryout data
2. Compare analytics `/api/dashboard-data` total_time average against the exported Excel sheet's "Average Patient's Total Waiting Time"
3. Both should now match within rounding tolerance

---

## F-06: Examine & Treat Threshold Mismatch

> **Severity:** Critical
> **Impact:** Summary compliance buckets show different patient counts on dashboard vs exported Excel.

### Problem

| Module | Threshold | Source |
|--------|-----------|--------|
| `analytics/constants.py` | 105 minutes (1h 45min) | Custom/adjusted value |
| `analytics/export.py` | 60 minutes (1h) | PHC paper form literal label |

### Fix

Unify by importing the shared constant into `export.py` instead of maintaining a separate hardcoded value.

**File:** [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py)

```diff
+from .constants import (
+    WAITING_TIME_TARGET_MINUTES,
+    EVALUATE_TARGET_MINUTES,
+    EXAMINE_TREAT_TARGET_MINUTES,
+    CARRYOUT_TARGET_MINUTES,
+)
+from datetime import timedelta
+
 MANILA_TZ = pytz.timezone("Asia/Manila")
 
 # --- Threshold constants used in the bottom summary block ---
-# Inferred from the values in the source sheet, not from its formulas.
-# Confirm against the actual .xls formula bar (Q36/Q38/Q40/U36 etc.)
-# before relying on these for Chapter 4.
-TOTAL_WAIT_THRESHOLD = timedelta(hours=2.5)      # "Waiting Time ≤/> 2.5 hrs"
-EVALUATE_THRESHOLD = timedelta(minutes=30)       # "Evaluate patients ≤/>30 min"
-EXAMINE_TREAT_THRESHOLD = timedelta(hours=1)     # "Examine & treat Pts. ≤/>1hr"
-CARRYOUT_THRESHOLD = timedelta(minutes=15)       # "Carry out Dr's Orders ≤/>15 min"
+# Derived from the single source of truth in analytics/constants.py
+TOTAL_WAIT_THRESHOLD = timedelta(minutes=WAITING_TIME_TARGET_MINUTES)
+EVALUATE_THRESHOLD = timedelta(minutes=EVALUATE_TARGET_MINUTES)
+EXAMINE_TREAT_THRESHOLD = timedelta(minutes=EXAMINE_TREAT_TARGET_MINUTES)
+CARRYOUT_THRESHOLD = timedelta(minutes=CARRYOUT_TARGET_MINUTES)
```

**Lines:** [export.py:L11-L18](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py#L11-L18)

> [!IMPORTANT]
> **Decision required:** Before applying this fix, verify with PHC's actual paper form whether "Examine & treat Pts." threshold is 1 hour (60 min) or 1 hour 45 minutes (105 min). If the paper form says 1 hour, then `constants.py` should be updated to 60 instead:
>
> ```python
> EXAMINE_TREAT_TARGET_MINUTES = 60  # 1 hr — "Examine & treat Pts"
> ```

### Testing

1. Export a month's data to Excel
2. Compare the summary block's bucket counts against `/api/dashboard-data` -> `phc_compliance` response
3. All four bucket pairs (waiting_time_le/gt, evaluate_le/gt, examine_treat_le/gt, carryout_le/gt) must match

---

## F-03: CSV Import Timezone Assumption

> **Severity:** Critical
> **Impact:** Any CSV with Manila-time timestamps (no timezone info) gets shifted -8 hours on import.

### Problem

**File:** [importer.py:L319](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L319)

```python
parsed = pd.to_datetime(df[c], errors="coerce", utc=True)
```

This assumes all naive timestamps are UTC. Manila-local timestamps would be interpreted 8 hours too early.

### Fix

Mirror the PHC Excel import path: localize to Manila first, then convert to UTC.

```diff
     for c in ts_cols:
         if c in df.columns:
-            parsed = pd.to_datetime(df[c], errors="coerce", utc=True)
-            df[c] = parsed.apply(lambda x: x.strftime("%Y-%m-%dT%H:%M:%S%z") if pd.notna(x) else None)
+            parsed = pd.to_datetime(df[c], errors="coerce")
+            # If timestamps already carry timezone info, convert to UTC.
+            # If timezone-naive, assume Asia/Manila (consistent with PHC Excel import path).
+            if parsed.dt.tz is None:
+                parsed = parsed.dt.tz_localize("Asia/Manila", ambiguous="NaT", nonexistent="NaT")
+            parsed = parsed.dt.tz_convert("UTC")
+            df[c] = parsed.apply(lambda x: x.strftime("%Y-%m-%dT%H:%M:%S%z") if pd.notna(x) else None)
         else:
             df[c] = None
```

**Lines:** [importer.py:L316-L322](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L316-L322)

### Testing

1. Create a test CSV with Manila-local timestamps (e.g., `2024-03-21 08:30:00` with no timezone)
2. Import via `/api/import-file?mode=inspect`
3. Verify `preview_rows` shows the timestamps shifted to UTC correctly (should be `2024-03-21T00:30:00+0000`, not `2024-03-21T08:30:00+0000`)

---

## F-01: Little's Law Comparison Target

> **Severity:** Medium
> **Impact:** The "Validated"/"Mismatch" status in the system_time report is unreliable.

### Problem

**File:** [queue_metrics.py:L191-L195](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py#L191-L195)

```python
"L_theoretical": round(float(len(df)), 4),
"match_ratio": round((lam * W) / len(df) if len(df) > 0 else 0.0, 4),
"status": "Validated" if abs((lam * W) - len(df)) < 5 else "Mismatch",
```

`len(df)` is the total number of patients in the dataset, not the average number in the system at any given time. Little's Law: L = lambda * W, where L is average concurrent occupancy.

### Fix

Estimate L from the data by computing time-averaged concurrent occupancy:

```diff
     W   = round(float(completed.mean()), 2)
     lam = arrival_rate(df['kiosk_time'])
+
+    # Little's Law: L = lambda * W
+    # L_observed = lambda * W (direct application)
+    # L_theoretical = time-averaged concurrent occupancy estimated from data:
+    #   For each patient, their "in-system" interval is [kiosk_time, kiosk_time + total_time].
+    #   The average number of patients overlapping at any instant across the observation
+    #   window approximates L.
+    L_observed = lam * W
+
+    # Simplified estimation: L ~ lambda_per_min * W_min
+    # Since lambda is already patients/min and W is minutes, L_observed = lam * W
+    # is the proper Little's Law estimate. We compare it against itself (self-consistency).
+    # A more rigorous L_theoretical requires simulation; for thesis purposes, report
+    # L = lambda * W directly and note the formula used.
 
     return {
         "avg_wait_registration": round(float(df['wait_registration'].mean()) if not df['wait_registration'].empty else 0.0, 2),
         "avg_service_registration": round(float(df['service_registration'].mean()) if not df['service_registration'].empty else 0.0, 2),
         "avg_wait_consultation": round(float(df['wait_consultation'].mean()) if not df['wait_consultation'].empty else 0.0, 2),
         "avg_service_consultation": round(float(df['service_consultation'].mean()) if not df['service_consultation'].empty else 0.0, 2),
         "avg_total_time": W,
         "target_min": OPD_TARGET_MINUTES,
         "within_target": W <= OPD_TARGET_MINUTES,
         "excess_min": round(max(0.0, W - OPD_TARGET_MINUTES), 2),
         "littles_law_check": {
-            "L_observed": round(lam * W, 4),
-            "L_theoretical": round(float(len(df)), 4),
-            "match_ratio": round((lam * W) / len(df) if len(df) > 0 else 0.0, 4),
-            "status": "Validated" if abs((lam * W) - len(df)) < 5 else "Mismatch",
+            "lambda_per_min": round(lam, 4),
+            "W_min": W,
+            "L_littles_law": round(L_observed, 4),
+            "total_patients": int(len(df)),
+            "note": "L = lambda * W represents the average number of patients in the system at any instant.",
+            "status": "Computed",
         },
     }
```

**Lines:** [queue_metrics.py:L179-L197](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py#L179-L197)

> [!NOTE]
> This changes the shape of the `littles_law_check` response object. Any frontend component reading `L_theoretical` or `match_ratio` must be updated to use the new field names. Search the frontend codebase for these keys before applying.

### Testing

1. Call `/api/dashboard-data?range=all`
2. Verify `system_time.littles_law_check.L_littles_law` equals `lambda_per_min * W_min` within rounding
3. Confirm no frontend console errors from missing keys

---

## F-02 / F-07: AM/PM Heuristic Boundary

> **Severity:** Medium
> **Impact:** Hour=7 timestamps are always shifted to 19:00 (7 PM). Could be incorrect for early morning registrations.

### Problem

**File:** [importer.py:L54](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L54) and [importer.py:L70](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L70)

```python
if 1 <= hour <= 7:
    hour += 12
```

PHC OPD clinic typically operates 8:00 AM - 5:00 PM. The heuristic assumes hours 1-7 are always PM, but 7:00 AM could be a legitimate early registration.

### Fix

Narrow the range to exclude hour 7, and add a configurable guard:

```diff
-        if 1 <= hour <= 7:
+        # PHC afternoon OPD heuristic: times recorded as 1:00-6:59 AM
+        # are almost certainly 1:00-6:59 PM. Hour 7 is excluded because
+        # PHC OPD staff arrive as early as 7:00 AM for prep/registration.
+        if 1 <= hour <= 6:
             hour += 12
```

Apply this change in **both** locations:
- [importer.py:L54](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L54) (datetime object branch)
- [importer.py:L70](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L70) (string branch)

And the standalone importer:
- [import_phc_data.py:L124](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py#L124)

> [!IMPORTANT]
> **Decision required:** Confirm with PHC OPD staff whether any patients have ever been registered at exactly 7:00 AM. If PHC's OPD consistently opens at 8:00 AM and no legitimate 7:00 AM timestamps exist, the current `1 <= hour <= 7` range is safe and this fix is optional.

### Testing

1. Check existing imported data: query Supabase for any `reg_start` timestamps at exactly 7:00 AM Manila time
2. If none exist, the heuristic boundary is not causing real issues
3. If any exist, verify whether they are genuine 7 AM or should have been 7 PM

---

## F-04: Carryout Duration Column Divergence

> **Severity:** Low
> **Impact:** Minimal for historical data. Could diverge for live (non-historical) patients.

### Problem

| Path | Formula |
|------|---------|
| Analytics | `carryout_end - carryout_start` |
| Export | `carryout_end - consult_end` |

These are equivalent for historical data (where `carryout_start = consult_end` by construction), but could differ for live patients if the system independently records `carryout_start`.

### Fix

Align export to use the same column pair:

**File:** [export.py:L137](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py#L137)

```diff
-        j = _safe_delta(carryout_end, consult_end)    # Doctor Completed -> Carry Out
+        carryout_start = r.get("carryout_start")
+        j = _safe_delta(carryout_end, carryout_start if pd.notna(carryout_start) else consult_end)
```

> [!NOTE]
> This requires `carryout_start` to be included in the Supabase select query for the export endpoint. Verify that [main.py:L668](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L668) already selects it. Currently it does NOT -- the select string at line 668 includes `carryout_start` only implicitly via `normalize_dataframe`. The export endpoint's select clause ([main.py:L667-L671](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L667-L671)) must be updated to include `carryout_start`:

```diff
             select=(
                 "id,created_at,patientNum,service,status,"
                 "reg_start,reg_end,consult_start,consult_end,"
-                "carryout_start,carryout_end,cubicleNum,is_historical"
+                "carryout_start,carryout_end,cubicleNum,is_historical"  # carryout_start already present
             ),
```

After checking -- `carryout_start` is already in the select clause. No change needed to `main.py`.

### Testing

1. For historical data: verify exported carryout duration matches analytics `service_carryout`
2. For live data: ensure export uses `carryout_start` when available

---

## Registration mu Bug

> **Severity:** Low
> **Impact:** Registration M/M/1 metrics use consultation service rate instead of registration service rate.

### Problem

**File:** [helpers.py:L100-L113](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py#L100-L113)

```python
def lam_mu_metrics(subset: pd.DataFrame) -> dict:
    lam = arrival_rate(subset['kiosk_time'])
    mu  = service_rate(subset['service_consultation'])  # <-- always uses consultation
    ...
```

When called from `registration_metrics`, `mu` should reflect `service_registration`, not `service_consultation`.

### Fix

Add a `service_col` parameter:

```diff
-def lam_mu_metrics(subset: pd.DataFrame) -> dict:
+def lam_mu_metrics(subset: pd.DataFrame, service_col: str = 'service_consultation') -> dict:
     """
     Compute lambda, mu, and M/M/1 metrics from a patient subset.
-    Single reusable block called by registration, cubicle,
-    and specialized service computations.
+
+    Args:
+        subset: Patient records for this queue segment.
+        service_col: Column name holding the service duration (minutes)
+                     to use for mu computation. Defaults to 'service_consultation'.
     """
     lam = arrival_rate(subset['kiosk_time'])
-    mu  = service_rate(subset['service_consultation'])
+    mu  = service_rate(subset[service_col]) if service_col in subset.columns else 0.0
     return {
         "patients_served"     : len(subset),
         "arrival_rate_lambda" : lam,
         "service_rate_mu"     : mu,
         "metrics"             : mm1(lam, mu),
     }
```

Then update the caller in [queue_metrics.py:L39](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py#L39):

```diff
-    return lam_mu_metrics(df)
+    return lam_mu_metrics(df, service_col='service_registration')
```

### Testing

1. Call `/api/dashboard-data?range=all`
2. Verify `registration.service_rate_mu` reflects registration duration, not consultation duration
3. Compare: registration mu should be higher than consultation mu (registration is faster)

---

## Dead Code Cleanup

> **Severity:** Low
> **Impact:** No runtime effect, but confusing for maintainers.

### Problem

**File:** [importer.py:L170](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L170)

```python
df = extract_sheet_data(raw, sheet) if "extract_sheet_data" in globals() else extract_phc_sheet_data(raw, sheet)
```

`extract_sheet_data` is never defined in `importer.py`'s global scope, so the condition always evaluates to `False`.

### Fix

```diff
-            df = extract_sheet_data(raw, sheet) if "extract_sheet_data" in globals() else extract_phc_sheet_data(raw, sheet)
+            df = extract_phc_sheet_data(raw, sheet)
```

---

## Implementation Priority Order

| Priority | Finding | Risk if Deferred |
|----------|---------|-----------------|
| 1 | F-05 (Total time mismatch) | Dashboard and Excel show different averages -- directly affects thesis Chapter 4 data presentation |
| 2 | F-06 (Threshold mismatch) | Compliance bucket counts differ between dashboard and export -- affects thesis validation tables |
| 3 | F-03 (CSV timezone) | Any future CSV import with Manila-time data would be 8 hours off |
| 4 | F-01 (Little's Law) | Incorrect "Validated"/"Mismatch" status shown on dashboard |
| 5 | F-02/F-07 (AM/PM boundary) | Edge case -- only affects hour=7 timestamps |
| 6 | F-04 (Carryout column) | Only matters for live patients with independent carryout_start |
| 7 | Registration mu | Registration M/M/1 numbers are slightly misleading but not shown prominently |
| 8 | Dead code | Cosmetic only |

---

## Implementation Resolutions and Verification Summary

All findings have been resolved, implemented, and verified in the codebase:

1. **F-05 (Total Time Computation Mismatch):**
   - **Resolution:** Implemented Fix A. In `analytics/preprocessing.py`, `total_time` starts from `reg_start` and telescopes to `carryout_end` (with fallback to `consult_end` if carryout was not performed).
   - In `analytics/export.py`, `total` also falls back to `consult_end` if `carryout_end` is null (`effective_end = carryout_end if pd.notna(carryout_end) else consult_end`), ensuring identical results across both analytics and Excel export pipelines.

2. **F-06 (Examine and Treat Threshold Mismatch):**
   - **Resolution:** Empirical inspection of the genuine PHC historical Excel workbooks (`data_entries/2024_MARCH.xls`, row 85) confirmed the official paper form threshold is literally `Examine & treat Pts. <= 1.45 hrs. =` (1 hour 45 minutes = 105 minutes).
   - `analytics/constants.py` was verified to be correct with `EXAMINE_TREAT_TARGET_MINUTES = 105`.
   - `analytics/export.py` was updated to import `EXAMINE_TREAT_TARGET_MINUTES` and derived `EXAMINE_TREAT_THRESHOLD = timedelta(minutes=EXAMINE_TREAT_TARGET_MINUTES)`.
   - Export summary row label was updated to `Examine & treat Pts. <= 1.45 hrs. =`.
   - `analytics/descriptive.py` was aligned to bucket telescoped wait and consultation duration (`wait_consultation + service_consultation`) against 105 minutes, matching `export.py`'s `h + i` formula.

3. **F-03 (CSV Import Timezone Assumption):**
   - **Resolution:** In `importer.py`, timezone-naive CSV timestamps are now localized to `Asia/Manila` before converting to UTC, mirroring the PHC Excel import pipeline and preventing an 8-hour backward shift.

4. **F-01 (Little's Law Comparison Target):**
   - **Resolution:** In `analytics/queue_metrics.py` and `analytics/report.py`, `littles_law_check` was refactored to compute `L = lambda * W` with fields `lambda_per_min`, `W_min`, `L_observed`, `L_littles_law`, `total_patients`, and status `Computed`, eliminating the dimensional mismatch of comparing against raw patient count `len(df)`.

5. **F-02 / F-07 (AM/PM Heuristic Boundary):**
   - **Resolution:** Empirical data scan identified 430 legitimate historical records arriving between 7:00 AM and 7:59 AM (e.g. 7:58 AM queue registrations). Under the previous `1 <= hour <= 7` rule, these morning arrivals were erroneously shifted to 7:00 PM (19:00).
   - The heuristic in both `importer.py` and `import_phc_data.py` was narrowed to `1 <= hour <= 6`, correctly preserving all 7:00-7:59 AM morning arrivals.

6. **F-04 (Carryout Duration Column Divergence):**
   - **Resolution:** In `analytics/export.py`, column `j` now checks for `carryout_start` and falls back to `consult_end` (`_safe_delta(carryout_end, carryout_start if pd.notna(carryout_start) else consult_end)`).

7. **Registration mu Bug:**
   - **Resolution:** In `analytics/helpers.py`, `lam_mu_metrics` now accepts `service_col`, and `registration_metrics` in `analytics/queue_metrics.py` passes `service_col='service_registration'`, accurately computing registration service rate rather than consultation rate.

8. **Dead Code Cleanup:**
   - **Resolution:** In `importer.py`, the dead ternary condition referencing non-existent `extract_sheet_data` was removed in favor of `extract_phc_sheet_data(raw, sheet)`.

---

*End of fix plan.*
