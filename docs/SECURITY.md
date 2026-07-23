# Heart Check PHC — Security Documentation

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

### Current design

Access on `patients` is scoped using a new `is_historical` column (added during this pass — the table had no live/historical distinction before) to separate **live operational rows** (kiosk-created, `is_historical = false`) from **historical imported rows** (`is_historical = true`). No role — not even superadmin, through the app itself — can update or delete historical rows through normal RLS-governed access; that's reserved for a manual, service-role-key operation outside the app (the import script itself, run locally).

| Operation | Kiosk (public) | Monitor (public) | Nurse/Transfer | Dashboard (admin) | Superadmin                                          |
| --------- | -------------- | ---------------- | -------------- | ----------------- | --------------------------------------------------- |
| SELECT    | —              | live rows only   | all rows       | all rows          | all rows                                            |
| INSERT    | live rows only | —                | —              | —                 | —                                                   |
| UPDATE    | —              | —                | live rows only | —                 | —                                                   |
| DELETE    | —              | —                | —              | —                 | live rows only (historical never deletable via app) |

`services` and `users` are locked down to superadmin-only writes, matching the `doctors`/`app_settings` pattern.

Helper functions (`is_staff()`, `is_superadmin()`) wrap the `users.role` check as `SECURITY DEFINER` functions, joining on `auth_id = auth.uid()` (not `id`), to avoid RLS self-recursion when a policy on `users` needs to query `users` itself.

Full SQL for all of the above is in `CHANGES_NEEDED.md`.

### Kiosk write path (open item)

Kiosk inserts currently go through the public anon key directly to Supabase. With the corrected `patients_insert_kiosk` policy this is now scoped (can only insert live, non-historical rows with a `patientNum`), which meaningfully reduces the risk — but a more defensible long-term design still routes kiosk submissions through a FastAPI endpoint using the Supabase **service role key** server-side, so the anon key never needs INSERT rights on `patients` at all and the write path is validated/sanitized server-side before touching the database. Treat the current RLS-scoped anon insert as the acceptable interim state, not the final design.

### Import script — separately fixed

`import_phc_data.py` was found to be using the anon key for historical data imports, and never marking its own rows as historical. Both are fixed: it now uses the service role key and explicitly sets `is_historical = true`. See `CHANGES_NEEDED.md` for the exact diff.

## Layer 2 — Route-Level Access Control

### Where we started

`useRoleGuard` — a client-side React hook querying `users.role` and redirecting unauthorized users — was the only access control on protected routes, and `middleware.ts` did not exist at all. This has a known gap: Next.js sends the page to the browser first, the page begins rendering, and only then does the hook run its check and redirect. In the window between page-load and redirect, unauthorized content can flash or be briefly interactive — and this check can be bypassed entirely by anyone disabling JavaScript or intercepting the client-side redirect.

**Open item:** confirm `useRoleGuard`'s implementation actually queries `users`/`auth_id` correctly — not yet reviewed against the real hook code, only assumed to match the corrected schema.

### Current design

**Next.js Middleware** (`middleware.ts`, project root) runs server-side, before any protected page is delivered to the browser. Unauthorized requests are redirected before rendering — no flash, no client-bypassable check.

```
/superadmin → superadmin only
/dashboard  → admin, superadmin
/nurse      → nurse, staff, admin, superadmin
/transfer   → nurse, staff, admin, superadmin
/kiosk      → public, no auth check (excluded from middleware matcher)
/monitor    → public, no auth check (excluded from middleware matcher)
/login      → public
```

`useRoleGuard` is retained alongside middleware — not redundant, but complementary: middleware is the security boundary, the hook remains useful for in-page conditional UI (hiding buttons, conditional rendering) that doesn't warrant a full page redirect.

**Design decision to confirm with team:** admin/superadmin are currently allowed to fall through into `/nurse` and `/transfer` (oversight/support access). If admins should be fully separated from nurse/transfer workflows instead, remove them from those route arrays.

**Required follow-up:** create an `/unauthorized` page — middleware redirects there on a failed role check, and without the page existing, that redirect currently resolves to a 404 instead of a clean access-denied message.

## Other Open Items

- **CORS** — not yet locked down on the FastAPI backend. Needed before PHC on-prem handoff, cheap to do earlier.
- **Rate limiting** — `slowapi` recommended on the analytics report endpoints, since these are the most computationally expensive (pandas/statsmodels) and most exposed to abuse.
- **HTTPS/reverse proxy** — required for the PHC on-premises handoff; not yet addressed.

## Why This Matters for the Thesis Defense

A technical evaluator — particularly PHC MIS staff conducting UAT — can trivially check Supabase's policy list and immediately spot an all-`true` RLS configuration. Closing this before UAT is both a genuine security improvement and a defensible answer if questioned directly on data protection during defense. The two-layer design (RLS + middleware) is also a legitimate "defense in depth" talking point: even if one layer is misconfigured or bypassed, the other still holds.

---

_Last updated: reflects the full schema audit, RLS cleanup across `patients`/`services`/`users`, and middleware implementation. Remaining follow-ups tracked in `OPEN_ISSUES.md`._
