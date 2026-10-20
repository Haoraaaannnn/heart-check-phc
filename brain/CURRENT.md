# Current Project State

**Last Updated:** 2026-10-20

---

## Active Environment & Branch Status

- **Active Git Branch:** `feat/simulation`
- **Latest Commit:** `8da3bd6` ("removed obsolete and unnecessary files")
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
