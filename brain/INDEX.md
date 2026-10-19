# Heart Check PHC — Second Brain Index

**Last Updated:** 2026-10-19

Welcome to the repository-local second brain for **Heart Check PHC**. This directory functions as a token-efficient, portable knowledge repository designed to work seamlessly with AI coding agents (Antigravity), terminal workflows, and local Markdown tools (Obsidian, GitHub).

All files use standard relative Markdown links for universal portability.

---

## Selective Context Retrieval Protocol

To minimize context window saturation and token consumption:
1. **Classify the task:** Simple, nontrivial, or architecture/debugging-sensitive.
2. **Simple tasks:** Avoid loading the second brain unless specifically needed.
3. **Nontrivial tasks:** Read this file (`INDEX.md`) first, then load **only** the specific linked note relevant to the task.
4. **Targeted search:** Use `rg` or targeted search if this index does not directly point to the needed detail.
5. **Verify against code:** Always verify brain notes against active source code before making changes; brain notes provide context, not ground truth.
6. **Update discipline:** Before finishing, update only knowledge that is new, verified, reusable, and likely to matter again. Do not update notes merely because a task was completed.
7. **Index maintenance:** Update this `INDEX.md` whenever a knowledge file is added, renamed, or removed.
8. **Output discipline:** Summarize only important outcomes; avoid dumping large command outputs or entire files.

---

## Core System Status & Workflows

| Document | When to Consult |
| :--- | :--- |
| [Current State & Active Tasks](./CURRENT.md) | Consult before starting work to check active branch, current milestones, blockers, and next steps. |
| [Active Session Log](./SESSION_LOG.md) | Consult or update during ongoing multi-step sessions to record decisions, checks, and handoff state. |
| [Project Profile & Constraints](./PROJECT.md) | Consult for verified tech stack versions, major architectural constraints, and verified CLI commands. |
| [Memory Workflows & Protocol](./WORKFLOWS.md) | Consult for detailed before-task ingestion and after-task persistence workflows. |

---

## Knowledge Map of Content

### 1. System Architecture ([`architecture/README.md`](./architecture/README.md))
- [System Architecture Overview](./architecture/overview.md) — Consult for full-stack topology, Next.js route mapping, and inter-service contracts.
- [Database & RLS Policies](./architecture/database-and-rls.md) — Consult for PostgreSQL schemas, active RLS policies, phone number encryption, and historical data immutability.
- [Security Model & Route Guarding](./architecture/security-model.md) — Consult for server-side route guards (`requireSuperadmin`, `requireUser`), service-role isolation, and rate-limiting.
- [Queue & State Transitions](./architecture/queue-and-state.md) — Consult for strict FIFO lock discipline, queue transitions, and room counter synchronization.
- [Network & Real-Time Resilience](./architecture/network-resilience.md) — Consult for WebSocket reconnects, offline outbox, debounce, and hysteresis safeguards.

### 2. Architecture Decision Records ([`decisions/README.md`](./decisions/README.md))
- [ADR 001: Next.js and FastAPI Service Split](./decisions/adr-001-nextjs-fastapi-split.md) — Decoupled UI from scientific/analytical processing.
- [ADR 002: Strict FIFO Queue Lock Discipline](./decisions/adr-002-fifo-queue-lock.md) — Mandatory chronological queueing at triage desk.
- [ADR 003: Supabase Realtime with Row-Level Security](./decisions/adr-003-supabase-realtime-rls.md) — Live WebSocket updates secured by database RLS.
- [ADR 004: Prohibition of Text Ellipsis on Clinical Data](./decisions/adr-004-no-text-truncation.md) — Strict ban on text truncation for medical safety.
- [ADR 005: High-Contrast Solid Clinical Surfaces](./decisions/adr-005-solid-clinical-surfaces.md) — High-contrast clinical UI without blurred glassmorphism.

### 3. Domain Knowledge & Conventions ([`knowledge/README.md`](./knowledge/README.md))
- [PHC OPD Operational Workflow](./knowledge/phc-opd-workflow.md) — Consult for OPD five-stage patient journey, triage routing, and clinical caps.
- [Self-Service Kiosk & Thermal Printing](./knowledge/kiosk-and-printing.md) — Consult for touchscreen check-in flow, thermal receipt format, and ESC/POS commands.
- [Nurse Station & Consultation Kanban](./knowledge/nurse-and-kanban.md) — Consult for 3-column Kanban, optimistic state updates, and Web Speech TTS.
- [Analytics Engine & ML Models](./knowledge/analytics-and-ml.md) — Consult for queue forecasting algorithms, MAE model selection, M/M/1 queuing models, and Little's Law.
- [Data Pipelines & Excel Ingestion](./knowledge/data-pipelines.md) — Consult for historical PHC Excel workbook parsing, AM/PM heuristics, and timezone normalization.

### 4. Debugging & Troubleshooting ([`debugging/README.md`](./debugging/README.md))
- [Common System Issues](./debugging/common-issues.md) — Consult for thermal printer timeouts, Supabase RLS recursion, CORS errors, and WebSocket drops.
- [Database Troubleshooting](./debugging/database-troubleshooting.md) — Consult for PostgreSQL RLS verification, phone encryption debugging, and migration rollouts.
- [Simulation Execution Guide](./debugging/simulation-guide.md) — Consult for Chapter 4 SimPy simulation debugging, baseline reproduction, and parameter adjustment.

### 5. Historical Handoffs Archive ([`handoffs/`](./handoffs/))
- [Handoff Template](./handoffs/template.md) — Standard structure for recording major multi-session milestones.
- Consult directory for archived session notes (`2026-10-15` through `2026-10-17`).

---

## Master Documentation Portal

For extended specifications, QA checklists, simulation methodology notes, and reports:
- [Master Documentation Portal (`docs/README.md`)](../docs/README.md)
- [Master Design & Layout Standards (`docs/specifications/DESIGN.md`)](../docs/specifications/DESIGN.md)
- [Quality Assurance & Security Checklists (`docs/checklists/README.md`)](../docs/checklists/README.md)
- [Technical Specifications (`docs/specifications/README.md`)](../docs/specifications/README.md)
- [Capstone Simulation Guides (`docs/simulation/README.md`)](../docs/simulation/README.md)
- [Validation Reports (`docs/reports/README.md`)](../docs/reports/README.md)
