# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Database Schema Documentation

**Last Updated:** 2026-10-20

## Overview

Database: Supabase (PostgreSQL 15) for development, with an intended handoff to PHC's own on-premises PostgreSQL server for production. This document covers the primary tables, access policies, key gotchas, and the reasoning behind schema decisions that deviate from a textbook normalized design.

## Table: `patients`

**This is the single unified table** for both the live kiosk-generated queue and PHC's historical Excel-imported records — there is no separate historical table. This was a deliberate decision to avoid duplicating analytics logic across two schemas, at the cost of needing careful row-scoping to keep live operational writes from ever touching historical data.

PostgreSQL Row-Level Security (RLS) strictly enforces this separation using RESTRICTIVE policies (`patients_no_historical_insert`, `patients_no_historical_update`, `patients_no_historical_delete`) requiring `is_historical = false`. These RESTRICTIVE policies act as mandatory filters that combine with PERMISSIVE role policies via boolean AND, guaranteeing that no normal authenticated or anonymous operation can ever mutate or delete historical research records.

### Columns (verified against live schema)

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | **The reliable patient identifier for analytics.** Always present for both live and historical rows. Auto-incrementing int8. |
| `created_at` | `timestamptz` | NOT NULL | For imported rows, mapped from the Excel "Queuing Time" column during import. |
| `phoneNum` | `int8` | Nullable | Patient contact phone number. Stored as integer or encrypted ciphertext (`enc:v1:...`). |
| `service` | `varchar` | Nullable | Links to `services.label_en` (e.g. `Consultation`, `OPD Screening`, `ECG`). |
| `patientNum` | `text` | Nullable | **Kiosk queue code (e.g. `C001`) — NOT a hospital record ID.** Only populated for live kiosk-created rows; historical imported rows leave this NULL. Do not use this as a patient identifier in analytics. |
| `cubicleNum` | `text` | Nullable | Current assigned station or cubicle identifier (e.g. `1`, `Cubicle 2`). |
| `status` | `text` | Nullable | Current operational queue state (`waiting`, `in-progress`, `Done`, `cancelled`). |
| `updated_at` | `timestamptz` | Nullable | Last modification timestamp. |
| `reg_start` | `timestamptz` | Nullable | Registration desk intake start time. NULL for services bypassing registration. |
| `reg_end` | `timestamptz` | Nullable | Registration desk completion time. |
| `consult_start` | `timestamptz` | Nullable | Mapped from Excel "Doctor Seen" column during import; set when nurse calls patient. |
| `consult_end` | `timestamptz` | Nullable | Mapped from Excel "Doctor Completed" column during import; set when consultation finishes. |
| `counter` | `int4` | Nullable | Assigned physical registration counter number (links to `counters.counter_number`). |
| `called_at` | `timestamptz` | Nullable | Timestamp when patient was called over audio callout system. |
| `timeout_seconds` | `int4` | Nullable | Cooldown or intake timeout setting in seconds. |
| `queue_position` | `int4` | Nullable | Numeric index indicating current waiting sequence position. |
| `progress_started_at` | `timestamptz` | Nullable | Timestamp marking transition into active service. |
| `cubicle_top_started_at` | `timestamptz` | Nullable | Timestamp when patient reached the top of a cubicle queue. |
| `preferredCubicleNums` | `_text` | Nullable | Array of cubicle strings indicating patient preference or routing options. |
| `subcategory` | `text` | Nullable | Subcategory classification for specific clinical queues (e.g., ECG, Pedia, Adult). |
| `carryout_start` | `timestamptz` | Nullable | Start timestamp for carryout / prescription release stage. |
| `carryout_end` | `timestamptz` | Nullable | Completion timestamp for carryout stage. Integrated in analytics pipeline. |
| `is_historical` | `bool` | NOT NULL, default `false` | Distinguishes imported historical research records (`true`) from active queue rows (`false`). |
| `cooldown_until` | `timestamptz` | Nullable | Throttling timestamp preventing immediate re-calling of skipped/rotated patients. |
| `rotation_count` | `int4` | NOT NULL, default `0` | Tracks number of times a patient has been skipped or rotated across queues. |
| `counter_rejoin_at` | `timestamptz` | Nullable | Timestamp when an idle or transferred patient rejoined the counter queue. |
| `counter_top_started_at` | `timestamptz` | Nullable | Timestamp when patient arrived at the head of the counter queue. |
| `idle_at` | `timestamptz` | Nullable | Timestamp when patient was moved to idle status (no-show / unassigned pool). |
| `removed_at` | `timestamptz` | Nullable | Timestamp marking removal from active queue flow. |
| `estimated_wait_minutes` | `int4` | Nullable | Computed estimated wait time in minutes generated at kiosk check-in. |

