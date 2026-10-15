# Heart Check PHC: A Kiosk-Based Queue Management and Analytics System — Raw Schema Reference

This is a literal reference dump of the verified database schema and active Row-Level Security (RLS) policies. For architectural context, rationale, and key gotchas, see [DATABASE_SCHEMA.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/DATABASE_SCHEMA.md) and [SECURITY.md](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/specifications/SECURITY.md).

**Schema Status:** Fully reconciled and active against live PostgreSQL Supabase database instance (Last updated: 2026-10-16).

---

## Table `services`

### Columns

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

### Columns

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

### Columns

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
| `reg_end` | `timestamptz` | Nullable |
| `consult_start` | `timestamptz` | Nullable |
| `consult_end` | `timestamptz` | Nullable |
| `reg_start` | `timestamptz` | Nullable |
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

### Columns

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

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `label_en` | `text` | Nullable |
| `label_fil` | `text` | Nullable |
| `icon_src` | `text` | Nullable |
| `order` | `int8` | Nullable |
| `type` | `text` | Nullable |

## Table `app_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `key` | `text` | Primary |
| `value` | `text` |  |
| `updated_at` | `timestamptz` | Nullable |

## Table `doctors`

### Columns

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

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `email` | `text` | Primary |
| `attempt_count` | `int4` |  |
| `locked_until` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

## Table `cubicle_selector`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `cubicle_name` | `text` |  |
| `cubicle_order` | `int8` | Nullable |

## Table `cubicle_selector_cubicle`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `cubicle_selector_id` | `int8` |  |
| `cubicle_id` | `int8` |  |

## Table `user_cubicles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `int8` | Primary |
| `cubicle_id` | `int8` | Primary |

## Table `user_services`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `service` | `text` |  |

## Table `user_rooms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `service` | `text` |  |
| `subcategory` | `text` | Nullable |
| `room` | `int4` |  |

## Table `user_counters`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `int8` |  |
| `counter` | `int4` |  |

## Table `password_reset_attempts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `email` | `text` | Primary |
| `request_count` | `int4` |  |
| `window_start` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `counters`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `counter_number` | `int4` | Primary |
| `label` | `text` | Nullable |
| `active` | `bool` |  |
| `created_at` | `timestamptz` |  |

---

## RLS Policies

### `user_services`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own service assignments` | SELECT | authenticated | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

### `user_rooms`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own room assignments` | SELECT | authenticated | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

### `user_counters`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Users can read their own counter assignments` | SELECT | authenticated | PERMISSIVE | `(user_id = ( SELECT users.id FROM users WHERE (users.auth_id = auth.uid())))` | — |

### `services`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Enable read access for all users` | SELECT | public | PERMISSIVE | `true` | — |
| `services_insert_superadmin` | INSERT | authenticated | PERMISSIVE | — | `( SELECT is_superadmin() AS is_superadmin)` |
| `services_update_superadmin` | UPDATE | authenticated | PERMISSIVE | `( SELECT is_superadmin() AS is_superadmin)` | `( SELECT is_superadmin() AS is_superadmin)` |
| `services_delete_superadmin` | DELETE | authenticated | PERMISSIVE | `( SELECT is_superadmin() AS is_superadmin)` | — |

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
| `doctors_delete_managers` | DELETE | authenticated | PERMISSIVE | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` | — |
| `doctors_update_managers` | UPDATE | authenticated | PERMISSIVE | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` |
| `doctors_insert_managers` | INSERT | authenticated | PERMISSIVE | — | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` |

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

### `cubicle`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read access` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |
| `cubicle_update_doctor_assignment` | UPDATE | authenticated | PERMISSIVE | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` | `(( SELECT is_registration_staff() AS is_registration_staff) OR ( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin))` |

### `patients`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `patients_select_nurse_scoped` | SELECT | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` | — |
| `patients_update_nurse_scoped` | UPDATE | authenticated | PERMISSIVE | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` | `(is_clinical_staff() AND ("cubicleNum" = ANY (my_cubicle_nums())))` |
| `patients_select_registration_full` | SELECT | authenticated | PERMISSIVE | `is_registration_staff()` | — |
| `patients_update_registration_full` | UPDATE | authenticated | PERMISSIVE | `is_registration_staff()` | `is_registration_staff()` |
| `patients_select_public_live` | SELECT | anon | PERMISSIVE | `((is_historical = false) AND (created_at >= (date_trunc('day'::text, (now() AT TIME ZONE 'Asia/Manila'::text)) AT TIME ZONE 'Asia/Manila'::text)))` | — |
| `patients_select_admin` | SELECT | authenticated | PERMISSIVE | `( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin)` | — |
| `patients_update_admin` | UPDATE | authenticated | PERMISSIVE | `( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin)` | `( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin)` |
| `patients_insert_admin` | INSERT | authenticated | PERMISSIVE | — | `( SELECT is_admin_or_superadmin() AS is_admin_or_superadmin)` |
| `patients_insert_registration` | INSERT | authenticated | PERMISSIVE | — | `( SELECT is_registration_staff() AS is_registration_staff)` |
| `patients_no_historical_insert` | INSERT | anon, authenticated | RESTRICTIVE | — | `(is_historical = false)` |
| `patients_no_historical_update` | UPDATE | anon, authenticated | RESTRICTIVE | `(is_historical = false)` | `(is_historical = false)` |
| `patients_no_historical_delete` | DELETE | anon, authenticated | RESTRICTIVE | `(is_historical = false)` | — |

### `counters`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `counters readable` | SELECT | anon, authenticated | PERMISSIVE | `true` | — |

### `users`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `users_select_self` | SELECT | authenticated | PERMISSIVE | `((auth_id = auth.uid()) OR (lower(email) = lower((auth.jwt() ->> 'email'::text))))` | — |
| `users_select_superadmin` | SELECT | authenticated | PERMISSIVE | `( SELECT is_superadmin() AS is_superadmin)` | — |

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