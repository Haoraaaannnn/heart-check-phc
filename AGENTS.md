# Antigravity Agent Guidelines & Operational Rules

Mandatory architectural rules, safety boundaries, and operational guidelines for the Heart Check PHC repository.

**Last Updated:** 2026-10-25

For high-level system specifications and architecture:
- **Master Index & Navigation:** [brain/INDEX.md](./brain/INDEX.md)
- **Active State:** [brain/CURRENT.md](./brain/CURRENT.md)

---

## Security-First Mandate

Security is non-negotiable across all code writes and edits:
1. **Patient Data Privacy (RA 10173):** Patient contact numbers must be encrypted with AES-256-GCM before database insertion. Mask phone numbers on client screens (`0917 •••• 567`). Patient full names must never be broadcast across public TV monitors or exported in analytical research datasets.
2. **Server-Side Route Guarding:** Enforce auth and role checks on the server (`proxy.ts`, `requireUser`, `requireSuperadmin`, and Supabase RLS). Client-side checks are cosmetic only.
3. **Service-Role Isolation:** The Supabase Service Role Key bypasses RLS and must NEVER be exposed to client bundles or `NEXT_PUBLIC_` variables.
4. **SQL & Query Injection Immunity:** Use parameterized SQL queries only (`$1`, `$2`). Sanitize PostgREST search queries by stripping special filter characters (`,`, `.`, `:`, `()`).
5. **Rate Limiting & Abuse Prevention:** Outbound SMS actions (`sendSMS.ts`) and external proxies (`/api/tts`) must enforce rate limits and caching to prevent resource exhaustion and cost overruns.
6. **Historical Data Immutability:** Operational mutations (`UPDATE`, `DELETE`) on `patients` must condition on `is_historical = false` in both client SDK calls and PostgreSQL RESTRICTIVE RLS policies.
7. **PII and Secret Redaction in Logs:** Never log raw patient PII, unmasked phone numbers, auth credentials, or session tokens to console logs or error trackers. Redact before outputting diagnostics.
8. **Path Traversal Immunity:** Validate and canonicalize all file paths against directory traversal (`..`) when handling filesystem, uploads, or dynamic module loading.

---

## Code Quality, Readability & Type Safety Standards

1. **Strict TypeScript & Zero Unsafe Assertions:** Prohibit `any`, blind `as` casting, and `!` non-null assertions on nullable database/API fields. Parse external inputs (API request bodies, query params, Supabase outputs) from `unknown` using runtime type guards or Zod schemas.
2. **Guard Clauses & Maximum 3 Nesting Levels:** Flatten nested control flow (`if/else`, loops, try/catch) using early returns and guard clauses. Nesting must not exceed 3 levels.
3. **Complexity Limits & Component Decomposition:**
   - Production files target <= 250 lines (maximum 350 lines); functions target <= 40 lines (maximum 60 lines).
   - Functions with more than 3 parameters must use a single typed options object.
   - **Thin Orchestrator Pattern:** React pages must not bundle all state, realtime effects, and UI in one file. Decompose into custom hooks (`hooks/`), focused subcomponents (`components/`), and pure domain utilities (see `/dashboard` and `/superadmin` as reference implementations).
   - **Legacy Monolith Rule:** Do NOT execute unprompted, sweeping rewrites on working legacy files exceeding 350 lines (such as `app/transfer/page.tsx`) during routine bugfixes. Extract subcomponents and hooks progressively only when a scoped task directly alters that feature.
4. **Explicit Units & Descriptive Naming:** Identifiers representing quantities or time must include units (`timeoutMs`, `intervalMs`, `retryCount`, `maxBytes`). Avoid vague, cryptic, or single-letter names.
5. **Deterministic Pure Core:** Separate domain rules (queue sorting, status transitions, triage scoring) from side effects. Keep core logic pure and deterministic; inject clocks (`Date.now`), random generators, and network/DB I/O at caller boundaries.
6. **Explicit Discriminated Outcomes:** Never swallow exceptions or return ambiguous empty success on failure. Use typed discriminated unions (`{ ok: true, data } | { ok: false, error }`) or throw descriptive, typed domain errors.
7. **Testing & Verification Discipline:** Never weaken, skip, or delete failing tests or TypeScript checks to pass a build. Fix the underlying root cause. Assert observable behavior and contract invariants rather than brittle internal call sequences.

