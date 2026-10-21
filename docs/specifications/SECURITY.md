# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Security Documentation

## Overview

This document covers access control at two complementary layers: **row-level data access** (Supabase PostgreSQL RLS) and **route-level page access** (Next.js Server Route Proxy `proxy.ts` and client-side transition guards). Both layers operate in synergy: RLS protects patient and operational data at the database engine level even if network traffic bypasses the frontend; the route proxy protects application routes and server components before HTML rendering occurs.

## Roles

Staff roles are defined in the `users` table, linked to Supabase Auth via `users.auth_id` (matching `auth.uid()`):

| Role | Scope |
| :--- | :--- |
| `superadmin` | System governance, account provisioning, department configuration, and audit access. |
| `admin` | Administrative and analytics oversight, operational queue monitoring. |
| `nurse` | Cubicle consultation queue pipeline, patient calling, and stage progression. |
| `staff` | Triage and desk operations, patient transfer desk, registration, and queue routing. |
| _(public / anon)_ | Physical self-service kiosks (`/kiosk`) and waiting room television monitors (`/monitor`). |

---

## Layer 1 — Row-Level Security (Supabase PostgreSQL)

Row-Level Security is strictly enforced across every database table. All legacy permissive policies (`Allow insert for all`, unconditioned public reads, anon deletions) have been dropped and replaced with verified role-based access rules.

### 1. The `patients` Table Policy Architecture

The `patients` table stores both live operational queues and historical imported records (March 2024 to December 2025). Access is divided across distinct functional tiers:

```
Database Clients
       │
       ├── Public Anon (Waiting Room TV Monitors)
       │     └─► patients_select_public_live (Live rows only for current Manila day)
       │
       ├── Clinical Nurses (/nurse)
       │     └─► patients_select_nurse_scoped & patients_update_nurse_scoped
       │           (Restricted strictly to my_cubicle_nums())
       │
       ├── Registration Staff (/transfer)
       │     └─► patients_select_registration_full & patients_update_registration_full
       │     └─► patients_insert_registration
       │
       ├── Administrators (/dashboard, /superadmin)
       │     └─► patients_select_admin, patients_update_admin, patients_insert_admin
       │
       └── Mandatory Immutability Guard (All Roles)
             └─► RESTRICTIVE: patients_no_historical_insert (is_historical = false)
             └─► RESTRICTIVE: patients_no_historical_update (is_historical = false)
             └─► RESTRICTIVE: patients_no_historical_delete (is_historical = false)
```

#### Restrictive Historical Immutability
PostgreSQL RESTRICTIVE policies act as mandatory filters evaluated alongside PERMISSIVE role policies via boolean AND. The three restrictive policies:
- `patients_no_historical_insert`
- `patients_no_historical_update`
- `patients_no_historical_delete`

guarantee that no user, workstation, or administrative script accessing the database via standard RLS-governed connections can ever mutate or delete records where `is_historical = true`.

#### Public TV Monitor Day Scoping
The `patients_select_public_live` policy allows anonymous reading exclusively for active queue rows belonging to the current day in Philippine Standard Time:
```sql
(is_historical = false) AND (created_at >= (date_trunc('day'::text, (now() AT TIME ZONE 'Asia/Manila'::text)) AT TIME ZONE 'Asia/Manila'::text))
```
This prevents external clients from reading historical medical records or previous days' queues.

#### Kiosk Ticket Generation via `create_patient` RPC
Public kiosk terminals do not possess direct `INSERT` permissions on the `patients` table. Instead, patient ticket generation is routed through the `create_patient` stored procedure executed via Supabase RPC (`SECURITY DEFINER`). This stored procedure:
- Validates all input parameters (service label, subcategory, preferred stations, phone number).
- Calculates the queue prefix and sequential ticket code server-side.
- Enforces `is_historical = false`.
- Inserts the validated ticket row and returns the ticket code to the kiosk display.

---

### 2. Service Catalog Security (`services`)