### Key Gotcha: `patientNum` vs `id`

`patientNum` stores kiosk-generated queue display codes (`C001`, `C002`, ...), **not** a reliable unique patient identifier. The import script that loads historical Excel data never populates `patientNum` at all — so any analytics logic that checks `patientNum` before `id` will silently treat every historical row as having no patient, causing aggregations to return zero counts on historical data.

**Rule: always use `id` (int8, auto-increment) as the reliable unique patient identifier in all analytics, forecasting, and joins — never `patientNum`.**

### Kiosk Intake Architecture: `create_patient` Stored Procedure

Public kiosk terminals running on unauthenticated hardware do not execute direct table `INSERT` queries on `patients`. Instead, the kiosk invokes the `create_patient` PostgreSQL stored procedure via Supabase RPC (`SECURITY DEFINER`). This stored procedure:
1. Validates input parameters (`p_service`, `p_subcategory`, `p_preferred_cubicles`, `p_phone`).
2. Calculates the next sequential queue code with the appropriate service prefix.
3. Inserts the new record with `is_historical = false`.
4. Returns the assigned queue code and initial queue position to the kiosk client.

Direct `INSERT` statements on `patients` are restricted by RLS to authenticated `is_admin_or_superadmin()` and `is_registration_staff()`.

---

## Table: `services`

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int4` | Primary | Service identifier. |
| `label_en` | `text` | NOT NULL | English display label (e.g. `Consultation`, `OPD Screening`, `Warfarin`). |
| `label_fil` | `text` | NOT NULL | Filipino display label (e.g. `Pagsusuri ng Doktor`, `Pagsala sa OPD`). |
| `icon_src` | `text` | NOT NULL | Boxicons icon identifier resolved dynamically via `resolveServiceIcon()`. |
| `display_order` | `int4` | Nullable | Sorting index for kiosk touchscreens. |
| `description_en` | `text` | Nullable | English description displayed on kiosk guidance screens. |
| `description_fil` | `text` | Nullable | Filipino description displayed on kiosk guidance screens. |
| `patient_type` | `text` | Nullable | Routing flag: `'new'`, `'old'`, or `'both'`. Governs triage registration routing. |
| `queue_prefix` | `text` | Nullable | Leading character/prefix (letter or number, e.g. `C`, `1`, `S`) for printed queue tickets. Serves as the first number or letter on the queue number. |
| `queue_pad_length` | `int4` | NOT NULL | Number of padded numeric digits following the prefix (e.g. `3` produces `001` yielding `C001` or `1001`; `4` produces `0001` yielding `C0001`). |
| `requires_registration` | `bool` | Nullable | Whether patients must check in at Registration Counters 1 to 5 for document verification before queueing. |
| `has_subcategories` | `bool` | Nullable | Whether kiosk prompts for age category triage (Adult 19+ vs Pedia 18 and below). |
| `requires_cubicle` | `bool` | Nullable | Whether kiosk displays doctor and examination cubicle selection cards, routing to physical rooms. |
| `requires_nurse` | `bool` | Nullable | Whether this service appears on the 3-stage Nurse Station Kanban (/nurse: Assigned -> With Doctor -> Carryout -> Done). |
| `show_on_monitor` | `bool` | Nullable | Whether this service queue is broadcast on public TV monitors in waiting areas (/monitor). |
| `auto_assign` | `bool` | Nullable | Whether the transfer coordinator automatically distributes waiting patients FIFO without manual staff drag-and-drop. |
| `monitor_layout` | `varchar` | Nullable | TV calling display layout: `'cubicle'` (split-screen doctor cards) or `'table'` (multi-patient matrix grid). |

**RLS Enforcement:**
- Public read access for anonymous and authenticated users (`Enable read access for all users`).
- All mutation operations (`INSERT`, `UPDATE`, `DELETE`) are strictly restricted to superadmins via `is_superadmin()`. Unauthenticated modifications are completely blocked.


---

## Table: `users`

Stores nurse, staff, administrator, and superadmin accounts.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | Internal sequence PK. |
| `created_at` | `timestamptz` | NOT NULL | Account creation timestamp. |
| `username` | `text` | Unique, NOT NULL | Account username. |
| `email` | `text` | Unique, NOT NULL | Staff email address. |
| `role` | `text` | NOT NULL | Role tier: `superadmin`, `admin`, `nurse`, `staff`. |
| `auth_id` | `uuid` | Unique, NOT NULL | **Foreign key linking to `auth.users.id`.** Used for all RLS joins via `auth.uid()`. |
| `assigned_room` | `int4` | Nullable | Primary physical triage or consultation room assignment. |

**RLS Enforcement:**
- `users_select_self`: Authenticated users can view only their own record (`auth_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email')`).
- `users_select_superadmin`: Superadmins can view all user records (`is_superadmin()`).
- Public / anonymous read access is completely denied, eliminating previous credential leakage risks.

