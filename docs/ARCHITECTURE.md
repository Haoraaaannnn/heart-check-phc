# Heart Check PHC — System Architecture Documentation

## Overview

Heart Check PHC is an IoT-based queueing management and patient flow analytics platform built for the Philippine Heart Center's (PHC) Outpatient Department. Unlike a greenfield deployment, this is a **collaborative integration** with PHC's existing operational structure — a fixed-appointment, capped-cubicle system with low operational variance — which shapes both the technical and documentation decisions throughout this project.

The system serves six distinct user contexts through one Next.js application: a physical kiosk for patient check-in, a public display monitor, staff-facing queue management (nurse/transfer), an analytics dashboard (admin), and a superadmin layer for account management.

**Team:** Justin Dayle D. Caasi, Reign Daniel C. Gutierrez, Lenardo R. Jualo, Jensen B. Urrutia — BS Computer Science, STI College Caloocan.

## Architecture

### High-Level Structure

Unlike a multi-port, multi-app architecture, Heart Check PHC runs as a **single Next.js 15 (App Router) application**, with route-level segregation by role instead of separate deployed frontends. This was a deliberate choice suited to a small team needing tight frontend-backend coordination.

```
┌─────────────────────────────────────────────┐
│           Next.js 15 App (single app)         │
│                                                │
│  /kiosk      — public, unauthenticated        │
│  /monitor    — public, unauthenticated        │
│  /login      — public                         │
│  /nurse      — authenticated (nurse/staff)     │
│  /transfer   — authenticated (nurse/staff)     │
│  /dashboard  — authenticated (admin)           │
│  /superadmin — authenticated (superadmin)      │
└───────────────────┬───────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │                            │
┌───────▼────────┐         ┌────────▼─────────┐
│  Supabase        │         │  FastAPI Backend   │
│  (PostgreSQL)     │◄────────┤  (Python)          │
│  - patients table │         │  - analytics/       │
│  - users table (role-based accounts) │         │  - forecasting/      │
│  - services table │         │  - queue_metrics/    │
│  - RLS policies   │         │  - report.py          │
└───────────────────┘         └───────────────────────┘
```

### Components

#### 1. Frontend — Next.js 15 (App Router)

- **Framework:** Next.js 15, React, TypeScript, Tailwind CSS, Recharts (for analytics visualizations)
- **Routing:** Role-based route segments under `app/` — `kiosk`, `monitor`, `login`, `nurse`, `transfer`, `dashboard`, `superadmin`
- **Auth client setup:** `lib/supabase/` — `client.ts` (browser client), `server.ts` (server-component client using `@supabase/ssr` cookie pattern), `admin.ts` (privileged/service-role operations)
- **Access control:** Two-layer — Next.js Middleware (server-side, blocks page delivery before render) + `useRoleGuard` hook (client-side, in-page UI conditionals). See `SECURITY.md` for full detail.

#### 2. Backend — FastAPI (Python)

- **Purpose:** Analytics computation — descriptive, diagnostic, predictive, and prescriptive tiers — plus queueing theory calculations and forecasting
- **Key libraries:** Pandas, NumPy, Scikit-learn, Statsmodels, SimPy
- **Structure** (`python_backend/analytics/`):
  - `constants.py` — shared constants
  - `helpers.py` — shared utility functions
  - `preprocessing.py` — data cleaning/normalization (includes the `patient_id` priority-fallback logic — see `DATABASE_SCHEMA.md`)
  - `descriptive.py` — daily summaries, hourly patterns
  - `queue_metrics.py` — M/M/1 and M/M/c queueing model calculations
  - `forecasting.py` — SMA, WMA, EMA, Linear Regression, ARIMA with MAE-based auto-selection
  - `staffing.py` — staffing/capacity-related calculations
  - `report.py` — orchestrates the full analytics report generation
  - Debug-only (not production): `db_seeder.py`, `simulation.py`, `distribution_tests.py`, `check_dates.py`, `debug_analytics.py`

#### 3. Data Layer — Supabase (PostgreSQL)

- **Development database.** Intended handoff target: PHC's own on-premises PostgreSQL server for production.
- **Single unified table (`patients`)** holds both live kiosk-generated queue entries and historical data imported from PHC's Excel records — distinguished by the `is_historical` flag rather than split into separate tables. See `DATABASE_SCHEMA.md` for full column reference and reasoning.
- **Realtime:** Supabase Realtime powers the live queue display (monitor) and dashboard auto-updates. This is a Supabase-specific feature — on migration to PHC's own PostgreSQL, this needs replacing with WebSocket polling via FastAPI.

