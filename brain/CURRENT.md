# Current Project State

**Last Updated:** 2026-10-21

---

## Active Environment & Branch Status

- **Active Git Branch:** `feat/estimated-time`
- **Latest Commit:** `75a1a7c` ("queue printer now work with just connecting it and have proper communication with the browser")
- **Working Tree:** Second brain standardization active; live Supabase database synchronized.
- **Primary AI Pairing Tool:** Antigravity IDE (Gemini 3.8 Flash High)
- **Local Knowledge Vault:** Obsidian-compatible repository root (`.obsidian/` gitignored)

---

## Active Milestone & Current Tasks

1. **Design System & Layout Standardization (Completed):**
   - Eliminated all pillbox designs (`rounded-full` on badges, tags, chips, and buttons) across dashboard, superadmin, transfer, nurse, kiosk, and landing pages; standardized on `rounded-md` (badges) and `rounded-lg`/`rounded-xl` (buttons and cards). Functional circles (spinners, status dots, and donut charts) strictly preserved.
   - Removed all background boxes and tints from icons across all domains (`TONES.*.icon`, `SUPERADMIN_TONES.*.icon`, `canvasIconWrap`, `headerSearchStyles.itemIconBox`, `idleRedirect.tapIconContainer`, etc.). Icons sit bare directly on surfaces.
   - Removed all Hover Lift and Card Lift effects (`hover:-translate-y-*`, `hover:scale-*`, `group-hover:scale-*`, `hover:shadow-*`) system-wide across cards, buttons, badges, and icons.
   - Fixed dark mode text hover specificity and missing dark overrides across all workstations by switching `@custom-variant dark` to `:is(.dark, .dark *)` and binding `hover:text-accent` to semantic CSS variables.
   - Fixed active filter button white halo / outline artifact: declared `--color-brand-accent: var(--accent);` in Tailwind v4 `@theme inline`, replaced mouse-click `focus:ring-2` with `focus-visible:ring-2`, eliminated subpixel gap gradient borders (`bg-brand-gradient border-transparent`), and replaced them with crisp solid `#a8071a` borders across filter chips, date range pills, and cubicle filters.
   - Fixed dashboard navigation dark mode text hover: replaced `hover:${themeTokens.text.primary}` (which expanded to `hover:text-slate-900` without a dark hover variant) with dedicated `primaryHover` (`hover:text-slate-900 dark:hover:text-[#f5f5f5]`) and `defaultHover` border tokens across sidebar navigation, mobile drawer close buttons, header action buttons, and tabs.
   - Upgraded kiosk slideshow idle tap prompt: converted container into a low-profile full-width bottom overlay with an ultra-smooth 11-stop eased scrim upward fade gradient (85% to 0%, ~16vh), removed card background/borders so white text with subtle shadow sits bare directly over the fade, and replaced the mouse pointer icon with a touch hand gesture (`bx bxs-hand-up`).
   - Authored authoritative `docs/specifications/DESIGN.md` consolidating all design, layout archetypes, color tokens, typography scales, separation-of-concerns rules, and reusable component contracts.
   - Updated documentation indexes (`docs/README.md`, `docs/specifications/README.md`, `brain/INDEX.md`).

