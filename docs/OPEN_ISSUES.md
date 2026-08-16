# Heart Check PHC — Open Issues Tracker

Running list of known follow-ups that aren't urgent enough to block progress, but shouldn't get lost. Check items off as they're resolved; add new ones as they come up instead of letting them live only in chat history.

## Security

- [ ] `useRoleGuard` hook — confirm it queries `users`/`auth_id`, not the earlier assumed `profiles`/`id`
- [ ] `cubicle` table — no INSERT/DELETE policy exists; confirm this is intentional (service-role-only) rather than an oversight
- [ ] `patient_category` table — RLS policies not yet reviewed
- [ ] CORS not yet configured on FastAPI backend
- [ ] Rate limiting (`slowapi`) not yet applied to analytics endpoints
- [ ] `/unauthorized` page doesn't exist yet — middleware redirect currently resolves to 404 without it
- [ ] Kiosk insert still uses anon key directly to Supabase; longer-term move to a FastAPI endpoint + service role key is still the better design, current RLS-scoped policy is an interim fix

## Data / Schema

- [ ] Confirm exact `users.role` string values in production data (case-sensitive) — mismatches silently break policies and middleware
- [ ] Run `is_historical` migration + backfill on `patients` (see `CHANGES_NEEDED.md` step 1) — not yet applied as of this doc's writing
- [ ] `distribution_tests.py` — statistical validation of Poisson/exponential assumptions, pending real PHC data to run meaningfully

## Analytics / ML (Planned, Post-Current-Priorities)

- [ ] Per-patient dynamic wait-time prediction (build first)
- [ ] Bottleneck/anomaly detection layer on `descriptive.py`

## Documentation

- [ ] Merge relevant sections of this doc set into the team's existing `CLAUDE.md` once reviewed
- [ ] Re-verify `ARCHITECTURE.md`'s file/endpoint structure against the actual repo — it was drafted from conversation history, not a direct code read

## Deployment (Production Handoff, Not Urgent Yet)

- [ ] Supabase Realtime replacement (WebSocket polling via FastAPI) needed if migrating off Supabase
- [ ] HTTPS / reverse proxy setup for PHC on-prem server
- [ ] Docker packaging for PHC IT/MIS handoff

---

_Add new items as they surface. Move resolved items to a "Resolved" section below with the date, rather than deleting them — useful for Chapter 4 documentation of the security work done._

## Not Resolved

- [ ] `patients` RLS wide open (all policies `true`) — fixed with `is_historical`-scoped policies
- [ ] `services` table — anon could INSERT/DELETE the kiosk service menu — fixed, superadmin-only writes
- [ ] `users` table — public (no-login) read access to accounts — fixed, self-read + superadmin-all
- [ ] No route-level middleware existed — `middleware.ts` added
- [ ] Import script used anon key and never marked rows historical — fixed
