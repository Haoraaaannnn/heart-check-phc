# Heart Check PHC — Time and Motion Analytics: Documentation Upgrade Roadmap

**Date:** 2026-10-31
**Scope:** Documentation-only. No code changes required.
**Purpose:** Strengthen the system's position as a time and motion analytics
system for the defense and for UAT evaluators.

---

## Why "Time and Motion" Changes the Priority Order

A time and motion study measures how long each step of a process takes,
identifies where delays occur, and quantifies the effect of a process change.
That reframes the entire system:

| What we have | What time and motion requires |
|---|---|
| Volume forecast (primary output) | Stage-time analytics (primary output) |
| "Next-day patient count" | "Where is the delay, and how long?" |
| Bottleneck detection (slowest stage) | Bottleneck detection + variation + compliance |
| Staffing recommendation | Process scenario output |

The code already does everything needed. The gap is in how it is documented
and framed.

---

## Tier 1 — Descriptive (Document What Is Already There)

### What to document

The system computes all five stages of the patient journey:

```
Kiosk arrival
  -> wait_registration     (kiosk to registration desk)
  -> service_registration  (registration desk duration)
  -> wait_consultation     (desk to doctor cubicle)
  -> service_consultation  (doctor examination)
  -> service_carryout      (carry-out orders)
  -> total_time            (reg_start to carryout_end or consult_end)
```

This IS a time and motion pipeline. Document it as one explicitly in Chapter 4
and the system description.

### What to add to the documentation

1. **Stage-by-stage time motion table.** Already in Table 4.2 but should be
   cross-referenced as a time and motion breakdown, not just a
   "comparative analysis."

2. **PHC compliance summary as the headline result.** The PHC paper tracking
   form (Waiting Time / Evaluate / Examine & Treat / Carry Out) is already
   replicated in the system. Frame this as the primary output: the system
   digitizes and automates the compliance check PHC staff currently do by hand.

3. **Hourly pattern as a time-of-day motion view.** The system computes
   per-stage averages by hour of day. Document this as: "The hourly pattern
   identifies at which clock hour each stage becomes the primary delay
   source — enabling targeted scheduling decisions."

4. **Total time discrepancy note.** Historical rows do not have carryout
   timestamps, so their `total_time` ends at `consult_end`. Document this
   openly: "For the 2024 historical dataset, total OPD duration excludes
   the carry-out stage because those timestamps were not recorded on the
   PHC paper sheets. Live kiosk records capture the full journey including
   carry-out."

---

## Tier 2 — Diagnostic (Document What the Code Does, Frame It Better)

### What the code already does

- Classifies each stage as Normal / Elevated / Overwhelmed.
- Identifies the primary bottleneck by severity and average minutes.
- Reports the reason in plain language.

### What to document as an upgrade path (not yet coded, future work)

These do not need to be implemented for the defense. Document them as
planned enhancements:

1. **Coefficient of Variation (CV) per stage.**
   CV = std / mean. A stage with high average AND high CV spikes on
   specific days. A stage with high average and low CV is consistently
   slow. The distinction matters for intervention: a high-CV stage needs
   triage; a low-CV stage needs process redesign.
   Document as: "Future work: add CV per stage to identify whether delays
   are structural or episodic."

2. **Weekday pattern breakdown.**
   Are Mondays consistently slower at registration? Does carry-out spike on
   Fridays? The `day_of_week` column is already computed in preprocessing
   but not surfaced in the bottleneck report.
   Document as: "Future work: per-weekday stage breakdown to support
   appointment slot distribution decisions."

3. **Run chart for abnormal days.**
   A control chart flags days where a stage average is more than 2 standard
   deviations above the historical mean. This is the proper diagnostic
   tool for "which days were unusually bad and why?"
   Document as: "Future work: statistical process control chart (run chart)
   for detecting abnormal operating days."

---

## Tier 3 — Predictive (Reframe Forecasting as Capacity Utilization)

### What to document

Volume forecasting in a fixed-appointment-cap system has low predictive
value because the outcome is largely set by policy. Document this
explicitly rather than hiding it:

> "In a fixed-appointment-cap setting, daily patient volume is bounded by
> policy. All five forecasting models (SMA, WMA, EMA, LR, ARIMA) are
> expected to achieve MASE near 1.0 against the seasonal-naive baseline,
> confirming that volume is policy-driven rather than stochastic.
> The forecasting module's function in this context is projected capacity
> utilization: forecast / cap. A projected utilization near 100% signals
> no buffer for walk-in emergency additions; a lower utilization allows
> flexible slot release."

### What to add to the documentation

1. **Redefine the forecasting output label.**
   Document the intended reading of the forecast:
   - Forecast: 48 patients. Cap: 50. Utilization: 96% — near full, no buffer.
   - Forecast: 42 patients. Cap: 50. Utilization: 84% — moderate buffer.

2. **Document ARIMA as a smoothing estimator, not a seasonal model.**
   Already in `forecasting.py` docstring. Add a one-paragraph version
   to Chapter 4 Section 4.0.

