# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Security Documentation

## Overview

This document covers access control at two layers: **row-level data access** (Supabase RLS) and **route-level page access** (Next.js Middleware + client-side role guard). Both are necessary — RLS protects the data even if someone bypasses the frontend entirely and queries Supabase directly; middleware/route guards protect the pages themselves.

## Roles

Stored in the `users` table (not `profiles` — corrected after reviewing the actual schema), keyed to Supabase Auth via `users.auth_id` (not `users.id`).

| Role               | Scope                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `superadmin`       | Full account management — create, update, delete any user account. Highest trust tier (e.g. PHC MIS or project owner). |
| `admin`            | Dashboard/analytics access.                                                                                            |
| `nurse`            | Queue operations — read live queue, update patient status/cubicle as they move through stages.                         |
| `staff`            | Same operational scope as `nurse` for transfer/queue handling.                                                         |
| _(public/no role)_ | Kiosk and Monitor — unauthenticated devices, no login.                                                                 |

**Open item:** confirm the exact string values stored in `users.role` match this table exactly (case-sensitive) — a mismatch here will silently fail every policy and route check.

## Layer 1 — Row Level Security (Supabase)

### Where we started

Full schema audit (via `pg_policies`) found RLS enabled across every table, but with wildly inconsistent quality:

- **`patients`** — 10 policies, all conditioned on `true`. Functionally no security at all, including a public `DELETE` policy: anyone holding the public anon key (visible in any frontend's compiled JS — this is normal and expected, not a leak) could delete rows directly, including historical data that forecasting/analytics depend on. Also had 4 duplicate "allow read" policies — residue from iteratively fixing the "dashboard shows zero data" bug via repeated RLS disable/re-enable rather than a deliberate access design.
- **`services`** — the single most severe finding. `anon` (fully public, no login) had both INSERT and DELETE rights on the kiosk's entire service menu. Anyone with the public key could have deleted every service and taken the kiosk offline instantly.
- **`users`** — a `SELECT` policy for the `public` role (not `authenticated` — literally anyone, no login) exposed every username, email, and role. Direct account-data leak.
- **`doctors`, `app_settings`** — already correctly designed: read open to `authenticated`, all writes gated to a `superadmin`-check via `EXISTS` against `users`. Used as the reference pattern for fixing the other tables.
- **`cubicle`** — read correctly scoped, writes correctly gated to superadmin, but has no INSERT/DELETE policy at all — meaning both are silently blocked by default under RLS. Needs confirmation this is intentional.
- **`patient_category`** — not yet reviewed in depth.

### Current design (as originally planned)

Access on `patients` is scoped using a new `is_historical` column (added during this pass — the table had no live/historical distinction before) to separate **live operational rows** (kiosk-created, `is_historical = false`) from **historical imported rows** (`is_historical = true`). No role — not even superadmin, through the app itself — can update or delete historical rows through normal RLS-governed access; that's reserved for a manual, service-role-key operation outside the app (the import script itself, run locally).

| Operation | Kiosk (public) | Monitor (public) | Nurse/Transfer | Dashboard (admin) | Superadmin                                          |
| --------- | -------------- | ---------------- | -------------- | ------------------ | ---------------------------------------------------- |
| SELECT    | —              | live rows only   | all rows       | all rows           | all rows                                              |
| INSERT    | live rows only | —                 | —              | —                   | —                                                      |
| UPDATE    | —              | —                 | live rows only | —                   | —                                                      |
| DELETE    | —              | —                 | —              | —                   | live rows only (historical never deletable via app)   |

`services` and `users` are locked down to superadmin-only writes, matching the `doctors`/`app_settings` pattern.

Helper functions (`is_staff()`, `is_superadmin()`) wrap the `users.role` check as `SECURITY DEFINER` functions, joining on `auth_id = auth.uid()` (not `id`), to avoid RLS self-recursion when a policy on `users` needs to query `users` itself.

Full SQL for all of the above is in `CHANGES_NEEDED.md`.

> **⚠️ Superseded — flag for a fresh audit.** The most recent live schema pull (`SCHEMA_REFERENCE.md`) shows the `patients` table's actual policy set no longer matches this table. The old wide-open `anon`/`public` policies (unconditioned INSERT/SELECT) are still present, and alongside them are new policies — `patients_select_nurse_scoped`, `patients_update_nurse_scoped` (both gated on `is_clinical_staff()` AND cubicle membership via `my_cubicle_nums()`), and `patients_select_registration_full`, `patients_update_registration_full` (gated on `is_registration_staff()`, unscoped by cubicle). None of the `is_historical`-scoped policies described above (`patients_select_public_live`, `patients_insert_kiosk`, `patients_update_staff_live_only`, `patients_delete_superadmin_live_only`) appear in the live pull, and there is no DELETE policy at all currently. `is_clinical_staff()`, `is_registration_staff()`, and `my_cubicle_nums()` are new helper functions, not yet documented here. This table's access model has evolved past a live/historical split into a per-cubicle, per-role staff-assignment model (see the new `user_cubicles`, `user_services`, `user_rooms`, `user_counters` tables in `DATABASE_SCHEMA.md`) — this section needs a rewrite once the actual intended policy set is confirmed, not a patch.
>
> Similarly, `doctors`' write policies in the live pull show plain `true`/`authenticated`-only checks (`Authenticated users can delete/insert/update doctors`), not the superadmin-gated `EXISTS` checks described above — confirm whether this is a regression or an intentional loosening before treating it as fixed.
>
> `cubicle` now also has an `Allow public read access` policy for `anon, authenticated`, on top of the two authenticated-only read policies already listed — three overlapping SELECT policies, same duplicate-policy pattern flagged on `patients` originally.

### Kiosk write path (open item)

Kiosk inserts currently go through the public anon key directly to Supabase. With the corrected `patients_insert_kiosk` policy this is now scoped (can only insert live, non-historical rows with a `patientNum`), which meaningfully reduces the risk — but a more defensible long-term design still routes kiosk submissions through a FastAPI endpoint using the Supabase **service role key** server-side, so the anon key never needs INSERT rights on `patients` at all and the write path is validated/sanitized server-side before touching the database. Treat the current RLS-scoped anon insert as the acceptable interim state, not the final design.

> Note: per the live schema pull above, the wide-open `anon` INSERT policies (`Allow insert for all`, `Allow public insert`, `Allow public insert on patients`) still appear present — confirm `patients_insert_kiosk` was actually applied and the old ones dropped, or this paragraph is describing an unapplied fix.

### Import script — separately fixed

`import_phc_data.py` was found to be using the anon key for historical data imports, and never marking its own rows as historical. Both are fixed: it now uses the service role key and explicitly sets `is_historical = true`. See `CHANGES_NEEDED.md` for the exact diff.

## Layer 2 — Route-Level Access Control

### Current state

Route protection is **still client-side only**. `useRoleGuard` (and/or `lib/supabase/authGuard.ts`) queries `users.role` and redirects unauthorized users, but this runs *after* Next.js has already sent the page to the browser — there is a window where unauthorized content can flash or be briefly interactive, and the check can be bypassed by disabling JavaScript or intercepting the client-side redirect.

`middleware.ts` does **not** exist in the repo. This was previously documented here as implemented — that was incorrect. It remains a planned fix, not a completed one.

**Open item:** confirm `useRoleGuard`/`authGuard.ts` actually queries `users`/`auth_id` correctly against the corrected schema — not yet reviewed against the real hook code.

### Planned design (not yet built)

Server-side middleware, matching this route map, still needs to be added:

/superadmin → superadmin only
/dashboard → admin, superadmin
/nurse → nurse, staff, admin, superadmin
/transfer → nurse, staff, admin, superadmin
/kiosk → public, no auth check
/monitor → public, no auth check
/login → public


An `/unauthorized` page also does not exist yet and will be needed once middleware redirects to it.

**Design decision to confirm with team:** admin/superadmin are currently allowed to fall through into `/nurse` and `/transfer` (oversight/support access) in the planned route map above. If admins should be fully separated from nurse/transfer workflows instead, remove them from those route arrays once middleware is built.

## Other Open Items

- **CORS** — configured for development frontend origins (`localhost:3000`, `127.0.0.1:3000`) via `CORSMiddleware` in `python_backend/main.py`. Requires updating to official PHC domain/IP upon on-premise production deployment.
- **Rate limiting** — `slowapi` recommended on the analytics report endpoints, since these are the most computationally expensive (pandas/statsmodels) and most exposed to abuse. Note: `login_attempts` and `password_reset_attempts` tables now exist in the live schema, suggesting some rate-limiting/lockout logic has been added for auth endpoints specifically — not yet documented here, confirm scope.
- **HTTPS/reverse proxy** — required for the PHC on-premises handoff; not yet addressed.
- **New staff-assignment tables** (`user_cubicles`, `user_services`, `user_rooms`, `user_counters`, `cubicle_selector`, `cubicle_selector_cubicle`) — not yet covered in this document at all; the `patients` scoped-RLS model above depends on these. Needs its own section once the intended design is confirmed.

## Why This Matters for the Thesis Defense

A technical evaluator — particularly PHC MIS staff conducting UAT — can trivially check Supabase's policy list and immediately spot an all-`true` RLS configuration. Closing this before UAT is both a genuine security improvement and a defensible answer if questioned directly on data protection during defense. The two-layer design (RLS + middleware) is also a legitimate "defense in depth" talking point — once middleware is actually built — even if one layer is misconfigured or bypassed, the other still holds.

---

_Last updated: reflects the full schema audit and RLS cleanup across `patients`/`services`/`users` as originally planned. Route-level middleware is still an open item, not yet built — see `CHANGES_NEEDED.md`. A newer live schema pull shows `patients`/`doctors`/`cubicle` policies have diverged further from this document's "Current design" section — flagged inline above, needs a follow-up audit pass. Remaining follow-ups tracked in `OPEN_ISSUES.md`._