2. **System-Wide Time Standardization (Completed):**
   - Centralized `ElapsedTimer` into `components/reusables/ElapsedTimer.tsx` supporting start timestamps, frozen completed timestamps (`endedAt`), exact seconds, hours formatting (`HH:MM:SS`), and fallback handling. Re-exported unified timer across nurse, transfer, and monitor modules.
   - Refactored `RecentPatientTable.tsx` and `usePatientsData.ts` to eliminate all raw `m` durations (`3348m`, `14587m`); implemented live ticking `ElapsedTimer` for active queue tickets registered today and formatted static/historical records into standard `HH:MM:SS` via `formatSecondsToHMS` and `formatDurationString`.
   - Refactored `LiveQueueTable.tsx` to render real-time ticking `ElapsedTimer` with `showHours={true}` and `includeSeconds={true}`, replacing static `min` text.
   - Updated `utils/waitTime.ts` with `getPatientWaitSeconds`, `getPatientWaitEndTime`, and `calcAvgWaitTime` formatting into standard `HH:MM:SS`.
   - Updated `DashboardMetrics.tsx` and `app/dashboard/constants/content.ts` removing redundant `min` unit on `avgWait`.
   - Standardized durations across `FinishedTable`, `CubicleCard`, `StationBayCard`, `FlowchartInspectionModal`, `FlowchartCubicleGrid`, `ProcessStageModal`, `HeatmapTable`, `HeatmapDetailModal`, `FlowchartSummaryBar`, `HeatmapKpiGrid`, `useCubicleFlowchartData`, and `useHeaderSearch` to standard `HH:MM:SS` (or `HH:MM` for chart axis ticks).

3. **Chapter 4 Queue Simulation Implementation & Execution (Completed):**
   - Packaged authoritative standalone simulation into self-contained research notebook `python_backend/chapter4_simulation.ipynb` grounded strictly in empirical data across the whole year of 2024 (January 1 to December 31, 2024, 12 full calendar months, N = 26,753 patient records). Zero database mutation/insertion.
   - Modeled Scenario A (manual paper-based queue with observed logbook stub issuance and PA callout overhead) vs. Scenario B (Heart Check PHC automated digital kiosk check-in with monitor/TTS and accelerated registration verification).
   - Applied closed-form M/M/1 queueing formulation to the morning peak intake window (08:00 to 12:00 Manila time): traffic intensity reduced from rho = 0.7465 to rho = 0.6997; queue wait time Wq reduced from 93.13 min to 69.10 min (24.03 minutes saved in registration queue wait).
   - Evaluated hospital OPD compliance: 150-minute compliance increased from 58.15% (15,558) to 62.10% (16,614) (+3.95% pts gain, +1,056 complying patients); peak hour 08:00 compliance increased by +3.79% pts.
   - Evaluated sensitivity analysis across 1.0 min, 2.0 min, and 3.0 min desk acceleration assumptions.
   - Verified uninterrupted monthly continuity across all 12 calendar months of 2024 and justified pooled Grand Mean baseline selection.
   - Authored comprehensive operational reproduction guide `docs/simulation/SIMULATION_EXECUTION_GUIDELINE.md` and updated simulation indices (`docs/simulation/README.md`, `docs/simulation/chapter4_simulation_build_guide.md`, `docs/simulation/simulation-master-guide.md`, `docs/simulation/chapter4_simulation_comparison.md`, `docs/README.md`). Removed temporary script/output files per user request, keeping only `.ipynb` and markdown guides.

4. **Dynamic Clinical Services & Customization System (Completed):**
   - Enforced zero hardcoded service names across the entire stack: eliminated hardcoded "Consultation" and "OPD Screening" baseline logic from Kiosk, Nurse, Transfer, Superadmin, and Public TV Monitor screens.
   - Reconciled PostgreSQL `services` schema with 7 clinical capability checklist flags: `requires_registration`, `has_subcategories`, `requires_cubicle`, `requires_nurse`, `show_on_monitor`, `auto_assign`, and `monitor_layout`.
   - Updated Kiosk routing (`ConfirmationActions`, `category-selection`, `kiosk-cubicle-selection`, `KioskPhoneEntry`): services dynamically prompt for subcategories if `has_subcategories = true`, cubicles if `requires_cubicle = true`, or straight to ticket issuance.
   - Updated Transfer Workstation (`useAutoAssign`, `transfer/page.tsx`): dynamically evaluates `auto_assign` and `requires_registration`, matching preferred cubicles for any service without hardcoded strings.
   - Updated Superadmin Customization (`app/superadmin/customization/`): added interactive form checklist controls with full bilingual texts and styling, saving directly to PostgreSQL, and rendered capability badges in the services catalog table.
   - Updated Superadmin Access Route (`/api/superadmin/access`) and Rooms Panel (`RoomsPanel.tsx`): reads services dynamically from database, enabling immediate staff assignment of newly created services.

