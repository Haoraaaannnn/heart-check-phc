# Data Import and Export Pipelines

This document details the data ingestion parsers, heuristic corrections, timezone normalization, and automated Excel reporting pipelines implemented across **Heart Check PHC**.

---

## 1. Historical Data Ingestion Pipeline

To seed the platform and validate analytical models, historical consultation records from the Philippine Heart Center (March 2024 to December 2025) were imported into the `patients` table via Python ingestion scripts (`python_backend/data_ingestion/`).

### Column Mapping Matrix

| PHC Excel Column | Database Column (`patients`) | Transformation / Notes |
| :--- | :--- | :--- |
| `Date` + `Queuing Time` | `created_at` | Combined and normalized to UTC timestamp. |
| `Doctor Seen` | `consult_start` | Parsed with AM/PM heuristic. |
| `Doctor Completed` | `consult_end` | Parsed with AM/PM heuristic. |
| `Room / Cubicle` | `cubicleNum` | Cleaned string (e.g. "Cubicle 4"). |
| `Department` | `service` | Foreign key reference to `services`. |
| *(None)* | `is_historical` | Explicitly set to `true` on import. |
| *(None)* | `patientNum` | Left `NULL` to distinguish from live kiosk tickets. |

---

## 2. AM/PM Heuristic Correction

A major data quality challenge in raw hospital Excel logs is ambiguous 12-hour timestamps lacking "AM" or "PM" designations (e.g., "1:15" vs "13:15"):

- **Heuristic Rule 1 (Clinic Operating Hours):**
  The PHC Outpatient Department operates strictly between **06:00 AM and 05:00 PM**.
- **Heuristic Rule 2 (Afternoon Shift Mapping):**
  Any timestamp with an hour between `1` and `5` (`01:00` - `05:59`) is automatically converted to PM (`13:00` - `17:59`).
- **Heuristic Rule 3 (Morning Shift Mapping):**
  Any timestamp with an hour between `6` and `11` (`06:00` - `11:59`) is automatically classified as AM.
- **Heuristic Rule 4 (Chronological Ordering Constraint):**
  `consult_end` must always occur after `consult_start`. If an unflagged `consult_end` hour is smaller than `consult_start` (e.g., start at 11:45 AM, end at 12:15), the transition across noon is resolved.

---

## 3. Timezone Normalization (Asia/Manila vs UTC)

- **Storage Standard:** All timestamps stored in Supabase PostgreSQL use `timestamptz` in UTC.
- **Display & Computation Standard:** All frontend charts, reports, and Python analytics engines explicitly convert timestamps to Philippine Standard Time:
  ```python
  import pytz
  MANILA_TZ = pytz.timezone('Asia/Manila')
  df['created_at_ph'] = df['created_at'].dt.tz_convert(MANILA_TZ)
  ```
- Eliminates off-by-8-hour grouping bugs when bucketing arrivals into hourly bins.

---

## 4. Excel Export Pipeline (`/api/export-excel`)

The executive analytics portal provides automated export to official PHC-formatted Excel workbooks:
- **Engine:** Python backend / OpenPyXL via Next.js Route Handler proxy.
- **Workbook Structure:**
  1. **Executive Summary:** Overall patient volume, average waiting time, consultation compliance rate.
  2. **Hourly Arrival Distribution:** Hourly counts from 06:00 to 17:00 with peak period highlights.
  3. **Department Breakdown:** Patient volumes and average wait durations by service.
  4. **Cubicle Utilization:** Individual doctor cubicle consultation hours and patient throughput.
- **Styling:** Adheres to enterprise clinical palette with crisp borders, bold headers, and formatted duration cells (`[hh]:mm:ss`).

---

## Cross-References

- [Database & RLS Policies](../architecture/database-and-rls.md)
- [Analytics Engine & ML Models](./analytics-and-ml.md)
- [Data Pipelines Reference (`python_backend/docs/`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/DATA_INGESTION_AND_EXPORT_PIPELINES.md)
