# Chapter 4 Simulation — Master Guide
## How to Build a Valid and Reasonable Simulation to Compare Queue Time and Prove the System Works

**Last Updated:** 2026-10-17
**Cross-references & Consolidated Sections:**
- `docs/simulation/chapter4_simulation_build_guide.md` — Full implementation code and script skeleton
- Section 9 — Comprehensive Methodology Decision Rationale (Integrated)
- Section 10 — Baseline Computation Analysis: Grand Mean vs. Mean of Monthly Means (Integrated)

---

## 1. What You Are Trying to Prove

Before writing a single line of simulation code, be clear about the research question:

> "Does replacing the traditional pen-and-paper OPD queue with the Heart Check PHC automated
> digital queue system reduce patient waiting time at the registration desk, and by how much?"

Everything in the simulation exists to answer that one question with real data and defensible math.

---

## 2. Why This Simulation is Valid (The Foundation)

A simulation is only as credible as what it is built on. This one is built on three pillars:

| Pillar | What It Means Here |
|--------|--------------------|
| Real observed data | All clinical stage durations (registration service, consultation, carryout) come from real PHC Excel tracking sheets imported into Supabase — not invented numbers. |
| Observed overhead values | The pen-and-paper overhead (stub issuance time, PA announcement delay) was measured via structured MISD staff interview and direct clinic observation — not guessed. |
| Established mathematical model | M/M/1 queueing theory is a standard, published, peer-reviewed model for single-server queues. It is the correct model for PHC's one-counter registration desk. |

If any of these three pillars is missing, the simulation becomes synthetic and academically weak.

---

## 3. The Core Logic — How the Comparison Works

The key insight is this:

**Both scenarios use the exact same real patient records as their base.
Only the administrative scaffolding around each visit is different.**

```
SAME FOR BOTH:
  - Real consultation service times  (how long the doctor spends with each patient)
  - Real wait-for-consultation times  (how long the patient waits to be called to a cubicle)
  - Real carryout service times       (carry-out orders where recorded)

DIFFERENT BETWEEN SCENARIOS:
  - How the patient gets a queue number (pen-and-paper stub vs. kiosk ticket)
  - How the patient is called           (verbal PA call vs. TTS audio + digital monitor)
  - How fast the registration clerk processes the patient
    (manual ledger data entry vs. kiosk pre-filled record, clerk only verifies)
```

This is the cleanest possible academic comparison because you hold the clinical variables constant
and only change the variables that the system actually controls.

---

## 4. Step-by-Step Build Plan

### Step 1 — Frame the Two Scenarios Precisely

|                   | Scenario A — Traditional Pen-and-Paper Queue                                                  | Scenario B — Automated Digital Queue (Heart Check PHC)                                         |
| ----------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Queue entry       | Patient walks to desk; staff writes name in physical logbook; issues hand-written queue stub. | Patient taps through touchscreen kiosk; printed ticket with queue number issued automatically. |
| Patient callout   | Staff calls patient name verbally via PA or by walking to waiting area.                       | Digital monitor displays queue number; TTS audio chimes patient's name.                        |
| Registration desk | Clerk manually enters patient data into paper records; looks up appointment ledger.           | Kiosk has already pre-filled the patient record; clerk verifies and confirms only.             |
| Clinical stages   | Identical — these are determined by the doctor, not the queue system.                         | Identical.                                                                                     |

### Step 2 — Fetch Real Data

Pull all historical consultation records from Supabase (`is_historical = true`, `service = 'consultation'`).
These records cover March 2024 to December 2025. Use the full range — more data means a more stable baseline.

After fetching, run through `preprocess_queue_data()` to get these columns per patient:

| Column | What It Is |
|--------|-----------|
| `service_registration` | Time at the registration desk (reg_start to reg_end). Real data. |
| `wait_consultation` | Time waiting to be seen by a doctor (reg_end to consult_start). Real data. |
| `service_consultation` | Time with the doctor (consult_start to consult_end). Real data. |
| `service_carryout` | Time for carry-out orders (where recorded). Real data. |
| `kiosk_time` | Arrival timestamp (mapped from Queuing Time for historical rows). Used to compute arrival rate. |

### Step 3 — Compute the Baseline (Grand Mean)

Compute the grand mean of `service_registration` and `service_consultation` across all records.

**Use the grand mean, not the mean of monthly means.** The grand mean is the correct input for
M/M/1's service rate (mu). It is the maximum-likelihood estimator of true mean service time
and is not distorted by months with thin record counts.