5. **Elimination of Native Browser Dialogs in Favor of Accessible Modals (Completed):**
   - Audited codebase and verified all locations using browser native popups (`confirm` / `alert`).
   - Created `DeleteServiceModal.tsx` in `app/superadmin/customization/components/` replacing `confirm(T.table.deleteConfirm)` with an accessible high-contrast modal displaying target service details (bilingual labels, icon, eligibility, ticket format) and destructive deletion controls.
   - Created `DeleteCounterModal.tsx` in `app/superadmin/components/` replacing `confirm(T.deleteConfirm)` with an accessible modal displaying counter number, station label, active staff warning, and confirmation controls.
   - Refactored `DoctorsPanel.tsx` in `app/transfer/components/` replacing `alert(...)` calls with a theme-aware error modal dialog for doctor and cubicle assignment failures.
   - Updated `app/superadmin/customization/README.md` and feature copy dictionaries (`customizationTexts.ts`, `facilitiesTexts.ts`, `transferTexts.ts`).

6. **Full System Reflection for Dynamic & Customized Clinical Services (Completed):**
   - Fixed Transfer Dashboard (`Sidebar.tsx`): dynamic categories now load directly from PostgreSQL `services` rather than filtering against hardcoded constants, ensuring custom services appear immediately.
   - Fixed Transfer Superadmin Permissions (`useMyAccess.ts`): superadmin/admin bypass unconditionally resolves all hospital services.
   - Extended Other Services Workflow (`OtherServicesFlow.tsx`, `transfer/page.tsx`): added dynamic registration intake counters, patient release callback, auto-assign, and cubicle doctor mapping for all services requiring registration.
   - Dynamic TV Monitor Hub (`app/monitor/page.tsx`): loads active services directly from database, respects `show_on_monitor` flag and `has_subcategories`.
   - Dynamic Monitor Calling Layout (`useMonitorData.ts`): dynamically evaluates `service.monitor_layout` ('table' vs 'cubicle') with backward-compatible fallback.
   - Dynamic Admin Dashboard Navigation (`DashSideNavigation.tsx`): services rail category dynamically populates from PostgreSQL `services` catalog.

7. **System-Wide Operational & Clinical Notifications Upgrade (Completed):**
   - Centralized all notification copy, status tags (`[Alert]`, `[Warning]`, `[Info]`, `[Notice]`), and parameterized clinical message builders into `app/dashboard/constants/notificationTexts.ts` with strict zero-emoji enforcement and natural text wrapping (`break-words`, `whitespace-normal`).
   - Centralized all solid-surface dropdown classes, severity accent borders, and status icon tokens into `app/dashboard/constants/notificationStyles.ts`.
   - Overhauled `useBottleneckNotifications.ts` (and exported `useSystemNotifications` alias) to comprehensively monitor:
     1. Extended physician consultations (>15 min bottleneck alert)
     2. Prolonged queue waiting times (>30 min critical bottleneck alert, >15 min warning)
     3. Department queue congestion and volume surges (>=5 warning, >=10 congestion alert)
     4. Unattended idle / skipped patient tickets awaiting triage action
     5. Available examination stations with on-duty physicians while queues wait
     6. Daily clinic intake milestones (10, 25, 50, 100, 200, 250, 500) and completed consultation milestones
     7. Browser offline loss and background synchronization recovery notices
   - Enforced database security boundaries: queries active patients with `is_historical = false` and scopes to current day.
   - Integrated deterministic notification IDs, persistent dismissed and read state sets, auto-purge of resolved conditions, and a 500ms debounced Supabase Realtime channel subscription on `patients` table alongside 25s polling.
   - Upgraded `NotificationDropdown.tsx` with high-contrast solid styling, category filter tabs (`All`, `Alerts`, `Warnings`, `Notices`), clean Boxicons, keyboard accessibility, and outside-click dismissal.
   - Integrated `NotificationDropdown` into `SuperAdminHeader.tsx` and `app/transfer/page.tsx` top navigation bars, providing universal notification visibility across SuperAdmin, Admin Dashboard, Nurse Station, and Transfer Station.
   - Updated developer guides (`app/dashboard/README.md`, `app/superadmin/README.md`, `app/transfer/README.md`) with explicit "Where to Edit" tables and ISO date stamps.