---

## Table: `cubicle`

Stores clinical stations and cubicle rooms within the OPD clinic.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | Cubicle identifier. |
| `created_at` | `timestamptz` | NOT NULL | Creation timestamp. |
| `cubicleNum` | `text` | Nullable | Station designation (e.g. `1`, `Cubicle 2`). |
| `category` | `text` | Nullable | Clinical category (e.g. `Adult`, `Pediatric`). |
| `room` | `int4` | Nullable | Physical room number. |
| `subcategory` | `text` | Nullable | Departmental sub-queue classification. |
| `doctorId` | `uuid` | Nullable | Foreign key linking to `doctors.id`. |

**RLS Enforcement:**
- `Allow public read access`: Readable by anon and authenticated users for queue displays and station status.
- `cubicle_update_doctor_assignment`: Doctor assignment updates restricted to registration staff (`is_registration_staff()`) or administrative managers (`is_admin_or_superadmin()`).
- `INSERT` and `DELETE` have no public or staff policies, meaning they are blocked by default under RLS and reserved for service-role administrative operations.

---

## Table: `doctors`

Physician directory for consultation cubicle assignments.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary | Unique doctor identifier. |
| `full_name` | `text` | NOT NULL | Doctor full name and medical credentials. |
| `specialty` | `text` | Nullable | Medical specialization (e.g. `Cardiology`, `Pediatric Cardiology`). |
| `email` | `text` | Nullable, Unique | Contact email address. |
| `auth_id` | `uuid` | Nullable | Optional link to Supabase Auth if doctor has direct login. |
| `active` | `bool` | NOT NULL, default `true` | Active duty indicator. |
| `created_at` | `timestamptz` | Nullable | Record creation timestamp. |

**RLS Enforcement:**
- `Authenticated users can read doctors`: All authenticated staff can view active doctor profiles.
- `doctors_insert_managers`, `doctors_update_managers`, `doctors_delete_managers`: Mutations restricted to registration managers (`is_registration_staff()`) and administrators (`is_admin_or_superadmin()`).

---

## Table: `counters`

Physical registration counters at the OPD reception and triage area.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `counter_number` | `int4` | Primary | Physical counter number (e.g. `1`, `2`, `3`). |
| `label` | `text` | Nullable | Optional descriptive title (e.g. `Triage Desk 1`). |
| `active` | `bool` | NOT NULL, default `true` | Operating status flag. |
| `created_at` | `timestamptz` | NOT NULL | Creation timestamp. |

**RLS Enforcement:**
- `counters readable`: Permissive public read for anon and authenticated users (`SELECT true`).

---

## Table: `patient_category`

Kiosk intake categories (e.g., Senior Citizen, PWD, Pregnant, Regular).

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | Category identifier. |
| `label_en` | `text` | Nullable | English description. |
| `label_fil` | `text` | Nullable | Filipino description. |
| `icon_src` | `text` | Nullable | Boxicons icon class. |
| `order` | `int8` | Nullable | Display sequence index. |
| `type` | `text` | Nullable | Category type mapping. |

