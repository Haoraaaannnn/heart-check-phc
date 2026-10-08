# Data Ingestion and Export Pipelines Reference

This document provides a complete technical analysis of the data ingestion engines ([importer.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py), [import_phc_data.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py)) and the Excel/CSV reporting export engine ([analytics/export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py)).

---

## 1. PHC Excel Workbook Structure and Parsing

Hospital data originates from Philippine Heart Center (PHC) Time and Motion Analysis workbooks recorded in legacy Excel formats (`.xls`, `.xlsx`). Each workbook corresponds to a monthly record containing multiple sheets, where each sheet corresponds to an individual clinic operating day.

- **Parsing Engines:** Modern `.xlsx` files are parsed with `openpyxl` (`openpyxl>=3.1.2`), while legacy `.xls` binary workbooks require `xlrd` (`xlrd>=2.0.1`). Both dependencies are declared in `requirements.txt`.

### 1.1 Sheet Scanning and Layout Detection
In [importer.py:L148-L220](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L148-L220) and [import_phc_data.py:L37-L89](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py#L37-L89):

1. **Date Label Detection:**
   - Scans the first 10 rows of the sheet searching for the substring `"Date:"` (case-insensitive).
   - If found at row `r` and column index `c`, the adjacent cell `(r, c + 1)` is read as the raw date cell value.
2. **Hospital Number Header Detection:**
   - Scans the first 15 rows searching for `"Hospital"`.
   - Preferential Rule: The official PHC template places the patient data block in Column P (0-indexed column `15`). Therefore, matches where `col_idx >= 15` are prioritized.
   - If no match with `col_idx >= 15` is found, the first match anywhere in the row is used as fallback.
3. **Data Row Start Index:**
   - Patient records start 2 rows beneath the header row: `data_start = header_row + 2`.
4. **Column Offsets (Relative to Hospital Number Column `hosp_col`):**
   - Offset `+0`: `patientNum` (Hospital Number string, e.g., `"123456"`).
   - Offset `+1`: `reg_start` (Queuing Time).
   - Offset `+2`: `reg_end` (Initial Assessment).
   - Offset `+3`: `consult_start` (Doctor Seen).
   - Offset `+4`: `consult_end` (Doctor Completed).
   - Offset `+5`: `carryout_end` (Carry Out Completed).
5. **Stop Condition (Template Row Exclusion):**
   - When iterating data rows, the parser halts immediately upon encountering:
     - `pd.isna(hosp_num)`: Empty row.
     - `not hosp_str.isdigit()`: Non-numeric header or text note.
     - `hosp_str == "0"`: Placeholder template formula entry.

---

## 2. Multi-Source Sheet Date Reconciliation Engine

Implemented in `resolve_phc_sheet_date(raw_cell_val, sheet_name: str, filename: str = "") -> str | None` in [importer.py:L79-L146](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L79-L146).

### 2.1 The Clinical Data Problem
In hospital administration, nurses and records staff frequently set up new daily tracking sheets by duplicating an existing sheet tab. When doing so, staff often update the sheet tab name (e.g. from `12-15` to `1-15`) but neglect to update the internal `"Date:"` cell. For example, in `2024_JAN.xls`, sheet tab `1-15` contained the stale Excel serial date `45275.0` (`2023-12-15`) copied over from December 2023. Additionally, manual typists frequently introduce clerical errors (e.g., typing `1010/2024` instead of `10/10/2024`).

### 2.2 Four-Stage Reconciliation Algorithm
1. **Raw Cell Date Extraction:**
   - Handles Excel serial float dates (days since December 30, 1899):
     `if isinstance(raw_cell_val, (int, float)) and raw_cell_val > 1000: date(1899, 12, 30) + timedelta(days=int(raw_cell_val))`
   - Cleans concatenated date typos using regex:
     `^(\d{2})(\d{2})/(\d{4})$` -> `$1/$2/$3` (e.g. `1010/2024` -> `10/10/2024`).
   - Parses date via `pd.to_datetime(s)`.
2. **Workbook Year Context Extraction:**
   - Scans the filename using regex `r"(202\d)"` (e.g. `2024` from `2024_JAN.xls`).
3. **Sheet Tab Name Pattern Matching (Pattern `M-D` or `M/D`):**
   - Matches regex `r"^(\d{1,2})[-/](\d{1,2})$"` (e.g. `"1-15"`, `"10-10"`).
   - Derives month $M$ and day $D$.
   - Year resolution: Prefers `file_year`. If missing, uses `cell_date.year`.
   - **Authority Rule:** If the cell date is missing, or if the cell date disagrees with the sheet tab name and filename (e.g. `2023-12-15` vs `2024-01-15`), the sheet tab and filename are authoritative. The date is resolved to `date(target_year, s_m, s_d)`.
4. **Full Text Sheet Name Pattern Matching:**
   - Matches sheet names like `"MARCH 11, 2025."` or `"SEPTEMBER 10, 2025_2"`.
   - Strips trailing underscores, numbers, and periods: `re.sub(r"_\d+$", "", sheet_name).strip().rstrip(".")`.
   - Parses the cleaned name to date and reconciles against the cell date.
5. **Output:** Returns normalized ISO date string `YYYY-MM-DD`.

---

## 3. AM/PM Heuristic Correction Engine

Implemented in `_fix_time_heuristic(t)` in [importer.py:L42-L76](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L42-L76) and [import_phc_data.py:L117-L134](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/import_phc_data.py#L117-L134).

### 3.1 Clinical Justification
PHC Out-Patient Division (OPD) doctor consultations operate predominantly during afternoon clinic hours (1:00 PM to 6:00 PM). However, nurses and staff frequently record times using 12-hour notation without an explicit "PM" marker in Excel cells (e.g., entering `2:30` which Excel parses as `02:30:00 AM`).

Simultaneously, outpatients begin arriving at the clinic early in the morning for registration prep and queue ticketing starting at 7:00 AM.

### 3.2 Heuristic Rules
| Recorded Hour | Applied Transformation | Resulting 24-Hour Time | Clinical Justification |
|---|---|---|---|
| `1:00 AM` to `6:59 AM` (Hours 1 to 6) | `hour += 12` | `13:00` to `18:59` (1:00 PM to 6:59 PM) | Afternoon clinic consultations recorded without PM indicator. |
| `7:00 AM` to `7:59 AM` (Hour 7) | Hour preserved (`7`) | `07:00` to `07:59` (7:00 AM to 7:59 AM) | Preserved as morning arrival. Protects patients arriving early for queue ticketing and registration triage. |
| `8:00 AM` to `11:59 AM` (Hours 8 to 11) | Hour preserved | `08:00` to `11:59` | Morning clinic and triage operations. |
| `12:00 PM` (Hour 12) | Hour preserved | `12:00` to `12:59` | Noon. |
| `13:00` and above (Hours 13+) | Preserved | `13:00+` | Already in valid 24-hour notation. |

---

## 4. Standard Tabular Dataset Import (CSV and Excel)

Implemented in `process_tabular_dataset(...)` in [importer.py:L320-L454](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/importer.py#L320-L454).

### 4.1 Flexible Column Name Normalization
To accommodate external hospital exports and thesis research CSVs, column headers are case-insensitively mapped using an alias lookup table:

| Internal Column | Recognized Ingestion Aliases | Fallback Rule |
|---|---|---|
| `patientNum` | `patientnum`, `patient_num`, `ticket`, `ticketnum`, `hospital_num` | If missing, falls back to `id` column. If no ID exists, auto-generates serial numbers `IMP-0001`, `IMP-0002`, etc. |
| `service` | `service`, `department` | If missing, uses the `service` query parameter (default `"Consultation"`). |
| `status` | `status` | Defaults to `"Done"`. |
| `created_at` | `created_at`, `kiosk_time`, `arrival_time` | Falls back to `reg_start`. If `reg_start` is missing, falls back to `datetime.utcnow()`. |
| `reg_start` | `reg_start`, `queuing_time` | Nullable for non-registration services. |
| `reg_end` | `reg_end`, `initial_assessment` | Nullable. |
| `consult_start` | `consult_start`, `doctor_seen` | Mandatory for consultation services. |
| `consult_end` | `consult_end`, `doctor_completed` | Mandatory for consultation services. |
| `carryout_start` | `carryout_start` | Optional. |
| `carryout_end` | `carryout_end`, `carry_out_completed` | Optional. |
| `cubicleNum` | `cubicle`, `cubiclenum` | Nullable. |
| `phoneNum` | `phone`, `phonenum` | Nullable. |

### 4.2 Timezone Normalization
- If timestamps are timezone-naive: Localized to `Asia/Manila` (`UTC+8`) and then converted to `UTC`.
- If timestamps are already timezone-aware: Directly converted to `UTC`.
- Exported records store ISO 8601 strings with explicit UTC timezone offsets (`YYYY-MM-DDTHH:MM:SS+00:00`).

---

## 5. Ingestion Validation and Database Writing

### 5.1 Validation Rules
- **PHC Workbooks:** Requires all four primary milestones: `reg_start`, `reg_end`, `consult_start`, `consult_end`.
  - Rows missing any of these four timestamps are filtered out and written to a dropped-records CSV audit log (e.g. `dropped_rows_2024_NOV.csv`).
  - `carryout_end` is optional. Patients without carryout orders are kept.
  - Where `carryout_end` is present, `carryout_start` is set to `consult_end`.
- **Tabular Datasets:** Requires valid `created_at` timestamp.

### 5.2 Schema Columns Added on Ingestion
Every imported record written to Supabase `patients` table includes:
- `created_at`: Set to `kiosk_time` or `reg_start`.
- `patientNum`: Extracted hospital number or imported ticket.
- `phoneNum`: `None` (for historical data).
- `service`: `"Consultation"` (or mapped service).
- `cubicleNum`: `None` (historical tracking sheets do not record physical cubicle IDs).
- `status`: `"Done"`.
- `reg_start`, `reg_end`, `consult_start`, `consult_end`, `carryout_start`, `carryout_end`.
- `is_historical`: Boolean flag (`True` for imported files).

### 5.3 Batch Insert Operation
Implemented in `insert_records_batch(records, batch_size=500)` in [importer.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/importer.py) and `insert_in_batches` in [import_phc_data.py](file:///home/jensen/Github-Repositories/heart-check-phc/python_backend/import_phc_data.py):
- Dispatches batch insertions directly to the Supabase PostgREST endpoint (`/rest/v1/patients`) using `httpx`.
- Chunks records into slices of `batch_size` (default 500) with `Prefer: return=minimal`.
- Supports both legacy 3-part JWT keys and modern secret keys (`sb_secret_*`) without failing client-side regex validations.
- Halts on error and reports exact batch index and HTTP/database error message.

---

## 6. Official PHC Time and Motion Analysis Excel Export

Located in [analytics/export.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/export.py).

The function `build_phc_workbook(df: pd.DataFrame, clinic_label: str = "OPD") -> BytesIO` produces an authentic multi-sheet `.xlsx` workbook using `openpyxl`.

### 6.1 Multi-Sheet Organization
- The input DataFrame is grouped by `_manila_date` (derived from `reg_start` converted to Asia/Manila).
- Creates exactly one sheet per calendar day.
- Sheet naming format: `_sheet_name_for(date_val, clinic_label)` produces tab names like `"Nov 04 2024 OPD"` (capped at 31 characters, invalid characters `: \ / ? * [ ]` stripped).

### 6.2 Data Privacy and Privacy-By-Design
- **Deliberate Exclusion:** The official paper sheet includes a "Hospital Number" column. However, the export engine **intentionally excludes** Hospital Number from Column A-J.
- **Security Rationale:** Live patients querying queue status via anonymous keys must never have hospital patient IDs exposed in downloadable public bundles. To maintain zero data leaks, the export only includes queuing timestamps and elapsed durations.

### 6.3 Column Headers and Layout
Row 9-10 contains a two-line navy blue header (`#1F4E78` fill, bold white text, thin grey border `#B7B7B7`):

| Column | Header Line 1 | Header Line 2 | Metric Description | Value Formatting |
|---|---|---|---|---|
| **A** | Queuing | Time | Patient arrival at registration (`reg_start`) | `hh:mm AM/PM` (Manila time) |
| **B** | Initial | Assessment | Registration completion (`reg_end`) | `hh:mm AM/PM` (Manila time) |
| **C** | Doctor | Seen | Physician consultation start (`consult_start`) | `hh:mm AM/PM` (Manila time) |
| **D** | Doctor | Completed | Physician consultation end (`consult_end`) | `hh:mm AM/PM` (Manila time) |
| **E** | Carry Out | Completed | Execution of doctor orders end (`carryout_end`) | `hh:mm AM/PM` (Manila time) |
| **F** | Queuing Time to | Initial Assessment | Registration service duration (`g = reg_end - reg_start`) | `h:mm:ss` |
| **G** | Initial Assessment | to Doctor Seen | Wait for consultation (`h = consult_start - reg_end`) | `h:mm:ss` |
| **H** | Doctor Seen | to Completed | Consultation duration (`i = consult_end - consult_start`) | `h:mm:ss` |
| **I** | Doctor Completed to | Carry Out Completed | Carryout duration (`j = carryout_end - carryout_start`) | `h:mm:ss` |
| **J** | Total | Waiting Time | Telescoping total stay time (`reg_start` to `carryout_end` or `consult_end`) | `h:mm:ss` |

### 6.4 The Bottom Four-Row Summary Block
Beginning 2 rows below the last patient record, the sheet renders the 4-row compliance block matching the hospital's manual tally format:

```text
Row 1: [Waiting Time <= 2.5 hrs. =]  [Count]   [Waiting Time > 2.5 hrs. =]  [Count]   [Average Patient's Total Waiting Time =]  [h:mm:ss]
Row 2: [Evaluate patients <= 30 mins. =] [Count] [Evaluate patients > 30 mins. =] [Count] [Number of Patient's Seen =]             [Total]
Row 3: [Examine & treat Pts. <= 1.45hrs. =] [Count] [Examine & treat Pts. > 1.45hrs. =] [Count] [Number of Doctors on Duty =]             [1]
Row 4: [Carry out Dr's Orders <= 15 mins. =] [Count] [Carry out Dr's Orders > 15 mins. =] [Count] [Patient to Doctor Ratio Per Hour =]       [Ratio]
```

### 6.5 Authentic Formula Parity Details
1. **Waiting Time Evaluation:**
   - Evaluated using `TOTAL_WAIT_THRESHOLD = timedelta(minutes=180)`.
   - **Parity Note:** In the hospital's authentic Excel template, the formula tests against `<= 03:00:00` (180 minutes / 3.0 hours) via `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES` despite the label reading `<= 2.5 hrs.`. The export uses 180 minutes to match the authentic spreadsheet template calculations.
2. **Evaluate Patients:**
   - Evaluated against `EVALUATE_THRESHOLD = timedelta(minutes=30)` (Column F).
3. **Examine & Treat Patients:**
   - Evaluated against `EXAMINE_TREAT_THRESHOLD = timedelta(minutes=105)` (1 hour 45 minutes / 1.45 hrs).
   - In official PHC Excel templates, this evaluates Column G (Initial Assessment to Doctor Seen / `wait_consultation`).
4. **Carry Out Orders:**
   - Evaluated against `CARRYOUT_THRESHOLD = timedelta(minutes=15)` (Column I).
5. **Patient to Doctor Ratio Per Hour:**
   - Formula: `round(n_seen / (doctors_on_duty * PHC_CONSULTATION_SHIFT_HOURS))`.
   - Uses `PHC_CONSULTATION_SHIFT_HOURS = 7` (the hospital's standard daily consultation shift divisor).
