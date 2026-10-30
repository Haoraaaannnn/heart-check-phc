# Supabase Database Migrations Directory

**Last Updated:** 2026-10-21

This directory stores manual and schema migration scripts for the PostgreSQL database running on Supabase for **Heart Check PHC**.

---

## Migration Index

| Migration Script | Target Database | Description | Applied Status |
| :--- | :--- | :--- | :---: |
| [repair_encrypted_phone_storage.sql](./repair_encrypted_phone_storage.sql) | Supabase PostgreSQL | Converts contacts to text and removes the bigint phone cast while preserving the live ticket function and its permissions. Apply after older phone/prefix migrations. | Pending |
| [restore_idle_numbers.sql](./restore_idle_numbers.sql) | Supabase PostgreSQL | Removes shift cancellation and rollover enforcement when restoring the recoverable idle workflow. Preserves patient records and counter transfers. | Pending |
| [shift_queue_rotation.sql](./shift_queue_rotation.sql) | Supabase PostgreSQL | Adds Manila shift rotation tracking, a guarded reset routine, and cancellation on the sixth rotation while retaining records. Requires station_breaks.sql. | Pending |
| [shared_counter_transfers.sql](./shared_counter_transfers.sql) | Supabase PostgreSQL | Adds authorized handoffs to open, staffed counters with service eligibility and historical-record protection. | Pending |
| [`docs/migrations/encrypt_phone_number.sql`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/migrations/encrypt_phone_number.sql) | Supabase PostgreSQL | Converts `patients.phoneNum` from `bigint` (`int8`) to `text` and updates the `create_patient` stored procedure signature to accept encrypted AES-256-GCM ciphertext strings (`enc:v1:...`). | Production Ready |
| [`docs/migrations/20261021_add_dashboard_performance_indexes.sql`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/migrations/20261021_add_dashboard_performance_indexes.sql) | Supabase PostgreSQL | Adds production performance indexes verified against live PostgreSQL schema with double-quoted camelCase columns (`"cubicleNum"`, `"patientNum"`, `"doctorId"`), eliminating sequential scans on 26,000+ historical rows. | Applied |
| [`docs/migrations/fix_queue_prefix_generation.sql`](file:///home/jensen/Github-Repositories/heart-check-phc/docs/migrations/fix_queue_prefix_generation.sql) | Supabase PostgreSQL | Fixes `create_patient` stored procedure to dynamically handle multi-character queue prefixes (e.g. `67`, `10`, `LAB`), prevent integer overflow, respect `services.queue_pad_length`, and eliminate numeric shift truncation. | Applied |

---

## How to Apply Migrations

To apply any SQL script in this directory:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your Heart Check PHC project instance.
3. In the left navigation, click on **SQL Editor**.
4. Click **New Query**, paste the contents of the target migration file, and click **Run**.
5. Verify column schema updates in the **Table Editor** (`patients`) and function signatures in **Database** > **Functions** (`create_patient`).