- Public read access is permitted for kiosk touchscreen interfaces (`Enable read access for all users`).
- All mutation operations (`INSERT`, `UPDATE`, `DELETE`) are strictly gated to superadmins via `services_insert_superadmin`, `services_update_superadmin`, and `services_delete_superadmin` checking `is_superadmin()`.
- Legacy anonymous deletion and insertion policies are completely removed.

---

### 3. Account Directory Protection (`users`)

- Public read access is completely blocked.
- Authenticated users may only read their own user record via `users_select_self`:
  `auth_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email')`
- Superadmins may query all accounts for administrative management via `users_select_superadmin` (`is_superadmin()`).

---

### 4. Facility and Staff Station Tables

- **`doctors`:** Authenticated read access for clinical staff; all mutations (`INSERT`, `UPDATE`, `DELETE`) are gated to managers (`is_registration_staff() OR is_admin_or_superadmin()`).
- **`cubicle`:** Public read access for station availability displays; doctor assignment updates are restricted to managers (`is_registration_staff() OR is_admin_or_superadmin()`).
- **`counters`:** Public read access for registration counter status displays.
- **`user_cubicles`:** Self-read or superadmin read; superadmin-only assignment writes (`user_cubicles_write_superadmin`).
- **`user_services`, `user_rooms`, `user_counters`:** Authenticated self-read via `auth.uid()`.
- **`app_settings`:** Authenticated read; superadmin-only insert and update.

---

## Layer 2 — Route-Level Access Control (Next.js)

Route protection is enforced on the server before page rendering occurs, eliminating visual flashing and JavaScript bypass vectors.

### Server Route Proxy (`proxy.ts`)

Heart Check PHC implements server-side route guarding in [proxy.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/proxy.ts) at the project root using `@supabase/ssr` cookie-based session verification:

| Route Path | Allowed Roles | Unauthenticated Action | Unauthorized Action |
| :--- | :--- | :--- | :--- |
| `/superadmin/**` | `superadmin` | Redirect to `/login` | Redirect to `/unauthorized` |
| `/dashboard/**` | `admin`, `superadmin` | Redirect to `/login` | Redirect to `/unauthorized` |
| `/nurse/**` | `nurse`, `staff`, `admin`, `superadmin` | Redirect to `/login` | Redirect to `/unauthorized` |
| `/transfer/**` | `nurse`, `staff`, `admin`, `superadmin` | Redirect to `/login` | Redirect to `/unauthorized` |
| `/kiosk/**` | Public (no authentication) | Permitted | Permitted |
| `/monitor/**` | Public (no authentication) | Permitted | Permitted |
| `/login` | Public | Permitted | Permitted |
| `/unauthorized` | Public / Authenticated | Permitted | Permitted |

---

## Layer 3 — Rate Limiting, Cost Protection & Abuse Controls

To protect external API quotas, prevent financial overages, and mitigate automated denial-of-service / brute-force abuse, rate limiting and resource throttling are enforced across all public and metered endpoints:

1. **Text-to-Speech Synthesis Gateway (`POST /api/tts`):**
   - **Sliding-Window IP Rate Limiter:** Capped at 20 requests per minute per IP address. Exceeding callers receive HTTP 429 (`Too Many Requests`) with an explicit `Retry-After: 60` response header.
   - **In-Memory Audio Buffer Cache:** Synthesized speech MP3 buffers are cached in Node.js server RAM for 30 minutes (up to 100 entries). Repeated announcements (e.g. nurse clicking "Call" multiple times, or identical waiting-room ticket callouts) return in under 1ms with header `X-Cache-Lookup: HIT`, completely eliminating repeat Deepgram API calls and credit consumption.
2. **Patient SMS Dispatch Server Action (`app/actions/sendSMS.ts`):**
   - **Session Authentication:** Strictly requires verified clinical session (`supabase.auth.getUser()`).
   - **Phone Number Regex:** Enforces strict Philippine mobile format (`/^\+639\d{9}$/`).
   - **User Sliding-Window Limit:** Max 20 SMS notifications per staff member per 60 seconds (`RATE_LIMIT_MAX_PER_WINDOW = 20`).
   - **Duplicate Recipient Cooldown:** Mandatory 10-second delay between dispatches to the identical phone number (`DUPLICATE_COOLDOWN_MS = 10000`).
