# Architecture Directory Index

**Last Updated:** 2026-10-18

This directory documents the structural design, data flow, security model, and component interactions of the Heart Check PHC queue management and analytics system.

---

## Architecture Topology & Major Modules

The system operates across three decoupled layers:

1. **Frontend Presentation & Real-Time Orchestration (`app/`)**
   - Built with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS.
   - Clinical touchpoints:
     - `/kiosk`: Self-service patient check-in and thermal ticket issuance.
     - `/transfer`: Triage desk queue management enforcing strict FIFO locking.
     - `/nurse`: Consultation cubicle Kanban (Waiting, Active, Completed).
     - `/monitor`: Public waiting room queue roster with voice chime gates.
     - `/dashboard`: Four-tier clinical analytics portal using Recharts.
     - `/superadmin`: Role-based configuration, cubicle assignments, and queue prefix customization.

2. **Backend Scientific & Analytics Engine (`python_backend/`)**
   - Built with FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, Statsmodels, and SimPy.
   - Provides stateless REST endpoints for queue forecasting, M/M/1 queuing equations, discrete-event consultation simulation, and Excel report parsing.
   - Connected to Next.js via internal HTTP endpoints with a 10-second `AbortController` timeout.

3. **Data Layer & Real-Time State (`supabase/`)**
   - Managed Supabase PostgreSQL 15 database with Supabase Realtime channels.
   - Enforces PostgreSQL Row-Level Security (RLS) policies, AES-256-GCM patient phone number encryption, and RESTRICTIVE immutability policies on historical research records.

---

## Architecture Notes Map

Consult the following focused documents for deep architectural specifications:

| Document | When to Consult |
| :--- | :--- |
| [System Architecture Overview](./overview.md) | High-level full-stack architecture, route topology, inter-service contracts, and build setup. |
| [Database & RLS Policies](./database-and-rls.md) | Table schemas, active PostgreSQL RLS rules, phone encryption (AES-256-GCM), and historical data immutability. |
| [Security Model & Route Guarding](./security-model.md) | Server-side route guards (`proxy.ts`, `requireUser`, `requireSuperadmin`), service-role isolation, and rate-limiting controls. |
| [Queue & State Transitions](./queue-and-state.md) | FIFO queue lock mechanics, drag-and-drop pointer discipline, status state machines, and counter assignments. |
| [Network & Real-Time Resilience](./network-resilience.md) | Real-time WebSocket reconnection strategies, offline IndexedDB outbox, 300ms debounce, and 2-second hysteresis safeguards. |

---

## Guidelines for Architecture Updates

- **Do Not Duplicate:** Keep architectural specifications focused on design and contracts; reference source code for implementation details.
- **Record Lasting Changes:** When modifying subsystem contracts, data schemas, or network resilience rules, update the corresponding topic note above and log an Architecture Decision Record in [../decisions/](../decisions/README.md).