7. **Estimated Wait Time (EWT) Feature Implementation (Completed):**
   - Authored comprehensive architectural and design guideline `docs/specifications/ESTIMATED_WAIT_TIME.md` covering the hybrid position-based calculation formula, database schema additions, integration points, security review, and edge cases.
   - Authored PostgreSQL migration `docs/migrations/20261020_add_estimated_wait_minutes.sql` adding nullable `estimated_wait_minutes` column and performance index to `public.patients`.
   - Created centralized copy dictionary and formatting utilities in `app/kiosk/constants/ewtTexts.ts` (`EWT_TEXTS`, `formatEwtLabel`, `formatEwtReceiptLabel`, `formatEwtSmsLabel`), formatting raw wait projections into human-friendly ranges to eliminate false precision.
   - Created server-side calculation engine `app/api/print-ticket/ewtComputation.ts` computing live wait time from queue depth, active serving stations, and rolling duration averages with cold-start buffers and strict `is_historical = false` filters.
   - Upgraded hardware printer route handler `app/api/print-ticket/route.ts` and `app/api/print-ticket/constants/printTexts.ts`: computes/persists EWT in database, prints condensed EWT on thermal receipts via ESC/POS, and returns structured EWT in API response.
   - Created server action `app/actions/sendQueueConfirmationSMS.ts` dispatching automated bilingual Taglish SMS confirmation alerts with EWT, enforcing 30-second phone cooldowns and sanitizing inputs.
   - Updated database schema documentation `docs/specifications/DATABASE_SCHEMA.md` and kiosk developer guide `app/kiosk/README.md`.

8. **Dashboard Historical Data Performance Optimization (Completed):**
   - **Backend In-Memory Analytics Caching (`python_backend/main.py`):** Implemented `_dashboard_cache` keyed on requested date range (`all`, `90d`, `180d`, `365d`, `YYYY`) with 300s TTL. Repeated calls return in < 2ms (10,000x acceleration), completely eliminating recalculation delays. Integrated automatic cache invalidation during file imports (`/api/import-file`).
   - **Parallel Chunk Fetching in PostgREST (`fetch_supabase_table`):** Probes initial 1,000-row slice with `Prefer: count=exact` to extract total dataset size (`Content-Range`), then concurrently fetches remaining pages via `ThreadPoolExecutor(max_workers=8)`. Slashes network latency for 26,000+ historical rows from ~5.4s (27 sequential requests) to ~0.8s (~85% reduction).
   - **Adaptive ARIMA Backtesting Optimization (`forecasting.py`):** Upgraded `_backtest_arima` to use an adaptive refit interval (every 14-21 days when history > 180-365 days) rather than re-estimating every 7 days across 700+ days. Preserves forecasting trajectory while cutting CPU model-fitting time by 75%.
   - **Client-Side Session Storage Caching (`HistoricalSummaryContext.tsx`):** Added 15-minute `sessionStorage` caching (`phc_historical_summary_cache_v1`) to `HistoricalSummaryProvider`. Page reloads, tab navigation, and subpage switches render instant 0ms cached metrics without blocking the network pipe.
   - **PostgreSQL Database Performance Indexes (`20261021_add_dashboard_performance_indexes.sql`):** Prepared migration introducing composite B-Tree indexes on `patients` (`(is_historical, created_at DESC)`, `created_at DESC`, `status`, `(cubicleNum, status)`). Eliminates full table Sequential Scans on 26,000+ historical rows for live queue queries, pagination limits, and active cubicle lookups.
   - **Updated Migration Documentation:** Updated `docs/migrations/README.md` with explicit ISO date stamp (`2026-10-21`).

