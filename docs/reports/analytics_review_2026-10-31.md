# Heart Check PHC — Analytics Review and Resolution Guide

**Date:** 2026-10-31
**Scope:** Problems P1–P12 cross-checked against actual source code. Each entry
states what the code currently does, whether the problem is real, and the
concrete action needed.

---

## Quick Verdict Table

| ID | Problem | Status in Code | Action Required |
|---|---|---|---|
| P1 | Volume forecasting low value | Real — forecasting is primary output | Demote to "supporting" in UI copy and documentation |
| P2 | Forecasting method weaknesses | Partially real — no naive baseline, ARIMA order fixed, dates not reindexed | Add seasonal-naive baseline; document data gaps |
| P3 | Diagnostic tier is descriptive | Partially real — CV and run charts missing | Add CV column to bottleneck table |
| P4 | Prescriptive tier rule-based | Real — staffing warning suggests "extend hours or redirect" | Reframe as policy scenario output |
| P5 | Queueing assumptions untested | Real — `distribution_tests.py` does not exist | Create and run the file on real data |
| P6 | Data is narrow | Real — historical import hard-codes consultation/Done | Document as stated limitation |
| P7 | Carryout excluded from totals | **NOT a real problem** — carryout IS included | Verify and document; gap is from something else |
| P8 | Policy limits mostly unknown | Partially real — carry-out (15 min) is coded, others use internal thresholds | Label non-PHC thresholds; make configurable |
| P9 | Circular validation with sim data | Real risk | Label all sim outputs; write known-answer tests |
| P10 | 25-30% reduction cannot be proven by simulation | Real — Chapter 4 shows 4.23% total or 25.8% queue reduction | Clarify which metric the objective refers to |
| P11 | Problem statement wording | Real — "sudden increases" does not match fixed-cap context | Small edits, confirm with adviser |
| P12 | Security items open | Real — middleware.ts and /unauthorized do not exist | Close before UAT |

---

## Detailed Findings

### P1 — Volume Forecasting Low Decision Value

**What the code does:**
[`report.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/report.py#L89-L135)
calls `evaluate_forecasting_algorithms` and uses the winner's
`next_day_forecast` as the primary input to `recommend_staff`. The forecast
drives the staffing recommendation that is displayed on the dashboard.

**Assessment:** The problem is real. PHC operates on fixed appointment caps, so
day-to-day volume variation is policy-constrained. The forecast will track the
cap and will rarely beat a flat mean on real data. However, the forecast is
already computed correctly — the issue is _positioning_, not code.

**Action (documentation/UI only, no code change):**
- In the analytics dashboard copy, label the volume forecast as a "Demand vs.
  Capacity" supplementary view, not the headline metric.
- Promote stage-time analytics (bottleneck table, PHC compliance summary) as
  the primary tier.
- No changes to [`forecasting.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py) are required.

---

### P2 — Forecasting Method Weaknesses

**What the code does:**
- Five models: SMA, WMA, EMA, LR, ARIMA(1,1,1).
- Walk-forward backtesting with MAE+RMSE.
- No naive baseline (e.g. "yesterday's count" or "same weekday last week").
- ARIMA order is hardcoded as `(1,1,1)` — no seasonal component.
- Dates are not reindexed: weekends and holidays appear as sequential
  observations. PHC typically closes on weekends, creating large gaps that
  ARIMA(1,1,1) treats as ordinary day-to-day changes.
- `WINDOW_SIZE = 2` is very small; SMA, WMA, and LR all operate on a 2-day
  window, making them nearly identical.
- Evaluation is walk-forward, which is correct. The selection criterion (lowest
  MAE) is also correct.

**Assessment:** The problem is partially real. The main risks:
1. No naive baseline means there is no proof any model adds value over "same
   day last week."
2. ARIMA ignores weekly seasonality. On real PHC data (Monday–Friday clinic,
   Saturday occasional) this will matter.
3. 2-day window collapses SMA, WMA, and LR into near-identical outputs.

