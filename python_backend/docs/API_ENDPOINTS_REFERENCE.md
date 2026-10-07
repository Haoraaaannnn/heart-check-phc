# Python Backend API Endpoints Reference

This document provides a comprehensive technical reference for all HTTP endpoints exposed by the Heart Check PHC FastAPI backend in [main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py).

---

## 1. Server Configuration and Networking

### 1.1 Host and Port Configuration
- **Default Host:** `0.0.0.0` (binds to all network interfaces).
- **Default Port:** `8000`.
- **Runtime Command:** `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000` or `python run.py`.
- **Classification:** Configurable via startup flags or [run.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/run.py); hardcoded defaults in script.

### 1.2 Cross-Origin Resource Sharing (CORS)
The server configures `CORSMiddleware` in [main.py:L42-L48](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L42-L48).

- **Allowed Origins:**
  - Evaluated dynamically from the `ALLOWED_ORIGINS` environment variable (comma-delimited list).
  - If `ALLOWED_ORIGINS` is not defined in the environment, the following fallback origins are hardcoded:
    - `http://localhost:3000`
    - `http://127.0.0.1:3000`
    - `http://localhost:3001`
    - `http://127.0.0.1:3001`
- **Allowed HTTP Methods:** `GET`, `POST`, `OPTIONS`.
- **Allowed HTTP Headers:** Wildcard `*`.
- **Allow Credentials:** `True`.

### 1.3 Database Connection Configuration
The backend connects to Supabase REST API via `httpx.Client(timeout=30.0)` in [main.py:L66](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L66).

- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (e.g., `https://xyzcompany.supabase.co`).
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key with administrative privileges (bypasses Row-Level Security).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key used as fallback if service role key is absent.
- **Request Headers Sent to Supabase:**
  - `apikey`: Supabase key.
  - `Authorization`: `Bearer <SUPABASE_KEY>`.
  - `Range`: Pagination range header (e.g., `0-999`, `1000-1999`).
- **Pagination Strategy:**
  - Hardcoded batch size: `1000` records per request.
  - The client loops incrementing page index until fewer than 1000 records return or HTTP 416 (Requested Range Not Satisfiable) is received.

### 1.4 In-Memory Caching Architecture
To maintain sub-second response times and prevent repetitive full-table scans, [main.py:L73-L78](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L73-L78) implements an in-memory Time-To-Live (TTL) cache:

- **Cache TTL:** `CACHE_TTL_SECONDS = 300` (5 minutes, hardcoded constant).
- **Cache Stores:**
  - `_monthly_cache: dict[int, tuple[float, list[dict]]]`: Keyed by year integer (e.g., `2024`).
  - `_years_cache: tuple[float, list[int]] | None`: Cached tuple of timestamp and available years list.
  - `_export_dates_cache: tuple[float, dict] | None`: Cached tuple of available export years, months, and days.
  - `_daily_drilldown_cache: dict[str, tuple[float, dict]]`: Keyed by date string `YYYY-MM-DD`.
- **Cache Invalidation:**
  - Automatic expiration after 300 seconds.
  - Manual invalidation via query parameter `?refresh=true` on supported endpoints.
  - Automatic full invalidation when records are committed via `POST /api/import-file`.

---

## 2. Comprehensive Endpoint Catalog

---

### Endpoint: Health Check
- **Route:** `GET /health`
- **Controller Function:** `health_check()` in [main.py:L213-L216](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L213-L216)
- **Description:** Verifies that the FastAPI process is running and accepting HTTP requests.
- **Query Parameters:** None.
- **Request Body:** None.
- **Response Format:** `application/json`
- **Response Example:**
```json
{
  "status": "ok",
  "message": "Analytics backend is running"
}
```
- **Error Codes:** None under normal operation.

---

### Endpoint: Dashboard Analytics Data
- **Route:** `GET /api/dashboard-data`
- **Controller Function:** `get_dashboard_data(range: str = DEFAULT_RANGE)` in [main.py:L219-L258](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L219-L258)
- **Description:** Primary analytics payload serving the Administrative Workstation overview, queue metrics, service distribution, bottleneck detection, 5-model forecasting, and staffing recommendations.

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `range` | Query | `string` | No | `"90d"` | Configurable via query parameter | Date window filter. Accepted tokens: `"90d"`, `"180d"`, `"365d"`, `"all"`, or a 4-digit calendar year (e.g. `"2024"`). |

