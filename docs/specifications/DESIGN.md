# Heart Check PHC: Enterprise Design & Layout Standards Specification

**Last Updated:** 2026-10-18

This document serves as the authoritative specification for all visual design, layout archetypes, UI component standards, typography scales, color systems, and separation-of-concerns architecture across the Heart Check PHC platform. It unifies and supersedes earlier component guides into a single authoritative reference.

---

## 1. Core Architectural Standards & Design Philosophy

The Heart Check PHC user interface is engineered for clinical-grade reliability, ergonomic usability across diverse hospital lighting environments, and rapid developer maintainability. All screens, modules, and components must adhere to the following non-negotiable architectural standards:

### 1.1 Strict Prohibition of Pillbox Designs
- **Standard:** Capsule-shaped and pillbox-style containers (`rounded-full`, `borderRadius: 9999`) are strictly prohibited for interactive buttons, status badges, filter chips, category tags, modal banners, and count indicators.
- **Rationale:** Pillbox styling produces visual clutter in dense clinical layouts, wastes horizontal padding, creates inconsistent visual rhythm against tabular records, and fails enterprise medical design standards.
- **Allowed Radii Tokens:**
  - Micro Badges & Small Tags: `rounded-md` (4px to 6px radius)
  - Standard Buttons & Form Inputs: `rounded-lg` or `rounded-xl` (8px to 12px radius)
  - Cards & Content Containers: `rounded-xl` or `rounded-2xl` (12px to 16px radius)
- **Functional Circle Exceptions:** `rounded-full` is reserved exclusively for:
  - Continuous animated spinners (`rounded-full animate-spin`)
  - Live status indicator dots (`w-2 h-2 rounded-full`)
  - Circular data visualizations (e.g. SVG donut charts and conic-gradient progress rings)

### 1.2 Strict Prohibition of Icons with Backgrounds
- **Standard:** Icons must never sit inside dedicated background tiles, tinted rounded squares, or translucent accent circles (e.g., `bg-rose-100`, `bg-[#a8071a]/10`, `bg-slate-100`, `bg-emerald-50`).
- **Appearance:** Icons must sit bare directly on their host surface (card, table row, navigation rail, or panel background) with their direct color token applied (`text-rose-600 dark:text-rose-400`, `text-slate-500 dark:text-[#a3a3a3]`, etc.).
- **Interactive Buttons:** When an icon acts as an interactive button (e.g. close, expand, or toggle), the interactive hover state (`hover:bg-slate-100 dark:hover:bg-[#242424]`) is permitted on the button element itself, but resting/idle state backgrounds around icons are prohibited.

### 1.3 High-Contrast Solid Surfaces Standard (Clinical Ergonomics)
- **Standard:** Workstations (`/superadmin`, `/dashboard`, `/nurse`, `/transfer`) must utilize solid surfaces with crisp 1-pixel borders. Blurry glassmorphism, translucent overlays, and heavy drop shadows are prohibited.
- **Canvas Base:** Solid neutral background (`bg-slate-50 dark:bg-[#0d0d0d]`).
- **Surface Elevation:** Solid white / dark neutral tiles (`bg-white dark:bg-[#1a1a1a]`).
- **Separation Borders:** Crisp 1-pixel solid lines (`border-slate-200 dark:border-[#2e2e2e]`).
- **Dark Mode Palette:** Pure neutral grayish dark mode tones (R=G=B, `#0d0d0d`, `#141414`, `#1a1a1a`, `#242424`, `#2e2e2e`). Bluish slate casts (`slate-900`, `slate-950`) and dark red background tints are prohibited.

### 1.4 Strict Separation of Concerns (UI, Texts, Styles)
The presentation layer must remain strictly decoupled across all feature directories:
- **Presentation Layer (`components/`):** Assembles and renders JSX only. Never contains hardcoded text copy, inline style objects, or arbitrary utility chains.
- **Copy Dictionaries (`constants/<feature>Texts.ts`):** Centralizes all bilingual (Filipino / English) labels, modal prompts, button texts, table headers, and error messages as immutable `as const` objects.
- **Style Dictionaries (`constants/<feature>Styles.ts` or `<feature>.ts`):** Exports all typed `Record<string, CSSProperties>` objects, Tailwind class strings, and dimensional tokens.
- **Where to Edit Maps:** Every feature directory must maintain a `README.md` containing an explicit "Where to Edit" table linking copy, styles, logic, and types to specific files.

