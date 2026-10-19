# System Architecture Overview

This document specifies the full-stack architecture of **Heart Check PHC**, detailing subsystem topologies, runtime interactions, and communication contracts.

---

## High-Level Topology

Heart Check PHC is engineered as a decoupled, multi-tier system:

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 15 (App Router)                     │
│                                                             │
│  /kiosk       Touchscreen self-service patient check-in     │
│  /monitor     Live public queue display for waiting rooms   │
│  /transfer    Clinical staff station: drag-and-drop queue   │
│  /nurse       Consultation cubicle & patient intake view    │
│  /dashboard   Analytics dashboard (Recharts visualization)  │
│  /superadmin  System configuration & account management     │
└──────────────────────────────┬──────────────────────────────┘
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

## 1. Frontend: Next.js 15 App Router

- **Framework:** Next.js 15.0+ with React 19 and TypeScript.
- **Routing Paradigm:** App Router (`app/` directory).
- **Styling Architecture:** Tailwind CSS utility styling combined with centralized CSSProperties dictionaries (e.g., `constants/kiosk.ts`, `<feature>.ts`).
- **Data Fetching:**
  - Client components subscribe to Supabase Realtime Channels for immediate UI synchronization.
  - Server Route Handlers (`app/api/*`) handle credentialed tasks, batch operations, and proxying to the Python FastAPI backend.
- **Strict Separation of Concerns:**
  - Per AGENTS.md Rule 2, UI components assemble presentation only.
  - Text copy is isolated in `<feature>Texts.ts`.
  - Style dictionaries and dimension tokens are isolated in `<feature>.ts` or `<feature>Styles.ts`.

---

## 2. Analytical Backend: FastAPI & Python

- **Framework:** FastAPI running on Uvicorn (port 8000).
- **Role:** High-performance computation engine for queueing theory calculations, bottleneck detection, and predictive modeling.
- **Core Libraries:** Pandas, NumPy, Scikit-learn, Statsmodels (ARIMA), SimPy (discrete-event simulation), OpenPyXL (Excel import/export).
- **Communication Contract:**
  - Next.js calls FastAPI via internal REST endpoints (`/api/analytics/*`, `/api/forecasting/*`).
  - Next.js Route Handlers enforce an explicit 10-second `AbortController` timeout on all cross-service HTTP calls to prevent thread starvation.
  - FastAPI responses are validated via Pydantic schemas before serialization.

---

## 3. Database & Realtime Layer: Supabase

- **Engine:** PostgreSQL 15 managed by Supabase.
- **Security:** Strict Row-Level Security (RLS) policies enabled across all production tables (`patients`, `daily_queue_entries`, `services`, `rooms`, `counters`).
- **Realtime Broadcasting:**
  - Subscribed clients (`/monitor`, `/transfer`, `/nurse`) listen to postgres_changes events on `daily_queue_entries` and `patients`.
  - State updates propagate with low latency across clinical workstations and public displays.

---

## 4. Hardware and Peripherals Layer

- **Thermal Receipt Printer:**
  - Integrated via `/api/print-ticket` using ESC/POS raw command generation.
  - Connects via direct USB or network IP socket.
- **Audio Output:**
  - Public monitors and nurse workstations utilize Web Speech API / browser AudioContext for ticket chimes and synthesized queue callouts.

---

## Cross-References

- [Database & RLS Policies](./database-and-rls.md)
- [Security Model & Route Guarding](./security-model.md)
- [Queue & State Transitions](./queue-and-state.md)
- [ADR 001: Next.js and FastAPI Service Split](../decisions/adr-001-nextjs-fastapi-split.md)
