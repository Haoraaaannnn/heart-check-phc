# Heart Check PHC — Database Schema Documentation

## Overview

Database: Supabase (PostgreSQL) for development, with an intended handoff to PHC's own on-premises PostgreSQL server for production. This document covers the primary tables, key gotchas, and the reasoning behind schema decisions that deviate from a "textbook" normalized design.

## Table: `patients`

**This is the single unified table** for both the live kiosk-generated queue and PHC's historical Excel-imported records — there is no separate historical table. This was a deliberate decision to avoid duplicating analytics logic across two schemas, at the cost of needing careful row-scoping to keep live operational writes from ever touching historical data. See `SECURITY.md` for how RLS enforces this separation.

### Columns (verified against live schema)

| Column                   | Type          | Constraints               | Notes                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | `int8`        | Primary Identity          | **The reliable patient identifier for analytics.** Always present for both live and historical rows.                                                                                                                                                                                                                                                                               |
| `created_at`             | `timestamptz` |                           | For imported rows, mapped from the Excel "Queuing Time" column during import.                                                                                                                                                                                                                                                                                                      |
| `phoneNum`               | `int8`        | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `service`                | `varchar`     | Nullable                  | Links to `services` table                                                                                                                                                                                                                                                                                                                                                          |
| `patientNum`             | `text`        | Nullable                  | **Kiosk queue code (e.g. `C001`) — NOT a hospital record ID.** Only populated for live kiosk-created rows; historical imported rows leave this NULL. Do not use this as a patient identifier in analytics — see Key Gotcha below.                                                                                                                                                  |
| `cubicleNum`             | `text`        | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `status`                 | `text`        | Nullable                  | e.g. waiting, in-progress, Done                                                                                                                                                                                                                                                                                                                                                    |
| `updated_at`             | `timestamptz` | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `reg_start`              | `timestamptz` | Nullable                  | NULL for services that don't use a registration stage (only Consultation and OPD Screening use this)                                                                                                                                                                                                                                                                               |
| `reg_end`                | `timestamptz` | Nullable                  | Same NULL condition as `reg_start`                                                                                                                                                                                                                                                                                                                                                 |
| `consult_start`          | `timestamptz` | Nullable                  | Mapped from Excel "Doctor Seen" column during import                                                                                                                                                                                                                                                                                                                               |
| `consult_end`            | `timestamptz` | Nullable                  | Mapped from Excel "Doctor Completed" column during import                                                                                                                                                                                                                                                                                                                          |
| `counter`                | `int4`        | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `called_at`              | `timestamptz` | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `timeout_seconds`        | `int4`        | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `queue_position`         | `int4`        | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `progress_started_at`    | `timestamptz` | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `cubicle_top_started_at` | `timestamptz` | Nullable                  |                                                                                                                                                                                                                                                                                                                                                                                    |
| `is_historical`          | `boolean`     | NOT NULL, default `false` | **Added during the security pass.** `true` = historical/imported row, `false` = live kiosk-created row. Backfilled using `patientNum IS NULL` as the original signal, since the import script never wrote that column. This is the field that separates "safe to edit/delete via app" from "protected, historical, analytics-critical." See `CHANGES_NEEDED.md` for the migration. |

### Key Gotcha — `patientNum` vs `id`

`patientNum` stores kiosk-generated queue display codes (`C001`, `C002`, ...), **not** a reliable unique patient identifier. The import script that loads historical Excel data never populates `patientNum` at all — so any analytics logic that checks `patientNum` before `id` will silently treat every historical row as having no patient, and pandas' `.count()` skips those NULLs entirely.

This caused a real bug: `normalize_dataframe()` in `main.py` checked `patientNum` before `id`, causing all `groupby` aggregations in `daily_summary()`, `hourly_pattern()`, and the forecasting modules to return zero counts on real data. **Fix:** check `id` first, fall back to `patientNum` only if needed. This is safe for both imported historical rows and live kiosk patients.

**Rule going forward: always use `id` (int8, auto-increment) as the reliable patient identifier in any new analytics code — never `patientNum`.**

## Table: `services`

| Column            | Type   | Constraints | Notes                                                                                                                                                                                          |
| ----------------- | ------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `int4` | Primary     |                                                                                                                                                                                                |
| `label_en`        | `text` |             |                                                                                                                                                                                                |
| `label_fil`       | `text` |             |                                                                                                                                                                                                |
| `icon_src`        | `text` |             | Stores a Tabler Icons name, resolved dynamically at render time via `(TablerIcons as Record<string, any>)[service.icon_src]`, with `IconCircleDashed` as fallback if the name doesn't resolve. |
| `display_order`   | `int4` | Nullable    |                                                                                                                                                                                                |
| `description_en`  | `text` | Nullable    |                                                                                                                                                                                                |
| `description_fil` | `text` | Nullable    |                                                                                                                                                                                                |
| `patient_type`    | `text` | Nullable    | Values: `'new'`, `'old'`, `'both'` (default `'both'`). OPD Screening = `'new'` only. Consultation = `'old'` only. Determines whether a patient goes through the registration stage.            |

This is the kiosk's entire service menu — public write access here was the highest-severity RLS issue found in the audit (see `SECURITY.md`).

## Table: `users`