### 1.5 Strict Prohibition of Hover Lift / Card Lift
- **Standard:** Cards, buttons, tiles, badges, and icons must never move, translate, scale, or project elevated shadows on hover (`hover:-translate-y-*`, `hover:scale-*`, `group-hover:scale-*`, `hover:shadow-md`, `hover:shadow-lg`, `hover:shadow-xs`).
- **Allowed Hover Feedback:** Interactive feedback must be conveyed solely through flat surface background changes (`hover:bg-slate-100 dark:hover:bg-[#242424]`), subtle border highlights (`hover:border-[#a8071a]/40 dark:hover:border-[#a8071a]/50`), or text color transitions (`hover:text-accent dark:hover:text-[#f87171]`).
- **Dual-Theme Text Hover Standard:** When text copy transitions on hover, it must never turn dark or use light-mode values in dark mode. Utilities must employ semantic tokens (`hover:text-accent`, `hover:text-content`) or explicit paired dark variants (`hover:text-slate-900 dark:hover:text-[#f5f5f5]`, `hover:text-[#a8071a] dark:hover:text-[#f87171]`).

### 1.6 Prohibition of Text Ellipsis & Truncation
- Clinical and operational data must never be truncated with `truncate`, `text-ellipsis`, or `text-overflow: ellipsis`.
- Doctor names, ticket codes, patient categories, room labels, and service names must wrap naturally (`break-words`, `whitespace-normal`).

### 1.7 Zero Emojis Standard
- Emojis are strictly banned from all documentation (`.md`), code comments, JSDocs, commit messages, and UI strings. Clean typography and Boxicons (`bx-*`) must be used exclusively.

---

## 2. Layout Archetypes & Structural Standards

The application defines four distinct layout archetypes engineered for specific physical contexts:

```
+------------------------------------------------------------------------+
|                     SYSTEM LAYOUT ARCHETYPES                           |
+------------------------------------------------------------------------+
| Archetype A: Enterprise Administration & Clinical Workstations         |
|              (/superadmin, /dashboard, /nurse)                         |
|              - Fixed desktop left-rail navigation (w-64)               |
|              - Top navigation bar with breadcrumbs & live Manila clock |
|              - Responsive mobile slide-over drawer                     |
|              - 100dvh viewport locking with internal scrolling         |
|                                                                        |
| Archetype B: Patient Self-Service Touchscreen Kiosks                   |
|              (/kiosk/pages/*)                                          |
|              - Strict vertical and horizontal viewport centering       |
|              - In-flow universal top navigation (no floating overlap)  |
|              - Bottom decorative wave graphic containment              |
|              - Touch-optimized 44px+ hit targets                       |
|                                                                        |
| Archetype C: Public Waiting Area Queue Display Monitors                |
|              (/monitor)                                                |
|              - Fullscreen high-visibility wall display                 |
|              - High-contrast typography readable from 10+ meters       |
|              - Zero PII (ticket numbers and room codes only)           |
|                                                                        |
| Archetype D: Clinical Patient Transfer Engine                          |
|              (/transfer)                                               |
|              - Pinned viewport with permanent sub-header               |
|              - Native pointer-events drag-and-drop                     |
|              - Strict FIFO queue lock (Serving Next only)              |
|              - Unclipped body portal drag preview                      |
+------------------------------------------------------------------------+
```

### 2.1 Archetype A: Enterprise Workstation Layout
- **Desktop Sidebar:** Fixed `w-64` left-rail navigation pinned to the left viewport on desktop screens (`lg:`). Displays institutional emblem, console title, and categorized navigation links.
- **Top Navigation Bar:** Sticky `h-16` bar containing dynamic route breadcrumbs, search input, live Philippine Standard Time (PST) digital clock with seconds, and theme toggle.
- **Main Viewport:** Bound by `h-screen overflow-hidden flex flex-col`. The primary content region scrolls internally with `.phc-scroll`.
- **Mobile Drawer:** On mobile viewports (`< lg:`), sidebar collapses into a slide-over drawer triggered by a top-bar hamburger button, with an accessible dark backdrop.

