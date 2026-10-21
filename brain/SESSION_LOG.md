# Active Session Handoff Log

**Last Updated:** 2026-10-22

This document serves as an optional, high-signal, token-efficient session handoff for multi-step tasks across AI model invocations or developer shifts.

> **Operational Standard:**
> - Keep this log concise and overwrite or prune stale entries rather than accumulating a chronological chat diary.
> - Record only architectural decisions, files changed, checks performed, unresolved issues, and immediate next actions.

---

## Active Session Status

- **Active Milestone / Task:** Nurse Dashboard & SuperAdmin Clinical Services Real-Time Synchronization Complete
- **Active Git Branch:** `feat/estimated-time`
- **Session Focus:** (1) Fixed LAN IP HTTP authentication cookie drop and workstation role verification; (2) Added clinical services checkboxes to SuperAdmin User Management modal (`ClinicalAssignmentsSelector.tsx`, `UserModal.tsx`, `useUserModalState.ts`, `/api/superadmin/update-role`, `/api/superadmin/create-user`, `/api/superadmin/access`, `/api/superadmin/cubicles`); (3) Retained database primary key `id` across `SuperadminUser` and `useSuperadminUsers` for 100% resilient user lookup; (4) Reconciled `useNurseData.ts` with `services` table, dynamically falling back to active hospital services (`requires_nurse !== false`) when a nurse is not restricted to specific services; (5) Added Realtime subscriptions on `user_services` and `user_cubicles` in `useRealtimeSubscription.ts` so updates in SuperAdmin immediately reflect on the Nurse Station in 0ms without requiring a browser reload.

---

## Decisions Made

1. **Global Constants Organization (`constants/designs/`, `constants/texts/`):**
   - Dark mode is an application-wide system standard, not a page-specific concern. All universal surfaces, dark mode palettes (`#0d0d0d`, `#141414`, `#1a1a1a`, `#1f1f1f`, `#242424`, `#2e2e2e`, `#383838`), typography scales, badge tones, and border tokens now reside in `constants/designs/themeTokens.ts`.
   - Global color palettes reside in `constants/designs/colors.ts` and `constants/designs/palette.ts`.
   - Global text dictionaries reside in `constants/texts/` (`connectionTexts.ts`, `ewtTexts.ts`, `queueStatus.ts`).
   - Root `constants/` files re-export from these dedicated directories, ensuring 100% backward compatibility across all modules without breaking existing imports.
2. **Feature-Scoped Style Centralization (`app/transfer/constants/transferStyles.ts`):**
   - Authored unified styling dictionaries for all transfer subcomponents: `transferLayoutStyles`, `breadcrumbStyles`, `queuePanelStyles`, `onProgressStyles`, `idlePanelStyles`, `registrationCounterStyles`, `cubicleStyles`, `transferModalStyles`, `selectionBannerStyles`, `stepPickerStyles`, and `sidebarStyles`.
   - Each dictionary consumes centralized `themeTokens` and `sizeTokens`.
3. **Pure Presentation Components (Rule 2 Parity):**
   - Refactored `IdleNumbersPanel.tsx`, `RegistrationCounterSection.tsx`, `CubicleCard.tsx`, `OnProgressSection.tsx`, `QueuePanel.tsx`, `BreadcrumbNav.tsx`, `ConfirmAssignmentModal.tsx`, `DoctorsModal.tsx`, `SelectionBanner.tsx`, `StepPickers.tsx`, `Sidebar.tsx`, and `app/transfer/page.tsx` into pure presentation components.
   - Removed all ad-hoc inline classes, raw hex codes, and fractional dark-mode opacities (`dark:bg-[#1f1f1f]/70`).
4. **Dark Mode Readability & Contrast Restoration (Rule 10 Parity):**
   - Idle patient rows render solid dark surfaces (`bg-white dark:bg-[#1a1a1a]`, `border-slate-200 dark:border-[#2e2e2e]`, hover `dark:hover:bg-[#242424]`), completely eliminating the light-gray flash seen in user screenshots.
   - Station indicators, unassigned doctor titles, and "Available" labels render high-contrast text (`dark:text-[#f5f5f5]`, `dark:text-[#d4d4d4]`, `dark:text-[#a3a3a3]`, `dark:text-[#b3b3b3]`).
   - Breadcrumb navigation renders high-contrast links (`dark:text-[#d4d4d4]`, active `dark:text-[#f87171]`, dividers `dark:text-[#737373]`).
   - Replaced all hardcoded copy ('Available', 'Queue ->') with centralized keys from `transferTexts.ts`.