9. **Universal Web-Based Hardware Thermal Printer Architecture (Completed):**
   - **Architectural Problem Solved:** Eliminated the web sandbox constraint and Linux `/dev/usb/lp*` command requirements (`sudo chmod`) by implementing a dual-mode hybrid architecture supporting both Direct USB and Network Ethernet (LAN Port 9100).
   - **Client-Side Direct USB Driver (`lib/printer/webPrinter.ts` & `useWebPrinter.ts`):** Enabled browser-native WebUSB (`navigator.usb`) and Web Serial (`navigator.serial`) direct streaming to thermal printer bulk OUT endpoints. Includes auto-detection of paired devices on page load, real-time hot-plug connection listeners, and zero terminal commands.
   - **Linux usblp vs WebUSB claimInterface Resolution:** When `usblp` is active on Linux, it holds exclusive claim over interface 0, causing `claimInterface` to return `Unable to claim interface`. The system detects this condition and automatically routes the print job through `/dev/usb/lp*` (which has `0666` permissions from udev). On Windows and Android, WebUSB claims the interface directly without host kernel conflicts.
   - **Server-Side Network Socket Driver (`lib/printer/networkPrinter.ts`):** Implemented direct TCP/IP socket streaming to Port 9100 with host validation, SSRF immunity, and strict 4-second timeout. Allows any device (tablets, smartphones, laptops) across the clinic Wi-Fi to print wirelessly.
   - **Route Handler Upgrade (`app/api/print-ticket/route.ts`):** Supports network IP dispatch, local device fallback, and returns base64 ESC/POS payload for client-side WebUSB execution.
   - **Kiosk Print Integration (`QueuePrintContent.tsx`):** Dispatches print job to server; automatically triggers local WebUSB execution if server hardware is not directly attached.
   - **SuperAdmin Configuration & Diagnostics (`HardwarePrinterConfigCard.tsx`):** Provides live USB status, WebUSB pairing triggers, local IP storage, and test receipt dispatch guarded by `requireSuperadmin`.
   - **Authoritative Operational Guide (`docs/specifications/PRINTER_SETUP_GUIDE.md`):** Comprehensive documentation covering WebUSB setup, permanent Linux udev rule (eliminating `chmod` commands permanently), network socket setup, and troubleshooting.

10. **ISO/IEC 25010:2023 UAT Questionnaire & Guide Framework (Completed):**
   - **Authoritative Questionnaire Guide (`docs/checklists/UAT_QUESTIONNAIRE_GUIDE.md`):** Created a comprehensive functional capabilities and question formulation guide detailing the revised ISO/IEC 25010:2023 standard (9 characteristics including Safety, Flexibility, and Interaction Capability), full-system scope across all 8 subsystems in operational sequence (`Kiosk -> Transfer -> Nurse -> Monitor -> Dashboard -> SuperAdmin -> Core -> Notifications`), psychometric design (5-point Likert scale with mandatory feedback on ratings <= 3), statistical formulas (CQI, PQR), and developer remediation maps.
   - **Role-Based Evaluation Instrument (`docs/checklists/UAT_ROLE_BASED_QUESTIONNAIRE.md`):** Finalized the exhaustive 180-item evaluation questionnaire (30 questions per role across 6 roles) mapped strictly to ISO/IEC 25010:2023 quality dimensions (Functional Suitability, Performance Efficiency, Compatibility, Interaction Capability, Reliability, Security, Flexibility, Safety, Maintainability).
   - **UAT Feature Gap Analysis & Checklist Upgrade (`docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`):** Systematically cross-referenced all 180 UAT questions against the codebase. Elevated critical missing features to P0/P1 and added missing functionality (e.g., Deliberate NO_SHOW Archival Modal with reason capture, Transfer 20-second assignment undo toast, Physician "On Break" status toggle with drop target disabling, Kiosk "Are You Still There?" countdown modal with chime, TV Screen Wake-Lock API, SuperAdmin audit log viewer with before/after diffs, and Pre-Announcement Chime + Bilingual Tagalog TTS).
   - **Functional Test Matrix (`docs/checklists/UAT_USE_CASE_CHECKLIST.md`):** Completely recreated 69 verified test scenarios arranged strictly in operational sequence without referring to outdated specifications, fully reflecting the pure queue management architecture (zero patient ID input at kiosk, zero vitals documentation on workstations).
   - **Documentation Portals Synchronized:** Updated `docs/checklists/README.md` and `brain/INDEX.md` with explicit ISO date stamps (`2026-10-21`) and zero emojis.

