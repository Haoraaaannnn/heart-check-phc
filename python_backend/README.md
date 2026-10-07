# Python Backend Architecture & Developer Editing Guide

## Architectural Overview

The Python backend (`python_backend`) provides core analytical and computational data services for the Heart Check PHC platform:
1. Fast, asynchronous API endpoints powered by FastAPI ([main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py)).
2. Excel workbook ingestion matching Philippine Heart Center (PHC) Time and Motion formats ([importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py)).
3. Computational analytics, queueing theory modeling, and 5-model time-series volume forecasting ([analytics/](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/)).
4. Official Excel workbook generation reproducing PHC Out-Patient Division (OPD) summary reports ([analytics/export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py)).
5. Synthetic patient seeding and database diagnostics ([db_seeder.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/db_seeder.py), [import_seeder_to_supabase.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_seeder_to_supabase.py)).

All computations rely on UTC timestamps stored in Supabase PostgreSQL and convert to Asia/Manila (`UTC+8`) for localized reporting, grouping, and export.

---

## Detailed Technical Documentation Suite

For granular explanations of every endpoint, parameter, formula, and heuristic, refer to the dedicated technical guides in the `docs/` subdirectory:

1. [API Endpoints Reference](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/API_ENDPOINTS_REFERENCE.md)
   - Comprehensive documentation for all FastAPI routes (`/health`, `/api/dashboard-data`, `/api/daily-drilldown`, `/api/available-years`, `/api/available-export-dates`, `/api/monthly-breakdown/{year}`, `/api/export-excel`, `/api/import-file`).
   - Detailed breakdown of query parameters, path variables, request schemas, status codes, CORS origins, and the in-memory TTL caching layer (`CACHE_TTL_SECONDS = 300`).

2. [Analytics, Algorithms, and Mathematical Models Reference](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/ANALYTICS_AND_ALGORITHMS_REFERENCE.md)
   - Preprocessing engine, NaT-preserving chronological ordering (`_chron_max`), and live-patient gating rules (`fill_as_live`).
   - Queueing theory: arrival rate $\lambda$, service rate $\mu$, closed-form M/M/1 equations, Erlang C multi-server benchmark (M/M/c), cubicle load imbalance metrics, and Little's Law validation ($L = \lambda \times W$).
   - 5-stage bottleneck classification (`Normal`, `Elevated`, `Overwhelmed`, `No Data`) and plain-language clinical explanations.
   - Time-series volume forecasting: walk-forward backtesting of SMA, WMA, EMA ($\alpha = 0.3$), Linear Regression, and ARIMA(1, 1, 1) with optimized refit intervals (`ARIMA_REFIT_INTERVAL = 7`), AIC evaluation, and lowest-MAE winner selection.
   - Staffing and cubicle decision support formulas capping at physical clinic limits (`MAX_ADULT_CUBICLES = 5`, `MAX_PEDIA_CUBICLES = 5`).
   - Master report aggregation and JSON native sanitization converting NumPy types, `NaN`, and `Infinity` to `None`.

3. [Data Ingestion and Export Pipelines Reference](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/DATA_INGESTION_AND_EXPORT_PIPELINES.md)
   - PHC Excel sheet scanning, header row discovery, hospital column identification (`col_idx >= 15`), and column offsets.
   - Intelligent Multi-Source Sheet Date Reconciliation (`resolve_phc_sheet_date`) resolving Excel serial floats, sheet tab names (`M-D`), and workbook filename years (`202\d`) to correct template duplication errors.
   - AM/PM Time Heuristic (`_fix_time_heuristic`): converting hours 1-6 to PM (+12 hours) while preserving hour 7 (7:00 AM) as morning arrival for queue ticketing.
   - Standard tabular dataset ingestion (CSV/XLSX) with automatic header mapping and timezone normalization.
   - Official PHC Time and Motion Analysis Excel export generation (`openpyxl`), 10-column layout (A-J), data privacy exclusion of hospital numbers, and authentic 4-row summary block formula reproduction.

4. [Hardcoded vs. Dynamic Parameters Matrix](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/HARDCODED_VS_DYNAMIC_PARAMETERS_MATRIX.md)
   - Exhaustive lookup table classifying every variable, threshold, constant, timeout, and configuration across the entire backend.
   - Explicit breakdown of hardcoded constants, query parameters, environment variables, and algorithmic calculations.
   - Clinical rationale and instructions on how to make hardcoded parameters dynamic.

