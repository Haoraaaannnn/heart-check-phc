# Heart Check PHC — Changes Needed (Security Pass)

This document lists every concrete change to apply, in order. Nothing here is optional — each item closes a real gap found while auditing the actual schema. Apply in the order listed; some steps depend on earlier ones.

## 1. Add the missing schema column

`patients` currently has no way to tell historical/imported rows apart from live kiosk rows. Add one:

```sql
ALTER TABLE patients ADD COLUMN is_historical boolean NOT NULL DEFAULT false;

-- backfill using the only reliable existing signal: the import script never wrote patientNum
UPDATE patients SET is_historical = true WHERE "patientNum" IS NULL;
```

## 2. Add role-check helper functions

Avoids RLS self-recursion when a table's own policy needs to check `users.role`.

```sql
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('nurse','staff','admin','superadmin')
  );
$$;
```

## 3. Fix `services` — highest priority

Currently `anon` (fully public, no login) can INSERT and DELETE. This is the kiosk's entire menu — a public key holder could wipe it and take the kiosk down.

```sql
DROP POLICY "Allow anon deletion on services" ON services;
DROP POLICY "Allow anon insert on services" ON services;
DROP POLICY "Allow public read on services" ON services; -- duplicate, "Enable read access for all users" already covers it

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

## 4. Fix `users` — public account data leak

`Enable read access for all users` currently applies to `public` (no login required) — anyone can read every username, email, and role.

```sql
DROP POLICY "Enable read access for all users" ON users;

CREATE POLICY "users_select_self"
ON users FOR SELECT TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "users_select_superadmin_all"
ON users FOR SELECT TO authenticated
USING (is_superadmin());

CREATE POLICY "users_insert_superadmin"
ON users FOR INSERT TO authenticated
WITH CHECK (is_superadmin());

CREATE POLICY "users_update_superadmin"
ON users FOR UPDATE TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

CREATE POLICY "users_delete_superadmin"
ON users FOR DELETE TO authenticated
USING (is_superadmin());
```

## 5. Fix `patients` — RLS wide open + no historical protection

```sql
DROP POLICY "Allow authenticated read" ON patients;
DROP POLICY "Allow authenticated update" ON patients;
DROP POLICY "Allow authenticated users to read patients" ON patients;
DROP POLICY "Allow authenticated users to select patients" ON patients;
DROP POLICY "Allow insert for all" ON patients;
DROP POLICY "Allow public delete on patients" ON patients;
DROP POLICY "Allow public insert" ON patients;
DROP POLICY "Allow public insert on patients" ON patients;
DROP POLICY "Allow public read" ON patients;
DROP POLICY "Allow public read on patients" ON patients;

CREATE POLICY "patients_select_public_live"
ON patients FOR SELECT TO anon
USING (is_historical = false);

CREATE POLICY "patients_select_staff_all"
ON patients FOR SELECT TO authenticated
USING (is_staff());

CREATE POLICY "patients_insert_kiosk"
ON patients FOR INSERT TO anon
WITH CHECK (is_historical = false AND "patientNum" IS NOT NULL);

CREATE POLICY "patients_update_staff_live_only"
ON patients FOR UPDATE TO authenticated
USING (is_staff() AND is_historical = false)
WITH CHECK (is_historical = false);

CREATE POLICY "patients_delete_superadmin_live_only"
ON patients FOR DELETE TO authenticated
USING (is_superadmin() AND is_historical = false);
```

## 6. Update `import_phc_data.py`

Two changes — this script currently uses the public anon key and never marks its own rows as historical, both of which conflict with the new `patients` policies above.

**a) Swap the key** (add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` — Supabase dashboard → Project Settings → API → service_role secret):

```python
# before
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
# after
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
```

**b) Mark inserted rows as historical**, in `add_schema_columns()`:

```python
def add_schema_columns(df):
    df["created_at"] = df["reg_start"]
    df["service"]    = "Consultation"
    df["status"]     = "Done"
    df["phoneNum"]   = None
    df["cubicleNum"] = None
    df["is_historical"] = True   # add this
    return df
```

And add `"is_historical"` to the column list in `to_supabase_records()`, or it gets silently dropped:

```python
cols = ["created_at", "phoneNum", "service",
         "cubicleNum", "status", "reg_start", "reg_end",
         "consult_start", "consult_end", "is_historical"]  # added here
```

⚠️ Test on one sheet before running against all files — the service role key bypasses RLS entirely, so a mistake here isn't caught by any policy.

## 7. Add `middleware.ts` (did not exist before this pass)

Place at project root. Corrects two wrong assumptions from earlier drafts: the role table is `users` (not `profiles`), and the join column is `auth_id` (not `id`).

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const roleRoutes: Record<string, string[]> = {
  "/superadmin": ["superadmin"],
  "/dashboard": ["admin", "superadmin"],
  "/nurse": ["nurse", "staff", "admin", "superadmin"],
  "/transfer": ["nurse", "staff", "admin", "superadmin"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const matchedPrefix = Object.keys(roleRoutes).find((p) => path.startsWith(p));

  if (matchedPrefix) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (!userRow || !roleRoutes[matchedPrefix].includes(userRow.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/dashboard/:path*",
    "/nurse/:path*",
    "/transfer/:path*",
  ],
};
```

Also create a basic `/unauthorized` page — the redirect above resolves to a 404 without it.

## Still Open — Not Yet Fixed

- **`useRoleGuard` hook** — needs the same `profiles`→`users`, `id`→`auth_id` correction if it was written against the old assumed schema. Not yet reviewed against actual code.
- **`cubicle`** — has no INSERT/DELETE policy at all, meaning both are fully blocked under RLS by default. Confirm this is intentional (managed only via service role / Supabase dashboard) rather than an oversight.
- **CORS** on FastAPI — not yet configured.
- **Rate limiting** on analytics endpoints — `slowapi` recommended, not yet applied.
- **`patient_category` table** — appeared in the schema dump but hasn't been discussed; check whether it needs the same RLS review as `services`.

---

_Apply in order. After running, re-query `pg_policies` for each table to confirm the old `true`-only policies are actually gone, not just shadowed by new ones._