```python
reg_mean   = df["service_registration"].dropna().mean()   # Scenario A anchor
consult_mean = df["service_consultation"].dropna().mean()
```

### Step 4 — Add Scenario-Specific Overhead Per Patient

For every patient row, add the overhead that their scenario introduces:

**Scenario A (Pen-and-Paper):**

| Overhead | Value | Why |
|----------|-------|-----|
| Stub issuance time | Normal(mean=3.5 min, sd=0.8), floor 0.5 min | Time for staff to write name in logbook and issue hand-written stub. MISD interview + observation. |
| PA announcement delay | Normal(mean=1.5 min, sd=0.3), floor 0 | Time lag between staff calling the patient name and patient arriving at the desk. Observation. |

**Scenario B (Digital):**

| Overhead | Value | Why |
|----------|-------|-----|
| Kiosk check-in time | Normal(mean=0.67 min, sd=0.15), floor 0.1 min | ~40 seconds for patient to complete touchscreen self-registration. System walkthrough. |
| PA announcement delay | 0.0 min — eliminated | Monitor and TTS callout replace verbal calls. No delay. |
| Registration service reduction | reg_mean minus 2.0 min, floor 1.0 min | Kiosk pre-fills patient record; clerk only verifies. The 2.0 min estimate is from MISD interview (data-entry + ledger lookup eliminated). |

### Step 5 — Compute Total OPD Time Per Patient for Both Scenarios

```
Scenario A total per patient:
  stub_issuance + announcement + service_registration + wait_consultation
  + service_consultation + service_carryout (where available)

Scenario B total per patient:
  kiosk_checkin + 0.0 announcement + service_registration_digital
  + wait_consultation + service_consultation + service_carryout (where available)
```

The `wait_consultation` and clinical stages are the same real values in both.

### Step 6 — Compute M/M/1 Queue Metrics

Use M/M/1 for the registration counter — the single-server queue that is the core bottleneck.

**Important: Use the peak operational window (08:00 to 12:00 Manila time).**
Do not use the whole-day arrival rate. PHC's morning surge is where the queue pressure
is real. A whole-day lambda dilutes the rate and masks the bottleneck.

```
lambda  = patients arriving between 08:00 and 12:00 / (4 * 60 minutes)
mu_A    = 1 / service_registration_mean_A           (Scenario A — slower, manual data entry)
mu_B    = 1 / service_registration_mean_B           (Scenario B — faster, kiosk pre-fill)

rho_A   = lambda / mu_A
rho_B   = lambda / mu_B

Wq_A    = lambda / (mu_A * (mu_A - lambda))         (average wait in queue, Scenario A)
Wq_B    = lambda / (mu_B * (mu_B - lambda))         (average wait in queue, Scenario B)
```

M/M/1 is stable only when rho < 1. Always check this before reporting.

**If rho_A >= 1:** This is actually a strong finding. It means the pen-and-paper registration
desk was operating above capacity during peak hours — the queue grew indefinitely. Report it.
Show that rho_B < 1 (Scenario B stabilizes the queue). That is the clearest possible
evidence that the system solves the problem.

### Step 7 — Compute PHC Compliance Rates

Check how many patients in each scenario finish within PHC's OPD time targets:

- Within 150 minutes — PHC target
- Within 180 minutes — PHC ceiling

Report compliance rate for the full dataset and for the peak hour (08:00 to 09:00) separately.

### Step 8 — Run a Sensitivity Analysis

One question an examiner will ask: "What if your 2.0-minute kiosk pre-fill estimate is wrong?"

Run the simulation three times with different reduction values:

| Run | DIGITAL_REG_REDUCTION_MIN | Label |
|-----|--------------------------|-------|
| 1 | 1.0 min | Conservative lower bound |
| 2 | 2.0 min | Base case (primary result) |
| 3 | 3.0 min | Optimistic upper bound |

If Scenario B outperforms Scenario A in all three runs, your conclusion is robust regardless
of the exact estimate. That makes the finding bulletproof under examination.

---

## 5. What to Report in Chapter 4

Report all five of the following. Each one answers a specific examiner question.

### Report 1 — Descriptive Baseline Table
"What did the real PHC data look like before we added any scenario?"

Show: n (record count), mean, and std for each stage from the real historical data.

### Report 2 — Stage-by-Stage Time Comparison Table
"Where exactly does the time savings come from?"

