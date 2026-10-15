# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Open Issues Tracker

Running list of known follow-ups that aren't urgent enough to block progress, but shouldn't get lost. Check items off as they're resolved; add new ones as they come up instead of letting them live only in chat history.

## Security

- [ ] `useRoleGuard` hook — confirm it queries `users`/`auth_id`, not the earlier assumed `profiles`/`id`; clarify overlap with `lib/supabase/authGuard.ts`
- [ ] Rate limiting (`slowapi`) not yet applied to analytics endpoints — note: `login_attempts`/`password_reset_attempts` tables now exist, protecting auth endpoints; analytics heavy computation endpoints remain to be throttled
- [x] `proxy.ts` (formerly `middleware.ts`) — built. Server-side route guard using `@supabase/ssr` cookie-based session validation with role-based access control. Protects `/superadmin`, `/dashboard`, `/nurse`, `/transfer`. Redirects unauthenticated users to `/login` and unauthorized users to `/unauthorized`.
- [x] `/unauthorized` page — built. Displays a branded access-denied screen for authenticated users whose role does not satisfy the middleware route requirements.
- [x] Kiosk ticket generation path — secured. Public kiosk terminals invoke the `create_patient` stored procedure via Supabase RPC (`SECURITY DEFINER`), enforcing parameter validation and `is_historical = false` server-side without requiring raw table INSERT permissions.
- [x] `services` RLS — resolved. Anonymous insert and delete policies dropped; writes restricted strictly to `is_superadmin()`, read open to public.
- [x] `users` RLS — resolved. Public account directory leak eliminated; authenticated self-read (`users_select_self`) and superadmin-all (`users_select_superadmin`) active.
- [x] `patients` RLS — resolved. All legacy wide-open policies dropped. Active policies enforce nurse cubicle isolation (`my_cubicle_nums()`), registration staff permissions (`is_registration_staff()`), Manila-day live scoping for TV monitors (`patients_select_public_live`), and strict PostgreSQL RESTRICTIVE policies (`patients_no_historical_*`) preventing modification or deletion of historical research rows.
- [x] `doctors` write policies — resolved. Mutations (`INSERT`, `UPDATE`, `DELETE`) restricted to registration staff and administrators (`is_registration_staff() OR is_admin_or_superadmin()`).
- [x] `cubicle` table policies — resolved. Overlapping SELECT policies consolidated into a single public read policy; doctor assignment updates restricted to registration staff and administrators.
- [x] Staff-assignment join tables (`user_cubicles`, `user_services`, `user_rooms`, `user_counters`, `cubicle_selector`, `cubicle_selector_cubicle`) — documented and verified with active role-based access policies.

## Data / Schema

- [x] Run `is_historical` migration + backfill on `patients` — applied and active. Verified in live schema with RESTRICTIVE RLS policies.
- [x] New `patients` columns documented in narrative form: `preferredCubicleNums`, `subcategory`, `cooldown_until`, `rotation_count`, `counter_rejoin_at`, `counter_top_started_at`, `idle_at`, `removed_at` — documented with exact operational semantics in `docs/specifications/DATABASE_SCHEMA.md`.
- [x] `carryout_start`/`carryout_end` schema columns — confirmed: `python_backend/analytics/preprocessing.py` computes `service_carryout` and includes it in `total_time` (lines 153-167), closing the ~7-minute tracking discrepancy against PHC's manual analysis sheet.
- [x] `users.assigned_room` — documented as primary physical triage or consultation room assignment.
- [ ] Confirm exact `users.role` string values in production data (case-sensitive) — mismatches silently break policies and middleware
- [ ] `distribution_tests.py` — statistical validation of Poisson/exponential assumptions, pending real PHC data to run meaningfully

## Analytics / ML (Planned, Post-Current-Priorities)

- [ ] Per-patient dynamic wait-time prediction (build first)
- [ ] Bottleneck/anomaly detection layer on `descriptive.py`

## Documentation