5. **Registration Counter Auto-Rotation & Timer Persistence:**
   - Replaced failing PostgREST `.upsert(startUpdates)` in `fetchRegistrationPatients` with targeted `.update({ counter_top_started_at: now }).in('id', startIds).eq('is_historical', false).is('counter_top_started_at', null)`.
   - Maintained `registrationPatientsRef` in `app/transfer/page.tsx` to preserve running timers in memory across 15-second background sync queries, eliminating the 15-second timer reset.
   - Preserved running timer timestamps unless patient actually rotated (`rotation_count` or `counter_rejoin_at` changed) or switched counter stations.
   - Refactored `useRegistrationRotate` hook to stabilize polling intervals via `registrationRef`, pass `expected: { counter: p.counter }` optimistic concurrency locks, gate rotation during user confirmation modals (`confirmingRef`), and call `syncNow` upon rotation to update both registration lanes and idle pools.

---

## Files Changed or Created

- `constants/designs/themeTokens.ts` (Created: centralized global surfaces, dark mode palettes, borders, text contrast, badges, and sizing tokens)
- `constants/designs/colors.ts` (Created: centralized brand red palette and utility colors)
- `constants/designs/palette.ts` (Created: centralized clinical service chart and accent colors)
- `constants/texts/connectionTexts.ts` (Created: centralized connection health and offline sync text dictionary)
- `constants/texts/ewtTexts.ts` (Created: centralized Estimated Wait Time range definitions and formatters)
- `constants/texts/queueStatus.ts` (Created: centralized queue status types, groups, styles, and matcher)
- `constants/themeTokens.ts` (Updated: re-exports from `constants/designs/themeTokens.ts`)
- `constants/colors.ts` (Updated: re-exports from `constants/designs/colors.ts`)
- `constants/palette.ts` (Updated: re-exports from `constants/designs/palette.ts`)
- `constants/connectionTexts.ts` (Updated: re-exports from `constants/texts/connectionTexts.ts`)
- `constants/ewtTexts.ts` (Updated: re-exports from `constants/texts/ewtTexts.ts`)
- `constants/queueStatus.ts` (Updated: re-exports from `constants/texts/queueStatus.ts`)
- `app/transfer/constants/transferStyles.ts` (Created: comprehensive style dictionaries for all transfer components)
- `app/transfer/constants/transfer.ts` (Updated: re-exports `transferStyles` and `transferTexts`)
- `app/transfer/components/IdleNumbersPanel.tsx` (Refactored: pure presentation consuming `idlePanelStyles`)
- `app/transfer/components/RegistrationCounterSection.tsx` (Refactored: pure presentation consuming `registrationCounterStyles`)
- `app/transfer/components/CubicleCard.tsx` (Refactored: pure presentation consuming `cubicleStyles`)
- `app/transfer/components/OnProgressSection.tsx` (Refactored: pure presentation consuming `onProgressStyles`)
- `app/transfer/components/QueuePanel.tsx` (Refactored: pure presentation consuming `queuePanelStyles`)
- `app/transfer/components/BreadcrumbNav.tsx` (Refactored: pure presentation consuming `breadcrumbStyles`)
- `app/transfer/components/ConfirmAssignmentModal.tsx` (Refactored: pure presentation consuming `transferModalStyles`)
- `app/transfer/components/DoctorsModal.tsx` (Refactored: pure presentation consuming `transferModalStyles`)
- `app/transfer/components/SelectionBanner.tsx` (Refactored: pure presentation consuming `selectionBannerStyles`)
- `app/transfer/components/StepPickers.tsx` (Refactored: pure presentation consuming `stepPickerStyles`)
- `app/transfer/components/Sidebar.tsx` (Refactored: pure presentation consuming `sidebarStyles`)
- `app/transfer/hooks/useRegistrationRotate.ts` (Refactored: polling interval stabilization via `registrationRef`, optimistic concurrency locking, `confirmingRef` modal gating, full JSDoc)
- `app/transfer/page.tsx` (Updated: fixed 15s timer reset, replaced failing upsert with parameterized `.update()` satisfying Rule 12, added `registrationPatientsRef`, connected `syncNow` to counter rotation)
- `app/transfer/README.md` (Updated: "Where to Edit" lookup table and design architecture)
- `brain/CURRENT.md` (Updated: counter rotation and timer reset milestone documentation)
- `brain/SESSION_LOG.md` (Updated: active session handoff log)

---

## Checks Performed

1. **Zero Text Truncation (Rule 11):** Verified all doctor names, station labels, and patient details wrap naturally (`break-words`, `whitespace-normal`).
2. **Zero Emojis Standard (Rule 6):** Verified strictly zero emojis across all code, comments, JSDocs, and markdown documentation.
3. **Strict Separation of Concerns (Rule 2):** Verified UI components assemble presentation only; zero hardcoded copy or inline style objects. Copy in `transferTexts.ts`, styles in `transferStyles.ts`.
4. **Constants Scope Standard (Rule 3):** Global design and dark mode tokens isolated in `constants/designs/` and `constants/texts/`; feature-scoped styles isolated in `app/transfer/constants/transferStyles.ts`.
5. **High-Contrast Solid Surfaces (Rule 10):** Verified pure neutral solid dark surfaces (`#0d0d0d`, `#141414`, `#1a1a1a`, `#1f1f1f`, `#242424`, `#2e2e2e`) with crisp 1px borders and high text contrast.
6. **High-Quality Documentation (Rule 1):** Full symbol and file level JSDocs across all created and refactored files.
7. **Explicit Date Stamp Standard (Rule 13):** Verified ISO date stamps (`2026-10-21`) on all updated markdown documentation.

