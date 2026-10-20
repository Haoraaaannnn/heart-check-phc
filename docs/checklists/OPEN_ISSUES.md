# Heart Check PHC: Master Issues & Action Items Tracker

**Last Updated:** 2026-10-18

> [!NOTE]
> **System Status Summary:**
> - **Core Clinical Architecture:** Fully Operational (Kiosk intake, Nurse Kanban, Transfer routing, Public TV monitor, Executive analytics).
> - **Security & Data Privacy:** 100% Patched & Verified (Database RLS policies, server-side route guards, API leak fixes, AES-256-GCM phone encryption, SQL injection immunity).
> - **Active Open Action Items:** 3 operational follow-ups (Simulation runner execution, Dependabot review, FastAPI compute throttling).

---

## 1. Active Open Action Items (Current Development Milestone)

The following items are active, concrete action items scheduled for the current iteration:

| Item ID | Category | Priority | Action Item | Target File / Location | Description & Expected Output |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **ACT-001** | Simulation & Research | **P1** | Build & Run Chapter 4 Simulation Notebook | [docs/simulation/chapter4_simulation_build_guide.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/simulation/chapter4_simulation_build_guide.md) | Author `python_backend/chapter4_simulation.ipynb` per the build guide and execute it against 2024 historical patient baselines to generate statistical comparison figures and tables for thesis Chapter 4 documentation. |
| **ACT-002** | Dependency Hygiene | **P1** | Review GitHub Dependabot Package Upgrades | `package.json`, `package-lock.json` | Review and merge the 10 automated Dependabot pull requests on GitHub for non-breaking Next.js/React subdependency updates. |
| **ACT-003** | Backend Security | **P2** | Apply `slowapi` Rate Limiting to Analytics APIs | [python_backend/main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py) | Integrate `slowapi` rate limiter on heavy compute endpoints (`/api/export-excel`, `/api/analytics/forecast`) to prevent thread starvation under concurrent queries. |

---

## 2. Future Production Handoff & Enhancements (Post-Capstone Deployment)

These items are operational infrastructure tasks reserved for on-site deployment at the Philippine Heart Center (PHC) server facility:

| Item ID | Category | Target Subsystem | Scope & Technical Requirement |
| :--- | :--- | :--- | :--- |
| **FUT-001** | Network Security | Reverse Proxy / LAN | Configure Nginx or Caddy reverse proxy with internal TLS/HTTPS certificates on the PHC hospital LAN server, enforcing HTTP Strict Transport Security (HSTS). |
| **FUT-002** | Infrastructure | Deployment Packaging | Package Next.js and FastAPI services into multi-stage `Dockerfile` and `docker-compose.yml` configurations for hospital IT/MIS server deployment. |
| **FUT-003** | Hardware Security | Physical Kiosks | Deploy physical kiosk terminals in dedicated OS Kiosk Mode (Windows Assigned Access or ChromeOS Kiosk), disabling physical USB ports and context menus. |
| **FUT-004** | Governance | Audit Logging | Implement a dedicated `audit_logs` table with a PostgreSQL trigger capturing all administrative overrides, user role edits, and manual ticket deletions. |
| **FUT-005** | Fallback Architecture | Queue Telemetry | Evaluate standalone WebSocket polling fallback via FastAPI if hospital IT chooses to migrate off Supabase Cloud to an isolated local PostgreSQL server. |

---

## 3. Resolved & Verified Milestones Archive

All previously tracked bugs, architectural migrations, and security vulnerabilities that have been fully resolved, tested, and verified in active code:

### 3.1 Security & Access Control
- [x] **API Leaks & Route Vulnerabilities (100% Patched):** All 9 vulnerabilities audited in [API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) patched and verified (OS command injection eliminated, Deepgram key moved server-side, `sync-users` guarded with `requireSuperadmin`, `/api/rotate` hardened, SMS rate-limited, printer verified against live database).
- [x] **Server-Side Route Proxy (`proxy.ts`):** Cookie-based session validation using `@supabase/ssr` protecting `/superadmin`, `/dashboard`, `/nurse`, and `/transfer`. Redirects unauthorized visits to `/unauthorized` or `/login`.
- [x] **Branded Access Denied Screen (`/unauthorized`):** Enterprise-styled solid surface UI displaying role mismatch notifications.
- [x] **Database Row Level Security (RLS) Lockdown:**
  - `patients`: Legacy wide-open policies dropped. Active policies enforce nurse cubicle isolation (`my_cubicle_nums()`), registration staff permissions (`is_registration_staff()`), Manila-day live scoping for public display (`patients_select_public_live`), and PostgreSQL RESTRICTIVE policies enforcing historical immutability (`patients_no_historical_*`).
  - `services`: Anonymous write/delete dropped; catalog modifications gated strictly to `is_superadmin()`.
  - `users`: Public account directory leak eliminated; authenticated self-read and superadmin directory access active.
  - `doctors`: Directory mutations restricted to registration staff and hospital administrators.
  - `cubicle`: Overlapping policies consolidated to a single public read policy; doctor assignment updates gated to managers.
  - Join tables (`user_cubicles`, `user_services`, `user_rooms`, `user_counters`): Authenticated self-read and superadmin-write policies active.
