# Antigravity Agent Guidelines & Refactoring Rules

This document outlines the mandatory rules and architectural standards that the agent must strictly follow when working in the Heart Check PHC repository.

---

## Core Rules

### 1. Refactor Code Alongside Comprehensive Documentation
- Every refactored or newly created file must include comprehensive, high-quality documentation.
- **File-level JSDoc:** Explain the file's architectural purpose, role in the overall system, and key dependencies.
- **Symbol-level JSDoc:** Document every component, hook, utility function, prop interface, type definition, and exported constant.
- Explain parameter types (`@param`), return types (`@returns`), exceptions/side effects, and design considerations (`@remarks`).
- Maintain existing comments and historical documentation unless explicitly directed to replace them.

---

### 2. Strict Separation of Concerns (UI, Texts, Styles & Properties)
- **UI component files must only assemble and render:** They should not contain hardcoded text copy, raw styling objects, or ad-hoc configurations.
- **Dedicated Text Files (`<feature>Texts.ts`):**
  - All labels, descriptions, placeholders, button text, modal titles, and error messages must be defined in a dedicated text file within that feature's `constants/` folder.
  - Components must import and consume text from these text files.
- **Dedicated Style & Property Dictionaries (`<feature>.ts`):**
  - All inline style objects (`CSSProperties`), responsive dimension tokens, layout configs, and color maps must be defined in a dedicated constants file (following the pattern of `KioskBanner.ts` / `KioskHeader.ts`).
  - Components consume these via imported style objects (e.g. `style={FeatureStyle.container}`).
- **Modular Component Breakdown:** Large monolithic components must be split into single-responsibility subcomponents (e.g., header, card, action buttons, modals).

---

### 3. Constants Scope: Global vs. Feature-Scoped
- **Global Constants (`/constants/`):**
  - Placed in the project's root `constants/` directory **only** if they are truly reused across multiple disparate domains/features (e.g., `themeColors` in `constants/colors.ts`, typography scale in `constants/kiosk.ts`).
  - Do NOT place domain-specific or feature-specific texts/styles in the root constants.
- **Feature-Scoped Constants (`app/<feature>/constants/` or `app/<area>/<feature>/constants/`):**
  - All constants, texts, and styling configurations specific to a feature, route, or module must live strictly within that feature's own `constants/` folder.

---

### 4. Strict Adherence to User-Provided Reference Images
- When the user provides an image, mockup, wireframe, or screenshot:
  - **Follow the provided image as the definitive source of truth.**
  - **Do NOT create your own design interpretations, alter layout positions, or invent alternate layouts.**
  - Replicate typography, colors, button placement, proportions, and visual hierarchy directly from the provided image.

---

### 5. UI & Presentation Preservation During Refactoring
- **Refactoring must preserve the exact visual appearance and behavior:**
  - When asked to refactor code, clean up architecture, or decouple files, **the agent shall NOT redesign, restyle, or modify any UI presentation or user experience** unless the user explicitly asks for UI changes.
  - The UI output before and after refactoring must remain identical and pixel-faithful.
  - Refactoring focus is strictly on code quality, separation of concerns, modularity, maintainability, type safety, and documentation.

---

### 6. No Emojis in Documentation, Code, or System Files
- Emojis must NEVER be used in documentation files (`.md`), code comments, JSDoc annotations, commit messages, or UI copy.
- All documentation, headings, tables, and lists must use clean, professional, plain-text formatting.

---

### 7. Terminal Command Execution & Token-Saving Scans
- **Token-Saving Search & Scanning Permitted:** The agent is authorized and encouraged to execute lightweight, read-only commands and tools that streamline repository exploration and save context tokens (such as ripgrep/grep searches, file scanning, directory inspection, file finding, log tailing, and read-only diagnostic checks). Using targeted scanning commands avoids reading unnecessary large files into context, saving tokens and speeding up analysis.
- **Explicit User Permission Required for Executing Operational Commands:** The agent can execute terminal commands (such as package manager operations, linters like ESLint, build validations, tests, migrations, git commands, and process management), **ONLY AFTER requesting and receiving explicit permission from the user**.
- **Always Ask First:** The agent must never run unconfirmed operational or state-altering terminal commands autonomously. Always state the exact command line string and its intended purpose, then wait for explicit user confirmation before executing it.

---