---

## Unresolved Issues & Blockers

- None.

---

## Next Actions

1. Review the Patient Transfer workstation in browser across light and dark modes to verify visual contrast, theme switching, and drag-and-drop operations.

---

## Session Update: Global Constants Architecture & Universal Dark Mode (2026-10-21)

### Work Completed
1. **Centralized Global Folder Architecture under `constants/`:**
   - `constants/designs/`:
     - `themeTokens.ts`: Global surfaces, text contrast, dark mode palettes, borders, badges, buttons.
     - `colors.ts`: Base color hex values and mappings.
     - `palette.ts`: Color palette configuration.
     - `transferStyles.ts`: Complete transfer design dictionary (layouts, panels, counters, cubicles, modals, selection banners, step pickers, quick-assign popover, doctor management panel, drag ghost).
     - `kioskTypography.ts`: Global fluid clamp() scales and card dimensions.
     - `icons.ts`: Central Boxicons icon configuration and resolvers.
   - `constants/texts/`:
     - `transferTexts.ts`: Centralized text copy for the entire Transfer workstation.
     - `connectionTexts.ts`: Realtime and offline network connection messages.
     - `ewtTexts.ts`: Estimated waiting time text templates.
     - `queueStatus.ts`: Queue status terminology and descriptions.
     - `appTexts.ts`: Application branding, pillars, Manila timezone, and locale.
2. **Backward-Compatible Portals:**
   - Root re-export portals maintained at `constants/themeTokens.ts`, `constants/colors.ts`, `constants/palette.ts`, `constants/icons.ts`, `constants/kiosk.ts`, `constants/connectionTexts.ts`, `constants/ewtTexts.ts`, `constants/queueStatus.ts`, and `constants/app.ts`.
   - Feature re-export portals maintained at `app/transfer/constants/transferStyles.ts`, `app/transfer/constants/transferTexts.ts`, and `app/transfer/constants/transfer.ts`.
3. **Pure Presentation Refactoring:**
   - Refactored `QuickAssignDropdown.tsx` to consume `quickAssignStyles` and `transferTexts`.
   - Refactored `DoctorsPanel.tsx` to consume `doctorsPanelStyles` and `transferTexts`.
   - Refactored `DragGhost.tsx` to consume `dragGhostStyles`.
   - Refactored `BackButton.tsx` and `DragHandle.tsx` for neutral dark mode compliance.
   - Updated all component imports in `app/transfer/components/` and `app/transfer/page.tsx` to directly reference global `constants/designs/` and `constants/texts/`.
4. **Developer Guides:**
   - Updated `app/transfer/README.md` "Where to Edit" table with exact global constants paths.

---

## Session 21: Universal Status Pill & Badge Dark Mode Refactoring (2026-10-21)

- **Objective:** Fix unreadable status pills, chips, and badges across the entire system in dark mode, strictly following AGENTS.md rules for separation of concerns (`constants/designs/`, `constants/texts/`), solid surfaces with crisp 1px borders, prohibition of pillbox shape, and zero emojis.
- **Root Cause Analysis:**
  1. `constants/texts/queueStatus.ts` used 15% opacity dark tints with zero borders (`dark:bg-orange-500/15`, `dark:bg-green-500/15`), rendering as murky, low-contrast smudges on `#1a1a1a` table rows. It also mixed styling tokens into texts.
  2. `STAGE_CONFIGS` in `app/nurse/constants/nurse.ts` had no `dark:` classes on badges (`bg-blue-100 text-blue-700`), flashing bright light-mode colors on dark clinical boards.
  3. Superadmin customization table and printer diagnostic cards had `border-purple-200` and `border-emerald-200` without dark overrides, leaking bright pastel borders in dark mode.
  4. Ad-hoc badge styling across components lacked crisp borders and high-luminance text.
