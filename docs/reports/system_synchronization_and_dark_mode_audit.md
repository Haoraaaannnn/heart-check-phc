# System Synchronization, Database Integrity, and Dark Mode Audit

**Last Updated:** 2026-10-22

Comprehensive architectural diagnosis and step-by-step remediation guide for system-wide service catalog desynchronization, real-time database state propagation gaps, and dark mode visual defects in Heart Check PHC.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Visual Defects Diagnosis (User Screenshots Analysis)](#2-visual-defects-diagnosis-user-screenshots-analysis)
   - [Screenshot 1: PHC Transfer Baseline View](#screenshot-1-phc-transfer-baseline-view)
   - [Screenshot 2: System Notifications Dropdown Glare & Contrast Defect](#screenshot-2-system-notifications-dropdown-glare--contrast-defect)
   - [Screenshot 3: Nurse FinishedDrawer Light Header Regression](#screenshot-3-nurse-finisheddrawer-light-header-regression)
3. [Problem Area 1: System-Wide Services Desynchronization](#3-problem-area-1-system-wide-services-desynchronization)
   - [Root Cause: Unconstrained String Coupling & Static Hardcoding](#root-cause-unconstrained-string-coupling--static-hardcoding)
   - [Module-by-Module Discrepancy Breakdown](#module-by-module-discrepancy-breakdown)
   - [Where to Edit: Services Synchronization](#where-to-edit-services-synchronization)
4. [Problem Area 2: Dark Mode Class Failures & Color Defaults](#4-problem-area-2-dark-mode-class-failures--color-defaults)
   - [Root Cause: Uncompiled Tailwind v4 Arbitrary Opacities & Token Misconfiguration](#root-cause-uncompiled-tailwind-v4-arbitrary-opacities--token-misconfiguration)
   - [Audit of Missing Dark Mode Classes Across Modules](#audit-of-missing-dark-mode-classes-across-modules)
   - [Where to Edit: Dark Mode Fixes](#where-to-edit-dark-mode-fixes)
5. [Problem Area 3: Database Synchronization & Realtime Event Gaps](#5-problem-area-3-database-synchronization--realtime-event-gaps)
   - [Realtime Channel Coverage Matrix](#realtime-channel-coverage-matrix)
   - [Registration Counter Hardcoded Filtering Bug](#registration-counter-hardcoded-filtering-bug)
   - [Nurse Station Cubicle Cache Invalidation Staleness](#nurse-station-cubicle-cache-invalidation-staleness)
   - [Dashboard Broken Route Link (`/dashboard/servicesPHC`)](#dashboard-broken-route-link-dashboardservicesphc)
   - [Where to Edit: Database Synchronization](#where-to-edit-database-synchronization)
6. [Phased Action Plan & Verification Roadmap](#6-phased-action-plan--verification-roadmap)
   - [Phase 1: Immediate UI & Dark Mode Repair (Zero Risk)](#phase-1-immediate-ui--dark-mode-repair-zero-risk)
   - [Phase 2: Database Query & Filter Hardcoding Removal](#phase-2-database-query--filter-hardcoding-removal)
   - [Phase 3: Realtime Subscription Coverage Expansion](#phase-3-realtime-subscription-coverage-expansion)
   - [Phase 4: Schema Integrity Hardening & Cascading Updates](#phase-4-schema-integrity-hardening--cascading-updates)
7. [Compliance & Pre-Completion Verification Checklist](#7-compliance--pre-completion-verification-checklist)

---

## 1. Executive Summary

A comprehensive architectural scan of the Heart Check PHC codebase was conducted to evaluate system-wide synchronization between the PostgreSQL database and operational client modules (Kiosk, Transfer Workstation, Nurse Kanban Board, Admin Dashboard, Superadmin Control Center, and Public TV Monitors).

The scan confirmed three primary categories of operational defects:
1. **Services Desynchronization:** While the PostgreSQL `services` table supports dynamic administration (bilingual labels, queue prefixes, routing flags, and capability checkboxes), multiple operational modules continue to rely on hardcoded arrays (e.g. `['Consultation', 'OPD Screening']` in `app/transfer/page.tsx:247`), static fallback constants (`lib/facilities.ts`), and unlinked text columns without cascading foreign key relationships.
2. **Dark Mode Inconsistencies:** Specific UI components display light-mode default colors or glaring white backgrounds in dark mode. The root causes are:
   - Tailwind CSS v4 arbitrary opacity modifier compilation failures on custom hex colors (`dark:bg-[#141414]/90` in `FinishedDrawer.tsx:66` and `dark:bg-blue-950/30` in `notificationStyles.ts:53`).
   - Inverse dark token assignment (`filterPillActive` using `dark:bg-white dark:text-slate-900` creating an intense white rectangle in dark mode).
   - Incomplete dark mode support on Public TV Monitor pages (`app/monitor/`).
3. **Database Realtime Propagation Gaps:** Only the Transfer Sidebar currently listens for database changes on the `services` table. Changes to `services`, `cubicle`, `counters`, or `doctors` in the Superadmin console fail to propagate to active screens without a manual page refresh.

---

## 2. Visual Defects Diagnosis (User Screenshots Analysis)

### Screenshot 1: PHC Transfer Baseline View

- **Context:** The PHC Transfer workstation (`/transfer`) running in dark mode with active queue ticket `5005` (Consultation - Adult #1), registration counters 1 through 5, and consultation cubicles R5 C1 through R5 C5.
- **Findings:**
  - Base theme tokens (`bg-slate-50 dark:bg-[#0d0d0d]`, top header `dark:bg-[#141414]`, panels `dark:bg-[#1a1a1a]`) function properly.
  - Registration counters display ticket `5005` at Counter 1.
  - Breadcrumb navigation and action buttons adhere to enterprise styling standards.

### Screenshot 2: System Notifications Dropdown Glare & Contrast Defect

- **Context:** Notification dropdown opened from the header bell icon on the Transfer workstation.
- **Defects Identified:**
  1. **Active Filter Tab White Glare:** The active category filter tab (`Alerts (1)`) renders as a solid, blinding white rounded rectangle (`bg-white`).
     - **Location:** [notificationStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/notificationStyles.ts#L37-L38)
     - **Mechanism:** `filterPillActive` contains `'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'`. In dark mode, setting `dark:bg-white` completely breaks dark mode ergonomics and causes severe contrast dissonance.
  2. **Info Notifications Display Baby-Blue Light Theme:** The bottom four notifications (`[Info] Available Clinical Station`) render with a bright light baby-blue background (`bg-blue-50/80`) rather than a muted dark surface.
     - **Location:** [notificationStyles.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/notificationStyles.ts#L53)
     - **Mechanism:** `card.info` uses `'bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600'`. In Tailwind CSS v4, the arbitrary opacity class `dark:bg-blue-950/30` was not generated into `.next/dev/static/css/app/layout.css` (only `/40` existed from `NurseHeader.tsx`). The light-mode class `bg-blue-50/80` applied unconditionally, rendering white/light text against a bright blue card.

### Screenshot 3: Nurse FinishedDrawer Light Header Regression

- **Context:** Nurse Station (`/nurse`) with the "Finished Today" slide-over ledger open.
- **Defects Identified:**
  1. **Solid Cream/Light-Gray Header Banner:** The top header of the Finished Today drawer (`Finished Today [0]`, `Close Ledger`) renders with a glaring light cream/slate background (`bg-slate-50/80`), while the drawer body and footer render dark (`#1a1a1a` and `#141414`).
     - **Location:** [FinishedDrawer.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/components/FinishedDrawer.tsx#L66)
     - **Mechanism:** The drawer header declares `className="... bg-slate-50/80 dark:bg-[#141414]/90 backdrop-blur-xs shrink-0"`. Tailwind CSS v4 does not compile arbitrary fractional opacities on raw hex values (`dark:bg-[#141414]/90`). Consequently, `dark:bg-[#141414]/90` did not exist in the generated stylesheet, causing `bg-slate-50/80` to render in both light and dark modes. In contrast, the drawer footer on line 102 uses standard `dark:bg-[#141414]` without opacity and renders correctly.

---

## 3. Problem Area 1: System-Wide Services Desynchronization

### Root Cause: Unconstrained String Coupling & Static Hardcoding

In the database, the `services` table contains full metadata (`id`, `label_en`, `label_fil`, `queue_prefix`, `display_order`, `requires_registration`, `has_subcategories`, `requires_cubicle`, `requires_nurse`, `show_on_monitor`, `auto_assign`, `monitor_layout`).

However, other tables reference services purely as unconstrained text strings rather than foreign keys:
- `patients.service`: VARCHAR/TEXT storing English name (e.g., `'Consultation'`, `'ECG'`).
- `cubicle.category`: VARCHAR/TEXT storing English name (e.g., `'Consultation'`).
- `user_services.service`: VARCHAR/TEXT storing English name.
- `user_rooms.service`: VARCHAR/TEXT storing English name.
- `app_settings.queue_prefix_map`: JSON string blob storing an array of `{ service, subcategory, prefix, room }`.

When a service is renamed, inserted, or deleted in Superadmin Customization:
1. Existing patient tickets remain tied to the old string.
2. Existing cubicles in the `cubicle` table remain under the old category string.
3. User assignments in `user_services` remain under the old category string.
4. `queue_prefix_map` in `app_settings` is not updated.

### Module-by-Module Discrepancy Breakdown

1. **Nurse Station (`app/nurse/`):**
   - [NurseSidebar.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/components/NurseSidebar.tsx#L64-L71) derives service categories strictly by grouping `assignedCubicles` from the `cubicle` table.
   - It **never queries the `services` table**.
   - It does not check `requires_nurse`. If an administrator creates a service that does not yet have physical cubicles configured, it is completely invisible in the Nurse Station.
2. **Transfer Registration Counters (`app/transfer/page.tsx`):**
   - Line 247 hardcodes: `.in('service', ['Consultation', 'OPD Screening'])`.
   - If an admin creates a custom service and marks `requires_registration = true`, patients for that service will **never be fetched or displayed** at Registration Counters 1 to 5.
3. **Admin Dashboard Navigation (`app/dashboard/constants/navigation.ts`):**
   - Lines 241-249 hardcode 8 legacy service links pointing to `${SERVICES_BASE}/consultation`, `${SERVICES_BASE}/opdCard`, etc.
   - `SERVICES_BASE` is defined as `'/dashboard/servicesPHC'`. This route directory does not exist in the project, resulting in broken 404 navigation when dynamic services fail to load.
4. **Superadmin Queue Prefix Map (`app/superadmin/components/QueuePrefixPanel.tsx`):**
   - Lines 76-86 define a static `DEFAULT_ROWS` array of 9 services.
   - When new services are added in the Customization panel, they do not appear in the Queue Prefix mapping interface until manually added or unless dynamically synced from `services`.
5. **Superadmin Rooms Panel (`app/superadmin/components/RoomsPanel.tsx`):**
   - Line 20 imports `SERVICES` from `lib/facilities.ts`.
   - Line 72 initializes state with `const [fCategory, setFCategory] = useState(SERVICES[0])`.
   - While it fetches from `services` in a `useEffect`, any failure or delay renders the static 8-item array from `lib/facilities.ts`.
6. **Public TV Monitors (`app/monitor/page.tsx`):**
   - Lines 25-36 define a static `DEFAULT_CATEGORIES` list of 9 services.
   - It fetches `services` on initial mount but has **zero realtime subscription**. If an admin reorders or renames services, the monitor screen stays out of date until a browser reload.

### Where to Edit: Services Synchronization

| File | Lines | Problem Description | Proposed Solution |
| :--- | :--- | :--- | :--- |
| [`app/transfer/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/page.tsx#L247) | 247 | Hardcoded `.in('service', ['Consultation', 'OPD Screening'])` ignores `requires_registration` column. | Fetch services where `requires_registration = true`, extract labels, and pass dynamic array to `.in('service', registrationServiceLabels)`. |
| [`app/nurse/hooks/useNurseData.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/hooks/useNurseData.ts#L170-L215) | 170-215 | Nurse only loads categories present in `cubicle` table; does not reconcile with `services`. | Query `services` where `requires_nurse = true` to validate valid clinical categories, and populate empty service categories. |
| [`app/dashboard/constants/navigation.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/navigation.ts#L33-L34) | 33-34, 240-250 | Hardcoded links to non-existent `/dashboard/servicesPHC/*` routes. | Remove dead `SERVICES_BASE` routes; route service links to `/dashboard/pages/patients?service=${encodeURIComponent(svc.label_en)}`. |
| [`app/superadmin/components/QueuePrefixPanel.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/superadmin/components/QueuePrefixPanel.tsx#L76-L86) | 76-86 | Static `DEFAULT_ROWS` array does not include custom services from database. | Load services dynamically from `services` table and merge missing rows into the queue prefix matrix. |
| [`app/superadmin/customization/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/superadmin/customization/page.tsx#L180-L220) | 180-220 | Editing or deleting a service does not cascade updates to `cubicle`, `user_services`, or `patients`. | Add cascading update/validation logic or a database migration trigger linking `services` table edits to dependent tables. |
| [`lib/facilities.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/lib/facilities.ts#L1-L7) | 1-7 | Hardcoded `SERVICES` and `SERVICES_WITH_SUBCATEGORIES` constants serve as stale fallbacks. | Deprecate static array; provide async helper `fetchActiveServices()` with dynamic database fallback. |

---

## 4. Problem Area 2: Dark Mode Class Failures & Color Defaults

### Root Cause: Uncompiled Tailwind v4 Arbitrary Opacities & Token Misconfiguration

In Tailwind CSS v4, arbitrary opacity modifiers combined with custom hex values or dynamically constructed classes (e.g., `dark:bg-[#141414]/90`, `dark:bg-blue-950/30`) are not consistently compiled unless explicitly detected during the static scanning phase.

Furthermore, in `app/dashboard/constants/notificationStyles.ts`, the `filterPillActive` class was given `dark:bg-white dark:text-slate-900`, inverting the color scheme so that dark mode rendered a solid white card.

### Audit of Missing Dark Mode Classes Across Modules

1. **System Notifications Dropdown (`app/dashboard/constants/notificationStyles.ts`):**
   - `filterPillActive`: `dark:bg-white dark:text-slate-900` causes blinding glare in dark mode.
   - `card.info`: `dark:bg-blue-950/30` uncompiled by Tailwind v4; falls back to light `bg-blue-50/80`.
2. **Nurse FinishedDrawer (`app/nurse/components/FinishedDrawer.tsx`):**
   - Line 66: `bg-slate-50/80 dark:bg-[#141414]/90 backdrop-blur-xs` header failed to compile dark variant; falls back to light `bg-slate-50/80`.
   - Line 89: Close button uses `hover:bg-slate-200/60` and `dark:hover:bg-[#242424]`, but text color lacks contrast against the light header.
3. **Public TV Monitor System (`app/monitor/`):**
   - [app/monitor/page.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/page.tsx#L111): Lines 111, 125, 136, 157 declare raw `bg-gray-50`, `bg-white`, `border-gray-100`, and `text-gray-700` without any `dark:` variants.
   - [app/monitor/[category]/page.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/%5Bcategory%5D/page.tsx#L99): Lines 99, 109, 123 declare `min-h-screen bg-white font-sans` unconditionally.
   - [RegistrationLayout.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/components/RegistrationLayout.tsx#L126): Lines 126, 151 use `bg-gray-50` and `bg-white` without dark mode support.
   - [TableLayout.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/components/TableLayout.tsx#L55): Lines 55, 86 use `bg-gray-50` and `bg-white` without dark mode support.
   - [PairedLayout.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/components/PairedLayout.tsx#L52): Line 52 uses `bg-gray-50` without dark mode support.
4. **Nurse Header Action Buttons (`app/nurse/components/NurseHeader.tsx`):**
   - Lines 129, 143, 269: Icon buttons declare `hover:bg-slate-100` without explicit `dark:hover:bg-[#242424]`, resulting in light gray hover flashes when in dark mode.
5. **Superadmin Counters Panel (`app/superadmin/components/CountersPanel.tsx`):**
   - Line 190: Counter input field declares `focus:bg-white` without explicit `dark:focus:bg-[#1f1f1f]`.

### Where to Edit: Dark Mode Fixes

| File | Line | Current Code | Fixed Code |
| :--- | :--- | :--- | :--- |
| [`app/nurse/components/FinishedDrawer.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/components/FinishedDrawer.tsx#L66) | 66 | `className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#2e2e2e] bg-slate-50/80 dark:bg-[#141414]/90 backdrop-blur-xs shrink-0"` | `className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#141414] shrink-0"` |
| [`app/dashboard/constants/notificationStyles.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/notificationStyles.ts#L38) | 38 | `filterPillActive: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'` | `filterPillActive: 'bg-slate-900 text-white dark:bg-[#cc3535] dark:text-white shadow-2xs'` |
| [`app/dashboard/constants/notificationStyles.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/notificationStyles.ts#L53) | 53 | `info: 'bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600'` | `info: 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 dark:border-blue-500'` |
| [`app/nurse/components/NurseHeader.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/components/NurseHeader.tsx#L129) | 129, 143, 269 | `hover:bg-slate-100 active:bg-slate-200` | `hover:bg-slate-100 dark:hover:bg-[#242424] active:bg-slate-200 dark:active:bg-[#2e2e2e]` |
| [`app/monitor/[category]/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/%5Bcategory%5D/page.tsx#L99) | 99, 109, 123 | `min-h-screen bg-white font-sans` | `min-h-screen bg-white dark:bg-[#0d0d0d] text-slate-800 dark:text-[#f5f5f5] font-sans` |
| [`app/monitor/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/page.tsx#L111) | 111, 136 | `min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12` | `min-h-screen bg-slate-50 dark:bg-[#0d0d0d] flex flex-col items-center justify-center gap-8 p-12` |
| [`app/monitor/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/page.tsx#L125) | 125, 157 | `bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left cursor-pointer` | `bg-white dark:bg-[#1a1a1a] border-2 border-slate-100 dark:border-[#2e2e2e] hover:border-[#cc3535] text-slate-700 dark:text-[#f5f5f5] rounded-3xl p-6 font-semibold text-sm shadow-sm transition text-left cursor-pointer` |

---

## 5. Problem Area 3: Database Synchronization & Realtime Event Gaps

### Realtime Channel Coverage Matrix

The audit inspected all `supabase.channel(...)` calls across the entire client codebase to determine which tables have live WebSocket synchronization.

| Database Table | Subscribed in Transfer | Subscribed in Nurse | Subscribed in Monitor | Subscribed in Dashboard | Subscribed in Superadmin | Impact of Missing Subscription |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `patients` | Yes (`patients-queue`) | Yes (`patients-nurse-realtime`) | Yes (`channelName`) | Yes (`realtime:system-notifications`) | No | Patient movements, queue progression, and status updates synchronize well in primary workflows. |
| `services` | Yes (`transfer-sidebar-services`) | **No** | **No** | **No** | **No** | Adding, editing, or reordering services in Superadmin requires a manual page reload on Nurse, Monitor, and Dashboard screens. |
| `cubicle` | **No** | **No** | **No** | **No** | **No** | Adding or renaming cubicles in Superadmin does not update Transfer station bays, Nurse columns, or Monitor paired layouts. |
| `counters` | **No** | **No** | **No** | **No** | **No** | Toggling counter status (Active/Inactive) does not dynamically refresh Transfer registration bays or Monitor display. |
| `doctors` | **No** | **No** | **No** | **No** | **No** | Adding doctors or toggling duty status does not automatically update Doctor Modals or Station Bay assignments. |
| `app_settings` | Yes (`max-rotations`, `rotate-timeout`) | **No** | **No** | **No** | **No** | Queue prefix map changes or operational thresholds are only live-synced in Transfer rotation hooks. |

### Registration Counter Hardcoded Filtering Bug

In [app/transfer/page.tsx](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/page.tsx#L247):
```typescript
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .in('service', ['Consultation', 'OPD Screening'])
  .not('counter', 'is', null)
  .is('reg_end', null)
  .neq('status', 'Assigned')
  .neq('status', 'Idle')
  .neq('status', 'Removed')
  .gte('created_at', today.toISOString())
  .lt('created_at', tomorrow.toISOString())
  .order('counter', { ascending: true, nullsFirst: false })
  .order('created_at', { ascending: true });
```
- **Problem:** Patients who register at the Kiosk for any service other than `'Consultation'` or `'OPD Screening'` will never be returned by this query, even if the service has `requires_registration = true` in the `services` table.
- **Fix:** Query the `services` table for all records where `requires_registration = true`, map to their `label_en` strings, and pass that dynamic array to `.in('service', registrationServiceLabels)`.

### Nurse Station Cubicle Cache Invalidation Staleness

In [useNurseData.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/hooks/useNurseData.ts#L84-L85):
- `cachedCubicleNumsRef` stores cubicle numbers in a React ref to prevent redundant database queries during polling cycles.
- However, there is no listener for changes to `cubicle` or `user_cubicles`.
- If a Superadmin assigns a new cubicle to a nurse while they are working, the nurse's screen will never fetch patients for that new cubicle until they perform a hard browser refresh.
- **Fix:** Add a Supabase Realtime channel listening to `user_cubicles` (for standard nurses) and `cubicle` (for admins) that calls `refreshCubicles()` upon `INSERT`, `UPDATE`, or `DELETE`.

### Dashboard Broken Route Link (`/dashboard/servicesPHC`)

In [app/dashboard/constants/navigation.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/constants/navigation.ts#L33):
- `SERVICES_BASE = '/dashboard/servicesPHC'` points to a non-existent route.
- If the dynamic service fetch fails or while loading, clicking any service in the sidebar navigates to a 404 page.
- **Fix:** Remove the dead `/dashboard/servicesPHC` route and configure links to navigate to the canonical Patients table filtered by query parameter: `/dashboard/pages/patients?service=${encodeURIComponent(label)}`.

### Where to Edit: Database Synchronization

| File | Lines | Problem Description | Proposed Solution |
| :--- | :--- | :--- | :--- |
| [`app/transfer/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/page.tsx#L244-L257) | 244-257 | Registration query uses hardcoded service list. | Replace hardcoded array with dynamic list of services where `requires_registration = true`. |
| [`app/nurse/hooks/useNurseData.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/nurse/hooks/useNurseData.ts#L123-L215) | 123-215 | `cachedCubicleNumsRef` never clears on database mutations. | Add realtime listener on `user_cubicles` and `cubicle` to trigger `getMyCubicleNums(true)`. |
| [`app/monitor/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/monitor/page.tsx#L52-L85) | 52-85 | Missing realtime subscription for `services`. | Add Supabase Realtime channel on table `services` to trigger `fetchServices()` automatically. |
| [`app/dashboard/components/navigation/DashSideNavigation.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/dashboard/components/navigation/DashSideNavigation.tsx#L51-L61) | 51-61 | Missing realtime subscription for `services`. | Add Supabase Realtime channel on table `services` to update `dynamicServices` state. |
| [`app/transfer/components/Sidebar.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/transfer/components/Sidebar.tsx#L80-L93) | 80-93 | Only listens to `services`, but not `cubicle` or `counters`. | Expand realtime channel or add companion listener for `cubicle` and `counters`. |

---

## 6. Phased Action Plan & Verification Roadmap

### Phase 1: Immediate UI & Dark Mode Repair (Zero Risk)

1. **Fix FinishedDrawer Header:**
   - In `app/nurse/components/FinishedDrawer.tsx:66`, replace `bg-slate-50/80 dark:bg-[#141414]/90 backdrop-blur-xs` with `bg-slate-50 dark:bg-[#141414]`.
   - Result: Drawer header matches the dark theme of the footer and body.
2. **Fix Notification Dropdown Dark Mode Styles:**
   - In `app/dashboard/constants/notificationStyles.ts:38`, change `filterPillActive` from `dark:bg-white dark:text-slate-900` to `dark:bg-[#cc3535] dark:text-white` (or `dark:bg-slate-700 dark:text-white`).
   - In `app/dashboard/constants/notificationStyles.ts:53`, change `card.info` from `dark:bg-blue-950/30` to `dark:bg-blue-950/40 border-l-4 border-blue-600 dark:border-blue-500`.
   - Result: Active filter tabs no longer flash white; Info cards display clean, readable dark-blue surfaces.
3. **Fix Monitor Dark Mode Classes:**
   - In `app/monitor/page.tsx` and `app/monitor/[category]/page.tsx`, replace raw `bg-white` and `bg-gray-50` with responsive tokens `bg-white dark:bg-[#0d0d0d]`, `bg-slate-50 dark:bg-[#141414]`, and text `text-slate-800 dark:text-[#f5f5f5]`.

### Phase 2: Database Query & Filter Hardcoding Removal

1. **Dynamic Registration Counter Query:**
   - In `app/transfer/page.tsx:247`, replace `.in('service', ['Consultation', 'OPD Screening'])` with dynamic array derived from `services.filter(s => s.requires_registration).map(s => s.label_en)`.
2. **Fix Broken Dashboard Service Links:**
   - In `app/dashboard/constants/navigation.ts`, remove `/dashboard/servicesPHC/*` and map fallback service items directly to `/dashboard/pages/patients?service=${encodeURIComponent(svc.label)}`.
3. **Dynamic Queue Prefix Map Defaults:**
   - In `app/superadmin/components/QueuePrefixPanel.tsx`, fetch available services from the `services` table and dynamically append any newly created services into the prefix configuration table.

### Phase 3: Realtime Subscription Coverage Expansion

1. **Unify Realtime Services Listener:**
   - Create a reusable hook `useServicesSubscription` or attach listeners in `NurseSidebar`, `DashSideNavigation`, and `MonitorPage` so that when a service is added, renamed, or reordered in Superadmin, all workstations reflect the change immediately.
2. **Cubicle & Counter Realtime Sync:**
   - Add a lightweight channel listener on `cubicle` in `useNurseData` and `useTransferData` so newly created rooms or doctor reassignments display live without requiring page reloads.

### Phase 4: Schema Integrity Hardening & Cascading Updates

1. **Database Consistency Migration:**
   - Write a PostgreSQL migration or Supabase trigger:
     - When `services.label_en` is updated, automatically cascade the name change to `cubicle.category`, `patients.service`, and `user_services.service`.
     - Alternatively, introduce a non-breaking `service_id` integer foreign key on `patients`, `cubicle`, and `user_services`.

---

## 7. Compliance & Pre-Completion Verification Checklist

- [ ] Zero emojis verified across all documentation, comments, and strings (Rule 6).
- [ ] ISO date stamp (`2026-10-22`) verified on all markdown documents (Rule 13).
- [ ] Strict separation of concerns verified: all copy in `*Texts.ts`, all styles in `*Styles.ts` or semantic CSS variables (Rule 2).
- [ ] Solid surfaces standard verified: 1px crisp borders, zero blurry glassmorphism (`backdrop-blur-xs` removed) (Rule 10).
- [ ] Zero text truncation verified: `break-words` and `whitespace-normal` preserved on all clinical and operational copy (Rule 11).
- [ ] Security-first mandate verified: all database mutations use parameterized queries and enforce `is_historical = false` protection (Rule 12).
- [ ] No operational commands executed without explicit user authorization (Rule 7).

---
_Report prepared autonomously for Heart Check PHC architectural governance._