#### Parameter Parsing and Date Resolution:
Implemented in `resolve_date_range(range_param: str)` in [main.py:L191-L210](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L191-L210):
- If `range == "all"`: Returns `(None, None)`. The query fetches all historical records without date boundaries.
- If `range` is 4 digits (e.g., `"2024"`): Filters `created_at >= 2024-01-01` and `created_at < 2025-01-01`.
- If rolling range (`"90d"`, `"180d"`, `"365d"`):
  - `start = date.today() - timedelta(days=days)`
  - `end = date.today() + timedelta(days=1)` (includes the entirety of current date)
  - Mapped via dictionary `RANGE_DAYS`: `90d: 90`, `180d: 180`, `365d: 365`. Fallback is 90 days.

#### Database Query:
Fetches from Supabase table `patients` selecting:
`id,created_at,patientNum,service,status,reg_start,reg_end,consult_start,consult_end,carryout_start,carryout_end,cubicleNum,is_historical`.

#### Success Response Structure (200 OK):
Returns a JSON object generated by `generate_report(df)`:
```json
{
  "daily_summary": [
    {
      "visit_date": "2026-10-07",
      "total_patients": 142,
      "avg_wait_registration": 8.42,
      "avg_wait_consultation": 24.15,
      "avg_total_time": 68.30
    }
  ],
  "hourly_pattern": [
    {
      "hour": 8,
      "avg_patients": 28,
      "avg_wait_registration": 12.30,
      "avg_service_registration": 4.10,
      "avg_wait_consultation": 35.20,
      "avg_service_consultation": 14.50,
      "avg_service_carryout": 6.10,
      "time_label": "08:00–09:00"
    }
  ],
  "service_distribution": [
    {
      "service": "consultation",
      "total_patients": 820
    }
  ],
  "bottleneck_analysis": {
    "stages": [
      {
        "stage_key": "kiosk_to_registration_wait",
        "stage_label": "Kiosk → Registration wait",
        "avg_minutes": 11.2,
        "patient_count": 820,
        "level": "Normal",
        "reason": "Kiosk → Registration wait is averaging 11.2 min across 820 patients — within the 30-min target."
      }
    ],
    "primary_bottleneck": {
      "stage_key": "registration_to_consult_wait",
      "stage_label": "Registration → Consultation wait",
      "avg_minutes": 42.5,
      "level": "Elevated",
      "reason": "Registration → Consultation wait is averaging 42.5 min across 820 patients — 12.5 min over the 30-min elevated threshold (1.4x the 30-min baseline)."
    },
    "system_status": "Elevated",
    "bottleneck_stage": "Registration → Consultation wait",
    "avg_wait_registration_min": 11.2,
    "avg_wait_consultation_min": 42.5
  },
  "phc_compliance": {
    "waiting_time_le": 710,
    "waiting_time_gt": 110,
    "evaluate_le": 780,
    "evaluate_gt": 40,
    "examine_treat_le": 750,
    "examine_treat_gt": 70,
    "carryout_le": 800,
    "carryout_gt": 20,
    "avg_total_waiting_time_min": 68.3,
    "patients_seen": 820,
    "opd_hours": 8.0,
    "thresholds_min": {
      "waiting_time": 150,
      "evaluate": 30,
      "examine_treat": 105,
      "carryout": 15
    }
  },
  "registration": {
    "patients_served": 820,
    "arrival_rate_lambda": 0.2951,
    "service_rate_mu": 0.2439,
    "metrics": {
      "model": "M/M/1",
      "utilization_rho": 1.21,
      "note": "Arrival rate exceeds service rate."
    }
  },
  "consultation": {
    "adult": {
      "clinic": "adult",
      "active_cubicles": 5,
      "max_cubicles": 5,
      "per_cubicle": {},
      "system_benchmark": {},
      "balance_metrics": {
        "load_imbalance_delta": 0.12,
        "load_balance_status": "Balanced"
      }
    },
    "pedia": {
      "clinic": "pedia",
      "active_cubicles": 5,
      "max_cubicles": 5,
      "per_cubicle": {},
      "system_benchmark": {},
      "balance_metrics": {
        "load_imbalance_delta": 0.08,
        "load_balance_status": "Balanced"
      }
    }
  },
  "specialized_services": {},
  "system_time": {
    "avg_wait_registration": 11.2,
    "avg_service_registration": 4.1,
    "avg_wait_consultation": 42.5,
    "avg_service_consultation": 15.2,
    "avg_total_time": 68.3,
    "target_min": 150,
    "within_target": true,
    "excess_min": 0.0,
    "littles_law_check": {
      "lambda_per_min": 0.2951,
      "W_min": 68.3,
      "L_observed": 20.1553,
      "L_littles_law": 20.1553,
      "total_patients": 820,
      "note": "L = lambda * W represents the average number of patients in the system at any instant.",
      "status": "Computed"
    }
  },
  "computational_forecasting": {
    "status": "Forecast computed",
    "best_algorithm": "ARIMA",
    "next_day_forecast": 145,
    "algorithmic_conclusion": "Based on historical backtesting, ARIMA yielded the lowest MAE. Next-day forecast: 145 patients.",
    "evaluation_metrics": {
      "SMA": { "MAE": 14.21, "RMSE": 18.52 },
      "WMA": { "MAE": 12.84, "RMSE": 16.33 },
      "EMA": { "MAE": 13.05, "RMSE": 17.11 },
      "Linear Regression": { "MAE": 15.40, "RMSE": 19.88 },
      "ARIMA": { "MAE": 10.65, "RMSE": 14.12 }
    }
  },
  "lr_chart_data": {
    "labels": ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"],
    "actual": [135, 140, 138, 144, 142],
    "lr_line": [136.2, 138.1, 140.0, 141.9, 143.8],
    "forecast_date": "2026-10-08",
    "forecast_value": 146,
    "slope": 1.9,
    "trend": "increasing",
    "r2": 0.82
  },
  "arima_chart_data": {
    "labels": ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"],
    "actual": [135, 140, 138, 144, 142],
    "fitted": [134.8, 139.5, 138.2, 143.7, 142.1],
    "forecast_date": "2026-10-08",
    "forecast_value": 145,
    "aic": 312.45,
    "status": "ok"
  },
  "decision_support": {
    "forecasted_patients": 145,
    "consultation_proportion": 0.65,
    "recommended_doctors": 3,
    "adult_clinic": {
      "recommended_doctors": 3,
      "max_cubicles": 5,
      "capacity_sufficient": true,
      "expected_utilization": 0.68,
      "warning": null
    },
    "pedia_clinic": {
      "recommended_doctors": 3,
      "max_cubicles": 5,
      "capacity_sufficient": true,
      "expected_utilization": 0.68,
      "warning": null
    }
  }
}
```

