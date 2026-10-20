# Project Profile: Heart Check PHC

**Last Updated:** 2026-10-18

## Overview & Purpose

**Heart Check PHC** is a specialized, kiosk-based queue management and patient flow analytics system engineered specifically for the Outpatient Department (OPD) of the **Philippine Heart Center (PHC)**. 

Unlike generic outpatient queueing applications, Heart Check PHC is purpose-built to navigate PHC's real-world operational realities:
- Strict scheduled patient arrival windows.
- Daily consultation caps per department.
- Capped cubicle intake capacities.
- Multi-tier patient routing (Registration -> Triage / Screening -> Specialized Diagnostics -> Doctor Consultation).

The platform pairs a patient-facing touchscreen check-in kiosk and waiting room display monitors with an administrative clinical transfer hub, a nurse cubicle Kanban station, and a four-tier analytics engine (Descriptive, Diagnostic, Predictive, Prescriptive).

---

## Capstone Information

- **Institution:** STI College Caloocan — Bachelor of Science in Computer Science
- **Collaborative Partner:** Philippine Heart Center (PHC) Outpatient Department (OPD)
- **Team Members:**
  - Justin Dayle D. Caasi
  - Reign Daniel C. Gutierrez
  - Lenardo R. Jualo
  - Jensen B. Urrutia

---

## Core Technology Stack

| Tier | Technologies | Verified Versions / Packages |
| :--- | :--- | :--- |
| **Frontend Web Application** | Next.js (App Router), React, TypeScript, Tailwind CSS | Next.js 16.3.1, React 19.2.3, Tailwind CSS 4.1.18, TypeScript 5 |
| **UI Components & Icons** | Boxicons, Tabler Icons, Recharts | `boxicons` 2.1.4, `@tabler/icons-react` 3.44.0, `recharts` 3.8.1 |
| **Backend & Analytics** | FastAPI (Python 3.10+), Uvicorn | `fastapi` 0.109.2, `uvicorn` 0.27.1, `pandas` 2.2.0, `numpy` 1.26.4 |
| **Scientific & ML Libraries** | Scikit-learn, Statsmodels, SimPy | `scikit-learn` 1.5.0, `statsmodels` >=0.14.0, `openpyxl` >=3.1.2 |
| **Database & Realtime** | Supabase (PostgreSQL 15) | `@supabase/supabase-js` 2.100.1, `@supabase/ssr` 0.8.0 |
| **Hardware Peripherals** | Touchscreen Kiosk terminal, USB/Serial Thermal Receipt Printer (ESC/POS), Audio Output (TTS/Chimes) |

---

## Major Constraints & Invariants

1. **Strict FIFO Queue Discipline:**
   - At the `/transfer` triage hub, clinical staff can only call, assign, or route the single patient at the top of the queue. Bypassing or cherry-picking queue entries is strictly prohibited by policy and UI mechanics (ADR 002).

2. **Patient Data Privacy & Encryption (RA 10173 Compliance):**
   - All patient contact numbers must be encrypted using authenticated AES-256-GCM before database insertion.
   - Contact numbers are masked on all client workstations (`0917 •••• 567`).
   - Patient full names must never be broadcast across public waiting room TV monitors or exposed in analytical research datasets.

3. **Prohibition of Text Ellipsis on Clinical Data:**
   - Never apply `truncate`, `text-ellipsis`, or `text-overflow: ellipsis` to patient identifiers, ticket numbers, doctor names, room codes, or service labels. Clinical data must wrap naturally (`break-words`, `whitespace-normal`) to prevent medical error (ADR 004).