3. **MASE as the honest evaluation metric.**
   If MASE >= 1, state it: "The best model does not improve over naive
   prediction, which is consistent with a cap-constrained appointment
   schedule." This is honest science, not a failure.

---

## Tier 4 — Prescriptive (Reframe as Policy Scenarios)

### What to document

The current staffing recommendation says "extend OPD hours or redirect
patients" when load exceeds capacity. This is not actionable in PHC's
fixed structure.

Document the prescriptive tier differently:

> "The prescriptive tier computes the minimum doctor-cubicle configuration
> required to keep server utilization below 80% under the forecasted load.
> Outputs are framed as policy scenarios, not operational orders.
> PHC clinical constraints (fixed cubicles, fixed appointment caps) are
> respected as hard boundaries. The system does not recommend adding
> cubicles or staff; it reports the expected utilization under the current
> configuration and flags when the appointment cap approaches the 80%
> utilization ceiling."

### What-if scenario to document (one, not many)

> "Policy scenario: If carry-out duration is reduced to within 15 minutes
> for all patients (the confirmed PHC policy limit), total OPD visit time
> decreases by approximately X minutes. Carry-out compliance can be
> computed from the live dashboard's PHC compliance summary."

This single scenario is actionable (carry-out is the only confirmed PHC
policy limit), grounded in real data, and within the software's scope.

---

## Tier 5 — Queueing Theory (Document Assumptions Openly)

### What to document

M/M/1 assumes Poisson arrivals and exponential service. PHC uses scheduled
appointments, which violates the Poisson assumption. Document this as:

> "M/M/1 is applied as a theoretical upper-bound estimator. Scheduled
> appointments produce a more regular (sub-Poisson) arrival pattern,
> meaning actual queue wait is expected to be lower than the M/M/1
> prediction. The model errs on the side of conservatism: if the system
> performs adequately under M/M/1 assumptions, it will perform at least
> as well under the appointment schedule."

The CV = 1.74 finding in Section 7.2 partially validates Poisson during
peak walk-in hours (08:00-09:00 morning intake surge). Reference this
cross-link in the queueing section.

### Distribution tests (future work)

> "Future work: Kolmogorov-Smirnov test for exponential fit on
> inter-arrival times and service durations using live kiosk data.
> Results will be reported as a validation finding, not a model
> replacement decision."

---

## Tier 6 — Evaluation / UAT (Document Simulation Labeling)

### Rules to document for UAT preparation

1. **Real vs. simulated data must never appear in the same comparison.**
   If UAT uses hand-generated patient sequences, label every figure and
   table: "UAT demonstration dataset — not PHC operational data."

2. **Known-answer test cases.**
   For UAT, prepare at least one test case with a known, hand-computed
   result:
   - Input: 10 patients, all with exactly 14-minute carry-out durations.
   - Expected output: 100% carry-out compliance (10/10 within 15-minute limit).
   - If the system reports this correctly, the compliance computation is validated.

3. **The 25.80% reduction cannot be reproduced in UAT simulation.**
   It is derived from 26,753 real historical records. State this clearly:
   "The 25.80% registration queue reduction is a simulation finding based
   on empirical PHC 2024 data. UAT evaluates functional correctness and
   usability, not the reproduction of this statistic."

---

## Summary: What to Add Where

| Location | What to Add |
|---|---|
| `CHAPTER_4_RESULTS_AND_DISCUSSION.md` Section 1 | Frame the system explicitly as a "time and motion analytics pipeline" |
| Section 2.1 (data source) | Data scope limitation note (single room, consultation only, carryout gap) |
| Section 4.0 (forecasting) | Capacity utilization reframe; MASE honest-result statement |
| Section 4.2 (25.8% vs 4.2%) | Defense note on scope difference — already added |
| Section 5.3 (new) | M/M/1 assumption disclosure — already added |
| Section 9 (defense key points) | Add: "Time and motion is the primary tier; forecasting is a supporting capacity view" |
| `python_backend/docs/` | Add a one-page `TIME_AND_MOTION_OVERVIEW.md` defining the 5-stage pipeline |
| `constants.py` | PHC-POLICY vs INTERNAL labels — already done |
| `forecasting.py` | ARIMA date-gap and MASE documentation — already done |

---

## One-Paragraph Defense Opening (Ready to Use)

> "Heart Check PHC is a kiosk-based queue management system with a
> time and motion analytics pipeline. The system captures five stages
> of the outpatient journey — from kiosk check-in through carry-out
> completion — and produces four analytics tiers: descriptive (daily
> and hourly stage averages), diagnostic (bottleneck severity and
> compliance tracking), predictive (capacity utilization forecasting),
> and prescriptive (cubicle configuration scenarios). The primary
> finding is a 25.80% reduction in registration counter queue waiting
> time under the M/M/1 model, with 1,054 additional patients brought
> into the hospital's 150-minute compliance standard. Assumptions are
> stated openly, simulated data is labeled, and data limitations are
> disclosed."
