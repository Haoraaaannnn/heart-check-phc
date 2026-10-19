# Database Architecture & Row-Level Security (RLS)

This document details the PostgreSQL schema, row partitioning strategy, Row-Level Security (RLS) policies, and cryptographic protections implemented in **Heart Check PHC**.

---

## 1. Primary Engine & Infrastructure

- **Engine:** PostgreSQL 15 managed by Supabase.
- **Production Target:** On-premises PostgreSQL database server at the Philippine Heart Center.
- **Client Access:**
  - Client-side code accesses PostgreSQL via the public anon key governed by strict RLS policies.
  - Privileged backend processes (e.g. data ingestion scripts, server actions) access via isolated server-side clients holding the service role key.

---

## 2. Core Tables Overview

| Table | Primary Key | Description | Security & Mutability Rules |
| :--- | :--- | :--- | :--- |
| `patients` | `id` (`int8`) | Unified store for live kiosk check-ins and historical imported OPD records. | RLS enforced; `is_historical = true` is strictly immutable via RESTRICTIVE policies. |
| `services` | `id` (`int4`) | Departmental service directory (Consultation, OPD Screening, ECG, Warfarin, etc.). Includes `queue_prefix` (first letter/number on queue ticket) and `queue_pad_length` (digit padding). | Read-only for public; Superadmin edit only (`is_superadmin()`). |
| `cubicle` | `id` (`int8`) | Consultation cubicles and triage stations within OPD rooms. | Public read; doctor assignment managed by registration staff or admin. |
| `counters` | `counter_number` (`int4`) | Physical registration desk counters. | Public read for desk and monitor displays. |
| `doctors` | `id` (`uuid`) | Physician directory for consultation cubicles. | Authenticated read; managed by registration staff or admin. |
| `patient_category` | `id` (`int8`) | Kiosk intake priority categories (PWD, Senior Citizen, Regular). | Public read access for kiosk UI. |
| `app_settings` | `key` (`text`) | System-wide operational settings. | Authenticated read; Superadmin insert and update. |
| `user_cubicles` | `user_id`, `cubicle_id` | Join table for staff station assignments. | Authenticated self/superadmin read; Superadmin write. |
| `user_services` | `id` (`int8`) | Join table mapping staff to clinical services. | Authenticated self-read via `auth.uid()`. |
| `user_rooms` | `id` (`int8`) | Join table mapping staff to physical rooms. | Authenticated self-read via `auth.uid()`. |
| `user_counters` | `id` (`int8`) | Join table mapping staff to registration counters. | Authenticated self-read via `auth.uid()`. |
| `cubicle_selector` | `id` (`int8`) | Display groups for kiosk cubicle selection. | Public read access. |
| `cubicle_selector_cubicle` | `id` (`int8`) | Join table linking selector groups to cubicles. | Public read access. |
| `login_attempts` | `email` (`text`) | Rate-limiting audit log for staff authentication attempts. | Server-only access via Route Handlers. |
| `password_reset_attempts` | `email` (`text`) | Rate-limiting audit log for password reset requests. | Server-only access via Route Handlers. |

---

## 3. The `patients` Table Architecture

The `patients` table employs a single-table design housing both live operational queue entries and historical research data imported from PHC Excel sheets (March 2024 to December 2025).

### Key Columns

- `id` (`int8`): Auto-incrementing primary key. The definitive unique identifier across both live and historical data.
- `patientNum` (`text`): Queue ticket code (e.g., `C001`, `S014`). Generated at the kiosk for live patients. **NULL for historical imported rows.**
- `service` (`varchar`): Links to `services.label_en`.
- `phoneNum` (`int8`): Patient contact number. Encrypted at rest (`enc:v1:...`).
- `status` (`text`): Queue status (`waiting`, `in-progress`, `Done`, `cancelled`).
- `reg_start`, `reg_end` (`timestamptz`): Registration desk timestamps.
- `consult_start`, `consult_end` (`timestamptz`): Doctor consultation timestamps (mapped from Excel "Doctor Seen" / "Doctor Completed").
- `carryout_start`, `carryout_end` (`timestamptz`): Carryout / prescription release timestamps.
- `is_historical` (`bool`): Flag separating live queue rows (`false`) from imported historical records (`true`).

