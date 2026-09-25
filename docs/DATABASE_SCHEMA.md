# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Database Schema Documentation

## Overview

Database: Supabase (PostgreSQL) for development, with an intended handoff to PHC's own on-premises PostgreSQL server for production. This document covers the primary tables, key gotchas, and the reasoning behind schema decisions that deviate from a "textbook" normalized design.

> **Note on currency:** the columns below reflect the schema as previously documented, with additions layered in from a more recent live schema pull. Several new columns and entire new tables (staff-assignment tables, rate-limiting tables) are flagged below as "not yet documented" — their semantics haven't been confirmed yet, only their existence.

## Table: `patients`

**This is the single unified table** for both the live kiosk-generated queue and PHC's historical Excel-imported records — there is no separate historical table. This was a deliberate decision to avoid duplicating analytics logic across two schemas, at the cost of needing careful row-scoping to keep live operational writes from ever touching historical data. See `SECURITY.md` for how RLS enforces this separation (currently under review — the live policy set has diverged from the originally documented `is_historical`-only model).

### Columns (verified against live schema)

| Column                    | Type          | Constraints               | Notes                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                      | `int8`        | Primary Identity           | **The reliable patient identifier for analytics.** Always present for both live and historical rows.                                                                                                                                                                                                                                                                               |
| `created_at`              | `timestamptz` |                             | For imported rows, mapped from the Excel "Queuing Time" column during import.                                                                                                                                                                                                                                                                                                      |
| `phoneNum`                | `int8`        | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `service`                 | `varchar`     | Nullable                   | Links to `services` table                                                                                                                                                                                                                                                                                                                                                           |
| `patientNum`              | `text`        | Nullable                   | **Kiosk queue code (e.g. `C001`) — NOT a hospital record ID.** Only populated for live kiosk-created rows; historical imported rows leave this NULL. Do not use this as a patient identifier in analytics — see Key Gotcha below.                                                                                                                                                  |
| `cubicleNum`              | `text`        | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `status`                  | `text`        | Nullable                   | e.g. waiting, in-progress, Done                                                                                                                                                                                                                                                                                                                                                    |
| `updated_at`              | `timestamptz` | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `reg_start`               | `timestamptz` | Nullable                   | NULL for services that don't use a registration stage (only Consultation and OPD Screening use this)                                                                                                                                                                                                                                                                                |
| `reg_end`                 | `timestamptz` | Nullable                   | Same NULL condition as `reg_start`                                                                                                                                                                                                                                                                                                                                                  |
| `consult_start`           | `timestamptz` | Nullable                   | Mapped from Excel "Doctor Seen" column during import                                                                                                                                                                                                                                                                                                                                |
| `consult_end`             | `timestamptz` | Nullable                   | Mapped from Excel "Doctor Completed" column during import                                                                                                                                                                                                                                                                                                                           |
| `counter`                 | `int4`        | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `called_at`               | `timestamptz` | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `timeout_seconds`         | `int4`        | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `queue_position`          | `int4`        | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `progress_started_at`     | `timestamptz` | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `cubicle_top_started_at`  | `timestamptz` | Nullable                   |                                                                                                                                                                                                                                                                                                                                                                                     |
| `is_historical`           | `boolean`     | NOT NULL, default `false`  | **Added during the security pass.** `true` = historical/imported row, `false` = live kiosk-created row. Backfilled using `patientNum IS NULL` as the original signal, since the import script never wrote that column. This is the field that separates "safe to edit/delete via app" from "protected, historical, analytics-critical." See `CHANGES_NEEDED.md` for the migration. |
| `preferredCubicleNums`    | `_text`       | Nullable                   | Array of cubicle numbers, patient's ranked preference — semantics not yet documented.                                                                                                                                                                                                                                                                                              |
| `subcategory`              | `text`        | Nullable                   | Not yet documented against `cubicle.subcategory` — confirm relationship.                                                                                                                                                                                                                                                                                                            |
| `carryout_start`           | `timestamptz` | Nullable                   | Start of the "Carry Out" stage — see Known Discrepancy note below; this stage exists in the schema but has historically been excluded from the computed `avg_total_time` pipeline.                                                                                                                                                                                                |
| `carryout_end`             | `timestamptz` | Nullable                   | End of the "Carry Out" stage.                                                                                                                                                                                                                                                                                                                                                       |
| `cooldown_until`           | `timestamptz` | Nullable                   | Not yet documented — likely part of a rotation/re-queue throttling mechanism alongside `rotation_count`.                                                                                                                                                                                                                                                                            |
| `rotation_count`           | `int4`        | NOT NULL                   | Not yet documented — likely tracks how many times a patient has been rotated through a cubicle queue.                                                                                                                                                                                                                                                                               |
| `counter_rejoin_at`        | `timestamptz` | Nullable                   | Not yet documented.                                                                                                                                                                                                                                                                                                                                                                 |
| `counter_top_started_at`   | `timestamptz` | Nullable                   | Not yet documented.                                                                                                                                                                                                                                                                                                                                                                 |
| `idle_at`                  | `timestamptz` | Nullable                   | Not yet documented — likely marks when a patient entered an idle/unassigned state (see `IdleNumbersSection.tsx`, `useIdlePatients.ts` in `/transfer`).                                                                                                                                                                                                                             |
| `removed_at`               | `timestamptz` | Nullable                   | Not yet documented.                                                                                                                                                                                                                                                                                                                                                                 |

> Several of the columns above are undocumented — flagged rather than guessed at. Give actual semantics when available and these notes will get tightened.

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

This is the kiosk's entire service menu — public write access here was the highest-severity RLS issue found in the audit (see `SECURITY.md`; not yet confirmed fixed in the latest live pull).

## Table: `users`

