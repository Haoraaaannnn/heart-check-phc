# Python Backend Architecture & Developer Editing Guide

## Architectural Overview

The Python backend (`python_backend`) provides core data services for the Heart Check PHC platform, including:
1. Fast, asynchronous API endpoints powered by FastAPI (`main.py`)
2. Excel workbook ingestion matching Philippine Heart Center (PHC) Time and Motion formats (`importer.py`, `import_phc_data.py`)
3. Computational analytics, queueing theory modeling, and time-series volume forecasting (`analytics/`)
4. Excel workbook generation reproducing PHC Out-Patient Division (OPD) summary reports (`analytics/export.py`)

All computations rely on UTC timestamps stored in Supabase and convert to Asia/Manila (`UTC+8`) for reporting and export.

---

## Directory Structure

```text
python_backend/
├── main.py                     FastAPI application, endpoints, and route controllers
├── importer.py                 Upload processor for PHC Excel sheets and tabular CSVs
├── import_phc_data.py          Standalone CLI ingestion script for batch imports
├── requirements.txt            Python dependency manifest
├── analytics/
│   ├── __init__.py             Public exports for the analytics module
│   ├── constants.py            Single source of truth for targets, thresholds, and limits
│   ├── helpers.py              Math, timestamp conversions, Erlang C, and rate calculations
│   ├── preprocessing.py        Data cleaning, chronological ordering, and duration derivation
│   ├── descriptive.py          Daily summaries, hourly patterns, monthly breakdowns, and compliance
│   ├── queue_metrics.py        M/M/1 and M/M/c queue metrics, system stay time, Little's Law
│   ├── forecasting.py          SMA, WMA, EMA, Linear Regression, and ARIMA walk-forward forecasting
│   ├── staffing.py             Staffing and cubicle recommendations based on forecasted volume
│   ├── export.py               PHC Time and Motion Analysis Excel export generator
│   └── report.py               Unified analytics pipeline report aggregator
└── data_entries/               Sample PHC historical Excel workbooks for audit and validation
```

---

## Where to Edit Guide

| Type of Modification | Files / Symbols to Edit | Description |
|---|---|---|
| Target stay limits & OPD thresholds | [constants.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py) | Centralized definition of `OPD_TARGET_MINUTES`, `EXAMINE_TREAT_TARGET_MINUTES` (105 min / 1.45 hrs), `EVALUATE_TARGET_MINUTES`, `CARRYOUT_TARGET_MINUTES`, and `WAITING_TIME_TARGET_MINUTES`. |
| Queue stage durations & total time | [preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py) | Derivation of `wait_registration`, `service_registration`, `wait_consultation`, `service_consultation`, `service_carryout`, and `total_time` (`reg_start` to `carryout_end` or `consult_end`). |
| Excel export structure & formulas | [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py) | Openpyxl workbook generation, column formatting, header styles, and bottom 4-row compliance summary block. |
| M/M/1 and M/M/c queue formulas | [helpers.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py), [queue_metrics.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py) | Arrival rate lambda, service rate mu, Erlang C formula (`mmc_benchmark`), and Little's Law verification. |
| Ingestion & AM/PM correction | [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py) | Heuristic hour correction (`_fix_time_heuristic`: hours 1-6 converted to PM, hour 7 preserved as early morning registration). |
| Sheet date reconciliation | [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py) | Intelligent cross-referencing (`resolve_phc_sheet_date`) reconciling raw Excel cell dates with sheet tab names (`M-D`) and workbook filenames to override stale copied templates (e.g. 2023 dates in 2024 workbooks) and string typos (e.g. `1010/2024`). |
| Time-series models & backtesting | [forecasting.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py) | Model implementations for SMA, WMA, EMA, Linear Regression, and ARIMA(1,1,1) with walk-forward validation. |
| Staffing recommendation rules | [staffing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/staffing.py) | Required cubicle calculation and target utilization caps. |
| FastAPI routes & query parameters | [main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py) | API endpoints `/api/dashboard-data`, `/api/export-phc-excel`, `/api/import-file`, and Supabase data queries. |

---

## Core Pipeline Invariants

### 1. Total Time Alignment
- Total waiting time in both analytics (`preprocessing.py`) and export (`export.py`) telescopes from Queuing Time (`reg_start`) to Carry Out Completed (`carryout_end`).
- If carryout was not performed, both pipelines fall back to Doctor Completed (`consult_end`).
- Kiosk entry to registration start (`kiosk_time` to `reg_start`) is preserved as an independent metric (`wait_registration`) and is not folded into total waiting time.

### 2. Single Source of Truth for Compliance Thresholds
- All compliance thresholds are exported from `analytics/constants.py`.
- `EXAMINE_TREAT_TARGET_MINUTES` is 105 minutes (1 hour 45 minutes / 1.45 hrs), matching the official PHC paper form.
- `export.py` imports thresholds from `constants.py` to prevent divergence between the dashboard and generated Excel sheets.

### 3. AM/PM Heuristic Boundary
- Hours 1:00 to 6:59 AM in raw spreadsheets are converted to PM (+12 hours) because PHC OPD operates afternoon clinics.
- Hour 7 (7:00 AM to 7:59 AM) is preserved as morning arrival, protecting patients arriving early for queue numbering and registration.

### 4. Timezone Integrity
- All timestamps in Supabase are stored in UTC.
- Raw CSV imports with timezone-naive timestamps are localized to `Asia/Manila` before converting to UTC.
- Export timestamps are formatted in `Asia/Manila` local time.

### 5. Multi-Source Sheet Date Reconciliation
- In hospital spreadsheets, staff frequently duplicate existing monthly sheets when setting up new dates, which causes stale template cell values (e.g. copying sheet `12-15` into `2024_JAN.xls` without updating the date cell, causing `45275.0` / `2023-12-15` to persist in sheet `1-15`).
- The `resolve_phc_sheet_date` engine reconciles the raw cell date with the sheet name pattern (`M-D` or full month name) and workbook filename year (`2024_JAN.xls`).
- The sheet name and file context take precedence over stale cell contents, ensuring data always attaches to the authentic calendar day.
- Corrects common clerical typos (e.g., `1010/2024` -> `2024-10-10`) so zero patient rows are dropped due to spreadsheet formatting defects.

### 6. PHC Time and Motion Summary Block Formulas
The bottom 4-row compliance summary table in `analytics/export.py` reproduces the hospital's original spreadsheet formulas:
- **Waiting Time <= 2.5 hrs. =**: The hospital template formula tests against `<= 03:00:00` (180 minutes / 3.0 hours via `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES`) rather than 2.5 hours, despite the text label.
- **Evaluate patients <= 30 mins. =**: Tests Column Z (`Queuing Time to Initial Assessment` / `service_registration`) against `<= 00:30:00` (30 minutes).
- **Examine & treat Pts. <= 1.45hrs. =**: Tests Column AA (`Initial Assessment to Doctor Seen` / `wait_consultation`) against `<= 01:45:00` (105 minutes), rather than combining consultation duration.
- **Carry out Dr's Orders <= 15 mins. =**: Tests Column AC (`Doctor Completed to Carry Out Completed` / `service_carryout`) against `<= 00:15:00` (15 minutes).
- **Patient to Doctor Ratio Per Hour =**: Computed as `Patients Seen / Doctors on Duty / 7` using `PHC_CONSULTATION_SHIFT_HOURS` (7 hours), matching the hospital's standard daily consultation shift divisor.