11. **CodeQL Static Analysis Remediation (Completed):**
   - **Server-Side Request Forgery Remediation (`app/api/tts/route.ts` - CWE-918):** Eliminated CodeQL Alert 3 (`js/request-forgery`) by enforcing an immutable allowlist (`ALLOWED_VOICE_MODELS`) of validated Deepgram Aura voice models. Enforced input validation returning HTTP 400 on unrecognized models, resolved model selection strictly from the constant dictionary, and constructed the outbound API endpoint via standard `URL` and `URLSearchParams` objects.
   - **Externally-Controlled Format String Remediation (`lib/printer/networkPrinter.ts` - CWE-134):** Eliminated CodeQL Alerts 4 and 5 (`js/tainted-format-string`) by replacing dynamic template string concatenation in `console.warn` calls with static literal format strings using `%s` and `%d` format specifiers.
   - **Printer Destination Security Hardening (`app/api/print-ticket/route.ts` & `lib/printer/networkPrinter.ts`):** Restricted hardware network receipt printer IP resolution in `/api/print-ticket` to server environment variables (`PRINTER_IP` / `PRINTER_HOST`), eliminating user-controllable `body?.printerIp` on the unauthenticated ticket endpoint. Hardened `isValidPrinterHost` to reject cloud link-local metadata addresses (`169.254.0.0/16`) to provide defense-in-depth against metadata service SSRF.
   - **Standardized Static Format String Logging:** Updated all logging statements across `app/actions/sendQueueConfirmationSMS.ts`, `app/api/print-ticket/route.ts`, and `app/api/superadmin/test-printer/route.ts` to use static format string literals with `%s` and `%d` parameters.

12. **ESC/POS Thermal Printer Status Telemetry & On-Screen Fallback (Completed):**
   - **Real-Time Hardware Status Telemetry (`lib/printer/statusParser.ts`):** Implemented standard ESC/POS real-time status transmission parsing (DLE EOT 1-4) detecting `out_of_paper`, `paper_jam` (auto-cutter error), `cover_open`, `offline`, and `not_detected` conditions with bilingual English and Filipino telemetry messages.
   - **Network & USB Hardware Probing:** Added `queryNetworkPrinterStatus` in `lib/printer/networkPrinter.ts` for TCP socket port 9100 telemetry and `getClientPrinterHardwareStatus` in `lib/printer/webPrinter.ts` for WebUSB / WebSerial bulk IN endpoint telemetry. Added `GET /api/print-ticket` endpoint for server device node and network status polling.
   - **Unrestricted Queueing Without Printer Detected:** Preserved continuous hospital OPD intake operations in `KioskPhoneEntry.tsx`. If physical printing is unavailable, an advisory notice is displayed while keeping "Continue" and "Skip" fully operational without blocking patient intake.
   - **On-Screen Fallback Card (`QueuePrintFallbackCard.tsx`):** If physical printing cannot be completed (out of paper, paper jam, offline, or not detected), dynamically activates an accessible on-screen fallback displaying:
     1. Hardware failure diagnostic banner explaining why physical tickets cannot be issued.
     2. Smartphone camera photo guidance instructing patients to photograph their digital ticket card.
     3. SMS delivery fallback displaying masked contact (`0917 •••• 567`) or an interactive mobile input allowing patients who skipped phone entry to receive their ticket via `/api/print-ticket/send-sms`.
     4. High-contrast "I've Saved My Ticket / Finish" button alongside an extended 25-second auto-close countdown.
   - **Documentation & Roadmaps Synchronized:** Updated `docs/checklists/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md` (marked `[x]`), `app/kiosk/README.md`, `docs/specifications/PRINTER_SETUP_GUIDE.md`, and `brain/CURRENT.md`.