---

## Core Operational Rules (High-Speed & Accuracy)

### 1. Absolute File Scope Boundary: Never Touch or Change Files Unless Explicitly Stated
- **Zero Unprompted File Modifications:** The agent must NEVER touch, edit, refactor, reorganize, create, or delete ANY file unless that specific file is explicitly named, targeted, or directly required by the user prompt.
- **Strict Prohibition of Unprompted Cascades:** Never perform unsolicited code cleanups, speculative refactors, prop removals, or "helpful" adjustments across peripheral, parent, child, or sibling components. If the user asks for a fix in `ComponentA`, touch ONLY `ComponentA`. Touching `ComponentB`, `ServiceBoard`, `ConsultationFlow`, `styles`, or any other file without an explicit instruction is a strict violation.
- **Single-Point-of-Change:** Every routine bugfix, localized layout adjustment, or component update must be executed entirely within the single target file directly. Do not propagate edits across constants dictionaries (`Texts.ts`, `Styles.ts`), documentation (`README.md`, `CURRENT.md`), or neighboring files unless explicitly requested.

### 2. Direct-to-Code Pipeline & Autonomous Search
- **Source Code is Ground Truth:** Go straight to the target source code. Do not perform pre-task reading rituals on `brain/` notes or `README.md` files for routine coding or bugfixes.
- **Autonomous Read-Only Searching:** The agent is fully authorized to autonomously search and view files using built-in read-only tools (`grep_search`, `view_file`, `list_dir`) without asking for user permission.
- **Explicit Permission for Shell Commands:** State-altering or operational terminal commands (`npm`, `git commit/push`, `build`, migrations) **strictly require explicit user confirmation prior to execution**.

### 3. Direct File Viewing (< 300 Lines) for Zero Delusions
- **Files Under 300 Lines:** Always view the complete file directly. Having full visibility of imports, state hooks, props, and JSX closing tags guarantees first-try edit accuracy with `replace_file_content` and eliminates hallucinated variables or syntax errors.
- **Files Over 300 Lines:** Scope searches using targeted `grep_search` and inspect line-sliced views around the specific function or component. Never dump entire 1,000+ line files into context.

### 4. Text Readability & Layout Preservation Standard (No Compression, No Squeezing, No Vertical Character Wrapping)
- **Zero Squeezing or Compression:** All text, numbers, labels, badges, and headers across every workstation, dialog, card, and modal must be immediately legible and visually balanced. Never allow containers, flex items, or grid tracks to compress or squeeze text into narrow vertical slivers or awkward single-character wraps (such as letters stacking vertically).
- **Enforce Dedicated Minimum Widths:** Multi-column layouts (dialogs, inspector panes, sidebar rosters, split views) must declare explicit minimum widths and non-shrinking dimensions (e.g. `w-[340px] shrink-0` for lists, `flex-1 min-w-0` for detail panes). Never rely on fragile 12-column grid tracks that can collapse contents into microscopic columns.
- **Protected Identifiers & Single-Line Labels:** Ticket codes (`font-mono font-black whitespace-nowrap`), timestamps, counter badges, room numbers, action button titles, and stage milestone captions must specify `whitespace-nowrap` so they remain intact on a single clean line.
- **Prohibition of Text Ellipsis on Clinical Data:** Never use `truncate`, `text-ellipsis`, or `text-overflow: ellipsis` on medical or operational data (doctor names, ticket codes, room labels, service names). Containers must be sized generously to display the complete label naturally without clipping or compression.

### 5. Reference Image Adherence & UI Preservation
- Follow user-provided images and mockups as definitive ground truth. Replicate exact typography, alignment, and proportions without inventing alternate designs.
- Code refactoring must strictly preserve exact pixel appearance and behavior unless UI changes are explicitly requested.

