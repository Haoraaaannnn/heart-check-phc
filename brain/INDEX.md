# Heart Check PHC — Master Index

**Last Updated:** 2026-10-24

This index provides direct navigation to the authoritative technical specifications, architecture decision records, and active state tracking for **Heart Check PHC**.

---

## 1. Active State & Operational Rules

| Document | Purpose |
| :--- | :--- |
| [Current State & Active Tasks](./CURRENT.md) | Active git branch, current milestones, blockers, and next steps. |
| [Operational Guidelines & Rules](../AGENTS.md) | Mandatory architectural rules, security boundaries, and coding standards. |

---

## 2. Authoritative Technical Specifications (`docs/specifications/`)

The single source of truth for system implementation:

| Domain | Specification Document |
| :--- | :--- |
| **Visual Design & UI Standards** | [docs/specifications/DESIGN.md](../docs/specifications/DESIGN.md) — Master design system, colors, surfaces, typography, separation of concerns. |
| **Product Requirements (PRD)** | [docs/specifications/PRD.md](../docs/specifications/PRD.md) — Core problem statement, OPD objectives, roles, and scope boundaries. |
| **System Architecture** | [docs/specifications/ARCHITECTURE.md](../docs/specifications/ARCHITECTURE.md) — Full-stack topology, Next.js route mapping, inter-service contracts. |
| **Database & RLS Policies** | [docs/specifications/DATABASE_SCHEMA.md](../docs/specifications/DATABASE_SCHEMA.md) — PostgreSQL schemas, active RLS policies, phone encryption. |
| **Security Architecture** | [docs/specifications/SECURITY.md](../docs/specifications/SECURITY.md) — Server-side route guards, service-role isolation, rate-limiting. |
| **Network & Resilience** | [docs/specifications/CONNECTIVITY_RESILIENCE.md](../docs/specifications/CONNECTIVITY_RESILIENCE.md) — WebSocket reconnects, offline outbox, retry logic. |
| **Hardware Thermal Printing** | [docs/specifications/PRINTER_SETUP_GUIDE.md](../docs/specifications/PRINTER_SETUP_GUIDE.md) — WebUSB, ESC/POS parsing, Linux udev rules, network printer. |
| **Estimated Wait Time (EWT)** | [docs/specifications/ESTIMATED_WAIT_TIME.md](../docs/specifications/ESTIMATED_WAIT_TIME.md) — Hybrid calculation engine, ticket printing, SMS dispatch. |
| **Nurse & Kanban Station** | [docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md](../docs/specifications/NURSE_DASHBOARD_SYSTEM_DESIGN.md) — Cubicle progression, Kanban state, TTS callouts. |
| **Transfer Triage Hub** | [docs/specifications/TRANSFER_DASHBOARD.md](../docs/specifications/TRANSFER_DASHBOARD.md) — Pointer drag-and-drop, strict FIFO lock, room assignment. |

---

## 3. Architecture Decision Records (`brain/decisions/`)

Foundational architectural rationale:

- [ADR 001: Next.js and FastAPI Service Split](./decisions/adr-001-nextjs-fastapi-split.md) — Decoupled UI from scientific/analytical processing.
- [ADR 002: Strict FIFO Queue Lock Discipline](./decisions/adr-002-fifo-queue-lock.md) — Mandatory chronological queueing at triage desk.
- [ADR 003: Supabase Realtime with Row-Level Security](./decisions/adr-003-supabase-realtime-rls.md) — Live WebSocket updates secured by database RLS.

---

## 4. Quality Assurance, Simulation & Reports

- **Checklists & Audits:** [docs/checklists/](../docs/checklists/README.md) — UAT matrices, security checklists, and role-based questionnaires.
- **Simulation Guides:** [docs/simulation/](../docs/simulation/README.md) — Chapter 4 SimPy simulation notebooks and reproduction guides.
- **Validation Reports:** [docs/reports/](../docs/reports/README.md) — Machine learning model evaluations and data validation summaries.