- [x] **Kiosk Intake Security:** Ticket intake uses Supabase RPC `create_patient` stored procedure (`SECURITY DEFINER`) with parameter validation and automatic `is_historical = false` assignment, preventing raw anonymous table inserts.
- [x] **Credential Hygiene:** Service role keys strictly isolated to server runtimes (`lib/supabase/admin.ts`). Zero private secrets or API keys exposed in browser bundles.
- [x] **Brute-Force & Lockout Defense:** Account lockout after repeated failed attempts implemented in `app/api/auth/login/route.ts` via `login_attempts` table.
- [x] **Password Reset Token Invalidation:** Single-use 15-minute token lifecycle enforced in `app/api/auth/reset-password/route.ts` via `password_reset_attempts` table.

### 3.2 Data Privacy & Compliance (RA 10173)
- [x] **Patient Contact Encryption:** Mobile numbers encrypted using authenticated AES-256-GCM before database insertion.
- [x] **Display Masking:** Patient phone numbers formatted with privacy masks (`0917 •••• 567`) across all clinical screens.
- [x] **Public Monitor Anonymity:** Public TV monitors (`/monitor`) display only ticket codes and destination cubicle/counter numbers; zero patient full names are broadcast.
- [x] **Historical Data Protection:** Operational mutations (`UPDATE`, `DELETE`) across nurse and transfer hooks defensively condition on `.eq('is_historical', false)`. PostgreSQL RESTRICTIVE policies reject any transaction targeting historical records.

### 3.3 Data Layer, Schema & Analytics
- [x] **Schema Columns Reconciled:** Operational columns (`preferredCubicleNums`, `subcategory`, `cooldown_until`, `rotation_count`, `counter_rejoin_at`, `counter_top_started_at`, `idle_at`, `removed_at`) documented in [docs/specifications/DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md).
- [x] **Carry-Out Timing Integration:** `service_carryout` integrated into `total_time` calculation in [python_backend/analytics/preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py), resolving the 7-minute tracking discrepancy against PHC manual baseline sheets.
- [x] **Multi-Mode Excel Export:** Built in `ExportExcelModal.tsx` and [python_backend/main.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/main.py), supporting single date, complete date range, and calendar month exports with dynamic recorded date discovery.
- [x] **FastAPI CORS Configuration:** Configured in `python_backend/main.py` using `ALLOWED_ORIGINS` environment variables with restricted HTTP methods (`GET`, `POST`, `OPTIONS`).

### 3.4 User Experience, Real-Time Sync & Navigation
- [x] **Real-Time Queue Synchronization:** Monotonic fetch sequence guards, 300ms event debouncing, 2s channel hysteresis, and subsystem-tailored polling fallbacks implemented across all hooks (`app/nurse/`, `app/transfer/`, `app/monitor/`, `app/dashboard/hooks/useOverviewData.ts`).
- [x] **Kiosk Centering & Ergonomics:** All kiosk interactive screens vertically and horizontally centered between top navigation and wave footer per AGENTS.md Rule 9. In-flow navigation back button implemented.
- [x] **Enterprise Navigation Standard:** Solid surface UI, desktop left-rail navigation (`w-64`), live Manila clock (PST), breadcrumbs, and zero-hydration-flicker dual-theme support implemented across SuperAdmin, Dashboard, Nurse, and Transfer workstations.
- [x] **Text Wrapping Standard:** Text truncation and ellipsis eliminated on clinical data (doctor names, ticket codes, room labels, service names) across all workstations per AGENTS.md Rule 11.

---

## 4. Where to Edit Guide

| Area | Scope | Primary Reference File |
| :--- | :--- | :--- |
| **Active Open Issues** | Current operational tasks | [docs/checklists/OPEN_ISSUES.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/OPEN_ISSUES.md) |
| **Security Audits & Matrices** | Vulnerability mechanics and patch status | [docs/checklists/SECURITY_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/SECURITY_CHECKLIST.md) |
| **API Leak Details** | Code examples and exploit proofs | [docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/API_LEAKS_AND_INJECTION_RISKS_AUDIT.md) |
| **Database Migrations** | Historical execution log of SQL policies | [docs/checklists/CHANGES_NEEDED.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/CHANGES_NEEDED.md) |
| **Feature Roadmap** | Backlog and UI enhancements | [docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md) |
| **Agent Operational Guidelines** | Pre-commit checklist and coding rules | [AGENTS.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/AGENTS.md) |