### 6. Enterprise Solid Surfaces Standard
- Workstations (`/superadmin`, `/dashboard`, `/nurse`, `/transfer`) must use solid surfaces (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`) with 1px crisp borders. Blurry glassmorphism is prohibited.
- Kiosk interactive contents, cards, and keypads must be centered vertically and horizontally.
- Neon or glowing saturated pill/background accents are prohibited across the entire system. Badges, chips, and pills must use subdued, enterprise solid fills or subtle tonal borders.
- **Prohibition of Decorative Header Icon Boxes:** Never place decorative rounded or square colored icon boxes (e.g. `w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center`) next to titles, dialog headers, modal tops, or workstation banners. Modal and section headers must rely on clean, typographic hierarchy with a bold title (`text-base font-bold text-slate-900 dark:text-[#f5f5f5]`) and optional descriptive subtitle (`text-xs text-slate-500 dark:text-[#888888]`) directly flush without decorative icon wrappers.

### 7. Zero Emojis Standard
- Emojis are strictly banned from all documentation (`.md`), code comments, JSDocs, commit messages, and UI strings. Use clean, plain-text formatting.

### 8. High-Quality Documentation
- Every created or refactored file must include clean file-level and symbol-level JSDoc comments (`@param`, `@returns`, `@remarks`). Maintain existing historical comments.

### 9. Public TV Monitor Display Standards (Zero Dark Mode, Zero-Scroll TV Viewport, Maximum Queue Scale)
- **Zero Dark Mode:** All public waiting room TV monitors (`app/monitor/*`) must strictly render in institutional light mode (`bg-slate-50`, `bg-white`, `#cc3535`). Dark mode is strictly prohibited on all TV displays.
- **Strict Zero-Scroll TV Lock:** Public TV monitors are wall-mounted displays without mouse or touch navigation. All monitor pages, registration windows, paired cubicles, and table rosters must strictly fit 100% within the viewport (`h-screen w-screen overflow-hidden`) with zero vertical or horizontal scrollbars across Full HD (1080p), 4K, and 720p screens.
- **Maximum Queue Number Scale:** The patient queue number is the primary operational data point. Queue numbers must be rendered as big as possible (`font-black tabular-nums tracking-tight leading-none`, scaling up to `text-9xl` through `text-[11rem]`), maximizing card space without overflow or wrapping.
- **Active Calling Highlight & Next Queue Clarity:** Stations actively calling patients must feature high-visibility visual highlights (alert badge, animated ring pulse). Upcoming tickets must be unmistakably identified with dedicated "NEXT IN QUEUE" badges and enlarged numbers so patients immediately know who is calling and who is next in line.

---

## Pre-Completion Checklist

- [ ] Security reviewed: AES-256 encryption, server route guards, parameterized SQL, RLS, log redaction, and path traversal defense verified.
- [ ] Strict TypeScript checked: zero `any`, no blind `as` casts, no unvalidated `!` non-null assertions.
- [ ] Guard clauses applied, nesting <= 3 levels, and explicit units used on durations/counts.
- [ ] Errors handled with explicit typed outcomes; no swallowed exceptions.
- [ ] No tests or type checks weakened or deleted.
- [ ] No private secrets or service role keys exposed in client bundles.
- [ ] No text ellipsis (`truncate`, `text-ellipsis`) on clinical data.
- [ ] Text readability and layout preservation verified: zero compressed vertical text slivers, minimum widths enforced, no vertical character wrapping, and whitespace-nowrap used on ticket codes, numbers, and milestone badges.
- [ ] Public TV monitors enforce zero dark mode, zero scrollbars, maximum queue number scale, and active calling highlights.
- [ ] User reference images were faithfully matched (if applicable).
- [ ] Zero unintended visual regressions introduced.
- [ ] Solid surfaces and enterprise navigation standards preserved.
- [ ] No decorative header icon boxes or rounded colored icon wrapper tiles in dialog or section titles.
- [ ] Absolute file scope boundary verified: ZERO unprompted files touched or modified. Only files explicitly stated or directly targeted in the user prompt were changed.
- [ ] No emojis used anywhere in documentation, code, or comments.
- [ ] Operational shell commands received explicit user confirmation prior to execution.