### 2.2 Archetype B: Kiosk UI Centering Standard
To ensure consistent ergonomics across portrait touch kiosks and landscape evaluation tablets:
- **Vertical and Horizontal Centering:** All interactive content, selection cards, and keypads must be centered vertically and horizontally between the top navigation bar and bottom wave graphic:
  ```tsx
  <div className="m-auto flex flex-col items-center justify-center w-full max-w-[1150px]">
    {/* Centered Kiosk Content */}
  </div>
  ```
- **In-Flow Navigation:** The back button must reside inside the normal layout flow within `topNavWrapper`. Floating or absolute positioning of back buttons over header titles is strictly prohibited.
- **Scroll Container Containment:** Any scrollable button list or grid must declare `flex flex-col items-center justify-center` so that un-scrolled or short lists remain centered within the interactive viewport.
- **Touch Ergonomics:** Interactive selection cards must feature minimum 44x44px touch targets with active scale feedback (`active:scale-[0.98]`).

### 2.3 Archetype C: Public Waiting Area Monitor Layout
- Designed for high-definition 1080p and 4K wall-mounted TV monitors.
- Strictly Light-Mode Only (`bg-slate-50`, `bg-white`, `#cc3535`); dark mode is strictly prohibited on TV displays for institutional clarity across outpatient waiting halls.
- Strict Zero-Scroll Lock: All layouts enforce `overflow: hidden` on viewport, body, and all content cards; zero scrollbars permitted.
- Maximum Queue Number Scale: Ticket numbers are scaled as big as possible (`font-black tabular-nums tracking-tight leading-none`, scaling up to `text-9xl` through `text-[11rem]`) to maximize card surface and visibility from 30+ feet away.
- Active Calling Highlight: Actively called tickets and stations feature a high-visibility calling alert state (amber-400 ring pulse, "CALLING NOW" badge, and animated indicator).
- Next in Queue Clarity: Waiting queues display dedicated "NEXT IN QUEUE" cards and enlarged numbers so waiting patients immediately understand who is next in line.
- Multi-column layout pairing ticket codes with target room, cubicle, and doctor designations or registration counters.
- Privacy compliance (RA 10173): Zero patient full names displayed; only ticket identifier strings (e.g. `P-042`, `LAB-015`) are broadcast.

### 2.4 Archetype D: Patient Transfer Engine Layout
- Dual-panel or split-lane interactive board organizing registration intake, waiting queues, consultation cubicles, and idle tickets.
- Utilizes designated drag handles (`DragHandle.tsx`) to distinguish between scroll gestures and drag-and-drop actions on touchscreens.
- Portal drag previews (`DragGhost.tsx`) rendered at `document.body` to avoid clipping by scrollable container bounds.

---

## 3. Visual Tokens & Color Palette Architecture

All colors and visual dimensions are governed by centralized token dictionaries in `constants/colors.ts` and `constants/themeTokens.ts`.

### 3.1 Color Palette Architecture

| Token Domain | Light Mode Value | Dark Mode Value | Usage & Meaning |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `#a8071a` / `#dc2626` | `#f87171` | Philippine Heart Center Red. Primary CTAs, active links, brand accents. |
| **Brand Subtle** | `#fff1f2` | `#241719` / `#a8071a/20` | Active selection backgrounds, subtle tint highlights. |
| **Medical Emerald** | `#059669` / `emerald-600` | `#34d399` / `emerald-400` | Active clinical station, serving status, successful operations. |
| **Queue Amber** | `#d97706` / `amber-600` | `#fbbf24` / `amber-400` | Pending queue, waiting status, attention warnings. |
| **Clinical Blue** | `#2563eb` / `blue-600` | `#60a5fa` / `blue-400` | Registration counters, in-progress triage, informative notes. |
| **Critical Red** | `#e11d48` / `rose-600` | `#fb7185` / `rose-400` | Destructive actions, lockout alerts, emergency notifications. |
| **Surface Base** | `#f8fafc` (`slate-50`) | `#0d0d0d` (Pure Dark) | Viewport and root canvas background. |
| **Surface Card** | `#ffffff` (`white`) | `#1a1a1a` (Neutral 900) | Content containers, modals, table surfaces. |
| **Surface Header** | `#ffffff` (`white`) | `#141414` (Neutral 925) | Pinned navigation headers and sidebars. |
| **Surface Recessed** | `#f1f5f9` (`slate-100`) | `#242424` (Neutral 850) | Inner wells, input fields, inactive list items. |
| **Border Default** | `#e2e8f0` (`slate-200`) | `#2e2e2e` (Neutral 800) | Crisp 1px structural separation lines. |
| **Border Subtle** | `#f1f5f9` (`slate-100`) | `#242424` (Neutral 850) | Secondary dividers, table inner borders. |
| **Text Primary** | `#0f172a` (`slate-900`) | `#f5f5f5` (Neutral 100) | Primary headings, titles, active table values. |
| **Text Secondary** | `#475569` (`slate-600`) | `#a3a3a3` (Neutral 400) | Subtitles, descriptions, secondary metadata. |
| **Text Muted** | `#94a3b8` (`slate-400`) | `#737373` (Neutral 500) | Helper text, disabled states, timestamps. |

