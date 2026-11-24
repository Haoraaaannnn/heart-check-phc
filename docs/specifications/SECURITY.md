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

## Layer 5 — Patient Data Privacy & Authenticated Encryption (AES-256-GCM)

Patient contact numbers collected at self-service kiosks constitute Personally Identifiable Information (PII) and Sensitive Personal Data under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). To protect patient confidentiality against unauthorized disclosure, shoulder-surfing, data dumps, and database snooping, phone numbers are encrypted using authenticated symmetric encryption.

### 1. Cryptographic Architecture
- **Cipher:** AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode).
- **Key Length:** 256 bits (32 bytes).
- **Key Derivation:** PBKDF2 / scrypt derived from `PHONE_ENCRYPTION_SECRET` (with deterministic salt `phc_phone_salt_v1_2026`).
- **Nonce / IV:** 12-byte cryptographically secure pseudorandom number (`crypto.randomBytes(12)`) generated fresh for every encryption call.
- **Authentication Tag:** 16-byte (128-bit) GCM authentication tag verifying ciphertext authenticity and preventing ciphertext tampering.

### 2. Ciphertext Serialization Format
Encrypted tokens adhere to the following colon-delimited string format:
```text
enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
```

Example payload:
```text
enc:v1:83a2c427f7a22eae587db368:5e4775605fe661836446cc734b2a7c32:7c99412ccdbac828c78d25
```

### 3. Graceful Backwards Compatibility & Display Masking
- The decryption helper `decryptPhoneNumber()` automatically detects whether a phone value is an `enc:v1` ciphertext or a legacy plain number (`int8` or string digits). Legacy patient records display and function seamlessly without requiring immediate mass re-encryption.
- Visual displays across client dashboards mask phone digits (`0917 •••• 567`) to protect Patient Health Information (PHI) from shoulder-surfing.
- Patient full names are never broadcast across public TV monitors or exported in analytical research datasets.

### 4. Developer Editing Guide ("Where to Edit")

| Action / Responsibility | File Path |
| :--- | :--- |
| **Core encryption / decryption logic & AES-256-GCM cipher** | [lib/crypto/phoneEncryption.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/lib/crypto/phoneEncryption.ts) |
| **Next.js Server Actions for client-safe encryption & decryption** | [app/actions/phoneSecurity.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/actions/phoneSecurity.ts) |
| **Kiosk phone number entry & ticket registration** | [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx) |
| **Automated SMS dispatch & gateway normalization** | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/actions/sendSMS.ts) |
| **Dashboard patient table & protected phone rendering** | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| **Dashboard patient query hook & record mapping** | [usePatientsData.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| **Supabase database migration script** | [docs/migrations/encrypt_phone_number.sql](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/encrypt_phone_number.sql) |

---

## Peripheral Safeguards & Cross-Service Security

1. **Peripheral Hardware Isolation:**
   - Thermal printer device writes ([app/api/print-ticket/route.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/api/print-ticket/route.ts)) validate ticket existence and queue state before sending raw ESC/POS byte streams to `/dev/usb/lp*`.
   - OS command execution (`child_process.exec()`) is strictly prohibited.
2. **Cross-Service HTTP Timeouts:**
   - Cross-service requests between Next.js and the Python analytics backend (`python_backend/`) enforce an explicit **10-second timeout** via `AbortController`.
   - Error messages are sanitized to strip internal Python stack traces, table names, and server file paths.
3. **Audit Verification Status (OWASP Top 10):**
   - 100% of core application vulnerabilities (service-role isolation, brute-force mitigation, IP rate limiting, audio caching, and SQL injection proofing) are verified patched and active in production code.

---

_Last updated: 2026-11-24 — Consolidated master security specification integrating Row-Level Security, Server Route Guarding, Rate Limiting & Abuse Controls, SQL Injection Immunity, and AES-256-GCM Phone Encryption Architecture._