# Architecture Decision Records (ADRs)

**Last Updated:** 2026-10-24

This directory stores Architecture Decision Records (ADRs) documenting technical and architectural decisions with lasting consequences for Heart Check PHC.

---

## Index of Recorded Decisions

| ADR | Title | Summary & Primary Rationale |
| :--- | :--- | :--- |
| [ADR 001](./adr-001-nextjs-fastapi-split.md) | Next.js and FastAPI Service Split | Decouples interactive Next.js clinical UI from compute-heavy Python forecasting/SimPy analytics. |
| [ADR 002](./adr-002-fifo-queue-lock.md) | Strict FIFO Queue Lock Discipline | Enforces strict chronological queueing; only the top patient ticket can be called or assigned. |
| [ADR 003](./adr-003-supabase-realtime-rls.md) | Supabase Realtime with Row-Level Security | Combines WebSocket live broadcasts with database-level PostgreSQL RLS data isolation. |

> [!NOTE]
> All visual design, layout standards, surface contrast, and clinical copy truncation standards are authoritative in [docs/specifications/DESIGN.md](../../docs/specifications/DESIGN.md).