**RLS Enforcement:**
- `Allow public read`: Public read access for kiosk touchscreen interfaces (`SELECT true`).

---

## Table: `app_settings`

System-wide key-value configuration table (e.g. operating hours, timeout limits).

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `key` | `text` | Primary | Setting key name. |
| `value` | `text` | NOT NULL | Configuration value string or serialized JSON. |
| `updated_at` | `timestamptz` | Nullable | Timestamp of last modification. |

**RLS Enforcement:**
- Read open to all authenticated users.
- `INSERT` and `UPDATE` strictly restricted to `superadmin` role via `users` check.

---

## Staff Station Assignment Tables

A set of join tables scoping staff accounts to physical rooms, counters, cubicles, and services:

1. **`user_cubicles`** (`user_id` int8, `cubicle_id` int8, composite PK):
   - Maps staff accounts to specific consultation cubicles.
   - Read: `user_cubicles_select_self_or_superadmin` (self or superadmin).
   - Write: `user_cubicles_write_superadmin` (superadmin only).
2. **`user_services`** (`id` int8 PK, `user_id` int8, `service` text):
   - Maps staff accounts to clinical service departments.
   - Read: Authenticated self-read via `auth.uid()`.
3. **`user_rooms`** (`id` int8 PK, `user_id` int8, `service` text, `subcategory` text nullable, `room` int4):
   - Maps staff accounts to physical room numbers by service.
   - Read: Authenticated self-read via `auth.uid()`.
4. **`user_counters`** (`id` int8 PK, `user_id` int8, `counter` int4):
   - Maps staff accounts to registration counter numbers.
   - Read: Authenticated self-read via `auth.uid()`.
5. **`cubicle_selector`** (`id` int8 PK, `cubicle_name` text, `cubicle_order` int8 nullable):
   - Grouping and display layer for kiosk cubicle selection.
   - Read: Public read (`anon, authenticated`).
6. **`cubicle_selector_cubicle`** (`id` int8 PK, `cubicle_selector_id` int8, `cubicle_id` int8):
   - Many-to-many link between selector groups and cubicles.
   - Read: Public read (`public`).

---

## Rate-Limiting & Audit Tables

Keyed on `email` to protect authentication endpoints from brute-force and replay attacks:

1. **`login_attempts`**:
   - `email` (`text` Primary), `attempt_count` (`int4`), `locked_until` (`timestamptz` Nullable), `updated_at` (`timestamptz` Nullable).
   - Backs `/api/auth/login` brute-force lockout. Managed via service-role backend routes.
2. **`password_reset_attempts`**:
   - `email` (`text` Primary), `request_count` (`int4`), `window_start` (`timestamptz`), `updated_at` (`timestamptz`).
   - Backs password recovery rate limiting with 15-minute expiration windows.

---

## Diagnostic Signal Worth Knowing

`get_empty_data()`'s output is distinguishable from a real `generate_report()` response by the presence of a top-level `queue_theory` key — **real output does not contain this key.** If the dashboard shows all zeros, checking for `queue_theory` in the JSON response immediately tells you whether `generate_report()` ran at all, without needing to dig through the pipeline step by step.

---

## Import Pipeline Notes (Historical Data)

- **Source:** `NOV.ROOM6-2025.xls` — legacy `.xls` format, requires the `xlrd` engine (not the default `openpyxl`, which only handles `.xlsx`).
- **Structure:** ~74 daily sheets spanning March 2024–December 2025, dual-table layout per sheet.
- **Table identification:** The correct table on each sheet is found by searching for the word "Hospital" only in columns with index >= 15.
- **Column mapping:**
  - Queuing Time -> `reg_start` AND `created_at`
  - Initial Assessment -> `reg_end`
  - Doctor Seen -> `consult_start`
  - Doctor Completed -> `consult_end`