### 8. Always Provide and Maintain Developer Editing Guides ("Where to Edit" Markdown Files)
- Every major domain, feature module, or subsystem folder (such as `app/kiosk/`, `app/nurse/`, `app/monitor/`, `app/superadmin/`, etc.) must include and maintain a dedicated, clear developer guide (`README.md` or dedicated `.md` guide file).
- **Create New Markdown Files When Necessary:** If a new page, feature folder, sub-route, or major subsystem is created or refactored, the agent must proactively assess whether a new `.md` file is needed to ensure developers can easily navigate the folder structure and understand how to make modifications.
- **Continuous Documentation Updates:** Whenever a module, feature folder, component, or constants file is refactored, restructured, expanded, or modified, the corresponding `.md` guide must be updated simultaneously so developers always have an accurate, unambiguous reference on where to make changes without guessing.
- **Mandatory "Where to Edit" Mapping:** Every guide must provide an explicit, exhaustive lookup table showing developers exactly where to edit for every type of change:
  - **Where to edit text copy, labels, and placeholders:** Direct links/paths to `<component>Texts.ts`.
  - **Where to edit visual styles, dimensions, and colors:** Direct links/paths to `<component>.ts` (inline `CSSProperties` and design tokens).
  - **Where to edit centralized typography and global scales:** Direct links/paths to root `constants/` (e.g. `constants/kiosk.ts` for kiosk typography, `constants/colors.ts` for theme colors).
  - **Where to edit layout structures and responsive rules:** Direct links/paths to `<feature>Layout.ts` or layout components.
  - **Where to edit interactive logic, timers, and routing:** Direct links/paths to hooks (`hooks/`), context providers (`context/`), or component handlers.
  - **Where to edit types and contracts:** Direct links/paths to `types/` or database schemas.

---

### 9. Kiosk UI Centering Standard & Non-Overflow Navigation
- **All page content must ALWAYS be centered in the page:** Every screen's interactive contents, banners, card grids, instructions, and numeric keypads must be vertically and horizontally centered in `<main>` between the top navigation bar and the footer wave.
- **Back Button Must Be Non-Overflow (In-Flow):** The universal back button must never be absolute or float over content (`no overflow`). It resides in a dedicated in-flow top navigation row (`topNavWrapper`). No headers, banners, labels, or text may ever sit alongside or collide with the back button.
- **Scrollable Card Centering:** On screens with scrollable card areas (`kiosk-services`, `kiosk-cubicle-selection`), the scroll container and inner card grid must be vertically and horizontally centered (`m-auto`, `flex flex-col items-center justify-center`). Content must never be stuck to the top or leave awkward asymmetric empty margins at the bottom.
- **Fixed Screens Centering:** On fixed screens (`kiosk-new-old-selection`, `category-selection`, `sms-input`, `queue-print`), content must be vertically and horizontally centered in the available space above the kiosk wave footer.

---