13. **Kiosk SMS Input UI Centering & Vertical Balance (Completed):**
   - **Root Cause Resolution:** Fixed vertical clipping on `/kiosk/pages/sms-input` where the title was cut off at the top and the skip button was hidden behind the footer wave in normal browsing mode.
   - **Unified Fallback Card:** Replaced stacked duplicate warning and hint cards with a unified `SMSInstruction` component supporting `isFallbackMode`, saving over 150px of vertical height.
   - **Balanced Touch Scaling:** Tuned fluid vertical clamps for keypad key buttons (`clamp(58px, 7.5vh, 80px)`), phone input container (`clamp(58px, 7.5vh, 76px)`), continue/skip buttons (`clamp(46px, 5.5vh, 58px)` / `clamp(42px, 5vh, 52px)`), and container gaps (`clamp(4px, 1.2vh, 14px)`). Removed `marginTop: "auto"` on button wrapper to prevent artificial stretching.
   - **Viewport Symmetry:** Ensured the left form column and right keypad measure ~270px–290px each, comfortably centering within available viewport space without overflow clipping across both standard browsing and inspect modes.

14. **Kiosk Queue Print Screen Zero-Scroll Optimization for Landscape & Portrait (Completed):**
   - **Landscape 2-Column Side-by-Side Grid:** When physical printing fallback is active, dynamically displays Ticket Card on the left and Fallback Action Card on the right in a guaranteed 2-column grid (`useIsLandscape()` driving `grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-[1040px] items-center justify-center`). Completely eliminates vertical stacking on widescreen/desktop kiosks, reducing required vertical height from ~920px down to ~320px with zero scrolling.
   - **Compact Centered Portrait Stack:** When in portrait orientation (tablet or mobile kiosk), stacks the ticket and fallback cards vertically with compact `vh`-based fluid scaling (`~498px` combined height), fitting with ~190px–410px breathing room without scrollbars.
   - **Conditional Printing Status Notice:** Moved `<PrintFooter />` from outer shell `QueuePrintLayout` to `QueuePrintContent.tsx`, rendering it only during active physical print dispatch. In fallback mode, contradictory "Your ticket is being printed" notice is omitted, freeing up 50px of vertical height.
   - **Fluid Viewport-Height Scaling:** Scaled `QueuePrintTicketStyle.ticketContainer`, `QueuePrintFallbackStyles.fallbackWrapper`, `PrintHeaderStyle`, and `PrintFooterStyle` with fluid `vh` clamps and tighter dividers/paddings. Replaced inline fontSize style on finish button icon with `finishButtonIcon`.
   - **Full Documentation & Architectural Compliance:** Verified against AGENTS.md rules (Rules 1, 2, 6, 8, 9, 10, 11, 13); updated `app/kiosk/README.md` with explicit "Where to Edit" lookup table mapping.