3. **Authentication Brute-Force Lockout (`POST /api/auth/login`):**
   - Persisted in the `login_attempts` table. After 3 consecutive failed authentication attempts, the email account is locked out for 30 seconds (HTTP 429 with `secondsRemaining`).
4. **Password Reset Flood Protection (`POST /api/auth/forgot-password`):**
   - Tracked in `password_reset_attempts`. Enforces a strict ceiling of 3 reset emails per hour and a minimum 60-second cooldown between requests.
5. **Hardware Peripheral Mutex (`POST /api/print-ticket`):**
   - Employs a single-threaded hardware mutex (`isPrinterBusy`) and queries the database to confirm that the requested ticket exists in active patients (`is_historical = false`) before writing ESC/POS byte streams to `/dev/usb/lp*`.

---

## Layer 4 — SQL Injection Immunity Architecture

The system is architecturally immune to SQL injection across all tiers:

1. **Prepared Statements ($1, $2):** Zero direct SQL connection drivers (`pg`, `mysql2`, `sqlite3`, `cursor.execute`) exist in the codebase. All database interactions in Next.js (`@supabase/supabase-js`, `@supabase/ssr`) and FastAPI (`httpx.Client` to PostgREST) communicate over HTTP JSON REST APIs. PostgREST compiles all operations into PostgreSQL prepared statements with bound parameters (`$1`, `$2`), preventing query evaluation of payload strings.
2. **Search Syntax Sanitization:** Client search hooks (`useHeaderSearch.ts`, `usePatientsData.ts`) filter out PostgREST structural delimiter characters (`,`, `(`, `)`) using regex before URL parameter encoding.
3. **Static Stored Procedures:** Database intake via `create_patient` uses compiled static PL/pgSQL `INSERT` statements with strictly typed arguments without dynamic string interpolation (`EXECUTE format(...)`).
4. **Strict Column Whitelisting:** Operational rotation routes (`app/api/rotate/route.ts`) validate incoming payload keys against a strict `Set` of approved database columns (`ALLOWED_UPDATE_FIELDS`), discarding unapproved properties.

---

## Data Encryption & Peripheral Safeguards

1. **Patient Phone Number Encryption:**
   - Patient phone numbers are encrypted at rest using AES-256-GCM authenticated encryption (`enc:v1:...`).
   - Managed via `lib/crypto/phoneEncryption.ts` and database migration `docs/migrations/encrypt_phone_number.sql`.
   - Visual displays mask phone digits (e.g. `0917 •••• 567`) to protect Patient Health Information (PHI).
2. **Peripheral Hardware Isolation:**
   - Thermal printer device writes ([app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/api/print-ticket/route.ts)) validate ticket existence and queue state before sending raw ESC/POS byte streams to `/dev/usb/lp*`.
   - OS command execution (`child_process.exec()`) is strictly prohibited.
3. **Cross-Service HTTP Timeouts:**
   - Cross-service requests between Next.js and the Python analytics backend (`python_backend/`) enforce an explicit **10-second timeout** via `AbortController`.
   - Error messages are sanitized to strip internal Python stack traces, table names, and server file paths.

---

## Related Security Documentation

- [Security Vulnerability Checklist & Patch Remediation Matrix](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md)
- [API Leaks & Injection Risks Audit](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md)
- [User Acceptance Testing (UAT) Checklist](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/UAT_USE_CASE_CHECKLIST.md)
- [Database Architecture & RLS Guide](file:///home/jensen/Github-Repositories/Heart_Check_PHC/brain/architecture/database-and-rls.md)

---

_Last updated: 2026-10-17 — Reconciled against live system. Documented Layer 3 (Rate Limiting & Cost Protection) and Layer 4 (SQL Injection Immunity). Restrictive policies protect historical research data; settings route guarded by requireSuperadmin._