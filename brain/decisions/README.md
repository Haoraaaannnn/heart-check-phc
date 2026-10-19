# Architecture Decision Records (ADRs)

**Last Updated:** 2026-10-18

This directory stores Architecture Decision Records (ADRs) documenting technical and architectural decisions with lasting consequences for Heart Check PHC.

---

## What Belongs Here

Record an ADR only when making a structural choice that:
1. Has lasting architectural consequences across subsystems.
2. Involves trade-offs where multiple viable alternatives were evaluated.
3. Establishes a binding convention, safety invariant, or system boundary.

**Do NOT record ADRs for:**
- Routine bug fixes or syntax adjustments.
- Routine UI copy or styling updates.
- Minor local refactorings contained within a single file.

---

## Standard ADR Structure

When creating a new ADR, use the naming format `adr-XXX-short-title.md` and include:

- **Title:** `ADR XXX: Short Descriptive Title`
- **Status:** `Proposed`, `Accepted`, `Superseded by ADR YYY`, or `Deprecated`
- **Context:** The operational, clinical, or technical situation and alternatives considered.
- **Decision:** The chosen architecture, technology, or convention and why it was selected.
- **Consequences:** Positive outcomes, negative trade-offs, and mitigation strategies.

---

## Index of Recorded Decisions

| ADR | Title | Summary & Primary Rationale |
| :--- | :--- | :--- |
| [ADR 001](./adr-001-nextjs-fastapi-split.md) | Next.js and FastAPI Service Split | Decouples interactive Next.js clinical UI from compute-heavy Python forecasting/SimPy analytics. |
| [ADR 002](./adr-002-fifo-queue-lock.md) | Strict FIFO Queue Lock Discipline | Enforces strict chronological queueing; only the top patient ticket can be called or assigned. |
| [ADR 003](./adr-003-supabase-realtime-rls.md) | Supabase Realtime with Row-Level Security | Combines WebSocket live broadcasts with database-level PostgreSQL RLS data isolation. |
| [ADR 004](./adr-004-no-text-truncation.md) | Prohibition of Text Ellipsis on Clinical Data | Strictly bans ellipsis truncation on patient identifiers, doctor names, and clinic rooms to prevent medical error. |
| [ADR 005](./adr-005-solid-clinical-surfaces.md) | High-Contrast Solid Clinical Surfaces | Prohibits blurred glassmorphism on staff stations to ensure readability under hospital lighting. |