Named `users`, not `profiles` — this table stores nurse/staff/admin/superadmin accounts (not patients).

| Column         | Type          | Constraints      | Notes                                                                                                                                            |
| -------------- | ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `int8`        | Primary Identity  | Internal PK, not used for auth joins                                                                                                              |
| `created_at`   | `timestamptz` |                   |                                                                                                                                                   |
| `username`     | `text`        | Unique            |                                                                                                                                                   |
| `email`        | `text`        | Unique            |                                                                                                                                                   |
| `role`         | `text`        |                   | Values: `superadmin`, `admin`, `nurse`, `staff` — confirm exact casing/spelling against actual DB before relying on it in policy/middleware code |
| `auth_id`      | `uuid`        | Unique            | **The join column for RLS/auth checks — matches `auth.uid()`, not `id`.** Every policy and middleware role check must use `auth_id`, not `id`.   |
| `assigned_room`| `int4`        | Nullable          | Not yet documented — likely scopes a nurse/staff account to a physical room, distinct from the cubicle/service/counter assignment tables below.   |

## Staff Assignment Tables (new)

A set of join tables now scope staff accounts to specific cubicles, services, rooms, and counters — not yet reflected anywhere else in this doc set. These appear to back the new `is_clinical_staff()` / `is_registration_staff()` / `my_cubicle_nums()` RLS helper functions referenced in the `patients` policies (see `SECURITY.md` — flagged there as needing a fresh audit).

- **`user_cubicles`** (`user_id`, `cubicle_id`, composite PK) — which cubicles a user is assigned to.
- **`user_services`** (`id`, `user_id`, `service`) — which services a user is assigned to.
- **`user_rooms`** (`id`, `user_id`, `service`, `subcategory` nullable, `room`) — which room(s) a user is assigned to, per service/subcategory.
- **`user_counters`** (`id`, `user_id`, `counter`) — which counter(s) a user is assigned to.
- **`cubicle_selector`** (`id`, `cubicle_name`, `cubicle_order` nullable) and **`cubicle_selector_cubicle`** (`id`, `cubicle_selector_id`, `cubicle_id`) — a grouping/ordering layer over `cubicle`, purpose not yet documented.

None of these are covered in `SECURITY.md` or `CHANGES_NEEDED.md` in narrative form yet. The `patients` RLS policies on `SELECT`/`UPDATE` now branch into `patients_select_nurse_scoped` (cubicle-scoped, via `my_cubicle_nums()`) vs. `patients_select_registration_full` (unscoped for registration staff) — this is a materially different access model than the `is_historical`-only split originally documented, and needs its own audit pass rather than a patch.

## Table: `login_attempts` / `password_reset_attempts` (new)

Both are keyed on `email` (text, primary) and track rate-limiting state:

- **`login_attempts`**: `attempt_count` (int4), `locked_until` (timestamptz, nullable), `updated_at` (timestamptz, nullable) — backs login lockout after repeated failures.
- **`password_reset_attempts`**: `request_count` (int4), `window_start` (timestamptz), `updated_at` (timestamptz) — backs the password-reset flow (`app/api/auth/forgot-password`, `reset-password`, `verify-recovery`), rate-limiting reset requests per email/window.

## Table: `cubicle`

| Column        | Type          | Constraints      | Notes                 |
| ------------- | ------------- | ----------------- | --------------------- |
| `id`          | `int8`        | Primary Identity  |                       |
| `created_at`  | `timestamptz` |                   |                       |
| `cubicleNum`  | `text`        | Nullable          |                       |
| `category`    | `text`        | Nullable          |                       |
| `room`        | `int4`        | Nullable          |                       |
| `subcategory` | `text`        | Nullable          |                       |
| `doctorId`    | `uuid`        | Nullable          | Links to `doctors.id` |

Per the latest live schema pull, has no INSERT/DELETE policy — under RLS, that means both are fully blocked by default unless done via service role key. Confirm this is intentional. Also has 3 overlapping SELECT policies currently — cleanup candidate.

## Table: `doctors`

| Column       | Type          | Constraints      | Notes |
| ------------ | ------------- | ----------------- | ----- |
| `id`         | `uuid`        | Primary           |       |
| `full_name`  | `text`        |                   |       |
| `specialty`  | `text`        | Nullable          |       |
| `email`      | `text`        | Nullable, Unique  |       |
| `auth_id`    | `uuid`        | Nullable          |       |
| `active`     | `bool`        |                   |       |
| `created_at` | `timestamptz` | Nullable          |       |

## Table: `patient_category`

| Column      | Type   | Constraints      | Notes |
| ----------- | ------ | ----------------- | ----- |
| `id`        | `int8` | Primary Identity  |       |
| `label_en`  | `text` | Nullable          |       |
| `label_fil` | `text` | Nullable          |       |
| `icon_src`  | `text` | Nullable          |       |
| `order`     | `int8` | Nullable          |       |
| `type`      | `text` | Nullable          |       |

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

The system's computed `avg_total_time` has historically run roughly 4 minutes lower than PHC's own recorded average, attributed to exclusion of the "Carry Out" stage from the computed pipeline. `patients` now has `carryout_start`/`carryout_end` columns — confirm whether the computed pipeline has been updated to include this stage, which would change or close this discrepancy. If it's still excluded, this remains a defensible, documentable point rather than a bug, and should be stated explicitly in Chapter 4 so it doesn't read as an unexplained discrepancy.

---

_Last updated: reflects schema state after the `patient_id` priority-fallback fix, with additions layered in from a more recent live schema pull (new `patients` columns, staff-assignment tables, `login_attempts`/`password_reset_attempts`). The `is_historical`-based RLS redesign described here has diverged from the live policy set — see `SECURITY.md`. Update this doc if any column is added, renamed, or repurposed._