#### Empty State Fallback:
If no patient records are found in the range, returns `get_empty_data()` in [main.py:L542-L610](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L542-L610) with empty arrays and zero values.

---

### Endpoint: Daily Drilldown Analytics
- **Route:** `GET /api/daily-drilldown`
- **Controller Function:** `get_daily_drilldown(date_param: str = Query(..., alias="date"))` in [main.py:L260-L385](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L260-L385)
- **Description:** Provides hour-by-hour distributions, queue stage bottleneck status, peak operational hour, and stage dwell times for a single specified calendar date in Asia/Manila (`UTC+8`).

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `date` | Query | `string` | Yes | None | Dynamic (user-selected) | ISO date string `YYYY-MM-DD` (e.g., `2024-11-04`). |

#### Offset Safety Padding:
Queries Supabase with 1-day padding before and 2-day padding after target date (`start_date = target_date - 1 day`, `end_date = target_date + 2 days`) to guarantee that all UTC timestamps converting to Asia/Manila calendar day are completely captured.

#### Cache Behavior:
Cached in `_daily_drilldown_cache` for 300 seconds.

#### Success Response Structure (200 OK):
```json
{
  "date": "2024-11-04",
  "total_patients": 128,
  "hourly_pattern": [
    {
      "hour": 8,
      "avg_patients": 32,
      "avg_wait_registration": 14.5,
      "avg_service_registration": 4.2,
      "avg_wait_consultation": 38.1,
      "avg_service_consultation": 16.0,
      "avg_service_carryout": 5.4,
      "time_label": "08:00–09:00"
    }
  ],
  "bottleneck_analysis": {
    "stages": [],
    "primary_bottleneck": {},
    "system_status": "Elevated",
    "bottleneck_stage": "Registration → Consultation wait"
  },
  "summary": {
    "total_patients": 128,
    "avg_total_time": 72.4,
    "avg_wait_registration": 14.5,
    "avg_wait_consultation": 38.1,
    "system_status": "Elevated",
    "bottleneck_stage": "Registration → Consultation wait",
    "system_reason": "Registration → Consultation wait is averaging 38.1 min across 128 patients — 8.1 min over the 30-min elevated threshold.",
    "peak_hour": "08:00–09:00"
  }
}
```

