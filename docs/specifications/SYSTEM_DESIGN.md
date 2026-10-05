# Heart Check PHC: Enterprise System Design & Standardization Specification

This document serves as the authoritative, comprehensive System Design and Design Standardization Specification for the Heart Check PHC platform. It establishes the architectural principles, system topology, visual design standards, navigation patterns, component contracts, and engineering guardrails that govern the entire repository.

The architecture is standardized around the **PHC Decoupled Standard**—a strict separation-of-concerns pattern engineered for clinical-grade reliability, ergonomic usability, dark/light theme consistency, and rapid long-term maintainability.

---

## 1. Architectural Philosophy: The Decoupled Standard

The foundational engineering principle of Heart Check PHC is the strict separation of presentation, user-facing text, visual styling, layout mechanics, and business logic. Monolithic components combining state, styling, and text copy are strictly prohibited.

Every feature module and route segment across the project follows this multi-layer architectural taxonomy:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Presentation Layer                           │
│     app/<domain>/components/ — Dumb, composable, single-purpose UI     │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │                                │
    (Imports User Copy)              (Imports Styles & Utility Classes)
                    │                                │
┌───────────────────┴───────────────┐ ┌──────────────┴───────────────────┐
│     2. Text Dictionaries          │ │  3. Style & Token Dictionaries   │
│  constants/<component>Texts.ts    │ │    constants/<component>Styles.ts│
│  - Filipino / English copy        │ │    - Typed CSSProperties styles  │
│  - Modal titles & descriptions    │ │    - Color, spacing, type tokens │
│  - Button labels & ARIA text      │ │    - Interactive Tailwind classes│
└───────────────────────────────────┘ └──────────────────────────────────┘
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                   (Aggregated for Backwards Compatibility)
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Barrel Re-exports (<feature>Texts.ts / <feature>.ts)  │
        └────────────────────────────┬───────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                   4. Layout & Orientation Shell                        │
│   layout.tsx & constants/<feature>Layout.ts — Viewports & Nav Rails   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                   5. State, Logic & Data Providers                     │
│  hooks/, context/, & types/ — Supabase Realtime, Timers, API Calls     │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Presentation Layer (`components/`)
- UI component files exist exclusively to assemble and render JSX.
- Components must be split into single-responsibility subcomponents (e.g., header, card, action buttons, table, modals).
- **Prohibited in UI Components:**
  - Hardcoded user-visible text strings (e.g., `<h1>Enter Phone Number</h1>`).
  - Inline literal style objects (e.g., `style={{ padding: 16, color: "#fff" }}`).
  - Hardcoded raw color strings, arbitrary hex codes, or unstandardized Tailwind utility chains.
- Components consume text copy from dedicated `<component>Texts.ts` files and visual styles from dedicated `<component>Styles.ts` or `<component>.ts` files.

### Layer 2: Text Dictionaries (`constants/<component>Texts.ts`)
- Every UI component displaying text must have a dedicated text constants file.
- Stores bilingual (Filipino / English) labels, headings, instructions, button text, dialog prompts, placeholder copy, and error notices.
- All text dictionaries are exported as immutable `as const` objects.
- Central feature barrel text files (`<feature>Texts.ts`) re-export component-level dictionaries to maintain backwards compatibility while preserving isolation.

### Layer 3: Style & Property Dictionaries (`constants/<component>Styles.ts` / `<component>.ts`)
- Every component must have a dedicated styling constants file.
- Static visual styles are defined using typed `Record<string, CSSProperties>` objects and consumed via the `style` prop (e.g., `style={ComponentStyle.container}`).
- Dynamic interactive states, responsive grids, hover transitions, and group animations are defined in typed style dictionary objects.
- Dimension tokens (padding, gap, sizing), color palettes, and typography scales (`clamp()` definitions) are centralized as typed constants.
- Central feature barrel style files (`<feature>.ts`) re-export component-level styles and tokens.

### Layer 4: Layout & Navigation Shells (`layout.tsx` & `<feature>Layout.ts`)
- Layout shells handle viewport containment (`100dvh` / `100dvw`), preventing global window scroll jitter and confining scrolling to designated content containers (`.phc-scroll` or `<main>`).
- Client hydration awareness is standard across all layouts using `useIsMounted()` to execute smooth fade-in transitions (`opacity-0` to `opacity-100`).
- Provides responsive viewport management, transitioning between desktop rails and mobile drawers on administrative workstations, or handling landscape/portrait orientations on kiosk touchscreens.