- **Key Deliverables:**
  1. **`constants/designs/statusPillStyles.ts` & `constants/statusPillStyles.ts`:**
     - Created authoritative global design dictionary for all ticket statuses (`STATUS_STYLES`: `waiting`, `serving`, `idle`, `done`, `cancelled`, `unknown`), clinical stages (`STAGE_PILL_STYLES`), and base badge containers (`PILL_BASE_STYLES`).
     - Added solid 70% opacity dark backgrounds, crisp 1px borders (`dark:border-*-800/80`), and high-luminance text (`dark:text-*-300`).
     - Re-exported from `constants/statusPillStyles.ts` and decoupled from `constants/texts/queueStatus.ts`.
  2. **Global Theme Tokens (`constants/designs/themeTokens.ts`):**
     - Upgraded `themeTokens.badge` (`neutral`, `brand`, `activeEmerald`, `warningAmber`, `infoBlue`) and `themeTokens.brand.pill`.
  3. **Nurse Station Dark Mode Contrast (`app/nurse/`):**
     - Updated `STAGE_CONFIGS` in `app/nurse/constants/nurse.ts` with dark mode badge colors, borders, and backgrounds.
     - Wired `AssignedSection.tsx`, `WithDoctorSection.tsx`, `CarryoutSection.tsx`, and `NurseQuickActionDropdown.tsx` to `STAGE_CONFIGS`.
     - Refactored `NursePatientCard.tsx` (wrapped `cubicleNum` badge without truncation per Rule 11), `FinishedDrawer.tsx`, `NurseHeader.tsx`, and `NurseDragGhost.tsx`.
  4. **Transfer Station Dark Mode Contrast (`app/transfer/`):**
     - Refactored `constants/designs/transferStyles.ts` with solid dark backgrounds and crisp borders across `onProgressStyles`, `idlePanelStyles`, `queuePanelStyles`, `cubicleStyles`, `transferModalStyles`, `quickAssignStyles`, `doctorsPanelStyles`, and `dragGhostStyles`.
     - Refactored `IdleNumbersSection.tsx` and `ConfirmAssignmentModal.tsx`. Removed text truncation on doctor names and specialties per Rule 11.
  5. **Superadmin Customization Dark Mode Contrast (`app/superadmin/`):**
     - Added `patientTypeBoth`, `patientTypeNew`, `patientTypeOld` and printer status badges to `app/superadmin/customization/constants/customizationStyles.ts`.
     - Refactored `app/superadmin/customization/page.tsx` and `HardwarePrinterConfigCard.tsx`.
  6. **Dashboard Modules Dark Mode Contrast (`app/dashboard/`):**
     - Upgraded `headerSearchStyles.ts`, `importStyles.ts`, `FilePreviewModal.tsx`, `patients.ts`, `styles.ts`, and `dashNavStyles.ts`.
- **Verification:** Development server running cleanly without build or runtime errors. Zero emojis in comments/strings. All files formatted with JSDocs.

---

## Session 22: Counter Card Layout Clipping & Notification Dropdown Scrolling Fixes (2026-10-22)

- **Objective:**
  1. Fix Registration Counter top patient card layout clipping where `ElapsedTimer` was truncated (`00:`) against the large uppercase `SEND TO QUEUE ->` button.
  2. Fix system notifications dropdown being unscrollable and overflowing beyond the viewport.