- [x] Synchronize guidelines and module developer guides into `AGENTS.md`, `app/kiosk/README.md`, `app/dashboard/README.md`, `app/nurse/README.md`, and `docs/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`
- [x] Re-verify `ARCHITECTURE.md`'s file/endpoint structure against the actual repo — updated to reflect modular `app/dashboard/pages/` refactor and backend endpoints
- [x] `PRD.md` scope/objectives updated with password-reset auth flow, superadmin cubicle management, modular dashboard presentation, and Excel export (`export.py`, `ExportExcelButton.tsx`)
- [x] `python_backend/analytics/export.py` documented in `ARCHITECTURE.md` and `PRD.md`
- [x] Title standardization across all documents: Updated to `Heart Check PHC: A Kiosk-Based Queue Management and Analytics System` (removing obsolete IoT terminology)
- [x] Reconcile raw schema and RLS policies across `SCHEMA_REFERENCE.md`, `DATABASE_SCHEMA.md`, and `SECURITY.md` against live Supabase database instance.

## Deployment (Production Handoff, Not Urgent Yet)

- [ ] Supabase Realtime replacement (WebSocket polling via FastAPI) needed if migrating off Supabase
- [ ] HTTPS / reverse proxy setup for PHC on-prem server
- [ ] Docker packaging for PHC IT/MIS handoff

---

## Resolved

- [x] **2026-10-16:** Reconciled live Supabase schema and RLS policies across all specifications (`SCHEMA_REFERENCE.md`, `DATABASE_SCHEMA.md`, `SECURITY.md`, `SECURITY_CHECKLIST.md`, and `brain/architecture/database-and-rls.md`).
- [x] **2026-10-16:** Verified `patients` RLS lockdown: eliminated unconditioned legacy policies, verified nurse station cubicle isolation via `my_cubicle_nums()`, verified Manila-day live scoping for TV monitors, and confirmed PostgreSQL RESTRICTIVE policies enforcing historical data immutability.
- [x] **2026-10-16:** Verified `services` RLS lockdown: eliminated anonymous write/delete access; enforced `is_superadmin()` gate for catalog changes.
- [x] **2026-10-16:** Verified `users` RLS lockdown: eliminated public directory read leak; enforced self-read and superadmin directory access.
- [x] **2026-10-16:** Verified `doctors` and `cubicle` RLS: restricted doctor station assignments and physician directory changes to registration staff and hospital administrators.
- [x] Import script used anon key and never marked rows historical — fixed: uses service role key and sets `is_historical = true`
- [x] CORS on FastAPI backend — configured via `CORSMiddleware` in `python_backend/main.py` allowing frontend origins (localhost/127.0.0.1:3000/3001)
- [x] Architecture & PRD documentation — synchronized with latest codebase refactorings and title standardization
- [x] Route-level proxy guard — built (`proxy.ts` at project root, formerly `middleware.ts`). Enforces role-based session validation for `/superadmin`, `/dashboard`, `/nurse`, `/transfer`.
- [x] `carryout_start`/`carryout_end` calculation pipeline — integrated in `python_backend/analytics/preprocessing.py`, including `service_carryout` into `total_time`.
- [x] Multi-mode Excel export — built in `ExportExcelModal.tsx` and `python_backend/main.py` supporting specific date, all dates, and calendar month exports with dynamic recorded date discovery.
- [x] Master improvement roadmap and feature checklist created in `docs/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`.
- [x] Security vulnerability checklist and patch remediation matrix created in `docs/SECURITY_CHECKLIST.md` and enforced in `AGENTS.md` Rule 12.
- [x] Comprehensive UAT use case verification checklist created in `docs/UAT_USE_CASE_CHECKLIST.md`.
- [x] Real-time queue synchronization stabilization under weak signal — implemented across all hooks (`app/nurse/`, `app/transfer/`, `app/monitor/`, `app/dashboard/hooks/useOverviewData.ts`, `app/dashboard/pages/patients/hooks/useServiceQueue.ts`) and client socket tuning (`lib/supabase.ts`): monotonic fetch sequence guards, 300ms event debouncing, 2s channel hysteresis, 500ms overlap throttling, and subsystem-tailored polling fallbacks.

---

_Last updated: 2026-10-16 — Open issues tracker updated with verified RLS resolutions._