### Critical Gotcha: `patientNum` vs `id`

- Never query by `patientNum` when running analytics or historical aggregations.
- `patientNum` is reset daily at the kiosk (ticket numbers repeat each morning) and is NULL for historical records.
- Always use `id` (`int8`) as the unique entity reference.

---

## 4. Historical Data Immutability Rule

Per AGENTS.md Rule 12 and the database security model:

```sql
-- Safe operational update pattern
UPDATE patients 
SET status = 'Done', consult_end = NOW() 
WHERE id = $1 AND is_historical = false;
```

Operational mutations (`UPDATE`, `DELETE`) from the nurse station or transfer desk must strictly include `AND is_historical = false`. At the database engine level, this rule is additionally enforced by PostgreSQL RESTRICTIVE RLS policies:
- `patients_no_historical_insert` (`is_historical = false`)
- `patients_no_historical_update` (`is_historical = false`)
- `patients_no_historical_delete` (`is_historical = false`)

These RESTRICTIVE policies guarantee that historical research records remain immutable regardless of client queries.

---

## 5. Patient Phone Number Encryption (AES-256-GCM)

To protect Patient Health Information (PHI) and Personally Identifiable Information (PII):

- **Algorithm:** Authenticated symmetric AES-256-GCM encryption.
- **Prefix:** `enc:v1:` prepended to all serialized ciphertexts.
- **Nonce/IV:** 12-byte cryptographically secure random bytes generated per encryption.
- **Auth Tag:** 16-byte authentication tag ensuring ciphertext integrity.
- **Utility:** Implemented in `lib/crypto/phoneEncryption.ts`.
- **Masking:** Patient phone numbers displayed on UI surfaces are masked (e.g., `0917 •••• 567`) to prevent shoulder-surfing.
- **SQL Migration:** `docs/migrations/encrypt_phone_number.sql` establishes pgcrypto functions for database-level encryption routines.

---

## 6. Row-Level Security (RLS) Enforcement

1. **Anonymous Public Role (TV Monitors & Displays):**
   - Permitted to read live, non-historical queue states for the current day in Manila time (`patients_select_public_live`).
   - Permitted to read services, counters, categories, and cubicle availability.
   - Forbidden from direct inserts, updates, or deletions on `patients`.
2. **Kiosk Terminals (`create_patient` Stored Procedure):**
   - Generates queue tickets by invoking the `create_patient` stored procedure via Supabase RPC (`SECURITY DEFINER`).
   - Validates service parameters and prefixing on the database server without granting raw table write permissions to the anon key.
3. **Clinical Staff (`nurse`):**
   - Scoped strictly to assigned cubicle stations via `patients_select_nurse_scoped` and `patients_update_nurse_scoped` evaluating `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))`.
4. **Registration Staff (`staff`):**
   - Permitted full access to active patients via `patients_select_registration_full`, `patients_update_registration_full`, and `patients_insert_registration`.
   - Permitted to update doctor station assignments via `cubicle_update_doctor_assignment`.
5. **Administrative Governance (`admin`, `superadmin`):**
   - Permitted full operational access via `patients_select_admin`, `patients_update_admin`, `patients_insert_admin`.
   - `services`, `users`, and `app_settings` mutation policies strictly gated to `is_superadmin()`.
6. **Service Role Isolation:**
   - The Supabase Service Role Key bypasses all RLS policies.
   - **Never expose the service-role key to client code or `NEXT_PUBLIC_` environment variables.**
   - Service-role queries are restricted to secure server Route Handlers (`app/api/*`) and internal backend scripts.

---

## Cross-References

- [Full-Stack Architecture](./overview.md)
- [Security Model & Route Guarding](./security-model.md)
- [Database Schema Reference](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SCHEMA_REFERENCE.md)
- [Database Schema Documentation](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md)

---

_Last updated: 2026-10-17 — Reconciled with live Supabase schema and active RLS policies._