### 10. Enterprise Navigation & Solid Surfaces Standard
- **Enterprise Navigation Structure:** All administrative and clinical workstations (`app/superadmin/`, `app/dashboard/`, `app/nurse/`) must implement an industry-standard layout featuring a fixed desktop left-rail sidebar (`w-64`), categorized navigation groups, and a sticky top header with dynamic breadcrumbs, live Philippine Standard Time (Manila clock), single-click light/dark theme toggle, user identity profile chip, and direct session sign-out.
- **Deep-Linking & URL Tab Synchronization:** Subsystem tabs (e.g. rooms vs counters, settings vs security) must synchronize with URL search parameters (`?tab=...`) to allow direct deep-linking from navigation links.
- **High-Contrast Solid Surfaces (Clinical Ergonomics):** Administrative workstations must eliminate blurry glassmorphism, milky transparent layers, and high-glow gradients in favor of high-contrast solid surfaces (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`), crisp 1-pixel borders (`border-slate-200 dark:border-slate-800`), and subtle elevation shadows (`shadow-xs` / `shadow-sm`).
- **Flawless Dual-Theme Architecture:** All screens must support seamless light and dark mode toggling with zero hydration mismatch (`mounted && resolvedTheme === 'dark'`), transition flashing suppression (`disableTransitionOnChange`), and explicit dark styling on native `<option>` tags inside form dropdowns.

---

### 11. Prohibition of Text Ellipsis & Truncation
- **Avoid Using Ellipsis on Text:** All text labels, patient queue numbers, doctor names, room identifiers, cubicle labels, service names, statuses, and clinical indicators must display in full without truncation or ellipsis (`...` or `…`).
- **No Truncation Utility Classes on Informational Content:** Avoid using Tailwind's `truncate` or `text-ellipsis` classes on medical or operational data where truncated text can obscure critical information (such as physician names, cubicle designations, or ticket numbers).
- **Graceful Text Wrapping & Ergonomic Layouts:** Design containers, cards, and data badges with sufficient space or use natural word-wrapping (`break-words`, `whitespace-normal`) so that labels and identifiers remain fully legible, clear, and unambiguous to healthcare staff.

---

### 12. Mandatory Secure Coding and System Interconnection Standards
- **Principle of Least Privilege & Service-Role Isolation:**
  - The Supabase Service Role Key bypasses all Row Level Security (RLS) policies and must NEVER be exposed to client-side code, frontend bundles, or environment variables prefixed with `NEXT_PUBLIC_`.
  - Service-role usage must be strictly isolated to server-only Route Handlers, background tasks, or internal scripts.
  - Client components must interact with the database exclusively using the public anon key governed by RLS.
- **Server-Side Route Guarding & Zero-Trust Session Verification:**
  - Access control and role checks must always be enforced on the server before rendering UI (`proxy.ts` / server middleware and Supabase RLS).
  - Client-side checks (e.g., `useRoleGuard` or client state) are cosmetic/visual aids only and must NEVER be treated as security boundaries.
- **Strict Input Validation & Schema Enforcement:**
  - Every API route handler, server action, and backend endpoint must strictly validate incoming parameters, headers, and request bodies before processing.
  - Use Zod schemas in Next.js Route Handlers and Pydantic models in FastAPI endpoints with explicit field types, ranges, and regex constraints.
  - Never trust client-provided role claims, IDs, or flags without validating them against the authenticated session.
- **Safe Database Queries & Defense Against Injection:**
  - All database interactions must use parameterized queries through the Supabase client SDK or parameterized ORM builders. Never concatenate raw strings into SQL queries.
  - Protect historical research data: Operational mutations (`UPDATE`, `DELETE`) on the `patients` table must strictly filter out historical records (`is_historical = false`). Historical data must remain immutable.
- **Resilient and Secure Subsystem Interconnection:**
  - All HTTP communication between Next.js and FastAPI must include explicit timeout configurations (`AbortController` with 10-second timeout) to prevent thread exhaustion.
  - Sanitize all cross-service error responses: Catch network and backend exceptions gracefully. Never leak raw Python tracebacks, database internal errors, or file system paths to the client.
  - Enforce CORS restrictions on the backend: Explicitly whitelist verified frontend origins (`ALLOWED_ORIGINS`). Never configure `allow_origins=["*"]` on production endpoints.
- **Authentication & Account Protection:**
  - Login endpoints must enforce brute-force rate limiting and account lockout (via `login_attempts`).
  - Auth cookies must enforce `HttpOnly`, `Secure` (in production), and `SameSite` flags.
  - Password reset tokens must expire promptly (15-minute lifetime) and be single-use only (via `password_reset_attempts`).
- **Cross-Site Scripting (XSS) & Content Protection:**
  - Rely on React's automatic escaping for dynamic content in JSX. Never use `dangerouslySetInnerHTML` or evaluate arbitrary user strings.

---

## Agent Pre-Commit / Pre-Completion Checklist

Before completing any refactoring or coding task, verify against these rules:
- [ ] Every changed/created file has full file-level and symbol-level JSDoc comments.
- [ ] No raw text copy or inline style objects remain hardcoded in UI components.
- [ ] Text copy is exported from `<feature>Texts.ts`.
- [ ] Styles and visual properties are exported from `<feature>Styles.ts` or `<feature>.ts`.
- [ ] Global constants contain only shared/system-level tokens; local constants remain in their feature directory.
- [ ] Centralized scales (such as kiosk typography in `constants/kiosk.ts`) are referenced by local constants.
- [ ] If an image reference was provided, the implementation matches the image faithfully.
- [ ] No unintentional visual or layout regressions were introduced during refactoring.
- [ ] All kiosk screens, scrollable containers, and card grids are centered both horizontally and vertically.
- [ ] Enterprise navigation rails, breadcrumbs, Manila clock, and high-contrast solid surfaces are adhered to in administrative workstations.
- [ ] No emojis are used anywhere in documentation, code, or comments.
- [ ] No ellipsis or truncated text (`...`, `…`, `truncate`, `text-ellipsis`) is used on labels, names, or clinical data.
- [ ] All operational terminal commands received explicit user confirmation prior to running (with token-saving search and scanning commands permitted for efficient investigation).
- [ ] Developer guide markdown files (.md) are created or updated with an explicit "where to edit" reference guide so developers can navigate and make changes easily.
- [ ] No private secrets, backend credentials, or service role keys are exposed to client code or `NEXT_PUBLIC_` variables.
- [ ] Server-side route guarding and role validation (`proxy.ts`) protect administrative and clinical endpoints.
- [ ] All API inputs and request bodies are strictly validated with schemas (Zod / Pydantic) before processing.
- [ ] Database queries are parameterized; no raw SQL string concatenation exists; historical records (`is_historical = true`) are protected from mutation.
- [ ] Inter-service calls between Next.js and FastAPI have explicit timeouts and sanitized error responses (no raw tracebacks).


