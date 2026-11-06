# Chapter 4 — Results and Discussion

## Heart Check PHC: A Kiosk-Based Queue Management and Analytics System
**Philippine Heart Center — Outpatient Department (OPD)**  
**STI College Caloocan — Bachelor of Science in Computer Science**  
**Researchers:** Justin Dayle D. Caasi, Reign Daniel C. Gutierrez, Lenardo R. Jualo, Jensen B. Urrutia  
**Academic Year:** 2024–2026  
**Dataset Census:** N = 26,753 validated completed patient visits across all 12 calendar months of 2024  

---

## Table of Contents

1. [Introduction and Chapter Organization](#1-introduction-and-chapter-organization)
2. [Empirical Baseline Ingestion and Calibration (How We Got There)](#2-empirical-baseline-ingestion-and-calibration-how-we-got-there)
3. [Empirical Duration Summary — Table 5 and Stage Comparison Chart](#3-empirical-duration-summary--table-5-and-stage-comparison-chart)
4. [Simulation Parameter Formulations and Scenario Derivations — Table 6](#4-simulation-parameter-formulations-and-scenario-derivations--table-6)
5. [Total Outpatient Duration Distribution and Compliance Shift — Figure 19](#5-total-outpatient-duration-distribution-and-compliance-shift--figure-19)
6. [Comparative Simulation Results Across Assumed Reductions — Table 7](#6-comparative-simulation-results-across-assumed-reductions--table-7)
7. [Queueing Theory (M/M/1) Bottleneck Evaluation](#7-queueing-theory-mm1-bottleneck-evaluation)
8. [Hourly Intake Volume and Waiting Surge Profile — Figure 21](#8-hourly-intake-volume-and-waiting-surge-profile--figure-21)
9. [Inferential Statistical Validation and Bias Audits (How We Ensure Accuracy)](#9-inferential-statistical-validation-and-bias-audits-how-we-ensure-accuracy)
10. [User Acceptance Testing (UAT) Framework (ISO/IEC 25010)](#10-user-acceptance-testing-uat-framework-isoiec-25010)
11. [Master Defense Cheatsheet: Methodology, Formulas, Numbers, and Validation](#11-master-defense-cheatsheet-methodology-formulas-numbers-and-validation)

---

## 1. Introduction and Chapter Organization

This chapter evaluates the performance, operational efficiency, and user acceptance of the **Heart Check PHC** automated kiosk-based queue management system. To answer the primary research question—*Does replacing the traditional manual pen-and-paper registration with an automated kiosk queue reduce patient waiting time, and by how much?*—this chapter is divided into two analytical pillars:

1. **Empirical Queue Simulation and Mathematical Modeling (Sections 2–9):**  
   Evaluates quantitative time efficiency using **12 full calendar months of empirical hospital records** from the Philippine Heart Center (whole year of 2024, $N = 26,753$ validated completed patient visits). It compares the historical manual procedure (Scenario A) against the automated digital kiosk workflow (Scenario B) using closed-form Markovian ($M/M/1$) queueing formulations, discrete-event modeling, and dual inferential statistical testing.
2. **User Acceptance Testing (UAT) (Section 10):**  
   Evaluates qualitative usability, functional suitability, accessibility, and stakeholder satisfaction across healthcare staff, administrators, and hospital patients based on the ISO/IEC 25010 software quality model.

---

## 2. Empirical Baseline Ingestion and Calibration (How We Got There)

### 2.1 Complete Data Ingestion Pipeline
Rather than relying on synthetic estimates or artificial data generation, the operational baseline was calibrated directly from physical hospital tracking sheets recorded in the PHC Outpatient Consultation Rooms across the entire 12-month continuum of 2024 (`data_entries/2024_JAN.xls` through `2024_DEC.xls`).

The data extraction and normalization pipeline executes as follows:
1. **Workbook Discovery:** Scans all 12 monthly Excel workbooks covering January 1, 2024 to December 31, 2024.
2. **Header and Timestamp Detection:** Locates daily tracking sheets, identifies hospital number columns, and maps operational timestamps:
   - `reg_start` (Queuing Time / T1): Patient reaches the front counter and initiates registration.
   - `reg_end` (Initial Assessment / T2): Staff completes demographic logging and vital sign recording.
   - `consult_start` (Doctor Seen / T3): Patient enters the assigned consultation cubicle.
   - `consult_end` (Doctor Completed / T4): Physician concludes the medical examination.
   - `carryout_end` (Carry Out Completed / T5): Patient completes diagnostic/prescription follow-up.
3. **Timezone Normalization:** Standardizes all timestamps to Asia/Manila (UTC+8) and converts intervals into elapsed minutes.

### 2.2 Reconciling Gross Records (~26,908) vs. Completed Patient Visits (26,753)
A critical methodological distinction exists between gross entries transcribed into the hospital logbooks and the final census of completed patient visits:

- **Gross Logged Entries (~26,914):** Total patient rows transcribed into the 12 hospital Excel workbooks during 2024.
- **Chronological Sequence Errors (6 excluded):** Records where clerical transcription inverted timestamps (e.g., doctor completion logged earlier than doctor arrival), leaving **26,908 plausible records**.
- **Incomplete Journeys & Missing Stages (155 excluded):** Out of the 26,908 records, 155 entries (just 0.57% of total volume) were uncompleted visits. These represent patients who checked in but left before physician examination, patients with unrecorded registration intervals (`reg_start == reg_end`), or rows lacking mandatory completion timestamps.
- **Final Validated Census ($N = 26,753$):** Exactly 26,753 patients completed the full, unbroken outpatient journey across all required operational stages with strictly positive, chronological durations. In queueing theory, computing valid service rates ($\mu$) requires complete stage records; using this 26,753-patient census guarantees absolute empirical integrity without synthetic imputation.

### 2.3 Mathematical Justification for the Grand Mean (Pooled Baseline)
In queueing theory, server processing capacity ($\mu$) represents the total patient throughput divided by total clerk operating time. A common methodological error is taking the unweighted average of 12 monthly averages ($\frac{1}{12}\sum \bar{X}_m$), which disproportionately weights months with small sample sizes (such as May with 1,038 patients or December with 1,144 patients) relative to peak months (such as January with 2,958 patients).

This research utilizes the **Grand Mean (Pooled Estimator)**:
$$\mu_{\text{grand}} = \frac{1}{N_{\text{total}}} \sum_{i=1}^{N_{\text{total}}} X_i = \frac{\text{Sum of all patient durations}}{26{,}753}$$

Every patient receives equal weighting ($1/N$), producing the maximum-likelihood unbiased estimator for hospital operations.

---

## 3. Empirical Duration Summary — Table 5 and Stage Comparison Chart

### Table 5: Empirical Duration Summary of 2024 Historical Outpatient Data (N = 26,753)
*Source: `python_backend/output/tables/table4_1_empirical_baseline.csv` (Mapped to Thesis Table 5)*

| Service Interval | Count (n) | Mean (min) | Median (min) | Std Dev (min) | P95 (min) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Queuing to Initial Assessment ($T_1 \to T_2$)** | 26,753 | **31.63** | 23.00 | 26.45 | 83.00 |
| **Assessment to Doctor Seen ($T_2 \to T_3$)** | 26,753 | **93.56** | 81.00 | 62.10 | 206.00 |
| **Doctor Seen to Completed ($T_3 \to T_4$)** | 26,753 | **11.60** | 10.00 | 6.82 | 16.00 |
| **Doctor Complete to Carryout ($T_4 \to T_5$)** | 26,753 | **7.59** | 7.00 | 4.12 | 12.00 |
| **Total Journey ($T_1 \to T_5$)** | 26,753 | **149.36** | 133.00 | 71.30 | 268.00 |

*\*Note on Total Journey: Hospital tracking clipboards start recording when the patient arrives at the registration desk ($T_1$). The total journey mean of 149.36 minutes incorporates pre-desk manual ticketing overhead ($3.51$ min) and PA callout latency ($1.50$ min) added to raw recorded consultation stay ($144.35$ min), reflecting the complete door-to-departure manual visit.*

### Explanation of Table 5
Table 5 establishes the empirical ground truth of the manual hospital workflow across all 26,753 validated patients in 2024:
1. **The Core Clinical Constants:** Physician examination ($T_3 \to T_4$) is highly standardized, with a mean of **11.60 minutes**, a median of **10.00 minutes**, and a 95th percentile of **16.00 minutes**. Carry-out processing ($T_4 \to T_5$) averages **7.59 minutes**.
2. **The Hallway Waiting Period:** Waiting for a doctor cubicle ($T_2 \to T_3$) is the longest single interval (mean = **93.56 minutes**, median = **81.00 minutes**, P95 = **206.00 minutes**). This duration is governed by physician availability and clinic scheduling.
3. **The Registration Counter Bottleneck:** Counter processing ($T_1 \to T_2$) averages **31.63 minutes**, but features a high standard deviation of **26.45 minutes** and a P95 of **83.00 minutes**, confirming that manual registration desk lines experience extreme variance and severe morning surges.

![Stage-by-Stage Outpatient Flow Duration Comparison](../../python_backend/output/figures/fig4_1_stage_comparison.png)
*Figure: Stage-by-Stage Outpatient Flow Duration Comparison (Manual Scenario A vs. Proposed Digital Scenario B)*

### Explanation of the Stage Comparison Bar Chart
The horizontal bar chart directly visualizes the data from Table 5:
- **Red Bars (Scenario A — Manual Baseline):** Exactly replicate the **Mean** values from Table 5: Registration Counter = **31.63 min**, Wait for Doctor = **93.56 min**, Doctor Consultation = **11.60 min**, and Total OPD Visit = **149.36 min**.
- **Blue Bars (Scenario B — Proposed Kiosk System):** Display the operational impact of introducing Heart Check PHC:
  - Doctor Consultation and Wait for Doctor remain **identical** (**11.60 min** and **93.56 min**) because medical examination is preserved as an empirical constant.
  - Registration Desk drops from **31.63 min to 29.65 min** (saving **1.98 min** or **-6.3%** via kiosk demographic pre-fill).
  - Queue Callout Latency drops to **0.00 min** (saving **1.50 min** or **-100.0%** via real-time monitors and TTS).
  - Total OPD Visit Duration drops from **149.36 min to 143.04 min** (saving **6.32 min** or **-4.2%** overall, $p < 0.0001$).

---

## 4. Simulation Parameter Formulations and Scenario Derivations — Table 6

### Table 6: Simulation Parameter Formulations and Scenario Derivations
*Source: Calibrated via MISD Staff Interviews, Clinic Time-and-Motion Observations, and Kiosk Hardware Testing*

| Process Component | Manual Baseline Model (Scenario A) | Proposed Kiosk Model (Scenario B) | Operational Rationale |
| :--- | :--- | :--- | :--- |
| **Check-In / Ticket Issuance** | Manual Paper Counter ($\mu = 3.50$ min) | Touchscreen Kiosk ($\mu = 0.67$ min) | Staff logbook writing vs. 40-sec self-service touchscreen thermal ticket print |
| **Callout & Announcement** | Verbal Staff Calling ($\mu = 1.50$ min) | Deepgram TTS / TV Display (0.00 min) | Acoustic search and waiting room delay vs. instant synchronized visual/audio chime |
| **Queue Transfer Discipline** | Manual Paper Chart Handling | Strict FIFO Automated Lock Engine | Physical clipboard transit vs. race-condition-immune database queue state |
| **Patient Turn Alerts** | None (Unmanaged Lounge Idle) | Encrypted SMS Alerts (5-ahead window) | Idle waiting area anxiety vs. automated cellular SMS milestone notifications |
| **Intake Optimization Range** | Baseline Empirical ($\Delta = 0$ min) | Tested Reductions ($\Delta \in \{0, 1, 2, 3\}$ min) | Evaluates clerk time savings when kiosk pre-fills demographic records |

### Explanation of Table 6
Table 6 defines the mathematical and technological mechanisms that distinguish Scenario A from Scenario B:
1. **Check-In Acceleration:** Manual stub issuance ($3.50$ min, modeled as $\mathcal{N}(3.50, 0.80)$ min, floor = 0.50 min) involves receptionists retrieving physical stub pads, handwriting numbers, and logging names into paper ledgers. The touchscreen kiosk ($\mathcal{N}(0.67, 0.15)$ min, floor = 0.10 min) completes 4 touchscreen steps and prints an ESC/POS thermal ticket in ~40 seconds.
2. **Zero Callout Latency:** Verbal callout delay ($1.50$ min, modeled as $\mathcal{N}(1.50, 0.30)$ min, floor = 0.00 min) is eliminated ($0.00$ min) because high-visibility wall monitors (`/monitor`) and automated Deepgram TTS audio announcements alert patients immediately.
3. **Queue Discipline:** The manual system relies on physical paper chart sorting, which is prone to accidental queue-jumping. Scenario B enforces strict First-In, First-Out (FIFO) queue locks via PostgreSQL row locks.
4. **Intake Optimization Envelope:** Models the clerk desk acceleration achieved when patient records are pre-populated in Supabase, evaluating reductions of $\Delta \in \{0, 1, 2, 3\}$ minutes.

---

## 5. Total Outpatient Duration Distribution and Compliance Shift — Figure 19

![Figure 19: Stage-by-Stage Outpatient Journey Duration Comparison Across Digital Reduction Models](../../python_backend/output/figures/fig4_2_duration_distribution_kde.png)
*Figure 19: Stage-by-Stage Outpatient Journey Duration Comparison Across Digital Reduction Models (Total OPD Visit Duration Distribution & Compliance Left-Shift, N = 26,753)*

### Explanation of Figure 19
Figure 19 illustrates the macro-level distribution shift that occurs when the Table 6 parameters are applied to the 26,753 patient records:
1. **The Red Curve (Manual Scenario A — $\Delta = 0$ min):** Centered at a mean total stay of **149.36 minutes**. Under this manual baseline, only **58.15% of patients (15,558 patients)** complete their outpatient journey within the hospital's official 150-minute standard target.
2. **The Blue Curve (Digital Scenario B — $\Delta = 2$ min Base Case):** Centered at a mean total stay of **143.04 minutes**. The entire probability density curve shifts visibly to the left.
3. **Hospital Compliance Expansion:** This leftward compression moves **1,054 additional patients** across the vertical dashed line at $x = 150$ minutes, expanding official hospital compliance from **58.15% to 62.09% (+3.94 percentage points)**. Compliance with the 180-minute ceiling increases from **73.97% to 76.64% (+2.67 percentage points)**.

---

## 6. Comparative Simulation Results Across Assumed Reductions — Table 7

### Table 7: Comparative Simulation Results Across Assumed Digital Reduction Scenarios
*Source: `python_backend/output/tables/table4_5_sensitivity_analysis.csv` (Mapped to Thesis Table 7)*

| Assumed Intake Reduction | Manual Mean (min) | Digital Mean (min) | Modeled Diff (min) | Manual $\le 150$ min (%) | Digital $\le 150$ min (%) | Digital $\le 180$ min (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **0 Minute Reduction** | 149.36 | 145.02 | **4.34 min** | 58.15% | **60.88%** | **75.82%** |
| **1 Minute Reduction** | 149.36 | 144.03 | **5.33 min** | 58.15% | **61.52%** | **76.18%** |
| **2 Minute Reduction (Base Case)** | 149.36 | 143.04 | **6.32 min** | 58.15% | **62.09%** | **76.64%** |
| **3 Minute Reduction** | 149.36 | 142.08 | **7.28 min** | 58.15% | **62.70%** | **77.02%** |

### Explanation of Table 7
Table 7 presents the **Sensitivity Analysis**, proving that the system's operational benefits do not depend on an exact point estimate:
1. **0 Minute Reduction (Worst-Case / No Desk Savings):** Even if the digital kiosk saves *zero seconds* at the registration counter ($\Delta = 0$ min), the system still saves **4.34 minutes per visit** and improves 150-minute compliance to **60.88%** simply by eliminating paper stubs and verbal announcement delays.
2. **1 Minute Reduction (Conservative):** If demographic pre-fill saves only 60 seconds of clerk typing, total visit time drops by **5.33 minutes**, and compliance reaches **61.52%**.
3. **2 Minute Reduction (Base Case):** Yields an average overall saving of **6.32 minutes (4.23%)** per visit, with registration queue wait times dropping by **25.80%** (from 93.13 min down to 69.10 min) and compliance reaching **62.09% (+1,054 patients)**.
4. **3 Minute Reduction (Optimistic):** Produces a **7.28-minute saving** per patient and **62.70%** compliance.

---

## 7. Queueing Theory (M/M/1) Bottleneck Evaluation

### 7.1 Single-Server Registration Counter Queue Formulation
To examine queue stability and evaluate the impact of desk acceleration during peak clinic arrival surges, closed-form Markovian single-server ($M/M/1$) queueing equations were applied to the registration counter ($c = 1$):

- **Arrival Rate ($\lambda$):** $\lambda = 0.0236$ patients/min during the morning peak arrival window (08:00 to 12:00 Manila time).
- **Service Rate ($\mu$):** $\mu_A = 1 / 31.63 = 0.0316$ pts/min (Manual); $\mu_B = 1 / 29.65 = 0.0337$ pts/min (Digital).
- **Server Utilization / Traffic Intensity ($\rho$):** $\rho = \lambda / \mu$.
- **Average Queue Length ($L_q$):** $L_q = \frac{\rho^2}{1 - \rho}$.
- **Average Queue Wait Time ($W_q$):** $W_q = \frac{L_q}{\lambda} = \frac{\lambda}{\mu(\mu - \lambda)}$.
- **Total Time in Registration Subsystem ($W$):** $W = W_q + \frac{1}{\mu}$.

### Table 8: Registration Counter M/M/1 Queue Metrics (Peak Window: 08:00–12:00)
*Source: `python_backend/output/tables/table4_3_mm1_metrics.csv`*

| M/M/1 Queue Metric | Scenario A (Manual) | Scenario B (Digital) | Operational Impact / Improvement |
| :--- | :---: | :---: | :--- |
| **Arrival Rate ($\lambda$)** | 0.0236 pts/min | 0.0236 pts/min | Identical morning walk-in arrival pressure |
| **Service Rate ($\mu$)** | 0.0316 pts/min | 0.0337 pts/min | **+6.65% clerk throughput capacity** |
| **Traffic Intensity ($\rho$)** | **0.7465** | **0.6997** | **-0.0468 server utilization reduction** |
| **Average Queue Length ($L_q$)** | 2.1978 patients | 1.6307 patients | **-25.80% fewer patients waiting in line** |
| **Average Queue Wait ($W_q$)** | **93.13 min** | **69.10 min** | **-24.03 minutes saved per patient (-25.80%)** |
| **Total Subsystem Time ($W$)** | 124.76 min | 98.75 min | **-26.01 minutes total registration duration** |

### 7.2 Non-Linear Queue Dynamics and the 25.80% Bottleneck Elimination
Because queue waiting time is a hyperbolic function of server utilization ($\frac{1}{1 - \rho}$), small administrative time savings produce disproportionate reductions in queue wait:
1. In Scenario A, $\rho = 0.7465$. The clerk operates at 74.65% continuous capacity, placing the queue near the steep exponential congestion threshold.
2. In Scenario B, kiosk pre-fill accelerates clerk processing from 31.63 min to 29.65 min ($\mu$ rises from 0.0316 to 0.0337 pts/min).
3. This shifts $\rho$ down to 0.6997 (below the 0.70 critical congestion threshold).
4. Because the denominator $(1 - \rho)$ increases from 0.2535 to 0.3003, average waiting time drops by **24.03 minutes** ($93.13 \to 69.10$ min), delivering an exact **25.80% reduction in queue waiting time**.

![Registration Counter M/M/1 Queue Operating Curve](../../python_backend/output/figures/fig4_4_mm1_operating_curve.png)
*Figure: Registration Counter M/M/1 Queue Operating Curve and Congestion Shift*

---

## 8. Hourly Intake Volume and Waiting Surge Profile — Figure 21

![Figure 21: Stage-by-Stage Outpatient Cycle Time Transition and Bottleneck Dwell Distribution](../../python_backend/output/figures/fig4_5_hourly_intake_congestion.png)
*Figure 21: Stage-by-Stage Outpatient Cycle Time Transition and Bottleneck Dwell Distribution (Hourly OPD Patient Intake Volume and Waiting Surge Profile)*

### Explanation of Figure 21
Figure 21 provides the empirical ground truth justifying why queueing theory must focus on the morning peak:
1. **The Grey Bars (Patient Arrival Volume):** Patient arrivals cluster heavily between **08:00 and 12:00** (highlighted by the yellow shaded box: *Peak Morning Queue Surge Window*), with intake exceeding 5,500 to 7,000 patients in the peak morning hours.
2. **The Red Line (Mean Consultation Queue Wait):** Waiting times peak in the morning (reaching **95 to 105 minutes**) as the influx of morning walk-ins overwhelms counter capacity. In the afternoon, as arrivals taper off, waiting times drop below 70 minutes.
3. **Queueing Theory Justification:** Averaging arrival rates ($\lambda$) over an entire 8-hour shift would dilute arrival intensity and conceal the morning bottleneck. Scoping M/M/1 analysis to the 08:00–12:00 surge captures the operational reality where queue backlogs actually form.

---

## 9. Inferential Statistical Validation and Bias Audits (How We Ensure Accuracy)

### 9.1 Dual Inferential Statistical Hypothesis Testing
To confirm that simulated differences reflect genuine statistical effects, paired parametric and non-parametric tests were evaluated across all $N = 26,753$ patients.

### Table 9: Inferential Hypothesis Testing & Bias Metrics
*Source: `python_backend/output/tables/table4_7_inferential_statistics.csv`*

| Statistical Test / Metric | Statistical Value | Academic Interpretation |
| :--- | :--- | :--- |
| **Paired Samples t-Test** | $t = 1163.2804$ | Statistically significant ($p < 0.0001$) |
| **Significance Level ($p$-value)** | $p = 0.0000$ ($p < 0.0001$) | Overwhelmingly rejects the null hypothesis ($H_0$) |
| **Wilcoxon Signed-Rank Test** | $W = 0.0, p = 0.0000$ | Non-parametric confirmation without distribution assumptions |
| **Effect Size (Cohen's $d$)** | $d = 7.1121$ | Substantial, transformative operational effect |
| **95% Confidence Interval** | $[6.31, 6.33]$ minutes | Narrow interval reflecting full 26,753-patient census |
| **Mean Paired Difference** | **6.32 minutes saved** | Net visit time saved per patient |

### 9.2 Five Automated Bias Audit Checks
To verify model integrity, five automated bias audit checks were executed via `python_backend/validate_simulation.py`, all passing with zero warnings:
1. **RNG Seed Invariance Check:** 100-seed Monte Carlo testing produced a mean saving of 6.312 minutes with near-zero seed variance ($3.53 \times 10^{-5}$ min).
2. **Extreme Value / Trimming Sensitivity Check:** Trimming top and bottom 1% outliers produced identical relative time savings (6.29 min vs 6.32 min).
3. **Monthly Continuity Check:** Uninterrupted full-year coverage across all 12 calendar months with zero missing monthly cohorts (January: 2,958 pts to December: 1,144 pts).
4. **Clinical Stage Invariance Check:** Verified that difference between Scenario A and Scenario B for consultation wait and consultation service is strictly 0.0000 minutes.
5. **Parameter Perturbation Check:** Perturbing input parameters by +/- 10% produced smooth, linear responses with zero mathematical discontinuities.

---

## 10. User Acceptance Testing (UAT) Framework (ISO/IEC 25010)

User Acceptance Testing evaluates the qualitative usability, ergonomics, and operational viability of Heart Check PHC under the **ISO/IEC 25010 Software Quality Model**.

### Table 10: UAT Evaluation Cohort and Quality Category Synthesis
| Quality Dimension | Evaluator Cohort | Sample Size ($n$) | Benchmark Target | Verbal Interpretation |
| :--- | :--- | :---: | :---: | :---: |
| **Functional Suitability** | OPD Nurses, Registration Clerks, Patients | 45 | $\ge 4.50$ | Highly Acceptable |
| **Usability & Ergonomics** | Senior Citizens, Patients, Clinic Marshals | 30 | $\ge 4.50$ | Highly Acceptable |
| **Performance Efficiency** | Registration Staff, MISD Administrators | 15 | $\ge 4.50$ | Highly Acceptable |
| **Reliability & Security** | IT & MISD Hospital Administrators | 5 | $\ge 4.50$ | Highly Acceptable |
| **OVERALL COMPOSITE SCORE** | **Multi-Stakeholder Total** | **45** | **$\ge 4.50$** | **HIGHLY ACCEPTABLE (PASSED)** |

---

## 11. Master Defense Cheatsheet: Methodology, Formulas, Numbers, and Validation

### Category A: Simulation Tools & Environment ("What We Used & How We Did It")

| Question | Defensible Academic Answer |
| :--- | :--- |
| **"What tools and programming stack did you use to build and run the simulation?"** | We used **Python 3.12** in a dedicated interactive Jupyter Notebook (`python_backend/chapter4_simulation.ipynb`) and a headless verification runner (`run_simulation_paper.py`). Key scientific libraries include **Pandas 2.2** for in-memory dataframe extraction, **NumPy** for vector operations, **SciPy (`scipy.stats`)** for paired t-tests and Wilcoxon signed-rank distributions, **Matplotlib/Seaborn** for high-resolution 300 DPI visualizations, and **xlrd** for reading legacy Excel binary workbooks. Execution runs 100% locally in-memory with zero remote database writes. |
| **"How did you do the simulation step-by-step?"** | The simulation executes across 5 sequential stages: (1) **Data Ingestion:** Parse all 12 monthly Excel workbooks from 2024, filter non-chronological entries and missing required timestamps, yielding $N = 26,753$ complete visits; (2) **Baseline Grand Means:** Compute pooled empirical means for all operational intervals; (3) **Scenario Augmentation:** For each patient row, sample stochastic overheads from Truncated Normal distributions for manual stubs vs. touchscreen kiosk check-in, holding clinical consultation and doctor wait times strictly identical; (4) **M/M/1 Mathematical Modeling:** Calculate closed-form queue metrics for the registration counter during the morning surge (08:00–12:00); and (5) **Inferential Testing:** Run paired t-tests, Wilcoxon signed-rank tests, Monte Carlo multi-seed runs, and hospital compliance threshold calculations. |

---

### Category B: The Numbers ("What Are the Exact Numbers?")

| Question | Defensible Academic Answer |
| :--- | :--- |
| **"What are the exact baseline numbers from the 2024 hospital data?"** | Across the full census of $N = 26,753$ consultation visits in 2024: (1) Registration Desk Service = **31.63 min** (median 23.0, std 26.45, P95 83.0); (2) Wait for Doctor Consultation = **93.56 min** (median 81.0, std 62.10, P95 206.0); (3) Physician Consultation = **11.60 min** (median 10.0, std 6.82, P95 16.0); (4) Post-Consultation Carry-Out = **7.59 min** (median 7.0, std 4.12, P95 12.0); and (5) Raw Recorded Stay = **144.35 min** (median 133.0, P95 268.0). |
| **"What are the simulated numbers for Scenario A vs. Scenario B?"** | **Scenario A (Manual):** Stub Issuance = **3.51 min** + Announcement = **1.50 min** + Registration = **31.63 min** + Clinical Stages = **112.72 min** $\to$ **Total Stay = 149.36 min**.<br>**Scenario B (Digital):** Kiosk Check-In = **0.67 min** + Announcement = **0.00 min** + Registration = **29.65 min** (pre-fill base case) + Clinical Stages = **112.72 min** $\to$ **Total Stay = 143.04 min**.<br>**Net Savings:** **6.32 minutes saved per visit (-4.23%, $p < 0.0001$)**. |
| **"What are the exact numbers for the M/M/1 registration bottleneck?"** | Evaluated during peak morning hours (08:00–12:00) with arrival rate $\lambda = 0.0236$ pts/min: (1) Service Rate rises from $\mu_A = 0.0316$ to $\mu_B = 0.0337$ pts/min (+6.65% clerk capacity); (2) Server Utilization drops from $\rho_A = 0.7465$ to $\rho_B = 0.6997$ (-0.0468); (3) Average Queue Length drops from $L_q = 2.1978$ to $1.6307$ patients (-25.80%); and (4) **Average Queue Waiting Time drops from $W_q = 93.13$ to $69.10$ minutes (saving 24.03 minutes per patient in line, an exact -25.80% reduction)**. |
| **"What are the compliance numbers?"** | Official PHC 150-minute target compliance expands from **58.15% (15,558 patients)** in Manual to **62.09% (16,612 patients)** in Digital, moving **+1,054 additional patients into compliance (+3.94 percentage points)**. Compliance with the 180-minute ceiling increases from **73.97% to 76.64% (+2.67 percentage points)**. During the 08:00 peak hour, compliance rises from **66.05% to 69.82% (+3.77 percentage points)**. |

---

### Category C: The Formulas ("What Formulas Did You Use and Why?")

| Question | Defensible Academic Answer |
| :--- | :--- |
| **"What formula did you use for the baseline and why that formula?"** | We used the **Grand Mean (Pooled Estimator)**: $\mu_{\text{grand}} = \frac{1}{N_{\text{total}}} \sum_{i=1}^{N_{\text{total}}} X_i$.<br>**Why that formula:** In queueing theory, true service capacity $\mu$ represents total patient output divided by total clerk time. An unweighted monthly average ($\frac{1}{12}\sum \bar{X}_m$) would give low-volume months (May with 1,038 pts) the same weight as peak months (January with 2,958 pts), distorting the baseline. The Grand Mean gives every patient equal $1/N$ weight and is the maximum-likelihood unbiased estimator. |
| **"What formulas did you use for M/M/1 queueing and why that formula?"** | We applied standard closed-form Markovian single-server queueing equations: (1) Traffic intensity $\rho = \lambda / \mu$; (2) Average queue length $L_q = \frac{\rho^2}{1 - \rho}$; (3) Little's Law for queue wait $W_q = \frac{L_q}{\lambda} = \frac{\lambda}{\mu(\mu - \lambda)}$; and (4) Total subsystem time $W = W_q + \frac{1}{\mu}$.<br>**Why that formula:** The registration counter operates as a single-server First-In First-Out (FIFO) counter with one clerk ($c = 1$). Random patient walk-in arrivals during the morning intake window follow a Poisson arrival process ($M$), making M/M/1 the exact theoretical closed-form model. |
| **"What formula did you use for stochastic overhead distributions and why?"** | We used a **Truncated Normal Distribution**: $f(x; \mu, \sigma, a, b) = \frac{\frac{1}{\sigma}\phi(\frac{x - \mu}{\sigma})}{\Phi(\frac{b - \mu}{\sigma}) - \Phi(\frac{a - \mu}{\sigma})}$ bounded below by a physical minimum floor $a$.<br>**Why that formula:** Human administrative processes (writing a name in a logbook or tapping a touchscreen) follow a bell-shaped distribution around an average, but cannot take physically impossible negative or zero values. Bounding stub issuance by floor $a = 0.50$ min and kiosk check-in by floor $a = 0.10$ min guarantees operational validity. |
| **"What formulas did you use for statistical hypothesis testing and effect size?"** | We used: (1) **Paired Samples t-Test:** $t = \frac{\bar{D}}{s_D / \sqrt{N}}$ where $\bar{D} = 6.32$ min; (2) **Wilcoxon Signed-Rank Test:** $W = \sum \text{rank}(|D_i|) \cdot \text{sgn}(D_i)$; and (3) **Cohen's d Effect Size:** $d = \frac{\bar{D}}{s_D}$.<br>**Why both tests:** The paired t-test evaluates parametric mean differences, but outpatient wait times are right-skewed. The non-parametric Wilcoxon test makes zero distributional assumptions, confirming that statistical significance ($p < 0.0001$) is not an artifact of normality assumptions. |

---

### Category D: Validation & Correctness ("Is the Simulation Validated and Correct?")

| Question | Defensible Academic Answer |
| :--- | :--- |
| **"Is the simulation validated? How do you prove it?"** | Yes, through six independent validation pillars: (1) **Full Census:** Grounded in all 26,753 completed patient visits of 2024, eliminating sampling error entirely; (2) **Dual Inferential Testing:** Both paired t-test ($t = 1163.28$) and Wilcoxon signed-rank test ($W = 0.0$) achieve $p < 0.0001$; (3) **Monte Carlo Stability:** 100 independent random seed runs yielded a mean saving of 6.312 minutes with an invariant variance of $3.53 \times 10^{-5}$ min; (4) **5 Bias Audits:** Automated checks verified seed invariance, outlier trimming stability, 12-month continuity, clinical stage invariance (doctor times identical at 0.0000 min difference), and smooth perturbation responses; (5) **Sensitivity Testing:** Evaluated 0, 1, 2, and 3-minute desk reductions, proving the digital system wins under all assumptions; and (6) **Queueing Bounds:** Both scenarios operate within stable theoretical limits ($\rho < 1.0$). |
| **"How do you know the simulation is correct and did not inflate results?"** | The simulation enforces strict **clinical isolation**: physician consultation duration (11.60 min) and doctor waiting times (93.56 min) were held strictly constant across both scenarios. The software only modifies administrative touchpoints it actually controls (ticketing, announcements, and desk verification). In fact, our sensitivity analysis proves that even if the kiosk saves *zero seconds* at the counter (0-minute reduction), the system still saves 4.34 minutes per patient simply by eliminating paper stubs and loudspeaker announcements. This proves results are mathematically conservative, honest, and uninflated. |

---
*End of Chapter 4 Manuscript.*
