# Antigravity Agent Guidelines & Operational Rules

Mandatory architectural rules, safety boundaries, and operational guidelines for the Heart Check PHC repository.

**Last Updated:** 2026-10-24

For high-level system specifications and architecture:
- **Master Index & Navigation:** [brain/INDEX.md](./brain/INDEX.md)
- **Active State:** [brain/CURRENT.md](./brain/CURRENT.md)

---

## Security-First Mandate

Security is non-negotiable across all code writes and edits:
1. **Patient Data Privacy (RA 10173):** Patient contact numbers must be encrypted with AES-256-GCM before database insertion. Mask phone numbers on client screens (`0917 •••• 567`). Patient full names must never be broadcast across public TV monitors or exported in analytical research datasets.
2. **Server-Side Route Guarding:** Enforce auth and role checks on the server (`proxy.ts`, `requireUser`, `requireSuperadmin`, and Supabase RLS). Client-side checks are cosmetic only.
3. **Service-Role Isolation:** The Supabase Service Role Key bypasses RLS and must NEVER be exposed to client bundles or `NEXT_PUBLIC_` variables.
4. **SQL Injection Immunity:** Use parameterized SQL queries only (`$1`, `$2`). Sanitize PostgREST search queries by stripping special filter characters (`,`, `.`, `:`, `()`).
5. **Rate Limiting & Abuse Prevention:** Outbound SMS actions (`sendSMS.ts`) and external proxies (`/api/tts`) must enforce rate limits and caching to prevent resource exhaustion and cost overruns.
6. **Historical Data Immutability:** Operational mutations (`UPDATE`, `DELETE`) on `patients` must condition on `is_historical = false` in both client SDK calls and PostgreSQL RESTRICTIVE RLS policies.

---

## Core Operational Rules (High-Speed & Accuracy)

### 1. Direct-to-Code Pipeline & Autonomous Search
- **Source Code is Ground Truth:** Go straight to the target source code. Do not perform pre-task reading rituals on `brain/` notes or `README.md` files for routine coding or bugfixes.
- **Autonomous Read-Only Searching:** The agent is fully authorized to autonomously search and view files using built-in read-only tools (`grep_search`, `view_file`, `list_dir`) without asking for user permission.
- **Explicit Permission for Shell Commands:** State-altering or operational terminal commands (`npm`, `git commit/push`, `build`, migrations) **strictly require explicit user confirmation prior to execution**.

### 2. Direct File Viewing (< 300 Lines) for Zero Delusions
- **Files Under 300 Lines:** Always view the complete file directly. Having full visibility of imports, state hooks, props, and JSX closing tags guarantees first-try edit accuracy with `replace_file_content` and eliminates hallucinated variables or syntax errors.
- **Files Over 300 Lines:** Scope searches using targeted `grep_search` and inspect line-sliced views around the specific function or component. Never dump entire 1,000+ line files into context.

### 3. Single-Point-of-Change (No Artificial Cascades)
- For routine bugfixes, localized styling adjustments, or component fixes, edit the target file directly.
- Do not force multi-file cascading edits across `Texts.ts`, `Styles.ts`, `README.md`, and `CURRENT.md` for simple 1-line or localized changes.
- Modular separation of concerns (`Texts.ts`, `Styles.ts`) applies when scaffolding new major features or full-page modules.

### 4. Prohibition of Text Ellipsis & Truncation
- Never use `truncate`, `text-ellipsis`, or `text-overflow: ellipsis` on medical or operational data (doctor names, ticket codes, room labels, service names). Text must wrap naturally (`break-words`, `whitespace-normal`).

### 5. Reference Image Adherence & UI Preservation
- Follow user-provided images and mockups as definitive ground truth. Replicate exact typography, alignment, and proportions without inventing alternate designs.
- Code refactoring must strictly preserve exact pixel appearance and behavior unless UI changes are explicitly requested.

### 6. Enterprise Solid Surfaces Standard
- Workstations (`/superadmin`, `/dashboard`, `/nurse`, `/transfer`) must use solid surfaces (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`) with 1px crisp borders. Blurry glassmorphism is prohibited.
- Kiosk interactive contents, cards, and keypads must be centered vertically and horizontally.

### 7. Zero Emojis Standard
- Emojis are strictly banned from all documentation (`.md`), code comments, JSDocs, commit messages, and UI strings. Use clean, plain-text formatting.

### 8. High-Quality Documentation
- Every created or refactored file must include clean file-level and symbol-level JSDoc comments (`@param`, `@returns`, `@remarks`). Maintain existing historical comments.

---

## Pre-Completion Checklist

- [ ] Security reviewed: AES-256 encryption, server route guards, parameterized SQL, and RLS verified.
- [ ] No private secrets or service role keys exposed in client bundles.
- [ ] No text ellipsis (`truncate`, `text-ellipsis`) on clinical data.
- [ ] User reference images were faithfully matched (if applicable).
- [ ] Zero unintended visual regressions introduced.
- [ ] Solid surfaces and enterprise navigation standards preserved.
- [ ] No emojis used anywhere in documentation, code, or comments.
- [ ] Operational shell commands received explicit user confirmation prior to execution.
