# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Raw Schema Reference

**This is a literal dump, not a narrative explanation.** For context, reasoning, and gotchas, see `DATABASE_SCHEMA.md`. This doc exists so there's always an exact, copy-pasteable source of truth to diff against — regenerate and replace this file wholesale whenever the schema changes, rather than hand-editing it.

**Last captured:** latest schema pull, reflecting the cubicle/service/room/counter staff-assignment model and the nurse/registration RLS scoping. Supersedes the earlier `is_historical`-only access model described in `SECURITY.md`/`CHANGES_NEEDED.md` — those docs have not yet been reconciled against this dump.

---

## Table `services`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `label_en` | `text` |  |
| `label_fil` | `text` |  |
| `icon_src` | `text` |  |
| `display_order` | `int4` | Nullable |
| `description_en` | `text` | Nullable |
| `description_fil` | `text` | Nullable |
| `patient_type` | `text` | Nullable |

## Table `users`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `username` | `text` | Unique |
| `email` | `text` | Unique |
| `role` | `text` |  |
| `auth_id` | `uuid` | Unique |
| `assigned_room` | `int4` | Nullable |

## Table `patients`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `phoneNum` | `int8` | Nullable |
| `service` | `varchar` | Nullable |
| `patientNum` | `text` | Nullable |
| `cubicleNum` | `text` | Nullable |
| `status` | `text` | Nullable |
| `updated_at` | `timestamptz` | Nullable |
| `reg_start` | `timestamptz` | Nullable |
| `reg_end` | `timestamptz` | Nullable |
| `consult_start` | `timestamptz` | Nullable |
| `consult_end` | `timestamptz` | Nullable |
| `counter` | `int4` | Nullable |
| `called_at` | `timestamptz` | Nullable |
| `timeout_seconds` | `int4` | Nullable |
| `queue_position` | `int4` | Nullable |
| `progress_started_at` | `timestamptz` | Nullable |
| `cubicle_top_started_at` | `timestamptz` | Nullable |
| `preferredCubicleNums` | `_text` | Nullable |
| `subcategory` | `text` | Nullable |
| `carryout_start` | `timestamptz` | Nullable |
| `carryout_end` | `timestamptz` | Nullable |
| `is_historical` | `bool` |  |
| `cooldown_until` | `timestamptz` | Nullable |
| `rotation_count` | `int4` |  |
| `counter_rejoin_at` | `timestamptz` | Nullable |
| `counter_top_started_at` | `timestamptz` | Nullable |
| `idle_at` | `timestamptz` | Nullable |
| `removed_at` | `timestamptz` | Nullable |

## Table `cubicle`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `cubicleNum` | `text` | Nullable |
| `category` | `text` | Nullable |
| `room` | `int4` | Nullable |
| `subcategory` | `text` | Nullable |
| `doctorId` | `uuid` | Nullable |

## Table `patient_category`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `label_en` | `text` | Nullable |
| `label_fil` | `text` | Nullable |
| `icon_src` | `text` | Nullable |
| `order` | `int8` | Nullable |
| `type` | `text` | Nullable |

## Table `app_settings`

| Name | Type | Constraints |
|------|------|-------------|
| `key` | `text` | Primary |
| `value` | `text` |  |
| `updated_at` | `timestamptz` | Nullable |

## Table `doctors`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `full_name` | `text` |  |
| `specialty` | `text` | Nullable |
| `email` | `text` | Nullable Unique |
| `auth_id` | `uuid` | Nullable |
| `active` | `bool` |  |
| `created_at` | `timestamptz` | Nullable |

## Table `login_attempts`

| Name | Type | Constraints |
|------|------|-------------|
| `email` | `text` | Primary |
| `attempt_count` | `int4` |  |
| `locked_until` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

## Table `password_reset_attempts`

| Name | Type | Constraints |
|------|------|-------------|
| `email` | `text` | Primary |
| `request_count` | `int4` |  |
| `window_start` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `cubicle_selector`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `cubicle_name` | `text` |  |
| `cubicle_order` | `int8` | Nullable |

## Table `cubicle_selector_cubicle`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `cubicle_selector_id` | `int8` |  |
| `cubicle_id` | `int8` |  |

## Table `user_cubicles`

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `int8` | Primary |
| `cubicle_id` | `int8` | Primary |

## Table `user_services`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `service` | `text` |  |

## Table `user_rooms`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `service` | `text` |  |
| `subcategory` | `text` | Nullable |
| `room` | `int4` |  |

## Table `user_counters`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `counter` | `int4` |  |

---

## RLS Policies

