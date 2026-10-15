# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Database Changes & Migration Verification

This document records the database schema updates, RLS helper functions, and security migration policies executed to secure the PostgreSQL database in Supabase.

**Status:** Verified and active against the live Supabase PostgreSQL database instance (Last updated: 2026-10-16).

---

## 1. Schema Column & Historical Partitioning

The `patients` table distinguishes imported historical records (March 2024 to December 2025) from live operational queue records using `is_historical`:

```sql
ALTER TABLE patients ADD COLUMN is_historical boolean NOT NULL DEFAULT false;

-- Backfilled using the reliable signal: historical imports did not populate patientNum
UPDATE patients SET is_historical = true WHERE "patientNum" IS NULL;
```

---

## 2. Role-Check Helper Functions

Helper functions evaluate user permissions without triggering recursive queries on `users`:

```sql
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_superadmin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION is_clinical_staff()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('nurse', 'admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION is_registration_staff()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('staff', 'admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION my_cubicle_nums()
RETURNS text[]
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(array_agg(c."cubicleNum"), ARRAY[]::text[])
  FROM user_cubicles uc
  JOIN cubicle c ON c.id = uc.cubicle_id
  JOIN users u ON u.id = uc.user_id
  WHERE u.auth_id = auth.uid();
$$;
```

---

## 3. Service Catalog Security (`services`)

Public `anon` write and delete permissions have been dropped. Writes are strictly restricted to superadmins:

```sql
DROP POLICY IF EXISTS "Allow anon deletion on services" ON services;
DROP POLICY IF EXISTS "Allow anon insert on services" ON services;
DROP POLICY IF EXISTS "Allow public read on services" ON services;

CREATE POLICY "Enable read access for all users"
ON services FOR SELECT TO public
USING (true);

CREATE POLICY "services_insert_superadmin"
ON services FOR INSERT TO authenticated
WITH CHECK (is_superadmin());

CREATE POLICY "services_update_superadmin"
ON services FOR UPDATE TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

CREATE POLICY "services_delete_superadmin"
ON services FOR DELETE TO authenticated
USING (is_superadmin());
```

---

## 4. User Account Directory Protection (`users`)

The legacy public read policy that leaked staff emails and roles has been removed:

```sql
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

CREATE POLICY "users_select_self"
ON users FOR SELECT TO authenticated
USING ((auth_id = auth.uid()) OR (lower(email) = lower((auth.jwt() ->> 'email'::text))));

CREATE POLICY "users_select_superadmin"
ON users FOR SELECT TO authenticated
USING (is_superadmin());
```

---

## 5. Queue Security & Historical Protection (`patients`)

All unconditioned legacy policies on `patients` have been dropped. Access is divided into clinical station scoping, registration desk access, Manila-day live scoping for TV monitors, and RESTRICTIVE policies preventing historical data mutation:

```sql
-- Clean up all unconditioned legacy policies
DROP POLICY IF EXISTS "Allow insert for all" ON patients;
DROP POLICY IF EXISTS "Allow public insert" ON patients;
DROP POLICY IF EXISTS "Allow public insert on patients" ON patients;
DROP POLICY IF EXISTS "Allow public delete on patients" ON patients;
DROP POLICY IF EXISTS "Allow public read" ON patients;
DROP POLICY IF EXISTS "Allow public read on patients" ON patients;

-- Public live TV monitors: only view today's active patients in Asia/Manila timezone
CREATE POLICY "patients_select_public_live"
ON patients FOR SELECT TO anon
USING ((is_historical = false) AND (created_at >= (date_trunc('day'::text, (now() AT TIME ZONE 'Asia/Manila'::text)) AT TIME ZONE 'Asia/Manila'::text)));

-- Nurse Station: scoped strictly to assigned cubicles
CREATE POLICY "patients_select_nurse_scoped"
ON patients FOR SELECT TO authenticated
USING (is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())));

CREATE POLICY "patients_update_nurse_scoped"
ON patients FOR UPDATE TO authenticated
USING (is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))
WITH CHECK (is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())));

-- Registration Desk (/transfer): manage operational live patients
CREATE POLICY "patients_select_registration_full"
ON patients FOR SELECT TO authenticated
USING (is_registration_staff());

CREATE POLICY "patients_update_registration_full"
ON patients FOR UPDATE TO authenticated
USING (is_registration_staff())
WITH CHECK (is_registration_staff());

CREATE POLICY "patients_insert_registration"
ON patients FOR INSERT TO authenticated
WITH CHECK (is_registration_staff());

-- Administrators: full operational queue management
CREATE POLICY "patients_select_admin"
ON patients FOR SELECT TO authenticated
USING (is_admin_or_superadmin());

CREATE POLICY "patients_update_admin"
ON patients FOR UPDATE TO authenticated
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "patients_insert_admin"
ON patients FOR INSERT TO authenticated
WITH CHECK (is_admin_or_superadmin());

-- Mandatory Immutability (PostgreSQL RESTRICTIVE Policies)
CREATE POLICY "patients_no_historical_insert"
ON patients AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (is_historical = false);

CREATE POLICY "patients_no_historical_update"
ON patients AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (is_historical = false)
WITH CHECK (is_historical = false);

CREATE POLICY "patients_no_historical_delete"
ON patients AS RESTRICTIVE FOR DELETE TO anon, authenticated
USING (is_historical = false);
```

---

## 6. Doctor & Station Assignments (`doctors`, `cubicle`)

```sql
-- doctors table: managed by registration staff or administrators
CREATE POLICY "Authenticated users can read doctors"
ON doctors FOR SELECT TO authenticated
USING (true);

CREATE POLICY "doctors_insert_managers"
ON doctors FOR INSERT TO authenticated
WITH CHECK (is_registration_staff() OR is_admin_or_superadmin());

CREATE POLICY "doctors_update_managers"
ON doctors FOR UPDATE TO authenticated
USING (is_registration_staff() OR is_admin_or_superadmin())
WITH CHECK (is_registration_staff() OR is_admin_or_superadmin());

CREATE POLICY "doctors_delete_managers"
ON doctors FOR DELETE TO authenticated
USING (is_registration_staff() OR is_admin_or_superadmin());

-- cubicle table: public read, doctor assignment managed by registration or admin
CREATE POLICY "Allow public read access"
ON cubicle FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "cubicle_update_doctor_assignment"
ON cubicle FOR UPDATE TO authenticated
USING (is_registration_staff() OR is_admin_or_superadmin())
WITH CHECK (is_registration_staff() OR is_admin_or_superadmin());
```

---

## 7. Historical Data Ingestion (`import_phc_data.py`)

Historical data ingestion in `python_backend/import_phc_data.py` operates under the following safeguards:
1. **Service Role Key:** Uses `SUPABASE_SERVICE_ROLE_KEY` to ingest records outside client RLS boundaries.
2. **Explicit Historical Flag:** Explicitly sets `is_historical = True` in `add_schema_columns()` and `to_supabase_records()`.

---

## 8. Verified & Resolved Items

- **Server-Side Route Proxy:** Implemented in `proxy.ts` using `@supabase/ssr` cookies; protects `/superadmin`, `/dashboard`, `/nurse`, and `/transfer`.
- **Unauthorized Screen:** Built at `/unauthorized`.
- **Kiosk Intake Architecture:** Kiosk self-service check-in executes `create_patient` stored procedure via Supabase RPC (`SECURITY DEFINER`), eliminating direct table `INSERT` requirements for anonymous tokens.
- **Facility and Join Tables:** `counters`, `patient_category`, `user_cubicles`, `user_services`, `user_rooms`, `user_counters`, `cubicle_selector`, `cubicle_selector_cubicle` active and verified.
- **Rate-Limiting Tables:** `login_attempts` and `password_reset_attempts` active and integrated into auth endpoints.

---

_Last updated: 2026-10-16 — All database migrations and policy changes documented here are verified against the active schema in Supabase._