- **Timezone:** Timestamps localized to `Asia/Manila`, then converted to UTC before insertion.
- **Gotcha:** `xlrd` returns time cells as Python `datetime.time` objects, not strings — use `.strftime()`, not `pd.to_datetime()`, or the conversion breaks silently.
- **Gotcha:** Template/blank rows in the source Excel had `Hospital Number = 0` and all timestamps at `12:00 AM` — these were being imported as real data until a stop condition (`hosp_str == "0"`) was added to `extract_sheet_data()`.
- **Gotcha:** A LibreOffice-resaved copy of the source file caused every sheet to import as empty — always use the original downloaded `.xls` file, never a resaved copy.
- **Script location:** `import_phc_data.py` in `python_backend/`.
- **Historical Flag:** The import script uses the Supabase service role key and explicitly tags all ingested rows with `is_historical = true`.

---

## Carry Out Stage Calculation

The system calculates `service_carryout` using `carryout_start` and `carryout_end` in `python_backend/analytics/preprocessing.py`, integrating it into `total_time` to match Philippine Heart Center outpatient benchmarks.

---

## Appendix A: Raw Table Column Schemas & RLS Policy Reference

This appendix provides a literal reference dump of the verified database schema and active Row-Level Security (RLS) policies reconciled against the live Supabase PostgreSQL database.

### Table Columns

