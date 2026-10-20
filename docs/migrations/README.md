# Supabase Database Migrations Directory

**Last Updated:** 2026-10-21

This directory stores manual and schema migration scripts for the PostgreSQL database running on Supabase for **Heart Check PHC**.

---

## Migration Index

| Migration Script | Target Database | Description | Applied Status |
| :--- | :--- | :--- | :---: |
| [`docs/migrations/encrypt_phone_number.sql`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/encrypt_phone_number.sql) | Supabase PostgreSQL | Converts `patients.phoneNum` from `bigint` (`int8`) to `text` and updates the `create_patient` stored procedure signature to accept encrypted AES-256-GCM ciphertext strings (`enc:v1:...`). | Production Ready |
| [`docs/migrations/20261021_add_dashboard_performance_indexes.sql`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/docs/migrations/20261021_add_dashboard_performance_indexes.sql) | Supabase PostgreSQL | Adds production performance indexes verified against live PostgreSQL schema with double-quoted camelCase columns (`"cubicleNum"`, `"patientNum"`, `"doctorId"`), eliminating sequential scans on 26,000+ historical rows. | Production Ready |

---

## How to Apply Migrations

To apply any SQL script in this directory:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your Heart Check PHC project instance.
3. In the left navigation, click on **SQL Editor**.
4. Click **New Query**, paste the contents of the target migration file, and click **Run**.
5. Verify column schema updates in the **Table Editor** (`patients`) and function signatures in **Database** > **Functions** (`create_patient`).
