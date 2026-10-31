# Capstone Chapter 4 Queue Simulation: Documentation Portal & Guide Index

**Last Updated:** 2026-10-19

This directory contains the authoritative research documentation, mathematical formulations, baseline calibration data, execution build guides, and comparative analysis tables for the **Capstone Chapter 4 Simulation** of the Heart Check PHC queue management system.

The simulation proves and quantifies the operational benefits of replacing traditional manual paper-based registration with the automated digital kiosk queue system at the Philippine Heart Center (PHC) Outpatient Department (OPD).

---

## Directory Navigation & Reading Sequence

For academic review, thesis defense preparation, or reproduction of experimental results, consult these authoritative documents:

| Document | Primary Focus | Key Content & Academic Purpose | Status |
| :--- | :--- | :--- | :---: |
| [`docs/simulation/CHAPTER_4_RESULTS_AND_DISCUSSION.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/CHAPTER_4_RESULTS_AND_DISCUSSION.md) | **Complete Chapter 4 Manuscript & UAT** | Primary thesis Chapter 4 document containing full simulation derivations, figures, M/M/1 math, and ready-to-fill ISO/IEC 25010 UAT section. | Authoritative Manuscript |
| [`docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md) | **Step-by-Step Execution Guideline** | Comprehensive instructions to set up the environment, execute the simulation, interpret outputs, and export CSV tables. | Operational Guide |
| [`docs/simulation/simulation-master-guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/simulation-master-guide.md) | **Master Research & Methodology Guide** | Consolidated master methodology guide: research hypothesis, validation pillars, M/M/1 queuing foundations, and baseline computation rationale. | Methodology Guide |
| [`docs/simulation/chapter4_simulation_comparison.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_comparison.md) | **Results & Discussion Archive** | Historical reference tables and sensitivity parameters. | Reference Document |
| [`docs/simulation/chapter4_simulation_build_guide.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_build_guide.md) | **Implementation & Script Guide** | Complete Python code skeleton, database extraction pipeline, and simulation execution instructions. | Technical Guide |

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
| **Primary Research Notebook** | [`python_backend/chapter4_simulation.ipynb`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/chapter4_simulation.ipynb) | Interactive research notebook with inline figures, tables, M/M/1 queuing math, and statistical tests. |
| **Standalone Figure & Table Runner** | [`python_backend/run_simulation_paper.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/run_simulation_paper.py) | Headless Python runner generating 7 publication-ready figures (PNG/PDF) and 7 CSV tables. |
| **Generated Visual Figures** | [`python_backend/output/figures/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/output/figures) | 7 publication figures in 300 DPI PNG and vector PDF for Chapter 4 manuscript. |
| **Generated CSV Tables** | [`python_backend/output/tables/`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/output/tables) | Formatted thesis tables covering stage breakdown, M/M/1 metrics, compliance, and p-values. |
| **Queue Math Helpers** | [`python_backend/analytics/helpers.py`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py) | Closed-form M/M/1 queueing formulations, Little's Law, and rho utilization calculations. |
| **Historical Data Source** | Local `python_backend/data_entries/2024_*.xls` | Real clinical stage records from PHC consultation rooms across the whole year of 2024 (12 full months, N = 26,753). |
| **Execution Guideline** | [`docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md) | Comprehensive interactive notebook reproduction and interpretation manual. |