#### 4. Hardware (Kiosk Prototype)

- Kiosk unit, display, printer, speaker
- Consultation queue management is the core demonstrated functionality for Chapter 4

## Queueing Model

- **M/M/1** — used for registration and specialized services
- **Per-cubicle M/M/1** — used for consultation (each cubicle modeled independently)
- **M/M/c (Erlang C)** — used only as a theoretical benchmark, not for operational decisions, since PHC's cubicles are fixed and non-expandable

This is real queueing theory grounding, not a scheduling heuristic — a distinguishing factor from simpler round-robin/FIFO dispatch systems.

## Analytics Framework

Four tiers, satisfying both ML and Data Analytics specialization requirements:

1. **Descriptive** — what happened (daily summaries, hourly patterns)
2. **Diagnostic** — why it happened
3. **Predictive** — what will happen (five forecasting algorithms, MAE-based auto-selection: SMA, WMA, EMA, Linear Regression, ARIMA)
4. **Prescriptive** — what to do about it

Forecasting is deliberately framed as a **strategic policy decision-support tool**, not operational capacity planning — since PHC's appointment caps are fixed, forecasting output informs policy decisions (e.g. "should we adjust the appointment cap next quarter?") rather than daily staffing.

## Data Flow — Kiosk to Analytics (End-to-End)

```
1. Patient approaches kiosk → selects service
   ↓
2. Kiosk (public, no login) → INSERT into `patients` table
   - patientNum assigned (kiosk queue code, e.g. "C001")
   - status = waiting, is_historical = false
   - reg_start / created_at set (if service requires registration)
   ↓
3. Supabase Realtime pushes update → Monitor display refreshes
   ↓
4. Nurse/Transfer (authenticated) views queue → UPDATE patient status
   - consult_start, consult_end, cubicleNum, counter set as patient moves through stages
   ↓
5. Dashboard (authenticated, admin) requests analytics report
   ↓
6. FastAPI → preprocessing.py normalizes data
   - patient_id resolved via `id` (Supabase PK) first, `patientNum` as fallback
   ↓
7. descriptive.py / queue_metrics.py / forecasting.py compute report
   ↓
8. report.py aggregates full response (contains `queue_theory` key — diagnostic signal
   that real data was returned, not the empty-data fallback)
   ↓
9. Dashboard renders charts via Recharts
```

## Deployment

| Component        | Platform          | Notes                                                                 |
| ---------------- | ----------------- | --------------------------------------------------------------------- |
| Next.js frontend | Vercel            | Auto-deploys on push to `main`                                        |
| FastAPI backend  | Railway           | Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`         |
| Database         | Supabase          | Development; on-prem PostgreSQL handoff planned for production        |
| Repo             | GitHub (monorepo) | CI via GitHub Actions, path-based triggers using `dorny/paths-filter` |

**Note on production handoff:** Moving to PHC's on-premises server means no internet dependency — offline mode is unnecessary since LAN uptime falls under PHC MIS's responsibility. Docker is flagged as valuable for this handoff (environment reproducibility for PHC's IT team). Supabase Realtime, CORS configuration, and HTTPS/reverse-proxy setup are the three items that need addressing before that handoff is finalized.

## Technology Stack Summary

| Layer              | Technology                                                                       |
| ------------------ | -------------------------------------------------------------------------------- |
| Frontend framework | Next.js 15 (App Router), React, TypeScript                                       |
| Styling            | Tailwind CSS                                                                     |
| Charts             | Recharts                                                                         |
| Backend framework  | FastAPI (Python)                                                                 |
| Data/ML            | Pandas, NumPy, Scikit-learn, Statsmodels, SimPy                                  |
| Database           | Supabase (PostgreSQL) → PHC on-prem PostgreSQL (production)                      |
| Icons              | Tabler Icons (`@tabler/icons-react`), dynamically resolved via `icon_src` column |
| Auth               | Supabase Auth + `@supabase/ssr`                                                  |

## Known Architectural Trade-offs (for thesis documentation)

- **Single unified `patients` table** for both live queue and historical data, rather than two separate tables — chosen to avoid duplicating logic across live/historical code paths and to keep forecasting queries simple. Rows are distinguished via `is_historical`.
- **Single Next.js app with route-based role separation**, rather than multiple deployed frontends per role — suited to small team size and tight coordination needs.
- **Client-side + server-side RBAC** — see `SECURITY.md`.

---

_Last updated: reflects system state as of the RLS/middleware security pass. Update this doc alongside any structural changes ahead of Chapter 4._
