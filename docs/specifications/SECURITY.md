# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Security Documentation

## Overview

This document covers access control at two complementary layers: **row-level data access** (Supabase PostgreSQL RLS) and **route-level page access** (Next.js Server Route Proxy `proxy.ts` and client-side transition guards). Both layers operate in synergy: RLS protects patient and operational data at the database engine level even if network traffic bypasses the frontend; the route proxy protects application routes and server components before HTML rendering occurs.

## Roles

Staff roles are defined in the `users` table, linked to Supabase Auth via `users.auth_id` (matching `auth.uid()`):

| Role | Scope |
| :--- | :--- |
| `superadmin` | System governance, account provisioning, department configuration, and audit access. |
| `admin` | Administrative and analytics oversight, operational queue monitoring. |
| `nurse` | Clinical station queue handling, patient triage, vital assessments, and station callouts. |
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

_Last updated: 2026-10-16 — Full RLS policy set verified and active against live Supabase PostgreSQL instance. RESTRICTIVE policies protect historical data; staff station scoping active; public account and service menu leaks fully resolved._