### Layer 5: State, Controller Hooks & Type Contracts (`hooks/`, `context/`, `types/`)
- Pure business logic, hardware interaction, timers, validation, and database queries are abstracted into custom hooks (`useSuperadminUsers`, `useUserModalState`, `useKioskNavigate`, `usePatientsData`).
- Global or sub-tree state is managed via React Context (`KioskLoadingContext`, `ThemeProvider`).
- All data contracts are strictly typed using TypeScript interfaces in `types/`, mirroring Supabase PostgreSQL database schemas.

### Layer 6: Developer Navigation Guides (`README.md`)
- Every major feature folder and domain subsystem must contain and maintain a dedicated `README.md` developer guide.
- The guide provides an exhaustive "Where to Edit" matrix mapping text changes, style updates, layout alterations, and logic modifications directly to their source files.

---

## 2. Visual Design System & Design Tokens

Heart Check PHC implements an enterprise-grade visual design system built specifically for clinical workstations and high-throughput patient terminals.

### 2.1 Color Palette Architecture

All interface colors are derived from a unified semantic palette anchored by the official Philippine Heart Center brand identity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PHC BRAND & CLINICAL PALETTE                      │
├────────────────────────────────────────────────────────────────────────┤
│ Primary Brand:    Philippine Heart Center Rose/Red                     │
│                   - Default:   #dc2626 (rose-600)                      │
│                   - Hover:     #be123c (rose-700)                      │
│                   - Active:    #9f1239 (rose-800)                      │
│                   - Subtle:    #fff1f2 (rose-50 / dark:rose-950/30)    │
│                                                                        │
│ Clinical Serving: Medical Emerald (Active Station / Operational)       │
│                   - Default:   #059669 (emerald-600)                   │
│                   - Surface:   #ecfdf5 (emerald-50 / dark:emerald-950) │
│                                                                        │
│ Queue Pending:    Warm Amber (Waiting Patients / Priority Alert)       │
│                   - Default:   #d97706 (amber-600)                     │
│                   - Surface:   #fffbeb (amber-50 / dark:amber-950)     │
│                                                                        │
│ Intake / Info:    Clinical Blue (Registration Counters / In-Progress)  │
│                   - Default:   #2563eb (blue-600)                      │
│                   - Surface:   #eff6ff (blue-50 / dark:blue-950)       │
│                                                                        │
│ Critical Alert:   Crimson Red (Lockout / Destructive Confirmation)     │
│                   - Default:   #e11d48 (red-600)                       │
│                   - Surface:   #fef2f2 (red-50 / dark:red-950)         │
│                                                                        │
│ Neutral Base:     Solid Slate Foundation                               │
│                   - Light:     #f8fafc (slate-50), #ffffff (white)     │
│                   - Dark:      #020617 (slate-950), #0f172a (slate-900)│
│                   - Borders:   #e2e8f0 (slate-200), #1e293b (slate-800)│
│                   - Text:      #0f172a (slate-900), #f8fafc (slate-100)│
│                   - Muted:     #64748b (slate-500), #94a3b8 (slate-400)│
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 High-Contrast Solid Surfaces Standard (Clinical Ergonomics)

To satisfy enterprise healthcare standards, Heart Check PHC enforces high-contrast solid surfaces across all administrative and clinical dashboards:

1. **Elimination of Translucent Blur / Glassmorphism in Workstations:**
   - Uncontrolled background blur filters (`backdrop-blur-md`), semi-transparent milky backgrounds (`bg-white/40`), and multi-layer floating drop-shadows are strictly prohibited in data-dense interfaces.
   - Glassmorphic transparency degrades text legibility in clinical environments with varying overhead fluorescent hospital lighting.
2. **Solid Foundation & Elevation Standards:**
   - Base canvas: Solid neutral background (`bg-slate-50 dark:bg-slate-950`).
   - Cards, tables, sidebars, and modals: Solid surface foundation (`bg-white dark:bg-slate-900`).
   - Separation boundaries: Crisp 1-pixel solid borders (`border-slate-200 dark:border-slate-800`).
   - Depth elevation: Subtle, controlled micro-shadows (`shadow-xs` or `shadow-sm`) that maintain sharp contrast without visual muddying.

