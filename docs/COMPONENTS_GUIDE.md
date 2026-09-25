# Heart Check PHC — Design System & Reusable Components Guide

## 1. Overview

Heart Check PHC enforces a unified, reusable design system across all user-facing interfaces (Kiosk, Monitor, Transfer, Nurse, Analytics, and Superadmin). This document serves as the implementation reference for developers and evaluators to understand the global UI components located in `components/reusables/` and their accompanying CSS utility classes in `app/globals.css`.

---

## 2. Reusable Primitives (`components/reusables/`)

### 1. `BackButton.tsx`
An accessible, high-priority navigation button designed for clinical touchscreens, tablets, and desktop workstations.

- **File:** `components/reusables/BackButton.tsx`
- **Props:**
  - `onClick?: (e: React.MouseEvent) => void` — Custom navigation handler (highest priority).
  - `href?: string` — Fallback URL path to navigate to using Next.js `router.push()`.
  - `label?: string` — Optional label text (defaults to `"Back"`).
  - `className?: string` — Additional styling overrides.
  - `variant?: 'light' | 'dark' | 'ghost'` — Color scheme (default `'light'`).
- **Priority Resolution:**
  1. If `onClick` is provided, it executes immediately and **returns**. It will *not* fall through to `router.back()`. This prevents destructive page navigation (e.g. popping history back to `/login`).
  2. If `href` is provided, it calls `router.push(href)`.
  3. If neither is provided, it executes `router.back()`.
- **Touch Target:** Minimum 44px hit-box compliant with accessibility standards for medical tablets.

```tsx
import { BackButton } from '@/components/reusables/BackButton';

// Example: Hierarchical step-back in clinical transfer
<BackButton onClick={handleStepBack} label="Back to Rooms" />
```

---

### 2. `ScrollArea.tsx`
A cross-browser container that applies the custom `.phc-scroll` scrollbar styling with flexible orientation and overflow controls.

- **File:** `components/reusables/ScrollArea.tsx`
- **Props:**
  - `children: React.ReactNode` — Scrollable content.
  - `orientation?: 'vertical' | 'horizontal' | 'both'` — Scrolling axis (default `'vertical'`).
  - `hideScrollbar?: boolean` — Hides the visible scrollbar while preserving scroll functionality (default `false`).
  - `className?: string` — Tailwind class names for custom layout constraints.
- **Styling Applied:** Wraps content in custom webkit and Firefox scrollbar tokens defined in `app/globals.css`.

```tsx
import { ScrollArea } from '@/components/reusables/ScrollArea';

// Example: Vertical lane of cubicle cards
<ScrollArea orientation="vertical" className="h-[calc(100vh-180px)] pr-2">
  {cubicles.map(c => <CubicleCard key={c.id} {...c} />)}
</ScrollArea>
```

---

### 3. `NotificationBadge.tsx`
A compact notification badge supporting numeric counts, maximum thresholds, pulsing live alerts, and color token variants.

- **File:** `components/reusables/NotificationBadge.tsx`
- **Props:**
  - `count?: number` — Count to display (e.g. 5). If `count > maxCount`, displays `${maxCount}+`.
  - `maxCount?: number` — Truncation ceiling (default `99`).
  - `variant?: 'count' | 'dot'` — Whether to display numeric count or a compact dot (default `'count'`).
  - `color?: 'red' | 'blue' | 'amber' | 'emerald' | 'slate'` — Color token (default `'red'`).
  - `pulse?: boolean` — Applies `.phc-badge-pulse` animation for live real-time events.
- **Usage Example:**

```tsx
import { NotificationBadge } from '@/components/reusables/NotificationBadge';

// Example: Room card showing live waiting patients
<div className="flex items-center gap-2">
  <span>Room 4</span>
  {queuedCount > 0 && (
    <NotificationBadge count={queuedCount} color="red" pulse />
  )}
</div>
```

---

## 3. Transfer & Drag-and-Drop Primitives

### 1. `DragHandle.tsx`
Accessible touch grip handle attached to draggable cards.
- **Data Attribute:** `data-drag-handle="true"`.
- **Purpose:** On mobile and touch tablets, touching the general card area initiates page scrolling; touching the designated `DragHandle` initiates patient card drag operations without conflicting with native scroll gestures.

### 2. `DragGhost.tsx`
A high-performance portal component rendered into `document.body`.
- **Props:**
  - `patient: Patient | null` — Currently dragged patient record.
  - `point: { x: number; y: number } | null` — Real-time pointer coordinates.
  - `originDescription: string | null` — Station or queue origin text.
  - `isValidDropTarget: boolean` — Highlights card green/red based on drop eligibility.
- **Purpose:** Detaches the preview card from the component hierarchy so it can float over headers, sidebars, and scrolling containers without being clipped by parent `overflow: hidden` boundaries.

---

## 4. Custom CSS Animation Utilities (`app/globals.css`)

The following utilities are defined in `app/globals.css` to provide consistent hospital UI feedback:

| Class | Purpose | Visual Behavior |
|---|---|---|
| `.phc-scroll` | Shared clinical scrollbar | 6px track, smooth rounded thumb, subtle hover darkening |
| `.phc-ghost` | Floating drag preview | 5° tilt, elevated drop shadow, semi-transparency |
| `.phc-dropzone` | Valid drop target indicator | Dashed red/blue border with animated pulsing glow |
| `.phc-drop-pop` | Successful drop feedback | Subtle scale pop (1.04x) on patient assignment |
| `.phc-shake` | Invalid drop feedback | Brief horizontal oscillation when dropping on full/invalid station |
| `.phc-badge-pulse`| Live queue alert | Pulsing outer ring radiating from badge |

---

## 5. Architectural Standards Enforcement (`AGENTS.md`)

When adding new components to Heart Check PHC, developers must adhere to the following checklist:
1. **No Hardcoded Copy:** Extract all strings to `<feature>Texts.ts`.
2. **No Inline Styling Bloat:** Extract CSS properties and token maps to `<feature>.ts`.
3. **Comprehensive JSDoc:** File-level overview and symbol-level `@param`, `@returns`, and `@remarks` annotations.
4. **Touch-Safe Targets:** All interactive buttons and handles must have a minimum hit target of 44×44px.