Named `users`, not `profiles` — this table stores nurse/staff/admin/superadmin accounts (not patients).

| Column       | Type          | Constraints      | Notes                                                                                                                                            |
| ------------ | ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | `int8`        | Primary Identity | Internal PK, not used for auth joins                                                                                                             |
| `created_at` | `timestamptz` |                  |                                                                                                                                                  |
| `username`   | `text`        | Unique           |                                                                                                                                                  |
| `email`      | `text`        | Unique           |                                                                                                                                                  |
| `role`       | `text`        |                  | Values: `superadmin`, `admin`, `nurse`, `staff` — confirm exact casing/spelling against actual DB before relying on it in policy/middleware code |
| `auth_id`    | `uuid`        | Unique           | **The join column for RLS/auth checks — matches `auth.uid()`, not `id`.** Every policy and middleware role check must use `auth_id`, not `id`.   |

## Table: `cubicle`

| Column        | Type          | Constraints      | Notes                 |
| ------------- | ------------- | ---------------- | --------------------- |
| `id`          | `int8`        | Primary Identity |                       |
| `created_at`  | `timestamptz` |                  |                       |
| `cubicleNum`  | `text`        | Nullable         |                       |
| `category`    | `text`        | Nullable         |                       |
| `room`        | `int4`        | Nullable         |                       |
| `subcategory` | `text`        | Nullable         |                       |
| `doctorId`    | `uuid`        | Nullable         | Links to `doctors.id` |

No INSERT/DELETE policy currently exists — under RLS, that means both are fully blocked by default unless done via service role key. Confirm this is intentional.

## Table: `doctors`

| Column       | Type          | Constraints      | Notes |
| ------------ | ------------- | ---------------- | ----- |
| `id`         | `uuid`        | Primary          |       |
| `full_name`  | `text`        |                  |       |
| `specialty`  | `text`        | Nullable         |       |
| `email`      | `text`        | Nullable, Unique |       |
| `auth_id`    | `uuid`        | Nullable         |       |
| `active`     | `bool`        |                  |       |
| `created_at` | `timestamptz` | Nullable         |       |

## Table: `patient_category`

| Column      | Type   | Constraints      | Notes |
| ----------- | ------ | ---------------- | ----- |
| `id`        | `int8` | Primary Identity |       |
| `label_en`  | `text` | Nullable         |       |
| `label_fil` | `text` | Nullable         |       |
| `icon_src`  | `text` | Nullable         |       |
| `order`     | `int8` | Nullable         |       |
| `type`      | `text` | Nullable         |       |

Not yet discussed in depth — RLS policies here should get the same review `services` and `patients` received.

## Table: `app_settings`

| Column       | Type          | Constraints | Notes |
| ------------ | ------------- | ----------- | ----- |
| `key`        | `text`        | Primary     |       |
| `value`      | `text`        |             |       |
| `updated_at` | `timestamptz` | Nullable    |       |

RLS on this table already follows the correct pattern (read open to authenticated, all writes gated to superadmin) — used as the reference pattern for fixing the other tables.

## Diagnostic Signal Worth Knowing

`get_empty_data()`'s output is distinguishable from a real `generate_report()` response by the presence of a top-level `queue_theory` key — **real output does not contain this key.** If the dashboard shows all zeros, checking for `queue_theory` in the JSON response immediately tells you whether `generate_report()` ran at all, without needing to dig through the pipeline step by step.

## Import Pipeline Notes (Historical Data)

- **Source:** `NOV.ROOM6-2025.xls` — legacy `.xls` format, requires the `xlrd` engine (not the default `openpyxl`, which only handles `.xlsx`)
- **Structure:** ~74 daily sheets spanning March 2024–December 2025, dual-table layout per sheet
- **Table identification:** the correct table on each sheet is found by searching for the word "Hospital" only in columns with index ≥ 15
- **Column mapping:**
  - Queuing Time → `reg_start` AND `created_at`
  - Initial Assessment → `reg_end`
  - Doctor Seen → `consult_start`
  - Doctor Completed → `consult_end`
- **Timezone:** timestamps localized to `Asia/Manila`, then converted to UTC before insertion
- **Gotcha:** `xlrd` returns time cells as Python `datetime.time` objects, not strings — use `.strftime()`, not `pd.to_datetime()`, or the conversion breaks silently
- **Gotcha:** template/blank rows in the source Excel had `Hospital Number = 0` and all timestamps at `12:00 AM` — these were being imported as real data until a stop condition (`hosp_str == "0"`) was added to `extract_sheet_data()`
- **Gotcha:** a LibreOffice-resaved copy of the source file caused every sheet to import as empty — always use the original downloaded `.xls` file, never a resaved copy
- **Script location:** `import_phc_data.py` in `python_backend/`

## Known Discrepancy: Computed vs. PHC-Recorded Averages

The system's computed `avg_total_time` runs roughly 4 minutes lower than PHC's own recorded average. This is attributable to the exclusion of the "Carry Out" stage from the computed pipeline — a defensible, documentable point rather than a bug, but worth stating explicitly in Chapter 4 so it doesn't read as an unexplained discrepancy.

---

_Last updated: reflects schema state after the `patient_id` priority-fallback fix and the `is_historical`-based RLS redesign, verified against the actual live schema dump. Update this doc if any column is added, renamed, or repurposed._