**Action (code changes in [`forecasting.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py)):**

> [!IMPORTANT]
> Do not execute these code changes without explicit user instruction. The list
> below describes what should change and where.

1. **Add seasonal-naive baseline.** For each backtest step `i`, predict
   `volumes[i - 5]` (same weekday 5 business days ago). If fewer than 5 days
   exist, fall back to the plain mean.
2. **Increase `WINDOW_SIZE` in [`constants.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py)** from `2` to `5` (one business
   week). This differentiates SMA, WMA, LR, and EMA meaningfully.
3. **Document the date gap issue.** Add a comment in `forecasting.py` noting
   that PHC calendar gaps (weekends, holidays) are not reindexed and that
   ARIMA(1,1,1) treats them as ordinary consecutive days.
4. **Report MASE** (Mean Absolute Scaled Error, scaled by the naive baseline
   MAE) alongside MAE. MASE > 1 means the model is worse than naive — a
   critical finding to document.

---

### P3 — Diagnostic Tier is Mostly Descriptive

**What the code does:**
[`bottleneck_report`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/descriptive.py#L180-L294)
returns `avg_minutes`, `patient_count`, `level`, and `reason` for each of 5
stages. It identifies the worst stage by severity tier and average minutes.

**Assessment:** Partially real. The function correctly identifies _which_ stage
is slowest and _how far above the threshold_ it is. What it does not compute:
- Coefficient of variation (CV = std/mean) per stage — a low CV means the
  stage is consistently slow; a high CV means it spikes unpredictably.
- Day-of-week or hourly breakdown per stage (this exists in `hourly_pattern`
  but is not cross-referenced in bottleneck output).
- Cubicle-level utilization imbalance (this is in `per_cubicle_metrics` but
  not surfaced in the main bottleneck report).

**Action (documentation; code changes are additive, not rewrites):**
- Add a `cv_minutes` field to each stage dict in `bottleneck_report`. Formula:
  `round(std / mean, 4) if mean > 0 else None`. This is a one-line addition
  per stage.
- In the dashboard, show CV alongside avg. A stage with avg 25 min and CV 2.0
  is more concerning than avg 35 min and CV 0.3.
- Document in the analytics reference that bottleneck detection identifies the
  primary stage; CV tells you whether to investigate a structural cause or
  peak-time spikes.

---

### P4 — Prescriptive Tier May Be Rule-Based or Non-Actionable

**What the code does:**
[`staffing.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/staffing.py)
recommends the number of doctors/cubicles needed to keep utilization under 80%.
When the required cubicles exceed `MAX_ADULT_CUBICLES = 5` or
`MAX_PEDIA_CUBICLES = 5`, the warning says:
> "Consider extending OPD hours or redirecting patients."

**Assessment:** Real problem. "Extend OPD hours" is not actionable within PHC's
fixed structure, and "redirect patients" is vague. However, the mathematical
core (M/M/1 minimum cubicle derivation) is sound and defensible.

**Action (documentation and minor UI copy change):**
- Rename the output section from "Staffing Recommendation" to "Capacity
  Scenario."
- Replace the warning text with: "Projected load requires {c} doctors. Current
  maximum is {cap}. Consider a staggered appointment release schedule to
  distribute morning intake."
- Add one what-if scenario output: "If carry-out duration is reduced to 15
  minutes for all patients, total OPD visit time decreases by approximately
  X minutes." (X is computed from the compliance summary.)
- Keep the M/M/1 derivation — it is the correct prescriptive backbone for a
  fixed-server system.

---

### P5 — Queueing Model Assumptions Are Untested

**What the code does:**
M/M/1 is applied to the registration counter and each consultation cubicle.
Erlang C (M/M/c) is used as a pooled-queue benchmark. Neither test file
(`distribution_tests.py`) exists in
[`python_backend/testers/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/testers/).

**Assessment:** Real. PHC uses scheduled appointments, which violates the
Poisson arrival assumption of M/M/1. On a fixed appointment schedule, arrivals
are nearly deterministic. The model will overestimate queue wait.

**Action:**
- Create `python_backend/testers/distribution_tests.py`. It should run:
  1. Kolmogorov–Smirnov or Anderson–Darling test for exponential fit on
     inter-arrival times.
  2. Kolmogorov–Smirnov test for exponential fit on service durations.
  3. Ljung–Box test for autocorrelation in the daily volume series (needed for
     ARIMA justification).
- Report the test results as a stated finding: if Poisson assumption fails,
  state: "M/M/1 is used as a theoretical upper-bound estimate. Actual queue
  wait is expected to be lower due to the appointment-scheduled arrival
  pattern."
- This is defensible. You do not need to abandon M/M/1; you just need to
  disclose its assumption and the direction of its error.

---

### P6 — Data Is Narrow

**What the code does:**
The historical import pipeline (from `db_seeder.py` or equivalent) imports PHC
Excel sheets. Chapter 4 references 12 months of 2024 data ($N = 26,753$).
The user's review note says the import hard-codes
`service = "Consultation"` and `status = "Done"`.

**Assessment:** Real for the system's live database import. The Chapter 4
simulation data appears broader (26,753 records for the full year), but the
live system's historical import scope needs to be documented clearly.

**Action:**
- In the import documentation and any analytics report output, state the
  scope: "Single room, general outpatient consultation, records with
  completed status only."
- Do not claim multi-service or multi-room findings from this dataset.
- If carry-out columns are empty for historical rows (confirmed by the
  preprocessing code, which only computes `service_carryout` when both
  `carryout_start` and `carryout_end` are present), state this openly:
  "Carryout compliance for historical records is not available; figures
  reflect live-session data only."

---

### P7 — Carry-Out Stage Excluded from Totals

**What the code does — this is the most important finding:**

[`preprocessing.py` lines 158–169](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py#L158-L169):

```python
# PHC's paper form defines "Total Waiting Time" as reg_start -> carryout_end.
# For patients without carryout, fall back to reg_start -> consult_end.
if 'carryout_end' in df.columns:
    end_ts = df['carryout_end'].fillna(df['consult_end'])
else:
    end_ts = df['consult_end']

df['total_time'] = (end_ts - df['reg_start']).dt.total_seconds() / 60
```

**Assessment: P7 is NOT a real problem in the current codebase.** Carryout
IS included in `total_time` when `carryout_end` is present. The fallback to
`consult_end` only applies when carryout data is absent (e.g., historical rows
that were imported without those columns).

**The 4-minute gap is explained by data scope, not a code error.** Historical
rows imported without `carryout_start`/`carryout_end` will fall back to
`consult_end`, so their `total_time` excludes carryout. If PHC's recorded
average includes carryout, the difference is structural — the historical import
simply did not capture those timestamps.

**Action:**
- Verify by running: how many historical rows have non-null
  `carryout_end`? If the answer is zero, the 4-minute gap is entirely
  explained by the import scope.
- Document this in the data limitations section: "Historical records imported
  from PHC Excel sheets did not include carryout timestamps; total_time for
  those records ends at consult_end. Live kiosk records include full carryout
  timing."
- No code change is needed.

---

### P8 — Policy Time Limits Mostly Unknown

**What the code does:**
[`constants.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py)
has:
- `CARRYOUT_TARGET_MINUTES = 15` — confirmed PHC policy
- `EVALUATE_TARGET_MINUTES = 30` — matches `OVERWHELMED_MINUTES` (internal benchmark)
- `EXAMINE_TREAT_TARGET_MINUTES = 105` — PHC paper form value
- `WAITING_TIME_TARGET_MINUTES = 150` — PHC paper form value

**Assessment:** The constants are already in one file. The issue is labeling
and traceability:
- `CARRYOUT_TARGET_MINUTES = 15` is a confirmed PHC policy limit.
- `EVALUATE_TARGET_MINUTES = 30` is labeled as matching an internal threshold,
  not a confirmed PHC policy.
- `EXAMINE_TREAT_TARGET_MINUTES = 105` and `WAITING_TIME_TARGET_MINUTES = 150`
  are from the paper form, which is PHC-authoritative.

**Action:**
- In `constants.py`, add inline comments to each constant marking it as
  either "PHC policy (paper form)" or "internal benchmark — pending PHC MIS
  confirmation."
- In the compliance summary output and dashboard, distinguish confirmed-policy
  thresholds from internal benchmarks with a footnote or tooltip.
- Request the remaining confirmed per-stage limits from PHC MIS before UAT.

---

### P9 — Circular Validation Risk with Simulated Data

**Assessment:** Real risk for the UAT portion. If simulation parameters are
drawn from the same distributions used to validate the model, the validation
proves nothing.

**Action:**
- Chapter 4 states data comes from real PHC records (26,753 visits). This is
  the correct approach — real data, not synthetic.
- For UAT, use only real-data scenarios OR hand-built known-answer test cases
  (e.g., manually input 10 patients with exact timestamps, verify that the
  system reports the correct average per stage).
- Label any scenario that uses generated/simulated time values clearly:
  "Simulated for UAT demonstration purposes — not PHC operational data."
- Never mix simulated and real records in the same analytics range comparison.

---

### P10 — The 25–30% Reduction Claim

**What Chapter 4 currently says:**
Chapter 4 Section 4.2 already addresses this precisely. The total OPD visit
decreases by 4.23% (6.32 minutes). The 25.80% reduction applies specifically
to the **registration counter queue wait** ($W_q$: 93.13 min → 69.10 min).

**Assessment:** This is partially resolved but the communication is the risk.
If the general objective says "25–30% waiting time reduction" without
specifying _which_ wait, evaluators will compare it against the 4.23% total
reduction and flag it as unmet.

**Action (documentation):**
- Restate the general objective to read: "reduce patient waiting time _at the
  registration counter queue_ by 25–30%." This is precisely what the
  queueing model demonstrates.
- Alternatively, state two separate metrics: (a) queue wait at registration
  counter: 25.80% reduction, (b) total OPD visit duration: 4.23% reduction.
- Add a defense talking point: "The objective is met for the targeted
  administrative bottleneck. Clinical stages — physician wait, consultation,
  carryout — are outside the software's scope and are preserved as constants."

---

### P11 — Problem Statement and Objective Wording

**Assessment:** Real. The current wording (per the review) centers on "sudden
increases in patient volume" and "staff scheduling," which conflict with:
- PHC's fixed appointment caps (volume is policy-controlled, not sudden)
- Fixed cubicles (staff scheduling has limited actionable scope)

**Proposed edits (confirm with adviser before making):**

| Original | Revised |
|---|---|
| "sudden increases in patient volume" | "peak periods and delays in patient flow" |
| "staff scheduling" | "patient flow and appointment capacity" |
| (missing) | "identify where delays occur within each patient stage" |
| (missing) | "time spent per stage from kiosk check-in to carry-out completion" |

> [!WARNING]
> Confirm with the adviser before editing if the original wording was already
> formally approved in an earlier submission.

---

### P12 — Security and Documentation Items Still Open

**Assessment:** Real. These are not analytics-tier issues but they are ISO
25010 security characteristics and evaluators may inspect Supabase policies
during UAT.

**Outstanding items (from the review note):**
- `services`, `users`, and `patients` RLS fixes may not be applied in the
  latest schema.
- `middleware.ts` and `/unauthorized` route do not exist.
- `doctors` write policies appear unguarded.
- `is_clinical_staff()`, `is_registration_staff()`, `my_cubicle_nums()`
  helper functions are undocumented.

**Action:**
- These should be addressed before UAT as a separate task from analytics.
  They do not affect any of the analytics modules above.
- See [`docs/checklists/SECURITY_CHECKLIST.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md)
  for the canonical checklist.

---

## Priority Work Order

| Priority | Problem | What to Do | Files Affected |
|---|---|---|---|
| 1 | P7 | Verify carryout null count in historical rows; write the data-limitation note | `docs/` |
| 2 | P10 | Clarify which "waiting time" the 25–30% objective refers to; update chapter 4 | `docs/simulation/CHAPTER_4_RESULTS_AND_DISCUSSION.md` |
| 3 | P8 | Annotate `constants.py` with PHC-policy vs internal-benchmark labels | `python_backend/analytics/constants.py` |
| 4 | P3 | Add CV field to `bottleneck_report` output | `python_backend/analytics/descriptive.py` |
| 5 | P4 | Reframe staffing warning text as a policy scenario | `python_backend/analytics/staffing.py` |
| 6 | P2 | Increase WINDOW_SIZE to 5; add seasonal-naive baseline; add MASE | `python_backend/analytics/forecasting.py`, `constants.py` |
| 7 | P9 | Write known-answer UAT test cases | New test file |
| 8 | P5 | Create `distribution_tests.py` | `python_backend/testers/distribution_tests.py` |
| 9 | P1, P6, P11 | Documentation and copy edits only | `docs/`, dashboard UI strings |
| 10 | P12 | Security audit and middleware | Separate task |

---

## Defense Positioning Summary

The system is a **time and motion analytics pipeline with queue decision
support**:

- **Descriptive:** Daily summary, hourly pattern, 5-stage bottleneck detection,
  PHC paper-form compliance mirror. All four are implemented and correct.
- **Predictive:** 5-model walk-forward forecast with MAE/RMSE selection.
  Volume forecasting is a supporting view; stage-time analytics are the
  headline.
- **Diagnostic:** Bottleneck tier correctly identifies the worst stage by
  severity and average minutes. CV addition will strengthen this tier.
- **Prescriptive:** M/M/1-backed capacity scenario output. Fixed-cubicle
  constraint is respected. Warning language to be reframed as scenario output.
- **Assumptions stated openly:** M/M/1 overestimates queue wait for scheduled
  arrivals. This is documented, the direction of error is known, and the model
  is used as a theoretical upper bound.
- **Validation:** Real PHC data (26,753 visits, 2024). Simulated outputs
  labeled as simulated. Known-answer UAT tests to be added.
- **25.80% queue reduction at the registration counter** is the primary
  efficiency finding, matching the project objective when scoped to the
  targeted administrative bottleneck.