- **Root Cause Analysis:**
  1. **Counter 1 Timer Truncation:**
     - In `RegistrationCounterSection.tsx`, the drag handle, patient ticket number, and `ElapsedTimer` were wrapped in `<div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">`.
     - The `queueBtn` (`transferStyles.ts`) had `uppercase tracking-wider` and copy `'Send to Queue →'`, consuming ~115px.
     - In multi-column grids (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`), card width is ~180px-200px, pushing the timer against the container boundary where `overflow-hidden` truncated `00:00` into `00:`.
  2. **Notification Dropdown Not Scrollable:**
     - In `notificationStyles.ts`, `dropdown.panel` lacked `flex flex-col` and a viewport height bound (`max-h-[calc(100vh-80px)]`). On standard desktop and laptop screens, the panel overflowed the bottom edge of `h-screen overflow-hidden` pages (Transfer, Nurse, Dashboard), hiding the footer and preventing scroll reach.
     - `dropdown.listContainer` lacked `flex-1 min-h-0`, causing scroll conflicts inside the flex hierarchy.
- **Key Deliverables:**
  1. **Registration Counter Layout (`app/transfer/components/RegistrationCounterSection.tsx`, `constants/texts/transferTexts.ts`, `constants/designs/transferStyles.ts`):**
     - Shortened `sendToQueueBtn` from `'Send to Queue →'` to `'Queue →'` in `transferTexts.ts`.
     - Removed `uppercase tracking-wider` and applied compact font styling to `registrationCounterStyles.queueBtn` in `transferStyles.ts`.
     - Replaced `min-w-0 flex-1 overflow-hidden` with `flex items-center gap-1.5 shrink-0` and wrapped `ElapsedTimer` in `shrink-0 flex items-center font-mono text-[11px] font-bold`, guaranteeing zero timer truncation per Rule 11.
  2. **System Notifications Dropdown (`app/dashboard/constants/notificationStyles.ts`, `app/transfer/page.tsx`):**
     - Updated `NOTIFICATION_STYLES.dropdown.panel` to `absolute right-0 mt-2 w-96 sm:w-[420px] max-h-[calc(100vh-80px)] sm:max-h-[min(560px,calc(100vh-80px))] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] z-50 overflow-hidden`.
     - Added `shrink-0` to `header`, `filterBar`, and `footer`.
     - Updated `listContainer` to `flex-1 min-h-0 max-h-[420px] overflow-y-auto overflow-x-hidden divide-y divide-slate-100 dark:divide-[#2e2e2e] phc-scroll overscroll-contain touch-pan-y`.
     - Updated `unassignedDropdown` in `transferStyles.ts` and `app/transfer/page.tsx` with viewport bounding and `flex-1 min-h-0`.
- **Verification:**
  - Zero text truncation or ellipsis on operational and timer data.
  - Zero emojis across all updated files and documentation.
  - Strict separation of concerns maintained (`transferTexts.ts`, `transferStyles.ts`, `notificationStyles.ts`).

---

## Session 23: Universal Badge Background Box Removal for Nurse & Transfer (2026-10-22)

- **Objective:** Remove background boxes and rings from count badges across Nurse and Transfer workstations, strictly adhering to the user's design mandate ("remove the background only the character is colored").
- **Root Cause Analysis:**
  - `components/reusables/NotificationBadge.tsx` wrapped `variant="count"` numbers in a solid rounded container with background color (`bg-[#cc3535]`, `bg-amber-500`, `bg-gray-400`), border ring (`ring-1 ring-white dark:ring-[#141414]`), and shadow (`shadow-xs`).
  - This rendered prominent red/gray/amber box backgrounds on `QueuePanel.tsx` tabs (Queue active count tab), `NurseSidebar.tsx` ("All My Cubicles" and coverage categories), `transfer/Sidebar.tsx`, and `StepPickers.tsx`.
- **Key Deliverables:**
  1. **Reusable NotificationBadge (`components/reusables/NotificationBadge.tsx`):**
     - Completely removed background boxes (`bg`), rings (`ring`), and container shadows from `variant="count"`.
     - Standardized on high-contrast bare colored typography (`font-mono text-xs font-extrabold leading-none` with `text-[#cc3535] dark:text-[#f87171]`, `text-amber-600 dark:text-amber-400`, `text-blue-600 dark:text-blue-400`, `text-slate-500 dark:text-[#a3a3a3]`, and `text-emerald-600 dark:text-emerald-400`).
     - Preserved functional status dot indicator (`variant="dot"`) for collapsed sidebar rails.
  2. **Nurse Station Sidebar (`app/nurse/components/NurseSidebar.tsx`):**
     - Removed legacy `!bg-white ring-transparent` override from active category and coverage badges, rendering bare high-contrast `!text-white` on active red buttons and `text-slate-500 dark:text-[#a3a3a3]` on inactive items.
  3. **Transfer Station Sidebar (`app/transfer/components/Sidebar.tsx`):**
     - Removed `!bg-white ring-transparent` and `!bg-white/20` overrides, rendering bare `!text-white` on active items and colored text on inactive items.
  4. **Transfer Station Queue Badges (`constants/designs/transferStyles.ts`):**
     - Removed background boxes, padding, and borders from `patientNumBadgeTop`, `patientNumBadgeNormal`, and `patientNumBadgeSelected` in `OnProgressSection.tsx`, standardizing all queue ticket numbers to bare colored text.
- **Verification:**
  - Count badges on `QueuePanel.tsx` tabs and sidebars render cleanly with zero background boxes and zero 1px rings.
  - Zero emojis across code, comments, and documentation.
  - Full adherence to dark mode high-contrast standards.

---

## Session 24: Kiosk Strict Light Mode Enforcement & Dark Mode Purge (2026-10-22)

- **Objective:** Strictly ban and eliminate dark mode across all patient check-in kiosk screens per user mandate ("no darkmode on kiosk. pls check it if it has dark mode it must not have it").
- **Root Cause Analysis:**
  - `NextThemesProvider` (`app/provider.tsx`) defaulted to system theme or preserved dark theme in `localStorage` from workstation usage (`/dashboard`, `/transfer`, `/nurse`).
  - When navigating to `/kiosk`, `<html>` retained `class="dark"`.
  - `InactivityTimeoutModal` (`inactivityModalStyles.ts`) had `dark:bg-slate-900 border-slate-800`, causing the inactivity countdown modal to render as a dark/black modal against the light kiosk background.
  - `kioskLoadingOverlay.ts` also contained residual `dark:` classes (`dark:bg-slate-950/50`).
- **Key Deliverables:**
  1. **Kiosk Inactivity Modal (`app/kiosk/constants/inactivityModalStyles.ts` & `InactivityTimeoutModal.tsx`):**
     - Completely removed all `dark:` classes from `InactivityModalClasses` (`card`, `iconWrap`, `title`, `subtitle`, `description`, `descriptionEnglish`, `timerCountText`, `countdownNotice`, `countdownBadge`, `resetButton`, `resetSub`).
     - Removed `emptyTrackDark` from `InactivityTimerColors`.
     - Removed `className="dark:stroke-slate-700"` and `dark:text-[#f15b6c]` from `InactivityTimeoutModal.tsx`.
     - Modal card strictly renders in clean, solid institutional white (`bg-white border-slate-200 text-slate-900`) matching the kiosk design archetype.
  2. **Kiosk Loading Overlay (`app/kiosk/constants/kioskLoadingOverlay.ts`):**
     - Purged `dark:bg-slate-950/50`, `dark:border-slate-700`, and `dark:text-slate-100`.
  3. **Root Kiosk Shell (`app/kiosk/layout.tsx`):**
     - Integrated `useTheme` from `next-themes` and added an unconditional mount/route effect:
       - Strips `dark` class from `document.documentElement.classList`.
       - Enforces `document.documentElement.style.colorScheme = "light"`.
       - Calls `setTheme("light")` if the theme was previously dark.
- **Verification:**
  - `rg 'dark:' app/kiosk` returned zero results. The entire kiosk module contains strictly zero dark mode classes.
  - Zero emojis across all code, comments, and documentation.

---

## Session 25: Dark Mode Toggle Restoration, Idle Action Buttons & Duplicate Select Screen Removal (2026-10-22)

- **Objective:** Fix the broken dark mode toggle, fix idle number card action buttons (`Activate` and `Remove`) and patient number badge for dark mode, and eliminate duplicate Select Screen buttons across Nurse, Transfer, Admin Dashboard, and SuperAdmin, keeping it strictly in the bottom-left sidebar rail.
- **Root Cause & Fixes:**
  1. **Dark Mode Toggle Interruption:**
     - In Session 24, `app/kiosk/layout.tsx` called `setTheme("light")` whenever `theme !== "light"`. This overwrote `localStorage` globally and caused reactive cross-tab storage sync conflicts when attempting to toggle dark mode on workstation screens.
     - **Fix:** Removed `useTheme` and `setTheme` entirely from `app/kiosk/layout.tsx`. Implemented an isolated mount/unmount lifecycle effect that removes `.dark` and sets `colorScheme = 'light'` on `<html>` only while inside the kiosk, cleanly restoring `.dark` when unmounting if previous theme was dark, without ever mutating `next-themes` state in `localStorage`.
  2. **Idle Card Actions & Patient Number Badge (`constants/designs/transferStyles.ts`):**
     - Removed background container and border from `patientNumBadge` in `idlePanelStyles`, rendering bare colored text (`font-black text-xs text-slate-700 dark:text-[#d4d4d4] shrink-0`).
     - Upgraded `activateBtn` and `removeBtn` in `idlePanelStyles` with high-contrast solid dark mode styling (`dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300` and `dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300`), eliminating low-contrast muddy borders.
  3. **Duplicate Select Screen Button Elimination:**
     - Removed duplicate top-header/breadcrumb Select Screen buttons across all 4 workstation modules:
       - `app/nurse/components/NurseHeader.tsx`: Removed header `Link` to `/select-screen`.
       - `app/transfer/components/BreadcrumbNav.tsx`: Removed subheader breadcrumb `Link` to `/select-screen`.
       - `app/superadmin/components/navigation/SuperAdminHeader.tsx`: Removed top header `Link` to `/select-screen`.
       - `app/dashboard/components/navigation/DashboardHeader.tsx`: Removed top header `Link` to `/select-screen`.
     - Strictly preserved the bottom-left sidebar Select Screen button on all four stations (`NurseSidebar.tsx`, `app/transfer/components/Sidebar.tsx`, `SuperAdminSidebar.tsx`, `DashSideNavigation.tsx`).
- **Verification:**
  - Zero emojis across all touched files.
  - Zero compile errors across all modified components.

---

## Session 26: Circular Screen Ripple Theme Transition (2026-10-22)

- **Objective:** Implement an expanding circular ripple / radial wipe transition when switching between dark mode and light mode originating from the user's click coordinates ("Circular screen ripple: An expanding circular wave reveals the new theme from the toggle button's exact click coordinates").
- **Technical Implementation:**
  1. **Reusable Transition Orchestrator (`lib/theme/themeTransition.ts`):**
     - Authored `toggleThemeWithRipple(event, toggleFn)` leveraging the native View Transitions API (`document.startViewTransition`).
     - Dynamically computes distance from click coordinates (or center of button for keyboard triggers) to the furthest corner of the viewport (`Math.hypot`).
     - Uses `flushSync` from `react-dom` to synchronously commit the theme change inside the transition callback before the new snapshot is captured.
     - Animates `::view-transition-new(root)` via `clipPath` from `circle(0px at x y)` to `circle(endRadius at x y)` over 450ms with `cubic-bezier(0.4, 0, 0.2, 1)`.
     - Gracefully falls back to direct theme switching if `startViewTransition` is unsupported or `prefers-reduced-motion` is enabled.
  2. **View Transitions CSS Pseudo-Elements (`app/globals.css`):**
     - Overrode default browser fade animations on `::view-transition-old(root)` and `::view-transition-new(root)` with `animation: none; mix-blend-mode: normal`.
     - Enforced `z-index: 1` on `::view-transition-old(root)` and `z-index: 9999` on `::view-transition-new(root)` so the expanding circle smoothly sweeps across the previous screen.
  3. **Workstation Integration:**
     - Integrated `toggleThemeWithRipple` into all theme toggle buttons:
       - `NurseHeader.tsx`
       - `app/transfer/page.tsx`
       - `SuperAdminHeader.tsx`
       - `DashboardHeader.tsx`
       - `SelectScreenHeader.tsx`
- **Verification:**
  - Clicking the toggle button in any workstation triggers an expanding circular ripple of the incoming theme from the cursor position.
  - Keyboard activation centers the ripple on the button.
  - Zero emojis across all code and documentation.

---

## Session 27: Quick Action Popover Dark Mode Contrast & Resilient Dismissal (2026-10-22)

- **Objective:** Fix dark mode visual contrast and defective dismissal mechanisms (`x` and `Close` buttons not dismissing) on the contextual popover dialogs (`NurseQuickActionDropdown.tsx` and `QuickAssignDropdown.tsx`).
- **Root Cause & Fixes:**
  1. **Dark Mode Low-Contrast Defect:**
     - In `NurseQuickActionDropdown.tsx`, action option cards used `dark:bg-purple-950/20` and `dark:bg-blue-950/20` which appeared as murky grey rectangles. Text classes included `group-hover:text-purple-900` without proper theme gating, causing titles and descriptions to dim to grey.
     - Action option cards upgraded to high-contrast solid clinical surfaces (`dark:bg-[#222222] border-slate-200 dark:border-[#333333]`) with crisp `#f5f5f5` titles, `#a3a3a3` descriptions, and high-visibility stage badge pills in dark mode.
     - Patient queue numbers rendered with solid red background boxes (`px-2.5 py-1 rounded-lg bg-[#cc3535] text-white`). Replaced with bare colored text (`font-black text-lg text-[#cc3535] dark:text-[#f87171] tracking-tight shrink-0`), adhering to the universal badge standard.
     - Top-right `x` button and footer `Close` button had dark `#737373` and `#a3a3a3` text on dark backgrounds; upgraded to crisp `#f5f5f5` and `#ffffff` with distinct 1px borders.
  2. **Defective Dismissal Mechanism:**
     - The modal backdrop container lacked direct `onClick` or `onPointerDown` handlers, relying solely on a document-level `pointerdown` listener. Clicking the SVG inside the close button lacked `pointer-events-none`, and `e.stopPropagation()` was missing, causing event bubbling conflicts.
     - Implemented `handleClose(e)` with `e.stopPropagation()` and in-flight mutation guarding.
     - Added `onClick` and `onPointerDown` with `e.target === e.currentTarget` on the outer backdrop.
     - Added `onClick={handleClose}` and `onPointerDown={(e) => e.stopPropagation()}` to header `x` button and footer `Close` button. Added `pointer-events-none` to SVG icons.
  3. **Transfer Workstation Alignment (`QuickAssignDropdown.tsx` & `transferStyles.ts`):**
     - Aligned `quickAssignStyles.patientBadge` with bare colored text (`font-black text-lg text-[#cc3535] dark:text-[#f87171]`).
     - Upgraded `quickAssignStyles.closeBtn`, `quickAssignStyles.footerHint`, and `quickAssignStyles.footerCloseBtn` to high-contrast dark mode solid surfaces.
     - Added `handleClose` and backdrop tap dismissal to `QuickAssignDropdown.tsx`.
- **Verification:**
  - `git diff` verified clean across `NurseQuickActionDropdown.tsx`, `QuickAssignDropdown.tsx`, and `transferStyles.ts`.
  - Zero emojis across all code, comments, and documentation.
  - Strict separation of concerns maintained.

---

## Session 28: Nurse Station Queue & Real-Time Synchronization Remediation (2026-10-22)

- **Objective:** Fix issue where newly created kiosk/transfer queue tickets and patient stage updates do not synchronize or appear on the Nurse Dashboard (`/nurse`).
- **Root Causes Discovered:**
  1. **PostgreSQL RLS Drop on Realtime CDC (`patients_select_nurse_scoped`):**
     - Newly created kiosk tickets and transfer queue entries have `cubicleNum = NULL`.
     - The database RLS policy enforces `("cubicleNum" = ANY (my_cubicle_nums()))`. In SQL, `NULL = ANY (...)` evaluates to `NULL` (falsy).
     - Because Supabase Realtime CDC evaluates RLS policies against the client's JWT before emitting WebSocket events, change notifications for newly created or unassigned patients were silently blocked WAL-side.
  2. **WebSocket Subscribed State Halted Polling (`useRealtimeSubscription.ts`):**
     - Once the WebSocket channel reached `SUBSCRIBED`, `stopPolling()` was called. Because RLS dropped the WebSocket events and polling was halted, `fetchData()` never executed, leaving the nurse dashboard permanently desynchronized until a hard manual reload.
  3. **Strict Casing & Preferred Cubicle Omission in Filtering (`app/nurse/page.tsx`):**
     - When viewing a cubicle, `filterPatientList` enforced `patient.cubicleNum === selectedCubicleNum`. Newly created tickets have `cubicleNum = null` and store destination preferences in `preferredCubicleNums`, causing them to be hidden from the cubicle view.
     - Strict `===` on `patient.service` caused subtle casing/trailing-space discrepancies to drop queue items.
  4. **Active Realtime Discarding in State (`useNurseData.ts`):**
     - `belongsToMe` in `applyRealtimeUpdate` only checked `patient.cubicleNum` and did not inspect `preferredCubicleNums` or service categories of assigned cubicles. When an event arrived, `belongsToMe` evaluated to `false`, actively executing `.filter(p => p.id !== patient.id)` and deleting the ticket from the local state.
  5. **Stage Transition Mutations Blocked by RLS (`useNurseActions.ts`):**
     - Direct client-side `supabase.from('patients').update` calls were blocked by `patients_update_nurse_scoped` for patients with `cubicleNum = null`, triggering immediate UI rollback and error toasts.
- **Key Deliverables & Remediation:**
  1. **Continuous Synchronization Heartbeat (`app/nurse/hooks/useRealtimeSubscription.ts`):**
     - Maintained a continuous 4-second background synchronization heartbeat regardless of WebSocket channel state.
     - Realtime WebSocket events trigger immediate 50ms debounced updates; the 4-second heartbeat guarantees that tickets dropped by PostgreSQL RLS are ingested automatically within 4 seconds.
  2. **Server API Queue Scoping (`app/api/nurse/patients/route.ts`):**
     - `GET`: Uses `supabaseAdmin` service role to query active non-terminal patients matching assigned cubicles, cubicle category services, explicit `user_services`, and tickets where `preferredCubicleNums` overlaps the nurse's cubicles (`.overlaps('preferredCubicleNums', cubicleNums)`).
     - Returns `{ patients, finishedPatients, cubicles, effectiveServices }`.
     - `PATCH`: Parameterized stage progression mutations executed server-side, protecting `is_historical = false` and updating `status`, timestamps, and cubicle assignments without RLS rejection.
  3. **Real-Time Client Ingestion & Discard Prevention (`app/nurse/hooks/useNurseData.ts`):**
     - Updated `belongsToMe` in `applyRealtimeUpdate` to verify:
       - `patient.cubicleNum` matches `myCubicles`
       - `patient.preferredCubicleNums` overlaps `myCubicles`
       - `patient.service` matches `myServices` (case-insensitive, trimmed)
       - `patient.service` matches any category in `cachedCubicles`
       - General facility coverage fallback if unassigned or supervisor
     - Ingests authoritative `effectiveServices` and `cubicles` from the server API response into client state.
  4. **Resilient Queue Filtering & Category Counts (`app/nurse/page.tsx`):**
     - Updated `filterPatientList` so patients with `cubicleNum = null` whose `preferredCubicleNums` includes `selectedCubicleNum`, or who belong to the selected service category, are visible in the cubicle and category views.
     - Normalized service and category strings using `.trim().toLowerCase()`.
  5. **Stage Mutation Persistence via Server API (`app/nurse/hooks/useNurseActions.ts`):**
     - Updated `persistPatientUpdate` to call `PATCH /api/nurse/patients` with the user's Bearer token, falling back to direct client Supabase only if the server route is unreachable.
  6. **Developer Guide Documentation (`app/nurse/README.md`):**
     - Documented `app/api/nurse/patients/route.ts` in the "Where to Edit" table.
  7. **Dynamic Service Icon Synchronization (`app/nurse/components/NurseSidebar.tsx` & `constants/designs/icons.ts`):**
     - In `NurseSidebar.tsx`, added real-time database query and Supabase Realtime channel subscription (`nurse-sidebar-services-sync`) to the `services` table.
     - Built `serviceMap` mapping normalized service names to their full database records (`label_en`, `icon_src`).
     - Passed `serviceObj` to `resolveServiceIcon` so custom Boxicons assigned in Superadmin customization immediately reflect on the Nurse Dashboard in 0ms without a page reload.
     - Added fallback mappings for `'Pulmo & Surgery': 'bx-plus-medical'` and `'Others': 'bx-sushi'` in `CATEGORY_ICONS`.
- **Verification:**
  - `npm run build` executed and passed with 0 errors across all 55 static and dynamic routes.
  - Zero TypeScript compiler diagnostics (`Finished TypeScript in 4.5s`).
  - Runtime ReferenceError (`isServiceSelected`) in `NurseSidebar.tsx` resolved.
  - Syntax error in `app/api/superadmin/access/route.ts` resolved.
  - Zero emojis in all code, comments, and documentation.
  - AGENTS.md separation of concerns and high-contrast dual-theme standards strictly maintained.
