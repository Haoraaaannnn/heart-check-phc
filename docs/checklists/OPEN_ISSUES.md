# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Open Issues Tracker

Running list of known follow-ups that aren't urgent enough to block progress, but shouldn't get lost. Check items off as they're resolved; add new ones as they come up instead of letting them live only in chat history.

## Security

- [x] `proxy.ts` (formerly `middleware.ts`) — built. Server-side route guard using `@supabase/ssr` cookie-based session validation with role-based access control. Protects `/superadmin`, `/dashboard`, `/nurse`, `/transfer`. Redirects unauthenticated users to `/login` and unauthorized users to `/unauthorized`. Renamed from `middleware.ts` to `proxy.ts` per Next.js 16 deprecation.
- [ ] `useRoleGuard` hook — confirm it queries `users`/`auth_id`, not the earlier assumed `profiles`/`id`; clarify overlap with `lib/supabase/authGuard.ts`
- [ ] `cubicle` table — no INSERT/DELETE policy exists; confirm this is intentional (service-role-only) rather than an oversight. Also has 3 overlapping SELECT policies in the latest live pull — cleanup candidate.
- [ ] `patient_category` table — RLS policies not yet reviewed
- [ ] Rate limiting (`slowapi`) not yet applied to analytics endpoints — note: `login_attempts`/`password_reset_attempts` tables now exist, suggesting auth-endpoint rate limiting has been added separately; document once confirmed
- [x] `/unauthorized` page — built. Displays a branded access-denied screen for authenticated users whose role does not satisfy the middleware route requirements.
- [ ] Kiosk insert still uses anon key directly to Supabase; longer-term move to a FastAPI endpoint + service role key is still the better design
- [ ] `services` RLS fix — latest live pull still shows the old wide-open `anon` INSERT/DELETE policies present; the planned fix in `CHANGES_NEEDED.md` step 3 does not appear applied
- [ ] `users` RLS fix — latest live pull still shows the public-read policy present; the planned fix in `CHANGES_NEEDED.md` step 4 does not appear applied
- [ ] `patients` RLS — the planned `is_historical`-scoped fix (`CHANGES_NEEDED.md` step 5) does not match the live pull at all; live policies show a newer, undocumented `is_clinical_staff()`/`is_registration_staff()`/`my_cubicle_nums()` model layered on top of the still-present old wide-open policies, and there is no DELETE policy. Needs a full re-audit and fresh design doc, not a re-apply of the old SQL.
- [ ] `doctors` write policies — live pull shows unguarded `true`/`authenticated`-only checks instead of superadmin-gated checks; confirm intentional vs. regression
- [ ] New staff-assignment tables (`user_cubicles`, `user_services`, `user_rooms`, `user_counters`, `cubicle_selector`, `cubicle_selector_cubicle`) and their helper functions are undocumented — needed before the `patients` RLS rewrite above can be written up properly

## Data / Schema

- [ ] Confirm exact `users.role` string values in production data (case-sensitive) — mismatches silently break policies and middleware
- [ ] Run `is_historical` migration + backfill on `patients` (see `CHANGES_NEEDED.md` step 1) — not yet applied as of this doc's writing
- [ ] `distribution_tests.py` — statistical validation of Poisson/exponential assumptions, pending real PHC data to run meaningfully
- [ ] New `patients` columns not yet documented in narrative form: `preferredCubicleNums`, `subcategory`, `cooldown_until`, `rotation_count`, `counter_rejoin_at`, `counter_top_started_at`, `idle_at`, `removed_at` — need actual semantics, currently only flagged as "not yet documented" in `DATABASE_SCHEMA.md`
- [x] `carryout_start`/`carryout_end` schema columns — confirmed: `python_backend/analytics/preprocessing.py` computes `service_carryout` and includes it in `total_time` (lines 153-167), closing the ~7-minute tracking discrepancy against PHC's manual analysis sheet.
- [ ] `users.assigned_room` — new column, purpose not yet documented against the `user_rooms` join table

## Analytics / ML (Planned, Post-Current-Priorities)

- [ ] Per-patient dynamic wait-time prediction (build first)
- [ ] Bottleneck/anomaly detection layer on `descriptive.py`

## Documentation

- [x] Synchronize guidelines and module developer guides into `AGENTS.md`, `app/kiosk/README.md`, `app/dashboard/README.md`, `app/nurse/README.md`, and `docs/IMPROVEMENTS_AND_FEATURE_CHECKLIST.md`
- [x] Re-verify `ARCHITECTURE.md`'s file/endpoint structure against the actual repo — updated to reflect modular `app/dashboard/pages/` refactor and backend endpoints
- [x] `PRD.md` scope/objectives updated with password-reset auth flow, superadmin cubicle management, modular dashboard presentation, and Excel export (`export.py`, `ExportExcelButton.tsx`)
- [x] `python_backend/analytics/export.py` documented in `ARCHITECTURE.md` and `PRD.md`
- [x] Title standardization across all documents: Updated to `Heart Check PHC: A Kiosk-Based Queue Management and Analytics System` (removing obsolete IoT terminology)

## Deployment (Production Handoff, Not Urgent Yet)

- [ ] Supabase Realtime replacement (WebSocket polling via FastAPI) needed if migrating off Supabase
- [ ] HTTPS / reverse proxy setup for PHC on-prem server
- [ ] Docker packaging for PHC IT/MIS handoff

---

_Add new items as they surface. Move resolved items to a "Resolved" section below with the date, rather than deleting them — useful for Chapter 4 documentation of the security work done._

## Resolved

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

## Still Open (Security High Priority)

- [ ] `patients` RLS wide open (all policies `true`) — a fix was designed (`is_historical`-scoped policies) but does not appear applied; live schema also shows a separate, newer, undocumented scoped-access model layered on top — needs full re-audit
- [ ] `services` table — anon could INSERT/DELETE the kiosk service menu — fix designed (superadmin-only writes) but does not appear applied per latest live pull
- [ ] `users` table — public (no-login) read access to accounts — fix designed (self-read + superadmin-all) but does not appear applied per latest live pull