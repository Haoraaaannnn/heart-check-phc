# Heart Check PHC: System Design Documentation

This document serves as the official, comprehensive System Design guide for the Heart Check PHC platform. It establishes the architectural principles, system topology, data flow patterns, and development standards that govern the entire repository.

The architecture of this project is standardized around the **Kiosk Standard**—a modular, four-layer separation-of-concerns pattern first implemented and perfected within `app/kiosk/`. All domains and future feature developments across the platform must adhere to this architectural model.

---

## 1. Architectural Philosophy: The Kiosk Standard

The fundamental design tenet of Heart Check PHC is the complete decoupling of presentation, user-facing text, visual styling, layout mechanics, and business logic. Monolithic components combining state, styling, and text copy are strictly prohibited.

Every feature module and route segment across the project follows this four-layer architectural taxonomy:

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
│  constants/<component>Texts.ts    │ │    constants/<component>.ts      │
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
│   layout.tsx & constants/<feature>Layout.ts — Hydration & Viewports   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                   5. State, Logic & Data Providers                     │
│  hooks/, context/, & types/ — Supabase Realtime, Timers, API Calls     │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Presentation Layer (`components/`)
- UI component files exist exclusively to assemble and render JSX.
- Components must be split into single-responsibility subcomponents (e.g., banner, description card, numpad, action buttons, modals).
- **Prohibited in UI Components:**
  - Hardcoded user-visible text strings (e.g., `<h1>Enter Phone Number</h1>`).
  - Inline literal style objects (e.g., `style={{ padding: 16, color: "#fff" }}`).
  - Hardcoded raw Tailwind utility strings that define colors, borders, or layout geometry.
- Components consume text copy from dedicated `<component>Texts.ts` files and visual styles from dedicated `<component>.ts` files.

### Layer 2: Text Dictionaries (`constants/<component>Texts.ts`)
- Every UI component that displays text has a dedicated text constants file.
- Stores bilingual (Filipino / English) labels, headings, instructions, button text, dialog prompts, and error notices.
- All text dictionaries are exported as immutable `as const` objects.
- Central feature barrel text files (`<feature>Texts.ts`) re-export component-level dictionaries to maintain backwards compatibility while preserving isolation.

### Layer 3: Style & Property Dictionaries (`constants/<component>.ts`)
- Every component has a dedicated styling constants file.
- Static visual styles are defined using typed `Record<string, CSSProperties>` objects and consumed via the `style` prop (e.g. `style={ComponentStyle.container}`).
- Dimension tokens (padding, gap, sizing), color palettes, and typography scales (`clamp()` definitions) are centralized as typed constants.
- Dynamic interactive states, hover transitions, and group animations are defined in `<Component>Classes` dictionaries for clean consumption without hardcoding class strings in TSX.
- Central feature barrel style files (`<feature>.ts`) re-export component-level styles and tokens.

### Layer 4: Layout & Orientation Shells (`layout.tsx` & `<feature>Layout.ts`)
- Layout shells handle viewport containment (`100dvh` / `100dvw`), preventing global browser scrolling and confining scrolling to designated content containers (`.phc-scroll` or `<main>`).
- Client hydration awareness is standard across all layouts using `useIsMounted()` to execute smooth fade-in transitions (`opacity-0` to `opacity-100`).
- Responsive touchscreen orientation handling is standard, adapting layout dimensions between Landscape and Portrait modes via `useIsLandscape()` or Tailwind `landscape:` and `portrait:` modifiers.

### Layer 5: State, Logic, and Types (`hooks/`, `context/`, `types/`)
- Pure business logic, hardware interaction, and database queries are abstracted into custom hooks (`useKioskNavigate`, `usePatientsData`, `useServiceQueue`).
- Global or sub-tree state is managed via React Context (`KioskLoadingContext`).
- All data contracts are strictly typed using TypeScript interfaces in `types/`, mirroring Supabase PostgreSQL database schemas.

### Layer 6: Developer Guides (`README.md`)
- Every major feature folder and domain subsystem must contain and maintain a dedicated `README.md` developer guide.
- The guide provides an exhaustive "Where to Edit" matrix mapping text changes, style updates, layout alterations, and logic modifications directly to their source files.

---

## 2. High-Level System Architecture

Heart Check PHC is engineered as a unified Next.js 15 (App Router) full-stack web application integrated with Supabase (PostgreSQL + Realtime) and a specialized FastAPI (Python) analytics engine.

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

---

## 3. Domain Modules & Implementation Structure