5. [Database Integration, Standalone Scripts, and Testing Suite](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/DATABASE_INTEGRATION_AND_SCRIPTS.md)
   - Supabase PostgreSQL schema for the `patients` table, service role isolation, and paginated HTTP client (`Range` headers).
   - Standalone maintenance scripts: `db_seeder.py`, `import_seeder_to_supabase.py`, `import_phc_data.py`, `check_dates.py`, `debug_analytics.py`, `run.py`, and `auto_seed.sh`.
   - Verification suite in `testers/`: `test_analytics.py`, `test_arima.py`, `test_arima_aic.py`, `test_forecasting_pipeline.py`, and `test_staffing.py`.

---

## Directory Structure

```text
python_backend/
├── main.py                     FastAPI application, endpoints, and route controllers
├── importer.py                 Upload processor for PHC Excel sheets and tabular CSVs
├── import_phc_data.py          Standalone CLI ingestion script for batch imports
├── db_seeder.py                Stochastic multi-server queue generator for synthetic data
├── import_seeder_to_supabase.py Batch uploader for simulated patient CSV datasets
├── check_dates.py              Diagnostic utility checking daily patient record counts
├── debug_analytics.py          Diagnostic script running the analytics pipeline offline
├── run.py                      Uvicorn application launcher (0.0.0.0:8000)
├── auto_seed.sh                Automation shell script chaining seeder and uploader
├── requirements.txt            Python dependency manifest
├── docs/                       Comprehensive Technical Documentation Suite
│   ├── API_ENDPOINTS_REFERENCE.md
│   ├── ANALYTICS_AND_ALGORITHMS_REFERENCE.md
│   ├── DATA_INGESTION_AND_EXPORT_PIPELINES.md
│   ├── HARDCODED_VS_DYNAMIC_PARAMETERS_MATRIX.md
│   └── DATABASE_INTEGRATION_AND_SCRIPTS.md
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
├── testers/
│   ├── test_analytics.py       Database connectivity and schema validation
│   ├── test_arima.py           ARIMA walk-forward backtest verification
│   ├── test_arima_aic.py       ARIMA AIC score calculation verification
│   ├── test_forecasting_pipeline.py Unit test verifying end-to-end model execution
│   └── test_staffing.py        Staffing recommendation logic verification
└── data_entries/               Sample PHC historical Excel workbooks for audit and validation
```

---

## Where to Edit Guide

| Type of Modification | Files / Symbols to Edit | Description |
|---|---|---|
| Target stay limits & OPD thresholds | [constants.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py) | Centralized definition of `OPD_TARGET_MINUTES` (150 min), `EXAMINE_TREAT_TARGET_MINUTES` (105 min / 1.45 hrs), `EVALUATE_TARGET_MINUTES` (30 min), `CARRYOUT_TARGET_MINUTES` (15 min), and `WAITING_TIME_TARGET_MINUTES` (150 min). |
| Physical room cubicle limits | [constants.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py) | `MAX_ADULT_CUBICLES` (5) and `MAX_PEDIA_CUBICLES` (5). Caps recommendations in `staffing.py`. |
| Queue stage durations & total time | [preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py) | Derivation of `wait_registration`, `service_registration`, `wait_consultation`, `service_consultation`, `service_carryout`, and `total_time` (`reg_start` to `carryout_end` or `consult_end`). |
| Live ongoing patient fill rules | [preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py) | Qualification check `fill_as_live = (~is_historical) & (kiosk_date_manila == today_manila)` protecting historical and stale prior-day rows from `now()` filling. |
| Excel export structure & formulas | [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py) | Openpyxl workbook generation, column formatting, header styles, and bottom 4-row compliance summary block. |
| M/M/1 and M/M/c queue formulas | [helpers.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py), [queue_metrics.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py) | Arrival rate lambda, service rate mu, Erlang C formula (`mmc_benchmark`), cubicle imbalance calculations, and Little's Law verification ($L = \lambda \times W$). |
| Ingestion & AM/PM correction | [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py) | Heuristic hour correction (`_fix_time_heuristic`: hours 1-6 converted to PM, hour 7 preserved as early morning registration). |
| Sheet date reconciliation | [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py) | Intelligent cross-referencing (`resolve_phc_sheet_date`) reconciling raw Excel cell dates with sheet tab names (`M-D`) and workbook filenames to override stale copied templates and typos. |
| Time-series models & backtesting | [forecasting.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py) | Model implementations for SMA, WMA, EMA, Linear Regression, and ARIMA(1, 1, 1) with optimized refit intervals (`ARIMA_REFIT_INTERVAL = 7`). |
| Staffing recommendation rules | [staffing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/staffing.py) | Required cubicle calculation and target utilization caps (`target_utilization = 0.80`). |
| FastAPI routes & query parameters | [main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py) | API endpoints `/health`, `/api/dashboard-data`, `/api/daily-drilldown`, `/api/available-years`, `/api/available-export-dates`, `/api/monthly-breakdown/{year}`, `/api/export-excel`, `/api/import-file`, and Supabase queries. |

