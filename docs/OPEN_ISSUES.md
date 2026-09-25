# Heart Check PHC — Open & Resolved Issues Tracker

Running list of known follow-ups, ongoing tasks, and resolved fixes. Move resolved items to the "Resolved" section with context and date rather than deleting them — providing clear documentation of engineering decisions for thesis Chapter 4.

---

## 🟡 Open Issues

### Security
- [ ] `useRoleGuard` hook — confirm all query paths consistently use `users`/`auth_id`, matching the schema rather than legacy `profiles`/`id`.
- [ ] `cubicle` table — confirm whether absence of INSERT/DELETE policies under RLS is intentional (managed strictly via superadmin / service role key) or requires explicit policies.
- [ ] `patient_category` table — audit RLS write policies to ensure non-superadmin accounts cannot modify categories.
- [ ] CORS configuration on FastAPI backend — specify permitted origins before on-premises deployment.
- [ ] Rate limiting (`slowapi`) on analytics endpoints — protect CPU-heavy statsmodels/ARIMA computations.
- [ ] `/unauthorized` page creation — build a dedicated access-denied page for middleware redirects.
- [ ] Kiosk write path hardening — migrate kiosk `INSERT` from direct anon Supabase client to an authenticated FastAPI service-role proxy endpoint.

### Data & Schema
- [ ] Confirm exact `users.role` string casing in production database (`'superadmin'`, `'admin'`, `'nurse'`, `'staff'`).
- [ ] Apply `is_historical` column migration and backfill on live Supabase `patients` table (see `CHANGES_NEEDED.md` Step 1).
- [ ] Statistical validation of Poisson/exponential queue assumptions (`distribution_tests.py`) once extensive real-world PHC logs are recorded.

### Analytics & ML (Post-Chapter 4 Planning)
- [ ] Dynamic per-patient wait-time prediction model based on assigned cubicle, historical pace, and queue depth.
- [ ] Bottleneck & stage anomaly detection alerts for OPD triage administrators.

### Production Handoff & Deployment
- [ ] On-premise PostgreSQL migration strategy (replacing Supabase Realtime with FastAPI WebSocket channels).
- [ ] Reverse proxy (Nginx) & SSL configuration for PHC intranet.
- [ ] Docker containerization for Next.js frontend and FastAPI backend.

---

## 🟢 Resolved Issues

### Clinical Transfer Dashboard Redesign & Bug Fixes (September 2026)

- [x] **Infinite Render Loop / Stuck on "Verifying account access...":**
  - *Symptom:* Transfer dashboard was permanently frozen displaying the loading spinner.
  - *Cause:* `initialize()` `useEffect` in `app/transfer/page.tsx` included unmemoized query functions (`fetchMyAccess`, `fetchCubicles`) in its dependency array, re-triggering state changes on every render.
  - *Resolution:* Wrapped data fetching functions in `useCallback` and restricted mount initialization to run once on component mount (`[]`).

- [x] **Back Button Caused Accidental Logout:**
  - *Symptom:* Clicking the back button inside the transfer dashboard navigated to `/login`, logging the staff member out.
  - *Cause:* `components/reusables/BackButton.tsx` executed `if (onClick) onClick(e); if (!href) router.back();` without a `return`, causing it to execute both the custom click handler and the browser history pop back to `/login`.
  - *Resolution:* Added an immediate `return` when `onClick` is provided, and updated `handleBack()` in `page.tsx` to safely step backward through dashboard states (`Room` → `Subcategory` → `Category`).

- [x] **Back Button & Breadcrumbs Scrolled With Content:**
  - *Symptom:* When scrolling down cubicle or counter lists, the back button and breadcrumb bar scrolled off the screen.
  - *Cause:* The outer container had `min-h-screen`, causing the entire window to scroll.
  - *Resolution:* Pinned the root viewport with `h-screen overflow-hidden`, placed `BreadcrumbNav` and `BackButton` inside a sticky sub-header (`shrink-0 z-20`), and designated `<main>` as the sole scrolling element (`overflow-y-auto min-h-0 phc-scroll`).

- [x] **Patient Group Selector Missing Pedia:**
  - *Symptom:* Subcategory selector only showed "Adult" and omitted "Pedia" for certain staff members.
  - *Cause:* `getAllowedSubcategories` filtered subcategories strictly against `myRooms`. If the user's assigned rooms lacked pediatric entries, Pedia was hidden entirely.
  - *Resolution:* Configured `ConsultationFlow` and `OPScreeningFlow` to display both Adult and Pedia cards, falling back to the database `cubicles` table when personal room mappings are incomplete.

- [x] **Room Selection Cards Missing Queue Counts:**
  - *Symptom:* Room cards (e.g. Room 4) showed zero queued patients.
  - *Cause:* `RoomPicker` only tallied patients already assigned to cubicles and ignored waiting patients in the queue.
  - *Resolution:* Updated `RoomPicker` to inspect `onProgressPatients` and match `preferredCubicleNums` containing the room identifier (e.g. `Consultation R4 C1`), displaying both live queue counts (`X in queue`) and assigned counts (`Y assigned`) with pulsing alerts.

- [x] **Touchscreen & Tablet Incompatibility with Drag-and-Drop:**
  - *Symptom:* HTML5 / mouse-only drag-and-drop failed on clinical tablets, touch monitors, and stylus pens.
  - *Cause:* Previous drag implementation relied on raw desktop `mousedown`/`mousemove`/`mouseup` events.
  - *Resolution:* Implemented unified Pointer Events engine (`dragUtils.ts`, `DragHandle.tsx`, `DragGhost.tsx`) supporting touch coordinates, multi-device pointer normalization, and an unclipped portal drag preview.

- [x] **Queue Reordering / Out-of-Order Assignment (FIFO Violation):**
  - *Symptom:* Staff could drag any arbitrary patient from anywhere in the queue.
  - *Resolution:* Enforced strict FIFO queue lock: only `index === 0` ("Serving Next") is unlocked, draggable, and assignable; `index > 0` patients are locked in the stack with a lock badge.

### Security & Data Layer Fixes

- [x] **`patients` Table RLS Wide Open:**
  - *Symptom:* Ten unconditional `true` policies allowed public deletion of historical and live queue records.
  - *Resolution:* Implemented `is_historical`-scoped policies restricting modifications to authenticated staff and separating live from historical rows.

- [x] **`services` Table Vulnerability:**
  - *Symptom:* Anon public role had permissions to INSERT and DELETE kiosk services.
  - *Resolution:* Locked all write operations (`INSERT`, `UPDATE`, `DELETE`) to verified superadmins via `is_superadmin()` security definer function.

- [x] **`users` Table Account Information Leak:**
  - *Symptom:* Public role could read all usernames, emails, and roles.
  - *Resolution:* Restricted `SELECT` to authenticated self-reads (`auth_id = auth.uid()`) and superadmin oversight.

- [x] **Missing Server-Side Route Guard:**
  - *Symptom:* Pages relied solely on client-side React hook, causing flashes of protected pages.
  - *Resolution:* Implemented server-side `middleware.ts` gating `/superadmin`, `/dashboard`, `/nurse`, and `/transfer` before page rendering.

- [x] **Historical Data Import Key & Flag:**
  - *Symptom:* `import_phc_data.py` imported Excel data using the public anon key without setting `is_historical`.
  - *Resolution:* Swapped to `SUPABASE_SERVICE_ROLE_KEY` and explicitly flagged inserted records with `is_historical = True`.
