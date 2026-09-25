# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Open Issues Tracker

Running list of known follow-ups that aren't urgent enough to block progress, but shouldn't get lost. Check items off as they're resolved; add new ones as they come up instead of letting them live only in chat history.

## Security

- [ ] `middleware.ts` does not exist yet — route protection is client-side only (`useRoleGuard`/`authGuard.ts`), with a known flash/bypass gap. Server-side middleware is planned but not built (see `CHANGES_NEEDED.md`).
- [ ] `useRoleGuard` hook — confirm it queries `users`/`auth_id`, not the earlier assumed `profiles`/`id`; clarify overlap with `lib/supabase/authGuard.ts`
- [ ] `cubicle` table — no INSERT/DELETE policy exists; confirm this is intentional (service-role-only) rather than an oversight. Also has 3 overlapping SELECT policies in the latest live pull — cleanup candidate.
- [ ] `patient_category` table — RLS policies not yet reviewed
- [ ] Rate limiting (`slowapi`) not yet applied to analytics endpoints — note: `login_attempts`/`password_reset_attempts` tables now exist, suggesting auth-endpoint rate limiting has been added separately; document once confirmed
- [ ] `/unauthorized` page doesn't exist yet — will be needed once middleware is added
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
- [ ] `carryout_start`/`carryout_end` now exist as real `patients` columns — confirm whether the computed `avg_total_time` pipeline includes them now, which would change or close the previously-documented ~4-minute discrepancy vs. PHC's recorded average
- [ ] `users.assigned_room` — new column, purpose not yet documented against the `user_rooms` join table

## Analytics / ML (Planned, Post-Current-Priorities)

- [ ] Per-patient dynamic wait-time prediction (build first)
- [ ] Bottleneck/anomaly detection layer on `descriptive.py`

## Documentation

- [ ] Merge relevant sections of this doc set into the team's existing `CLAUDE.md` once reviewed
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

## Not Resolved

- [ ] `patients` RLS wide open (all policies `true`) — a fix was designed (`is_historical`-scoped policies) but does not appear applied; live schema also shows a separate, newer, undocumented scoped-access model layered on top — needs full re-audit
- [ ] `services` table — anon could INSERT/DELETE the kiosk service menu — fix designed (superadmin-only writes) but does not appear applied per latest live pull
- [ ] `users` table — public (no-login) read access to accounts — fix designed (self-read + superadmin-all) but does not appear applied per latest live pull
- [ ] No route-level middleware exists — planned, not yet built