---

## Core Pipeline Invariants

### 1. Total Time Alignment
- Total waiting time in both analytics ([preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py)) and export ([export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py)) telescopes from Queuing Time (`reg_start`) to Carry Out Completed (`carryout_end`).
- If carryout was not performed, both pipelines fall back to Doctor Completed (`consult_end`).
- Kiosk entry to registration start (`kiosk_time` to `reg_start`) is preserved as an independent metric (`wait_registration`) and is not folded into total waiting time.

### 2. Single Source of Truth for Compliance Thresholds
- All compliance thresholds are exported from [analytics/constants.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py).
- `EXAMINE_TREAT_TARGET_MINUTES` is 105 minutes (1 hour 45 minutes / 1.45 hrs), matching the official PHC paper form.
- `export.py` imports thresholds from `constants.py` to prevent divergence between the dashboard and generated Excel sheets.

### 3. AM/PM Heuristic Boundary
- Hours 1:00 to 6:59 AM in raw spreadsheets are converted to PM (+12 hours) because PHC OPD operates afternoon clinics.
- Hour 7 (7:00 AM to 7:59 AM) is preserved as morning arrival, protecting patients arriving early for queue numbering and registration.
- Hours 8:00 AM to 12:00 PM are preserved without alteration.

### 4. Timezone Integrity
- All timestamps in Supabase are stored in UTC.
- Raw CSV imports with timezone-naive timestamps are localized to `Asia/Manila` before converting to UTC.
- Export timestamps and dashboard daily breakdowns are grouped and formatted in `Asia/Manila` local time (`UTC+8`).

### 5. Multi-Source Sheet Date Reconciliation
- In hospital spreadsheets, staff frequently duplicate existing monthly sheets when setting up new dates, which causes stale template cell values (e.g. copying sheet `12-15` into `2024_JAN.xls` without updating the date cell, causing `45275.0` / `2023-12-15` to persist in sheet `1-15`).
- The `resolve_phc_sheet_date` engine reconciles the raw cell date with the sheet name pattern (`M-D` or full month name) and workbook filename year (`2024_JAN.xls`).
- The sheet name and file context take precedence over stale cell contents, ensuring data always attaches to the authentic calendar day.
- Corrects common clerical typos (e.g., `1010/2024` -> `2024-10-10`) so zero patient rows are dropped due to spreadsheet formatting defects.

### 6. PHC Time and Motion Summary Block Formulas
The bottom 4-row compliance summary table in [analytics/export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py) reproduces the hospital's original spreadsheet formulas:
- **Waiting Time <= 2.5 hrs. =**: The hospital template formula tests against `<= 03:00:00` (180 minutes / 3.0 hours via `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES`) rather than 2.5 hours, despite the text label.
- **Evaluate patients <= 30 mins. =**: Tests Column F (`Queuing Time to Initial Assessment` / `service_registration`) against `<= 00:30:00` (30 minutes).
- **Examine & treat Pts. <= 1.45hrs. =**: Tests Column G (`Initial Assessment to Doctor Seen` / `wait_consultation`) against `<= 01:45:00` (105 minutes).
- **Carry out Dr's Orders <= 15 mins. =**: Tests Column I (`Doctor Completed to Carry Out Completed` / `service_carryout`) against `<= 00:15:00` (15 minutes).
- **Patient to Doctor Ratio Per Hour =**: Computed as `Patients Seen / Doctors on Duty / 7` using `PHC_CONSULTATION_SHIFT_HOURS` (7 hours), matching the hospital's standard daily consultation shift divisor.