### 2.3 Dark Mode & Light Mode Architecture

Heart Check PHC natively supports seamless dark and light modes through `next-themes` and Tailwind CSS:

1. **Hydration Protection:**
   - All theme toggle buttons and theme-dependent icons must use a client mount guard (`mounted && resolvedTheme === 'dark'`) to prevent SSR hydration mismatches.
2. **Smooth Transition Suppression (`disableTransitionOnChange`):**
   - The root `ThemeProvider` in `app/provider.tsx` declares `disableTransitionOnChange`. This suppresses jarring 300ms color flashing across complex charts and data tables during theme switching.
3. **Accurate Theme Resolution (`resolvedTheme`):**
   - Theme evaluations must query `resolvedTheme` rather than `theme` to correctly handle `defaultTheme="system"` configurations.
4. **Native Select & Input Contrast:**
   - Native HTML `<option>` tags inside dark-mode dropdowns must declare explicit solid dark classes (`bg-white dark:bg-slate-900 text-slate-900 dark:text-white`) to eliminate illegible white-on-white text rendering caused by OS-level popup styling.

### 2.4 Typography & Scale Architecture

Typography is standardized around modern, highly legible sans-serif typography (Inter / System UI):

| Token | Target Usage | Scale / Properties |
| :--- | :--- | :--- |
| `kioskTypography.pageTitle` | Major kiosk screen headings | Fluid `clamp(1.75rem, 4vw, 2.75rem)`, font-black |
| `kioskTypography.pageSubtitle` | Kiosk instructions & Tagalog prompts | Fluid `clamp(1rem, 2vw, 1.25rem)`, font-medium |
| `kioskTypography.cardTitle` | Touchscreen selection cards | Fluid `clamp(1.125rem, 2.5vw, 1.5rem)`, font-bold |
| `kioskTypography.numpad` | Keypad digits on phone input | Fixed `text-2xl` to `text-3xl`, font-bold |
| `superadminStyles.layout.heading` | Administrative portal section title | Fixed `text-xl` to `text-2xl`, font-bold, tracking-tight |
| `superadminStyles.layout.subheading` | Administrative portal section subtitle | Fixed `text-xs` to `text-sm`, text-slate-500 |
| `superadminNavStyles.header.clock` | Header live Philippine Standard Time | Monospace numbers, font-mono, font-semibold |

---

## 3. Navigation Architecture & Layout Archetypes