### `services`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Enable read access for all users` | SELECT | public | PERMISSIVE | `true` | — |
| `Allow anon deletion on services` | DELETE | anon | PERMISSIVE | `true` | — |
| `Allow anon insert on services` | INSERT | anon | PERMISSIVE | — | `true` |
| `Allow public read on services` | SELECT | anon | PERMISSIVE | `true` | — |

_⚠️ Still unconditioned/public-writable as of this pull — the fix in `CHANGES_NEEDED.md` step 3 does not appear applied here._

### `patient_category`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read` | SELECT | public | PERMISSIVE | `true` | — |

### `app_settings`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Authenticated users can read app_settings` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Superadmin can insert app_settings` | INSERT | authenticated | PERMISSIVE | — | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |
| `Superadmin can update app_settings` | UPDATE | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` | `(EXISTS ( SELECT 1 FROM users WHERE ((users.auth_id = auth.uid()) AND (users.role = 'superadmin'::text))))` |

### `doctors`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Authenticated users can read doctors` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Authenticated users can delete doctors` | DELETE | authenticated | PERMISSIVE | `true` | — |
| `Authenticated users can insert doctors` | INSERT | authenticated | PERMISSIVE | — | `true` |
| `Authenticated users can update doctors` | UPDATE | authenticated | PERMISSIVE | `true` | `true` |

_⚠️ Previously documented as superadmin-gated (`EXISTS ... role = 'superadmin'`); this pull shows plain `true`/`authenticated`-only checks — any authenticated user can now write. Flagging for confirmation._

### `cubicle`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Authenticated users can read cubicle` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Allow public read access` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |
| `Authenticated users can update cubicle` | UPDATE | authenticated | PERMISSIVE | `true` | `true` |
| `Allow authenticated read` | SELECT | authenticated | PERMISSIVE | `true` | — |

_Still no INSERT/DELETE policy — both fully blocked under RLS by default. Also has 3 overlapping SELECT policies (duplicate cleanup candidate, same pattern as the old `patients` issue)._

### `cubicle_selector`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read access` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |

### `cubicle_selector_cubicle`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read` | SELECT | public | PERMISSIVE | `true` | — |

### `user_cubicles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `user_cubicles_select_self_or_superadmin` | SELECT | authenticated | PERMISSIVE | `((user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid()))) OR is_superadmin())` | — |
| `user_cubicles_write_superadmin` | ALL | authenticated | PERMISSIVE | `is_superadmin()` | `is_superadmin()` |

_Correctly designed — self-read-or-superadmin pattern, superadmin-only writes._

### `users`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Enable read access for all users` | SELECT | public | PERMISSIVE | `true` | — |

_⚠️ Public account-data leak still present — the `CHANGES_NEEDED.md` step 4 fix does not appear applied here._

### `patients`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow insert for all` | INSERT | public | PERMISSIVE | — | `true` |
| `Allow public insert` | INSERT | anon | PERMISSIVE | — | `true` |
| `Allow public insert on patients` | INSERT | anon | PERMISSIVE | — | `true` |
| `Allow public read` | SELECT | anon | PERMISSIVE | `true` | — |
| `Allow public read on patients` | SELECT | anon | PERMISSIVE | `true` | — |
| `patients_select_nurse_scoped` | SELECT | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` | — |
| `patients_update_nurse_scoped` | UPDATE | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` |
| `patients_select_registration_full` | SELECT | authenticated | PERMISSIVE | `is_registration_staff()` | — |
| `patients_update_registration_full` | UPDATE | authenticated | PERMISSIVE | `is_registration_staff()` | `is_registration_staff()` |

_⚠️ Old wide-open `anon`/`public` policies (unconditioned INSERT/SELECT) are still present alongside the new `is_clinical_staff()`/`is_registration_staff()`/`my_cubicle_nums()` scoped policies — the earlier `is_historical`-based fix set (`patients_select_public_live`, `patients_insert_kiosk`, `patients_update_staff_live_only`, `patients_delete_superadmin_live_only`) does not appear in this pull at all, and no DELETE policy exists here. This table's access model has clearly evolved past what `SECURITY.md`/`CHANGES_NEEDED.md` describe — needs a fresh audit, not a patch of the old doc's language. `is_clinical_staff()`, `is_registration_staff()`, and `my_cubicle_nums()` are not yet documented anywhere as helper functions._

### `user_services`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own service assignments` | SELECT | public | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

### `user_rooms`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own room assignments` | SELECT | public | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

### `user_counters`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own counter assignments` | SELECT | public | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

_`user_services`/`user_rooms`/`user_counters` have SELECT-only self-read policies — no INSERT/UPDATE/DELETE policy on any of the three, meaning writes are fully blocked under RLS (service-role-only), same pattern as `cubicle`._

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