### 3.2 Corner Radii Standards

| Token | Class | Target Elements |
| :--- | :--- | :--- |
| Micro / Mini | `rounded-md` (6px) | Status badges, table tags, count chips, checkbox indicators. |
| Standard | `rounded-lg` (8px) | Form inputs, standard buttons, dropdown menus, user avatar tiles. |
| Large | `rounded-xl` (12px) | Interactive cards, modal dialogs, scroll indicator pills, panels. |
| Container | `rounded-2xl` (16px) | Hero containers, large workflow cards, prominent banner surfaces. |
| Geometric Circle | `rounded-full` | **Restricted:** Loading spinners, status dots, donut charts only. |

### 3.3 Typography Scale Architecture

Typography is standardized around modern sans-serif fonts (Inter / Roboto / System UI):

| Token | Usage | Scale & Properties |
| :--- | :--- | :--- |
| `sizeTokens.typography.heroTitle` | Landing & kiosk primary splash | Fluid `clamp(2rem, 5vw, 4rem)`, font-black |
| `sizeTokens.typography.pageTitle` | Major view and dashboard titles | Fluid `clamp(1.5rem, 3vw, 2rem)`, font-extrabold |
| `sizeTokens.typography.sectionTitle` | Section and panel headings | Fixed `text-lg` to `text-xl`, font-bold |
| `sizeTokens.typography.cardTitle` | Interactive card headers | Fixed `text-sm` to `text-base`, font-bold |
| `sizeTokens.typography.body` | Standard documentation and copy | Fixed `text-sm`, leading-relaxed |
| `sizeTokens.typography.bodySmall` | Secondary descriptions and helpers | Fixed `text-xs`, leading-normal |
| `sizeTokens.typography.micro` | Meta tags, badges, table captions | Fixed `text-[10px]` to `text-[11px]`, font-semibold |
| Monospace (`font-mono`) | Ticket codes, IP addresses, clock | Fixed `font-mono`, tabular numbers |

---

## 4. Reusable Component Catalog (`components/reusables/`)

Heart Check PHC provides a suite of battle-tested UI primitives located in `components/reusables/`:

### 4.1 `BackButton.tsx`
An accessible, high-priority navigation button designed for clinical touchscreens, tablets, and desktop workstations.

- **File:** `components/reusables/BackButton.tsx`
- **Props:**
  - `onClick?: (e: React.MouseEvent) => void` — Custom navigation handler (highest priority).
  - `href?: string` — Fallback URL path to navigate to using Next.js `router.push()`.
  - `label?: string` — Optional label text (defaults to `"Back"`).
  - `className?: string` — Additional styling overrides.
  - `variant?: 'light' | 'dark' | 'ghost'` — Color scheme (default `'light'`).
- **Priority Resolution:**
  1. If `onClick` is provided, it executes immediately and returns. It will *not* fall through to `router.back()`, preventing accidental history pop-outs.
  2. If `href` is provided, it calls `router.push(href)`.
  3. If neither is provided, it calls `router.back()`.
- **Touch Target:** Minimum 44px hit-box compliant with accessibility standards for medical tablets.

```tsx
import { BackButton } from '@/components/reusables/BackButton';

<BackButton onClick={handleStepBack} label="Back to Rooms" />
```

### 4.2 `ScrollArea.tsx`
A cross-browser container that applies custom `.phc-scroll` scrollbar styling with flexible orientation and overflow controls.

- **File:** `components/reusables/ScrollArea.tsx`
- **Props:**
  - `children: React.ReactNode` — Scrollable content.
  - `orientation?: 'vertical' | 'horizontal' | 'both'` — Scrolling axis (default `'vertical'`).
  - `hideScrollbar?: boolean` — Hides visible scrollbar while preserving scroll functionality (default `false`).
  - `className?: string` — Tailwind class names for custom layout constraints.