All domain modules in `app/` are organized to replicate the Kiosk Standard:

### 1. Kiosk Subsystem (`app/kiosk/`)
- **Role:** Physical self-service touchscreen terminal for outpatient check-in.
- **Key Features:** Patient category triage (New vs Old), service selection, age-category validation (Adult vs Pedia), consultation cubicle selection, Philippine mobile number entry (`+63 9XX XXX XXXX`), and thermal ticket issuance.
- **Directory Structure:**
  - `README.md`: Developer guide and "Where to Edit" reference.
  - `layout.tsx`: Root kiosk layout with universal back button, hydration transition, and activity spinner.
  - `components/`: Shell UI elements (`KioskLoadingOverlay.tsx`).
  - `constants/`: Component-level text and style files (`kioskBackButtonTexts.ts`, `kioskBackButton.ts`, `kioskLoadingOverlayTexts.ts`, `kioskLoadingOverlay.ts`, `kioskLayoutTexts.ts`, `kioskLayout.ts`).
  - `context/`: `KioskLoadingContext.tsx` providing universal route-transition feedback.
  - `hooks/`: `useKioskNavigate.ts` orchestrating loading states during router transitions.
  - `pages/`: Independent feature routes (`kiosk-new-old-selection`, `kiosk-services`, `category-selection`, `kiosk-cubicle-selection`, `sms-input`, `confirmation`, `queue-print`), each with its own `components/` and `constants/` directories.

### 2. Monitor Subsystem (`app/monitor/`)
- **Role:** Public waiting area display showing real-time queue states across clinical cubicles.
- **Key Features:** Realtime Supabase PostgreSQL changes listener, split-screen paired layouts, elapsed time counters, and automated audio callouts.
- **Directory Structure:**
  - `components/`: Modular display panels (`TableLayout.tsx`, `PairedLayout.tsx`, `RegistrationLayout.tsx`, `Header.tsx`, `Footer.tsx`).
  - `constants/`: Screen styles and text dictionaries.

### 3. Nurse Station Subsystem (`app/nurse/`)
- **Role:** Clinical triage and queue lifecycle management desk for outpatient nurses.
- **Key Features:** Live patient queue tables, service filtering, status transitions (`waiting` -> `serving` -> `completed`), manual ticket callouts, and audio announcement triggers.
- **Directory Structure:**
  - `components/`: Table views, action buttons, filter bars, and modal forms.
  - `constants/`: Table styles, status badge color tokens, and notification text constants.
  - `hooks/`: `usePatientsData.ts` and `useServiceQueue.ts` managing Supabase live synchronization.

### 4. Clinical Transfer Engine (`app/transfer/`)
- **Role:** Staff interface for routing and transferring patients between service cubicles and waiting pools.
- **Key Features:**
  - **Pointer Events Drag-and-Drop:** Native pointer primitives (`pointerdown`, `pointermove`, `pointerup`) with unclipped floating preview portal (`DragGhost.tsx`) and dynamic hit-testing (`document.elementsFromPoint`).
  - **FIFO Queue Stack Discipline:** Strict lock where only the top patient (`index === 0`, "Serving Next") is draggable and assignable; remaining patients (`index > 0`) are locked to enforce outpatient fairness.
  - **Pinned Viewport:** Pinned `h-screen overflow-hidden` wrapper with permanent `z-20` sub-header for breadcrumbs and `BackButton`, leaving `<main>` as the sole scrolling container (`.phc-scroll`).
  - **Separation of Concerns:** Externalized text copy (`transferTexts.ts`), visual property dictionaries (`transfer.ts`), and modular subcomponents.

### 5. Analytics & Operations Dashboard (`app/dashboard/`)
- **Role:** Administrative dashboard providing executive metrics, queueing theory insights, and capacity planning.
- **Key Features:**
  - **4-Tier Analytics Engine:**
    1. *Descriptive:* Hourly patient arrival patterns, service volume distributions, peak load windows.
    2. *Diagnostic:* Waiting time variance, bottlenecks, consultation duration anomalies.
    3. *Predictive:* Forecasting via SMA, WMA, EMA, Linear Regression, and ARIMA with automated MAE-based model selection.
    4. *Prescriptive:* Recommended cubicle allocations and dynamic staff adjustments based on M/M/1 and M/M/c queue models.
  - **Modular Architecture (`app/dashboard/pages/`):**
    - `overview/`: Operational summary metrics, live arrival graphs, quick actions.
    - `patients/`: Comprehensive patient flow tables, search filters, and export triggers.
    - `analytics/`: 4-tier analytics visualizations and PHC-compliant Excel workbook export.
    - `cubicles/`: Station occupancy grid, doctor assignments, and operational capacity tracking.

