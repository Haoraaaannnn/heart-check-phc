# Heart Check PHC — Raw Schema Reference

**This is a literal dump, not a narrative explanation.** For context, reasoning, and gotchas, see `DATABASE_SCHEMA.md`. This doc exists so there's always an exact, copy-pasteable source of truth to diff against — regenerate and replace this file wholesale whenever the schema changes, rather than hand-editing it.

**Last captured:** during the security audit pass (RLS review of all tables). Columns/policies below reflect the live database at that time — `is_historical` on `patients` does not yet appear here because it was proposed during that pass, not yet confirmed applied. Re-pull and replace this file after running the migration in `CHANGES_NEEDED.md`.

---

## Table `services`

| Name              | Type   | Constraints |
| ----------------- | ------ | ----------- |
| `id`              | `int4` | Primary     |
| `label_en`        | `text` |             |
| `label_fil`       | `text` |             |
| `icon_src`        | `text` |             |
| `display_order`   | `int4` | Nullable    |
| `description_en`  | `text` | Nullable    |
| `description_fil` | `text` | Nullable    |
| `patient_type`    | `text` | Nullable    |

## Table `users`

| Name         | Type          | Constraints      |
| ------------ | ------------- | ---------------- |
| `id`         | `int8`        | Primary Identity |
| `created_at` | `timestamptz` |                  |
| `username`   | `text`        | Unique           |
| `email`      | `text`        | Unique           |
| `role`       | `text`        |                  |
| `auth_id`    | `uuid`        | Unique           |

## Table `patients`

| Name                     | Type          | Constraints      |
| ------------------------ | ------------- | ---------------- |
| `id`                     | `int8`        | Primary Identity |
| `created_at`             | `timestamptz` |                  |
| `phoneNum`               | `int8`        | Nullable         |
| `service`                | `varchar`     | Nullable         |
| `patientNum`             | `text`        | Nullable         |
| `cubicleNum`             | `text`        | Nullable         |
| `status`                 | `text`        | Nullable         |
| `updated_at`             | `timestamptz` | Nullable         |
| `reg_end`                | `timestamptz` | Nullable         |
| `consult_start`          | `timestamptz` | Nullable         |
| `consult_end`            | `timestamptz` | Nullable         |
| `reg_start`              | `timestamptz` | Nullable         |
| `counter`                | `int4`        | Nullable         |
| `called_at`              | `timestamptz` | Nullable         |
| `timeout_seconds`        | `int4`        | Nullable         |
| `queue_position`         | `int4`        | Nullable         |
| `progress_started_at`    | `timestamptz` | Nullable         |
| `cubicle_top_started_at` | `timestamptz` | Nullable         |

## Table `cubicle`

| Name          | Type          | Constraints      |
| ------------- | ------------- | ---------------- |
| `id`          | `int8`        | Primary Identity |
| `created_at`  | `timestamptz` |                  |
| `cubicleNum`  | `text`        | Nullable         |
| `category`    | `text`        | Nullable         |
| `room`        | `int4`        | Nullable         |
| `subcategory` | `text`        | Nullable         |
| `doctorId`    | `uuid`        | Nullable         |

## Table `patient_category`

| Name        | Type   | Constraints      |
| ----------- | ------ | ---------------- |
| `id`        | `int8` | Primary Identity |
| `label_en`  | `text` | Nullable         |
| `label_fil` | `text` | Nullable         |
| `icon_src`  | `text` | Nullable         |
| `order`     | `int8` | Nullable         |
| `type`      | `text` | Nullable         |

## Table `app_settings`

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `key`        | `text`        | Primary     |
| `value`      | `text`        |             |
| `updated_at` | `timestamptz` | Nullable    |

## Table `doctors`

| Name         | Type          | Constraints     |
| ------------ | ------------- | --------------- |
| `id`         | `uuid`        | Primary         |
| `full_name`  | `text`        |                 |
| `specialty`  | `text`        | Nullable        |
| `email`      | `text`        | Nullable Unique |
| `auth_id`    | `uuid`        | Nullable        |
| `active`     | `bool`        |                 |
| `created_at` | `timestamptz` | Nullable        |

---

## RLS Policies

### `doctors`

| Policy                                 | Command | Roles         | Action     | USING                                                                                                        | WITH CHECK                                                                                                   |
| -------------------------------------- | ------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Authenticated users can read doctors` | SELECT  | authenticated | PERMISSIVE | `true`                                                                                                       | —                                                                                                            |
| `Superadmin can delete doctors`        | DELETE  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` | —                                                                                                            |
| `Superadmin can insert doctors`        | INSERT  | authenticated | PERMISSIVE | —                                                                                                            | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |
| `Superadmin can update doctors`        | UPDATE  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |

### `cubicle`

| Policy                                 | Command | Roles         | Action     | USING                                                                                                        | WITH CHECK                                                                                                   |
| -------------------------------------- | ------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Allow authenticated read`             | SELECT  | authenticated | PERMISSIVE | `true`                                                                                                       | —                                                                                                            |
| `Authenticated users can read cubicle` | SELECT  | authenticated | PERMISSIVE | `true`                                                                                                       | —                                                                                                            |
| `Superadmin can update cubicle`        | UPDATE  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |

_No INSERT/DELETE policy exists — both fully blocked under RLS by default. Flagged as an open item in `OPEN_ISSUES.md`._

### `services`

| Policy                             | Command | Roles  | Action     | USING  | WITH CHECK |
| ---------------------------------- | ------- | ------ | ---------- | ------ | ---------- |
| `Allow anon deletion on services`  | DELETE  | anon   | PERMISSIVE | `true` | —          |
| `Allow anon insert on services`    | INSERT  | anon   | PERMISSIVE | —      | `true`     |
| `Allow public read on services`    | SELECT  | anon   | PERMISSIVE | `true` | —          |
| `Enable read access for all users` | SELECT  | public | PERMISSIVE | `true` | —          |

_⚠️ As captured: anon has INSERT/DELETE on the kiosk's service menu. Fix specified in `CHANGES_NEEDED.md` step 3 — confirm applied and re-pull this table's policies to verify._

### `users`

| Policy                             | Command | Roles  | Action     | USING  | WITH CHECK |
| ---------------------------------- | ------- | ------ | ---------- | ------ | ---------- |
| `Enable read access for all users` | SELECT  | public | PERMISSIVE | `true` | —          |

_⚠️ As captured: public (no login) can read all account rows. Fix specified in `CHANGES_NEEDED.md` step 4 — confirm applied._

### `patient_category`

| Policy              | Command | Roles  | Action     | USING  | WITH CHECK |
| ------------------- | ------- | ------ | ---------- | ------ | ---------- |
| `Allow public read` | SELECT  | public | PERMISSIVE | `true` | —          |

_Not yet reviewed for write policies — flagged in `OPEN_ISSUES.md`._

### `patients`

| Policy                                         | Command | Roles         | Action     | USING  | WITH CHECK |
| ---------------------------------------------- | ------- | ------------- | ---------- | ------ | ---------- |
| `Allow authenticated read`                     | SELECT  | authenticated | PERMISSIVE | `true` | —          |
| `Allow authenticated update`                   | UPDATE  | authenticated | PERMISSIVE | `true` | `true`     |
| `Allow authenticated users to read patients`   | SELECT  | authenticated | PERMISSIVE | `true` | —          |
| `Allow authenticated users to select patients` | SELECT  | authenticated | PERMISSIVE | `true` | —          |
| `Allow insert for all`                         | INSERT  | public        | PERMISSIVE | —      | `true`     |
| `Allow public delete on patients`              | DELETE  | anon          | PERMISSIVE | `true` | —          |
| `Allow public insert`                          | INSERT  | anon          | PERMISSIVE | —      | `true`     |
| `Allow public insert on patients`              | INSERT  | anon          | PERMISSIVE | —      | `true`     |
| `Allow public read`                            | SELECT  | anon          | PERMISSIVE | `true` | —          |
| `Allow public read on patients`                | SELECT  | anon          | PERMISSIVE | `true` | —          |

_⚠️ As captured: every policy unconditioned (`true`), including public DELETE. Fix specified in `CHANGES_NEEDED.md` step 5 — confirm applied and re-pull this table's policies to verify the 10 policies above are gone, not just shadowed._

### `app_settings`

| Policy                                      | Command | Roles         | Action     | USING                                                                                                        | WITH CHECK                                                                                                   |
| ------------------------------------------- | ------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Authenticated users can read app_settings` | SELECT  | authenticated | PERMISSIVE | `true`                                                                                                       | —                                                                                                            |
| `Superadmin can insert app_settings`        | INSERT  | authenticated | PERMISSIVE | —                                                                                                            | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |
| `Superadmin can update app_settings`        | UPDATE  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |

_Correctly designed — no changes needed. Used as the reference pattern for fixing other tables._

---

## How to Regenerate This File

Run against Supabase SQL Editor and export/paste the results back into this doc:

```sql
-- Columns for all tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- RLS policies for all tables
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
