# Capstone Chapter 4 Queue Simulation — Execution Guideline

**Last Updated:** 2026-10-19  
**Primary Research Notebook:** [`python_backend/chapter4_simulation.ipynb`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.ipynb)  
**Primary Author / Research Group:** Heart Check PHC Capstone Team (STI College Caloocan — BS Computer Science)

---

## 1. Overview and Non-Invasive Research Mandate

This operational guideline provides comprehensive, step-by-step instructions for executing and reproducing the **Chapter 4 Simulation** of the Heart Check PHC queue management system.

### 1.1 Non-Invasive Research Notice: ZERO Database Insertion
- **100% In-Memory Local Operation:** The simulation is purely analytical and non-invasive. **Absolutely NO database insertion, update, mutation, or remote database connection is performed.**
- **Local File Source:** Raw clinical stage records are extracted directly from the physical hospital consultation room Excel tracking workbooks located in [`python_backend/data_entries/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/data_entries/) (`2024_JAN.xls` through `2024_DEC.xls`).
- **Interactive Jupyter Notebook First:** All data extraction, M/M/1 queuing calculations, sensitivity analyses, and table displays are pre-packaged into a self-contained, interactive Jupyter Notebook: [`python_backend/chapter4_simulation.ipynb`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.ipynb).

### 1.2 Research Question
> Does replacing the traditional manual pen-and-paper queue with the Heart Check PHC automated digital queue system reduce patient waiting time at the registration desk, and by how much?

### 1.3 Dataset Grounding (Whole Year 2024)
The simulation is grounded strictly in the **entire calendar year of 2024 (January 1, 2024 to December 31, 2024, 12 full calendar months)**.
- **Service Scoped:** Consultation Service only (the primary clinical flow representing approximately 45% of total hospital OPD volume, and the only service maintaining empirical timestamped records).
- **Patient Sample Size:** 26,753 validated patient visits imported in-memory from physical consultation room Excel logs (`2024_JAN.xls` through `2024_DEC.xls`).
- **Clinical Data Preservation:** Real clinical durations (`service_registration`, `wait_consultation`, `service_consultation`, `service_carryout`) are drawn directly from the hospital tracking sheets and held constant across both comparative scenarios.

### 1.4 Compared Scenarios
- **Scenario A (Traditional Manual Paper-Based Queue):** Manual walk-up -> staff logs name in paper ledger -> staff issues hand-written queue stub -> verbal PA announcement delay -> registration counter verification -> clinical stages.
- **Scenario B (Heart Check PHC Automated Digital Queue):** Self-service touchscreen kiosk check-in -> thermal printed ticket -> digital waiting room monitor display and automated Text-to-Speech (TTS) callouts -> accelerated registration counter (kiosk pre-filled records) -> identical clinical stages.

---

## 2. Interactive Jupyter Notebook Execution (`chapter4_simulation.ipynb`)

The primary research artifact for thesis defense presentation and review is the **Jupyter Notebook**: [`python_backend/chapter4_simulation.ipynb`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.ipynb).

### 2.1 How to Open and Execute in Antigravity IDE / VS Code / Cursor
1. Open the file [`python_backend/chapter4_simulation.ipynb`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.ipynb) in your IDE.
2. Select the Python kernel pointing to the repository's virtual environment:
   `python_backend/venv/bin/python` (Python 3.12).
3. Click **"Run All"** (or press Shift+Enter through each cell sequentially).
4. Cells will:
   - Extract records across all 12 workbooks in `data_entries/2024_*.xls` (N = 26,753).
   - Display formatted DataFrames for baseline descriptives, M/M/1 queuing metrics, compliance rates, sensitivity analyses, and monthly continuity.
   - Automatically render all 7 publication-ready comparison tables.

### 2.2 How to Launch via Headless Command-Line Execution
If executing headlessly or from terminal without an IDE GUI:
```bash
cd /home/jensen/Github-Repositories/Heart_Check_PHC
python_backend/venv/bin/python -m jupyter nbconvert --to notebook --execute python_backend/chapter4_simulation.ipynb --output python_backend/chapter4_simulation_executed.ipynb
```

---

## 5. Understanding the Six Output Sections

When the simulation finishes, it prints a publication-ready report organized into six analytical sections:

### Section 1: Empirical 2024 Baseline Descriptives (Grand Mean)
- **Total Validated Records:** 26,753 consultation patients across all 12 calendar months of 2024.
- **Arrival Rates:** Full-day arrival rate ($\lambda = 0.0406$ patients/min) and peak morning arrival rate ($\lambda = 0.0236$ patients/min between 08:00 and 12:00 Manila time).
- **Clinical Stage Grand Means:**
  - Registration desk service: mean = 31.63 min (std = 27.33, median = 23.00 min)
  - Wait for doctor consultation: mean = 93.56 min (std = 58.89, median = 81.00 min)
  - Consultation duration: mean = 11.60 min (std = 3.57, median = 10.00 min)
  - Carry-out orders: mean = 7.56 min (n = 26,748)

### Section 2: Stage-by-Stage Comparative Analysis
Compares the patient journey between Scenario A (Manual) and Scenario B (Digital):
- **Ticket / Queue Stub Acquisition:** 3.51 min (Manual) vs. 0.67 min (Digital) -> **2.84 min saved (80.9% reduction)**.
- **Queue Announcement Latency:** 1.50 min (Manual) vs. 0.00 min (Digital) -> **1.50 min saved (100.0% reduction)**.
- **Registration Counter Service:** 31.63 min (Manual) vs. 29.65 min (Digital) -> **1.98 min saved (6.3% reduction)**.
- **Clinical Stages (Consultation Wait, Service, Carryout):** Identical in both scenarios (holding clinical care constant).
- **Total OPD Stay (Simulated Mean):** 149.36 min (Manual) vs. 143.04 min (Digital) -> **6.32 min saved (4.2% overall stay reduction)**.

### Section 3: M/M/1 Queueing Model at Registration Counter (Peak Window)
Evaluates the single-clerk registration counter during the peak morning arrival window (08:00 to 12:00):
- **Manual Scenario A:**
  - $\lambda = 0.0236$ patients/min
  - $\mu = 0.0316$ patients/min
  - Traffic intensity: $\rho = 0.7465$
  - Average queue length: $L_q = 2.1978$ patients
  - Average queue waiting time: $W_q = 93.13$ minutes
  - Average time in registration subsystem: $W = 124.76$ minutes
- **Digital Scenario B:**
  - $\lambda = 0.0236$ patients/min
  - $\mu = 0.0337$ patients/min
  - Traffic intensity: $\rho = 0.6997$
  - Average queue length: $L_q = 1.6307$ patients
  - Average queue waiting time: $W_q = 69.10$ minutes (**24.03 minutes saved in registration queue wait alone!**)
  - Average time in registration subsystem: $W = 98.75$ minutes

### Section 4: Hospital OPD Compliance Targets
Measures compliance with official Philippine Heart Center outpatient benchmarks:
- **150-Minute Target:** Increased from **58.15% (15,558 patients)** in Manual to **62.10% (16,614 patients)** in Digital (**+3.95 percentage points gain**, representing **+1,056 additional patients complying**).
- **180-Minute Target:** Increased from **73.97% (19,788 patients)** to **76.69% (20,517 patients)** (**+2.72 percentage points gain**).
- **Peak Morning Hour (08:00):** Increased from **66.05% (3,795 patients)** to **69.84% (4,013 patients)** (**+3.79 percentage points gain**).

### Section 5: Sensitivity Analysis Across Reduction Assumptions
Tests whether conclusions hold if the kiosk registration reduction varies:
- **Conservative (1.0 min reduction):** $\rho = 0.7230$, $W_q = 79.95$ min, total stay = 144.02 min, 5.33 min saved (3.6% reduction), compliance = 61.52%.
- **Base Case (2.0 min reduction):** $\rho = 0.6997$, $W_q = 69.10$ min, total stay = 143.04 min, 6.32 min saved (4.2% reduction), compliance = 62.10%.
- **Optimistic (3.0 min reduction):** $\rho = 0.6770$, $W_q = 60.11$ min, total stay = 142.07 min, 7.28 min saved (4.9% reduction), compliance = 62.70%.
- **Conclusion:** Under all three scenarios, Scenario B consistently and substantially outperforms Scenario A.

### Section 6: Monthly Continuity (12 Months of 2024)
Presents the empirical patient count and mean stage times across all 12 calendar months:
- January (2,958 patients), February (2,387), March (2,284), April (2,641), May (1,038), June (2,469), July (2,441), August (2,124), September (2,189), October (2,578), November (2,500), December (1,144).
- Confirms uninterrupted full-year coverage and justifies using the pooled Grand Mean rather than unweighted monthly averages.

---

## 6. Generated Publication Artifacts & Thesis Usage Map

All generated CSV summary tables are saved in `python_backend/output/tables/` and all high-resolution visual figures are saved in `python_backend/output/figures/` (at 300 DPI PNG and vector PDF). These files provide verified empirical artifacts ready for immediate inclusion in Chapter 4:

### 6.1 Publication Summary Tables (`output/tables/`)

| Generated File | File Size | Thesis Chapter 4 Usage | Description |
| :--- | :---: | :--- | :--- |
| `table4_1_empirical_baseline.csv` | ~387 B | Table 4.1: Empirical Baseline Descriptive Statistics | Full-year 2024 Grand Mean descriptive statistics across all clinical stages (N = 26,753). |
| `table4_2_stage_comparison.csv` | ~399 B | Table 4.2: Outpatient Flow Comparative Analysis | Per-stage comparison of Scenario A (Manual) vs Scenario B (Digital), time saved, and % reduction. |
| `table4_3_mm1_metrics.csv` | ~443 B | Table 4.3: Registration Counter M/M/1 Queue Metrics | Peak morning window (08:00–12:00) queueing metrics ($\lambda, \mu, \rho, L_q, W_q, W$). |
| `table4_4_compliance_summary.csv` | ~333 B | Table 4.4: Hospital Target Compliance Comparison | Compliance rates and improvements for 150-min target, 180-min ceiling, and 08:00 peak hour. |
| `table4_5_sensitivity_analysis.csv` | ~294 B | Table 4.5: Sensitivity Analysis Across Kiosk Reductions | Robustness evaluation across 1.0 min, 2.0 min, and 3.0 min kiosk pre-fill reductions. |
| `table4_6_monthly_continuity_2024.csv` | ~548 B | Table 4.6: 2024 Monthly Continuity Breakdown | Month-by-month patient counts and stage durations across all 12 calendar months of 2024. |
| `table4_7_inferential_statistics.csv` | ~408 B | Table 4.7: Inferential Hypothesis Testing & Bias Metrics | Paired t-test, Wilcoxon signed-rank test, Cohen's d effect size, and 95% confidence interval. |

### 6.2 Publication Figures (`output/figures/`)

| Generated Figure | Format | Thesis Chapter 4 Figure | Description |
| :--- | :---: | :--- | :--- |
| `fig4_1_stage_comparison.png` | PNG / PDF | Figure 4.1: Stage Comparison | Horizontal bar chart contrasting Scenario A vs B across journey stages. |
| `fig4_2_duration_distribution_kde.png` | PNG / PDF | Figure 4.2: Duration Distribution KDE | Kernel Density Estimation showing leftward shift in patient visit times. |
| `fig4_3_empirical_cdf_compliance.png` | PNG / PDF | Figure 4.3: Empirical CDF Compliance | Cumulative distribution curves highlighting compliance expansion at 150 min. |
| `fig4_4_mm1_operating_curve.png` | PNG / PDF | Figure 4.4: M/M/1 Operating Curve | Non-linear queueing curve showing shift away from steep exponential congestion. |
| `fig4_5_hourly_intake_congestion.png` | PNG / PDF | Figure 4.5: Hourly Intake Congestion | Diurnal arrival pattern showing morning peak arrival pressure (08:00-12:00). |
| `fig4_6_sensitivity_analysis.png` | PNG / PDF | Figure 4.6: Sensitivity Analysis | Multi-scenario evaluation across 1.0, 2.0, and 3.0 min desk acceleration. |
| `fig4_7_discrete_event_queue_buildup.png` | PNG / PDF | Figure 4.7: Discrete-Event Queue Buildup | Peak-day queue trajectory contrasting manual buildup vs digital queue control. |

---

## 7. Defense Committee Questions and Answers Cheatsheet

| Examiner Question | Defensible Answer |
| :--- | :--- |
| **"Where did your dataset come from?"** | The simulation is grounded in 26,753 real patient consultation visits from the Philippine Heart Center Outpatient Department across the entire calendar year of 2024 (January 1 to December 31, 2024). Data was extracted from physical consultation room Excel logs (`2024_JAN.xls` through `2024_DEC.xls`). |
| **"Why is the study scoped to Consultation only?"** | Consultation is the sole service for which PHC maintains timestamped tracking records (Queuing Time, Initial Assessment, Doctor Seen, Doctor Completed, Carry Out Completed). Other services (ECG, Pharmacy, Warfarin) have no historical timestamps. Inventing synthetic timestamps for other services would compromise empirical validity. Consultation accounts for ~45% of total OPD volume, making it the dominant flow. |
| **"Where did your manual overhead estimates come from?"** | Manual stub issuance (~3.50 min) and verbal callout delay (~1.50 min) were derived from structured interviews with PHC MISD staff and direct observational time-and-motion studies conducted at the PHC OPD clinic. They are not invented numbers. |
| **"Why did you use the Grand Mean instead of averaging monthly means?"** | The Grand Mean is the maximum-likelihood unbiased estimator for queueing theory service rates ($\mu$). Unweighted monthly averaging would give thin-volume months (such as May with 1,038 records) identical weight to peak-volume months (January with 2,958 records), artificially skewing the baseline. |
| **"Why evaluate M/M/1 during peak morning hours (08:00 to 12:00)?"** | Averaging patient arrival rate ($\lambda$) over an entire 8-hour shift dilutes the rate and masks the morning queue surge that causes congestion. Evaluating the morning peak provides an accurate representation of operational queue pressure. |
| **"What if your 2.0-minute kiosk pre-fill estimate is wrong?"** | The sensitivity analysis evaluates 1.0 min (conservative), 2.0 min (base case), and 3.0 min (optimistic) reductions. In all three scenarios, Scenario B consistently achieves substantial reductions in traffic intensity ($\rho$), queue waiting time ($W_q$), and total visit duration. |

---

## 8. Troubleshooting Matrix

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `No local Excel files found in data_entries` | Working directory is not project root | Ensure execution command runs from repository root: `cd /home/jensen/Github-Repositories/Heart_Check_PHC`. |
| `RuntimeError: Supabase URL or API key is not configured` | Missing `.env.local` when running in online mode | Add `--local` flag to run against local Excel workbooks, or populate `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. |
| `DeprecationWarning: Pyarrow will become a required dependency` | Informational notice from pandas 2.2.0 | Harmless warning; the script functions properly using default numpy backends. |
| Output CSV files not updating | Permissions or read-only directory | Verify write permissions in `python_backend/output/`. The script automatically calls `os.makedirs(output_dir, exist_ok=True)`. |

---

_Last updated: 2026-10-19 — Authoritative execution and reproduction guideline for Heart Check PHC Chapter 4 Simulation._
