# Chapter 4 Simulation Execution & Verification Guide

This document details the configuration, execution, mathematical validation, and troubleshooting of the **Chapter 4 Consultation Simulation (`python_backend/chapter4_simulation.py`)**.

---

## 1. Simulation Purpose & Academic Scope

The Chapter 4 simulation provides quantitative validation for the BS Computer Science capstone thesis:
- **Scope Restriction:** The simulation is scoped **exclusively to the Consultation service**, which possesses real historical timestamped records in Supabase (imported from PHC Excel logs, March 2024 to December 2025).
- **Core Objective:** Compare **Scenario A (Manual Paper-Based OPD Flow)** against **Scenario B (Digital Heart Check PHC System)** to demonstrate measurable reductions in patient waiting time ($W_q$) and queue congestion ($L_q$).

---

## 2. Comparison Framework (Scenario A vs Scenario B)

| Metric / Parameter | Scenario A — Traditional Pen-and-Paper Queue | Scenario B — Automated Digital Queue (Heart Check PHC) |
| :--- | :--- | :--- |
| **Queue System Type** | Fully manual. No digital component. Staff maintains a physical logbook and issues hand-written queue stubs. | Fully automated. Patients self-register at a touchscreen kiosk; printed ticket issued automatically. |
| **Check-in Overhead** | 3.5 to 5.0 min for staff to write patient name in the paper logbook and issue a hand-written queue stub. | 45 to 60 sec automated touchscreen kiosk self-registration; ticket prints with queue number. |
| **Triage and Chart Retrieval** | Physical runner retrieves paper chart from records room (15 to 30 min). | Instant digital queue visibility on the `/transfer` nurse station dashboard. |
| **Queue Discipline** | Vulnerable to paper misplacement, lost stubs, and queue jumping. Staff enforces order manually. | Strict programmatic FIFO lock (`index === 0` only). Queue jumping is structurally impossible. |
| **Patient Callout** | Nurse or staff walks to the waiting area and calls patient name verbally, or uses a PA system. | Automated double-chime, Text-to-Speech name callout, and digital monitor number display. |
| **Queue Model** | M/M/1 queue with paper-based administrative overhead as the primary delay driver. | M/M/1 queue with streamlined digital stage progression and reduced registration service time. |

---

## 3. Running the Simulation

### Prerequisites
- Python 3.10+ virtual environment activated:
  ```bash
  source python_backend/venv/bin/activate
  ```
- Required packages installed: `pandas`, `numpy`, `scipy`, `supabase`, `python-dotenv`.

### Execution Command
```bash
python python_backend/chapter4_simulation.py
```

### Expected Output Summary
1. **Historical Baseline Extraction:**
   - Total consultation records analyzed (March 2024 to Dec 2025).
   - Mean arrival rate ($\lambda$) and mean service rate ($\mu$).
2. **Scenario A Metrics (Manual):**
   - Average total waiting time ($W_{total, A}$).
   - Traffic intensity ($\rho_A$).
3. **Scenario B Metrics (Digital):**
   - Average total waiting time ($W_{total, B}$).
   - Traffic intensity ($\rho_B$).
4. **Comparative Delta:**
   - Percentage reduction in waiting time (typically 30% to 55% reduction).
   - Queue stability and compliance improvements.

---

## 4. Common Simulation Errors & Resolutions

1. **Missing Supabase Environment Variables:**
   - *Error:* `KeyError: 'SUPABASE_URL'` or connection failure.
   - *Fix:* Ensure `.env.local` contains `SUPABASE_URL` and `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
2. **Zero Historical Rows Fetched:**
   - *Error:* `ValueError: No historical consultation records found.`
   - *Fix:* Check `is_historical = true` and `service = 'Consultation'` in Supabase database.
3. **Unstable Queue ($\rho \ge 1$):**
   - *Error:* Negative or infinite $W_q$ values in M/M/1 calculation.
   - *Fix:* Verify that arrival rate $\lambda$ does not exceed service capacity $\mu$. Filter calculations by individual clinical hours (e.g. 08:00 - 12:00) rather than whole-day aggregates.

---

## Cross-References

- [Analytics Engine & ML Models](../knowledge/analytics-and-ml.md)
- [Data Import and Export Pipelines](../knowledge/data-pipelines.md)
- [Chapter 4 Simulation Build Guide (`docs/simulation/chapter4_simulation_build_guide.md`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_build_guide.md)
