# Capstone Chapter 4 Queue Simulation: Documentation Portal & Guide Index

**Last Updated:** 2026-10-17

This directory contains the authoritative research documentation, mathematical formulations, baseline calibration data, execution build guides, and comparative analysis tables for the **Capstone Chapter 4 Simulation** of the Heart Check PHC queue management system.

The simulation proves and quantifies the operational benefits of replacing traditional manual paper-based registration with the automated digital kiosk queue system at the Philippine Heart Center (PHC) Outpatient Department (OPD).

---

## Directory Navigation & Reading Sequence

For academic review, thesis defense preparation, or reproduction of experimental results, consult these authoritative documents:

| Document | Primary Focus | Key Content & Academic Purpose | Status |
| :--- | :--- | :--- | :---: |
| [`docs/simulation/simulation-master-guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/simulation-master-guide.md) | **Master Research & Methodology Guide** | Consolidated master methodology guide: research hypothesis, validation pillars, M/M/1 queuing foundations, Section 9 Comprehensive Decision Rationale, and Section 10 Grand Mean vs. Monthly Means Analysis. | Authoritative Master Guide |
| [`docs/simulation/chapter4_simulation_comparison.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_comparison.md) | **Results & Discussion Manuscript** | Granular side-by-side comparison tables (Manual Scenario A vs. Digital Scenario B), waiting time reduction percentages, traffic intensity reduction, and compliance shifts for thesis Chapter 4. | Primary Manuscript |
| [`docs/simulation/chapter4_simulation_build_guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_build_guide.md) | **Implementation & Script Guide** | Complete Python code skeleton, database extraction pipeline, SimPy/M/M/1 logic, and step-by-step execution instructions. | Technical Guide |

---

## Research Question & Hypotheses

### Primary Question
> Does replacing the traditional pen-and-paper OPD queue with the Heart Check PHC automated digital queue system reduce patient waiting time at the registration desk, and by how much?

### Scenario Definitions
- **Scenario A (Traditional Pen-and-Paper):** Manual walk-up, paper logbook recording, handwritten stub issuance, physical routing, and verbal PA announcements.
- **Scenario B (Automated Digital Queue):** Self-service touchscreen kiosk check-in, thermal printed queue tickets, high-visibility digital waiting room monitors, and automated Text-to-Speech callouts.

---

## Where to Find Code & Artifacts

| Component | Repository Path | Description |
| :--- | :--- | :--- |
| **Simulation Script** | [`python_backend/chapter4_simulation.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.py) | Standalone simulation runner processing historical patient arrival streams. |
| **Queue Math Helpers** | [`python_backend/analytics/helpers.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py) | Closed-form M/M/1 queueing formulations, Little's Law, and rho utilization calculations. |
| **Historical Data Source** | Supabase `patients` (`is_historical = true`) | Real clinical stage records from PHC consultation rooms (March 2024 to December 2025). |
| **Output Appendices** | `python_backend/output/chapter4_*.csv` | Reproducible CSV datasets for thesis document appendices. |