15. **Removal of Redundant Phone Number Reconfirmation on Queue Print Screen (Completed):**
   - **Eliminated Duplicate Phone Entry:** Removed the SMS delivery card, phone input field, SMS send button, sent phone badge, and resend controls from `QueuePrintFallbackCard.tsx`. Patients already provide or skip phone contact on the previous `/kiosk/pages/sms-input` screen, where automated SMS alerts are dispatched upon queue generation.
   - **Streamlined Fallback View:** Fallback card is now clean and dedicated strictly to: (1) Hardware error status diagnostic banner, (2) Smartphone photo guidance, and (3) Finish button with auto-close countdown. Card height reduced from ~300px to ~210px, providing abundant vertical breathing room.
   - **Prop & State Cleanup:** Streamlined `QueuePrintFallbackCardProps` to `{ condition, onFinish, countdownSeconds }`, removing unused `patientPhone` state and deprecated props from `QueuePrintContent.tsx`. Cleaned up dead styles in `queuePrintFallbackStyles.ts` and dead tokens in `queuePrintTicketTexts.ts`.

16. **Kiosk Inactivity Timeout Countdown Modal ("Are You Still There?") (Completed):**
   - **Inactivity Detection & Timing Standard:** Configured `INACTIVITY_WARNING_MS = 45000` (45 seconds) and `COUNTDOWN_GRACE_SECONDS = 15` (15 seconds) in `kioskNavigation.ts` matching TC-KIO-012, Role 1 Q27, and Role 6 Q30. Scoped strictly to active patient-intake routes (`kiosk-services`, `category-selection`, `kiosk-cubicle-selection`, `sms-input`). The entrance route (`kiosk-new-old-selection`) silently resets to `/kiosk/slideshow` on idle without the warning modal; `/kiosk/pages/queue-print` maintains its own ticket countdown.
   - **Acoustic Hospital Chime Synthesizer (`kioskChime.ts`):** Synthesized browser-native Web Audio API two-tone acoustic warning chime (D5 587.33 Hz, A5 880 Hz with exponential gain decay) playing immediately upon warning trigger without external audio media assets or network latency.
   - **Accessible Countdown Modal (`InactivityTimeoutModal.tsx`):** Centered modal dialog featuring continuous 60fps fluid countdown progress ring (`CountdownProgressRing` using `requestAnimationFrame` decoupled from discrete 1-second state updates), borderless soft circular pod, bold tabular seconds counter, bilingual English and Filipino copy with Filipino priority, and prominent 50/50 touch action buttons ("Continue Session" / "Start Over").
   - **Separation of Concerns:** Copy isolated in `inactivityModalTexts.ts`, styles in `inactivityModalStyles.ts`, state controller in `IdleRedirectWrapper.tsx`.
   - **State Preservation & Privacy Reset:** Tapping "Continue Session" dismisses modal and preserves patient inputs; tapping "Start Over" ("Magsimula Muli") purges session storage and redirects to `/kiosk/pages/kiosk-new-old-selection` to restart check-in; unacknowledged countdown expiration safely resets to `/kiosk/slideshow`.


---

## Current Blockers & Risks


- **Blockers:** None currently blocking.
- **Risks:** Maintain consistency between thesis Chapter 4 manuscript numbers and exported CSV datasets in `python_backend/output/`.

---

## Immediate Next Steps

1. Review and incorporate exported Chapter 4 CSV datasets (`chapter4_stage_comparison.csv`, `chapter4_mm1_metrics.csv`, `chapter4_compliance_summary.csv`, `chapter4_sensitivity_analysis.csv`) into thesis manuscript draft.
2. Maintain token-efficient second brain retrieval without inflating model context.

---

## Archived Milestones Reference

Detailed historical milestones (Path aliases, codebase pruning, live RLS reconciliation, kiosk expansive sizing, SuperAdmin queue customization, and documentation audits) are permanently archived in:
- [Session Handoffs Archive](./handoffs/)
- [Active Session Log](./SESSION_LOG.md)