### 6. Authentication & Superadmin Subsystems (`app/login/`, `app/superadmin/`)
- **Role:** Security, role-based route protection, and staff credential management.
- **Two-Layer Access Control:**
  1. *Server-Side Middleware (`middleware.ts`):* Intercepts incoming HTTP requests, validates Supabase auth tokens, and redirects unauthenticated or unauthorized users prior to HTML delivery.
  2. *Client-Side Role Guard (`useRoleGuard`):* In-page security verifying user permissions against Supabase profiles table, displaying fallback error dialogs if unauthorized.

---

## 4. Standard Directory Blueprint for Feature Modules

Any new module, route segment, or feature created in this repository must strictly follow this file tree blueprint:

```
app/<feature-name>/
├── README.md                           # Mandatory developer guide ("Where to Edit")
├── layout.tsx                          # Shell layout (handles hydration & orientation)
├── page.tsx                            # Page entry point / orchestrator
├── components/                         # Pure UI presentation components
│   ├── <ComponentNameA>.tsx
│   ├── <ComponentNameB>.tsx
│   └── <ComponentNameModal>.tsx
├── constants/                          # Decoupled constants & dictionaries
│   ├── <componentNameA>Texts.ts        # User copy for Component A
│   ├── <componentNameA>.ts             # Styles, tokens & classes for Component A
│   ├── <componentNameB>Texts.ts        # User copy for Component B
│   ├── <componentNameB>.ts             # Styles, tokens & classes for Component B
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

## 5. Universal "Where to Edit" Developer Standard

When making modifications anywhere in the project, follow these universal file mapping rules:

| Intended Modification | Target File / Location |
| :--- | :--- |
| **Change user-facing copy, labels, placeholders, or modal text** | Direct edit in `<component>Texts.ts` within the feature's `constants/` directory. |
| **Change visual styles, borders, dimensions, colors, or shadows** | Direct edit in `<component>.ts` (inside `Record<string, CSSProperties>` style dictionaries). |
| **Change interactive transitions, hover states, or group animations** | Direct edit in `<component>.ts` (inside `<Component>Classes` dictionary). |
| **Change container padding, page margins, or orientation behavior** | Direct edit in `<feature>Layout.ts` or `layout.tsx`. |
| **Change button click actions, page transitions, or navigation routes** | Edit component event handlers, hooks in `hooks/`, or `useKioskNavigate.ts`. |
| **Change API endpoints, fetch calls, or Supabase mutations** | Edit custom hooks (`hooks/`) or server routes in `app/api/`. |
| **Change data models, TypeScript interfaces, or database contracts** | Edit interfaces in `types/` or the corresponding database migration schemas. |
| **Change shared theme colors or global typography scales** | Edit root global tokens in `constants/colors.ts` and `constants/kiosk.ts`. |

---

## 6. Coding, Documentation & Safety Standards

All developers and automated agents contributing to Heart Check PHC must follow these rules without exception:

1. **Strict Separation of Concerns:**
   Never embed text strings or literal inline style objects inside `.tsx` components. All texts belong in `constants/<component>Texts.ts`, and all styles belong in `constants/<component>.ts`.

2. **No Emojis Anywhere:**
   Emojis are strictly prohibited across the entire repository. This includes Markdown files (`.md`), code comments, JSDoc annotations, commit messages, console output, and UI text copy. All formatting must be clean and professional plain text.

3. **Comprehensive JSDoc Documentation:**
   - Every file must have a top-level `@file` and `@description` JSDoc header explaining its architectural purpose and role in the system.
   - Every exported symbol (component, hook, function, interface, type, constant) must have a detailed JSDoc block explaining parameters (`@param`), return values (`@returns`), side effects, and design considerations (`@remarks`).

4. **Preserve Barrel Re-Exports:**
   Whenever a new component-scoped constant file is introduced, it must be re-exported in the route's central barrel files (`<feature>Texts.ts` and `<feature>.ts`). This guarantees backwards compatibility and prevents breaking existing consumers.

5. **Explicit Permission Required for Terminal Commands:**
   Automated agents and developer tools must request and receive explicit user consent before executing any terminal commands, package manager operations, git commands, or linter validations.

6. **Maintain Developer Guides:**
   Whenever a domain or feature folder is created, refactored, or expanded, its `README.md` must be updated concurrently to provide an unambiguous "Where to Edit" mapping for the next developer.