```tsx
import { ScrollArea } from '@/components/reusables/ScrollArea';

<ScrollArea orientation="vertical" className="h-[calc(100vh-180px)] pr-2">
  {cubicles.map(c => <CubicleCard key={c.id} {...c} />)}
</ScrollArea>
```

### 4.3 `NotificationBadge.tsx`
A compact notification badge supporting numeric counts, maximum thresholds, pulsing live alerts, and color token variants. Formatted with `rounded-md` (no pillbox).

- **File:** `components/reusables/NotificationBadge.tsx`
- **Props:**
  - `count?: number` — Count to display (e.g. 5). If `count > maxCount`, displays `${maxCount}+`.
  - `maxCount?: number` — Truncation ceiling (default `99`).
  - `variant?: 'count' | 'dot'` — Whether to display numeric count or a compact dot (default `'count'`).
  - `color?: 'red' | 'blue' | 'amber' | 'emerald' | 'slate'` — Color token (default `'red'`).
  - `pulse?: boolean` — Applies `.phc-badge-pulse` animation for live real-time events.

```tsx
import { NotificationBadge } from '@/components/reusables/NotificationBadge';

<NotificationBadge count={queuedCount} color="red" pulse />
```

### 4.4 `DragHandle.tsx` & `DragGhost.tsx`
Touch-safe patient transfer drag-and-drop primitives.

- **`DragHandle.tsx`:** Explicit grip handle with attribute `data-drag-handle="true"`. On tablets, touching the general card scrolls the container, while touching the grip handle initiates card dragging.
- **`DragGhost.tsx`:** Detached portal rendered directly at `document.body`. Floats over headers, sidebars, and scrolling containers without being clipped by parent `overflow: hidden` containers.

---

## 5. CSS Utility Classes & Animation Reference (`app/globals.css`)

The following utilities are defined in `app/globals.css` to provide consistent visual feedback:

| Class | Purpose | Visual Behavior |
| :--- | :--- | :--- |
| `.phc-scroll` | Shared clinical scrollbar | 6px track, smooth rounded thumb, subtle hover darkening |
| `.phc-ghost` | Floating drag preview | 5 degree tilt, elevated drop shadow, semi-transparency |
| `.phc-dropzone` | Valid drop target indicator | Dashed border with animated pulsing glow |
| `.phc-drop-pop` | Successful drop feedback | Subtle scale pop (1.04x) on patient assignment |
| `.phc-shake` | Invalid drop feedback | Brief horizontal oscillation when dropping on full/invalid station |
| `.phc-badge-pulse` | Live queue alert | Pulsing outer ring radiating from badge |
| `.animate-monitor-calling` | TV monitor calling alert | 100% opaque red card blinking with 8px amber beacon ring and glow; zero text fading |

---

## 6. Implementation Checklist for New Views & Components

Before submitting or completing any UI modification, verify compliance against this checklist:

- [ ] **No Pillbox Shapes:** All badges, tags, chips, buttons, and indicators use `rounded-md`, `rounded-lg`, or `rounded-xl`. No `rounded-full` except for spinners, status dots, and donut charts.
- [ ] **No Icons with Backgrounds:** All icons sit directly on the card or panel surface with no background box or circle.
- [ ] **Solid Surfaces:** Workstations use solid `bg-white dark:bg-[#1a1a1a]` with crisp 1px borders; zero glassmorphism or translucent blurry cards.
- [ ] **Separation of Concerns:** Zero hardcoded user strings in JSX (use `<feature>Texts.ts`). Zero inline `style={{}}` objects (use `<feature>Styles.ts`).
- [ ] **Kiosk Centering:** Touchscreen kiosk content is centered vertically and horizontally between the top navigation and wave footer.
- [ ] **No Clinical Text Ellipsis:** Doctor names, room labels, ticket codes, and service names wrap cleanly with `break-words`.
- [ ] **Touch Target Safety:** All interactive elements declare a minimum hit area of 44x44px.
- [ ] **Zero Emojis:** Plain text and Boxicons only across copy, code, and documentation.
- [ ] **Documentation Date Stamp:** Markdown files include an explicit ISO date stamp (`YYYY-MM-DD`).