| Stage | Scenario A — Pen-and-Paper (min) | Scenario B — Digital (min) | Saved (min) | Reduction (%) |
|-------|----------------------------------|----------------------------|-------------|---------------|
| Queue stub / check-in | 3.5 | 0.67 | 2.83 | 81% |
| Announcement delay | 1.5 | 0.0 | 1.5 | 100% |
| Registration service | X.XX | X.XX | X.XX | X.X% |
| Wait for consultation | X.XX | X.XX | 0 | 0% |
| Consultation service | X.XX | X.XX | 0 | 0% |
| Carryout | X.XX | X.XX | 0 | 0% |
| **Total OPD Stay** | **XX.XX** | **XX.XX** | **X.XX** | **X.X%** |

### Report 3 — M/M/1 Queue Metrics Table
"How bad was the queue in the old system, and how much better is it now?"

| M/M/1 Metric | Scenario A — Pen-and-Paper | Scenario B — Digital |
|-------------|---------------------------|----------------------|
| Arrival rate lambda (patients/min) | X.XXXX | X.XXXX (same) |
| Service rate mu (patients/min) | X.XXXX | X.XXXX (higher) |
| Traffic intensity rho | X.XXXX | X.XXXX |
| Avg patients in queue Lq | X.XXXX | X.XXXX |
| Avg queue wait Wq (min) | XX.XX | XX.XX |
| Avg time in system W (min) | XX.XX | XX.XX |

### Report 4 — PHC Compliance Rate Table
"Does the system help patients meet the 150-minute OPD target?"

| Metric | Scenario A | Scenario B |
|--------|-----------|-----------|
| Total patients | XXXX | XXXX |
| Within 150 min | XX.X% | XX.X% |
| Within 180 min | XX.X% | XX.X% |
| Peak hour (08-09) within 150 min | XX.X% | XX.X% |

### Report 5 — Sensitivity Analysis Table
"Does the conclusion hold even if your overhead estimate is off?"

| DIGITAL_REG_REDUCTION | Avg Time Saved (min) | Wq Reduction (%) | Conclusion |
|-----------------------|---------------------|-------------------|------------|
| 1.0 min (conservative) | X.XX | X.X% | Scenario B still faster |
| 2.0 min (base case) | X.XX | X.X% | Scenario B faster |
| 3.0 min (optimistic) | X.XX | X.X% | Scenario B faster |

---

## 6. The Three Findings You Should Be Able to State

After running the simulation, your thesis Chapter 4 must be able to state all three:

1. **Time saved per patient:**
   > "The Heart Check PHC automated queue system reduces average OPD stay time by X.XX minutes
   > per patient (X.X%), driven by eliminating manual stub issuance (~3.5 min) and PA announcement
   > overhead (~1.5 min), and reducing registration service time through kiosk pre-fill (~2.0 min)."

2. **Queue stabilization:**
   > "During the peak arrival window (08:00 to 12:00), the traditional pen-and-paper registration
   > counter operated at a traffic intensity of rho = X.XX [at or above stable capacity].
   > The automated digital system reduces rho to X.XX, stabilizing the queue and eliminating
   > the indefinitely growing backlog."

3. **Compliance improvement:**
   > "PHC OPD compliance with the 150-minute total visit target improved from XX.X% (Scenario A)
   > to XX.X% (Scenario B), representing a X.X-percentage-point improvement attributable directly
   > to queue system automation."

---

## 7. What Makes This Academically Defensible

| Examiner Question | Your Answer |
|-------------------|-------------|
| "Where did your data come from?" | Real PHC consultation room Excel logs, imported into Supabase (March 2024 to December 2025, N = XXXX records, is_historical = true). |
| "Where did your overhead values come from?" | Structured MISD staff interview and direct clinic observation, both conducted at PHC. Not invented. |
| "Why M/M/1?" | PHC's registration counter is a single-server queue. M/M/1 is the standard closed-form model for this configuration. Arrivals are approximately Poisson (random walk-in OPD). |
| "Why peak hours only for M/M/1?" | PHC's morning surge (08:00 to 12:00) is when queue pressure is real. A whole-day arrival rate dilutes lambda and understates the bottleneck. |
| "What if your 2.0-minute estimate is wrong?" | The sensitivity analysis (1.0 / 2.0 / 3.0 min) shows the conclusion holds across the full range of plausible values. |
| "Why compare the same patient records?" | Holding clinical variables constant and only varying the administrative scaffold produces an isolation of exactly the effect the system has. This is the cleanest valid comparison possible with the available data. |
| "Is this generalizable?" | The simulation is scoped to consultation — the only service with real timestamps. This is clearly stated. Consultation accounts for ~45% of daily OPD volume, making it the dominant and most meaningful flow. |

