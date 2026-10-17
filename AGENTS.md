# Antigravity Agent Guidelines & Operational Rules

Mandatory architectural rules, safety boundaries, and refactoring guidelines for the Heart Check PHC repository.

**Last Updated:** 2026-10-18

For selective context retrieval, domain architecture, and memory workflows, consult the second brain:
- **Master Index & Navigation:** [brain/INDEX.md](./brain/INDEX.md)
- **Active State & Branch Context:** [brain/CURRENT.md](./brain/CURRENT.md)
- **Memory Protocols:** [brain/WORKFLOWS.md](./brain/WORKFLOWS.md)

---

## Security-First Mandate

Security is the primary, non-negotiable priority across all architectural design, code generation, refactoring, and editing activities. Every written or edited line of code must undergo rigorous security verification prior to completion. Developers and agents must proactively evaluate every modification for data privacy compliance (RA 10173), authorization boundaries, input sanitization, rate limiting, and cost overrun prevention before writing or saving code.

---

## Core Operational Rules

### 1. High-Quality Documentation
- Every created or refactored file must include comprehensive file-level and symbol-level JSDoc comments (`@param`, `@returns`, `@remarks`).
- Explain architectural role, dependencies, and side effects. Maintain existing historical comments.

### 2. Strict Separation of Concerns (UI, Texts, Styles)
- UI components must only assemble presentation; never hardcode copy or inline style objects.
- **Copy:** Export all labels, titles, and messages from `<feature>Texts.ts`.
- **Styles:** Export all `CSSProperties`, dimensions, and color mappings from `<feature>.ts` or `<feature>Styles.ts`.
- Split monolithic files into single-responsibility subcomponents.

### 3. Constants Scope (Global vs Feature-Scoped)
- Place constants in root `constants/` **only** if shared across multiple disparate domains (e.g. `constants/colors.ts`, `constants/kiosk.ts`).
- Domain-specific constants, texts, and styles must live inside that feature's own `constants/` directory.

### 4. Reference Image Adherence
- Follow user-provided images and mockups as definitive ground truth. Replicate exact typography, alignment, and proportions. Do not invent alternate designs.

### 5. UI Presentation Preservation During Refactoring
- Code refactoring must strictly preserve exact pixel appearance and behavior. Never alter UI layout or styling unless explicitly requested by the user.

### 6. Zero Emojis Standard
- Emojis are strictly banned from all documentation (`.md`), code comments, JSDocs, commit messages, and UI strings. Use clean, plain-text formatting.

### 7. Terminal Command Permissions & Token-Saving Scans
- Lightweight, read-only search and scanning commands (ripgrep, grep, find, directory inspection, git log) are authorized to save context tokens.
- **Operational and state-altering commands (package manager, tests, linters, git commit/push, migrations) strictly require explicit user permission prior to execution.**

### 8. Maintain Developer Editing Guides ("Where to Edit" Maps)
- Every feature module (`app/kiosk/`, `app/nurse/`, `app/transfer/`, etc.) must maintain a dedicated `README.md` containing an explicit "Where to Edit" lookup table mapping copy, styles, logic, and types to specific files.

### 9. Kiosk UI Centering Standard
- All kiosk interactive contents, cards, and keypads must be centered vertically and horizontally between the top navigation and wave footer.
- The back button must be in-flow in `topNavWrapper` (never absolute/floating).
- Scroll containers and card grids must be centered (`m-auto flex flex-col items-center justify-center`).