Heart Check PHC defines distinct layout archetypes tailored to specific user contexts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     SYSTEM NAVIGATION ARCHETYPES                       │
├────────────────────────────────────────────────────────────────────────┤
│ Archetype A: Enterprise Administration & Clinical Workstations         │
│              (/superadmin, /dashboard, /nurse)                         │
│              - Fixed desktop left-rail sidebar (w-64)                  │
│              - Top header with dynamic breadcrumbs & Manila clock      │
│              - Responsive mobile slide-over drawer                     │
│              - Deep-linked query parameter synchronization             │
│                                                                        │
│ Archetype B: Patient Self-Service Touchscreen Kiosks                   │
│              (/kiosk/pages/*)                                          │
│              - Strictly centered main interaction viewport             │
│              - In-flow universal top navigation (no overlap)           │
│              - 44px+ touch targets & large keypad touchpoints          │
│              - Viewport lock (100dvh) with custom phc-scroll           │
│                                                                        │
│ Archetype C: Public Waiting Area Queue Display Monitors                │
│              (/monitor)                                                │
│              - Fullscreen high-visibility wall display                 │
│              - Multi-column cubicle pairing & real-time audio paging   │
│              - Visual callout flash animations                         │
│                                                                        │
│ Archetype D: Clinical Patient Transfer Engine                          │
│              (/transfer)                                               │
│              - Pinned viewport with permanent sub-header               │
│              - Native pointer-events drag-and-drop                     │
│              - Strict FIFO queue stack lock (Serving Next only)        │
│              - Unclipped body portal drag preview                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Archetype A: Enterprise Administration Standard

Implemented in `app/superadmin/` and `app/dashboard/`:

1. **Persistent Desktop Left-Rail Sidebar ([SuperAdminSidebar.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminSidebar.tsx)):**
   - Fixed `w-64` rail pinned to the left edge on `lg:` viewports.
   - Features the official Philippine Heart Center emblem and system console brand title.
   - Organized into distinct functional domains:
     - **Access & Identity:** Staff Accounts (`/superadmin`).
     - **Clinical Infrastructure:** Consultation Rooms & Cubicles (`/superadmin/facilities?tab=rooms`), Registration Counters (`/superadmin/facilities?tab=counters`).
     - **Patient Touchscreen:** Kiosk Services Catalog (`/superadmin/customization`).
     - **System & Governance:** Queue Automation (`/superadmin?tab=settings`), Administrator Security (`/superadmin?tab=security`).
   - Live system operational status badge and institutional MIS footer.
2. **Enterprise Sticky Header Bar ([SuperAdminHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/components/navigation/SuperAdminHeader.tsx)):**
   - Sticky top bar with solid surface (`bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`).
   - Dynamic Breadcrumbs: Automatically resolves and updates the active path (e.g., `SuperAdmin / Clinical Infrastructure / Counter Stations`).
   - Live Manila Time Clock: Displays real-time Philippine Standard Time (`formatManilaDate` + `formatManilaTime`) updated every second.
   - Instant Theme Toggle: Fast, reliable dark/light mode toggle with theme resolution.
   - User Profile Chip: Displays avatar initial, administrator email, and a high-contrast `SUPERADMIN` role tag.
   - Secure Sign-Out Trigger: Terminates Supabase session and redirects to `/login`.
3. **Responsive Mobile Drawer:**
   - On screens smaller than `1024px`, the navigation collapses into an accessible slide-over drawer with backdrop dismiss controls.
4. **URL Query Synchronization & Deep Linking:**
   - Navigating via sidebar deep-links directly sets query parameters (`?tab=rooms`, `?tab=counters`, `?tab=settings`, `?tab=security`).
   - Pages synchronize their local tab state with URL query parameters and scroll to targeted sections when requested.

### 3.2 Archetype B: Patient Touchscreen Kiosk Standard

Implemented across `app/kiosk/pages/`:

1. **Strict UI Centering Standard (AGENTS.md Rule 9):**
   - Every kiosk screen's interactive content, banners, card grids, instructions, and numeric keypads must be vertically and horizontally centered in `<main>` between the top navigation bar and the footer wave.
   - Scrollable card containers (`kiosk-services`, `kiosk-cubicle-selection`) must center both the outer container and the inner card grid (`m-auto flex flex-col items-center justify-center`). Content must never stick to the top or leave awkward asymmetric empty margins at the bottom.
2. **In-Flow Non-Overflow Top Navigation:**
   - The universal back button must never be absolute or float over content. It resides in a dedicated in-flow top navigation row (`topNavWrapper`).
   - No headers, banners, labels, or text may ever sit alongside or collide with the back button.
3. **Viewport Containment:**
   - Viewport is locked to `100dvh` / `100dvw`, suppressing browser bounces. Scrolling is reserved strictly to inner containers equipped with `.phc-scroll`.
4. **Ergonomic Touch Targets:**
   - All interactive touchpoints maintain a minimum hit area of 44×44px, with primary selection cards exceeding 120px in height for effortless interaction by elderly patients.

---

## 4. Component Contracts & Reusable Primitives

Heart Check PHC provides standardized UI primitives ensuring visual consistency across all modules:

### 4.1 Reusable Primitives (`components/reusables/`)

1. **`BackButton.tsx`:**
   - Universal navigation button with prioritized execution:
     1. Custom `onClick` handler (prevents accidental session resets).
     2. Specific `href` path.
     3. Fallback `router.back()`.
   - Minimum 44px hit-box compliant with accessibility standards for medical tablets.
2. **`ScrollArea.tsx`:**
   - Cross-browser container applying the custom `.phc-scroll` scrollbar styling with flexible orientation (`vertical`, `horizontal`, `both`) and overflow controls.
3. **`NotificationBadge.tsx`:**
   - High-contrast badge supporting numeric counts, maximum truncation ceilings (`99+`), pulsing live alerts (`.phc-badge-pulse`), and semantic color tokens (`red`, `blue`, `amber`, `emerald`, `slate`).

### 4.2 Form Controls & Input Standards

1. **Text & Number Inputs:**
   - Standard height (`px-3.5 py-2` or `px-4 py-2.5`), rounded corners (`rounded-lg`), solid background (`bg-white dark:bg-slate-800`), crisp border (`border border-slate-300 dark:border-slate-700`).
   - Focus ring: `focus:outline-none focus:ring-2 focus:ring-rose-500`.
   - Placeholder: High-contrast muted placeholder (`placeholder-slate-400 dark:placeholder-slate-500`).
2. **Dropdown Selects:**
   - Consistent typography and padding matching text inputs.
   - Native `<option>` elements must declare explicit solid dark classes (`bg-white dark:bg-slate-900 text-slate-900 dark:text-white`).
3. **Action Buttons:**
   - **Primary Action:** `bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-xs transition`.
   - **Secondary / Outline:** `border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300`.
   - **Destructive Action:** `bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-xs`.
   - **Disabled States:** `disabled:opacity-50 disabled:cursor-not-allowed`.

### 4.3 Data Tables & Data Grids

1. **Container:** Solid card surface (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden`).
2. **Table Header (`thead`):** Subtle neutral background (`bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800`), uppercase tracking text (`text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider`).
3. **Table Body (`tbody`):** Rows with hover illumination (`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition`), subtle row dividers (`divide-y divide-slate-100 dark:divide-slate-800`).
4. **Pagination Bar:** Dedicated footer section with record count indicators, page numbers, and accessible Previous/Next button controls.

---

## 5. System Topology & Data Synchronization

Heart Check PHC is engineered as a unified Next.js 15 (App Router) full-stack web application integrated with Supabase (PostgreSQL + Realtime) and a specialized FastAPI (Python) analytics engine:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Next.js 15 Application                            │
│                                                                         │
│  Public Contexts (Unauthenticated)                                      │
│  - /kiosk          Patient self-service check-in & thermal ticketing    │
│  - /monitor        Public waiting area queue display & audio paging     │
│  - /login          Staff entry & password recovery                      │
│                                                                         │
│  Staff & Clinical Contexts (Authenticated & Role-Guarded)               │
│  - /nurse          Outpatient department triage & patient call desk     │
│  - /transfer       Clinical drag-and-drop cubicle reassignment engine   │
│  - /dashboard      Administrative analytics & operational capacity      │
│  - /superadmin     User provisioning & role-based access control        │
└────────────────────┬───────────────────────────────┬────────────────────┘
                     │                               │
            Database Mutations &              HTTP Analytics
            Realtime Subscriptions            Calculations
                     │                               │
┌────────────────────▼──────────────┐   ┌────────────▼────────────────────┐
│      Supabase (PostgreSQL)        │   │     FastAPI Backend (Python)    │
│  - patients (live & historical)   │   │  - Descriptive & Diagnostic     │
│  - services                       │   │  - M/M/1 & M/M/c Queueing Models│
│  - cubicles & selector groups     │   │  - Auto-selecting Forecasting   │
│  - patient_category               │   │  - Prescriptive Staffing Advice │
│  - users (role-based auth)        │   │  - PHC Excel Export Generation  │
│  - Row Level Security (RLS)       │   └─────────────────────────────────┘
└───────────────────────────────────┘
```

### 5.1 Two-Layer Security & Route Guarding

1. **Server-Side Middleware (`middleware.ts`):**
   - Intercepts incoming HTTP requests before component execution.
   - Validates session tokens using Supabase Auth.
   - Redirects unauthenticated requests trying to access `/superadmin`, `/dashboard`, `/nurse`, or `/transfer` to `/login`.
2. **Client-Side Role Guard (`useRequireAuth` / `useRoleGuard`):**
   - In-page validation verifying user roles (`superadmin`, `admin`, `doctor`, `nurse`, `registration`) against the database profile.
   - Renders animated verification loading spinners during session validation and blocks unauthorized DOM presentation.

---

## 6. Standard Directory Blueprint for Feature Modules

Any new module, route segment, or subsystem created in this repository must strictly adhere to this file tree blueprint:

```
app/<feature-name>/
├── README.md                           # Mandatory developer guide ("Where to Edit")
├── layout.tsx                          # Shell layout (handles hydration & orientation)
├── page.tsx                            # Page entry point / orchestrator
├── components/                         # Pure UI presentation components
│   ├── navigation/                     # Feature-specific navigation components
│   ├── <ComponentNameA>.tsx
│   ├── <ComponentNameB>.tsx
│   └── <ComponentNameModal>.tsx
├── constants/                          # Decoupled constants & dictionaries
│   ├── <componentNameA>Texts.ts        # User copy for Component A
│   ├── <componentNameA>Styles.ts       # Styles, tokens & classes for Component A
│   ├── <componentNameB>Texts.ts        # User copy for Component B
│   ├── <componentNameB>Styles.ts       # Styles, tokens & classes for Component B
│   ├── <featureName>Layout.ts          # Layout classes & container styles
│   ├── <featureName>Texts.ts           # Central barrel re-exporting all texts
│   └── <featureName>.ts                # Central barrel re-exporting all styles
├── hooks/                              # Domain-specific logic, timers & state
│   └── use<FeatureName>.ts
├── context/                            # Context providers (if shared tree state is required)
│   └── <FeatureName>Context.tsx
└── types/                              # TypeScript interfaces and contracts
    └── <FeatureName>Types.ts
```

---

## 7. Universal "Where to Edit" Developer Standard

When making modifications anywhere in the project, consult this universal lookup matrix:

| Intended Modification | Target File / Location |
| :--- | :--- |
| **Change user-facing copy, labels, placeholders, or modal text** | Direct edit in `<component>Texts.ts` within the feature's `constants/` directory. |
| **Change visual styles, borders, dimensions, colors, or shadows** | Direct edit in `<component>Styles.ts` or `<component>.ts` (style dictionaries). |
| **Change interactive transitions, hover states, or group animations** | Direct edit in `<component>Styles.ts` (Tailwind class dictionaries). |
| **Change container padding, page margins, or orientation behavior** | Direct edit in `<feature>Layout.ts` or `layout.tsx`. |
| **Change button click actions, page transitions, or navigation routes** | Edit component event handlers, hooks in `hooks/`, or navigation constants. |
| **Change API endpoints, fetch calls, or Supabase mutations** | Edit custom hooks in `hooks/` or server routes in `app/api/`. |
| **Change data models, TypeScript interfaces, or database contracts** | Edit interfaces in `types/` or the corresponding database migration schemas. |
| **Change shared theme colors or global typography scales** | Edit root global tokens in `constants/colors.ts` and `constants/kiosk.ts`. |

---

## 8. Mandatory Quality & Architectural Guardrails (AGENTS.md Checklist)

All developers and automated agents contributing to Heart Check PHC must follow these rules without exception:

1. **Strict Separation of Concerns:**
   Never embed raw text strings or literal inline style objects inside `.tsx` components. All texts belong in `constants/<component>Texts.ts`, and all styles belong in `constants/<component>Styles.ts`.
2. **Zero Emojis Anywhere:**
   Emojis are strictly prohibited across the entire repository. This includes Markdown files (`.md`), code comments, JSDoc annotations, commit messages, console output, and UI text copy. All formatting must use clean, professional plain text.
3. **Comprehensive JSDoc Documentation:**
   - Every file must have a top-level `@file` or `@fileoverview` JSDoc header explaining its architectural purpose and role in the system.
   - Every exported symbol (component, hook, function, interface, type, constant) must have a detailed JSDoc block explaining parameters (`@param`), return values (`@returns`), and design considerations (`@remarks`).
4. **Preserve Barrel Re-Exports:**
   Whenever a new component-scoped constant file is introduced, re-export it in the route's central barrel files (`<feature>Texts.ts` and `<feature>.ts`) to ensure backward compatibility.
5. **Kiosk UI Centering & Non-Overflow Navigation:**
   All kiosk screens, scrollable containers, and card grids must be centered both horizontally and vertically. Universal back buttons must reside in-flow within `topNavWrapper` without overlapping interactive elements.
6. **Terminal Commands & Token-Saving Scans:**
   Automated agents may execute token-saving search, scanning, and inspection commands autonomously to conserve context tokens. For executing operational terminal commands (package managers, linters, builds, migrations, process management), the agent must always state the exact command and receive explicit user permission first.
7. **Continuous Documentation Updates:**
   Whenever a module, feature folder, component, or constants file is refactored, restructured, or expanded, the corresponding `.md` developer guide must be updated simultaneously so developers always have an accurate, unambiguous reference on where to make changes without guessing.