---

## 8. Quick Execution Checklist

- [ ] Fetch historical consultation records (`is_historical = true`, full date range)
- [ ] Preprocess to get all duration columns
- [ ] Compute grand mean of `service_registration` (Scenario A anchor)
- [ ] Compute Scenario B registration mean (grand mean minus 2.0 min, floor 1.0)
- [ ] Filter to peak window (08:00 to 12:00 Manila time) for lambda
- [ ] Compute lambda from real `kiosk_time` timestamps
- [ ] Run M/M/1 for both scenarios; check rho < 1
- [ ] Add per-patient overhead (stochastic, seed=42)
- [ ] Compute total_opd_sim per patient for both scenarios
- [ ] Generate all five report tables
- [ ] Run sensitivity analysis (1.0 / 2.0 / 3.0 min reduction)
- [ ] Write the three key thesis findings as narrative statements
- [ ] Export CSVs for appendix

---

## 9. Comprehensive Methodology Decision Rationale

| Decision | Chosen Approach | Why Other Approaches Were Rejected |
| :--- | :--- | :--- |
| **Data Scope** | Consultation Service Only (2024 full year) | Other services (Triage, ECG, Pharmacy) lack timestamp records in the historical logs. Inventing fake timestamps for other services would destroy the credibility of the entire simulation. Scoping strictly to Consultation is defensible because it represents ~45% of total OPD volume. |
| **Baseline Anchor** | Grand Mean across all 2024 records | Mean of monthly means introduces small-month sample bias. The grand mean is the maximum-likelihood unbiased estimator for M/M/1 service rate (mu). |
| **Model Selection** | Two-tier: Closed-form M/M/1 for registration counter + Empirical stochastic simulation for whole visit | Pure M/M/1 across the entire multi-stage visit assumes exponential service times everywhere, which clinical stages violate. Pure empirical simulation lacks theoretical rigor. Combining closed-form M/M/1 at the registration bottleneck with stochastic simulation of total stay provides maximum defensibility. |
| **Arrival Rate Window** | Morning Peak (08:00 to 12:00 Manila time) | Averaging arrival rate over an 8-hour day dilutes lambda and masks the congestion that actually causes hospital waiting lines. Queues form during the morning arrival surge. |
| **Reproducibility** | Fixed random seed (`seed = 42`) | Academic evaluation requires identical reproducible outputs across multiple execution runs. |

---

## 10. Baseline Computation Analysis: Grand Mean vs. Mean of Monthly Means

A common methodology question during thesis defense is:
> *"Is it more accurate if I average all the monthly averages of 2024 records, then use that as the baseline for the simulation?"*

### Mathematical Comparison

1. **The Grand Mean (Pooled Average):**
   $$\mu_{grand} = \frac{1}{N_{total}} \sum_{i=1}^{N_{total}} X_i$$
   Every patient carries equal weight ($1/N$). Months with 2,500 patients have 5x more weight than months with 500 patients, accurately reflecting real hospital operating conditions.

2. **The Mean of Monthly Means (Unweighted Average):**
   $$\mu_{unweighted} = \frac{1}{12} \sum_{m=1}^{12} \bar{X}_m$$
   Every month carries equal weight ($1/12$), regardless of whether 500 or 2,500 patients attended that month.

### Why the Grand Mean is Selected for Heart Check PHC
- **M/M/1 Theoretical Consistency:** Queueing theory assumes customers arrive from a single aggregate process. The true service rate $\mu$ of the registration clerk is the total patients processed divided by total clerk time. The grand mean matches this definition exactly.
- **Vulnerability to Small-Sample Outliers:** If December has fewer clinic operating days and only 400 records with an anomalous average of 22 minutes, the unweighted average gives that small month identical weight to March (2,200 records, 14.2 minutes), artificially inflating the baseline.
- **Recommendation:** Use the grand mean for all baseline inputs. If thesis advisers specifically request monthly analysis, report the monthly means in an appendix table to demonstrate that the grand mean lies within the inter-month confidence interval.

---

_Last updated: 2026-10-17 — Consolidated all simulation guides into this single authoritative methodology reference._