4. **High-Contrast Solid Clinical Surfaces:**
   - Staff workstations (`/superadmin`, `/dashboard`, `/nurse`, `/transfer`) must use solid, high-contrast surfaces (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`) with 1px borders. Blurred glassmorphism is prohibited (ADR 005).

5. **SQL & Command Injection Immunity:**
   - Raw string interpolation in SQL queries is prohibited; parameterized queries only. PostgREST filter delimiters (`,`, `.`, `:`, `()`) must be stripped before query compilation.
   - Subprocess execution (`child_process.exec()`) is completely banned.

6. **Cross-Service Resilience & Timeouts:**
   - All HTTP requests between Next.js Route Handlers and FastAPI analytical endpoints must enforce an explicit 10-second `AbortController` timeout.

7. **Historical Research Data Immutability:**
   - Historical records (`is_historical = true`) used for thesis research are immutable and protected by PostgreSQL RESTRICTIVE RLS policies against operational `UPDATE` or `DELETE` mutations.

8. **Cost Overrun & Quota Protection:**
   - Outbound SMS (UniSMS) and voice synthesis proxies (`/api/tts`) enforce sliding-window IP rate limiting and in-memory LRU caching to eliminate external API costs.

---

## Important Verified Commands

### Frontend (Next.js)

```bash
# Start local development server (with Webpack enabled)
npm run dev

# Create production build
npm run build

# Start production server (listens on 0.0.0.0:3000)
npm run start

# Run ESLint code checks
npm run lint
```

### Backend & Analytics (Python)

```bash
# Navigate to backend directory
cd python_backend

# Activate virtual environment
source venv/bin/activate

# Install required Python dependencies
pip install -r requirements.txt

# Run FastAPI backend server (listens on 0.0.0.0:8000)
python run.py

# Seed database with sample outpatient records
python db_seeder.py

# Run Chapter 4 consultation queue simulation
# TODO: SimPy simulation script currently under active verification in python_backend/testers/

# Backend automated test suite
# TODO: Formal test runner configuration pending (individual scripts located in python_backend/testers/)
```

---

## System Architecture Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                      │
│                                                                 │
│  /kiosk        Touchscreen self-service patient check-in        │
│  /monitor      Waiting room public queue display                │
│  /transfer     Clinical staff station: drag-and-drop queue      │
│  /nurse        Consultation cubicle & patient intake Kanban     │
│  /dashboard    Analytics portal with Recharts visualization     │
│  /superadmin   System configuration & account management        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
         ┌───────▼────────┐             ┌────────▼─────────┐
         │    Supabase    │             │  FastAPI Backend │
         │  (PostgreSQL)  │◄────────────┤     (Python)     │
         │  - Realtime    │             │  - descriptive   │
         │  - RLS Security│             │  - queue_metrics │
         │  - patients    │             │  - forecasting   │
         │  - services    │             │  - staffing      │
         └────────────────┘             └──────────────────┘
```

---

## Key Subsystems & Route Map

| Subsystem | Route | Primary Role | Key Dependencies |
| :--- | :--- | :--- | :--- |
| **Public Landing** | `/` | Clinical portal gateway, service cards, patient journey overview. | `app/landing/` |
| **Staff Login** | `/login` | Authenticated staff sign-in, brute-force rate limiting, session cookies. | `app/login/`, `proxy.ts` |
| **Terminal Gateway** | `/select-screen` | Role-filtered station router, auto sign-out for kiosk mode. | `app/select-screen/` |
| **Touchscreen Kiosk** | `/kiosk` | Patient self-check-in, department selection, thermal queue ticket printing. | `app/kiosk/`, `/api/print-ticket` |
| **Public Monitor** | `/monitor` | Large-screen waiting room queue display, room callouts, audio chime gates. | `app/monitor/`, Supabase Realtime |
| **Transfer Hub** | `/transfer` | Clinical queue triage, pointer drag-and-drop, strict FIFO lock (top item). | `app/transfer/`, Supabase Realtime |
| **Nurse Station** | `/nurse` | Cubicle intake, 3-column Kanban (Waiting/Active/Complete), Web Speech TTS. | `app/nurse/`, IndexedDB Outbox |
| **Analytics Portal** | `/dashboard` | Four-tier analytics (Descriptive, Diagnostic, Predictive, Prescriptive). | `app/dashboard/`, FastAPI Backend |
| **Superadmin Portal** | `/superadmin` | User provisioning, cubicle assignments, kiosk service menu configuration. | `app/superadmin/`, Supabase Auth |

---

## Cross-References

- [System Architecture Details](./architecture/README.md)
- [Architecture Decision Records](./decisions/README.md)
- [Debugging & Troubleshooting Playbook](./debugging/README.md)
- [Domain Knowledge & Conventions](./knowledge/README.md)
- [Current Project State](./CURRENT.md)
- [Agent & Memory Workflows](./WORKFLOWS.md)