#### Error Codes:
- `400 Bad Request`: If date format cannot be parsed as `YYYY-MM-DD`.
- `502 Bad Gateway`: If database connection or query fails.

---

### Endpoint: Available Years Listing
- **Route:** `GET /api/available-years`
- **Controller Function:** `get_available_years()` in [main.py:L387-L419](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L387-L419)
- **Description:** Returns the range of historical years present in the `patients` table.
- **Optimization:** Executes two lightweight requests (`fetch_supabase_edge`) fetching the single earliest row and single latest row sorted by `created_at` (`limit=1`), rather than downloading thousands of records.
- **Cache:** Cached in `_years_cache` for 300 seconds.
- **Response Format:**
```json
{
  "years": [2024, 2025, 2026]
}
```

---

### Endpoint: Available Export Dates
- **Route:** `GET /api/available-export-dates`
- **Controller Function:** `get_available_export_dates(refresh: bool = False)` in [main.py:L421-L482](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L421-L482)
- **Description:** Inspects all records in `patients` with non-null `reg_start` timestamps and extracts distinct years, calendar months, and individual calendar days formatted in Asia/Manila time.

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `refresh` | Query | `boolean` | No | `false` | Configurable | If `true`, bypasses cache and scans database. |

#### Cache Behavior:
Cached in `_export_dates_cache` for 300 seconds.

#### Response Example:
```json
{
  "years": [2025, 2024],
  "dates": {
    "2024": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "2025": [11]
  },
  "days": [
    "2025-11-20",
    "2025-11-19",
    "2024-12-15"
  ]
}
```

---

### Endpoint: Monthly Breakdown for Year
- **Route:** `GET /api/monthly-breakdown/{year}`
- **Controller Function:** `get_monthly_breakdown_for_year(year: int, refresh: bool = False)` in [main.py:L484-L540](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L484-L540)
- **Description:** Returns month-by-month bottleneck stages, patient counts, and average total stay times for a single specific year.

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `year` | Path | `integer` | Yes | None | Dynamic | Calendar year (e.g., `2024`). |
| `refresh` | Query | `boolean` | No | `false` | Configurable | If `true`, re-evaluates database. |

#### Database Filtering:
Queries records with `created_at >= {year}-01-01` and `created_at < {year+1}-01-01`.

#### Success Response Structure (200 OK):
```json
{
  "year": 2024,
  "months": [
    {
      "month": 1,
      "month_label": "January",
      "patient_count": 842,
      "bottleneck_stage": "Registration → Consultation wait",
      "system_status": "Elevated",
      "avg_total_time_min": 74.2
    },
    {
      "month": 2,
      "month_label": "February",
      "patient_count": 790,
      "bottleneck_stage": "Registration duration",
      "system_status": "Normal",
      "avg_total_time_min": 61.5
    }
  ]
}
```

#### Error Codes:
- `500 Internal Server Error`: If calculation throws an exception.
- `502 Bad Gateway`: If Supabase fails to return data.

---

### Endpoint: Export Excel / CSV
- **Route:** `GET /api/export-excel`
- **Controller Function:** `export_excel(...)` in [main.py:L612-L758](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L612-L758)
- **Description:** Streams an official Philippine Heart Center Time and Motion Analysis workbook (`.xlsx`) or flat comma-separated values (`.csv`).

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `date` | Query | `string` | No | `None` | Dynamic | Single date filter `YYYY-MM-DD` (e.g. `"2025-11-04"`). |
| `month` | Query | `string` | No | `None` | Dynamic | Month filter `YYYY-MM` or `MM` (e.g. `"2024-11"`). |
| `range` | Query | `string` | No | `None` | Dynamic | Rolling range (`"90d"`, `"180d"`, `"365d"`, `"all"`). |
| `service` | Query | `string` | No | `None` | Dynamic | Service filter (e.g. `"Consultation"`). If omitted or `"all"`, exports all. |
| `format` | Query | `string` | No | `"xlsx"` | Configurable | Export file format. Validated via regex `^(xlsx\|csv)$`. |