#### `services`
| Name | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int4` | Primary | Service identifier |
| `label_en` | `text` | NOT NULL | Primary English display name |
| `label_fil` | `text` | NOT NULL | Filipino translation |
| `icon_src` | `text` | NOT NULL | Tabler/Boxicon icon identifier |
| `display_order` | `int4` | Nullable | Ordering index on kiosk |
| `description_en` | `text` | Nullable | Service instructions |
| `description_fil` | `text` | Nullable | Filipino instructions |
| `patient_type` | `text` | Nullable | Target demographic classification |
| `queue_prefix` | `text` | Nullable | Customizable queue prefix letter or number (e.g. "C", "S", "1") |
| `queue_pad_length` | `int4` | Default 3 | Ticket digit padding (e.g. 3 for "001", 4 for "0001") |

#### `users`
| Name | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | Internal sequential ID |
| `created_at` | `timestamptz` | NOT NULL | Record creation timestamp |
| `username` | `text` | Unique | Clinical login username |
| `email` | `text` | Unique | User email address |
| `role` | `text` | NOT NULL | Role string (`superadmin`, `admin`, `nurse`, `staff`, `doctor`, `registration`) |
| `auth_id` | `uuid` | Unique | Foreign key linking to `auth.users.id` (`auth.uid()`) |
| `assigned_room` | `int4` | Nullable | Assigned examination/consultation room number |

#### `cubicle`
| Name | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `int8` | Primary Identity | Cubicle ID |
| `created_at` | `timestamptz` | NOT NULL | Creation timestamp |
| `cubicleNum` | `text` | Nullable | Station identifier (e.g. "1", "Cubicle 2") |
| `category` | `text` | Nullable | Service department (e.g. "Consultation") |
| `room` | `int4` | Nullable | Room number containing this cubicle |
| `subcategory` | `text` | Nullable | Subcategory specialization ("Adult", "Pediatric") |
| `doctorId` | `uuid` | Nullable | Foreign key linking to assigned physician in `doctors.id` |

#### `doctors`
| Name | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary | Physician ID |
| `full_name` | `text` | NOT NULL | Doctor full name (e.g. "Dr. Juan dela Cruz") |
| `specialty` | `text` | Nullable | Medical specialty |
| `email` | `text` | Nullable Unique | Doctor email |
| `auth_id` | `uuid` | Nullable | Linked auth ID |
| `active` | `bool` | NOT NULL | Active on-duty status flag |
| `created_at` | `timestamptz` | Nullable | Creation timestamp |

#### `counters`
| Name | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `counter_number` | `int4` | Primary | Physical registration window number (1, 2, 3...) |
| `label` | `text` | Nullable | Display label (e.g. "Priority Counter") |
| `active` | `bool` | NOT NULL | Online/offline operational toggle |
| `created_at` | `timestamptz` | NOT NULL | Creation timestamp |

---

### Active Row-Level Security Policies

| Table | Policy Name | Command | Roles | Type | Clause / Check |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **`patients`** | `patients_no_historical_insert` | INSERT | anon, authenticated | RESTRICTIVE | `(is_historical = false)` |
| **`patients`** | `patients_no_historical_update` | UPDATE | anon, authenticated | RESTRICTIVE | `(is_historical = false)` |
| **`patients`** | `patients_no_historical_delete` | DELETE | anon, authenticated | RESTRICTIVE | `(is_historical = false)` |
| **`patients`** | `patients_select_nurse_scoped` | SELECT | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` |
| **`patients`** | `patients_update_nurse_scoped` | UPDATE | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` |
| **`patients`** | `patients_select_registration_full` | SELECT | authenticated | PERMISSIVE | `is_registration_staff()` |
| **`patients`** | `patients_update_registration_full` | UPDATE | authenticated | PERMISSIVE | `is_registration_staff()` |
| **`patients`** | `patients_insert_registration` | INSERT | authenticated | PERMISSIVE | `is_registration_staff()` |
| **`patients`** | `patients_select_public_live` | SELECT | anon | PERMISSIVE | `((is_historical = false) AND (created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Manila'))))` |
| **`patients`** | `patients_select_admin` | SELECT | authenticated | PERMISSIVE | `is_admin_or_superadmin()` |
| **`patients`** | `patients_update_admin` | UPDATE | authenticated | PERMISSIVE | `is_admin_or_superadmin()` |
| **`patients`** | `patients_insert_admin` | INSERT | authenticated | PERMISSIVE | `is_admin_or_superadmin()` |
| **`services`** | `Enable read access for all users` | SELECT | public | PERMISSIVE | `true` |
| **`services`** | `services_insert_superadmin` | INSERT | authenticated | PERMISSIVE | `is_superadmin()` |
| **`services`** | `services_update_superadmin` | UPDATE | authenticated | PERMISSIVE | `is_superadmin()` |
| **`services`** | `services_delete_superadmin` | DELETE | authenticated | PERMISSIVE | `is_superadmin()` |
| **`users`** | `users_select_self` | SELECT | authenticated | PERMISSIVE | `((auth_id = auth.uid()) OR (lower(email) = lower(auth.jwt() ->> 'email')))` |
| **`users`** | `users_select_superadmin` | SELECT | authenticated | PERMISSIVE | `is_superadmin()` |
| **`cubicle`** | `Allow public read access` | SELECT | anon, authenticated | PERMISSIVE | `true` |
| **`cubicle`** | `cubicle_update_doctor_assignment` | UPDATE | authenticated | PERMISSIVE | `(is_registration_staff() OR is_admin_or_superadmin())` |
| **`doctors`** | `Authenticated users can read doctors` | SELECT | authenticated | PERMISSIVE | `true` |
| **`doctors`** | `doctors_insert_managers` | INSERT | authenticated | PERMISSIVE | `(is_registration_staff() OR is_admin_or_superadmin())` |
| **`doctors`** | `doctors_update_managers` | UPDATE | authenticated | PERMISSIVE | `(is_registration_staff() OR is_admin_or_superadmin())` |
| **`doctors`** | `doctors_delete_managers` | DELETE | authenticated | PERMISSIVE | `(is_registration_staff() OR is_admin_or_superadmin())` |
| **`app_settings`** | `Authenticated users can read app_settings` | SELECT | authenticated | PERMISSIVE | `true` |
| **`app_settings`** | `Superadmin can insert app_settings` | INSERT | authenticated | PERMISSIVE | `(is_superadmin())` |
| **`app_settings`** | `Superadmin can update app_settings` | UPDATE | authenticated | PERMISSIVE | `(is_superadmin())` |
| **`counters`** | `counters readable` | SELECT | anon, authenticated | PERMISSIVE | `true` |
| **`user_cubicles`** | `user_cubicles_select_self_or_superadmin` | SELECT | authenticated | PERMISSIVE | `((user_id = (SELECT users.id FROM users WHERE users.auth_id = auth.uid())) OR is_superadmin())` |
| **`user_cubicles`** | `user_cubicles_write_superadmin` | ALL | authenticated | PERMISSIVE | `is_superadmin()` |

---

_Last updated: 2026-10-20 — Master database architecture and schema reference consolidated. Includes full column definitions, customizable queue ticket prefixes/padding, service clinical workflow checklist flags, staff-scoping join tables, rate-limiting models, and verified RLS policies._