### 10. Enterprise Navigation & High-Contrast Solid Surfaces
- Workstations (`/superadmin`, `/dashboard`, `/nurse`, `/transfer`) must use solid surfaces (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`) with 1px crisp borders. Blurry glassmorphism is prohibited.
- Maintain desktop left-rail navigation (`w-64`), live Manila clock (PST), breadcrumbs, and zero-hydration-flicker dual-theme support.

### 11. Prohibition of Text Ellipsis & Truncation
- Never use `truncate`, `text-ellipsis`, or `text-overflow: ellipsis` on medical or operational data (doctor names, ticket codes, room labels, service names). Text must wrap naturally (`break-words`, `whitespace-normal`).

### 12. Security-First Architecture & Mandatory Code Security Checks
Prioritize security above convenience or speed in every code write and edit. The following security checks are strictly enforced:
- **Continuous Security Review During Writing/Editing:** Every time code is created or modified, verify:
  1. Does this introduce an unauthenticated or under-authorized entry point?
  2. Does this expose sensitive patient data or system secrets?
  3. Can this input trigger SQL injection, command execution, or cross-site scripting?
  4. Can this endpoint be flooded to cause denial of service or spike external billing?
- **Service-Role & Secret Isolation:** The Supabase Service Role Key bypasses RLS and must NEVER be exposed to client bundles or `NEXT_PUBLIC_` variables. External provider keys (UniSMS, Deepgram, etc.) must remain server-side in environment variables only.
- **Server-Side Route Guarding & Defense-in-Depth:** Enforce authentication and role validation strictly on the server (`proxy.ts`, `requireUser`, `requireSuperadmin`, and Supabase RLS). Client-side checks and disabled UI buttons are purely cosmetic and must never be relied upon for security.
- **SQL & Command Injection Immunity:** Use parameterized SQL queries only (`$1`, `$2`); never concatenate raw strings into SQL statements. When constructing PostgREST search queries, sanitize input strings by stripping special filter syntax characters (`,`, `.`, `:`, `()`). Never use `child_process.exec()` or pass unvalidated input to shell subprocesses.
- **Rate Limiting, Cost Protection & Caching:** All public-facing endpoints, outbound SMS services (`app/actions/sendSMS.ts`), and external API proxies (such as Text-to-Speech `app/api/tts/route.ts`) must enforce sliding-window IP/session rate limits, duplicate dispatch cooldowns, and in-memory caching to prevent resource exhaustion and billing overruns.
- **Data Privacy & Encryption (RA 10173 Compliance):** Patient contact numbers must be encrypted using authenticated AES-256-GCM before database insertion. Mask phone numbers on all client screens (`0917 •••• 567`). Patient full names must never be broadcast across public TV monitors or exported in analytical research datasets.
- **Historical Data Immutability:** Operational mutations (`UPDATE`, `DELETE`) on `patients` must strictly exclude historical research records by conditioning on `is_historical = false` in both client SDK calls and PostgreSQL RESTRICTIVE RLS policies.
- **Cross-Service Resilience & Error Sanitization:** Enforce an explicit 10-second `AbortController` timeout on all cross-service HTTP calls between Next.js and FastAPI. Sanitize all backend error responses to strip raw tracebacks, internal database errors, and system paths.

### 13. Explicit Date Stamp Standard for Markdown Documentation
- Every created or updated Markdown document (`.md`) must include an explicit date stamp in ISO format (`YYYY-MM-DD`, e.g., `_Last updated: 2026-10-18 — ..._` or `**Last Updated:** 2026-10-18`).
- This standard applies strictly across all documentation files (`docs/`, `brain/`, `README.md`, module guides) to ensure clear temporal tracking across versions.

---

## Memory & Context Retrieval Protocol

1. **Selective Retrieval:** Never load the full `brain/` directory. Check [brain/CURRENT.md](./brain/CURRENT.md) and load only the specific note needed from [brain/INDEX.md](./brain/INDEX.md).
2. **Post-Task Updates:** Update `brain/CURRENT.md` with completed changes, add an ADR in `brain/decisions/` if architectural decisions were made, and log session handoffs in `brain/handoffs/`.

---

## Pre-Commit / Pre-Completion Checklist

- [ ] Security-first code review completed on all written or edited files before completion.
- [ ] No private secrets or service role keys are exposed to client code or `NEXT_PUBLIC_`.
- [ ] Server-side route guarding (`requireSuperadmin`, `requireUser`) and RLS policies protect all endpoints.
- [ ] SQL injection immunity verified: parameterized queries used, PostgREST filter delimiters sanitized.
- [ ] Rate limiting, abuse controls, and memory caching implemented on external proxies and outbound services.
- [ ] Patient PII encrypted with AES-256-GCM and masked on displays; zero patient names on public monitors.
- [ ] Database queries are parameterized; `is_historical = true` rows are protected across mutations.
- [ ] Cross-service calls between Next.js and FastAPI have 10-second timeouts; errors are sanitized.
- [ ] Every changed or created file has full file-level and symbol-level JSDoc comments.
- [ ] No raw text copy or inline style objects remain hardcoded in UI components.
- [ ] Text copy is exported from `<feature>Texts.ts`; styles from `<feature>.ts`.
- [ ] Global constants contain only system-wide tokens; feature constants remain local.
- [ ] User-provided reference images were faithfully matched.
- [ ] Zero unintended visual regressions were introduced during refactoring.
- [ ] Kiosk screens, scrollable containers, and card grids are centered.
- [ ] Solid surfaces and enterprise navigation standards are maintained.
- [ ] No emojis are used anywhere in documentation, code, or comments.
- [ ] No ellipsis or truncated text (`truncate`, `text-ellipsis`) exists on clinical data.
- [ ] Operational terminal commands received explicit user confirmation prior to execution.
- [ ] Developer guide markdown files (`README.md`) are updated with "Where to Edit" tables.
- [ ] Second brain notes (`brain/CURRENT.md`, `brain/handoffs/`) are updated after significant work.
- [ ] Updated or created Markdown documentation files include an explicit ISO date stamp (YYYY-MM-DD).