#### Priority Resolution for Dates:
1. `date` parameter takes highest priority.
2. `month` parameter takes second priority.
3. `range` parameter takes third priority. Default fallback is `"90d"`.

#### Output Streaming:
- For `format="xlsx"`:
  - Media Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Filename pattern: `phc_time_motion_export_<filter>.xlsx`
  - Generated via `build_phc_workbook(df)` in [export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py).
  - Contains one sheet per calendar day in Asia/Manila local time.
- For `format="csv"`:
  - Media Type: `text/csv`
  - Filename pattern: `phc_time_motion_export_<filter>.csv`

#### Error Codes:
- `400 Bad Request`: Invalid date format or month string.
- `404 Not Found`: No patient records match the specified date/month/range.
- `500 Internal Server Error`: Workbook generation failure.
- `502 Bad Gateway`: Database communication error.

---

### Endpoint: Ingest and Import File
- **Route:** `POST /api/import-file`
- **Controller Function:** `import_file(...)` in [main.py:L760-L850](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py#L760-L850)
- **Description:** Accepts binary file uploads (.xls, .xlsx, .csv). Parses records matching PHC Time and Motion sheets or standard tabular datasets. Supports dry-run inspection and batched database committing.

#### Parameters:
| Name | In | Type | Required | Default | Hardcoded vs Dynamic | Description |
|---|---|---|---|---|---|---|
| `filename` | Query | `string` | Yes | None | Dynamic | Name of the file being uploaded (e.g. `"2024_OCT.xls"`). Used to select parser and extract year context. |
| `mode` | Query | `string` | No | `"commit"` | Configurable | Operation mode: `"inspect"` (dry-run preview) or `"commit"` (write to database). |
| `service` | Query | `string` | No | `"Consultation"` | Configurable | Default service assigned to imported rows if unspecified in file. |
| `is_historical`| Query | `boolean` | No | `true` | Configurable | Sets `is_historical` flag in Supabase patients table. |
| `batch_size` | Query | `integer` | No | `500` | Configurable | Number of rows per insert request to Supabase. |
| `request.body` | Body | `bytes` | Yes | None | Dynamic | Raw binary content of the uploaded file. |

#### Processing Workflow:
1. Validates non-empty payload bytes.
2. Invokes `parse_and_process_file(file_bytes, filename, service, is_historical)` in [importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py).
3. If `mode == "inspect"`: Returns metadata, counts, date range, and preview of the first 10 rows without touching the database.
4. If `mode == "commit"`:
   - Batch-inserts records into Supabase `patients` table using `insert_records_batch`.
   - Clears all in-memory caches (`_monthly_cache.clear()`, `_years_cache = None`, `_export_dates_cache = None`, `_daily_drilldown_cache.clear()`) so fresh data is immediately available to dashboard charts.

#### Success Response Structure (200 OK):
```json
{
  "success": true,
  "mode": "commit",
  "filename": "2024_NOV.xls",
  "format": "phc_excel",
  "sheets_processed": ["11-04", "11-05", "11-06", "11-07"],
  "total_extracted": 512,
  "valid_records": 510,
  "dropped_records": 2,
  "date_range": {
    "start": "2024-11-04",
    "end": "2024-11-28"
  },
  "preview_rows": [
    {
      "created_at": "2024-11-04T07:15:00+08:00",
      "patientNum": "123456",
      "service": "Consultation",
      "status": "Done",
      "reg_start": "2024-11-04T07:15:00+08:00",
      "reg_end": "2024-11-04T07:22:00+08:00",
      "consult_start": "2024-11-04T07:45:00+08:00",
      "consult_end": "2024-11-04T08:05:00+08:00",
      "carryout_start": "2024-11-04T08:05:00+08:00",
      "carryout_end": "2024-11-04T08:14:00+08:00",
      "is_historical": true
    }
  ],
  "inserted_records": 510,
  "errors": []
}
```

#### Error Codes:
- `400 Bad Request`: Empty payload body or unreadable bytes.
- `422 Unprocessable Entity`: No valid milestones or records could be parsed.
- `500 Internal Server Error`: Parsing or database insert crash.
